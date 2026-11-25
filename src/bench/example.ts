// The board's day, built on the real models, relative to the moment it is
// loaded (design/lantern/PROTOTYPE-PLAN.md section 11, "The example day and
// scenarios"). Loaded at 10:05 on Tuesday 24 November 2026 it is screen 1 of
// the board exactly: the email running at step 2 of 3 since 9:58, the dentist
// at 10:30, the park at 11:00 and the bank at 14:00.
//
// Everything is built through src/domains, never written as literal records,
// so the prototype exercises the same model the phone app will.

import * as model from '../domains/tasks';
import type { Task } from '../domains/tasks';
import * as routineModel from '../domains/routines';
import type { Shelf } from '../domains/routines';
import {
  SMALL_HOURS_UNTIL,
  fromMinutes,
  loggingDay,
  parseIsoDate,
  type IsoDate,
} from '../kernel/dates';

const MINUTE = 60_000;

export const EMAIL = 'Write the school email';

/** The ten from SPEC 5.2, in the person's own order. */
export const ANYTIME = [
  'Renew the parking permit',
  'Order printer ink',
  'Book the boiler service',
  'Pay the window cleaner',
  'Text Sam about Saturday',
  'Water the plants',
  'Find the passport',
  'Back up the photos',
  'Post the birthday card',
  'Sort the recycling',
] as const;

/** The day's booked items: offset from the first slot, title, length. */
const TIMED = [
  { after: 0, title: 'Call the dentist', minutes: 10 },
  { after: 30, title: 'Walk to the park', minutes: 20 },
  { after: 210, title: 'Ring the bank', minutes: 15 },
] as const;

/** The inbox, in the order things came in. */
const INBOX: readonly {
  title: string;
  steps?: readonly string[];
  estimate?: number;
  note?: string;
}[] = [
  { title: 'Birthday present for Mum' },
  { title: 'Cancel the gym trial', steps: ['Find the membership email', 'Ring the front desk'] },
  { title: 'Ask about the boiler quote', note: 'Thursday or Friday morning, before eleven' },
  {
    title: 'Look into swimming lessons',
    steps: ['Check the leisure centre times', 'Ask Sam which days work', 'Book a trial lesson'],
    estimate: 30,
  },
  { title: 'Return the library books', estimate: 15 },
  { title: 'Fix the bike light' },
];

/** Plain household routines. Minutes only where a step is timed. */
const ROUTINES: readonly { title: string; steps: readonly (readonly [string, number?])[] }[] = [
  {
    title: 'Morning',
    steps: [
      ['Open the curtains'],
      ['Drink a glass of water'],
      ['Shower'],
      ['Get dressed'],
      ['Breakfast'],
      ['Pack the bag'],
    ],
  },
  {
    title: 'Leaving the house',
    steps: [
      ['Keys, phone and wallet', 1],
      ['Put shoes on', 2],
      ['Coat on', 1],
      ['Lock the back door', 1],
    ],
  },
  {
    title: 'Evening wind-down',
    steps: [
      ["Lay out tomorrow's clothes"],
      ['Phone on charge'],
      ['Wash up'],
      ['Brush teeth'],
      ['Read for a bit'],
    ],
  },
  {
    title: 'Sunday reset',
    steps: [
      ['Strip the bed'],
      ['Put a wash on'],
      ['Clear out the fridge'],
      ["Plan the week's meals"],
      ['Take the recycling out'],
      ['Water the plants'],
      ['Look at next week'],
    ],
  },
];

/** 04:00 on a logging day: the moment that day begins. */
function dayStart(day: IsoDate): Date {
  const start = parseIsoDate(day);
  start.setHours(SMALL_HOURS_UNTIL, 0, 0, 0);
  return start;
}

/**
 * The first slot: the next :00 or :30 at least 20 minutes ahead. At 10:05 and
 * at 9:58 that is 10:30, as on the board.
 */
function firstSlot(now: Date): Date {
  const part = now.getSeconds() > 0 || now.getMilliseconds() > 0 ? 1 : 0;
  const ahead = now.getHours() * 60 + now.getMinutes() + part + 20;
  const slot = Math.ceil(ahead / 30) * 30;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, slot);
}

/** "Earlier today": two hours ago, but never before the logging day began. */
function earlierToday(now: Date): Date {
  const begun = dayStart(loggingDay(now)).getTime() + MINUTE;
  return new Date(Math.min(now.getTime() - MINUTE, Math.max(begun, now.getTime() - 120 * MINUTE)));
}

/** The id of the task a capture or addStep just appended. */
function last(tasks: readonly Task[]): string {
  const task = tasks[tasks.length - 1];
  if (task === undefined) throw new Error('Nothing was added');
  return task.id;
}

export interface ExampleDay {
  tasks: Task[];
  routines: Shelf;
  /** The email's id, for the scenarios that pause it. */
  email: string;
}

/**
 * The board's day at `now`. With `started: false` it is the same day before
 * anything was begun: no session, and the first step not done (screen 7 at 9:58).
 */
export function exampleDay(now: Date, options: { started?: boolean } = {}): ExampleDay {
  const started = options.started ?? true;
  const day = loggingDay(now);
  // Everything was written down before today began, one second apart, in the
  // order it came in, so ids and creation times follow the person's order.
  let made = dayStart(day).getTime() - 12 * 60 * MINUTE;
  const at = () => new Date((made += 1000));

  let tasks: Task[] = [];
  const add = (title: string, parent?: string): string => {
    tasks =
      parent === undefined
        ? model.capture(tasks, title, at())
        : model.addStep(tasks, parent, title, at());
    return last(tasks);
  };

  // The email: anytime today, first in the person's order.
  const email = add(EMAIL);
  tasks = model.schedule(tasks, email, { kind: 'anytime', date: day });
  tasks = model.setEstimate(tasks, email, 25);
  tasks = model.setNotes(tasks, email, 'When is the permission slip due?');
  const firstStep = add('Find the school address', email);
  add('Write the question', email);
  add('Read it once and send', email);

  // Later today. A slot that would end after 23:30 is left out.
  const first = firstSlot(now);
  const lastEnd = parseIsoDate(day).getTime() + (23 * 60 + 30) * MINUTE;
  for (const item of TIMED) {
    const start = new Date(first.getTime() + item.after * MINUTE);
    if (start.getTime() + item.minutes * MINUTE > lastEnd) continue;
    const id = add(item.title);
    tasks = model.schedule(tasks, id, {
      kind: 'timed',
      date: day,
      time: fromMinutes(start.getHours() * 60 + start.getMinutes()),
      durationMinutes: item.minutes,
    });
  }

  // Anytime today.
  for (const title of ANYTIME) {
    const id = add(title);
    tasks = model.schedule(tasks, id, { kind: 'anytime', date: day });
  }

  // Done earlier today.
  const bins = add('Bins out');
  tasks = model.schedule(tasks, bins, { kind: 'anytime', date: day });
  tasks = model.complete(tasks, bins, earlierToday(now));

  // The inbox.
  for (const item of INBOX) {
    const id = add(item.title);
    if (item.estimate !== undefined) tasks = model.setEstimate(tasks, id, item.estimate);
    if (item.note !== undefined) tasks = model.setNotes(tasks, id, item.note);
    for (const step of item.steps ?? []) add(step, id);
  }

  // Started at 9:58 when loaded at 10:05; the first step done at 10:02.
  if (started) {
    tasks = model.startWork(tasks, email, new Date(now.getTime() - 7 * MINUTE));
    tasks = model.complete(tasks, firstStep, new Date(now.getTime() - 3 * MINUTE));
  }

  return { tasks, routines: exampleRoutines(now, at), email };
}

function exampleRoutines(now: Date, at: () => Date): Shelf {
  let routines: routineModel.Routine[] = [];
  for (const routine of ROUTINES) {
    routines = routineModel.create(routines, routine.title, at());
    const id = routines[routines.length - 1]!.id;
    for (const [title, minutes] of routine.steps) {
      routines = routineModel.addStep(routines, id, title, at(), minutes);
    }
  }

  // Morning ran earlier today: every step ticked, then finished.
  const morning = routines[0]!;
  const ran = earlierToday(now);
  let runs = routineModel.startRun([], morning, ran);
  const run = runs[0]!.id;
  for (const step of morning.steps) {
    runs = routineModel.tickStep(runs, morning, run, step.id, ran);
  }
  runs = routineModel.finishRun(runs, run, ran);

  return { routines, runs };
}

// ---------------------------------------------------------------- scenarios

export type ScenarioId =
  'example' | 'notStarted' | 'pauseLeft' | 'clockLeftRunning' | 'weeksAway' | 'empty';

/** The buttons under About this prototype › Prototype, in order. */
export const SCENARIOS: readonly { id: ScenarioId; label: string }[] = [
  { id: 'example', label: 'Load the example day' },
  { id: 'notStarted', label: 'Load: not started yet' },
  { id: 'pauseLeft', label: 'Load: a pause left' },
  { id: 'clockLeftRunning', label: 'Load: a clock left running' },
  { id: 'weeksAway', label: 'Load: weeks away' },
  { id: 'empty', label: 'Start empty' },
];

/**
 * What a scenario puts in place: the records, the logging day they were last
 * seen on, and when the app last went to the background, if it did. The rules
 * that follow from time passing (a forgotten clock closing, the day turning, a
 * slot passing) are not applied here: loading a scenario runs them as waking
 * the app would.
 */
export interface Scenario {
  tasks: Task[];
  routines: Shelf;
  day: IsoDate;
  away: { since: string } | undefined;
}

/**
 * - example: the board's day, now (screen 1 at 10:05).
 * - notStarted: the same, before anything began (screen 7 at 9:58).
 * - pauseLeft: built 3 h 15 ago, the email paused then with 7 min worked
 *   (screen 7c at 13:20).
 * - clockLeftRunning: built 2 h ago with the email still running and the app
 *   in the background since 1 h 50 ago, so the clock closes on load (7c, used up).
 * - weeksAway: built three weeks ago, so the day boundary sends everything back
 *   to the inbox (screen 7b at 9:12 on Monday 14 December).
 * - empty: nothing at all (7b).
 */
export function buildScenario(id: ScenarioId, now: Date): Scenario {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * MINUTE);
  switch (id) {
    case 'example': {
      const built = exampleDay(now);
      return {
        tasks: built.tasks,
        routines: built.routines,
        day: loggingDay(now),
        away: undefined,
      };
    }
    case 'notStarted': {
      const built = exampleDay(now, { started: false });
      return {
        tasks: built.tasks,
        routines: built.routines,
        day: loggingDay(now),
        away: undefined,
      };
    }
    case 'pauseLeft': {
      const then = ago(195);
      const built = exampleDay(then);
      const tasks = model.stopWork(built.tasks, built.email, then);
      return { tasks, routines: built.routines, day: loggingDay(then), away: undefined };
    }
    case 'clockLeftRunning': {
      const then = ago(120);
      const built = exampleDay(then);
      return {
        tasks: built.tasks,
        routines: built.routines,
        day: loggingDay(then),
        away: { since: ago(110).toISOString() },
      };
    }
    case 'weeksAway': {
      // Three weeks of calendar days, at the same time of day.
      const then = new Date(now.getTime());
      then.setDate(then.getDate() - 21);
      const built = exampleDay(then);
      return {
        tasks: built.tasks,
        routines: built.routines,
        day: loggingDay(then),
        away: undefined,
      };
    }
    case 'empty':
      return {
        tasks: [],
        routines: { routines: [], runs: [] },
        day: loggingDay(now),
        away: undefined,
      };
  }
}
