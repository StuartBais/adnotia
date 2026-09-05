// Side effects across the range.
//
// Which ones were reported, on how many days, and how badly. It states its own
// coverage and reaches no conclusion. The severity ramp exists to shade the
// grid, and is never shown to anyone as a score.
//
// The monolith draws this as an SVG grid. That version arrives with the report
// engine, which owns shared visuals; this is the same data as a table, which is
// what the text export needs anyway.

import {
  chartNote,
  escapeHtml,
  formatShortDate,
  severityGrid,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
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

// ------------------------------------------------------------ the grid
//
// The same data as the table, as a shape. A prescriber reads the clustering off
// this in a second: whether something ran all the way through or arrived when the
// dose went up. The kernel draws it; this only says what goes in each cell.
//
// The severity ramp shades the grid and is never shown to anyone as a score.

/** Below this the grid is a handful of squares and the table says more. */
const MIN_DAYS = 4;
/** More rows than this and the labels stop being readable. */
const MAX_ROWS = 8;

const SEVERITY_CLASS = ['sev0', 'sev1', 'sev2', 'sev3'];

export interface SideEffectGrid {
  rowLabels: string[];
  cells: string[][];
  first: IsoDate;
  last: IsoDate;
}

/** Everything reported on a day, including appetite and heart when not normal. */
function reportedOn(day: MedicationDay | undefined): string[] {
  if (day === undefined) return [];
  const items = [...(day.side ?? [])];
  if ((day.appetite ?? '') !== '' && day.appetite !== 'normal') items.push(day.appetite as string);
  if ((day.heart ?? '') !== '' && day.heart !== 'fine') items.push(day.heart as string);
  return items;
}

export function grid(context: SideEffectsContext): SideEffectGrid | undefined {
  const first = context.dates[0];
  const last = context.dates[context.dates.length - 1];
  if (first === undefined || last === undefined || context.dates.length < MIN_DAYS)
    return undefined;

  const counts = new Map<string, number>();
  for (const date of context.dates) {
    for (const key of reportedOn(context.days[date])) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return undefined;

  const keys = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ROWS)
    .map(([key]) => key);

  return {
    rowLabels: keys.map((key) => LABELS.get(key) ?? key),
    cells: keys.map((key) =>
      context.dates.map((date) => {
        const day = context.days[date];
        if (!reportedOn(day).includes(key)) return 'cellblank';
        return SEVERITY_CLASS[SEVERITY_RANK[day?.detail?.[key]?.sev ?? ''] ?? 0] ?? 'sev0';
      }),
    ),
    first,
    last,
  };
}

const GRID_LEGEND =
  'One column per day. Darker means more severe; the palest shade is a day it was ' +
  'reported without a severity rating.';

// ------------------------------------------------- first half against second
//
// Whether something settled or stayed is the question a titration conversation
// turns on, and it is the one thing a total for the whole range cannot answer.
//
// The monolith labelled each effect new, gone, easing, worsening or steady, from
// a composite of frequency and severity it never showed. That label is not ported:
// a number the app computes, hides, and turns into a word a clinician reads is
// the hidden scoring hard rule 4 forbids, and its thresholds were arbitrary. The
// counts are shown instead, and the direction is left to the person reading them.
// See docs/decisions/ADR-017-what-the-report-will-not-say.md.

/** Fewer days than this and the halves are too short to say anything. */
const MIN_FOR_HALVES = 6;

export interface HalfReport {
  /** Days it was reported in this half. */
  days: number;
  /**
   * Days in the half with any medication record at all. Not calendar days: a
   * half that was only half filled in would otherwise read as an effect that
   * went away, when what went away was the logging.
   */
  ofDays: number;
  /** The severity actually rated, in the person's own vocabulary. */
  severity: string;
}

export interface TrajectoryRow {
  label: string;
  early: HalfReport;
  late: HalfReport;
}

export interface Trajectory {
  rows: TrajectoryRow[];
  earlyFrom: IsoDate;
  earlyTo: IsoDate;
  lateFrom: IsoDate;
  lateTo: IsoDate;
}

/** The mean of the severities actually rated, as a word. Never shown as a number. */
function severityWord(ranks: number[]): string {
  if (ranks.length === 0) return 'unrated';
  const mean = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  return mean < 1.5 ? 'mild' : mean < 2.5 ? 'moderate' : 'severe';
}

export function trajectory(context: SideEffectsContext): Trajectory | undefined {
  const dates = context.dates;
  if (dates.length < MIN_FOR_HALVES) return undefined;

  // Split so that every day lands in one half or the other. Taking the same
  // count from each end, as the monolith does, drops the middle day of an
  // odd-length range from the comparison without saying so.
  const half = Math.floor(dates.length / 2);
  const early = dates.slice(0, half);
  const late = dates.slice(half);

  const keys: string[] = [];
  const seen = new Set<string>();
  for (const date of dates) {
    for (const key of reportedOn(context.days[date])) {
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  if (keys.length === 0) return undefined;

  const summarise = (key: string, span: readonly IsoDate[]): HalfReport => {
    const ranks: number[] = [];
    let days = 0;
    let recorded = 0;
    for (const date of span) {
      const day = context.days[date];
      if (day === undefined) continue;
      recorded++;
      if (!reportedOn(day).includes(key)) continue;
      days++;
      const rank = SEVERITY_RANK[day.detail?.[key]?.sev ?? ''];
      if (rank !== undefined) ranks.push(rank);
    }
    return { days, ofDays: recorded, severity: severityWord(ranks) };
  };

  const rows = keys
    .map((key) => ({
      label: LABELS.get(key) ?? key,
      early: summarise(key, early),
      late: summarise(key, late),
    }))
    .sort((a, b) => b.early.days + b.late.days - (a.early.days + a.late.days));

  return {
    rows,
    earlyFrom: early[0] as IsoDate,
    earlyTo: early[early.length - 1] as IsoDate,
    lateFrom: late[0] as IsoDate,
    lateTo: late[late.length - 1] as IsoDate,
  };
}

/** "3 of 15 days, mild", or "none". */
export function halfText(half: HalfReport): string {
  return half.days === 0 ? 'none' : `${half.days} of ${half.ofDays} days, ${half.severity}`;
}

const TRAJECTORY_LEGEND =
  'The range split in two. Severity is the average of the days it was rated, in the ' +
  'words the person chose.';

export const sideEffectsSection: ReportSection = {
  report: 'clinical',
  id: 'medication.side',
  title: () => 'Side effects over time',
  weight: 60,

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

    const shape = grid(context as SideEffectsContext);
    const picture =
      shape === undefined
        ? ''
        : severityGrid({
            rowLabels: shape.rowLabels,
            cells: shape.cells,
            startLabel: formatShortDate(shape.first),
            endLabel: formatShortDate(shape.last),
            title: 'Grid of side effects by day, shaded by severity',
            legend: GRID_LEGEND,
          });

    return (
      '<h3>Side effects over time</h3>' +
      `<p class="meta">${summary.daysRecorded} of ${summary.ofDays} days recorded.</p>` +
      picture +
      '<div class="scroll"><table><thead><tr>' +
      '<th>Reported</th><th>Days</th><th>Worst rated</th><th>Moderate or worse</th>' +
      `</tr></thead><tbody>${rows}</tbody></table></div>` +
      halvesHtml(context as SideEffectsContext)
    );
  },

  renderText: (context) => {
    const summary = summarise(context as SideEffectsContext);
    return [
      'Side effects over time',
      '----------------------',
      `${summary.daysRecorded} of ${summary.ofDays} days recorded.`,
      ...(grid(context as SideEffectsContext) === undefined
        ? []
        : [chartNote('severity grid'), GRID_LEGEND]),
      'Reported | Days | Worst rated | Moderate or worse',
      ...summary.rows.map(
        (row) =>
          `${row.label} | ${row.days} of ${summary.daysRecorded} | ${row.worst} | ${row.moderateOrWorse}`,
      ),
      ...halvesText(context as SideEffectsContext),
    ].join('\n');
  },
};

function halvesHtml(context: SideEffectsContext): string {
  const halves = trajectory(context);
  if (halves === undefined) return '';

  const rows = halves.rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td>` +
        `<td>${escapeHtml(halfText(row.early))}</td>` +
        `<td>${escapeHtml(halfText(row.late))}</td></tr>`,
    )
    .join('');

  return (
    '<div class="scroll"><table><thead><tr><th>Effect</th>' +
    `<th>First half (${escapeHtml(formatShortDate(halves.earlyFrom))}–${escapeHtml(formatShortDate(halves.earlyTo))})</th>` +
    `<th>Second half (${escapeHtml(formatShortDate(halves.lateFrom))}–${escapeHtml(formatShortDate(halves.lateTo))})</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="legend">${escapeHtml(TRAJECTORY_LEGEND)}</p>`
  );
}

function halvesText(context: SideEffectsContext): string[] {
  const halves = trajectory(context);
  if (halves === undefined) return [];

  return [
    '',
    `Effect | First half (${formatShortDate(halves.earlyFrom)}–${formatShortDate(halves.earlyTo)})` +
      ` | Second half (${formatShortDate(halves.lateFrom)}–${formatShortDate(halves.lateTo)})`,
    ...halves.rows.map((row) => `${row.label} | ${halfText(row.early)} | ${halfText(row.late)}`),
    TRAJECTORY_LEGEND,
  ];
}
