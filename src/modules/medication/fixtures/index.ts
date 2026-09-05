// Fixtures: zero days, three days and thirty days.
//
// The thirty-day one is built to look like a real record rather than a tidy
// one: gaps, a dose change part-way through, days where only some of it was
// filled in, and a stretch of flat ratings.

import type { ModuleFixtures } from '../../../kernel/index';
import type { MedicationDay } from '../records';

function slice(days: Record<string, MedicationDay>): {
  version: number;
  days: Record<string, MedicationDay>;
} {
  return { version: 1, days };
}

export const empty = slice({});

export const threeDays = slice({
  '2026-09-02': {
    med: 'Elvanse',
    dose: '30',
    unit: 'mg',
    times: ['08:00'],
    adherence: 'ontime',
    focus: 3,
    mood: 3,
    onset: '09:30',
    woreOff: '15:00',
    rebound: 'mild',
    reboundTime: '16:00',
    appetite: 'reduced',
    heart: 'fine',
    side: ['dry'],
    detail: { dry: { sev: 'mild', time: '11:00', note: '', bpm: '' } },
  },
  // A day where the dose was taken late and little else was filled in.
  '2026-09-03': {
    med: 'Elvanse',
    dose: '30',
    unit: 'mg',
    times: ['08:00'],
    adherence: 'late',
    focus: 2,
    mood: 2,
  },
  '2026-09-04': {
    med: 'Elvanse',
    dose: '50',
    unit: 'mg',
    times: ['08:00'],
    adherence: 'ontime',
    focus: 4,
    mood: 3,
    onset: '09:30',
    woreOff: '16:30',
    rebound: 'none',
    appetite: 'reduced',
    heart: 'fine',
    side: ['dry', 'jitters'],
    detail: {
      dry: { sev: 'mild', time: '11:00', note: '', bpm: '' },
      jitters: { sev: 'moderate', time: '10:00', note: 'Worst in the first hour', bpm: '' },
    },
  },
});

/** Thirty days: a dose change on the 11th, three missing days, one flat week. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      if ([6, 7, 22].includes(day)) return null;

      const date = `2026-09-${String(day).padStart(2, '0')}`;
      const higher = day >= 11;
      const record: MedicationDay = {
        med: 'Elvanse',
        dose: higher ? '50' : '30',
        unit: 'mg',
        times: day >= 20 ? ['08:00', '14:00'] : ['08:00'],
        adherence: day % 9 === 0 ? 'late' : 'ontime',
        // Days 12 to 18 sit flat at 3, which the mirror should notice.
        focus: day >= 12 && day <= 18 ? 3 : ((day % 5) as number) + 1,
        mood: day >= 12 && day <= 18 ? 3 : ((day % 4) as number) + 1,
        onset: '09:30',
        woreOff: higher ? '16:30' : '15:00',
        appetite: day % 3 === 0 ? 'reduced' : 'normal',
        heart: 'fine',
      };

      if (day % 4 === 0) {
        record.side = ['dry'];
        record.detail = { dry: { sev: day % 8 === 0 ? 'moderate' : 'mild', time: '11:00' } };
      }
      if (day % 7 === 0) {
        record.rebound = 'mild';
        record.reboundTime = '17:00';
      }
      return [date, record];
    }).filter((entry): entry is [string, MedicationDay] => entry !== null),
  ),
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
