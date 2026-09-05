// Carry: what a field starts the day showing.
//
// `nearestPrior` is the value from the closest *earlier* day that had one, not
// the most recently saved value. Skipped and blank days fall straight through,
// which is what makes backfilling correct: filling in last Tuesday should show
// last Monday's prescription, not today's. See docs/01-module-contract.md.

import { nearestPrior, previousLoggedDay, type IsoDate } from '../dates/index';
import type { Carry, TodayField } from '../registry/types';

export interface CarriedValue {
  value: unknown;
  /** The day it came from, for saying so on screen. */
  from?: IsoDate;
  /** True when the value had to be taken from a *later* day. */
  backwards?: boolean;
}

type Days = Readonly<Record<IsoDate, Record<string, unknown>>>;

function hasValue(record: Record<string, unknown> | undefined, fieldId: string): boolean {
  if (record === undefined) return false;
  const held = record[fieldId];
  if (held === undefined || held === null || held === '') return false;
  if (Array.isArray(held) && held.length === 0) return false;
  return true;
}

/**
 * What `field` should show on `date`, given the module's days.
 *
 * A value already recorded for that day always wins. Carry only fills a blank.
 */
export function carriedValue(
  field: TodayField,
  date: IsoDate,
  days: Days,
): CarriedValue | undefined {
  const own = days[date];
  if (hasValue(own, field.id)) return { value: own?.[field.id] };

  const carry: Carry = field.carry ?? 'none';
  if (carry === 'none') return undefined;

  if (carry === 'previous') {
    const previous = previousLoggedDay(date, days);
    if (previous === undefined) return undefined;
    if (!hasValue(days[previous], field.id)) return undefined;
    return { value: days[previous]?.[field.id], from: previous };
  }

  const found = nearestPrior(date, days, (record) => hasValue(record, field.id));
  if (found === undefined) return undefined;
  return {
    value: found.value[field.id],
    from: found.date,
    backwards: found.direction === 'later',
  };
}
