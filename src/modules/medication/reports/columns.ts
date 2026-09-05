// The medication module's columns in the shared day-by-day table.
//
// Every cell is a value the person entered, printed as they entered it. Nothing
// here computes, averages or ranks: the table exists so a prescriber can check a
// figure from further up the page against the days it came from, and a cell that
// had been through arithmetic would defeat that.
//
// The weights leave a gap at 70 for the sleep module, which is where the
// monolith put it. Neither module knows the other is there.
// See docs/decisions/ADR-018-shared-day-table.md.

import { formatClockTime, type DayColumn } from '../../../kernel/index';
import { LABELS } from '../strings';
import type { MedicationDay } from '../records';
import { bodyLines } from '../records';

const as = (day: Readonly<Record<string, unknown>>): MedicationDay => day as MedicationDay;

export const columns: DayColumn[] = [
  {
    label: 'Dose',
    weight: 10,
    numeric: true,
    cell: (day) => {
      const record = as(day);
      return (record.dose ?? '') === '' ? '' : `${record.dose}${record.unit ?? ''}`;
    },
  },
  {
    label: 'Taken',
    weight: 20,
    cell: (day) => {
      const record = as(day);
      const times = (record.times ?? []).filter((time) => time !== '');
      const when = times.map((time) => formatClockTime(time)).join(', ');
      if (when === '') return '';
      // Only worth naming when it was not as prescribed.
      const adherence = record.adherence ?? '';
      return adherence === '' || adherence === 'ontime'
        ? when
        : `${when} (${(LABELS.get(adherence) ?? adherence).toLowerCase()})`;
    },
  },
  {
    label: 'Focus',
    weight: 30,
    numeric: true,
    cell: (day) => (typeof as(day).focus === 'number' ? String(as(day).focus) : ''),
    legend: 'Focus and mood are self-rated 1 to 5, where 5 is best.',
  },
  {
    label: 'Mood',
    weight: 40,
    numeric: true,
    cell: (day) => (typeof as(day).mood === 'number' ? String(as(day).mood) : ''),
  },
  {
    label: 'Onset–off',
    weight: 50,
    cell: (day) => {
      const record = as(day);
      const onset = record.onset ?? '';
      const woreOff = record.woreOff ?? '';
      if (onset === '' && woreOff === '') return '';
      // A question mark, not a dash: the dose started and the person did not
      // record where it stopped, which is different from nothing happening.
      return `${onset === '' ? '—' : formatClockTime(onset)}–${woreOff === '' ? '?' : formatClockTime(woreOff)}`;
    },
  },
  {
    label: 'Crash',
    weight: 60,
    cell: (day) => {
      const record = as(day);
      const rebound = record.rebound ?? '';
      if (rebound === '' || rebound === 'none') return '';
      const at = record.reboundTime ?? '';
      return (LABELS.get(rebound) ?? rebound) + (at === '' ? '' : ` ${formatClockTime(at)}`);
    },
  },
  {
    label: 'Side effects',
    weight: 80,
    cell: (day) => bodyLines(as(day)).join('; '),
    legend: 'Side effects show severity in brackets where it was rated.',
  },
];
