// The prototype's rules, as pure functions of the stored document and an
// injected moment (design/lantern/PROTOTYPE-PLAN.md section 7). No DOM, no
// clock of their own: every screen and every test asks these.
//
// What is the prototype's own lives in `domains.bench`, one versioned object
// beside the shared domains, written in the same write as the task it goes
// with (plan section 4). The task model has no paused state, no set aside and
// no order for passed slots (gaps G1, G3 and G4); those are worked out here,
// and the phone app will need real answers to them.

import * as model from '../domains/tasks';
import type { Task, When } from '../domains/tasks';
import { resolve as rewardOptions } from '../domains/options';
import {
  SMALL_HOURS_UNTIL,
  isIsoDate,
  loggingDay,
  parseIsoDate,
  toMinutes,
  type IsoDate,
} from '../kernel/dates';
import type { DomainsState } from '../kernel/store';
import { buildScenario, type ScenarioId } from './example';
import {
  clock24,
  dotted,
  durationSpoken,
  estimateWords,
  inDuration,
  minutesLeft,
  minutesSoFar,
  ofEstimate,
} from './format';
import { T } from './strings';

const MINUTE = 60_000;

/**
 * Fifteen minutes, three times over: the margin before a forgotten clock is
 * closed, how soon a booked item counts as starting, and how long away still
 * restores exactly where the person was. SPEC 4, 9.8 and owner question 4.
 */
export const MARGIN_MINUTES = 15;
const MARGIN = MARGIN_MINUTES * MINUTE;

type Timed = Extract<When, { kind: 'timed' }>;
export type TimedTask = Task & { when: Timed };

// ---------------------------------------------------------------- the state

export type Tab = 'today' | 'tasks' | 'routines' | 'library';
export type TaskList = 'inbox' | 'today' | 'coming' | 'done';
export type DrawerPosition = 'lip' | 'folded' | 'half' | 'open';

/** A page pushed on the current tab. */
export type Page =
  | { kind: 'task'; id: string }
  | { kind: 'routine'; id: string }
  | { kind: 'newRoutine' }
  | { kind: 'library'; topic: string }
  | { kind: 'me' }
  | { kind: 'crisis' }
  | { kind: 'settings' }
  | { kind: 'about' };

/** Where the person was, written on hide and on a page change. */
export interface BenchUi {
  at: string;
  tab: Tab;
  stack: Page[];
  focus?: { returnTo: Tab };
  list: TaskList;
  scroll: Record<string, number>;
}

/** The owner's four switches (plan section 4). */
export interface BenchSettings {
  places: 'charcoal' | 'white';
  closedLabel: 'paused' | 'stopped';
  motion: 'system' | 'reduced';
}

export interface BenchDrafts {
  capture?: { text: string; to: 'inbox' | 'today' };
  fields: Record<string, string>;
}

export interface BenchState {
  [key: string]: unknown;
  version: 1;
  /** The logging day the day-scoped fields belong to. */
  day: IsoDate;
  /** Gap G1: the person let a paused task go. */
  setAside?: { taskId: string; at: string };
  /** A session the app closed itself. */
  closedByApp?: { taskId: string; at: string };
  /** Gap G5: the last moment the app was open, written on hide. */
  away?: { since: string };
  /** Gap G3: ids whose slot passed today, in the order they passed. Day-scoped. */
  passed: string[];
  /** Day-scoped, kept separately for running and idle. */
  drawer: { running: 'folded' | 'open'; idle: 'half' | 'folded' | 'open' };
  ui?: BenchUi;
  drafts: BenchDrafts;
  settings: BenchSettings;
}

export type BenchDomains = DomainsState & { bench: BenchState };

export const DEFAULT_SETTINGS: Readonly<BenchSettings> = Object.freeze({
  places: 'charcoal',
  closedLabel: 'paused',
  motion: 'system',
});

const DEFAULT_DRAWER: BenchState['drawer'] = Object.freeze({ running: 'folded', idle: 'half' });

/**
 * A day no logging day can equal, so the day boundary runs once on data that
 * has not been seen by these rules before and puts it in order.
 */
const NO_DAY = '';

export function defaultBench(day: IsoDate): BenchState {
  return {
    version: 1,
    day,
    passed: [],
    drawer: { ...DEFAULT_DRAWER },
    drafts: { fields: {} },
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ---------------------------------------------------------------- time

/** 04:00 on a logging day: when that day begins. */
export function loggingDayStart(day: IsoDate): Date {
  const start = parseIsoDate(day);
  start.setHours(SMALL_HOURS_UNTIL, 0, 0, 0);
  return start;
}

/** When a booked slot starts. A time before 04:00 is in the night after its day. */
export function slotStart(when: Timed): Date {
  const minutes = toMinutes(when.time) ?? 0;
  const day = parseIsoDate(when.date);
  const night = minutes < SMALL_HOURS_UNTIL * 60 ? 1 : 0;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + night, 0, minutes);
}

export function slotEnd(when: Timed): Date {
  return new Date(slotStart(when).getTime() + when.durationMinutes * MINUTE);
}

const isTimed = (task: Task): task is TimedTask => task.when.kind === 'timed';
const isTop = (task: Task): boolean => task.parentId === undefined;
const openSession = (task: Task) => task.sessions.find((session) => session.stop === undefined);

function startedOn(task: Task, day: IsoDate): boolean {
  return task.sessions.some((session) => loggingDay(new Date(session.start)) === day);
}

/** Whether anything at all has today's date, done or not. */
function hasToday(state: BenchDomains, day: IsoDate): boolean {
  return state.tasks.some(
    (task) => isTop(task) && task.when.kind !== 'none' && task.when.date === day,
  );
}

// ---------------------------------------------------------------- the present

export type Present =
  | { kind: 'running'; task: Task }
  | { kind: 'paused'; task: Task; closedByApp: boolean }
  | { kind: 'none' };

/**
 * Running is the task with an open session. Paused, when nothing runs, is the
 * task most recently worked on today, found by the latest stop on today's
 * logging day across every top-level task, done ones included. It is paused
 * only if that task is not done and was not set aside at or after that stop.
 * So paused ends by itself at 04:00, when anything else starts (and stays
 * ended once that other task is done), and when it is set aside (SPEC 4 "What
 * paused means"). Ticking a task off is not working on it: no session, no stop.
 */
export function present(state: BenchDomains, now: Date): Present {
  const running = model.running(state.tasks);
  if (running) return { kind: 'running', task: running };

  const today = loggingDay(now);
  let latest: { task: Task; stop: number } | undefined;
  for (const task of state.tasks) {
    if (!isTop(task)) continue;
    for (const session of task.sessions) {
      if (session.stop === undefined) continue;
      const stop = Date.parse(session.stop);
      if (loggingDay(new Date(stop)) !== today) continue;
      if (!latest || stop > latest.stop) latest = { task, stop };
    }
  }
  if (!latest || latest.task.doneAt !== undefined) return { kind: 'none' };

  const aside = state.bench.setAside;
  if (aside?.taskId === latest.task.id && Date.parse(aside.at) >= latest.stop) {
    return { kind: 'none' };
  }
  const closed = state.bench.closedByApp;
  return {
    kind: 'paused',
    task: latest.task,
    closedByApp: closed?.taskId === latest.task.id && Date.parse(closed.at) === latest.stop,
  };
}

// ---------------------------------------------------------------- steps

export interface StepFacts {
  steps: Task[];
  /** The first step not done, by order. None for a task with no steps, or all done. */
  current: Task | undefined;
  /** "step 2 of 3", when there is a current step. */
  position: { number: number; count: number } | undefined;
  /** The done step just before the current one, for Focus's disc. */
  previousDone: Task | undefined;
  /** "After this". */
  after: Task | undefined;
  /** Step done reads "Done" on the last step, and for a task with no steps. */
  isLast: boolean;
  /** Steps not done. */
  left: number;
}

export function stepFacts(tasks: readonly Task[], task: Task): StepFacts {
  const steps = model.stepsOf(tasks, task.id);
  const index = steps.findIndex((step) => step.doneAt === undefined);
  const current = index === -1 ? undefined : steps[index];
  const previousDone = index === -1 ? steps[steps.length - 1] : steps[index - 1];
  const after =
    index === -1 ? undefined : steps.slice(index + 1).find((s) => s.doneAt === undefined);
  return {
    steps,
    current,
    position: current ? { number: index + 1, count: steps.length } : undefined,
    previousDone,
    after,
    isLast: after === undefined,
    left: steps.filter((step) => step.doneAt === undefined).length,
  };
}

// ---------------------------------------------------------------- the clock

/**
 * The estimate the bar measures: the task's own, else a booked item's slot
 * length (gap G6). None at zero, so nothing divides by it.
 */
export function estimateOf(task: Task): number | undefined {
  const estimate =
    task.estimateMinutes ?? (task.when.kind === 'timed' ? task.when.durationMinutes : undefined);
  return estimate !== undefined && estimate > 0 ? estimate : undefined;
}

export interface TimeFacts {
  /** Minutes worked across every session, fractional. */
  worked: number;
  /** "7 min so far": whole minutes, rounded down. */
  soFar: number;
  estimate: number | undefined;
  /** "18 min left": rounded up, so it never reads 0. Absent once used up. */
  left: number | undefined;
  usedUp: boolean;
  /** When the estimate runs out in the open session. Fixed for the session. */
  estimateEnd: Date | undefined;
  /** "ends 10:23": the estimate's end while it is not used up. */
  endsAt: Date | undefined;
  /** The bar: the share left, or with no estimate the hour so far. 0 to 1. */
  fill: number;
  /** The same, stepped with the minute figure, for Reduce Motion. */
  fillMinute: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function timeFacts(task: Task, now: Date): TimeFacts {
  const worked = model.minutesWorked(task, now);
  const soFar = Math.floor(worked);
  const estimate = estimateOf(task);
  if (estimate === undefined) {
    return {
      worked,
      soFar,
      estimate,
      left: undefined,
      usedUp: false,
      estimateEnd: undefined,
      endsAt: undefined,
      fill: clamp(worked / 60),
      fillMinute: clamp(soFar / 60),
    };
  }

  const usedUp = worked >= estimate;
  const left = usedUp ? undefined : Math.ceil(estimate - worked);
  const open = openSession(task);
  let estimateEnd: Date | undefined;
  if (open) {
    const before = model.minutesWorked(
      { ...task, sessions: task.sessions.filter((session) => session !== open) },
      now,
    );
    estimateEnd = new Date(Date.parse(open.start) + (estimate - before) * MINUTE);
  }
  return {
    worked,
    soFar,
    estimate,
    left,
    usedUp,
    estimateEnd,
    endsAt: usedUp ? undefined : estimateEnd,
    fill: usedUp ? 0 : clamp((estimate - worked) / estimate),
    fillMinute: left === undefined ? 0 : clamp(left / estimate),
  };
}

export type BarState = 'burn' | 'paused' | 'over' | 'countUp';

/** How the bar is drawn (plan section 10, SPEC 9.2). */
export function barState(
  paused: boolean,
  facts: TimeFacts,
  byMinute = false,
): { state: BarState; p: number; frozen: boolean } {
  const p = byMinute ? facts.fillMinute : facts.fill;
  if (facts.estimate === undefined) return { state: 'countUp', p, frozen: paused };
  if (facts.usedUp) return { state: 'over', p: 0, frozen: paused };
  return paused ? { state: 'paused', p, frozen: true } : { state: 'burn', p, frozen: false };
}

/**
 * The minutes row, as SPEC 4's state table and 5.7c write it: the figure, and
 * the rest beside it. `time` is terracotta, a clock running; `still` is white.
 * Never "0 min left", and paused has no end time.
 */
export function minutesWords(
  paused: boolean,
  facts: TimeFacts,
): { main: string; rest: string | undefined; tone: 'time' | 'still' } {
  const tone = paused ? 'still' : 'time';
  if (facts.estimate === undefined)
    return { main: minutesSoFar(facts.soFar), rest: undefined, tone };
  if (facts.usedUp) {
    return paused
      ? { main: estimateWords(facts.estimate), rest: undefined, tone }
      : { main: minutesSoFar(facts.soFar), rest: estimateWords(facts.estimate), tone };
  }
  const left = minutesLeft(facts.left ?? 0);
  if (paused || facts.endsAt === undefined)
    return { main: left, rest: ofEstimate(facts.estimate), tone };
  return {
    main: left,
    rest: dotted(ofEstimate(facts.estimate), `ends ${clock24(facts.endsAt)}`),
    tone,
  };
}

// ---------------------------------------------------------------- the rest of today

export interface RestOfToday {
  /** Booked items, by when they start. */
  later: TimedTask[];
  /** Passed slots first, in the order they passed, then the person's own order. */
  anytime: Task[];
  /** Only with "List what got done today" on. */
  done: Task[] | undefined;
  /** The next booked item to start, which alone carries its "in" line. */
  next: { task: TimedTask; inMinutes: number } | undefined;
}

export interface RestOptions {
  /** Tasks › Today lists the present task too, with its Now tag. */
  includePresent?: boolean;
  /** The half drawer leaves out the item the idle lantern lights. */
  exclude?: string;
  /** Rows ticked since the list was opened stay where they were. */
  keep?: ReadonlySet<string>;
}

export function restOfToday(
  state: BenchDomains,
  now: Date,
  options: RestOptions = {},
): RestOfToday {
  const today = loggingDay(now);
  const keep = options.keep ?? new Set<string>();
  const current = present(state, now);
  const presentId = options.includePresent || current.kind === 'none' ? undefined : current.task.id;

  const listed = state.tasks.filter(
    (task) =>
      isTop(task) &&
      task.when.kind !== 'none' &&
      task.when.date === today &&
      (task.doneAt === undefined || keep.has(task.id)) &&
      task.id !== presentId &&
      task.id !== options.exclude,
  );

  const later = listed
    .filter(isTimed)
    .sort((a, b) => slotStart(a.when).getTime() - slotStart(b.when).getTime());

  const anytimeAll = listed.filter((task) => task.when.kind === 'anytime');
  const byId = new Map(anytimeAll.map((task) => [task.id, task]));
  const passedFirst = state.bench.passed.flatMap((id) => byId.get(id) ?? []);
  const anytime = [...passedFirst, ...anytimeAll.filter((task) => !passedFirst.includes(task))];

  const done = rewardOptions(state.rewards, { kind: 'day' }).doneList
    ? state.tasks
        .filter(
          (task) =>
            isTop(task) &&
            task.doneAt !== undefined &&
            !keep.has(task.id) &&
            loggingDay(new Date(task.doneAt)) === today,
        )
        .sort((a, b) => Date.parse(a.doneAt!) - Date.parse(b.doneAt!))
    : undefined;

  const upcoming = later.find(
    (task) => task.doneAt === undefined && slotStart(task.when).getTime() > now.getTime(),
  );
  return {
    later,
    anytime,
    done,
    next: upcoming && {
      task: upcoming,
      inMinutes: Math.ceil((slotStart(upcoming.when).getTime() - now.getTime()) / MINUTE),
    },
  };
}

// ---------------------------------------------------------------- the Next line

export type NextRow =
  'undo' | 'soon' | 'underway' | 'passed' | 'next' | 'anytime' | 'later' | 'nothing';

/** What the folded drawer's two lines say (SPEC 9.8), and Focus's foot with them. */
export interface NextLine {
  kind: 'line';
  row: NextRow;
  taskId: string | undefined;
  /** Line 2's title, or the six-second line's second line. */
  title: string;
  /** The booked time as stored, for line 2's time column. */
  time: string | undefined;
  /** "in 25 min", for soon and next. */
  inMinutes: number | undefined;
  /** "until 10:40", for a slot under way. */
  until: Date | undefined;
  /** The six-second line's first line. */
  undo: string | undefined;
}

export type NextResult = NextLine | { kind: 'lip' };

/** A six-second line after an undoable tap (SPEC 9.8, the rows at the foot). */
export interface UndoLines {
  line1: string;
  line2: string;
}

function line(row: NextRow, fields: Partial<Omit<NextLine, 'kind' | 'row'>> & { title: string }) {
  return {
    kind: 'line',
    row,
    taskId: fields.taskId,
    title: fields.title,
    time: fields.time,
    inMinutes: fields.inMinutes,
    until: fields.until,
    undo: fields.undo,
  } satisfies NextLine;
}

/**
 * The six-second rows first; then, from the top: a booked item starting within
 * 15 minutes; a slot under way and not started; a passed slot at the top of
 * Anytime today; the next booked item; the first anytime item; and nothing
 * left. With nothing running or paused and nothing dated today, the drawer
 * rests at its lip. The present task is in no list, so the line names the true
 * next item, even on that item's own page.
 */
export function nextLine(state: BenchDomains, now: Date, undo?: UndoLines): NextResult {
  if (undo) return line('undo', { undo: undo.line1, title: undo.line2 });

  const today = loggingDay(now);
  const at = now.getTime();
  const rest = restOfToday(state, now);
  const open = rest.later.filter((task) => task.doneAt === undefined);
  const future = open.filter((task) => slotStart(task.when).getTime() > at);

  const soon = future.find((task) => slotStart(task.when).getTime() - at <= MARGIN);
  if (soon) {
    return line('soon', {
      taskId: soon.id,
      title: soon.title,
      time: soon.when.time,
      inMinutes: Math.ceil((slotStart(soon.when).getTime() - at) / MINUTE),
    });
  }

  const underway = open.find(
    (task) =>
      slotStart(task.when).getTime() <= at &&
      at < slotEnd(task.when).getTime() &&
      !startedOn(task, today),
  );
  if (underway) {
    return line('underway', {
      taskId: underway.id,
      title: underway.title,
      time: underway.when.time,
      until: slotEnd(underway.when),
    });
  }

  const top = rest.anytime.find((task) => task.doneAt === undefined);
  if (top && state.bench.passed.includes(top.id)) {
    return line('passed', { taskId: top.id, title: top.title });
  }

  const next = future[0];
  if (next) {
    return line('next', {
      taskId: next.id,
      title: next.title,
      time: next.when.time,
      inMinutes: Math.ceil((slotStart(next.when).getTime() - at) / MINUTE),
    });
  }

  if (top) return line('anytime', { taskId: top.id, title: top.title });

  // A booked item whose slot has begun and was started earlier is still on
  // the list. No SPEC row covers it; it is named under the list's own heading.
  const begun = open[0];
  if (begun) return line('later', { taskId: begun.id, title: begun.title, time: begun.when.time });

  if (present(state, now).kind === 'none' && !hasToday(state, today)) return { kind: 'lip' };
  return line('nothing', { title: T.nothingElse });
}

/** Line 1's heading: "Next", "Anytime today", "Later today", "Rest of today". */
function section(next: NextLine): string {
  switch (next.row) {
    case 'undo':
      return next.undo ?? '';
    case 'soon':
    case 'underway':
    case 'next':
      return T.next;
    case 'passed':
    case 'anytime':
      return T.anytimeToday;
    case 'later':
      return T.laterToday;
    case 'nothing':
      return T.restOfToday;
  }
}

function whenWords(next: NextLine): string | undefined {
  if (next.inMinutes !== undefined) return inDuration(next.inMinutes);
  if (next.until !== undefined) return `until ${clock24(next.until)}`;
  return undefined;
}

function whenSpoken(next: NextLine): string | undefined {
  if (next.inMinutes !== undefined) return `in ${durationSpoken(next.inMinutes)}`;
  if (next.until !== undefined) return `until ${clock24(next.until)}`;
  return undefined;
}

/** The folded handle's two lines: "Next · in 25 min" over "10:30" "Call the dentist". */
export function handleLines(next: NextLine): {
  line1: string;
  time: string | undefined;
  title: string;
} {
  return {
    line1: dotted(section(next), whenWords(next)),
    time: next.time === undefined ? undefined : clock24(next.time),
    title: next.title,
  };
}

/**
 * The folded handle's spoken name: "Next, in 25 minutes: 10:30, Call the
 * dentist. Rest of today", or on 7c "Anytime today: Call the dentist. Rest of
 * today" (SPEC 11).
 */
export function handleLabel(next: NextLine): string {
  if (next.row === 'nothing') return `${T.nothingElse}. ${T.restOfToday}`;
  const head = [section(next), whenSpoken(next)].filter(Boolean).join(', ');
  const time = next.time === undefined ? '' : `${clock24(next.time)}, `;
  return `${head}: ${time}${next.title}. ${T.restOfToday}`;
}

/**
 * Focus's foot: the same rows on one line, "Later today" where the Next line
 * says "Next" (SPEC 5.4). "Later today · 10:30 Call the dentist · in 25 min",
 * read as "Later today: 10:30, Call the dentist, in 25 minutes".
 */
export function focusFoot(next: NextLine): { text: string; label: string } {
  const head =
    next.row === 'soon' || next.row === 'underway' || next.row === 'next'
      ? T.laterToday
      : section(next);
  const time = next.time === undefined ? undefined : clock24(next.time);
  const item = time === undefined ? next.title : `${time} ${next.title}`;
  const spokenItem = time === undefined ? next.title : `${time}, ${next.title}`;
  const when = whenSpoken(next);
  return {
    text: dotted(head, item, whenWords(next)),
    label: `${head}: ${spokenItem}${when === undefined ? '' : `, ${when}`}`,
  };
}

// ---------------------------------------------------------------- nothing running

/**
 * What the idle lantern lights (SPEC 5.7), for when nothing runs or is paused.
 *
 * 1. A booked item starting within 15 minutes, or whose slot is under way.
 * 2. The first item in Anytime today, in the person's own order.
 * 3. Anytime today empty, booked items still to come: "Free until 14:00".
 * 4. Nothing dated today: screen 7b.
 *
 * Two undrawn cases, each a proposal: a booked item whose slot began and was
 * started earlier is lit under rule 2 when nothing else is left; and when
 * everything dated today is done, rule 4 is returned with `somethingDone`, so
 * the screen need not say "Nothing planned for today" about a day that had a plan.
 */
export type IdleLantern =
  | { rule: 1; task: TimedTask; underway: boolean; start: Date; end: Date; inMinutes: number }
  | {
      rule: 2;
      task: Task;
      firstStep: string | undefined;
      stepsLeft: number;
      /** What is left of its estimate. */
      minutes: number | undefined;
      endsAbout: Date | undefined;
      freeUntil: Date | undefined;
    }
  | { rule: 3; task: TimedTask; at: Date }
  | { rule: 4; somethingDone: boolean };

export function idleLantern(state: BenchDomains, now: Date): IdleLantern {
  const today = loggingDay(now);
  const at = now.getTime();
  const rest = restOfToday(state, now);
  const open = rest.later.filter((task) => task.doneAt === undefined);
  const future = open.filter((task) => slotStart(task.when).getTime() > at);

  const soon = future.find((task) => slotStart(task.when).getTime() - at <= MARGIN);
  const underway = open.find(
    (task) =>
      slotStart(task.when).getTime() <= at &&
      at < slotEnd(task.when).getTime() &&
      !startedOn(task, today),
  );
  const booked = soon ?? underway;
  if (booked) {
    const start = slotStart(booked.when);
    return {
      rule: 1,
      task: booked,
      underway: booked === underway && booked !== soon,
      start,
      end: slotEnd(booked.when),
      inMinutes: Math.max(0, Math.ceil((start.getTime() - at) / MINUTE)),
    };
  }

  const lit = (task: Task): IdleLantern => {
    const steps = stepFacts(state.tasks, task);
    const facts = timeFacts(task, now);
    const minutes = facts.left;
    return {
      rule: 2,
      task,
      firstStep: steps.current?.title,
      stepsLeft: steps.left,
      minutes,
      endsAbout: minutes === undefined ? undefined : new Date(at + minutes * MINUTE),
      freeUntil: future[0] && slotStart(future[0].when),
    };
  };

  const first = rest.anytime.find((task) => task.doneAt === undefined);
  if (first) return lit(first);
  if (future[0]) return { rule: 3, task: future[0], at: slotStart(future[0].when) };
  if (open[0]) return lit(open[0]);
  return { rule: 4, somethingDone: hasToday(state, today) };
}

/**
 * The status line's second part: "starts at 10:30, in 5 min", "until 10:40",
 * or "free until 10:30" (SPEC 5.7). Rule 3 says "Free until" in its sentence,
 * so its status line is "Nothing running" alone.
 */
export function idleStatus(idle: IdleLantern): string | undefined {
  switch (idle.rule) {
    case 1:
      return idle.underway
        ? `until ${clock24(idle.end)}`
        : `starts at ${clock24(idle.start)}, ${inDuration(idle.inMinutes)}`;
    case 2:
      return idle.freeUntil === undefined ? undefined : `free until ${clock24(idle.freeUntil)}`;
    case 3:
    case 4:
      return undefined;
  }
}

// ---------------------------------------------------------------- the capsule

/** What is on screen, for the capsule's table. */
export type View =
  { kind: 'today' } | { kind: 'focus' } | { kind: 'place' } | { kind: 'page'; page: Page };

export type CapsuleMode = 'button' | 'picture' | 'hidden';

/**
 * Where the capsule shows (SPEC 4 "Where it is shown and hidden"). Hidden with
 * nothing running or paused, in Focus, on the crisis page, on Today while the
 * lantern is on screen, and on the present task's own page. A button on the
 * places and their pages, on any other task's page, and on the open drawer over
 * any tab. Under a sheet raised from any of those, a picture only.
 */
export function capsuleMode(
  view: View,
  now: Present,
  drawer: DrawerPosition,
  sheetOpen: boolean,
): CapsuleMode {
  if (now.kind === 'none') return 'hidden';
  if (view.kind === 'focus') return 'hidden';
  if (view.kind === 'page' && view.page.kind === 'crisis') return 'hidden';
  let mode: CapsuleMode = 'button';
  if (drawer !== 'open') {
    if (view.kind === 'today') mode = 'hidden';
    if (view.kind === 'page' && view.page.kind === 'task' && view.page.id === now.task.id) {
      mode = 'hidden';
    }
  }
  return mode === 'button' && sheetOpen ? 'picture' : mode;
}

/** Lifted on a charcoal place; plain charcoal on a white place and on the stone drawer. */
export function capsuleLook(
  places: BenchSettings['places'],
  drawer: DrawerPosition,
): 'lifted' | 'plain' {
  return drawer !== 'open' && places === 'charcoal' ? 'lifted' : 'plain';
}

// ---------------------------------------------------------------- the drawer

export interface DrawerRule {
  mode: 'present' | 'idle' | 'lip';
  allowed: readonly DrawerPosition[];
  /** Where it rests now: the person's choice for the day if it is allowed. */
  position: DrawerPosition;
}

export interface DrawerOptions {
  /** Where the drawer is. Half is a resting place on Today alone. */
  view?: View;
  /** At accessibility text sizes the half drawer rests folded. */
  largeText?: boolean;
}

/**
 * Folded or open while something runs or is paused, so the step is never on
 * screen twice. Half, folded or open when idle on Today, half by default; on
 * places and the pages pushed on them, folded or open, folded always unless
 * pulled open (SPEC 9.8 "Resting places"). Only the lip when nothing has
 * today's date. At large text sizes the half drawer rests folded (SPEC 9.8 and
 * 5.7). When everything dated today is done, there is no half position either:
 * it would hold nothing (undrawn; a proposal).
 */
export function drawerPositions(
  state: BenchDomains,
  now: Date,
  options: DrawerOptions = {},
): DrawerRule {
  const chosen = state.bench.drawer;
  if (present(state, now).kind !== 'none') {
    return { mode: 'present', allowed: ['folded', 'open'], position: chosen.running };
  }
  const today = loggingDay(now);
  if (!hasToday(state, today)) return { mode: 'lip', allowed: ['lip'], position: 'lip' };

  const onToday = (options.view ?? { kind: 'today' }).kind === 'today';
  const rest = restOfToday(state, now);
  const left = [...rest.later, ...rest.anytime].some((task) => task.doneAt === undefined);
  const allowed: DrawerPosition[] =
    onToday && left && !options.largeText ? ['half', 'folded', 'open'] : ['folded', 'open'];
  const position = allowed.includes(chosen.idle) ? chosen.idle : (allowed[0] as DrawerPosition);
  return { mode: 'idle', allowed, position };
}

// ---------------------------------------------------------------- time passing

/**
 * A clock left running in the background (SPEC 4). Once the app has been away
 * more than 15 minutes past the estimate's end, the session closes at the
 * moment the estimate ran out. With no estimate, or one already used up before
 * this session began, it closes at the last moment the app was open, once that
 * is 15 minutes past. If the page was killed before it could record when it
 * went away, nothing is closed. Nothing records or shows the time away.
 */
export function closeForgotten(
  state: BenchDomains,
  now: Date,
): { state: BenchDomains; closed: string | undefined } {
  const unchanged = { state, closed: undefined };
  const running = model.running(state.tasks);
  const away = state.bench.away;
  if (!running || !away) return unchanged;
  const open = openSession(running);
  if (!open) return unchanged;
  const since = Date.parse(away.since);
  const started = Date.parse(open.start);
  // A record from before this session began is not about this session.
  if (!(since >= started)) return unchanged;

  const end = timeFacts(running, now).estimateEnd?.getTime();
  let closeAt: number;
  if (end !== undefined && end > started) {
    if (now.getTime() - Math.max(since, end) <= MARGIN) return unchanged;
    closeAt = end;
  } else {
    if (now.getTime() - since <= MARGIN) return unchanged;
    closeAt = since;
  }

  const at = new Date(closeAt);
  return {
    state: {
      ...state,
      tasks: model.stopWork(state.tasks, running.id, at),
      bench: { ...state.bench, closedByApp: { taskId: running.id, at: at.toISOString() } },
    },
    closed: running.id,
  };
}

/** The last instant of a logging day: one millisecond before the next day's 04:00. */
function lastInstantOf(day: IsoDate): number {
  const start = loggingDayStart(day);
  const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  next.setHours(SMALL_HOURS_UNTIL, 0, 0, 0);
  return next.getTime() - 1;
}

/**
 * The last moment the record shows the app open during a session that began
 * at `started`: when it went away, the last page change, or the last of the
 * task's steps ticked. With none of those, the session's own start, so a
 * session nobody saw end counts nothing it cannot vouch for.
 */
function lastSeen(state: BenchDomains, task: Task, started: number): number {
  const moments = [
    state.bench.away?.since,
    state.bench.ui?.at,
    ...model.stepsOf(state.tasks, task.id).map((step) => step.doneAt),
  ]
    .map((moment) => (moment === undefined ? Number.NaN : Date.parse(moment)))
    .filter((moment) => moment >= started);
  return Math.max(started, ...moments);
}

/**
 * The logging-day boundary, at 04:00 (SPEC 5.7 "Coming back after time away").
 * Whatever was planned for a day that has passed goes back to the inbox. A
 * session still open from before today began is closed at its estimate's end,
 * or with no estimate at the last moment the app was open (`lastSeen`). Either
 * way it closes within its own logging day, so the days away are never counted
 * as time worked, nothing on the new day can call it paused, and no figure for
 * the time away can surface later, when the task is next started. The day's
 * own fields start again. Nothing is said about any of it.
 *
 * It runs whenever the stored day is not today's, which includes a clock moved
 * backwards and data these rules have not seen before.
 */
export function dayBoundary(state: BenchDomains, now: Date): BenchDomains {
  const today = loggingDay(now);
  if (state.bench.day === today) return state;
  const boundary = loggingDayStart(today).getTime();
  let tasks: readonly Task[] = state.tasks;

  const running = model.running(tasks);
  const open = running && openSession(running);
  if (running && open && Date.parse(open.start) < boundary) {
    const started = Date.parse(open.start);
    const end = timeFacts(running, now).estimateEnd?.getTime();
    const closeAt = end !== undefined && end > started ? end : lastSeen(state, running, started);
    const ownDayEnds = lastInstantOf(loggingDay(new Date(started)));
    tasks = model.stopWork(
      tasks,
      running.id,
      new Date(Math.min(closeAt, ownDayEnds, now.getTime())),
    );
  }

  const past = tasks
    .filter(
      (task) => task.doneAt === undefined && task.when.kind !== 'none' && task.when.date < today,
    )
    .map((task) => task.id);
  for (const id of past) tasks = model.unschedule(tasks, id);

  // A mark made on the new day is about the new day: a forgotten clock closed
  // in the same wake at an estimate that ran out after 04:00 keeps its mark,
  // so "Timer stopped" still applies to it.
  const { setAside, closedByApp, ui: _ui, ...kept } = state.bench;
  const onToday = (mark: { at: string } | undefined) =>
    mark !== undefined && loggingDay(new Date(mark.at)) === today;
  return {
    ...state,
    tasks,
    bench: {
      ...kept,
      ...(onToday(setAside) ? { setAside } : {}),
      ...(onToday(closedByApp) ? { closedByApp } : {}),
      day: today,
      passed: [],
      drawer: { ...DEFAULT_DRAWER },
    },
  };
}

/**
 * A booked item whose slot ends unstarted loses its time and goes to the top
 * of Anytime today, unmarked (SPEC 9.8). Two that pass in one go are taken in
 * slot order, the earlier first; each is added after those that passed before.
 * The present task is never moved, and neither is one started today.
 */
export function passSlots(state: BenchDomains, now: Date): BenchDomains {
  const today = loggingDay(now);
  const current = present(state, now);
  const presentId = current.kind === 'none' ? undefined : current.task.id;
  const due = state.tasks
    .filter(isTimed)
    .filter(
      (task) =>
        isTop(task) &&
        task.doneAt === undefined &&
        task.id !== presentId &&
        task.when.date === today &&
        slotEnd(task.when).getTime() <= now.getTime() &&
        !startedOn(task, today),
    )
    .sort((a, b) => slotStart(a.when).getTime() - slotStart(b.when).getTime());
  if (due.length === 0) return state;

  let tasks: readonly Task[] = state.tasks;
  for (const task of due) tasks = model.schedule(tasks, task.id, { kind: 'anytime', date: today });
  const ids = due.map((task) => task.id);
  return {
    ...state,
    tasks,
    bench: {
      ...state.bench,
      passed: [...state.bench.passed.filter((id) => !ids.includes(id)), ...ids],
    },
  };
}

/**
 * Coming back the same day: exactly where the person was if they were away
 * under 15 minutes, otherwise Today (owner question 4).
 *
 * A wake with no record of going away is one where the person never left: on
 * iOS, pulling down Control Centre or Notification Centre blurs and refocuses
 * the window without hiding the page, so window focus wakes with nothing
 * written. The screen stays exactly as it is. Only a boot, which rebuilds the
 * screen from `ui` and needs it, falls back to when `ui` was written, for a
 * page killed before it could say it went away.
 */
export function restoreRule(bench: BenchState, now: Date, boot = false): 'exact' | 'today' {
  if (boot && !bench.ui) return 'today';
  const record = bench.away?.since ?? (boot ? bench.ui?.at : undefined);
  if (record === undefined) return 'exact';
  const since = Date.parse(record);
  return Number.isFinite(since) && now.getTime() - since < MARGIN ? 'exact' : 'today';
}

/**
 * On boot, on becoming visible, on pageshow and on window focus (plan section
 * 12): a forgotten clock, then the day boundary, then passed slots, then the
 * restore rule. Pass `boot` on the first wake after a load, when the screen is
 * rebuilt from `ui`. The record of going away is spent here. Returns the state
 * unchanged, the same object, when nothing moved.
 */
export function wake(
  state: BenchDomains,
  now: Date,
  options: { boot?: boolean } = {},
): { state: BenchDomains; restore: 'exact' | 'today'; closed: string | undefined } {
  const forgotten = closeForgotten(state, now);
  const turned = dayBoundary(forgotten.state, now);
  const passed = passSlots(turned, now);
  const restore =
    forgotten.closed !== undefined || turned !== forgotten.state
      ? 'today'
      : restoreRule(passed.bench, now, options.boot);
  if (passed.bench.away === undefined) return { state: passed, restore, closed: forgotten.closed };
  const { away: _away, ...bench } = passed.bench;
  return { state: { ...passed, bench }, restore, closed: forgotten.closed };
}

// ---------------------------------------------------------------- loading

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const TABS: readonly Tab[] = ['today', 'tasks', 'routines', 'library'];
const LISTS: readonly TaskList[] = ['inbox', 'today', 'coming', 'done'];

function isPage(value: unknown): value is Page {
  if (!isRecord(value)) return false;
  switch (value['kind']) {
    case 'task':
    case 'routine':
      return typeof value['id'] === 'string';
    case 'library':
      return typeof value['topic'] === 'string';
    case 'newRoutine':
    case 'me':
    case 'crisis':
    case 'settings':
    case 'about':
      return true;
    default:
      return false;
  }
}

function isMark(value: unknown): value is { taskId: string; at: string } {
  return isRecord(value) && typeof value['taskId'] === 'string' && typeof value['at'] === 'string';
}

function readUi(value: unknown): BenchUi | undefined {
  if (!isRecord(value) || typeof value['at'] !== 'string') return undefined;
  if (!TABS.includes(value['tab'] as Tab) || !LISTS.includes(value['list'] as TaskList)) {
    return undefined;
  }
  const stack = Array.isArray(value['stack']) ? value['stack'] : [];
  if (!stack.every(isPage)) return undefined;
  const scroll: Record<string, number> = {};
  if (isRecord(value['scroll'])) {
    for (const [key, top] of Object.entries(value['scroll'])) {
      if (typeof top === 'number' && Number.isFinite(top)) scroll[key] = top;
    }
  }
  const focus = value['focus'];
  const ui: BenchUi = {
    at: value['at'],
    tab: value['tab'] as Tab,
    stack: [...stack],
    list: value['list'] as TaskList,
    scroll,
  };
  if (isRecord(focus) && TABS.includes(focus['returnTo'] as Tab)) {
    ui.focus = { returnTo: focus['returnTo'] as Tab };
  }
  return ui;
}

/** A stored bench object made whole, keeping any key it does not know. */
function readBench(value: unknown): BenchState {
  if (!isRecord(value)) return defaultBench(NO_DAY);
  const drawer = isRecord(value['drawer']) ? value['drawer'] : {};
  const drafts = isRecord(value['drafts']) ? value['drafts'] : {};
  const settings = isRecord(value['settings']) ? value['settings'] : {};

  const fields: Record<string, string> = {};
  if (isRecord(drafts['fields'])) {
    for (const [key, text] of Object.entries(drafts['fields'])) {
      if (typeof text === 'string') fields[key] = text;
    }
  }
  const capture = drafts['capture'];
  const keptCapture =
    isRecord(capture) && typeof capture['text'] === 'string'
      ? { text: capture['text'], to: oneOf(capture['to'], ['inbox', 'today'] as const, 'inbox') }
      : undefined;

  const bench: Record<string, unknown> = {
    ...value,
    version: 1,
    day: isIsoDate(value['day']) ? value['day'] : NO_DAY,
    passed: Array.isArray(value['passed'])
      ? value['passed'].filter((id): id is string => typeof id === 'string')
      : [],
    drawer: {
      running: oneOf(drawer['running'], ['folded', 'open'] as const, DEFAULT_DRAWER.running),
      idle: oneOf(drawer['idle'], ['half', 'folded', 'open'] as const, DEFAULT_DRAWER.idle),
    },
    drafts: { ...drafts, fields, ...(keptCapture ? { capture: keptCapture } : {}) },
    settings: {
      ...settings,
      places: oneOf(settings['places'], ['charcoal', 'white'] as const, DEFAULT_SETTINGS.places),
      closedLabel: oneOf(
        settings['closedLabel'],
        ['paused', 'stopped'] as const,
        DEFAULT_SETTINGS.closedLabel,
      ),
      motion: oneOf(settings['motion'], ['system', 'reduced'] as const, DEFAULT_SETTINGS.motion),
    },
  };
  if (!keptCapture) delete (bench['drafts'] as Record<string, unknown>)['capture'];
  if (!isMark(value['setAside'])) delete bench['setAside'];
  if (!isMark(value['closedByApp'])) delete bench['closedByApp'];
  const away = value['away'];
  if (!(isRecord(away) && typeof away['since'] === 'string')) delete bench['away'];
  const ui = readUi(value['ui']);
  if (ui) bench['ui'] = ui;
  else delete bench['ui'];
  return bench as BenchState;
}

/**
 * Brings a stored document's domains up to what these rules expect (plan
 * section 6). The Bookmark round's separate focus box goes; a running session
 * keeps running, because it lives on the task. A missing or damaged `bench`
 * is made whole, keeping any key it does not know, and so are the domains.
 * If the stored day is not today's, the day boundary runs, after a forgotten
 * clock is closed, in the order a wake takes them (plan section 12), so boot
 * and wake agree. The record of going away is left for the boot's wake, whose
 * restore rule reads it. Safe to run twice.
 */
export function migrateBench(domains: DomainsState, now: Date): BenchDomains {
  const { focus: _focus, ...rest } = domains;
  const read = { ...rest, bench: readBench(domains['bench']) } as BenchDomains;
  return dayBoundary(closeForgotten(read, now).state, now);
}

/**
 * A scenario button (plan section 11). The records and the day are replaced;
 * the owner's settings, drafts and rewards are kept; then the app wakes, so a
 * forgotten clock closes, the day turns and slots pass as they would on a phone.
 * It opens on Today.
 */
export function loadScenario(state: BenchDomains, id: ScenarioId, now: Date): BenchDomains {
  const built = buildScenario(id, now);
  const { setAside: _a, closedByApp: _c, ui: _u, away: _w, ...kept } = state.bench;
  const bench: BenchState = {
    ...kept,
    day: built.day,
    passed: [],
    drawer: { ...DEFAULT_DRAWER },
    ...(built.away === undefined ? {} : { away: built.away }),
  };
  return wake({ ...state, tasks: built.tasks, routines: built.routines, bench }, now).state;
}
