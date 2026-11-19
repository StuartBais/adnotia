import {
  isClockTime,
  isIsoDate,
  toIsoDate,
  type ClockTime,
  type IsoDate,
} from '../../kernel/dates';

type Timed = { kind: 'timed'; date: IsoDate; time: ClockTime; durationMinutes: number };
export type When = { kind: 'none' } | { kind: 'anytime'; date: IsoDate } | Timed;

export interface WorkSession {
  start: string;
  stop?: string;
}

export interface Task {
  [key: string]: unknown;
  id: string;
  title: string;
  createdAt: string;
  notes?: string;
  parentId?: string;
  order: number;
  estimateMinutes?: number;
  sessions: readonly WorkSession[];
  doneAt?: string;
  when: When;
}

type Tasks = readonly Task[];

function findTask(tasks: Tasks, id: string): Task {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new RangeError(`Unknown task: ${id}`);
  return task;
}

function update(tasks: Tasks, id: string, change: (task: Task) => Task): Task[] {
  const target = findTask(tasks, id);
  return tasks.map((task) => (task === target ? change(task) : task));
}

function append(tasks: Tasks, title: string, now: Date, parentId?: string): Task[] {
  const base = `task-${now.getTime()}`;
  let id = base;
  const ids = new Set(tasks.map((task) => task.id));
  for (let suffix = 1; ids.has(id); suffix++) id = `${base}-${suffix}`;
  const order = tasks.reduce(
    (next, task) => (task.parentId === parentId ? Math.max(next, task.order + 1) : next),
    0,
  );
  return [
    ...tasks,
    {
      id,
      title,
      createdAt: now.toISOString(),
      order,
      sessions: [],
      when: { kind: 'none' },
      ...(parentId === undefined ? {} : { parentId }),
    },
  ];
}

export function capture(tasks: Tasks, title: string, now: Date): Task[] {
  return append(tasks, title, now);
}

export function addStep(tasks: Tasks, parentId: string, title: string, now: Date): Task[] {
  findTask(tasks, parentId);
  return append(tasks, title, now, parentId);
}

export function rename(tasks: Tasks, id: string, title: string): Task[] {
  return update(tasks, id, (task) => ({ ...task, title }));
}

export function setNotes(tasks: Tasks, id: string, notes: string | undefined): Task[] {
  return update(tasks, id, ({ notes: _old, ...task }) =>
    notes === undefined ? task : { ...task, notes },
  );
}

export function setEstimate(tasks: Tasks, id: string, estimateMinutes: number | undefined): Task[] {
  if (estimateMinutes !== undefined && (!Number.isFinite(estimateMinutes) || estimateMinutes < 0))
    throw new RangeError('Invalid estimate');
  return update(tasks, id, ({ estimateMinutes: _old, ...task }) =>
    estimateMinutes === undefined ? task : { ...task, estimateMinutes },
  );
}

export function schedule(tasks: Tasks, id: string, when: When): Task[] {
  if (when.kind !== 'none' && !isIsoDate(when.date)) throw new RangeError('Invalid date');
  if (
    when.kind === 'timed' &&
    (!isClockTime(when.time) || !Number.isFinite(when.durationMinutes) || when.durationMinutes <= 0)
  )
    throw new RangeError('Invalid time or duration');
  return update(tasks, id, (task) => ({ ...task, when: { ...when } }));
}

export function unschedule(tasks: Tasks, id: string): Task[] {
  return schedule(tasks, id, { kind: 'none' });
}

export function reorderSteps(tasks: Tasks, parentId: string, ids: readonly string[]): Task[] {
  findTask(tasks, parentId);
  const order = new Map(ids.map((id, i) => [id, i]));
  const children = tasks.filter((task) => task.parentId === parentId);
  if (children.length !== ids.length || children.some((task) => !order.has(task.id)))
    throw new RangeError('Expected every step of this parent exactly once');
  return tasks.map((task) => {
    const position = order.get(task.id);
    return position === undefined ? task : { ...task, order: position };
  });
}

function isRunning(task: Task): boolean {
  return task.sessions.some((session) => session.stop === undefined);
}

function stopped(task: Task, now: Date): Task {
  if (!isRunning(task)) return task;
  return {
    ...task,
    sessions: task.sessions.map((session) =>
      session.stop === undefined ? { ...session, stop: now.toISOString() } : session,
    ),
  };
}

export function startWork(tasks: Tasks, id: string, now: Date): Task[] {
  const target = findTask(tasks, id);
  if (target.doneAt !== undefined) throw new RangeError('Reopen the task before starting work');
  return tasks.map((task) => {
    if (task !== target) return stopped(task, now);
    return isRunning(task)
      ? task
      : { ...task, sessions: [...task.sessions, { start: now.toISOString() }] };
  });
}

export function stopWork(tasks: Tasks, id: string, now: Date): Task[] {
  return update(tasks, id, (task) => stopped(task, now));
}

export function complete(tasks: Tasks, id: string, now: Date): Task[] {
  return update(tasks, id, (task) => ({
    ...stopped(task, now),
    doneAt: task.doneAt ?? now.toISOString(),
  }));
}

export function reopen(tasks: Tasks, id: string): Task[] {
  return update(tasks, id, ({ doneAt: _old, ...task }) => task);
}

export function remove(tasks: Tasks, id: string): Task[] {
  findTask(tasks, id);
  const children = new Map<string, string[]>();
  for (const task of tasks) {
    if (task.parentId === undefined) continue;
    const siblings = children.get(task.parentId);
    if (siblings) siblings.push(task.id);
    else children.set(task.parentId, [task.id]);
  }
  const removed = new Set([id]);
  // Set iteration visits descendants added during the walk, regardless of list order.
  for (const parent of removed) for (const child of children.get(parent) ?? []) removed.add(child);
  return tasks.filter((task) => !removed.has(task.id));
}

export function inbox(tasks: Tasks): Task[] {
  return tasks.filter((task) => task.when.kind === 'none');
}

export function forDate(tasks: Tasks, date: IsoDate) {
  const timed = tasks.filter(
    (task): task is Task & { when: Timed } => task.when.kind === 'timed' && task.when.date === date,
  );
  timed.sort((a, b) => a.when.time.localeCompare(b.when.time));
  const anytime = tasks.filter((task) => task.when.kind === 'anytime' && task.when.date === date);
  return { timed, anytime };
}

export function stepsOf(tasks: Tasks, id: string): Task[] {
  return tasks.filter((task) => task.parentId === id).sort((a, b) => a.order - b.order);
}

export function running(tasks: Tasks): Task | undefined {
  return tasks.find(isRunning);
}

export function minutesWorked(task: Task, now: Date): number {
  return (
    task.sessions.reduce(
      (sum, { start, stop }) =>
        sum +
        Math.max(0, (stop === undefined ? now.getTime() : Date.parse(stop)) - Date.parse(start)),
      0,
    ) / 60_000
  );
}

export function doneOn(tasks: Tasks, date: IsoDate): Task[] {
  return tasks.filter(
    (task) => task.doneAt !== undefined && toIsoDate(new Date(task.doneAt)) === date,
  );
}
