// Every change a person makes from Today, as a pure step from one state to the
// next (design/lantern/PROTOTYPE-PLAN.md section 5). Each is one write, so a
// task and the prototype's own facts about it land together.
//
// One running thing: starting a task stops any other, through the model's
// startWork. The marks the prototype keeps about a task (set aside, a clock
// the app closed) are cleared when that task starts again, because they were
// about the session that ended.

import * as model from '../domains/tasks';
import { stepFacts, type BenchDomains, type BenchState } from './state';
import { ANNOUNCE } from './strings';

export interface Changed {
  state: BenchDomains;
  /** What the live region says, if anything (SPEC 11 "Announcements"). */
  announce?: string;
}

const find = (state: BenchDomains, id: string) => state.tasks.find((task) => task.id === id);

function clearMarks(bench: BenchState, id: string): BenchState {
  const { setAside, closedByApp, ...rest } = bench;
  return {
    ...rest,
    ...(setAside && setAside.taskId !== id ? { setAside } : {}),
    ...(closedByApp && closedByApp.taskId !== id ? { closedByApp } : {}),
  } as BenchState;
}

/** Start, or Resume: a new session on the task, and every other stopped. */
export function start(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  return {
    state: {
      ...state,
      tasks: model.startWork(state.tasks, id, now),
      bench: clearMarks(state.bench, id),
    },
  };
}

export function pause(state: BenchDomains, id: string, now: Date): Changed {
  if (!find(state, id)) return { state };
  return {
    state: { ...state, tasks: model.stopWork(state.tasks, id, now) },
    announce: ANNOUNCE.paused,
  };
}

/**
 * Step done: the current step is finished. On the last step, or for a task
 * with no steps, the button reads Done and finishes the task as well.
 */
export function stepDone(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  const steps = stepFacts(state.tasks, task);
  let tasks = state.tasks;
  if (steps.current) tasks = model.complete(tasks, steps.current.id, now);
  if (!steps.current || steps.isLast) {
    tasks = model.complete(tasks, id, now);
    return { state: { ...state, tasks }, announce: ANNOUNCE.done(task.title) };
  }
  return {
    state: { ...state, tasks },
    announce: ANNOUNCE.stepDone(steps.after?.title ?? task.title),
  };
}

/** Set aside: the paused task goes, keeping its place at its step (SPEC 5.7c). */
export function setAside(state: BenchDomains, id: string, now: Date): Changed {
  if (!find(state, id)) return { state };
  return {
    state: { ...state, bench: { ...state.bench, setAside: { taskId: id, at: now.toISOString() } } },
  };
}

/** A ring ticked in a list: the task is done, and stays in place as a disc. */
export function tick(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  return {
    state: { ...state, tasks: model.complete(state.tasks, id, now) },
    announce: ANNOUNCE.done(task.title),
  };
}

/** The ticked row's disc: not done after all. */
export function untick(state: BenchDomains, id: string): Changed {
  const task = find(state, id);
  if (!task || task.doneAt === undefined) return { state };
  return {
    state: { ...state, tasks: model.reopen(state.tasks, id) },
    announce: ANNOUNCE.undone,
  };
}
