// What the planning module keeps, and the arithmetic it does on it.
//
// Four things, because the toolkit is four tools: tasks broken into steps,
// estimates with what they actually took, a list for a day, and if–then prompts.
// The daily field lives under `days` like every module's daily data, because the
// Today assembler writes there.
//
// The only arithmetic here is the estimate reality check, which is the technique
// itself rather than a score about the person: it reports what their own past
// estimates did, to them, and nowhere else.

import type { ClockTime, IsoDate } from '../../kernel/index';

export interface Step {
  id: string;
  text: string;
  done?: boolean;
  /**
   * Set when this step turned out to be a thing of its own and was promoted.
   * Two levels is as deep as this goes, and that is a decision rather than a
   * limitation: a tree is somewhere to spend an hour organising instead of
   * starting, and the protocols this comes from use one level. See ADR-038.
   */
  taskId?: string;
}

export interface Task {
  id: string;
  title: string;
  steps: Step[];
  created: IsoDate;
  /** The task this was promoted out of, if it was one of its steps. */
  parent?: string;
}

export interface Estimate {
  id: string;
  /**
   * What it is called. Kept even when `taskId` is set, and that is the rule for
   * every link in this file: **store the label as well as the id**. There is no
   * referential integrity in a document a person edits, so a deleted task must
   * leave a readable line behind rather than a blank row. The mindfulness log
   * does the same thing for a practice that has since been removed.
   */
  title: string;
  /** What they thought it would take, in minutes. */
  minutes: number;
  /** What it actually took, once they say. */
  actual?: number;
  date: IsoDate;
  /** The task this is an estimate for, if it is for one. */
  taskId?: string;
}

export interface PlanItem {
  id: string;
  /** As it read when it was added. See the note on `Estimate.title`. */
  text: string;
  at?: ClockTime;
  taskId?: string;
  stepId?: string;
}

/**
 * A stretch of time spent on one thing.
 *
 * `label` is what it was pointed at, as it read at the time, for the same reason
 * every other link here keeps its text.
 *
 * There is no count in this shape, and there is nowhere to put one. A round
 * number would be points, which docs/03-scope.md excludes outright; where the
 * cycle keeps its position is in a variable that dies with the page. See
 * ADR-038.
 */
export interface FocusSession {
  id: string;
  minutes: number;
  label: string;
  taskId?: string;
  stepId?: string;
}

export interface Intention {
  id: string;
  /** "If it is 8am", "If I sit down at my desk". */
  cue: string;
  /** "Then I take the tablet", "Then I open the one email". */
  action: string;
}

export interface PlanningDay {
  /** How the plan went, in the person's own words from a short list. */
  held?: string;
  /** Stretches of focus, in the order they happened. Never totalled. */
  focus?: FocusSession[];
}

/*
 * The slice stays at version 1, and that is deliberate.
 *
 * Everything the linking and the focus timer added is an optional field, nothing
 * was renamed and nothing was restructured, so a slice written by the build
 * before them is a valid slice for this one — there is nothing for a migration
 * to do. Bumping to 2 would make this the first module migration in the build
 * and it would be an identity function: ceremony that a later reader trusts as
 * though it did something. docs/06-data-model.md asks for a migration when one
 * is needed, and one is not.
 */
/**
 * How long a stretch, a break and a longer break are, and how often the longer
 * one comes round.
 *
 * A preference, not a record: it says how the tool is set up, not how anybody
 * did. That is the whole reason it may be kept when the position in the cycle
 * may not — see ADR-038 — and the distinction is worth stating here because the
 * two live a few lines apart.
 */
export interface FocusLengths {
  focus: number;
  rest: number;
  long: number;
  every: number;
}

/** The familiar lengths, and nothing more authoritative than that. */
export const DEFAULT_LENGTHS: FocusLengths = { focus: 25, rest: 5, long: 15, every: 4 };

/** Long enough to be a stretch, short enough to be honest about. */
export const LENGTH_LIMITS = { min: 1, max: 180 } as const;

export function clampLength(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(LENGTH_LIMITS.max, Math.max(LENGTH_LIMITS.min, n));
}

/**
 * The lengths to use, clamped.
 *
 * Clamped on the way out as well as on the way in, because a slice can arrive
 * from a backup file somebody edited or from a build that allowed something this
 * one does not. A zero-minute stretch is a timer that finishes instantly and
 * starts the next one, for ever.
 */
export function focusLengths(slice: PlanningSlice | undefined): FocusLengths {
  const kept = slice?.focusLengths;
  return {
    focus: clampLength(kept?.focus, DEFAULT_LENGTHS.focus),
    rest: clampLength(kept?.rest, DEFAULT_LENGTHS.rest),
    long: clampLength(kept?.long, DEFAULT_LENGTHS.long),
    every: clampLength(kept?.every, DEFAULT_LENGTHS.every),
  };
}

export function withFocusLengths(
  slice: PlanningSlice | undefined,
  lengths: FocusLengths,
): PlanningSlice {
  return {
    version: 1,
    ...slice,
    focusLengths: focusLengths({ version: 1, ...slice, focusLengths: lengths }),
  };
}

export interface PlanningSlice {
  version: number;
  tasks?: Task[];
  estimates?: Estimate[];
  plans?: Record<IsoDate, { items: PlanItem[] }>;
  intentions?: Intention[];
  days?: Record<IsoDate, PlanningDay>;
  /** How the focus timer is set up. A preference; see FocusLengths. */
  focusLengths?: FocusLengths;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** The first step not yet done. The whole point of breaking a task down. */
export function nextStep(task: Task): Step | undefined {
  return task.steps.find((step) => step.done !== true);
}

export function isFinished(task: Task): boolean {
  return task.steps.length > 0 && task.steps.every((step) => step.done === true);
}

export interface EstimateReality {
  /** Estimates that have an actual against them. */
  timed: number;
  /** How much longer things took, as a multiple. 1 means bang on. */
  ratio: number;
  /** Total minutes estimated and actually taken, so the ratio is checkable. */
  estimated: number;
  actual: number;
}

/** Below this the ratio is one bad afternoon rather than a pattern. */
export const MIN_TIMED = 3;

/**
 * What their own past estimates did. Reported to the person about their own
 * data, which is the mechanism the CBT protocols use: the correction comes from
 * seeing your own record, not from being told you are bad at this.
 */
export function reality(estimates: readonly Estimate[]): EstimateReality | undefined {
  const timed = estimates.filter(
    (estimate) => typeof estimate.actual === 'number' && estimate.minutes > 0,
  );
  if (timed.length < MIN_TIMED) return undefined;

  const estimated = timed.reduce((total, estimate) => total + estimate.minutes, 0);
  const actual = timed.reduce((total, estimate) => total + (estimate.actual ?? 0), 0);
  if (estimated === 0) return undefined;

  return {
    timed: timed.length,
    ratio: Math.round((actual / estimated) * 10) / 10,
    estimated,
    actual,
  };
}

/** The plan for a day, or an empty one. */
export function planFor(slice: PlanningSlice | undefined, date: IsoDate): PlanItem[] {
  return slice?.plans?.[date]?.items ?? [];
}

/** Items in the order they will happen: timed ones first, by time, then the rest. */
export function ordered(items: readonly PlanItem[]): PlanItem[] {
  const timed = items.filter((item) => (item.at ?? '') !== '');
  const untimed = items.filter((item) => (item.at ?? '') === '');
  return [...timed.sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')), ...untimed];
}

// -------------------------------------------------------------------- linking

export function taskById(
  slice: PlanningSlice | undefined,
  id: string | undefined,
): Task | undefined {
  if (id === undefined) return undefined;
  return (slice?.tasks ?? []).find((task) => task.id === id);
}

export function stepById(task: Task | undefined, id: string | undefined): Step | undefined {
  if (task === undefined || id === undefined) return undefined;
  return task.steps.find((step) => step.id === id);
}

/**
 * What a link should say now.
 *
 * The live title if the thing is still there, and the text it was given when it
 * was added if it is not. A plan for last Tuesday that pointed at a task since
 * deleted still reads as the line somebody wrote, which is the whole reason both
 * are stored.
 */
export function labelFor(
  slice: PlanningSlice | undefined,
  link: { text?: string; taskId?: string; stepId?: string },
  fallback: string,
): string {
  const task = taskById(slice, link.taskId);
  if (task === undefined) return link.text ?? fallback;
  const step = stepById(task, link.stepId);
  return step === undefined ? task.title : `${task.title}: ${step.text}`;
}

/** A task nobody has finished, and so one there is still something to do about. */
export function unfinished(slice: PlanningSlice | undefined): Task[] {
  return (slice?.tasks ?? []).filter((task) => !isFinished(task));
}

export interface FocusTarget {
  /** Stable enough to be a chip value: task id, or task id and step id. */
  key: string;
  label: string;
  taskId: string;
  stepId?: string;
}

/**
 * What the timer can be pointed at.
 *
 * Each unfinished task, and its next step where it has one — so at most two per
 * task rather than every step of every task, which is a wall of chips and an
 * invitation to pick over the list instead of starting. The next step is the
 * one the breaking-down tool already marks "start here"; it is the same answer
 * offered in the place you would act on it.
 */
export function focusTargets(slice: PlanningSlice | undefined): FocusTarget[] {
  const out: FocusTarget[] = [];
  for (const task of unfinished(slice)) {
    out.push({ key: task.id, label: task.title, taskId: task.id });
    const next = nextStep(task);
    // Not a step that has been promoted: it is in this list already, as the task
    // it became, and two chips with identical text pointing at different things
    // is worse than one fewer way in.
    if (next !== undefined && next.taskId === undefined) {
      out.push({
        key: `${task.id}/${next.id}`,
        label: next.text,
        taskId: task.id,
        stepId: next.id,
      });
    }
  }
  return out;
}

/**
 * Turn a step into a task of its own, linked back to where it came from.
 *
 * The step stays where it is and gains a pointer, rather than being removed:
 * deleting a line somebody wrote because they said it was bigger than they
 * thought is the app losing their work to make its own model tidier.
 */
export function promote(
  tasks: readonly Task[],
  taskId: string,
  stepId: string,
  today: IsoDate,
): Task[] {
  const parent = tasks.find((task) => task.id === taskId);
  const step = parent?.steps.find((other) => other.id === stepId);
  if (parent === undefined || step === undefined || step.taskId !== undefined) return [...tasks];

  const promoted: Task = {
    id: newId(),
    title: step.text,
    steps: [],
    created: today,
    parent: parent.id,
  };

  const out: Task[] = [];
  for (const task of tasks) {
    if (task.id !== parent.id) {
      out.push(task);
      continue;
    }
    out.push({
      ...task,
      steps: task.steps.map((other) =>
        other.id === stepId ? { ...other, taskId: promoted.id } : other,
      ),
    });
    // Directly after its parent, so the list reads as a shape without being a tree.
    out.push(promoted);
  }
  return out;
}

/**
 * Whether the break after the `done`-th stretch of a sitting is the long one.
 *
 * `done` counts the stretch that has just ended, and it is a number that lives
 * in the focus tool's closure and nowhere else. This is the only question ever
 * asked of it, and the answer is a position in a repeating pattern rather than a
 * total: it says which break comes next, never how much has been done. ADR-038
 * is the whole argument, because a count of finished stretches is points, and
 * docs/03-scope.md excludes those.
 */
export function longBreakAfter(done: number, every: number): boolean {
  return every > 0 && done > 0 && done % every === 0;
}

/** Add a stretch of focus to a day, keeping whatever else that day holds. */
export function recordFocus(
  slice: PlanningSlice | undefined,
  date: IsoDate,
  session: FocusSession,
): PlanningSlice {
  const base: PlanningSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  // Spread the existing day: it may already carry `held`, and replacing it
  // wholesale would throw away the answer to the module's one daily question.
  days[date] = { ...days[date], focus: [...(days[date]?.focus ?? []), session] };
  return { ...base, days };
}
