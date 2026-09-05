// The sleep section of the clinical report.
//
// It describes. It reaches no conclusion about the dose, the diagnosis or
// anything else: that is the prescriber's job. Every number is reproducible from
// the day-level data, the section states its own coverage, and the person sees
// all of it first in these same words. See docs/01-module-contract.md
// "Rules for clinical sections".

import {
  averageClock,
  formatClockTime,
  formatDuration,
  fromMinutes,
  spanMinutes,
  type IsoDate,
  type ReportSection,
} from '../../../kernel/index';
import { NIGHT_QUALITY } from '../strings';
import type { SleepDay } from '../records';

const LABELS = new Map<string, string>(NIGHT_QUALITY.map((option) => [option.v, option.l]));

export interface SleepContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, SleepDay>>;
}

export interface SleepSummary {
  /** Nights with anything at all recorded. */
  nights: number;
  /** Nights in the range, recorded or not. */
  ofNights: number;
  typicalBed?: string;
  typicalWake?: string;
  typicalHours?: string;
  typicalLatency?: number;
  reported: { label: string; count: number }[];
  notes: { date: IsoDate; text: string }[];
}

/** Everything the section says, computed once so print and text cannot diverge. */
export function summarise(context: SleepContext): SleepSummary {
  const counts = new Map<string, number>();
  const beds: string[] = [];
  const wakes: string[] = [];
  const hours: number[] = [];
  const latencies: number[] = [];
  const notes: { date: IsoDate; text: string }[] = [];
  let nights = 0;

  for (const date of context.dates) {
    const day = context.days[date];
    if (day === undefined) continue;

    const recorded =
      (day.bed ?? '') !== '' ||
      (day.wake ?? '') !== '' ||
      (day.hours ?? '') !== '' ||
      (day.quality ?? []).length > 0 ||
      (day.note ?? '') !== '';
    if (!recorded) continue;
    nights++;

    if ((day.bed ?? '') !== '') beds.push(day.bed as string);
    if ((day.wake ?? '') !== '') wakes.push(day.wake as string);
    if ((day.hours ?? '') !== '') {
      const value = Number.parseFloat(day.hours as string);
      if (Number.isFinite(value)) hours.push(value);
    }
    if ((day.latency ?? '') !== '') {
      const value = Number.parseFloat(day.latency as string);
      if (Number.isFinite(value)) latencies.push(value);
    }
    for (const key of day.quality ?? []) counts.set(key, (counts.get(key) ?? 0) + 1);
    if ((day.note ?? '') !== '') notes.push({ date, text: day.note as string });
  }

  const mean = (values: number[]): number | undefined =>
    values.length === 0 ? undefined : values.reduce((a, b) => a + b, 0) / values.length;

  // Bed times straddle midnight, so they are averaged on the clock rather than
  // as numbers: 23:40 and 00:20 average to midnight, not to noon.
  const bedMinutes = averageClock(beds);
  const wakeMinutes = averageClock(wakes);
  const meanHours = mean(hours);
  const meanLatency = mean(latencies);

  const summary: SleepSummary = {
    nights,
    ofNights: context.dates.length,
    reported: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ label: LABELS.get(key) ?? key, count })),
    notes,
  };

  if (bedMinutes !== null) summary.typicalBed = formatClockTime(fromMinutes(bedMinutes));
  if (wakeMinutes !== null) summary.typicalWake = formatClockTime(fromMinutes(wakeMinutes));
  if (meanHours !== undefined) summary.typicalHours = (Math.round(meanHours * 10) / 10).toFixed(1);
  if (meanLatency !== undefined) summary.typicalLatency = Math.round(meanLatency);

  return summary;
}

function escape(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character,
  );
}

export const clinicalSection: ReportSection = {
  report: 'clinical',
  id: 'sleep.nights',
  title: () => 'Sleep',
  weight: 40,

  when: (context) => summarise(context as SleepContext).nights > 0,

  render: (context) => {
    const summary = summarise(context as SleepContext);
    const rows = summary.reported
      .map(
        (entry) =>
          `<tr><td>${escape(entry.label)}</td><td class="num">${entry.count} of ${summary.nights}</td></tr>`,
      )
      .join('');

    const window_ =
      summary.typicalBed !== undefined && summary.typicalWake !== undefined
        ? `<p class="meta">Typically ${escape(summary.typicalBed)} to ${escape(summary.typicalWake)}` +
          (summary.typicalHours !== undefined
            ? `, with <b>${escape(summary.typicalHours)}h</b> recorded as time asleep`
            : '') +
          '.</p>'
        : '';

    const latency =
      summary.typicalLatency !== undefined
        ? `<p class="meta">About <b>${summary.typicalLatency} minutes</b> to fall asleep on the nights that was noted.</p>`
        : '';

    return (
      '<h3>Sleep</h3>' +
      `<p class="meta">${summary.nights} of ${summary.ofNights} nights recorded.</p>` +
      window_ +
      latency +
      (rows
        ? `<div class="scroll"><table><thead><tr><th>Reported</th><th>Nights</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '') +
      summary.notes
        .slice(-8)
        .reverse()
        .map((note) => `<p class="noteline"><b>${escape(note.date)}</b> ${escape(note.text)}</p>`)
        .join('')
    );
  },

  renderText: (context) => {
    const summary = summarise(context as SleepContext);
    const lines = ['Sleep', '-----', `${summary.nights} of ${summary.ofNights} nights recorded.`];
    if (summary.typicalBed !== undefined && summary.typicalWake !== undefined) {
      lines.push(
        `Typically ${summary.typicalBed} to ${summary.typicalWake}` +
          (summary.typicalHours !== undefined ? `, ${summary.typicalHours}h asleep` : '') +
          '.',
      );
    }
    if (summary.typicalLatency !== undefined) {
      lines.push(`About ${summary.typicalLatency} minutes to fall asleep when that was noted.`);
    }
    for (const entry of summary.reported) {
      lines.push(`${entry.label} | ${entry.count} of ${summary.nights}`);
    }
    for (const note of summary.notes.slice(-8).reverse()) {
      lines.push(`${note.date} ${note.text}`);
    }
    return lines.join('\n');
  },
};

/** Time in bed, for readers that want it without recomputing. */
export function timeInBed(day: SleepDay): string {
  const minutes = spanMinutes(day.bed ?? '', day.wake ?? '');
  return minutes === null ? '' : formatDuration(minutes);
}
