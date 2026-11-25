import { describe, expect, it } from 'vitest';
import * as model from '../../src/domains/tasks';
import type { Task } from '../../src/domains/tasks';
import { runsOn } from '../../src/domains/routines';
import { setOption } from '../../src/domains/options';
import { emptyDomains } from '../../src/kernel/store';
import { loggingDay } from '../../src/kernel/dates';
import { ANYTIME, EMAIL, buildScenario, exampleDay } from '../../src/bench/example';
import {
  barState,
  capsuleLook,
  capsuleMode,
  closeForgotten,
  dayBoundary,
  drawerPositions,
  focusFoot,
  handleLabel,
  handleLines,
  idleLantern,
  idleStatus,
  loadScenario,
  migrateBench,
  minutesWords,
  nextLine,
  passSlots,
  present,
  restOfToday,
  restoreRule,
  stepFacts,
  timeFacts,
  wake,
  type BenchDomains,
  type NextLine,
  type NextResult,
  type Present,
} from '../../src/bench/state';
import type { ScenarioId } from '../../src/bench/example';

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

// ---------------------------------------------------------------- the rules

const minute = 60_000;
const plus = (time: Date, minutes: number) => new Date(time.getTime() + minutes * minute);
const fresh = (now: Date): BenchDomains => migrateBench(emptyDomains(), now);
const scene = (id: ScenarioId, now: Date): BenchDomains => loadScenario(fresh(now), id, now);
const idOf = (state: BenchDomains, title: string) => byTitle(state.tasks, title).id;
const withTasks = (state: BenchDomains, tasks: readonly Task[]): BenchDomains => ({
  ...state,
  tasks,
});
const line = (result: NextResult): NextLine => {
  if (result.kind !== 'line') throw new Error('Expected a Next line, not the lip');
  return result;
};
/** Every task dated today done, except the ones named. */
const allDoneBut = (state: BenchDomains, keep: readonly string[], at: Date): BenchDomains =>
  withTasks(
    state,
    state.tasks
      .filter((t) => t.parentId === undefined && t.when.kind !== 'none' && !keep.includes(t.title))
      .reduce<readonly Task[]>((list, t) => model.complete(list, t.id, at), state.tasks),
  );

describe('present', () => {
  it('is the running task while a session is open (screen 1)', () => {
    const now = present(scene('example', TUE_1005), TUE_1005);
    expect(now.kind).toBe('running');
    expect(now.kind !== 'none' && now.task.title).toBe(EMAIL);
  });

  it('is the task stopped today when nothing runs (screen 7c)', () => {
    const now = present(scene('pauseLeft', TUE_1320), TUE_1320);
    expect(now).toMatchObject({ kind: 'paused', closedByApp: false });
    expect(now.kind !== 'none' && now.task.title).toBe(EMAIL);
  });

  it('knows a session the app closed itself', () => {
    expect(present(scene('clockLeftRunning', TUE_1005), TUE_1005)).toMatchObject({
      kind: 'paused',
      closedByApp: true,
    });
  });

  it('goes when set aside, and comes back when paused again after a resume', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const email = idOf(paused, EMAIL);
    const aside: BenchDomains = {
      ...paused,
      bench: { ...paused.bench, setAside: { taskId: email, at: TUE_1320.toISOString() } },
    };
    expect(present(aside, TUE_1320).kind).toBe('none');
    const resumed = withTasks(aside, model.startWork(aside.tasks, email, plus(TUE_1320, 1)));
    expect(present(resumed, plus(TUE_1320, 2)).kind).toBe('running');
    const again = withTasks(resumed, model.stopWork(resumed.tasks, email, plus(TUE_1320, 5)));
    expect(present(again, plus(TUE_1320, 6)).kind).toBe('paused');
  });

  it('ends by itself at 04:00, when the logging day ends', () => {
    const paused = scene('pauseLeft', TUE_1320);
    expect(present(paused, at('2026-11-25T03:59:00')).kind).toBe('paused');
    expect(present(paused, at('2026-11-25T04:00:00')).kind).toBe('none');
  });

  it('ends when anything else starts', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const started = withTasks(
      paused,
      model.startWork(paused.tasks, idOf(paused, 'Ring the bank'), TUE_1320),
    );
    const now = present(started, TUE_1320);
    expect(now.kind === 'running' && now.task.title).toBe('Ring the bank');
  });

  it('is never a task that is done', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const done = withTasks(paused, model.complete(paused.tasks, idOf(paused, EMAIL), TUE_1320));
    expect(present(done, TUE_1320).kind).toBe('none');
  });

  it('stays ended after Start this instead, once the other task is done', () => {
    const state = scene('example', TUE_1005);
    const dentist = idOf(state, 'Call the dentist');
    const instead = withTasks(state, model.startWork(state.tasks, dentist, plus(TUE_1005, 1)));
    const done = withTasks(instead, model.complete(instead.tasks, dentist, plus(TUE_1005, 5)));
    // The dentist was the task most recently worked on today, and it is done.
    expect(present(done, plus(TUE_1005, 6))).toEqual({ kind: 'none' });
  });

  it('stays ended when another task is started and then done', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const bank = idOf(paused, 'Ring the bank');
    const started = withTasks(paused, model.startWork(paused.tasks, bank, TUE_1320));
    const done = withTasks(started, model.complete(started.tasks, bank, plus(TUE_1320, 10)));
    expect(present(done, plus(TUE_1320, 11))).toEqual({ kind: 'none' });
  });

  it('is not ended by ticking off a task that was never worked on', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const ticked = withTasks(
      paused,
      model.complete(paused.tasks, idOf(paused, 'Ring the bank'), TUE_1320),
    );
    const now = present(ticked, plus(TUE_1320, 1));
    expect(now.kind === 'paused' && now.task.title).toBe(EMAIL);
  });
});

describe('stepFacts', () => {
  it('finds the current step, the one before it and the one after (screens 1 and 4)', () => {
    const state = scene('example', TUE_1005);
    const facts = stepFacts(state.tasks, byTitle(state.tasks, EMAIL));
    expect(facts.current?.title).toBe('Write the question');
    expect(facts.position).toEqual({ number: 2, count: 3 });
    expect(facts.previousDone?.title).toBe('Find the school address');
    expect(facts.after?.title).toBe('Read it once and send');
    expect(facts.isLast).toBe(false);
    expect(facts.left).toBe(2);
  });

  it('marks the last step, where Step done reads Done', () => {
    const state = scene('example', TUE_1005);
    const email = byTitle(state.tasks, EMAIL);
    const second = stepFacts(state.tasks, email).current!;
    const tasks = model.complete(state.tasks, second.id, TUE_1005);
    const facts = stepFacts(tasks, email);
    expect(facts.current?.title).toBe('Read it once and send');
    expect(facts.isLast).toBe(true);
  });

  it('has no step and no position for a task with no steps', () => {
    const state = scene('example', TUE_1005);
    const facts = stepFacts(state.tasks, byTitle(state.tasks, 'Call the dentist'));
    expect(facts.current).toBeUndefined();
    expect(facts.position).toBeUndefined();
    expect(facts.isLast).toBe(true);
  });
});

describe('timeFacts', () => {
  const email = (state: BenchDomains) => byTitle(state.tasks, EMAIL);

  it('reads 18 of 25 minutes left, ending 10:23, at 10:05 (screen 1)', () => {
    const facts = timeFacts(email(scene('example', TUE_1005)), TUE_1005);
    expect(facts).toMatchObject({ soFar: 7, left: 18, estimate: 25, usedUp: false });
    expect(facts.endsAt).toEqual(at('2026-11-24T10:23:00'));
    expect(facts.fill).toBeCloseTo(0.72);
    expect(facts.fillMinute).toBeCloseTo(0.72);
  });

  it('rounds the minutes left up and the minutes so far down', () => {
    const facts = timeFacts(email(scene('example', TUE_1005)), at('2026-11-24T10:05:30'));
    expect(facts.left).toBe(18);
    expect(facts.soFar).toBe(7);
  });

  it('never reads 0 min left: one minute, then used up with no end time', () => {
    const task = email(scene('example', TUE_1005));
    expect(timeFacts(task, at('2026-11-24T10:22:30')).left).toBe(1);
    const spent = timeFacts(task, at('2026-11-24T10:23:00'));
    expect(spent).toMatchObject({ usedUp: true, left: undefined, endsAt: undefined, fill: 0 });
  });

  it('keeps the end time steady for the whole session', () => {
    const task = email(scene('example', TUE_1005));
    for (const time of ['10:05:00', '10:15:00', '10:20:59']) {
      expect(timeFacts(task, at(`2026-11-24T${time}`)).endsAt).toEqual(at('2026-11-24T10:23:00'));
    }
  });

  it('counts earlier sessions into the end time of a new one', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const tasks = model.startWork(paused.tasks, idOf(paused, EMAIL), TUE_1320);
    expect(timeFacts(byTitle(tasks, EMAIL), TUE_1320).endsAt).toEqual(at('2026-11-24T13:38:00'));
  });

  it('counts up an hour across the bar when there is no estimate', () => {
    const state = scene('example', TUE_1005);
    const task = model.setEstimate(state.tasks, idOf(state, EMAIL), undefined);
    const facts = timeFacts(byTitle(task, EMAIL), TUE_1005);
    expect(facts).toMatchObject({
      estimate: undefined,
      soFar: 7,
      left: undefined,
      endsAt: undefined,
    });
    expect(facts.fill).toBeCloseTo(7 / 60);
    expect(timeFacts(byTitle(task, EMAIL), at('2026-11-24T11:30:00')).fill).toBe(1);
  });

  it("falls back to a booked item's slot length (gap G6)", () => {
    const state = scene('example', TUE_1005);
    expect(timeFacts(byTitle(state.tasks, 'Call the dentist'), TUE_1005).estimate).toBe(10);
  });
});

describe("the bar and the minutes, by SPEC 4's state table", () => {
  const running = scene('example', TUE_1005);
  const task = byTitle(running.tasks, EMAIL);

  it('running: burning, "18 min left" in terracotta, then "of 25 · ends 10:23"', () => {
    const facts = timeFacts(task, TUE_1005);
    expect(barState(false, facts)).toMatchObject({ state: 'burn', frozen: false });
    expect(minutesWords(false, facts)).toEqual({
      main: '18 min left',
      rest: 'of 25 · ends 10:23',
      tone: 'time',
    });
  });

  it('estimate used up: the outline, "27 min so far", "estimate 25"', () => {
    const facts = timeFacts(task, at('2026-11-24T10:25:00'));
    expect(barState(false, facts).state).toBe('over');
    expect(minutesWords(false, facts)).toEqual({
      main: '27 min so far',
      rest: 'estimate 25',
      tone: 'time',
    });
  });

  it('no estimate: a growing length and "7 min so far"', () => {
    const tasks = model.setEstimate(running.tasks, task.id, undefined);
    const facts = timeFacts(byTitle(tasks, EMAIL), TUE_1005);
    expect(barState(false, facts).state).toBe('countUp');
    expect(minutesWords(false, facts)).toEqual({
      main: '7 min so far',
      rest: undefined,
      tone: 'time',
    });
  });

  it('paused: frozen in ash, "18 min left" in white and "of 25", no end time', () => {
    const paused = scene('pauseLeft', TUE_1320);
    const facts = timeFacts(byTitle(paused.tasks, EMAIL), TUE_1320);
    expect(barState(true, facts)).toMatchObject({ state: 'paused', frozen: true });
    expect(barState(true, facts).p).toBeCloseTo(0.72);
    expect(minutesWords(true, facts)).toEqual({
      main: '18 min left',
      rest: 'of 25',
      tone: 'still',
    });
  });

  it('paused with the estimate used up: the outline and "estimate 25" alone', () => {
    const closed = scene('clockLeftRunning', TUE_1005);
    const facts = timeFacts(byTitle(closed.tasks, EMAIL), TUE_1005);
    expect(barState(true, facts).state).toBe('over');
    expect(minutesWords(true, facts)).toEqual({
      main: 'estimate 25',
      rest: undefined,
      tone: 'still',
    });
  });
});

describe('restOfToday', () => {
  it('lists the booked items by time and the anytime items in order, not the present task', () => {
    const rest = restOfToday(scene('example', TUE_1005), TUE_1005);
    expect(titles(rest.later)).toEqual(['Call the dentist', 'Walk to the park', 'Ring the bank']);
    expect(titles(rest.anytime)).toEqual([...ANYTIME]);
    expect(rest.next?.task.title).toBe('Call the dentist');
    expect(rest.next?.inMinutes).toBe(25);
  });

  it('lists Done today only when "List what got done today" is on', () => {
    const state = scene('example', TUE_1005);
    expect(restOfToday(state, TUE_1005).done).toBeUndefined();
    const on = { ...state, rewards: setOption(state.rewards, { kind: 'day' }, 'doneList', true) };
    expect(titles(restOfToday(on, TUE_1005).done ?? [])).toEqual(['Bins out']);
  });

  it('puts passed slots first, in the order they passed (screen 7c)', () => {
    // The paused email is the present task, so it is in no list.
    const rest = restOfToday(scene('pauseLeft', TUE_1320), TUE_1320);
    expect(titles(rest.anytime).slice(0, 3)).toEqual([
      'Call the dentist',
      'Walk to the park',
      'Renew the parking permit',
    ]);
    expect(titles(rest.later)).toEqual(['Ring the bank']);
  });

  it('includes the present task for Tasks › Today', () => {
    const rest = restOfToday(scene('example', TUE_1005), TUE_1005, { includePresent: true });
    expect(rest.anytime[0]?.title).toBe(EMAIL);
  });

  it('leaves out the item the idle lantern lights, for the half drawer (screen 7)', () => {
    const state = scene('notStarted', TUE_0958);
    const rest = restOfToday(state, TUE_0958, { exclude: idOf(state, EMAIL) });
    expect(titles(rest.anytime)).toEqual([...ANYTIME]);
  });

  it('keeps a row ticked since the list was opened in its place', () => {
    const state = scene('example', TUE_1005);
    const permit = idOf(state, 'Renew the parking permit');
    const ticked = withTasks(state, model.complete(state.tasks, permit, TUE_1005));
    expect(titles(restOfToday(ticked, TUE_1005).anytime)).not.toContain('Renew the parking permit');
    const kept = restOfToday(ticked, TUE_1005, { keep: new Set([permit]) });
    expect(kept.anytime[0]?.title).toBe('Renew the parking permit');
    expect(kept.anytime[0]?.doneAt).toBeDefined();
  });
});

describe('the Next line, row by row (SPEC 9.8)', () => {
  it('1. a booked item starts within 15 minutes: "Next · in 10 min"', () => {
    const next = line(nextLine(scene('example', TUE_1005), at('2026-11-24T10:20:00')));
    expect(next.row).toBe('soon');
    expect(handleLines(next)).toEqual({
      line1: 'Next · in 10 min',
      time: '10:30',
      title: 'Call the dentist',
    });
    expect(handleLabel(next)).toBe('Next, in 10 minutes: 10:30, Call the dentist. Rest of today');
  });

  it('2. a slot under way and not started: "Next · until 10:40"', () => {
    const next = line(nextLine(scene('example', TUE_1005), at('2026-11-24T10:33:00')));
    expect(next.row).toBe('underway');
    expect(handleLines(next)).toEqual({
      line1: 'Next · until 10:40',
      time: '10:30',
      title: 'Call the dentist',
    });
  });

  it('3. a passed slot at the top of Anytime today: "Anytime today" over its title (7c)', () => {
    const next = line(nextLine(scene('pauseLeft', TUE_1320), TUE_1320));
    expect(next.row).toBe('passed');
    expect(handleLines(next)).toEqual({
      line1: 'Anytime today',
      time: undefined,
      title: 'Call the dentist',
    });
    expect(handleLabel(next)).toBe('Anytime today: Call the dentist. Rest of today');
  });

  it('4. a booked item is next: "Next · in 25 min" over "10:30 Call the dentist" (screen 1)', () => {
    const next = line(nextLine(scene('example', TUE_1005), TUE_1005));
    expect(next.row).toBe('next');
    expect(handleLines(next)).toEqual({
      line1: 'Next · in 25 min',
      time: '10:30',
      title: 'Call the dentist',
    });
    expect(handleLabel(next)).toBe('Next, in 25 minutes: 10:30, Call the dentist. Rest of today');
  });

  it('5. no booked item left: "Anytime today" over the first anytime title', () => {
    const state = scene('example', TUE_1005);
    const unbooked = ['Call the dentist', 'Walk to the park', 'Ring the bank'].reduce(
      (tasks, title) => model.unschedule(tasks, byTitle(tasks, title).id),
      state.tasks as readonly Task[],
    );
    const next = line(nextLine(withTasks(state, unbooked), TUE_1005));
    expect(next.row).toBe('anytime');
    expect(handleLines(next).line1).toBe('Anytime today');
    expect(next.title).toBe('Renew the parking permit');
  });

  it('6. nothing left for today: "Rest of today" over "Nothing else planned"', () => {
    const state = allDoneBut(scene('example', TUE_1005), [EMAIL], TUE_1005);
    const next = line(nextLine(state, TUE_1005));
    expect(next.row).toBe('nothing');
    expect(handleLines(next)).toEqual({
      line1: 'Rest of today',
      time: undefined,
      title: 'Nothing else planned',
    });
  });

  it('rests at the lip when nothing runs, nothing is paused and nothing is dated today (7b)', () => {
    expect(nextLine(scene('weeksAway', MON_0912), MON_0912)).toEqual({ kind: 'lip' });
    expect(nextLine(scene('empty', MON_0912), MON_0912)).toEqual({ kind: 'lip' });
  });

  it('puts the six-second rows above every other row', () => {
    const next = line(
      nextLine(scene('example', TUE_1005), at('2026-11-24T10:20:00'), {
        line1: 'Step done',
        line2: 'Write the question',
      }),
    );
    expect(next.row).toBe('undo');
    expect(handleLines(next)).toEqual({
      line1: 'Step done',
      time: undefined,
      title: 'Write the question',
    });
  });

  it('puts a booked item within 15 minutes above a passed slot', () => {
    const next = line(nextLine(scene('pauseLeft', TUE_1320), at('2026-11-24T13:50:00')));
    expect(handleLines(next)).toEqual({
      line1: 'Next · in 10 min',
      time: '14:00',
      title: 'Ring the bank',
    });
  });

  it('puts a slot under way above a passed slot', () => {
    const next = line(nextLine(scene('pauseLeft', TUE_1320), at('2026-11-24T14:05:00')));
    expect(handleLines(next).line1).toBe('Next · until 14:15');
  });

  it('never names the present task, which is in no list', () => {
    const state = allDoneBut(scene('example', TUE_1005), [EMAIL, 'Order printer ink'], TUE_1005);
    expect(line(nextLine(state, TUE_1005)).title).toBe('Order printer ink');
  });
});

describe("Focus's foot follows the same rows (SPEC 5.4)", () => {
  it('reads "Later today" where the Next line reads "Next"', () => {
    const foot = focusFoot(line(nextLine(scene('example', TUE_1005), TUE_1005)));
    expect(foot).toEqual({
      text: 'Later today · 10:30 Call the dentist · in 25 min',
      label: 'Later today: 10:30, Call the dentist, in 25 minutes',
    });
  });

  it('names a booked item within 15 minutes, and a slot under way', () => {
    const state = scene('example', TUE_1005);
    expect(focusFoot(line(nextLine(state, at('2026-11-24T10:20:00')))).text).toBe(
      'Later today · 10:30 Call the dentist · in 10 min',
    );
    expect(focusFoot(line(nextLine(state, at('2026-11-24T10:33:00')))).text).toBe(
      'Later today · 10:30 Call the dentist · until 10:40',
    );
  });

  it('names the first anytime item when no booked item is left', () => {
    const state = scene('example', TUE_1005);
    const unbooked = ['Call the dentist', 'Walk to the park', 'Ring the bank'].reduce(
      (tasks, title) => model.unschedule(tasks, byTitle(tasks, title).id),
      state.tasks as readonly Task[],
    );
    expect(focusFoot(line(nextLine(withTasks(state, unbooked), TUE_1005)))).toEqual({
      text: 'Anytime today · Renew the parking permit',
      label: 'Anytime today: Renew the parking permit',
    });
  });

  it('names the passed call in paused Focus at 13:20, not 14:00', () => {
    const foot = focusFoot(line(nextLine(scene('pauseLeft', TUE_1320), TUE_1320)));
    expect(foot).toEqual({
      text: 'Anytime today · Call the dentist',
      label: 'Anytime today: Call the dentist',
    });
  });

  it('says when nothing else is planned, and carries the six-second line', () => {
    const state = allDoneBut(scene('example', TUE_1005), [EMAIL], TUE_1005);
    expect(focusFoot(line(nextLine(state, TUE_1005))).text).toBe(
      'Rest of today · Nothing else planned',
    );
    const saved = nextLine(state, TUE_1005, {
      line1: 'Saved to the inbox',
      line2: 'Ask Ana about Friday',
    });
    expect(focusFoot(line(saved)).text).toBe('Saved to the inbox · Ask Ana about Friday');
  });
});

describe('the idle lantern, rule by rule (SPEC 5.7)', () => {
  it('2. lights the first item in Anytime today (screen 7 at 9:58)', () => {
    const idle = idleLantern(scene('notStarted', TUE_0958), TUE_0958);
    expect(idle).toMatchObject({
      rule: 2,
      firstStep: 'Find the school address',
      stepsLeft: 3,
      minutes: 25,
    });
    expect(idle.rule === 2 && idle.task.title).toBe(EMAIL);
    expect(idle.rule === 2 && idle.endsAbout).toEqual(at('2026-11-24T10:23:00'));
    expect(idleStatus(idle)).toBe('free until 10:30');
  });

  it('1. lights a booked item starting within 15 minutes: "starts at 10:30, in 5 min"', () => {
    const idle = idleLantern(scene('notStarted', TUE_0958), at('2026-11-24T10:25:00'));
    expect(idle).toMatchObject({ rule: 1, underway: false, inMinutes: 5 });
    expect(idle.rule === 1 && idle.task.title).toBe('Call the dentist');
    expect(idleStatus(idle)).toBe('starts at 10:30, in 5 min');
  });

  it('1. lights a slot under way and not started: "until 10:40" (undrawn)', () => {
    const idle = idleLantern(scene('notStarted', TUE_0958), at('2026-11-24T10:33:00'));
    expect(idle).toMatchObject({ rule: 1, underway: true });
    expect(idleStatus(idle)).toBe('until 10:40');
  });

  it('3. with Anytime today empty and booked items to come: free until the next', () => {
    const state = allDoneBut(scene('notStarted', TUE_0958), ['Ring the bank'], TUE_0958);
    const idle = idleLantern(state, at('2026-11-24T11:45:00'));
    expect(idle.rule).toBe(3);
    expect(idle.rule === 3 && [idle.task.title, idle.at]).toEqual([
      'Ring the bank',
      at('2026-11-24T14:00:00'),
    ]);
    expect(idleStatus(idle)).toBeUndefined();
  });

  it('4. with nothing dated today: screen 7b', () => {
    expect(idleLantern(scene('weeksAway', MON_0912), MON_0912)).toEqual({
      rule: 4,
      somethingDone: false,
    });
  });

  it('4. with everything dated today done: the same, marked as a day that had a plan (undrawn)', () => {
    const state = allDoneBut(scene('notStarted', TUE_0958), [], TUE_0958);
    expect(idleLantern(state, TUE_0958)).toEqual({ rule: 4, somethingDone: true });
  });
});

describe("the capsule, by SPEC 4's table", () => {
  const running: Present = present(scene('example', TUE_1005), TUE_1005);
  const emailId = running.kind === 'none' ? '' : running.task.id;
  const none: Present = { kind: 'none' };

  it('is hidden whenever nothing runs or is paused', () => {
    expect(capsuleMode({ kind: 'place' }, none, 'folded', false)).toBe('hidden');
  });

  it('is hidden on Today with the drawer at its lip, folded or half', () => {
    for (const drawer of ['lip', 'folded', 'half'] as const) {
      expect(capsuleMode({ kind: 'today' }, running, drawer, false)).toBe('hidden');
    }
  });

  it('is hidden in Focus', () => {
    expect(capsuleMode({ kind: 'focus' }, running, 'folded', false)).toBe('hidden');
  });

  it("is hidden on the present task's own page", () => {
    const page = { kind: 'page', page: { kind: 'task', id: emailId } } as const;
    expect(capsuleMode(page, running, 'folded', false)).toBe('hidden');
  });

  it('is hidden on the crisis page, even under the open drawer', () => {
    const crisis = { kind: 'page', page: { kind: 'crisis' } } as const;
    expect(capsuleMode(crisis, running, 'folded', false)).toBe('hidden');
    expect(capsuleMode(crisis, running, 'open', false)).toBe('hidden');
  });

  it('is hidden under capture opened from Today or Focus', () => {
    expect(capsuleMode({ kind: 'today' }, running, 'folded', true)).toBe('hidden');
    expect(capsuleMode({ kind: 'focus' }, running, 'folded', true)).toBe('hidden');
  });

  it('is a button on Tasks, Routines, Library and Me, and their pushed pages', () => {
    expect(capsuleMode({ kind: 'place' }, running, 'folded', false)).toBe('button');
    for (const page of [
      { kind: 'me' },
      { kind: 'settings' },
      { kind: 'routine', id: 'r' },
    ] as const) {
      expect(capsuleMode({ kind: 'page', page }, running, 'folded', false)).toBe('button');
    }
  });

  it("is a button on any other task's page", () => {
    const page = { kind: 'page', page: { kind: 'task', id: 'another' } } as const;
    expect(capsuleMode(page, running, 'folded', false)).toBe('button');
  });

  it('is a button on the open drawer over any tab', () => {
    expect(capsuleMode({ kind: 'today' }, running, 'open', false)).toBe('button');
    const own = { kind: 'page', page: { kind: 'task', id: emailId } } as const;
    expect(capsuleMode(own, running, 'open', false)).toBe('button');
  });

  it('is a picture only under a sheet raised from a place', () => {
    expect(capsuleMode({ kind: 'place' }, running, 'folded', true)).toBe('picture');
    expect(capsuleMode({ kind: 'today' }, running, 'open', true)).toBe('picture');
  });

  it('is lifted on charcoal places, plain on white places and on the stone drawer', () => {
    expect(capsuleLook('charcoal', 'folded')).toBe('lifted');
    expect(capsuleLook('white', 'folded')).toBe('plain');
    expect(capsuleLook('charcoal', 'open')).toBe('plain');
  });
});

describe('drawer positions (SPEC 9.8)', () => {
  it('folded or open while something runs or is paused, folded by default', () => {
    for (const [id, now] of [
      ['example', TUE_1005],
      ['pauseLeft', TUE_1320],
    ] as const) {
      const rule = drawerPositions(scene(id, now), now);
      expect(rule).toMatchObject({
        mode: 'present',
        allowed: ['folded', 'open'],
        position: 'folded',
      });
    }
  });

  it('half, folded or open when idle, half by default (screen 7)', () => {
    expect(drawerPositions(scene('notStarted', TUE_0958), TUE_0958)).toEqual({
      mode: 'idle',
      allowed: ['half', 'folded', 'open'],
      position: 'half',
    });
  });

  it('only the lip with nothing dated today (7b)', () => {
    expect(drawerPositions(scene('weeksAway', MON_0912), MON_0912)).toEqual({
      mode: 'lip',
      allowed: ['lip'],
      position: 'lip',
    });
  });

  it('rests folded rather than half at large text sizes', () => {
    expect(
      drawerPositions(scene('notStarted', TUE_0958), TUE_0958, { largeText: true }),
    ).toMatchObject({
      allowed: ['folded', 'open'],
      position: 'folded',
    });
  });

  it('rests folded on places and pages, always, with half on idle Today only', () => {
    const idle = scene('notStarted', TUE_0958);
    const views = [
      { kind: 'place' },
      { kind: 'page', page: { kind: 'task', id: idOf(idle, EMAIL) } },
      { kind: 'page', page: { kind: 'me' } },
    ] as const;
    for (const view of views) {
      expect(drawerPositions(idle, TUE_0958, { view })).toEqual({
        mode: 'idle',
        allowed: ['folded', 'open'],
        position: 'folded',
      });
    }
    expect(drawerPositions(idle, TUE_0958, { view: { kind: 'today' } }).position).toBe('half');
    const opened: BenchDomains = {
      ...idle,
      bench: { ...idle.bench, drawer: { running: 'folded', idle: 'open' } },
    };
    expect(drawerPositions(opened, TUE_0958, { view: { kind: 'place' } }).position).toBe('open');
    expect(
      drawerPositions(scene('weeksAway', MON_0912), MON_0912, { view: { kind: 'place' } }).mode,
    ).toBe('lip');
  });

  it('keeps where the person left it for the day, separately for running and idle', () => {
    const idle = scene('notStarted', TUE_0958);
    const chosen: BenchDomains = {
      ...idle,
      bench: { ...idle.bench, drawer: { running: 'open', idle: 'folded' } },
    };
    expect(drawerPositions(chosen, TUE_0958).position).toBe('folded');
    const running = withTasks(chosen, model.startWork(chosen.tasks, idOf(chosen, EMAIL), TUE_0958));
    expect(drawerPositions(running, TUE_0958).position).toBe('open');
  });

  it('has no half position once everything dated today is done (undrawn)', () => {
    const state = allDoneBut(scene('notStarted', TUE_0958), [], TUE_0958);
    expect(drawerPositions(state, TUE_0958)).toMatchObject({
      mode: 'idle',
      allowed: ['folded', 'open'],
      position: 'folded',
    });
  });
});

describe('a forgotten clock (SPEC 4)', () => {
  const awayFrom = (state: BenchDomains, since: string): BenchDomains => ({
    ...state,
    bench: { ...state.bench, away: { since: at(since).toISOString() } },
  });
  const running = () => scene('example', TUE_1005);

  it('is left alone inside the 15 minutes past its estimate', () => {
    const away = awayFrom(running(), '2026-11-24T10:10:00');
    for (const time of ['10:30:00', '10:38:00']) {
      const result = closeForgotten(away, at(`2026-11-24T${time}`));
      expect(result.closed).toBeUndefined();
      expect(result.state).toBe(away);
    }
  });

  it('closes at the moment the estimate ran out, and opens paused and used up', () => {
    const away = awayFrom(running(), '2026-11-24T10:10:00');
    const later = at('2026-11-24T10:39:00');
    const { state, closed } = closeForgotten(away, later);
    const email = byTitle(state.tasks, EMAIL);
    expect(closed).toBe(email.id);
    expect(email.sessions.at(-1)?.stop).toBe(at('2026-11-24T10:23:00').toISOString());
    expect(present(state, later)).toMatchObject({ kind: 'paused', closedByApp: true });
    expect(minutesWords(true, timeFacts(email, later)).main).toBe('estimate 25');
  });

  it('closes at the estimate even when the person watched it run past before leaving', () => {
    const away = awayFrom(running(), '2026-11-24T10:30:00');
    expect(closeForgotten(away, at('2026-11-24T10:45:00')).closed).toBeUndefined();
    const { state } = closeForgotten(away, at('2026-11-24T10:45:01'));
    expect(byTitle(state.tasks, EMAIL).sessions.at(-1)?.stop).toBe(
      at('2026-11-24T10:23:00').toISOString(),
    );
  });

  it('with no estimate, closes at the last moment the app was open', () => {
    const base = running();
    const open = withTasks(base, model.setEstimate(base.tasks, idOf(base, EMAIL), undefined));
    const away = awayFrom(open, '2026-11-24T10:10:00');
    expect(closeForgotten(away, at('2026-11-24T10:25:00')).closed).toBeUndefined();
    const { state } = closeForgotten(away, at('2026-11-24T10:25:01'));
    expect(byTitle(state.tasks, EMAIL).sessions.at(-1)?.stop).toBe(
      at('2026-11-24T10:10:00').toISOString(),
    );
  });

  it('closes nothing if the page was killed before it said it went away', () => {
    const state = running();
    expect(closeForgotten(state, at('2026-11-24T18:00:00')).state).toBe(state);
  });

  it('ignores a record of going away from before the session began', () => {
    const away = awayFrom(running(), '2026-11-24T09:50:00');
    expect(closeForgotten(away, at('2026-11-24T18:00:00')).closed).toBeUndefined();
  });
});

describe('slots that pass unstarted (SPEC 9.8)', () => {
  it('go to the top of Anytime today in slot order, with no time and no mark', () => {
    const state = passSlots(scene('notStarted', TUE_0958), at('2026-11-24T11:30:00'));
    const dentist = byTitle(state.tasks, 'Call the dentist');
    expect(dentist.when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(state.bench.passed).toEqual([dentist.id, idOf(state, 'Walk to the park')]);
    const rest = restOfToday(state, at('2026-11-24T11:30:00'));
    expect(titles(rest.anytime).slice(0, 3)).toEqual([
      'Call the dentist',
      'Walk to the park',
      EMAIL,
    ]);
  });

  it('add a later pass after the earlier ones', () => {
    const first = passSlots(scene('notStarted', TUE_0958), at('2026-11-24T10:45:00'));
    expect(first.bench.passed).toEqual([idOf(first, 'Call the dentist')]);
    const second = passSlots(first, at('2026-11-24T11:30:00'));
    expect(second.bench.passed).toEqual([
      idOf(second, 'Call the dentist'),
      idOf(second, 'Walk to the park'),
    ]);
  });

  it('leave alone an item started today, and the present one', () => {
    const state = scene('notStarted', TUE_0958);
    const dentist = idOf(state, 'Call the dentist');
    let tasks = model.startWork(state.tasks, dentist, at('2026-11-24T10:30:00'));
    tasks = model.stopWork(tasks, dentist, at('2026-11-24T10:35:00'));
    const passed = passSlots(withTasks(state, tasks), at('2026-11-24T11:30:00'));
    expect(byTitle(passed.tasks, 'Call the dentist').when.kind).toBe('timed');
    expect(passed.bench.passed).toEqual([idOf(passed, 'Walk to the park')]);
  });

  it('change nothing the second time', () => {
    const once = passSlots(scene('notStarted', TUE_0958), at('2026-11-24T11:30:00'));
    expect(passSlots(once, at('2026-11-24T11:30:00'))).toBe(once);
  });
});

describe('slots in the small hours', () => {
  /** The board's day at 9:58, with the bank call moved to `time` for `minutes`. */
  const bankAt = (time: string, minutes: number): BenchDomains => {
    const state = scene('notStarted', TUE_0958);
    return withTasks(
      state,
      model.schedule(state.tasks, idOf(state, 'Ring the bank'), {
        kind: 'timed',
        date: '2026-11-24',
        time,
        durationMinutes: minutes,
      }),
    );
  };
  const bank = (state: BenchDomains) => byTitle(state.tasks, 'Ring the bank');

  it('a slot that crosses midnight is under way until it ends, on its own day', () => {
    const state = bankAt('23:50', 20);
    expect(line(nextLine(state, at('2026-11-24T23:45:00')))).toMatchObject({
      row: 'soon',
      title: 'Ring the bank',
      inMinutes: 5,
    });
    const underway = line(nextLine(state, at('2026-11-25T00:05:00')));
    expect(handleLines(underway)).toEqual({
      line1: 'Next · until 0:10',
      time: '23:50',
      title: 'Ring the bank',
    });
    expect(idleLantern(state, at('2026-11-25T00:05:00'))).toMatchObject({
      rule: 1,
      underway: true,
      end: at('2026-11-25T00:10:00'),
    });
  });

  it('a slot that crosses midnight passes when it ends, after midnight', () => {
    const state = bankAt('23:50', 20);
    expect(bank(passSlots(state, at('2026-11-25T00:09:00'))).when.kind).toBe('timed');
    const passed = passSlots(state, at('2026-11-25T00:10:00'));
    expect(bank(passed).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(passed.bench.passed.at(-1)).toBe(bank(passed).id);
  });

  it('a time booked before 04:00 is in the night after its day, last in Later today', () => {
    const state = bankAt('02:30', 15);
    const rest = restOfToday(state, TUE_0958);
    expect(rest.later.map((t) => t.when.time)).toEqual(['10:30', '11:00', '02:30']);
    expect(passSlots(state, at('2026-11-24T23:00:00')).bench.passed).not.toContain(bank(state).id);
    // With everything else done, it is next, three and a half hours on.
    const quiet = allDoneBut(state, ['Ring the bank'], TUE_0958);
    const late = line(nextLine(quiet, at('2026-11-24T23:00:00')));
    expect(handleLines(late)).toEqual({
      line1: 'Next · in 3 h 30 min',
      time: '2:30',
      title: 'Ring the bank',
    });
    expect(idleLantern(quiet, at('2026-11-24T23:00:00'))).toMatchObject({
      rule: 3,
      at: at('2026-11-25T02:30:00'),
    });
    const passed = passSlots(state, at('2026-11-25T02:45:00'));
    expect(bank(passed).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
  });
});

describe('the 04:00 boundary (SPEC 5.7)', () => {
  const WED_0900 = at('2026-11-25T09:00:00');

  it('sends the past day back to the inbox, closes its clock and starts the day afresh', () => {
    const before = scene('example', TUE_1005);
    const marked: BenchDomains = {
      ...before,
      bench: {
        ...before.bench,
        passed: ['x'],
        drawer: { running: 'open', idle: 'open' },
        setAside: { taskId: 'x', at: TUE_1005.toISOString() },
        closedByApp: { taskId: 'x', at: TUE_1005.toISOString() },
        ui: { at: TUE_1005.toISOString(), tab: 'tasks', stack: [], list: 'inbox', scroll: {} },
        drafts: { fields: { step: 'half a thought' } },
        settings: { places: 'white', closedLabel: 'stopped', motion: 'reduced' },
      },
    };
    const after = dayBoundary(marked, WED_0900);
    const email = byTitle(after.tasks, EMAIL);
    expect(email.when).toEqual({ kind: 'none' });
    expect(email.sessions.at(-1)?.stop).toBe(at('2026-11-24T10:23:00').toISOString());
    expect(byTitle(after.tasks, 'Call the dentist').when).toEqual({ kind: 'none' });
    expect(byTitle(after.tasks, 'Bins out').when.kind).toBe('anytime');
    expect(after.bench).toEqual({
      version: 1,
      day: '2026-11-25',
      passed: [],
      drawer: { running: 'folded', idle: 'half' },
      drafts: { fields: { step: 'half a thought' } },
      settings: { places: 'white', closedLabel: 'stopped', motion: 'reduced' },
    });
    expect(present(after, WED_0900).kind).toBe('none');
  });

  it('turns at 04:00, not at midnight', () => {
    const before = scene('example', TUE_1005);
    expect(dayBoundary(before, at('2026-11-25T03:59:00'))).toBe(before);
    expect(dayBoundary(before, at('2026-11-25T04:00:00'))).not.toBe(before);
  });

  /** The example day with no estimate on the email: the clock has nothing to run out. */
  const noEstimate = () => {
    const base = scene('example', TUE_1005);
    return withTasks(base, model.setEstimate(base.tasks, idOf(base, EMAIL), undefined));
  };
  const lastStop = (state: BenchDomains) => byTitle(state.tasks, EMAIL).sessions.at(-1)?.stop;

  it('closes a clock with no estimate at the last moment the app was open', () => {
    const open = noEstimate();
    const away = {
      ...open,
      bench: { ...open.bench, away: { since: at('2026-11-24T22:00:00').toISOString() } },
    };
    expect(lastStop(dayBoundary(away, WED_0900))).toBe(at('2026-11-24T22:00:00').toISOString());
  });

  it('with no record of going away, closes it at the last page change', () => {
    const open = noEstimate();
    const seen: BenchDomains = {
      ...open,
      bench: {
        ...open.bench,
        ui: {
          at: at('2026-11-24T10:40:00').toISOString(),
          tab: 'tasks',
          stack: [],
          list: 'inbox',
          scroll: {},
        },
      },
    };
    expect(lastStop(dayBoundary(seen, WED_0900))).toBe(at('2026-11-24T10:40:00').toISOString());
  });

  it('with no record at all, closes it at the last step ticked, never at the boundary', () => {
    // Step 1 was ticked at 10:02, the last moment the record shows the app open.
    const after = dayBoundary(noEstimate(), WED_0900);
    expect(lastStop(after)).toBe(at('2026-11-24T10:02:00').toISOString());
    expect(present(after, WED_0900)).toEqual({ kind: 'none' });
  });

  it('never counts the days away as time worked, and rests at the lip weeks later', () => {
    const woken = wake(noEstimate(), MON_0912).state;
    const email = byTitle(woken.tasks, EMAIL);
    expect(loggingDay(new Date(email.sessions.at(-1)!.stop!))).toBe('2026-11-24');
    expect(model.minutesWorked(email, MON_0912)).toBeLessThan(60);
    expect(present(woken, MON_0912)).toEqual({ kind: 'none' });
    expect(nextLine(woken, MON_0912)).toEqual({ kind: 'lip' });
    expect(drawerPositions(woken, MON_0912).mode).toBe('lip');

    const nextMorning = wake(noEstimate(), WED_0900).state;
    expect(present(nextMorning, WED_0900)).toEqual({ kind: 'none' });
    expect(nextLine(nextMorning, WED_0900)).toEqual({ kind: 'lip' });
  });

  it('never closes a session after its own logging day ended', () => {
    // Started at 3:48 on Tuesday's logging day, with an estimate that runs
    // past 4:00, and no record of going away: it ends with its own day.
    const base = scene('example', TUE_1005);
    const email = idOf(base, EMAIL);
    const late = withTasks(
      base,
      base.tasks.map((t) =>
        t.id === email
          ? { ...t, sessions: [{ start: at('2026-11-25T03:48:00').toISOString() }] }
          : t,
      ),
    );
    const after = dayBoundary(late, WED_0900);
    const stop = lastStop(after)!;
    expect(loggingDay(new Date(stop))).toBe('2026-11-24');
    expect(Date.parse(stop)).toBeLessThan(at('2026-11-25T04:00:00').getTime());
    expect(present(after, WED_0900)).toEqual({ kind: 'none' });
  });

  it('lets a paused task go without a word', () => {
    expect(present(dayBoundary(scene('pauseLeft', TUE_1320), WED_0900), WED_0900).kind).toBe(
      'none',
    );
  });

  /**
   * Started at 3:48, on Tuesday's logging day, with 25 minutes, and left at
   * 3:56: the estimate runs out at 4:13, on Wednesday's.
   */
  const acrossFour = (): BenchDomains => {
    const base = scene('example', TUE_1005);
    const email = idOf(base, EMAIL);
    return {
      ...base,
      tasks: base.tasks.map((t) =>
        t.id === email
          ? { ...t, sessions: [{ start: at('2026-11-25T03:48:00').toISOString() }] }
          : t,
      ),
      bench: { ...base.bench, away: { since: at('2026-11-25T03:56:00').toISOString() } },
    };
  };

  it('keeps the mark of a clock the app closed on the new day', () => {
    const woken = wake(acrossFour(), WED_0900);
    expect(woken.closed).toBe(idOf(woken.state, EMAIL));
    expect(lastStop(woken.state)).toBe(at('2026-11-25T04:13:00').toISOString());
    expect(woken.state.bench.day).toBe('2026-11-25');
    expect(present(woken.state, WED_0900)).toMatchObject({ kind: 'paused', closedByApp: true });
  });

  it('closes a forgotten clock before turning the day on boot too', () => {
    const booted = migrateBench(acrossFour(), WED_0900);
    expect(lastStop(booted)).toBe(at('2026-11-25T04:13:00').toISOString());
    const woken = wake(booted, WED_0900, { boot: true });
    expect(present(woken.state, WED_0900)).toMatchObject({ kind: 'paused', closedByApp: true });
    expect(woken.restore).toBe('today');
  });

  it('lets marks from the day that ended go', () => {
    const state = scene('clockLeftRunning', TUE_1005);
    expect(state.bench.closedByApp).toBeDefined();
    expect(dayBoundary(state, WED_0900).bench.closedByApp).toBeUndefined();
  });
});

describe('migrateBench', () => {
  const old = () => {
    const built = exampleDay(TUE_1005);
    return {
      ...emptyDomains(),
      tasks: built.tasks,
      focus: { taskId: built.email, minutes: 25, baseWorked: 0 },
      future: { kept: true },
    };
  };

  it('drops the old focus box and adds the bench; a running session keeps running', () => {
    const migrated = migrateBench(old(), TUE_1005);
    expect('focus' in migrated).toBe(false);
    expect(migrated['future']).toEqual({ kept: true });
    expect(migrated.bench).toMatchObject({ version: 1, day: '2026-11-24', passed: [] });
    expect(model.running(migrated.tasks)?.title).toBe(EMAIL);
  });

  it('is safe to run twice', () => {
    const once = migrateBench(old(), TUE_1005);
    expect(migrateBench(once, TUE_1005)).toEqual(once);
  });

  it('keeps keys it does not know and repairs the ones it does', () => {
    const domains = {
      ...emptyDomains(),
      bench: {
        day: '2026-11-24',
        passed: [1, 'a'],
        drawer: { idle: 'sideways' },
        settings: { places: 'white', extra: true },
        drafts: { fields: { note: 'kept', bad: 3 }, capture: { text: 'Ask Ana', to: 'nowhere' } },
        ui: { at: 'x', tab: 'nowhere' },
        other: 'kept',
      },
    };
    const bench = migrateBench(domains, TUE_1005).bench;
    expect(bench).toEqual({
      version: 1,
      day: '2026-11-24',
      passed: ['a'],
      drawer: { running: 'folded', idle: 'half' },
      settings: { places: 'white', closedLabel: 'paused', motion: 'system', extra: true },
      drafts: { fields: { note: 'kept' }, capture: { text: 'Ask Ana', to: 'inbox' } },
      other: 'kept',
    });
  });

  it('puts data from another day in order: past items back to the inbox', () => {
    const migrated = migrateBench(old(), at('2026-11-26T09:00:00'));
    expect(byTitle(migrated.tasks, EMAIL).when).toEqual({ kind: 'none' });
    expect(model.running(migrated.tasks)).toBeUndefined();
  });
});

describe('wake (plan section 12)', () => {
  it('turns the day before passing slots, so a slot that passed today is kept', () => {
    const state = scene('notStarted', TUE_0958);
    const seenYesterday = { ...state, bench: { ...state.bench, day: '2026-11-23' } };
    const woken = wake(seenYesterday, at('2026-11-24T11:30:00')).state;
    expect(woken.bench.day).toBe('2026-11-24');
    expect(woken.bench.passed).toEqual([
      idOf(woken, 'Call the dentist'),
      idOf(woken, 'Walk to the park'),
    ]);
  });

  it('closes a forgotten clock first, and then opens on Today', () => {
    const state = scene('example', TUE_1005);
    const away = { ...state, bench: { ...state.bench, away: { since: TUE_1005.toISOString() } } };
    const woken = wake(away, at('2026-11-25T09:00:00'));
    expect(woken.closed).toBe(idOf(state, EMAIL));
    expect(woken.restore).toBe('today');
    expect(byTitle(woken.state.tasks, EMAIL).sessions.at(-1)?.stop).toBe(
      at('2026-11-24T10:23:00').toISOString(),
    );
  });

  it('restores exactly under 15 minutes away, and opens on Today after that', () => {
    const state = scene('example', TUE_1005);
    const left: BenchDomains = {
      ...state,
      bench: {
        ...state.bench,
        away: { since: TUE_1005.toISOString() },
        ui: { at: TUE_1005.toISOString(), tab: 'tasks', stack: [], list: 'inbox', scroll: {} },
      },
    };
    expect(wake(left, at('2026-11-24T10:19:59')).restore).toBe('exact');
    expect(wake(left, at('2026-11-24T10:20:00')).restore).toBe('today');
    expect(wake(left, at('2026-11-24T10:19:59'), { boot: true }).restore).toBe('exact');
    expect(wake(left, at('2026-11-24T10:20:00'), { boot: true }).restore).toBe('today');
  });

  it('stays exactly where it is on a wake with no record of going away', () => {
    // Window focus alone, as when Control Centre is pulled down over Focus on
    // iOS: the page was never hidden, so the person never left.
    const state = scene('example', TUE_1005);
    const inFocus: BenchDomains = {
      ...state,
      bench: {
        ...state.bench,
        ui: {
          at: TUE_1005.toISOString(),
          tab: 'today',
          stack: [],
          focus: { returnTo: 'today' },
          list: 'inbox',
          scroll: {},
        },
      },
    };
    expect(wake(inFocus, at('2026-11-24T10:30:00')).restore).toBe('exact');
    expect(restoreRule(inFocus.bench, at('2026-11-24T12:00:00'))).toBe('exact');
  });

  it('on boot with no record of going away, goes by the last page change', () => {
    const state = scene('example', TUE_1005);
    const killed: BenchDomains = {
      ...state,
      bench: {
        ...state.bench,
        ui: { at: TUE_1005.toISOString(), tab: 'tasks', stack: [], list: 'inbox', scroll: {} },
      },
    };
    expect(wake(killed, at('2026-11-24T10:10:00'), { boot: true }).restore).toBe('exact');
    expect(wake(killed, at('2026-11-24T10:30:00'), { boot: true }).restore).toBe('today');
  });

  it('on boot with nowhere recorded, opens on Today', () => {
    const state = scene('example', TUE_1005);
    const away = { ...state, bench: { ...state.bench, away: { since: TUE_1005.toISOString() } } };
    expect(wake(away, plus(TUE_1005, 1), { boot: true }).restore).toBe('today');
  });

  it('opens on Today when the day turned, even with no record of going away', () => {
    const state = scene('example', TUE_1005);
    expect(wake(state, at('2026-11-25T04:01:00')).restore).toBe('today');
  });

  it('spends the record of going away, and changes nothing when nothing moved', () => {
    const state = scene('example', TUE_1005);
    const away = { ...state, bench: { ...state.bench, away: { since: TUE_1005.toISOString() } } };
    expect(wake(away, plus(TUE_1005, 1)).state.bench.away).toBeUndefined();
    expect(wake(state, TUE_1005).state).toBe(state);
  });
});

describe('loading a scenario opens on its screen', () => {
  it('Load the example day: screen 1 at 10:05', () => {
    const state = scene('example', TUE_1005);
    expect(present(state, TUE_1005).kind).toBe('running');
    expect(line(nextLine(state, TUE_1005)).row).toBe('next');
  });

  it('Load: not started yet: screen 7 at 9:58, the day half open', () => {
    const state = scene('notStarted', TUE_0958);
    expect(present(state, TUE_0958).kind).toBe('none');
    expect(idleLantern(state, TUE_0958).rule).toBe(2);
    expect(drawerPositions(state, TUE_0958).position).toBe('half');
  });

  it('Load: a pause left: screen 7c at 13:20, the passed call on the Next line', () => {
    const state = scene('pauseLeft', TUE_1320);
    expect(present(state, TUE_1320).kind).toBe('paused');
    expect(line(nextLine(state, TUE_1320)).title).toBe('Call the dentist');
  });

  it('Load: a clock left running: closed on load, then 7c used up', () => {
    const state = scene('clockLeftRunning', TUE_1005);
    const now = present(state, TUE_1005);
    expect(now).toMatchObject({ kind: 'paused', closedByApp: true });
    expect(now.kind !== 'none' && timeFacts(now.task, TUE_1005).usedUp).toBe(true);
    expect(state.bench.away).toBeUndefined();
  });

  it('Load: weeks away: screen 7b, everything back in the inbox', () => {
    const state = scene('weeksAway', MON_0912);
    expect(nextLine(state, MON_0912)).toEqual({ kind: 'lip' });
    expect(idleLantern(state, MON_0912)).toEqual({ rule: 4, somethingDone: false });
    expect(titles(topLevel(model.inbox(state.tasks)))).toContain(EMAIL);
  });

  it('Start empty: 7b with nothing at all', () => {
    const state = scene('empty', MON_0912);
    expect(state.tasks).toEqual([]);
    expect(drawerPositions(state, MON_0912).mode).toBe('lip');
  });

  it("keeps the owner's settings, drafts and rewards", () => {
    const base = fresh(TUE_1005);
    const owned: BenchDomains = {
      ...base,
      rewards: setOption(base.rewards, { kind: 'day' }, 'doneList', true),
      bench: {
        ...base.bench,
        settings: { places: 'white', closedLabel: 'stopped', motion: 'reduced' },
        drafts: { capture: { text: 'Ask Ana', to: 'today' }, fields: {} },
      },
    };
    const loaded = loadScenario(owned, 'example', TUE_1005);
    expect(loaded.bench.settings).toEqual(owned.bench.settings);
    expect(loaded.bench.drafts).toEqual(owned.bench.drafts);
    expect(loaded.rewards).toEqual(owned.rewards);
  });
});
