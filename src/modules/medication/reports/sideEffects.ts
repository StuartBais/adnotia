// Side effects across the range.
//
// Which ones were reported, on how many days, and how badly. It states its own
// coverage and reaches no conclusion. The severity ramp exists to shade the
// grid, and is never shown to anyone as a score.
//
// The monolith draws this as an SVG grid. That version arrives with the report
// engine, which owns shared visuals; this is the same data as a table, which is
// what the text export needs anyway.

import { escapeHtml, type IsoDate, type ReportSection } from '../../../kernel/index';
import { LABELS, SEVERITY_RANK } from '../strings';
import type { MedicationDay } from '../records';

export interface SideEffectsContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, MedicationDay>>;
}

export interface SideEffectRow {
  label: string;
  /** Days it was reported. */
  days: number;
  /** The worst severity recorded, in the person's own words. */
  worst: string;
  /** Days it was rated moderate or worse. */
  moderateOrWorse: number;
}

export interface SideEffectsSummary {
  rows: SideEffectRow[];
  /** Days with any medication record at all. */
  daysRecorded: number;
  ofDays: number;
}

export function summarise(context: SideEffectsContext): SideEffectsSummary {
  const counts = new Map<string, { days: number; worst: number; moderateOrWorse: number }>();
  let daysRecorded = 0;

  for (const date of context.dates) {
    const day = context.days[date];
    if (day === undefined) continue;
    daysRecorded++;

    for (const key of day.side ?? []) {
      const label = LABELS.get(key) ?? key;
      const rank = SEVERITY_RANK[day.detail?.[key]?.sev ?? ''] ?? 0;
      const held = counts.get(label) ?? { days: 0, worst: 0, moderateOrWorse: 0 };
      held.days++;
      held.worst = Math.max(held.worst, rank);
      if (rank >= 2) held.moderateOrWorse++;
      counts.set(label, held);
    }
  }

  const word = ['not rated', 'mild', 'moderate', 'severe'];

  return {
    daysRecorded,
    ofDays: context.dates.length,
    rows: [...counts.entries()]
      .sort((a, b) => b[1].days - a[1].days)
      .map(([label, held]) => ({
        label,
        days: held.days,
        worst: word[held.worst] ?? 'not rated',
        moderateOrWorse: held.moderateOrWorse,
      })),
  };
}

export const sideEffectsSection: ReportSection = {
  report: 'clinical',
  id: 'medication.side',
  title: () => 'Side effects',
  weight: 50,

  when: (context) => summarise(context as SideEffectsContext).rows.length > 0,

  render: (context) => {
    const summary = summarise(context as SideEffectsContext);
    const rows = summary.rows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td>` +
          `<td class="num">${row.days} of ${summary.daysRecorded}</td>` +
          `<td>${escapeHtml(row.worst)}</td>` +
          `<td class="num">${row.moderateOrWorse}</td></tr>`,
      )
      .join('');

    return (
      '<h3>Side effects</h3>' +
      `<p class="meta">${summary.daysRecorded} of ${summary.ofDays} days recorded.</p>` +
      '<div class="scroll"><table><thead><tr>' +
      '<th>Reported</th><th>Days</th><th>Worst rated</th><th>Moderate or worse</th>' +
      `</tr></thead><tbody>${rows}</tbody></table></div>`
    );
  },

  renderText: (context) => {
    const summary = summarise(context as SideEffectsContext);
    return [
      'Side effects',
      '------------',
      `${summary.daysRecorded} of ${summary.ofDays} days recorded.`,
      'Reported | Days | Worst rated | Moderate or worse',
      ...summary.rows.map(
        (row) =>
          `${row.label} | ${row.days} of ${summary.daysRecorded} | ${row.worst} | ${row.moderateOrWorse}`,
      ),
    ].join('\n');
  },
};
