// Every change a person makes from Today, as a pure step from one state to the
// next (design/lantern/PROTOTYPE-PLAN.md section 5). Each is one write, so a
// task and the prototype's own facts about it land together.
//
// One running thing: starting a task stops any other, through the model's
// startWork. The marks the prototype keeps about a task (set aside, a clock
// the app closed) are cleared when that task starts again, because they were
// about the session that ended.
//
// Every quick tap can be taken back (SPEC 9.8, plan section 12): a change
// that can returns its six-second lines for the Next line, the Undo pill's
// spoken name, and an inverse. The inverse works on the state as it is when
// Undo is pressed, through the model, so anything else done in the meantime
// stands.

import * as model from '../domains/tasks';
import { stepFacts, timeFacts, type BenchDomains, type BenchState, type UndoLines } from './state';
import { ANNOUNCE, T, keptAtStep, minutesSpoken, resumedAt, say } from './strings';

/** A change that can be taken back for six seconds. */
export interface Undo {
  /** What the Next line says meanwhile (SPEC 9.8, the rows at the foot). */
  lines: UndoLines;
  /** The Undo pill's spoken name, naming what it takes back (SPEC 11). */
  name: string;
  /** Takes the change back, on the state as it is when Undo is pressed. */
  inverse: (state: BenchDomains, now: Date) => BenchDomains;
  /** The step a Step done finished, so its disc in Focus can end this Undo. */
  step?: string;
}

export interface Changed {
  state: BenchDomains;
  /** What the live region says, if anything (SPEC 11 "Announcements"). */
  announce?: string;
  /** Present when the change can be taken back. */
  undo?: Undo;
}

const find = (state: BenchDomains, id: string) => state.tasks.find((task) => task.id === id);

type Marks = Pick<BenchState, 'setAside' | 'closedByApp'>;

function clearMarks(bench: BenchState, id: string): BenchState {
  const { setAside, closedByApp, ...rest } = bench;
  return {
    ...rest,
    ...(setAside && setAside.taskId !== id ? { setAside } : {}),
    ...(closedByApp && closedByApp.taskId !== id ? { closedByApp } : {}),
  } as BenchState;
}

/** Puts back the marks a start cleared, as they were before it. */
function restoreMarks(bench: BenchState, marks: Marks): BenchState {
  const { setAside: _setAside, closedByApp: _closed, ...rest } = bench;
  return {
    ...rest,
    ...(marks.setAside ? { setAside: marks.setAside } : {}),
    ...(marks.closedByApp ? { closedByApp: marks.closedByApp } : {}),
  } as BenchState;
}

/**
 * A new session on the task, every other stopped, and the inverse that takes
 * the session back as if it had never begun: discardSession, the marks it
 * cleared put back, and whatever it stopped started again at its step.
 */
function begin(
  state: BenchDomains,
  id: string,
  now: Date,
): { state: BenchDomains; inverse: Undo['inverse']; stopped: model.Task | undefined } {
  const stopped = model.running(state.tasks);
  const startedAt = now.toISOString();
  const marks: Marks = {
    ...(state.bench.setAside ? { setAside: state.bench.setAside } : {}),
    ...(state.bench.closedByApp ? { closedByApp: state.bench.closedByApp } : {}),
  };
  const other = stopped && stopped.id !== id ? stopped : undefined;
  return {
    state: {
      ...state,
      tasks: model.startWork(state.tasks, id, now),
      bench: clearMarks(state.bench, id),
    },
    stopped: other,
    inverse(current, at) {
      if (!find(current, id)) return current;
      let tasks = model.discardSession(current.tasks, id, startedAt);
      const back = other && find({ ...current, tasks }, other.id);
      if (back && back.doneAt === undefined) tasks = model.startWork(tasks, back.id, at);
      return { ...current, tasks, bench: restoreMarks(current.bench, marks) };
    },
  };
}

/**
 * Start: a new session on the task, and every other stopped. Started while
 * another runs, it is SPEC 5.3's "Start this instead": the six-second lines
 * say both tasks, and Undo goes back to the other at its step.
 */
export function start(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined || model.running(state.tasks)?.id === id) {
    return { state };
  }
  const begun = begin(state, id, now);
  if (begun.stopped) {
    const step = stepFacts(state.tasks, begun.stopped).position?.number;
    const kept = keptAtStep(begun.stopped.title, step);
    return {
      state: begun.state,
      announce: ANNOUNCE.started(task.title, begun.stopped.title, step),
      undo: {
        lines: { line1: `${T.started} ${task.title}`, line2: kept },
        name: say.undoStartInstead(kept),
        inverse: begun.inverse,
      },
    };
  }
  return {
    state: begun.state,
    undo: {
      lines: { line1: T.started, line2: task.title },
      name: say.undoStart(task.title),
      inverse: begun.inverse,
    },
  };
}

/** Resume, on paused Today: the same new session, said as "Resumed". */
export function resume(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined || model.running(state.tasks)?.id === id) {
    return { state };
  }
  const begun = begin(state, id, now);
  const step = stepFacts(state.tasks, task).position?.number;
  return {
    state: begun.state,
    undo: {
      lines: { line1: T.resumed, line2: resumedAt(task.title, step) },
      name: say.undoResume(task.title),
      inverse: begun.inverse,
    },
  };
}

/** Pause is not taken back: Resume is one tap in the same place. */
export function pause(state: BenchDomains, id: string, now: Date): Changed {
  if (!find(state, id)) return { state };
  return {
    state: { ...state, tasks: model.stopWork(state.tasks, id, now) },
    announce: ANNOUNCE.paused,
  };
}

/**
 * Step done: the current step is finished. On the last step, or for a task
 * with no steps, the button reads Done and finishes the task as well; Undo
 * then reopens both and, if the clock was running, runs it again.
 */
export function stepDone(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  const steps = stepFacts(state.tasks, task);
  const step = steps.current;
  const wasRunning = model.running(state.tasks)?.id === id;
  let tasks = state.tasks;
  if (step) tasks = model.complete(tasks, step.id, now);

  if (!step || steps.isLast) {
    tasks = model.complete(tasks, id, now);
    return {
      state: { ...state, tasks },
      announce: ANNOUNCE.done(task.title),
      undo: {
        lines: step
          ? { line1: T.stepDone, line2: step.title }
          : { line1: T.done, line2: task.title },
        name: step ? say.undoStepDone(step.title) : say.undoDone(task.title),
        inverse(current, at) {
          let back = current.tasks;
          if (step && find(current, step.id)) back = model.reopen(back, step.id);
          if (!find(current, id)) return { ...current, tasks: back };
          back = model.reopen(back, id);
          if (wasRunning && !model.running(back)) back = model.startWork(back, id, at);
          return { ...current, tasks: back };
        },
      },
    };
  }
  return {
    state: { ...state, tasks },
    announce: ANNOUNCE.stepDone(steps.after?.title ?? task.title),
    undo: {
      lines: { line1: T.stepDone, line2: step.title },
      name: say.undoStepDone(step.title),
      step: step.id,
      inverse: (current) =>
        find(current, step.id)
          ? { ...current, tasks: model.reopen(current.tasks, step.id) }
          : current,
    },
  };
}

/** Set aside: the paused task goes, keeping its place at its step (SPEC 5.7c). */
export function setAside(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task) return { state };
  const before = state.bench.setAside;
  return {
    state: { ...state, bench: { ...state.bench, setAside: { taskId: id, at: now.toISOString() } } },
    undo: {
      lines: { line1: T.setAside, line2: task.title },
      name: say.undoSetAside(task.title),
      inverse(current) {
        const { setAside: _gone, ...bench } = current.bench;
        return {
          ...current,
          bench: (before ? { ...bench, setAside: before } : bench) as BenchState,
        };
      },
    },
  };
}

/**
 * +5 min, in Focus (SPEC 5.4): five more minutes on the task's estimate. With
 * the estimate used up it first comes up to the whole minutes worked, so the
 * bar shows five minutes left; with no estimate it becomes the whole minutes
 * worked plus five (owner question 6). Not taken back: SPEC 9.8 lists no six
 * seconds for it, and the minutes it changed are beside it. SPEC 11 gives it
 * no announcement; it says what the bar now reads, so a tap is not silent.
 */
export function addFive(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  const facts = timeFacts(task, now);
  const base = facts.estimate === undefined ? facts.soFar : Math.max(facts.estimate, facts.soFar);
  const tasks = model.setEstimate(state.tasks, id, base + 5);
  // Said as the bar beside it now reads: "23 of 30 minutes left, ends 10:28".
  const after = timeFacts(find({ ...state, tasks }, id) ?? task, now);
  return {
    state: { ...state, tasks },
    announce: minutesSpoken({
      kind: 'left',
      left: after.left ?? 0,
      estimate: after.estimate ?? 0,
      endsAt: after.endsAt,
    }),
  };
}

/**
 * A done step's disc, in Focus (SPEC 9.7): not done after all, and the current
 * step again. It is its own way back, as a ticked row's disc is.
 */
export function reopenStep(state: BenchDomains, stepId: string): Changed {
  const step = find(state, stepId);
  if (!step || step.doneAt === undefined) return { state };
  return {
    state: { ...state, tasks: model.reopen(state.tasks, stepId) },
    announce: ANNOUNCE.undoneThen(ANNOUNCE.now(step.title)),
  };
}

/** A ring ticked in a list: the task is done, and stays in place as a disc. */
export function tick(state: BenchDomains, id: string, now: Date): Changed {
  const task = find(state, id);
  if (!task || task.doneAt !== undefined) return { state };
  return {
    state: { ...state, tasks: model.complete(state.tasks, id, now) },
    announce: ANNOUNCE.done(task.title),
    undo: {
      lines: { line1: T.done, line2: task.title },
      name: say.undoDone(task.title),
      inverse: (current) =>
        find(current, id) ? { ...current, tasks: model.reopen(current.tasks, id) } : current,
    },
  };
}

/** The ticked row's disc: not done after all. It is its own way back. */
export function untick(state: BenchDomains, id: string): Changed {
  const task = find(state, id);
  if (!task || task.doneAt === undefined) return { state };
  return {
    state: { ...state, tasks: model.reopen(state.tasks, id) },
    announce: ANNOUNCE.undone,
  };
}
