// The report header: what this is, what it covers, and how complete it is.
//
// Kernel-owned, because a prescriber must be able to trust that the framing of
// the record was not written by whichever module had most to say. The kernel
// knows the range and the coverage. It does not know that a prescription has a
// name, so the naming is offered by a section through `frame`.
//
// Coverage goes at the top, next to the dates, rather than in a footnote. A
// record that covers 12 of 30 days is still worth reading; it is not worth
// reading as though it covered 30.

import { formatLongDate, formatShortDate } from '../dates/index';
import { logoMarkup } from '../ui/logo';
import { escapeHtml } from './html';
import type { ReportContext, ReportDefinition } from './types';

export interface HeaderParts {
  title: string;
  /** Existing wording, moved up. See `headerHtml`. */
  provenance?: string;
  /** What the record is about, when a module named it. */
  subject?: string;
  /** The dates, the coverage, and anything a section added. */
  line: string;
  /** Shown only when the record is patchy enough to change how it reads. */
  caveat?: string;
}

/** Below this, the gaps are a fact about the record, not a detail. */
const PATCHY_BELOW = 70;

export function headerParts(
  context: ReportContext,
  definition: ReportDefinition,
  subject: string | undefined,
  extras: readonly string[],
): HeaderParts {
  const { range, coverage } = context;

  const since =
    range.sinceAppointment !== undefined
      ? ` (since the appointment on ${formatShortDate(range.sinceAppointment)})`
      : '';

  const line =
    `${formatLongDate(range.from)} to ${formatLongDate(range.to)}${since}` +
    ` · ${coverage.logged} of ${coverage.ofDays} days logged (${coverage.percent}%)` +
    extras.map((extra) => `, ${extra}`).join('');

  const parts: HeaderParts = { title: definition.title, line };
  if (subject !== undefined && subject !== '') parts.subject = subject;

  const missing = coverage.ofDays - coverage.logged;
  if (coverage.percent < PATCHY_BELOW && missing > 0) {
    parts.caveat =
      `Note: ${missing} ${missing === 1 ? 'day' : 'days'} in this range have no entry, ` +
      'so the figures below rest on a partial record.';
  }
  return parts;
}

/**
 * A letterhead, not a bare heading.
 *
 * A clinician is handed a sheet of paper. Before this, that sheet opened
 * straight into "Daily record" and a line of dates: nothing said what the
 * document was, what produced it, or that it is self-report — the app's name
 * appeared exactly once, in the last paragraph on the page. Somebody reading
 * top to bottom met every figure before they met the caveat.
 *
 * So the mark and the name go at the top, and the provenance line moves up to
 * sit with them. **Not one word of it changes**: `RECORD_LEGEND` and the
 * generated line are reviewed clinician-facing wording, and CLAUDE.md makes
 * rewriting that a stop-and-ask. This moves where a reviewed sentence sits; it
 * does not write a new one.
 */
export function headerHtml(parts: HeaderParts): string {
  const subject = parts.subject === undefined ? '' : `<b>${escapeHtml(parts.subject)}</b> · `;
  return (
    '<header class="sheet-head">' +
    `<div class="sheet-brand">${logoMarkup('-sheet', 'sheet-mark')}` +
    '<span class="sheet-app">Adnotia</span></div>' +
    `<h2>${escapeHtml(parts.title)}</h2>` +
    `<p class="meta">${subject}${escapeHtml(parts.line)}</p>` +
    (parts.provenance === undefined
      ? ''
      : `<p class="sheet-provenance">${escapeHtml(parts.provenance)}</p>`) +
    (parts.caveat === undefined
      ? ''
      : `<p class="meta warn-note">${escapeHtml(parts.caveat)}</p>`) +
    '</header>'
  );
}

export function headerText(parts: HeaderParts): string[] {
  const subject = parts.subject === undefined ? '' : `${parts.subject} · `;
  const lines = [parts.title, '='.repeat(parts.title.length), subject + parts.line];
  if (parts.provenance !== undefined) lines.push(parts.provenance);
  if (parts.caveat !== undefined) lines.push(parts.caveat);
  return lines;
}
