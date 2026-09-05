// Which days a report covers.
//
// Ported from the monolith's inRange, including the part that is easy to get
// wrong: the range runs from the first entry inside the window to the last, not
// from the window's own edges. Ten days logged out of a chosen ninety is not
// "11% coverage" — it is however many days actually separate the first entry
// from the last. A person who logs a fortnight and then picks "everything
// logged" should not be told their record is thin.

import { addDays, datesInRange, sortIsoDates, today, type IsoDate } from '../dates/index';
import type { Coverage, Range, RangeChoice } from './types';

export interface RangeOptions {
  choice: RangeChoice;
  /** Every day with anything recorded, in any order. */
  logged: readonly IsoDate[];
  now?: Date;
  lastAppointment?: IsoDate;
}

const EMPTY: Range = { choice: 'all', from: '', to: '', dates: [], logged: [] };

export function resolveRange(options: RangeOptions): Range {
  const { choice } = options;
  const all = sortIsoDates(options.logged);

  let kept = all;
  let sinceAppointment: IsoDate | undefined;

  if (choice === 'since') {
    // With no appointment recorded there is nothing to date from, so "since the
    // last appointment" means everything rather than nothing.
    if (options.lastAppointment !== undefined && options.lastAppointment !== '') {
      sinceAppointment = options.lastAppointment;
      kept = all.filter((date) => date > options.lastAppointment!);
    }
  } else if (typeof choice === 'number') {
    const cutoff = addDays(today(options.now ?? new Date()), -(choice - 1));
    kept = all.filter((date) => date >= cutoff);
  }

  const from = kept[0];
  const to = kept[kept.length - 1];
  if (from === undefined || to === undefined) return { ...EMPTY, choice };

  const range: Range = { choice, from, to, dates: datesInRange(from, to), logged: kept };
  if (sinceAppointment !== undefined) range.sinceAppointment = sinceAppointment;
  return range;
}

export function coverageOf(range: Range): Coverage {
  const ofDays = range.dates.length;
  const logged = range.logged.length;
  return {
    logged,
    ofDays,
    percent: ofDays === 0 ? 0 : Math.round((logged / ofDays) * 100),
  };
}
