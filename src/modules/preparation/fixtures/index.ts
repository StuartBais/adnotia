// Fixtures: nothing, a few entries, and a couple of months of them.

import type { ModuleFixtures } from '../../../kernel/index';
import type { PreparationDay, PreparationSlice } from '../entries';

const WHERE = ['work', 'home', 'admin', 'social', 'study'];

function slice(days: PreparationSlice['days'], childhood?: string): PreparationSlice {
  return { version: 1, days: days ?? {}, ...(childhood === undefined ? {} : { childhood }) };
}

export const empty = slice({});

export const threeDays = slice(
  {
    '2026-09-02': {
      entries: [
        {
          id: 'a',
          where: 'work',
          what: 'Missed the deadline because I did not open the email for nine days.',
          before: 'Knew it was there. Could not make myself look at it.',
          cost: 'Had to ask for an extension in front of the team.',
        },
      ],
    },
    '2026-09-03': {
      entries: [
        { id: 'b', where: 'admin', what: 'Third late fee this year on the same bill.' },
        {
          id: 'c',
          where: 'home',
          what: 'Started painting the hallway. Stopped at one wall, four weeks ago.',
        },
      ],
    },
  },
  'Mum found two school reports. 1998: "capable but will not settle". 2000: "talks constantly".',
);

/** Two months, unevenly, because that is what a real one looks like. */
export const thirtyDays = slice(
  Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      // Nothing on most days; a cluster in the third week.
      if (index % 4 !== 0 && !(index >= 14 && index <= 17)) return null;
      const day = String(index + 1).padStart(2, '0');
      return [
        `2026-09-${day}`,
        {
          entries: [
            {
              id: `e${index}`,
              where: WHERE[index % WHERE.length] as string,
              what: `Something specific that happened on day ${index + 1}.`,
              ...(index % 3 === 0 ? { before: 'Straight after something else.' } : {}),
              ...(index % 5 === 0 ? { cost: 'An evening.' } : {}),
            },
          ],
        },
      ] as [string, PreparationDay];
    }).filter((entry): entry is [string, PreparationDay] => entry !== null),
  ),
  'Two school reports, and my sister remembers me losing everything.',
);

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
