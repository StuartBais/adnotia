import type { ModuleFixtures } from '../../../kernel/index';
import type { ObservationDay, ObservationsSlice } from '../entries';

function slice(days: ObservationsSlice['days'] = {}): ObservationsSlice {
  return { version: 1, days };
}

export const empty = slice();

export const threeDays = slice({
  '2026-09-02': {
    entries: [
      {
        id: 'a',
        where: 'home',
        what: 'Asked three times to put shoes on. Still barefoot twenty minutes later, then upset that we were late.',
        before: 'Straight off the tablet.',
        helped: 'Doing it with him rather than asking again.',
      },
    ],
  },
  '2026-09-04': {
    entries: [
      {
        id: 'b',
        where: 'school',
        what: 'Note home: did not finish any of the written work again.',
      },
      { id: 'c', where: 'out', what: 'Ran off in the supermarket. Third time this month.' },
    ],
  },
});

/** Uneven, from more than one setting, because that is what assessment asks about. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      if (index % 3 !== 0 && !(index >= 12 && index <= 15)) return null;
      const day = String(index + 1).padStart(2, '0');
      const where = ['home', 'school', 'out', 'family'][index % 4] as string;
      return [
        `2026-09-${day}`,
        {
          entries: [
            {
              id: `e${index}`,
              where,
              what: `Something specific that happened on day ${index + 1}.`,
              ...(index % 4 === 0 ? { before: 'A change of plan.' } : {}),
              ...(index % 6 === 0 ? { helped: 'Nothing did.' } : {}),
            },
          ],
        },
      ] as [string, ObservationDay];
    }).filter((entry): entry is [string, ObservationDay] => entry !== null),
  ),
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
