// The page to take to a first appointment.
//
// Dated examples, grouped by where they happened, then what the person has found
// about their own childhood. A coverage line describing the record, and nothing
// that reads as a conclusion drawn from it.
//
// docs/decisions/ADR-024: this never says whether an assessment is worth seeking.
// It makes the appointment worth having.

import {
  escapeHtml,
  formatShortDate,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
import { LABELS, REPORT_STRINGS } from '../strings';
import {
  allEntries,
  coverage,
  describe,
  settingsPhrase,
  type DatedEntry,
  type PreparationSlice,
} from '../entries';

export interface PreparationContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, unknown>>;
  slice?: PreparationSlice;
}

/** Entries grouped by setting, each group oldest first, as a story reads. */
export function bySetting(
  entries: readonly DatedEntry[],
): { label: string; entries: DatedEntry[] }[] {
  const groups = new Map<string, DatedEntry[]>();
  for (const entry of entries) {
    const label = LABELS.get(entry.where) ?? entry.where;
    groups.set(label, [...(groups.get(label) ?? []), entry]);
  }
  return (
    [...groups.entries()]
      .map(([label, list]) => ({
        label,
        entries: [...list].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      // Most-written-about first, which is a fact about the record, not a ranking
      // of the settings or a claim that one matters more.
      .sort((a, b) => b.entries.length - a.entries.length)
  );
}

function inRange(context: PreparationContext): DatedEntry[] {
  const dates = new Set(context.dates);
  return allEntries(context.slice).filter((entry) => dates.has(entry.date));
}

function entryHtml(entry: DatedEntry): string {
  const lines = describe(entry)
    .map((line) => escapeHtml(line))
    .join('<br>');
  return `<p class="noteline"><b>${escapeHtml(formatShortDate(entry.date))}</b> ${lines}</p>`;
}

export const entriesSection: ReportSection = {
  report: 'preparation',
  id: 'preparation.entries',
  weight: 10,
  title: () => REPORT_STRINGS.title,

  when: (context) => inRange(context as PreparationContext).length > 0,

  render: (context) => {
    const entries = inRange(context as PreparationContext);
    if (entries.length === 0) return '';
    const cover = coverage(entries);

    const groups = bySetting(entries)
      .map((group) => `<h4>${escapeHtml(group.label)}</h4>` + group.entries.map(entryHtml).join(''))
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
    const entries = inRange(context as PreparationContext);
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

export const childhoodSection: ReportSection = {
  report: 'preparation',
  id: 'preparation.childhood',
  weight: 20,
  title: () => REPORT_STRINGS.childhoodHeading,

  when: (context) => ((context as PreparationContext).slice?.childhood ?? '').trim() !== '',

  render: (context) => {
    const note = ((context as PreparationContext).slice?.childhood ?? '').trim();
    if (note === '') return '';
    return (
      `<h3>${escapeHtml(REPORT_STRINGS.childhoodHeading)}</h3>` +
      `<p class="noteline">${escapeHtml(note)}</p>`
    );
  },

  renderText: (context) => {
    const note = ((context as PreparationContext).slice?.childhood ?? '').trim();
    if (note === '') return '';
    return [
      REPORT_STRINGS.childhoodHeading,
      '-'.repeat(REPORT_STRINGS.childhoodHeading.length),
      note,
    ].join('\n');
  },
};
