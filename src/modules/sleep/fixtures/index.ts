// Fixtures: zero days, three days and thirty days. Every module ships these and
// the smoke test runs every contribution against each. See
// docs/01-module-contract.md "Testing a module".

import type { ModuleFixtures } from '../../../kernel/index';

interface SleepDay {
  bed?: string;
  wake?: string;
  hours?: string;
  quality?: string[];
  latency?: string;
  note?: string;
}

function slice(days: Record<string, SleepDay>): {
  version: number;
  days: Record<string, SleepDay>;
} {
  return { version: 1, days };
}

export const empty = slice({});

export const threeDays = slice({
  '2026-09-02': { bed: '23:40', wake: '07:00', hours: '7.25', quality: ['latency'], latency: '45' },
  // A night with the times but nothing else noted.
  '2026-09-03': { bed: '00:20', wake: '06:45', hours: '6.5', quality: [] },
  '2026-09-04': {
    bed: '23:10',
    wake: '07:30',
    hours: '7.5',
    quality: ['waking', 'groggy'],
    note: 'Woke around three and stayed awake a while.',
  },
});

/** Thirty days with gaps, because a real record has them. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      // Days 7, 8 and 19 are missing entirely.
      if ([7, 8, 19].includes(index + 1)) return null;
      const bedHour = 22 + (index % 3);
      const record: SleepDay = {
        bed: `${String(bedHour).padStart(2, '0')}:${index % 2 === 0 ? '30' : '50'}`,
        wake: `0${6 + (index % 2)}:${index % 3 === 0 ? '15' : '45'}`,
        quality: index % 4 === 0 ? ['latency'] : index % 5 === 0 ? ['waking'] : [],
      };
      if (index % 4 === 0) record.latency = String(30 + (index % 3) * 15);
      return [`2026-09-${day}`, record];
    }).filter((entry): entry is [string, SleepDay] => entry !== null),
  ),
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
