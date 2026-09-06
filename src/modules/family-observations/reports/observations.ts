// The page to take to the appointment.
//
// Dated entries grouped by setting, and a coverage line. docs/04-family-space.md:
// "The log prints as a dated list for the appointment, with a coverage line
// ('14 entries across 6 weeks, from home and school') and the same
// record-quality footer the adult report uses."
//
// The footer comes free: it is the kernel's, and it is the same one, which is
// the point of it being the kernel's.

import {
  escapeHtml,
  formatShortDate,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
import { REPORT_STRINGS, WHERE_LABELS } from '../strings';
import {
  allEntries,
  coverage,
  describe,
  settingsPhrase,
  type DatedObservation,
  type ObservationsSlice,
} from '../entries';

export interface ObservationsContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, unknown>>;
  slice?: ObservationsSlice;
}

/** Grouped by setting, each group oldest first. */
export function bySetting(
  entries: readonly DatedObservation[],
): { label: string; entries: DatedObservation[] }[] {
  const groups = new Map<string, DatedObservation[]>();
  for (const entry of entries) {
    const label = WHERE_LABELS.get(entry.where) ?? entry.where;
    groups.set(label, [...(groups.get(label) ?? []), entry]);
  }
  return (
    [...groups.entries()]
      .map(([label, list]) => ({
        label,
        entries: [...list].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      // Most-written-about first: a fact about the record, not a claim that one
      // setting matters more than another.
      .sort((a, b) => b.entries.length - a.entries.length)
  );
}

function inRange(context: ObservationsContext): DatedObservation[] {
  const dates = new Set(context.dates);
  return allEntries(context.slice).filter((entry) => dates.has(entry.date));
}

export const observationsSection: ReportSection = {
  report: 'observations',
  id: 'family-observations.entries',
  weight: 10,
  title: () => REPORT_STRINGS.title,

  when: (context) => inRange(context as ObservationsContext).length > 0,

  render: (context) => {
    const entries = inRange(context as ObservationsContext);
    if (entries.length === 0) return '';
    const cover = coverage(entries);

    const groups = bySetting(entries)
      .map(
        (group) =>
          `<h4>${escapeHtml(group.label)}</h4>` +
          group.entries
            .map(
              (entry) =>
                `<p class="noteline"><b>${escapeHtml(formatShortDate(entry.date))}</b> ` +
                `${describe(entry).map(escapeHtml).join('<br>')}</p>`,
            )
            .join(''),
      )
      .join('');

    return (
      `<h3>${escapeHtml(REPORT_STRINGS.title)}</h3>` +
      `<p class="meta">${escapeHtml(
        REPORT_STRINGS.coverage(cover.entries, cover.weeks, settingsPhrase(cover.settings)),
      )}</p>` +
      groups +
      `<p class="legend">${escapeHtml(REPORT_STRINGS.legend)}</p>`
    );
  },

  renderText: (context) => {
    const entries = inRange(context as ObservationsContext);
    if (entries.length === 0) return '';
    const cover = coverage(entries);

    const out = [
      REPORT_STRINGS.title,
      '-'.repeat(REPORT_STRINGS.title.length),
      REPORT_STRINGS.coverage(cover.entries, cover.weeks, settingsPhrase(cover.settings)),
    ];
    for (const group of bySetting(entries)) {
      out.push('', `${group.label}:`);
      for (const entry of group.entries) {
        out.push(`${formatShortDate(entry.date)} ${describe(entry).join(' — ')}`);
      }
    }
    out.push('', REPORT_STRINGS.legend);
    return out.join('\n');
  },
};
