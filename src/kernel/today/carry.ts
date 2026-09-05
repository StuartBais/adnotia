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

/**
 * Read a field out of a day record. A dotted id is a path, because
 * docs/06-data-model.md nests side-effect detail as
 * `detail: { dry: { sev, time, note } }` rather than flattening it.
 */
export function readPath(record: Record<string, unknown> | undefined, fieldId: string): unknown {
  if (record === undefined) return undefined;
  if (!fieldId.includes('.')) return record[fieldId];

  let held: unknown = record;
  for (const step of fieldId.split('.')) {
    if (typeof held !== 'object' || held === null) return undefined;
    held = (held as Record<string, unknown>)[step];
  }
  return held;
}

/** Write a field into a day record, creating the path as it goes. */
export function writePath(record: Record<string, unknown>, fieldId: string, value: unknown): void {
  if (!fieldId.includes('.')) {
    record[fieldId] = value;
    return;
  }
  const steps = fieldId.split('.');
  const last = steps.pop() as string;
  let held = record;
  for (const step of steps) {
    const next = held[step];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) held[step] = {};
    held = held[step] as Record<string, unknown>;
  }
  held[last] = value;
}

function hasValue(record: Record<string, unknown> | undefined, fieldId: string): boolean {
  if (record === undefined) return false;
  const held = readPath(record, fieldId);
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
  if (hasValue(own, field.id)) return { value: readPath(own, field.id) };

  const carry: Carry = field.carry ?? 'none';
  if (carry === 'none') return undefined;

  if (carry === 'previous') {
    const previous = previousLoggedDay(date, days);
    if (previous === undefined) return undefined;
    if (!hasValue(days[previous], field.id)) return undefined;
    return { value: readPath(days[previous], field.id), from: previous };
  }

  const found = nearestPrior(date, days, (record) => hasValue(record, field.id));
  if (found === undefined) return undefined;
  return {
    value: readPath(found.value, field.id),
    from: found.date,
    backwards: found.direction === 'later',
  };
}
