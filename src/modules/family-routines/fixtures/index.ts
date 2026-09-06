import type { ModuleFixtures } from '../../../kernel/index';
import type { RoutinesSlice } from '../state';

function slice(over: Partial<RoutinesSlice> = {}): RoutinesSlice {
  return { version: 1, ...over };
}

export const empty = slice();

export const threeDays = slice({
  routines: [
    {
      id: 'r1',
      name: 'Getting out in the morning',
      steps: [
        { id: 's1', text: 'Breakfast', at: '07:30' },
        { id: 's2', text: 'Teeth' },
        { id: 's3', text: 'Shoes on', at: '08:10' },
      ],
    },
  ],
  firstThen: { first: 'Shoes', then: 'Tablet' },
  chart: {
    earns: 'Getting dressed before breakfast',
    goal: 5,
    reward: 'Choosing Friday’s film',
    points: 2,
  },
});

export const thirtyDays = slice({
  routines: [
    {
      id: 'r1',
      name: 'Getting out in the morning',
      steps: [
        { id: 's1', text: 'Breakfast', at: '07:30' },
        { id: 's2', text: 'Teeth' },
        { id: 's3', text: 'Shoes on', at: '08:10' },
      ],
    },
    {
      id: 'r2',
      name: 'Bedtime',
      steps: [
        { id: 's4', text: 'Bath', at: '18:45' },
        { id: 's5', text: 'Story', at: '19:15' },
        { id: 's6', text: 'Lights out', at: '19:30' },
      ],
    },
  ],
  firstThen: { first: 'Shoes', then: 'Tablet' },
  chart: { earns: 'Getting dressed before breakfast', goal: 10, points: 7 },
});

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
