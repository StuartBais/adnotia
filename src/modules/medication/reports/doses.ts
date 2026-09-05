// Grouping days by the prescription that was in force.
//
// The medication module exposes this so the kernel can draw shared visuals from
// medication and sleep together without either module reaching into the other.
// See docs/05-architecture.md "Reports engine".

import type { IsoDate } from '../../../kernel/index';
import type { MedicationDay } from '../records';

export interface DoseGroup {
  key: string;
  med: string;
  dose: string;
  unit: string;
  dates: IsoDate[];
  days: MedicationDay[];
}

/** A label a person would recognise: "Elvanse 50mg". */
export function doseLabel(group: Pick<DoseGroup, 'med' | 'dose' | 'unit'>): string {
  return `${group.med || 'medication'} ${group.dose || '?'}${group.unit}`;
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
