import { addDays } from '../../../kernel/dates';
import type { Routine, RoutineBook, RoutineRun } from '..';

export const empty: RoutineBook = {};

const date = '2026-11-18';
const at = (time: string, day = date) => new Date(`${day}T${time}`).toISOString();

const morning: Routine = {
  id: 'morning',
  title: 'Leave the house',
  createdAt: at('07:00', '2026-11-01'),
  anchor: { kind: 'event', text: 'after breakfast' },
  steps: [
    { id: 'keys', title: 'Keys, wallet, phone' },
    { id: 'bag', title: 'Bag by the door', minutes: 2 },
    { id: 'lights', title: 'Lights off' },
  ],
};

const sams: Routine = {
  id: 'sam-morning',
  title: "Sam's morning",
  createdAt: at('07:00', '2026-11-01'),
  anchor: { kind: 'time', time: '07:15' },
  steps: ['Get dressed', 'Breakfast', 'Teeth', 'Shoes', 'Bag'].map((title, i) => ({
    id: `sam-${i}`,
    title,
  })),
};

/** A parent part-way through their own routine, and Sam two steps into his. */
export const smallDay: RoutineBook = {
  self: {
    routines: [morning],
    runs: [
      {
        id: 'run-self',
        routineId: 'morning',
        date,
        startedAt: at('08:10'),
        ticked: [{ stepId: 'keys', at: at('08:11') }],
      },
    ],
  },
  'child:sam': {
    routines: [sams],
    runs: [
      {
        id: 'run-sam',
        routineId: 'sam-morning',
        date,
        startedAt: at('07:15'),
        ticked: [
          { stepId: 'sam-0', at: at('07:20') },
          { stepId: 'sam-1', at: at('07:40') },
        ],
      },
    ],
  },
};

const evening: Routine = {
  id: 'evening',
  title: 'Night before',
  createdAt: at('21:00', '2026-10-24'),
  anchor: { kind: 'time', time: '21:30' },
  steps: [
    { id: 'clothes', title: 'Clothes out' },
    { id: 'charge', title: 'Phone on charge' },
    { id: 'tomorrow', title: 'Look at tomorrow' },
  ],
};

// Thirty evenings. Some runs tick every step and some tick one; a few days have
// no run at all. None of that is recorded anywhere except as what was ticked.
const runs: RoutineRun[] = Array.from({ length: 30 }, (_, i) => i)
  .filter((i) => i % 7 !== 3)
  .map((i): RoutineRun => {
    const day = addDays('2026-10-25', i);
    const steps = i % 4 === 0 ? ['clothes'] : ['clothes', 'charge', 'tomorrow'];
    return {
      id: `run-${day}`,
      routineId: 'evening',
      date: day,
      startedAt: at('21:30', day),
      ticked: steps.map((stepId, n) => ({ stepId, at: at(`21:3${n + 1}`, day) })),
      finishedAt: at('21:40', day),
    };
  });

export const thirtyDays: RoutineBook = { self: { routines: [evening], runs } };
