import { isClockTime, loggingDay, type ClockTime, type IsoDate } from '../../kernel/dates';

// A routine is the same kind of object for an adult and for a routine a parent
// builds for a child (ADR-043, decision 8). What separates them is where they
// are kept: each owner has a shelf of its own in the book, so the child's
// surface can list a child's routines without reading a single adult record,
// and deleting a profile removes one key.
//
// A run records the steps that were ticked. It never records a step that was
// not: there is no skipped, missed or late state, and nothing here counts days
// in a row (ADR-044, decision 1).

export type Owner = { kind: 'self' } | { kind: 'child'; profileId: string };

export type Anchor = { kind: 'time'; time: ClockTime } | { kind: 'event'; text: string };

export interface Step {
  [key: string]: unknown;
  id: string;
  title: string;
  minutes?: number;
}

export interface Routine {
  [key: string]: unknown;
  id: string;
  title: string;
  createdAt: string;
  steps: readonly Step[];
  anchor?: Anchor;
}

export interface Tick {
  stepId: string;
  at: string;
}

export interface RoutineRun {
  [key: string]: unknown;
  id: string;
  routineId: string;
  date: IsoDate;
  startedAt: string;
  ticked: readonly Tick[];
  finishedAt?: string;
}

export interface Shelf {
  [key: string]: unknown;
  routines: readonly Routine[];
  runs: readonly RoutineRun[];
}

export type RoutineBook = Readonly<Record<string, Shelf>>;

type Routines = readonly Routine[];
type Runs = readonly RoutineRun[];

// ---------------------------------------------------------------------------
// The book: one shelf per owner.

const EMPTY_SHELF: Shelf = Object.freeze({ routines: [], runs: [] });

export function ownerKey(owner: Owner): string {
  if (owner.kind === 'self') return 'self';
  if (owner.profileId === '') throw new RangeError('A child owner needs a profile id');
  return `child:${owner.profileId}`;
}

/** Reads only the owner's own key. */
export function shelfFor(book: RoutineBook, owner: Owner): Shelf {
  const key = ownerKey(owner);
  return Object.prototype.hasOwnProperty.call(book, key) ? (book[key] as Shelf) : EMPTY_SHELF;
}

export function routinesFor(book: RoutineBook, owner: Owner): readonly Routine[] {
  return shelfFor(book, owner).routines;
}

export function runsFor(book: RoutineBook, owner: Owner): readonly RoutineRun[] {
  return shelfFor(book, owner).runs;
}

/** Returns a new book with the owner's shelf replaced. Unknown keys on the old shelf are kept. */
export function putShelf(
  book: RoutineBook,
  owner: Owner,
  change: Partial<Pick<Shelf, 'routines' | 'runs'>>,
): RoutineBook {
  return { ...book, [ownerKey(owner)]: { ...shelfFor(book, owner), ...change } };
}

/** Everything kept for one owner, gone. Used when a child profile is deleted. */
export function removeOwner(book: RoutineBook, owner: Owner): RoutineBook {
  const key = ownerKey(owner);
  return Object.fromEntries(Object.entries(book).filter(([k]) => k !== key));
}

// ---------------------------------------------------------------------------
// Routines.

function newId(prefix: string, taken: Iterable<string>, now: Date): string {
  const ids = new Set(taken);
  const base = `${prefix}-${now.getTime()}`;
  let id = base;
  for (let suffix = 1; ids.has(id); suffix++) id = `${base}-${suffix}`;
  return id;
}

function findRoutine(routines: Routines, id: string): Routine {
  const routine = routines.find((item) => item.id === id);
  if (!routine) throw new RangeError(`Unknown routine: ${id}`);
  return routine;
}

function updateRoutine(
  routines: Routines,
  id: string,
  change: (routine: Routine) => Routine,
): Routine[] {
  const target = findRoutine(routines, id);
  return routines.map((routine) => (routine === target ? change(routine) : routine));
}

function checkMinutes(minutes: number | undefined): void {
  if (minutes !== undefined && (!Number.isFinite(minutes) || minutes <= 0))
    throw new RangeError('Invalid minutes');
}

export function create(routines: Routines, title: string, now: Date): Routine[] {
  const id = newId(
    'routine',
    routines.map((r) => r.id),
    now,
  );
  return [...routines, { id, title, createdAt: now.toISOString(), steps: [] }];
}

export function rename(routines: Routines, id: string, title: string): Routine[] {
  return updateRoutine(routines, id, (routine) => ({ ...routine, title }));
}

export function remove(routines: Routines, id: string): Routine[] {
  const target = findRoutine(routines, id);
  return routines.filter((routine) => routine !== target);
}

export function addStep(
  routines: Routines,
  id: string,
  title: string,
  now: Date,
  minutes?: number,
): Routine[] {
  checkMinutes(minutes);
  return updateRoutine(routines, id, (routine) => {
    const stepId = newId(
      'step',
      routine.steps.map((s) => s.id),
      now,
    );
    const step: Step =
      minutes === undefined ? { id: stepId, title } : { id: stepId, title, minutes };
    return { ...routine, steps: [...routine.steps, step] };
  });
}

export function renameStep(
  routines: Routines,
  id: string,
  stepId: string,
  title: string,
): Routine[] {
  return updateRoutine(routines, id, (routine) => {
    if (!routine.steps.some((s) => s.id === stepId))
      throw new RangeError(`Unknown step: ${stepId}`);
    return {
      ...routine,
      steps: routine.steps.map((s) => (s.id === stepId ? { ...s, title } : s)),
    };
  });
}

export function setStepMinutes(
  routines: Routines,
  id: string,
  stepId: string,
  minutes: number | undefined,
): Routine[] {
  checkMinutes(minutes);
  return updateRoutine(routines, id, (routine) => {
    if (!routine.steps.some((s) => s.id === stepId))
      throw new RangeError(`Unknown step: ${stepId}`);
    return {
      ...routine,
      steps: routine.steps.map((step) => {
        if (step.id !== stepId) return step;
        const { minutes: _old, ...rest } = step;
        return minutes === undefined ? rest : { ...rest, minutes };
      }),
    };
  });
}

/** Past runs keep any tick of the removed step: they are a record of what happened. */
export function removeStep(routines: Routines, id: string, stepId: string): Routine[] {
  return updateRoutine(routines, id, (routine) => {
    if (!routine.steps.some((s) => s.id === stepId))
      throw new RangeError(`Unknown step: ${stepId}`);
    return { ...routine, steps: routine.steps.filter((s) => s.id !== stepId) };
  });
}

export function reorderSteps(
  routines: Routines,
  id: string,
  stepIds: readonly string[],
): Routine[] {
  return updateRoutine(routines, id, (routine) => {
    const byId = new Map(routine.steps.map((s) => [s.id, s]));
    if (stepIds.length !== byId.size || new Set(stepIds).size !== byId.size)
      throw new RangeError('Expected every step of this routine exactly once');
    return {
      ...routine,
      steps: stepIds.map((stepId) => {
        const step = byId.get(stepId);
        if (!step) throw new RangeError(`Unknown step: ${stepId}`);
        return step;
      }),
    };
  });
}

export function setAnchor(routines: Routines, id: string, anchor: Anchor | undefined): Routine[] {
  if (anchor?.kind === 'time' && !isClockTime(anchor.time)) throw new RangeError('Invalid time');
  if (anchor?.kind === 'event' && anchor.text.trim() === '')
    throw new RangeError('An event anchor needs words');
  return updateRoutine(routines, id, ({ anchor: _old, ...routine }) =>
    anchor === undefined ? routine : { ...routine, anchor: { ...anchor } },
  );
}

// ---------------------------------------------------------------------------
// Runs.

function findRun(runs: Runs, runId: string): RoutineRun {
  const run = runs.find((item) => item.id === runId);
  if (!run) throw new RangeError(`Unknown run: ${runId}`);
  return run;
}

function updateRun(
  runs: Runs,
  runId: string,
  change: (run: RoutineRun) => RoutineRun,
): RoutineRun[] {
  const target = findRun(runs, runId);
  return runs.map((run) => (run === target ? change(run) : run));
}

/**
 * Starts a run for the routine on the logging day, so a bedtime routine begun
 * after midnight belongs to the evening it started in. If one is already
 * unfinished for that day, the list comes back unchanged.
 */
export function startRun(runs: Runs, routine: Routine, now: Date): RoutineRun[] {
  const date = loggingDay(now);
  if (currentRun(runs, routine.id, date)) return [...runs];
  const id = newId(
    'run',
    runs.map((r) => r.id),
    now,
  );
  return [...runs, { id, routineId: routine.id, date, startedAt: now.toISOString(), ticked: [] }];
}

export function tickStep(
  runs: Runs,
  routine: Routine,
  runId: string,
  stepId: string,
  now: Date,
): RoutineRun[] {
  if (!routine.steps.some((s) => s.id === stepId)) throw new RangeError(`Unknown step: ${stepId}`);
  return updateRun(runs, runId, (run) => {
    if (run.routineId !== routine.id) throw new RangeError('That run belongs to another routine');
    if (run.ticked.some((t) => t.stepId === stepId)) return run;
    return { ...run, ticked: [...run.ticked, { stepId, at: now.toISOString() }] };
  });
}

export function untickStep(runs: Runs, runId: string, stepId: string): RoutineRun[] {
  return updateRun(runs, runId, (run) => ({
    ...run,
    ticked: run.ticked.filter((t) => t.stepId !== stepId),
  }));
}

/** Finishing records when. It does not record which steps were left. */
export function finishRun(runs: Runs, runId: string, now: Date): RoutineRun[] {
  return updateRun(runs, runId, (run) => ({
    ...run,
    finishedAt: run.finishedAt ?? now.toISOString(),
  }));
}

/** Removes the run without trace. */
export function abandonRun(runs: Runs, runId: string): RoutineRun[] {
  const target = findRun(runs, runId);
  return runs.filter((run) => run !== target);
}

/** Every run of a routine, gone. Pair with `remove` when a routine is deleted. */
export function removeRunsOf(runs: Runs, routineId: string): RoutineRun[] {
  return runs.filter((run) => run.routineId !== routineId);
}

// ---------------------------------------------------------------------------
// Selectors.

/** The unfinished run of this routine on this day, if there is one. */
export function currentRun(runs: Runs, routineId: string, date: IsoDate): RoutineRun | undefined {
  return runs.find(
    (run) => run.routineId === routineId && run.date === date && run.finishedAt === undefined,
  );
}

/** The first step, in the routine's order, that this run has not ticked. */
export function nextStep(routine: Routine, run: RoutineRun | undefined): Step | undefined {
  const done = new Set(run?.ticked.map((t) => t.stepId));
  return routine.steps.find((step) => !done.has(step.id));
}

export function runsOn(runs: Runs, date: IsoDate): RoutineRun[] {
  return runs.filter((run) => run.date === date);
}
