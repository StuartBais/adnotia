// "Where things stand": the four things a prescriber weighs, side by side.
//
// Efficacy, duration, tolerability and adherence, and then it stops. The
// prescriber weighs them; that is their job and this does not pretend to do it.
// The words should, increase, decrease and recommend do not appear here, and the
// person sees every one of these numbers before the clinician does.
//
// Ported from the monolith's verdictBlock, which reference/README.md lists among
// the things not to reimplement from scratch.

import {
  averageClock,
  formatClockTime,
  formatDuration,
  fromMinutes,
  escapeHtml,
  spanMinutes,
  type FrameContribution,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
import { LABELS, SEVERITY_RANK } from '../strings';
import type { MedicationDay } from '../records';
import { doseLabel, groupByDose } from './doses';

export interface StandingContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, MedicationDay>>;
  /**
   * Days of the modules this one declares as dependencies, when they are on.
   * Sleep is the only one, and it is optional: without it the section says less
   * rather than guessing at how long the person was awake.
   */
  moduleDays?: Readonly<Record<string, Readonly<Record<IsoDate, { bed?: string; wake?: string }>>>>;
  /** The person's own before-medication baseline, from the kernel. */
  baseline?: { focus?: number | null; mood?: number | null };
  /** Their own overall word for how things compare. */
  overall?: string;
}

export interface Standing {
  label: string;
  days: number;
  focus?: string;
  mood?: string;
  baselineFocus?: number;
  cover?: string;
  waking?: string;
  woreOffAround?: string;
  reboundDays: number;
  moderateOrWorse: { label: string; count: number }[];
  onTime: number;
  overall?: string;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

function oneDecimal(value: number | null): string | undefined {
  return value === null ? undefined : (Math.round(value * 10) / 10).toFixed(1);
}

/** Everything the section says, computed once so print and text agree. */
export function summarise(context: StandingContext): Standing | undefined {
  const groups = groupByDose(context.dates, context.days);
  const current = groups[groups.length - 1];
  if (current === undefined) return undefined;

  const days = current.days;
  const numbers = (pick: (day: MedicationDay) => unknown): number[] =>
    days.map(pick).filter((value): value is number => typeof value === 'number');

  const cover = mean(
    days
      .map((day) => spanMinutes(day.onset ?? '', day.woreOff ?? ''))
      .filter((value): value is number => value !== null),
  );

  // A waking day needs the sleep module. Without it, the section says less
  // rather than guessing.
  const waking = mean(
    current.dates
      .map((date) => {
        const night = context.moduleDays?.['sleep']?.[date];
        return spanMinutes(night?.wake ?? '', night?.bed ?? '');
      })
      .filter((value): value is number => value !== null && value > 360),
  );

  const woreOff = averageClock(days.map((day) => day.woreOff ?? ''));

  const severe = new Map<string, number>();
  for (const day of days) {
    for (const key of day.side ?? []) {
      const rank = SEVERITY_RANK[day.detail?.[key]?.sev ?? ''] ?? 0;
      if (rank >= 2) {
        const label = LABELS.get(key) ?? key;
        severe.set(label, (severe.get(label) ?? 0) + 1);
      }
    }
    if (day.appetite === 'barely') {
      severe.set('Barely ate', (severe.get('Barely ate') ?? 0) + 1);
    }
  }

  const standing: Standing = {
    label: doseLabel(current),
    days: days.length,
    reboundDays: days.filter((day) => day.rebound === 'mild' || day.rebound === 'rough').length,
    moderateOrWorse: [...severe.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
    onTime: days.filter((day) => day.adherence === 'ontime').length,
  };

  const focus = oneDecimal(mean(numbers((day) => day.focus)));
  if (focus !== undefined) standing.focus = focus;
  const mood = oneDecimal(mean(numbers((day) => day.mood)));
  if (mood !== undefined) standing.mood = mood;
  if (typeof context.baseline?.focus === 'number') standing.baselineFocus = context.baseline.focus;
  if (cover !== null) standing.cover = formatDuration(Math.round(cover));
  if (waking !== null) standing.waking = formatDuration(Math.round(waking));
  if (woreOff !== null) standing.woreOffAround = formatClockTime(fromMinutes(woreOff));
  if (context.overall !== undefined && context.overall !== '') standing.overall = context.overall;

  return standing;
}

/** The four lines, as plain sentences. Shared by print and by the text export. */
export function lines(standing: Standing): { label: string; body: string }[] {
  const efficacy =
    standing.focus === undefined
      ? 'Not rated.'
      : `Focus ${standing.focus}/5, mood ${standing.mood ?? '—'}/5` +
        (standing.baselineFocus !== undefined
          ? `, against a self-rated ${standing.baselineFocus}/5 before medication`
          : '') +
        '.';

  const duration =
    standing.cover === undefined
      ? 'Not recorded.'
      : `About ${standing.cover} of cover` +
        (standing.waking !== undefined ? ` across a ${standing.waking} waking day` : '') +
        (standing.woreOffAround !== undefined
          ? `, running out around ${standing.woreOffAround}`
          : '') +
        '. ' +
        (standing.reboundDays > 0
          ? `Rebound on ${standing.reboundDays} of ${standing.days} days.`
          : 'No rebound reported.');

  const tolerability =
    standing.moderateOrWorse.length > 0
      ? 'Moderate or worse: ' +
        standing.moderateOrWorse
          .map((entry) => `${entry.label} on ${entry.count} of ${standing.days}`)
          .join(', ') +
        '.'
      : 'Nothing rated moderate or worse.';

  const adherence = `Taken as prescribed on ${standing.onTime} of ${standing.days} days at this dose.`;

  const rows = [
    { label: 'Efficacy', body: efficacy },
    { label: 'Duration', body: duration },
    { label: 'Tolerability', body: tolerability },
    { label: 'Adherence', body: adherence },
  ];
  if (standing.overall !== undefined) {
    rows.push({
      label: 'Overall',
      body: `Self-rated ${standing.overall} than before medication.`,
    });
  }
  return rows;
}


/**
 * What the kernel's frame cannot work out for itself: the name on the
 * prescription, how often a dose was missed, and how much the focus rating
 * actually moved. All three are facts about this module's data, and none of them
 * is a conclusion. See docs/decisions/ADR-012-report-frame-contributions.md.
 *
 * Ported from the monolith, where these lived inline in the header and the
 * record-quality block.
 */
export function frameOf(context: StandingContext): FrameContribution {
  const days = context.dates
    .map((date) => context.days[date])
    .filter((day): day is MedicationDay => day !== undefined);
  if (days.length === 0) return {};

  const names = [...new Set(days.map((day) => day.med ?? '').filter((name) => name !== ''))];
  const missed = days.filter(
    (day) => day.adherence === 'partial' || day.adherence === 'none',
  ).length;
  const focus = days
    .map((day) => day.focus)
    .filter((value): value is number => typeof value === 'number');

  const frame: FrameContribution = { subject: names.join(', ') || 'Medication' };
  if (missed > 0) frame.header = `${missed} with a missed or skipped dose`;

  if (focus.length > 0) {
    const distinct = new Set(focus).size;
    frame.quality =
      `Focus was rated between ${Math.min(...focus)} and ${Math.max(...focus)}` +
      (distinct <= 1 ? ', the same value every day' : ` across ${distinct} different values`) +
      '.';
  }
  return frame;
}

export const standingSection: ReportSection = {
  report: 'clinical',
  id: 'medication.standing',
  weight: 10,

  frame: (context) => frameOf(context as StandingContext),

  title: (context) => {
    const standing = summarise(context as StandingContext);
    return standing === undefined ? 'Where things stand' : `Where things stand on ${standing.label}`;
  },

  // Three days is the least that says anything about a dose.
  when: (context) => (summarise(context as StandingContext)?.days ?? 0) >= 3,

  render: (context) => {
    const standing = summarise(context as StandingContext);
    if (standing === undefined) return '';
    const rows = lines(standing)
      .map(
        (row) =>
          `<tr><td style="white-space:nowrap;font-weight:600">${escapeHtml(row.label)}</td><td>${escapeHtml(row.body)}</td></tr>`,
      )
      .join('');

    return (
      `<h3>Where things stand on ${escapeHtml(standing.label)}</h3>` +
      `<table><tbody>${rows}</tbody></table>` +
      `<p class="legend">Day ${standing.days} at this dose.</p>`
    );
  },

  renderText: (context) => {
    const standing = summarise(context as StandingContext);
    if (standing === undefined) return '';
    return [
      `Where things stand on ${standing.label}`,
      '-'.repeat(`Where things stand on ${standing.label}`.length),
      ...lines(standing).map((row) => `${row.label} | ${row.body}`),
      `Day ${standing.days} at this dose.`,
    ].join('\n');
  },
};
