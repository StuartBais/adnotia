import { expect, it } from 'vitest';
import * as model from './index';
import { empty, smallDay, thirtyDays } from './fixtures';

const date = '2026-11-18';
const now = new Date(`${date}T09:00`);
const later = new Date(`${date}T09:20`);

function freeze(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
}

// Each operation sees frozen input, including unknown fields and nested sessions.
function frozen(tasks: readonly model.Task[]) {
  freeze(tasks);
  return tasks;
}

it('edits one inbox record without losing its identity or unrecognised data', () => {
  const [task] = model.capture(frozen(empty), 'A letter', now);
  if (!task) throw new Error('Expected captured task');
  const original = frozen([{ ...task, future: { label: 'keep' } }]);
  const second = model.capture(original, 'Another letter', now);
  expect(new Set(second.map((item) => item.id)).size).toBe(2);
  const renamed = model.rename(original, task.id, 'Post letter');
  const noted = model.setNotes(frozen(renamed), task.id, 'By the door');
  const estimated = model.setEstimate(frozen(noted), task.id, 10);
  expect(model.inbox(frozen(estimated))).toEqual([
    { ...original[0], title: 'Post letter', notes: 'By the door', estimateMinutes: 10 },
  ]);
  const cleared = model.setNotes(estimated, task.id, undefined);
  expect(model.setEstimate(frozen(cleared), task.id, undefined)).toEqual(renamed);
});

it('splits a calendar day into anytime and sorted timed tasks without duplicating them', () => {
  const slot = { kind: 'timed', date, time: '14:05', durationMinutes: 15 } as const;
  const afternoon = model.schedule(frozen(smallDay), 'post', slot);
  const day = model.schedule(frozen(afternoon), 'step-0', { ...slot, time: '08:30' });
  const { timed, anytime } = model.forDate(frozen(day), date);
  expect(timed.map((t) => t.id)).toEqual(['step-0', 'post']);
  expect(anytime.map((t) => t.id)).toEqual(['list']);
  expect(model.forDate(day, '2026-11-19')).toEqual({ timed: [], anytime: [] });
  expect(model.inbox(day).map((t) => t.id)).not.toContain('post');
  expect(model.unschedule(day, 'post').find((t) => t.id === 'post')?.when).toEqual({
    kind: 'none',
  });
  expect(() => model.schedule(day, 'post', { ...slot, time: '24:00' })).toThrow();
  expect(() => model.schedule(day, 'post', { ...slot, date: '2026-11-31' })).toThrow();
});

it('hands work over at the supplied instant and sums only time actually worked', () => {
  expect(model.running(smallDay)?.id).toBe('step-0');
  const switched = model.startWork(frozen(smallDay), 'post', now);
  expect(switched.find((t) => t.id === 'step-0')?.sessions[0]?.stop).toBe(now.toISOString());
  const same = model.startWork(frozen(switched), 'post', later);
  expect(model.running(frozen(same))?.sessions).toEqual([{ start: now.toISOString() }]);
  const stopped = model.stopWork(same, 'post', later);
  expect(model.running(frozen(stopped))).toBeUndefined();
  const resumed = model.startWork(stopped, 'post', new Date(`${date}T23:55`));
  const midnight = new Date('2026-11-19T00:05');
  const active = model.running(frozen(resumed))!;
  expect(model.minutesWorked(active, midnight)).toBe(30);
  const finished = model.complete(resumed, active.id, midnight);
  expect(model.running(frozen(finished))).toBeUndefined();
  const [done] = model.doneOn(finished, '2026-11-19');
  expect(done?.id).toBe(active.id);
  expect(model.minutesWorked(done!, new Date('2026-11-20T12:00'))).toBe(30);
  expect(model.doneOn(model.reopen(finished, active.id), '2026-11-19')).toEqual([]);
});

it('discards only the named session, as if it had never begun', () => {
  const earlier = model.startWork(frozen(smallDay), 'post', now);
  const paused = model.stopWork(frozen(earlier), 'post', later);
  const restart = new Date(`${date}T10:00`);
  const resumed = model.startWork(frozen(paused), 'post', restart);
  const before = model.running(frozen(resumed))!;
  expect(before.sessions).toHaveLength(2);

  const undone = model.discardSession(frozen(resumed), 'post', restart.toISOString());
  const post = undone.find((t) => t.id === 'post')!;
  // The earlier, closed session is untouched; the open one is gone, so nothing runs.
  expect(post.sessions).toEqual([{ start: now.toISOString(), stop: later.toISOString() }]);
  expect(model.running(undone)).toBeUndefined();
  expect(model.minutesWorked(post, new Date(`${date}T12:00`))).toBe(20);
  // Every other task is the same object, so nothing else was touched.
  for (const task of undone)
    if (task.id !== 'post') expect(task).toBe(resumed.find((t) => t.id === task.id));

  // Twice is the same as once, and an unknown task is still refused.
  expect(model.discardSession(frozen(undone), 'post', restart.toISOString())).toEqual(undone);
  expect(() => model.discardSession(undone, 'nobody', restart.toISOString())).toThrow(RangeError);
});

it('keeps parent and step completion independent in both directions', () => {
  const parentDone = model.complete(frozen(smallDay), 'list', now);
  expect(model.doneOn(parentDone, date).map((t) => t.id)).toEqual(['list']);
  expect(model.running(parentDone)?.id).toBe('step-0');
  const stepsDone = model
    .stepsOf(smallDay, 'list')
    .reduce<readonly model.Task[]>(
      (tasks, step) => model.complete(frozen(tasks), step.id, now),
      smallDay,
    );
  expect(model.doneOn(stepsDone, date).map((t) => t.id)).toEqual(['step-0', 'step-1', 'step-2']);
});

it('orders direct siblings and removes the entire subtree, not unrelated tasks', () => {
  const nested = model.addStep(frozen(smallDay), 'step-0', 'Check the drawer', now);
  const ids = ['step-2', 'step-0', 'step-1'];
  const ordered = model.reorderSteps(frozen(nested), 'list', ids);
  expect(model.stepsOf(frozen(ordered), 'list').map((t) => t.id)).toEqual(ids);
  expect(model.stepsOf(ordered, 'step-0')).toHaveLength(1);
  expect(() => model.reorderSteps(ordered, 'list', ['step-2', 'step-2', 'step-0'])).toThrow();
  expect(model.remove(ordered, 'list')).toEqual(smallDay.filter((t) => t.id === 'post'));
});

it('supplies a five-task day and a thirty-day history spanning a month boundary', () => {
  expect(smallDay).toHaveLength(5);
  expect(smallDay.filter((t) => t.sessions.some((s) => !s.stop))).toHaveLength(1);
  expect(thirtyDays).toHaveLength(30);
  expect(model.doneOn(thirtyDays, '2026-10-25')).toHaveLength(1);
  expect(model.doneOn(thirtyDays, '2026-11-23')).toHaveLength(1);
  expect(new Set(thirtyDays.map((t) => t.doneAt)).size).toBe(30);
});
