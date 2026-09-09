// Fixtures: nothing, a little, and enough for the estimate check to have
// something to say.

import type { ModuleFixtures } from '../../../kernel/index';
import type { PlanningSlice } from '../state';

function slice(over: Partial<PlanningSlice> = {}): PlanningSlice {
  return { version: 1, ...over };
}

export const empty = slice();

export const threeDays = slice({
  plans: {
    '2026-09-02': {
      items: [
        { id: 'p1', text: 'Ring the surgery', at: '09:30' },
        { id: 'p2', text: 'Open the tax letter' },
      ],
    },
  },
  tasks: [
    {
      id: 't1',
      title: 'Do the tax return',
      created: '2026-09-02',
      steps: [
        { id: 's1', text: 'Find last year’s one in the drawer', done: true },
        { id: 's2', text: 'Log in and see what it asks for' },
        { id: 's3', text: 'Fill in the first page' },
      ],
    },
  ],
  estimates: [
    { id: 'e1', title: 'Reply to the email', minutes: 5, actual: 25, date: '2026-09-02' },
  ],
  intentions: [{ id: 'i1', cue: 'I put the kettle on', action: 'I take the tablet out' }],
  days: { '2026-09-02': { held: 'some' }, '2026-09-03': { held: 'other' } },
});

/** Enough timed estimates that the reality check has something to report. */
export const thirtyDays = slice({
  plans: Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      if (index % 3 !== 0) return null;
      const day = String(index + 1).padStart(2, '0');
      return [
        `2026-09-${day}`,
        { items: [{ id: `p${index}`, text: `Something planned on day ${index + 1}` }] },
      ] as [string, { items: { id: string; text: string }[] }];
    }).filter(
      (entry): entry is [string, { items: { id: string; text: string }[] }] => entry !== null,
    ),
  ),
  estimates: Array.from({ length: 8 }, (_, index) => ({
    id: `e${index}`,
    title: `A job on day ${index + 1}`,
    minutes: 10 + index * 5,
    // Consistently longer than guessed, which is the point of the tool.
    actual: Math.round((10 + index * 5) * 1.6),
    date: `2026-09-${String(index + 1).padStart(2, '0')}`,
  })),
  /*
   * A task with one of its steps promoted into a thing of its own, because that
   * is a shape the breaking-down tool has to render and nothing else here makes
   * one. The parent keeps the step and the step points at the new task; see
   * `promote` in state.ts for why the step is not removed.
   */
  tasks: [
    {
      id: 'bigT',
      title: 'Sort out the spare room',
      created: '2026-09-01',
      steps: [
        { id: 'bigS1', text: 'Take the boxes to the tip', done: true },
        { id: 'bigS2', text: 'Deal with the paperwork', taskId: 'bigT2' },
        { id: 'bigS3', text: 'Put the bed back together' },
      ],
    },
    {
      id: 'bigT2',
      title: 'Deal with the paperwork',
      created: '2026-09-04',
      parent: 'bigT',
      steps: [{ id: 'bigS4', text: 'Find the folder' }],
    },
  ],
  days: Object.fromEntries(
    Array.from({ length: 30 }, (_, index) => {
      if (index % 4 !== 0) return null;
      const day = String(index + 1).padStart(2, '0');
      const held = ['followed', 'some', 'other'][index % 3] as string;
      // Some days carry stretches of focus as well, so the log and the history
      // are rendered against them rather than only against a day with none.
      // Uneven on purpose: a fixture where every day looks the same is a fixture
      // that never finds anything.
      const focus =
        index % 8 === 0
          ? [
              { id: `f${index}a`, minutes: 25, label: 'Deal with the paperwork', taskId: 'bigT2' },
              { id: `f${index}b`, minutes: 12, label: '' },
            ]
          : undefined;
      return [`2026-09-${day}`, focus === undefined ? { held } : { held, focus }] as [
        string,
        { held: string; focus?: { id: string; minutes: number; label: string; taskId?: string }[] },
      ];
    }).filter(
      (
        entry,
      ): entry is [
        string,
        { held: string; focus?: { id: string; minutes: number; label: string; taskId?: string }[] },
      ] => entry !== null,
    ),
  ),
});

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
