import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  averageClock,
  formatClockTime,
  formatDuration,
  loggingDay,
  spanMinutes,
  toIsoDate,
  toMinutes,
} from '../../src/kernel/dates/index';

// Parity with reference/adnotia-v0-monolith.html.
//
// The kernel's date service is a port, so it is checked against the original
// rather than against a second reading of it. The monolith's helpers are lifted
// out of the file and run side by side with ours over generated input.
//
// See reference/README.md "What to port" and docs/05-architecture.md
// "Testing strategy".

const monolith = readFileSync(
  resolve(process.cwd(), 'reference/adnotia-v0-monolith.html'),
  'utf8',
);

/** Lift one function declaration out of the monolith by matching its braces. */
function extract(name: string): string {
  const start = monolith.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`The monolith has no function ${name}`);

  let depth = 0;
  for (let i = monolith.indexOf('{', start); i < monolith.length; i++) {
    if (monolith[i] === '{') depth++;
    else if (monolith[i] === '}') {
      depth--;
      if (depth === 0) return monolith.slice(start, i + 1);
    }
  }
  throw new Error(`Unbalanced braces in ${name}`);
}

interface MonolithDates {
  iso: (d: Date) => string;
  mins: (t: string) => number | null;
  spanMins: (from: string, to: string) => number | null;
  durTxt: (m: number | null) => string;
  hhmm: (t: string) => string;
  avgClock: (list: readonly string[]) => number | null;
  logDate: () => string;
}

const NAMES = ['iso', 'mins', 'spanMins', 'durTxt', 'hhmm', 'avg', 'avgClock', 'isSmallHours', 'logDate'];
const source = NAMES.map(extract).join('\n');

/** The monolith's helpers, with `new Date()` frozen at `now`. */
function monolithDates(now: Date): MonolithDates {
  class FrozenDate extends Date {
    constructor(value?: number) {
      super(value === undefined ? now.getTime() : value);
    }
  }
  const build = new Function('Date', `${source}\nreturn { ${NAMES.join(', ')} };`) as (
    d: unknown,
  ) => MonolithDates;
  return build(FrozenDate);
}

const v0 = monolithDates(new Date());

// ---------- generated input ----------

const CLOCK_TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 1, 15, 30, 45, 59]) {
    CLOCK_TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

describe('parity with the monolith', () => {
  it('lifted every helper it needs', () => {
    expect(source).toContain('function iso(');
    expect(source).toContain('function avgClock(');
    expect(source).toContain('function logDate(');
  });

  it('reads calendar dates identically', () => {
    for (let day = 0; day < 800; day += 7) {
      const date = new Date(2025, 0, 1 + day, 13, 45);
      expect(toIsoDate(date)).toBe(v0.iso(date));
    }
  });

  it('applies the after-midnight rule identically', () => {
    for (let day = 0; day < 400; day += 3) {
      for (const hour of [0, 1, 3, 4, 5, 12, 23]) {
        const now = new Date(2026, 0, 1 + day, hour, 30);
        expect(loggingDay(now)).toBe(monolithDates(now).logDate());
      }
    }
  });

  it('converts times to minutes identically', () => {
    for (const time of CLOCK_TIMES) {
      expect(toMinutes(time)).toBe(v0.mins(time));
    }
  });

  it('measures spans across midnight identically', () => {
    for (const from of CLOCK_TIMES) {
      for (const to of CLOCK_TIMES) {
        expect(spanMinutes(from, to)).toBe(v0.spanMins(from, to));
      }
    }
  });

  it('averages clock times identically, straddling midnight or not', () => {
    for (let i = 0; i < CLOCK_TIMES.length; i++) {
      for (let j = 0; j < CLOCK_TIMES.length; j += 7) {
        const pair = [CLOCK_TIMES[i] as string, CLOCK_TIMES[j] as string];
        expect(averageClock(pair)).toBe(v0.avgClock(pair));

        const triple = [...pair, CLOCK_TIMES[(i + j) % CLOCK_TIMES.length] as string];
        expect(averageClock(triple)).toBe(v0.avgClock(triple));
      }
    }
  });

  it('writes clock times identically', () => {
    for (const time of CLOCK_TIMES) {
      expect(formatClockTime(time)).toBe(v0.hhmm(time));
    }
  });

  it('writes durations identically', () => {
    for (let minutes = 0; minutes <= 2880; minutes++) {
      expect(formatDuration(minutes)).toBe(v0.durTxt(minutes));
    }
  });

  it('agrees on a missing value being empty', () => {
    expect(formatClockTime('')).toBe(v0.hhmm(''));
    expect(formatDuration(null)).toBe(v0.durTxt(null));
    expect(toMinutes('')).toBe(v0.mins(''));
    expect(spanMinutes('', '08:00')).toBe(v0.spanMins('', '08:00'));
  });
});
