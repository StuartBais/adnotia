// Grouping days by the prescription that was in force.
//
// The medication module exposes this so the kernel can draw shared visuals from
// medication and sleep together without either module reaching into the other.
// See docs/05-architecture.md "Reports engine".

import {
  chartNote,
  escapeHtml,
  formatShortDate,
  stepChart,
  type IsoDate,
  type ReportSection,
  type StepColumn,
  type TimelineContribution,
} from '../../../kernel/index';
import type { MedicationDay } from '../records';

export interface DoseGroup {
  key: string;
  med: string;
  dose: string;
  unit: string;
  dates: IsoDate[];
  days: MedicationDay[];
}

/**
 * A label a person would recognise: "Elvanse 50mg". A v0 day that recorded no
 * prescription still carries a unit, so the fallback has to read as a name;
 * it is capitalised because it heads a block.
 */
export function doseLabel(group: Pick<DoseGroup, 'med' | 'dose' | 'unit'>): string {
  return `${group.med || 'Medication'} ${group.dose || '?'}${group.unit}`;
}

/** Consecutive runs of the same prescription, in the order they happened. */
export function groupByDose(
  dates: readonly IsoDate[],
  days: Readonly<Record<IsoDate, MedicationDay>>,
): DoseGroup[] {
  const groups: DoseGroup[] = [];
  const index = new Map<string, DoseGroup>();

  for (const date of dates) {
    const day = days[date];
    if (day === undefined) continue;

    const med = day.med ?? '';
    const dose = day.dose ?? '';
    const unit = day.unit ?? '';
    const key = `${med || 'medication'}|${dose || '?'}${unit}`;

    let group = index.get(key);
    if (group === undefined) {
      group = { key, med, dose, unit, dates: [], days: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.dates.push(date);
    group.days.push(day);
  }
  return groups;
}

// ------------------------------------------------------- dose over time

export interface DosesContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, MedicationDay>>;
}

/** How many days the rolling average of focus looks back over. */
const WINDOW = 7;
/** Fewer ratings than this in the window and the average is noise. */
const MIN_IN_WINDOW = 3;

export interface DoseSeries {
  columns: StepColumn[];
  first: IsoDate;
  last: IsoDate;
  hasTrend: boolean;
}

/** The columns of the chart: one per day that recorded a dose. */
export function doseSeries(context: DosesContext): DoseSeries | undefined {
  const points: { date: IsoDate; day: MedicationDay; dose: number }[] = [];
  for (const date of context.dates) {
    const day = context.days[date];
    if (day === undefined || (day.dose ?? '') === '') continue;
    points.push({ date, day, dose: Number.parseFloat(day.dose as string) || 0 });
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined || points.length < 2) return undefined;

  let hasTrend = false;
  const columns = points.map((point, index) => {
    const column: StepColumn = { step: point.dose };
    if (typeof point.day.focus === 'number') column.point = point.day.focus;
    if (point.day.rebound === 'rough') column.flag = true;

    const window = points
      .slice(Math.max(0, index - (WINDOW - 1)), index + 1)
      .map((other) => other.day.focus)
      .filter((value): value is number => typeof value === 'number');
    if (window.length >= MIN_IN_WINDOW) {
      column.trend = window.reduce((a, b) => a + b, 0) / window.length;
      hasTrend = true;
    }
    return column;
  });

  return { columns, first: first.date, last: last.date, hasTrend };
}

const DOSE_HEADING = 'Dose over time';

function doseLegend(hasTrend: boolean): string {
  return (
    "Solid line: daily dose (left scale). Dots: each day's focus rating (right scale). " +
    (hasTrend ? 'Dashed line: 7-day rolling average of focus — read this, not the dots. ' : '') +
    'Bars below the axis: rough crash days.'
  );
}

export const doseOverTimeSection: ReportSection = {
  report: 'clinical',
  id: 'medication.doses',
  weight: 20,
  title: () => DOSE_HEADING,

  when: (context) => doseSeries(context as DosesContext) !== undefined,

  render: (context) => {
    const series = doseSeries(context as DosesContext);
    if (series === undefined) return '';
    const chart = stepChart({
      columns: series.columns,
      pointScale: { min: 1, max: 5, label: 'focus 5' },
      startLabel: formatShortDate(series.first),
      endLabel: formatShortDate(series.last),
      title: 'Dose over time with daily focus ratings',
      legend: doseLegend(series.hasTrend),
    });
    return chart === '' ? '' : `<h3>${escapeHtml(DOSE_HEADING)}</h3>${chart}`;
  },

  renderText: (context) => {
    const series = doseSeries(context as DosesContext);
    if (series === undefined) return '';
    const levels = [...new Set(series.columns.map((column) => column.step))];
    return [
      DOSE_HEADING,
      '-'.repeat(DOSE_HEADING.length),
      chartNote('dose chart'),
      `${series.columns.length} days from ${formatShortDate(series.first)} to ` +
        `${formatShortDate(series.last)}, across ${levels.length} ` +
        `${levels.length === 1 ? 'dose level' : 'dose levels'}: ${levels.join(', ')}.`,
      doseLegend(series.hasTrend),
    ].join('\n');
  },
};

// ------------------------------------------------- the shared day timeline

/**
 * What the medication module draws on the kernel's shared timeline. It sees only
 * its own day record and knows nothing of the sleep band underneath it.
 * See docs/decisions/ADR-013-shared-day-timeline.md.
 */
export const medicationTimeline: TimelineContribution = {
  weight: 20,
  legend:
    'Solid: hours the medication was working. Vertical ticks: doses taken. ' +
    'Dots: rebound, larger where it was rough.',

  parts: (record) => {
    const day = record as MedicationDay;
    const parts: {
      bands?: { from: string; to: string; className: string }[];
      ticks?: string[];
      marks?: { at: string; className: string; radius: number }[];
    } = {};

    const onset = day.onset ?? '';
    const woreOff = day.woreOff ?? '';
    if (onset !== '' && woreOff !== '') {
      parts.bands = [{ from: onset, to: woreOff, className: 'coverband' }];
    }

    const times = (day.times ?? []).filter((time) => time !== '');
    if (times.length > 0) parts.ticks = times;

    if (day.rebound === 'rough' || day.rebound === 'mild') {
      // Where they said it hit, or where the cover ran out if they did not.
      const at = (day.reboundTime ?? '') !== '' ? (day.reboundTime as string) : woreOff;
      if (at !== '') {
        parts.marks = [{ at, className: 'rbmark', radius: day.rebound === 'rough' ? 2.6 : 1.7 }];
      }
    }
    return parts;
  },
};
