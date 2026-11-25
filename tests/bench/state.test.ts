import { describe, expect, it } from 'vitest';
import * as model from '../../src/domains/tasks';
import type { Task } from '../../src/domains/tasks';
import { runsOn } from '../../src/domains/routines';
import { ANYTIME, EMAIL, buildScenario, exampleDay } from '../../src/bench/example';

// The prototype's rules, as pure functions, at the scenes design/lantern/SPEC.md
// draws (PROTOTYPE-PLAN.md section 7):
//
//   screens 1 to 6, 8 and 9   Tuesday 24 November 2026, 10:05
//   screen 7                  9:58 the same day
//   screen 7c                 13:20 the same day
//   screen 7b                 Monday 14 December, 9:12
//
// Times are local, as the phone's are. Nothing here reads the real clock.

const at = (local: string) => new Date(local);
const TUE_1005 = at('2026-11-24T10:05:00');
const TUE_0958 = at('2026-11-24T09:58:00');
const TUE_1320 = at('2026-11-24T13:20:00');
const MON_0912 = at('2026-12-14T09:12:00');

const byTitle = (tasks: readonly Task[], title: string): Task => {
  const task = tasks.find((t) => t.title === title && t.parentId === undefined);
  if (!task) throw new Error(`No task called ${title}`);
  return task;
};
const titles = (tasks: readonly Task[]) => tasks.map((t) => t.title);
const topLevel = (tasks: readonly Task[]) => tasks.filter((t) => t.parentId === undefined);

describe('exampleDay', () => {
  it('is the board day at 10:05: the email running at step 2 of 3 since 9:58', () => {
    const { tasks } = exampleDay(TUE_1005);
    const email = byTitle(tasks, EMAIL);
    expect(model.running(tasks)?.id).toBe(email.id);
    expect(email.sessions).toEqual([{ start: at('2026-11-24T09:58:00').toISOString() }]);
    expect(email.estimateMinutes).toBe(25);
    expect(email.notes).toBe('When is the permission slip due?');
    expect(email.when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    const steps = model.stepsOf(tasks, email.id);
    expect(titles(steps)).toEqual([
      'Find the school address',
      'Write the question',
      'Read it once and send',
    ]);
    expect(steps.map((s) => s.doneAt)).toEqual([
      at('2026-11-24T10:02:00').toISOString(),
      undefined,
      undefined,
    ]);
    expect(Math.round(model.minutesWorked(email, TUE_1005))).toBe(7);
  });

  it('books the dentist at 10:30, the park at 11:00 and the bank at 14:00', () => {
    const { timed } = model.forDate(exampleDay(TUE_1005).tasks, '2026-11-24');
    expect(timed.map((t) => [t.when.time, t.title, t.when.durationMinutes])).toEqual([
      ['10:30', 'Call the dentist', 10],
      ['11:00', 'Walk to the park', 20],
      ['14:00', 'Ring the bank', 15],
    ]);
  });

  it('puts the email first in Anytime today, then the ten of SPEC 5.2 in order', () => {
    const { anytime } = model.forDate(exampleDay(TUE_1005).tasks, '2026-11-24');
    expect(titles(anytime.filter((t) => t.doneAt === undefined))).toEqual([EMAIL, ...ANYTIME]);
  });

  it('has Bins out done earlier today', () => {
    const tasks = exampleDay(TUE_1005).tasks;
    expect(titles(model.doneOn(tasks, '2026-11-24'))).toContain('Bins out');
    expect(Date.parse(byTitle(tasks, 'Bins out').doneAt!)).toBeLessThan(TUE_1005.getTime());
  });

  it('keeps the inbox in the order things came in, with steps, minutes and a note', () => {
    const tasks = exampleDay(TUE_1005).tasks;
    const inbox = topLevel(model.inbox(tasks));
    expect(titles(inbox)).toEqual([
      'Birthday present for Mum',
      'Cancel the gym trial',
      'Ask about the boiler quote',
      'Look into swimming lessons',
      'Return the library books',
      'Fix the bike light',
    ]);
    expect(model.stepsOf(tasks, byTitle(tasks, 'Cancel the gym trial').id)).toHaveLength(2);
    const swimming = byTitle(tasks, 'Look into swimming lessons');
    expect(model.stepsOf(tasks, swimming.id)).toHaveLength(3);
    expect(swimming.estimateMinutes).toBe(30);
    expect(byTitle(tasks, 'Return the library books').estimateMinutes).toBe(15);
    expect(byTitle(tasks, 'Ask about the boiler quote').notes).toBe(
      'Thursday or Friday morning, before eleven',
    );
  });

  it('has four routines, Morning run earlier today and Leaving the house timed', () => {
    const { routines } = exampleDay(TUE_1005);
    expect(routines.routines.map((r) => [r.title, r.steps.length])).toEqual([
      ['Morning', 6],
      ['Leaving the house', 4],
      ['Evening wind-down', 5],
      ['Sunday reset', 7],
    ]);
    const leaving = routines.routines[1]!;
    expect(leaving.steps[1]).toMatchObject({ title: 'Put shoes on', minutes: 2 });
    const ran = runsOn(routines.runs, '2026-11-24');
    expect(ran).toHaveLength(1);
    expect(ran[0]?.routineId).toBe(routines.routines[0]!.id);
    expect(ran[0]?.finishedAt).toBeDefined();
  });

  it('is the same day before anything began, at 9:58 (screen 7)', () => {
    const { tasks } = exampleDay(TUE_0958, { started: false });
    const email = byTitle(tasks, EMAIL);
    expect(model.running(tasks)).toBeUndefined();
    expect(email.sessions).toEqual([]);
    expect(model.stepsOf(tasks, email.id).every((s) => s.doneAt === undefined)).toBe(true);
    expect(model.forDate(tasks, '2026-11-24').timed[0]?.when.time).toBe('10:30');
  });

  it('leaves out any slot that would end after 23:30', () => {
    const late = model.forDate(exampleDay(at('2026-11-24T22:00:00')).tasks, '2026-11-24').timed;
    expect(late.map((t) => t.when.time)).toEqual(['22:30', '23:00']);
    expect(model.forDate(exampleDay(at('2026-11-24T23:10:00')).tasks, '2026-11-24').timed).toEqual(
      [],
    );
  });

  it('belongs to the logging day in the small hours, with nothing booked', () => {
    const { tasks } = exampleDay(at('2026-11-25T01:00:00'));
    expect(byTitle(tasks, EMAIL).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(model.forDate(tasks, '2026-11-24').timed).toEqual([]);
    expect(model.forDate(tasks, '2026-11-25').timed).toEqual([]);
  });
});

describe('buildScenario', () => {
  it('a pause left: the day built at 10:05 and the email paused then, seen at 13:20', () => {
    const built = buildScenario('pauseLeft', TUE_1320);
    const email = byTitle(built.tasks, EMAIL);
    expect(model.running(built.tasks)).toBeUndefined();
    expect(email.sessions).toEqual([
      { start: at('2026-11-24T09:58:00').toISOString(), stop: TUE_1005.toISOString() },
    ]);
    expect(model.forDate(built.tasks, '2026-11-24').timed[0]?.when.time).toBe('10:30');
    expect(built.day).toBe('2026-11-24');
    expect(built.away).toBeUndefined();
  });

  it('a clock left running: still open, and away since 1 h 50 ago', () => {
    const built = buildScenario('clockLeftRunning', TUE_1005);
    expect(model.running(built.tasks)?.title).toBe(EMAIL);
    expect(built.away).toEqual({ since: at('2026-11-24T08:15:00').toISOString() });
  });

  it('weeks away: the day built three weeks before Monday 14 December', () => {
    const built = buildScenario('weeksAway', MON_0912);
    expect(built.day).toBe('2026-11-23');
    expect(byTitle(built.tasks, EMAIL).when).toEqual({ kind: 'anytime', date: '2026-11-23' });
  });

  it('start empty: nothing at all', () => {
    const built = buildScenario('empty', TUE_1005);
    expect(built.tasks).toEqual([]);
    expect(built.routines).toEqual({ routines: [], runs: [] });
    expect(built.day).toBe('2026-11-24');
  });
});
