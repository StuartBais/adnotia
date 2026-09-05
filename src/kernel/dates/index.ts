// Kernel date and clock service.
//
// Ported from reference/adnotia-v0-monolith.html, whose rules for the logging
// day, midnight-crossing spans and nearest-prior carry were hard-won. See
// reference/README.md "What to port". Behaviour here should not drift from the
// monolith without a parity test recording the change.
//
// Dates are local calendar dates as YYYY-MM-DD; times of day are HH:MM on a
// 24-hour clock. See docs/06-data-model.md "Rules".

/** A local calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

/** A time of day, `HH:MM`, 24-hour. */
export type ClockTime = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes in a day. */
export const DAY_MINUTES = 1440;

/**
 * Before this hour, the day being logged is almost always the one that just
 * ended. See `loggingDay`.
 */
export const SMALL_HOURS_UNTIL = 4;

// ---------- validation ----------

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  // Rejects 2026-02-30 and friends: round-tripping only survives a real date.
  return toIsoDate(parseIsoDate(value)) === value;
}

export function isClockTime(value: unknown): value is ClockTime {
  return typeof value === 'string' && CLOCK_TIME.test(value);
}

// ---------- calendar dates ----------

/** The local calendar date of a `Date`, as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): IsoDate {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

/** Local midnight on an ISO date. Parsing is local, never UTC. */
export function parseIsoDate(date: IsoDate): Date {
  const parts = date.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/** The calendar date now, ignoring the after-midnight rule. */
export function today(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

/** True between midnight and `SMALL_HOURS_UNTIL`. */
export function isSmallHours(now: Date = new Date()): boolean {
  return now.getHours() < SMALL_HOURS_UNTIL;
}

/**
 * The day a person is logging right now. Before 4am that is the day that just
 * ended, because someone filling in their evening at 1am means yesterday.
 */
export function loggingDay(now: Date = new Date()): IsoDate {
  const when = new Date(now.getTime());
  if (isSmallHours(when)) when.setDate(when.getDate() - 1);
  return toIsoDate(when);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const shifted = parseIsoDate(date);
  shifted.setDate(shifted.getDate() + days);
  return toIsoDate(shifted);
}

export function previousDay(date: IsoDate): IsoDate {
  return addDays(date, -1);
}

export function nextDay(date: IsoDate): IsoDate {
  return addDays(date, 1);
}

/** Negative if `a` is earlier. ISO dates sort correctly as strings. */
export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortIsoDates(dates: readonly IsoDate[]): IsoDate[] {
  return [...dates].sort(compareIsoDates);
}

/** Whole days from `from` to `to`, negative if `to` is earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  // Round, because a DST boundary makes the span 23 or 25 hours.
  return Math.round(ms / 86_400_000);
}

/** Every date from `from` to `to`, inclusive. Empty if `to` is earlier. */
export function datesInRange(from: IsoDate, to: IsoDate): IsoDate[] {
  const range: IsoDate[] = [];
  for (let date = from; date <= to; date = nextDay(date)) range.push(date);
  return range;
}

// ---------- clock arithmetic ----------

/** Minutes since midnight, or null if the time is missing or malformed. */
export function toMinutes(time: ClockTime | '' | undefined | null): number | null {
  if (!isClockTime(time)) return null;
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

/** Minutes since midnight back to `HH:MM`, wrapping across midnight. */
export function fromMinutes(minutes: number): ClockTime {
  const wrapped = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return (
    String(Math.floor(wrapped / 60)).padStart(2, '0') +
    ':' +
    String(wrapped % 60).padStart(2, '0')
  );
}

/**
 * Minutes from `from` to `to`, crossing midnight when `to` is not later.
 * 23:00 to 07:00 is eight hours, not minus sixteen.
 */
export function spanMinutes(
  from: ClockTime | '' | undefined | null,
  to: ClockTime | '' | undefined | null,
): number | null {
  const start = toMinutes(from);
  let end = toMinutes(to);
  if (start === null || end === null) return null;
  if (end <= start) end += DAY_MINUTES;
  return end - start;
}

/**
 * Average of clock times that may straddle midnight: 23:40 and 00:20 average to
 * midnight, not to noon. Returns minutes since midnight, possibly fractional.
 */
export function averageClock(times: readonly (ClockTime | '' | undefined | null)[]): number | null {
  const values: number[] = [];
  for (const time of times) {
    const minutes = toMinutes(time);
    if (minutes !== null) values.push(minutes);
  }
  if (values.length === 0) return null;

  // A spread wider than twelve hours means the cluster wraps, so lift the
  // small-hours values above midnight before averaging.
  const wraps = Math.max(...values) - Math.min(...values) > DAY_MINUTES / 2;
  const used = wraps ? values.map((v) => (v < DAY_MINUTES / 2 ? v + DAY_MINUTES : v)) : values;
  const mean = used.reduce((a, b) => a + b, 0) / used.length;
  return mean % DAY_MINUTES;
}

// ---------- nearest prior ----------

export interface CarrySource<T> {
  /** The day the value came from. */
  date: IsoDate;
  value: T;
  /**
   * 'earlier' is the normal case. 'later' means nothing earlier had a value and
   * the caller should say so, because carrying a value backwards is a guess.
   */
  direction: 'earlier' | 'later';
}

/**
 * The value from the closest earlier day that had one — not the most recently
 * saved value. Skipped and blank days fall straight through, which is what makes
 * backfilling correct. See docs/01-module-contract.md on `carry: "nearestPrior"`.
 *
 * Only when no earlier day has a value does it look forward, and it says so.
 */
export function nearestPrior<T>(
  target: IsoDate,
  days: Readonly<Record<IsoDate, T>>,
  hasValue: (value: T, date: IsoDate) => boolean = () => true,
): CarrySource<T> | undefined {
  const dates = sortIsoDates(Object.keys(days));

  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i] as IsoDate;
    const value = days[date] as T;
    if (date < target && hasValue(value, date)) return { date, value, direction: 'earlier' };
  }

  for (const date of dates) {
    const value = days[date] as T;
    if (date > target && hasValue(value, date)) return { date, value, direction: 'later' };
  }

  return undefined;
}

/** The nearest earlier day with a record at all, whatever it contains. */
export function previousLoggedDay<T>(
  target: IsoDate,
  days: Readonly<Record<IsoDate, T>>,
): IsoDate | undefined {
  const dates = sortIsoDates(Object.keys(days));
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i] as IsoDate;
    if (date < target) return date;
  }
  return undefined;
}

// ---------- formatting ----------
// Ported verbatim so report output stays byte-identical to the monolith's under
// the Milestone 1 parity tests. Locale-dependent date formatting belongs with the
// design system and is not here.

/** `09:30` to `9:30am`, `08:00` to `8am`. Empty string for a missing time. */
export function formatClockTime(time: ClockTime | '' | undefined | null): string {
  if (!isClockTime(time)) return '';
  const parts = time.split(':');
  const hour = Number(parts[0]);
  const minute = parts[1] as string;
  const suffix = hour < 12 ? 'am' : 'pm';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return hour12 + (minute === '00' ? '' : ':' + minute) + suffix;
}

/** `435` to `7h 15m`, `420` to `7h`. Empty string for null. */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours + 'h' + (rest ? ' ' + rest + 'm' : '');
}
