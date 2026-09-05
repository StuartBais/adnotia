// History.
//
// One line per day, in the person's own words. Read-only: nothing here computes
// anything they have not already seen on the day they wrote it.

import {
  el,
  formatClockTime,
  formatDuration,
  formatShortDate,
  formatWeekday,
  spanMinutes,
  type IsoDate,
} from '../../kernel/index';
import { LABELS } from './strings';

export interface SideDetail {
  sev?: string;
  time?: string;
  note?: string;
  bpm?: string;
}

export interface MedicationDay {
  med?: string;
  dose?: string;
  unit?: string;
  times?: string[];
  adherence?: string;
  focus?: number | null;
  mood?: number | null;
  onset?: string;
  woreOff?: string;
  rebound?: string;
  reboundTime?: string;
  appetite?: string;
  heart?: string;
  side?: string[];
  detail?: Record<string, SideDetail>;
}

/** "Elvanse 50mg at 8am", or an empty string when no prescription was recorded. */
export function describePrescription(day: MedicationDay | undefined): string {
  if (day === undefined) return '';
  const parts: string[] = [];
  if ((day.med ?? '') !== '') parts.push(day.med as string);
  if ((day.dose ?? '') !== '') parts.push(`${day.dose}${day.unit ?? ''}`);

  const times = (day.times ?? []).filter((time) => time !== '');
  if (times.length > 0) {
    parts.push(`at ${times.map((time) => formatClockTime(time)).join(' and ')}`);
  }
  return parts.join(' ');
}

/** "Cover 9:30am to 4:30pm, about 7h", or an empty string. */
export function describeCover(day: MedicationDay | undefined): string {
  if (day === undefined) return '';
  const onset = day.onset ?? '';
  const woreOff = day.woreOff ?? '';
  if (onset === '' || woreOff === '') return '';

  const minutes = spanMinutes(onset, woreOff);
  return (
    `Cover ${formatClockTime(onset)} to ${formatClockTime(woreOff)}` +
    (minutes === null ? '' : `, about ${formatDuration(minutes)}`)
  );
}

export function renderRecords(
  container: HTMLElement,
  context: { dates: readonly IsoDate[]; days: Readonly<Record<IsoDate, MedicationDay>> },
): void {
  container.replaceChildren();

  for (const date of [...context.dates].reverse()) {
    const day = context.days[date];
    if (day === undefined) continue;

    const lines: string[] = [];
    const prescription = describePrescription(day);
    if (prescription !== '') lines.push(prescription);
    if ((day.adherence ?? '') !== '') lines.push(LABELS.get(day.adherence as string) ?? '');

    // What the day was actually like, which is the part a person scans for.
    if (typeof day.focus === 'number') lines.push(`focus ${day.focus}`);
    if (typeof day.mood === 'number') lines.push(`mood ${day.mood}`);

    const cover = describeCover(day);
    if (cover !== '') lines.push(cover);

    if ((day.rebound ?? '') !== '' && day.rebound !== 'none') {
      lines.push(`${(LABELS.get(day.rebound as string) ?? '').toLowerCase()} crash`);
    }
    if ((day.appetite ?? '') !== '' && day.appetite !== 'normal') {
      lines.push(LABELS.get(day.appetite as string) ?? '');
    }
    if ((day.heart ?? '') !== '' && day.heart !== 'fine') {
      lines.push(LABELS.get(day.heart as string) ?? '');
    }

    for (const key of day.side ?? []) {
      const severity = day.detail?.[key]?.sev;
      lines.push(
        (LABELS.get(key) ?? key) +
          (severity !== undefined && severity !== ''
            ? ` (${(LABELS.get(severity) ?? severity).toLowerCase()})`
            : ''),
      );
    }

    if (lines.length === 0) continue;
    container.append(
      el('div', { class: 'entry' }, [
        el('b', { text: `${formatShortDate(date)}, ${formatWeekday(date)}` }),
        document.createTextNode(' '),
        el('span', { text: lines.join(' · ') }),
      ]),
    );
  }
}
