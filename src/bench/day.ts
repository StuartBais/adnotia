// When a logging day begins and ends, as moments: 04:00, the kernel's
// after-midnight rule (SMALL_HOURS_UNTIL). One definition, shared by the
// rules in state.ts and the example day in example.ts, so the two cannot
// disagree about when a day turns. It lives apart from both because state.ts
// imports example.ts for the scenario buttons.

import { SMALL_HOURS_UNTIL, addDays, parseIsoDate, type IsoDate } from '../kernel/dates';

/** 04:00 on a logging day: the moment that day begins. */
export function loggingDayStart(day: IsoDate): Date {
  const start = parseIsoDate(day);
  start.setHours(SMALL_HOURS_UNTIL, 0, 0, 0);
  return start;
}

/** The last instant of a logging day: one millisecond before the next day's 04:00. */
export function lastInstantOf(day: IsoDate): number {
  return loggingDayStart(addDays(day, 1)).getTime() - 1;
}
