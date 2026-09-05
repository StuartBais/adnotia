// "How each dose performed": one block per prescription that was in force.
//
// The person's own before-medication baseline comes first, so the blocks are read
// against something rather than against each other in a vacuum. Every number is
// an average of days the person entered, and the block says how many days it rests
// on. It reaches no conclusion about which block is better; a prescriber does that.
//
// Ported from the monolith's levelBlocks and baselineBlock.

import {
  averageClock,
  escapeHtml,
  formatClockTime,
  formatDuration,
  formatShortDate,
  fromMinutes,
  spanMinutes,
  toMinutes,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
import { LABELS } from '../strings';
import type { MedicationDay } from '../records';
import { doseLabel, groupByDose, type DoseGroup } from './doses';

export interface LevelsContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, MedicationDay>>;
  moduleDays?: Readonly<
    Record<IsoDate, unknown> &
      Record<string, Readonly<Record<IsoDate, { bed?: string; wake?: string; hours?: string }>>>
  >;
  baseline?: { focus?: number | null; mood?: number | null; sleep?: string; note?: string };
}

export interface LevelStats {
  label: string;
  from: IsoDate;
  to: IsoDate;
  days: number;
  focus?: string;
  mood?: string;
  reboundDays: number;
  onsetAround?: string;
  woreOffAround?: string;
  cover?: string;
  waking?: string;
  sleepHours?: string;
  asleepAround?: string;
  upAround?: string;
  firstDoseAfterWaking?: string;
  reported: string[];
  highestBpm?: number;
}

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

function oneDecimal(value: number | null): string | undefined {
  return value === null ? undefined : (Math.round(value * 10) / 10).toFixed(1);
}

function clockOf(minutes: number | null): string | undefined {
  return minutes === null ? undefined : formatClockTime(fromMinutes(minutes));
}

function statsFor(
  group: DoseGroup,
  nights: Readonly<Record<IsoDate, { bed?: string; wake?: string; hours?: string }>>,
): LevelStats {
  const { days, dates } = group;
  const numbers = (pick: (day: MedicationDay) => unknown): number[] =>
    days.map(pick).filter((value): value is number => typeof value === 'number');

  const nightsFor = dates.map((date) => nights[date] ?? {});

  const cover = mean(
    days
      .map((day) => spanMinutes(day.onset ?? '', day.woreOff ?? ''))
      .filter((value): value is number => value !== null),
  );
  // A "waking day" under six hours is a data-entry slip, not a short day.
  const waking = mean(
    nightsFor
      .map((night) => spanMinutes(night.wake ?? '', night.bed ?? ''))
      .filter((value): value is number => value !== null && value > 360),
  );
  // More than twelve hours between waking and the first dose means the dose
  // belonged to a different day, so it is left out rather than averaged in.
  const gap = mean(
    dates
      .map((date, index) => {
        const first = [...((days[index] as MedicationDay).times ?? [])].filter((t) => t !== '').sort()[0];
        return spanMinutes(nights[date]?.wake ?? '', first ?? '');
      })
      .filter((value): value is number => value !== null && value < 720),
  );

  const sleepHours = mean(
    nightsFor
      .map((night) => Number.parseFloat(night.hours ?? ''))
      .filter((value) => Number.isFinite(value)),
  );

  const counts = new Map<string, number>();
  const times = new Map<string, number[]>();
  const bpms: number[] = [];

  const tally = (key: string, day: MedicationDay): void => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const detail = day.detail?.[key];
    const at = toMinutes(detail?.time ?? '');
    if (at !== null) times.set(key, [...(times.get(key) ?? []), at]);
    const bpm = Number.parseFloat(detail?.bpm ?? '');
    if (Number.isFinite(bpm)) bpms.push(bpm);
  };

  for (const day of days) {
    for (const key of day.side ?? []) tally(key, day);
    if ((day.appetite ?? '') !== '' && day.appetite !== 'normal') tally(day.appetite as string, day);
    if ((day.heart ?? '') !== '' && day.heart !== 'fine') tally(day.heart as string, day);
  }

  const reported = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const around = clockOf(mean(times.get(key) ?? []));
      return (
        `${LABELS.get(key) ?? key} ${count}/${days.length}` +
        (around === undefined ? '' : ` (around ${around})`)
      );
    });

  const stats: LevelStats = {
    label: doseLabel(group),
    from: dates[0] as IsoDate,
    to: dates[dates.length - 1] as IsoDate,
    days: days.length,
    reboundDays: days.filter((day) => day.rebound === 'mild' || day.rebound === 'rough').length,
    reported,
  };

  const focus = oneDecimal(mean(numbers((day) => day.focus)));
  if (focus !== undefined) stats.focus = focus;
  const mood = oneDecimal(mean(numbers((day) => day.mood)));
  if (mood !== undefined) stats.mood = mood;

  const onset = clockOf(averageClock(days.map((day) => day.onset ?? '')));
  if (onset !== undefined) stats.onsetAround = onset;
  const woreOff = clockOf(averageClock(days.map((day) => day.woreOff ?? '')));
  if (woreOff !== undefined) stats.woreOffAround = woreOff;
  if (cover !== null) stats.cover = formatDuration(Math.round(cover));
  if (waking !== null) stats.waking = formatDuration(Math.round(waking));

  const hours = oneDecimal(sleepHours);
  if (hours !== undefined) stats.sleepHours = hours;
  const asleep = clockOf(averageClock(nightsFor.map((night) => night.bed ?? '')));
  if (asleep !== undefined) stats.asleepAround = asleep;
  const up = clockOf(averageClock(nightsFor.map((night) => night.wake ?? '')));
  if (up !== undefined) stats.upAround = up;
  if (gap !== null) stats.firstDoseAfterWaking = formatDuration(Math.round(gap));
  if (bpms.length > 0) stats.highestBpm = Math.max(...bpms);

  return stats;
}

export function summarise(context: LevelsContext): LevelStats[] {
  const nights = (context.moduleDays?.['sleep'] ?? {}) as Readonly<
    Record<IsoDate, { bed?: string; wake?: string; hours?: string }>
  >;
  return groupByDose(context.dates, context.days).map((group) => statsFor(group, nights));
}

/** The lines of one block, shared by print and by the text export. */
export function lines(stats: LevelStats): string[] {
  const out: string[] = [];

  out.push(
    `Focus ${stats.focus ?? '—'} · mood ${stats.mood ?? '—'} · ` +
      `crash on ${stats.reboundDays} of ${stats.days} days`,
  );

  out.push(
    `Cover: ${stats.onsetAround ?? '—'} to ${stats.woreOffAround ?? '—'}` +
      (stats.cover === undefined ? '' : `, about ${stats.cover}`) +
      (stats.waking === undefined ? '' : ` of a ${stats.waking} waking day`),
  );

  // Without the sleep module there is no sleep line at all, rather than a line
  // of dashes that looks like the person left it blank.
  if (
    stats.sleepHours !== undefined ||
    stats.asleepAround !== undefined ||
    stats.upAround !== undefined ||
    stats.firstDoseAfterWaking !== undefined
  ) {
    out.push(
      `Sleep ${stats.sleepHours === undefined ? '—' : `${stats.sleepHours}h`}` +
        (stats.asleepAround === undefined ? '' : `, asleep around ${stats.asleepAround}`) +
        (stats.upAround === undefined ? '' : `, up around ${stats.upAround}`) +
        (stats.firstDoseAfterWaking === undefined
          ? ''
          : ` · first dose ${stats.firstDoseAfterWaking} after waking`),
    );
  }

  if (stats.reported.length > 0) {
    out.push(
      `Reported: ${stats.reported.join(', ')}` +
        (stats.highestBpm === undefined
          ? ''
          : ` · highest heart rate noted ${stats.highestBpm} bpm`),
    );
  }
  return out;
}

/** The person's own before-medication baseline, when they set one. */
export function baselineLine(context: LevelsContext): string | undefined {
  const baseline = context.baseline;
  if (baseline === undefined) return undefined;

  const bits: string[] = [];
  if (typeof baseline.focus === 'number') bits.push(`Focus ${baseline.focus}`);
  if (typeof baseline.mood === 'number') bits.push(`mood ${baseline.mood}`);
  if ((baseline.sleep ?? '') !== '') bits.push(`sleep ${baseline.sleep}h`);
  if (bits.length === 0 && (baseline.note ?? '') === '') return undefined;
  return bits.join(' · ');
}

const HEADING = 'How each dose performed';

function block(stats: LevelStats): string {
  return (
    '<div class="lvl">' +
    `<div class="h"><b>${escapeHtml(stats.label)}</b>` +
    `<span>${escapeHtml(formatShortDate(stats.from))}–${escapeHtml(formatShortDate(stats.to))}, ` +
    `${stats.days} ${stats.days === 1 ? 'day' : 'days'}</span></div>` +
    lines(stats)
      .map((line) => `<div class="stats">${escapeHtml(line)}</div>`)
      .join('') +
    '</div>'
  );
}

export const levelsSection: ReportSection = {
  report: 'clinical',
  id: 'medication.levels',
  weight: 40,
  title: () => HEADING,
  when: (context) => summarise(context as LevelsContext).length > 0,

  render: (context) => {
    const typed = context as LevelsContext;
    const stats = summarise(typed);
    if (stats.length === 0) return '';

    const baseline = baselineLine(typed);
    const note = typed.baseline?.note ?? '';
    const head =
      baseline === undefined && note === ''
        ? ''
        : '<div class="lvl lv-base"><div class="h"><b>Before medication</b>' +
          '<span>self-rated baseline</span></div>' +
          (baseline === undefined ? '' : `<div class="stats">${escapeHtml(baseline)}</div>`) +
          (note === '' ? '' : `<div class="stats">${escapeHtml(note)}</div>`) +
          '</div>';

    return `<h3>${escapeHtml(HEADING)}</h3>${head}${stats.map(block).join('')}`;
  },

  renderText: (context) => {
    const typed = context as LevelsContext;
    const stats = summarise(typed);
    if (stats.length === 0) return '';

    const out = [HEADING, '-'.repeat(HEADING.length)];
    const baseline = baselineLine(typed);
    const note = typed.baseline?.note ?? '';
    if (baseline !== undefined || note !== '') {
      out.push('', 'Before medication, self-rated baseline:');
      if (baseline !== undefined) out.push(baseline);
      if (note !== '') out.push(note);
    }
    for (const level of stats) {
      out.push(
        '',
        `${level.label} — ${formatShortDate(level.from)}–${formatShortDate(level.to)}, ` +
          `${level.days} ${level.days === 1 ? 'day' : 'days'}:`,
        ...lines(level),
      );
    }
    return out.join('\n');
  },
};
