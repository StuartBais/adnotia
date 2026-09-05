// History.
//
// The module renders its own rows. Read-only views onto what Today collected;
// nothing here computes anything the person has not seen.

import { el, formatClockTime, formatDuration, spanMinutes, type IsoDate } from '../../kernel/index';
import { NIGHT_QUALITY } from './strings';

const LABELS = new Map<string, string>(NIGHT_QUALITY.map((option) => [option.v, option.l]));

export interface SleepDay {
  bed?: string;
  wake?: string;
  hours?: string;
  quality?: string[];
  latency?: string;
  note?: string;
}

/** One line describing a night, or an empty string when nothing was recorded. */
export function describeNight(day: SleepDay | undefined): string {
  if (day === undefined) return '';
  const parts: string[] = [];

  if (day.bed !== undefined && day.bed !== '' && day.wake !== undefined && day.wake !== '') {
    parts.push(`${formatClockTime(day.bed)} to ${formatClockTime(day.wake)}`);
    const between = spanMinutes(day.bed, day.wake);
    if (between !== null) parts.push(`${formatDuration(between)} between those`);
  }
  if (day.hours !== undefined && day.hours !== '') parts.push(`${day.hours}h asleep`);
  if (day.latency !== undefined && day.latency !== '') {
    parts.push(`about ${day.latency} minutes to drop off`);
  }
  for (const key of day.quality ?? []) parts.push(LABELS.get(key) ?? key);

  return parts.join(' · ');
}

export function renderRecords(
  container: HTMLElement,
  context: { dates: readonly IsoDate[]; days: Readonly<Record<IsoDate, SleepDay>> },
): void {
  container.replaceChildren();

  for (const date of [...context.dates].reverse()) {
    const day = context.days[date];
    const line = describeNight(day);
    if (line === '') continue;

    const row = el('div', { class: 'entry' }, [
      el('b', { text: date }),
      document.createTextNode(' '),
      el('span', { text: line }),
    ]);
    if (day?.note !== undefined && day.note !== '') {
      row.append(el('p', { class: 'noteline', text: day.note }));
    }
    container.append(row);
  }
}
