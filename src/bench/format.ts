// How the prototype writes dates, times of day and lengths of time
// (design/lantern/PROTOTYPE-PLAN.md section 7, "Format rules").
//
// The clock is 24-hour as the board draws it ("10:30", "ends 10:23"), with no
// leading zero on the hour ("9:58"): "10:30am" does not fit the 60 pt time
// column (owner question 7). Nothing here ever writes seconds, and nothing
// writes "0 min left": callers decide what to say once an estimate is used up.

import { parseIsoDate, toMinutes, type ClockTime, type IsoDate } from '../kernel/dates';

// A fixed formatter, so the date reads the same whatever the phone's language:
// the prototype is in British English throughout.
const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "Tuesday 24 November". */
export function longDate(day: IsoDate | Date): string {
  return LONG_DATE.format(typeof day === 'string' ? parseIsoDate(day) : day);
}

/** "9:58", "10:30", "14:00", from a moment or from a stored time of day. */
export function clock24(at: Date | ClockTime): string {
  if (typeof at === 'string') {
    const minutes = toMinutes(at);
    if (minutes === null) throw new RangeError(`Not a time of day: ${at}`);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }
  return `${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`;
}

/** Whole minutes, never negative. Callers round first; this only guards. */
function whole(minutes: number): number {
  return Math.max(0, Math.round(minutes));
}

/**
 * A length of time as it is written on screen: "25 min", "1 h", "1 h 20 min".
 * Lengths of an hour or more are undrawn; the hours form is a proposal.
 */
export function duration(minutes: number): string {
  const total = whole(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** The same length, as it is spoken: "25 minutes", "1 minute", "1 hour 20 minutes". */
export function durationSpoken(minutes: number): string {
  const total = whole(minutes);
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (total < 60) return unit(total, 'minute');
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? unit(hours, 'hour') : `${unit(hours, 'hour')} ${unit(rest, 'minute')}`;
}

/** "in 25 min", "in 1 h 20 min". */
export const inDuration = (minutes: number): string => `in ${duration(minutes)}`;

/** "18 min left". */
export const minutesLeft = (minutes: number): string => `${duration(minutes)} left`;

/** "27 min so far". */
export const minutesSoFar = (minutes: number): string => `${duration(minutes)} so far`;

/** "of 25", the whole estimate beside the minutes left. */
export const ofEstimate = (minutes: number): string =>
  minutes < 60 ? `of ${whole(minutes)}` : `of ${duration(minutes)}`;

/** "estimate 25", once the estimate is used up. */
export const estimateWords = (minutes: number): string =>
  minutes < 60 ? `estimate ${whole(minutes)}` : `estimate ${duration(minutes)}`;

/** "3 steps", "1 step". */
export const stepCount = (count: number): string => (count === 1 ? '1 step' : `${count} steps`);

/** The parts of a line joined the way the board joins them: "Today · 10:30". */
export const dotted = (...parts: readonly (string | undefined | false)[]): string =>
  parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' · ');
