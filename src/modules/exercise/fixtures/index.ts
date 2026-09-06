import type { ModuleFixtures } from '../../../kernel/index';
import type { ExerciseSlice } from '../state';

function slice(days: ExerciseSlice['days'] = {}): ExerciseSlice {
  return { version: 1, days };
}

export const empty = slice();

export const threeDays = slice({
  '2026-09-02': {
    moved: [{ id: 'a', kind: 'walk', minutes: 25, note: 'Head was quieter afterwards' }],
  },
  '2026-09-04': { moved: [{ id: 'b', kind: 'gym', minutes: 45 }] },
});

/** Gaps, and nothing anywhere marks them. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      if (index % 4 === 2 || index % 7 === 3) return null;
      const day = String(index + 1).padStart(2, '0');
      const kind = ['walk', 'cycle', 'housework', 'run'][index % 4] as string;
      return [
        `2026-09-${day}`,
        { moved: [{ id: `m${index}`, kind, minutes: 15 + (index % 5) * 10 }] },
      ] as [string, { moved: { id: string; kind: string; minutes: number }[] }];
    }).filter(
      (entry): entry is [string, { moved: { id: string; kind: string; minutes: number }[] }] =>
        entry !== null,
    ),
  ),
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
