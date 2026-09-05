import { describe, expect, it } from 'vitest';
import {
  addDays,
  averageClock,
  compareIsoDates,
  datesInRange,
  daysBetween,
  formatClockTime,
  formatDuration,
  fromMinutes,
  isClockTime,
  isIsoDate,
  isSmallHours,
  loggingDay,
  nearestPrior,
  parseIsoDate,
  previousDay,
  previousLoggedDay,
  sortIsoDates,
  spanMinutes,
  toIsoDate,
  toMinutes,
  today,
} from '../../src/kernel/dates/index';

describe('ISO dates', () => {
  it('reads the local calendar date, not the UTC one', () => {
    // 23:30 local on the 4th is still the 4th, whatever UTC thinks.
    expect(toIsoDate(new Date(2026, 8, 4, 23, 30))).toBe('2026-09-04');
    expect(toIsoDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('pads months and days', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('round-trips through parse', () => {
    expect(toIsoDate(parseIsoDate('2026-09-04'))).toBe('2026-09-04');
  });

  it('parses to local midnight', () => {
    const parsed = parseIsoDate('2026-09-04');
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getDate()).toBe(4);
    expect(parsed.getMonth()).toBe(8);
  });

  it('recognises a well-formed date', () => {
    expect(isIsoDate('2026-09-04')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true); // 2028 is a leap year
  });

  it('rejects malformed and impossible dates', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-9-4')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate(20260904)).toBe(false);
  });

  it('sorts and compares as calendar order', () => {
    expect(compareIsoDates('2026-09-04', '2026-09-05')).toBeLessThan(0);
    expect(compareIsoDates('2026-09-05', '2026-09-05')).toBe(0);
    expect(sortIsoDates(['2026-10-01', '2026-09-30', '2026-09-04'])).toEqual([
      '2026-09-04',
      '2026-09-30',
      '2026-10-01',
    ]);
  });

  it('does not mutate the array it sorts', () => {
    const input = ['2026-10-01', '2026-09-30'];
    sortIsoDates(input);
    expect(input).toEqual(['2026-10-01', '2026-09-30']);
  });
});

describe('the logging day', () => {
  it('is today during waking hours', () => {
    expect(loggingDay(new Date(2026, 8, 4, 21, 30))).toBe('2026-09-04');
    expect(loggingDay(new Date(2026, 8, 4, 4, 0))).toBe('2026-09-04');
  });

  it('is yesterday before 4am, because that is the day that just ended', () => {
    expect(loggingDay(new Date(2026, 8, 5, 1, 15))).toBe('2026-09-04');
    expect(loggingDay(new Date(2026, 8, 5, 3, 59))).toBe('2026-09-04');
    expect(loggingDay(new Date(2026, 8, 5, 0, 0))).toBe('2026-09-04');
  });

  it('crosses a month boundary before 4am', () => {
    expect(loggingDay(new Date(2026, 9, 1, 2, 0))).toBe('2026-09-30');
  });

  it('crosses a year boundary before 4am', () => {
    expect(loggingDay(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31');
  });

  it('differs from the plain calendar date only in the small hours', () => {
    const smallHours = new Date(2026, 8, 5, 2, 0);
    expect(isSmallHours(smallHours)).toBe(true);
    expect(today(smallHours)).toBe('2026-09-05');
    expect(loggingDay(smallHours)).toBe('2026-09-04');

    const evening = new Date(2026, 8, 5, 22, 0);
    expect(isSmallHours(evening)).toBe(false);
    expect(today(evening)).toBe(loggingDay(evening));
  });

  it('does not mutate the date it is given', () => {
    const now = new Date(2026, 8, 5, 1, 0);
    loggingDay(now);
    expect(now.getDate()).toBe(5);
  });
});

describe('day arithmetic', () => {
  it('adds and subtracts across month and year ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
    expect(addDays('2026-09-04', 0)).toBe('2026-09-04');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-09-04', '2026-09-05')).toBe(1);
    expect(daysBetween('2026-09-05', '2026-09-04')).toBe(-1);
    expect(daysBetween('2026-09-04', '2026-09-04')).toBe(0);
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('counts whole days across a daylight-saving boundary', () => {
    // Whatever the host timezone, a day is a day.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('lists an inclusive range', () => {
    expect(datesInRange('2026-09-04', '2026-09-06')).toEqual([
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(datesInRange('2026-09-04', '2026-09-04')).toEqual(['2026-09-04']);
    expect(datesInRange('2026-09-06', '2026-09-04')).toEqual([]);
  });
});

describe('clock times', () => {
  it('converts to and from minutes since midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('08:00')).toBe(480);
    expect(toMinutes('23:59')).toBe(1439);
    expect(fromMinutes(480)).toBe('08:00');
    expect(fromMinutes(1439)).toBe('23:59');
  });

  it('wraps minutes outside a day', () => {
    expect(fromMinutes(1440)).toBe('00:00');
    expect(fromMinutes(1500)).toBe('01:00');
    expect(fromMinutes(-60)).toBe('23:00');
  });

  it('returns null for a missing or malformed time', () => {
    expect(toMinutes('')).toBeNull();
    expect(toMinutes(undefined)).toBeNull();
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes('9:30')).toBeNull();
    expect(toMinutes('24:00')).toBeNull();
    expect(toMinutes('08:60')).toBeNull();
  });

  it('recognises a well-formed time', () => {
    expect(isClockTime('00:00')).toBe(true);
    expect(isClockTime('23:59')).toBe(true);
    expect(isClockTime('24:00')).toBe(false);
    expect(isClockTime('8:00')).toBe(false);
  });
});

describe('spans that cross midnight', () => {
  it('measures forward within a day', () => {
    expect(spanMinutes('09:30', '16:30')).toBe(420);
  });

  it('measures a night, not a negative day', () => {
    expect(spanMinutes('23:00', '07:00')).toBe(480);
    expect(spanMinutes('23:40', '07:00')).toBe(440);
  });

  it('treats equal times as a full day', () => {
    expect(spanMinutes('08:00', '08:00')).toBe(1440);
  });

  it('is null when either end is missing', () => {
    expect(spanMinutes('', '07:00')).toBeNull();
    expect(spanMinutes('23:00', '')).toBeNull();
    expect(spanMinutes(undefined, undefined)).toBeNull();
  });
});

describe('averaging clock times', () => {
  it('averages times inside one day', () => {
    expect(averageClock(['08:00', '10:00'])).toBe(540);
  });

  it('averages times that straddle midnight', () => {
    // 23:40 and 00:20 average to midnight, not to noon.
    expect(averageClock(['23:40', '00:20'])).toBe(0);
    expect(averageClock(['23:00', '01:00'])).toBe(0);
  });

  it('ignores missing and malformed entries', () => {
    expect(averageClock(['08:00', '', null, undefined, '10:00'])).toBe(540);
  });

  it('is null when nothing is usable', () => {
    expect(averageClock([])).toBeNull();
    expect(averageClock(['', null])).toBeNull();
  });

  it('handles a single time', () => {
    expect(averageClock(['07:15'])).toBe(435);
  });
});

describe('nearestPrior', () => {
  const days = {
    '2026-09-01': { dose: '30' },
    '2026-09-03': { dose: '' },
    '2026-09-06': { dose: '50' },
  };
  const prescribed = (day: { dose: string }) => day.dose !== '';

  it('takes the closest earlier day that had a value', () => {
    const found = nearestPrior('2026-09-07', days, prescribed);
    expect(found).toEqual({
      date: '2026-09-06',
      value: { dose: '50' },
      direction: 'earlier',
    });
  });

  it('falls straight through skipped and blank days', () => {
    // The 3rd is logged but records no dose, so the 1st is the source.
    const found = nearestPrior('2026-09-05', days, prescribed);
    expect(found?.date).toBe('2026-09-01');
  });

  it('never takes the target day itself', () => {
    expect(nearestPrior('2026-09-06', days, prescribed)?.date).toBe('2026-09-01');
  });

  it('looks forward only when nothing earlier has a value, and says so', () => {
    // Nothing precedes the 30th of August, so the value is carried backwards
    // from the 1st. That is a guess, and the direction says as much.
    const found = nearestPrior('2026-08-30', days, prescribed);
    expect(found).toEqual({
      date: '2026-09-01',
      value: { dose: '30' },
      direction: 'later',
    });
  });

  it('prefers an earlier day even when a later one is closer', () => {
    expect(nearestPrior('2026-09-05', days, prescribed)?.direction).toBe('earlier');
  });

  it('is undefined when no day anywhere has a value', () => {
    expect(nearestPrior('2026-09-05', { '2026-09-01': { dose: '' } }, prescribed)).toBeUndefined();
    expect(nearestPrior('2026-09-05', {}, prescribed)).toBeUndefined();
  });

  it('accepts every day when no predicate is given', () => {
    expect(nearestPrior('2026-09-05', days)?.date).toBe('2026-09-03');
  });
});

describe('previousLoggedDay', () => {
  const days = { '2026-09-01': 1, '2026-09-04': 2, '2026-09-06': 3 };

  it('is the nearest earlier day with a record, whatever it holds', () => {
    expect(previousLoggedDay('2026-09-05', days)).toBe('2026-09-04');
    expect(previousLoggedDay('2026-09-04', days)).toBe('2026-09-01');
  });

  it('is undefined when there is nothing earlier', () => {
    expect(previousLoggedDay('2026-09-01', days)).toBeUndefined();
    expect(previousLoggedDay('2026-09-05', {})).toBeUndefined();
  });
});

describe('formatting', () => {
  it('writes clock times the way a person says them', () => {
    expect(formatClockTime('09:30')).toBe('9:30am');
    expect(formatClockTime('08:00')).toBe('8am');
    expect(formatClockTime('16:30')).toBe('4:30pm');
    expect(formatClockTime('00:00')).toBe('12am');
    expect(formatClockTime('12:00')).toBe('12pm');
    expect(formatClockTime('12:45')).toBe('12:45pm');
    expect(formatClockTime('')).toBe('');
  });

  it('writes durations in hours and minutes', () => {
    expect(formatDuration(420)).toBe('7h');
    expect(formatDuration(435)).toBe('7h 15m');
    expect(formatDuration(0)).toBe('0h');
    expect(formatDuration(59)).toBe('0h 59m');
    expect(formatDuration(null)).toBe('');
  });
});

describe('the worked example from the docs', () => {
  it('describes cover the way the clinical report does', () => {
    // "Cover 9:30am to 4:30pm, about 7h of a 17h waking day."
    const cover = spanMinutes('09:30', '16:30');
    const waking = spanMinutes('07:00', '00:00');
    expect(
      `Cover ${formatClockTime('09:30')} to ${formatClockTime('16:30')}, ` +
        `about ${formatDuration(cover)} of a ${formatDuration(waking)} waking day.`,
    ).toBe('Cover 9:30am to 4:30pm, about 7h of a 17h waking day.');
  });
});
