import type { ModuleFixtures } from '../../../kernel/index';
import type { MindfulnessSlice } from '../state';

function slice(days: MindfulnessSlice['days'] = {}): MindfulnessSlice {
  return { version: 1, days };
}

export const empty = slice();

export const threeDays = slice({
  '2026-09-02': { sessions: [{ id: 'a', practice: 'three-minutes', minutes: 3 }] },
  '2026-09-04': {
    sessions: [
      { id: 'b', practice: 'body-scan', minutes: 10 },
      { id: 'c', practice: 'noting', minutes: 5 },
    ],
  },
});

/** Uneven on purpose: a real practice log has gaps and nothing marks them. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      if (index % 3 === 1) return null;
      const day = String(index + 1).padStart(2, '0');
      const practice = ['three-minutes', 'noting', 'body-scan'][index % 3] as string;
      const minutes = [3, 5, 10][index % 3] as number;
      return [`2026-09-${day}`, { sessions: [{ id: `s${index}`, practice, minutes }] }] as [
        string,
        { sessions: { id: string; practice: string; minutes: number }[] },
      ];
    }).filter(
      (
        entry,
      ): entry is [string, { sessions: { id: string; practice: string; minutes: number }[] }] =>
        entry !== null,
    ),
  ),
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
