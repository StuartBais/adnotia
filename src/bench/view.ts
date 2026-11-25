// What each part of the screen shows, worked out from the state and a moment
// (design/lantern/PROTOTYPE-PLAN.md section 8, "Rendering"). Pure: no DOM.
//
// Each part has a static form, from which its key is made, and the live facts
// the ticker patches in place: the bar, the minutes and the spoken labels. So
// a part is rebuilt only when what it holds changes, never because a second
// passed.

import type { Task } from '../domains/tasks';
import { loggingDay } from '../kernel/dates';
import {
  barState,
  idleLantern,
  idleStatus,
  minutesWords,
  present,
  restOfToday,
  stepFacts,
  timeFacts,
  type BenchDomains,
  type IdleLantern,
  type Present,
  type StepFacts,
  type TimeFacts,
  type TimedTask,
} from './state';
import { clock24, dotted, duration, durationSpoken, longDate, stepCount } from './format';
import {
  T,
  idleItemLabel,
  nothingRunningLabel,
  type SpokenMinutes,
  type SpokenNow,
} from './strings';
import type { BarLook } from './ui';

// ---------------------------------------------------------------- the present

export interface PresentView {
  kind: 'running' | 'paused';
  task: Task;
  steps: StepFacts;
  /** What stands where Now does: "Now", "Paused", or "Timer stopped". */
  lead: string;
  /** The current step, or the task's title when it has none to show. */
  step: string;
  /** "step 2 of 3", absent for a task with no steps. */
  position: StepFacts['position'];
  note: string | undefined;
}

/** The live facts: the clock as it is at this moment. */
export interface PresentLive {
  facts: TimeFacts;
  bar: BarLook;
  words: ReturnType<typeof minutesWords>;
  spoken: SpokenNow;
}

export function presentView(state: BenchDomains, now: Date): PresentView | undefined {
  const current = present(state, now);
  if (current.kind === 'none') return undefined;
  const steps = stepFacts(state.tasks, current.task);
  const stopped =
    current.kind === 'paused' &&
    current.closedByApp &&
    state.bench.settings.closedLabel === 'stopped';
  return {
    kind: current.kind,
    task: current.task,
    steps,
    lead: current.kind === 'running' ? T.now : stopped ? T.timerStopped : T.paused,
    step: steps.current?.title ?? current.task.title,
    position: steps.position,
    note: current.task.notes?.trim() || undefined,
  };
}

export function presentLive(view: PresentView, now: Date, byMinute: boolean): PresentLive {
  const paused = view.kind === 'paused';
  const facts = timeFacts(view.task, now);
  const bar = barState(paused, facts, byMinute);
  const words = minutesWords(paused, facts);
  let minutes: SpokenMinutes;
  if (facts.estimate === undefined) minutes = { kind: 'countUp', soFar: facts.soFar };
  else if (facts.usedUp) minutes = { kind: 'over', soFar: facts.soFar, estimate: facts.estimate };
  else {
    minutes = {
      kind: 'left',
      left: facts.left ?? 0,
      estimate: facts.estimate,
      endsAt: paused ? undefined : facts.endsAt,
    };
  }
  return {
    facts,
    bar: { state: bar.state, p: bar.p, frozen: bar.frozen },
    words,
    spoken: {
      paused,
      ...(view.lead === T.timerStopped ? { lead: view.lead } : {}),
      step: view.step,
      position: view.position,
      title: view.task.title,
      minutes,
      note: view.note,
    },
  };
}

/** The static form of the present, for a key. */
export const presentKey = (view: PresentView): unknown[] => [
  view.kind,
  view.lead,
  view.task.id,
  view.task.title,
  view.step,
  view.position?.number,
  view.position?.count,
  view.note,
  view.steps.isLast,
  view.steps.current?.id,
];

// ---------------------------------------------------------------- Today

export type TodayView =
  | { kind: 'lit'; date: string; present: PresentView }
  | { kind: 'idle'; date: string; idle: IdleView }
  | { kind: 'planned'; date: string; heading: string };

/** What the unlit lantern says, by the rule that lit it (SPEC 5.7). */
export interface IdleView {
  rule: 1 | 2 | 3;
  /** The status line after "Nothing running", as drawn and as spoken. */
  status: string | undefined;
  statusSpoken: string;
  /** "First on today's list", "Next booked", "Booked now", or none under rule 3. */
  label: string | undefined;
  sentence: string;
  startsWith: string | undefined;
  meta: string | undefined;
  /** Rule 3's line in ash under the sentence. */
  under: string | undefined;
  /** The block's spoken name. */
  blockLabel: string;
  /** The task the block opens. */
  taskId: string;
  /** Whether Start is offered: not under rule 3, where nothing can start yet. */
  start: boolean;
}

export function todayView(state: BenchDomains, now: Date): TodayView {
  const date = longDate(loggingDay(now));
  const lit = presentView(state, now);
  if (lit) return { kind: 'lit', date, present: lit };
  const idle = idleLantern(state, now);
  if (idle.rule === 4) {
    return {
      kind: 'planned',
      date,
      // Undrawn: everything dated today is done. "Nothing planned" would be
      // untrue of a day that had a plan, so it says nothing else is.
      heading: idle.somethingDone ? 'Nothing else planned for today' : T.nothingPlanned,
    };
  }
  return { kind: 'idle', date, idle: idleView(idle) };
}

function idleView(idle: Exclude<IdleLantern, { rule: 4 }>): IdleView {
  const status = idleStatus(idle);
  switch (idle.rule) {
    case 1: {
      const label = idle.underway ? T.bookedNow : T.nextBooked;
      const statusSpoken = idle.underway
        ? `until ${clock24(idle.end)}`
        : `starts at ${clock24(idle.start)}, in ${durationSpoken(idle.inMinutes)}`;
      return {
        rule: 1,
        status,
        statusSpoken: `${T.nothingRunning}, ${statusSpoken}`,
        label,
        sentence: idle.task.title,
        startsWith: undefined,
        meta: undefined,
        under: undefined,
        blockLabel: `${label}: ${idle.task.title}`,
        taskId: idle.task.id,
        start: true,
      };
    }
    case 2: {
      const meta = dotted(
        idle.stepsLeft > 0 ? stepCount(idle.stepsLeft) : undefined,
        idle.minutes === undefined ? undefined : duration(idle.minutes),
        idle.endsAbout === undefined ? undefined : `would end about ${clock24(idle.endsAbout)}`,
      );
      return {
        rule: 2,
        status,
        statusSpoken: nothingRunningLabel(idle.freeUntil),
        label: T.firstOnList,
        sentence: idle.task.title,
        startsWith: idle.firstStep,
        meta: meta === '' ? undefined : meta,
        under: undefined,
        blockLabel: idleItemLabel({
          title: idle.task.title,
          firstStep: idle.firstStep,
          stepsLeft: idle.stepsLeft,
          minutes: idle.minutes,
          endsAbout: idle.endsAbout,
        }),
        taskId: idle.task.id,
        start: true,
      };
    }
    case 3: {
      const sentence = `Free until ${clock24(idle.at)}`;
      const under = `${idle.task.title} at ${clock24(idle.at)}`;
      return {
        rule: 3,
        status: undefined,
        statusSpoken: T.nothingRunning,
        label: undefined,
        sentence,
        startsWith: undefined,
        meta: undefined,
        under,
        blockLabel: `${sentence}. ${under}`,
        taskId: idle.task.id,
        start: false,
      };
    }
  }
}

/**
 * The unlit lantern's make-up, for a key. Its status, spoken status, meta
 * line and label follow the clock ("in 10 min", "would end about 10:23"), so
 * only whether each is there is part of the key; their words move in place.
 */
export const idleKey = (idle: IdleView): unknown[] => [
  idle.rule,
  idle.label,
  idle.sentence,
  idle.startsWith,
  idle.under,
  idle.taskId,
  idle.start,
  idle.status !== undefined,
  idle.meta !== undefined,
];

/** The task the idle lantern lights, which the half drawer leaves out. */
export function idleLitId(view: TodayView): string | undefined {
  return view.kind === 'idle' ? view.idle.taskId : undefined;
}

// ---------------------------------------------------------------- the lists

export interface TimedRow {
  id: string;
  time: string;
  title: string;
  minutes: number;
  /** "10 min". */
  length: string;
  /** "in 25 min", on the open drawer's next row only. */
  inLine: string | undefined;
}

export interface AnytimeRow {
  id: string;
  title: string;
  /** Ticked since the list was opened: a sage disc that un-ticks it. */
  ticked: boolean;
}

export interface DayList {
  later: TimedRow[];
  anytime: AnytimeRow[];
  /** Only with "List what got done today" on. */
  done: { id: string; title: string }[] | undefined;
  /** The longest track among the timed rows, so every number ends on one line. */
  slot: number;
}

const timedRow = (task: TimedTask, inLine: string | undefined): TimedRow => ({
  id: task.id,
  time: clock24(task.when.time),
  title: task.title,
  minutes: task.when.durationMinutes,
  length: duration(task.when.durationMinutes),
  inLine,
});

export function dayList(
  state: BenchDomains,
  now: Date,
  options: { exclude?: string; keep?: ReadonlySet<string>; inLine?: boolean } = {},
): DayList {
  const rest = restOfToday(state, now, {
    ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
    ...(options.keep === undefined ? {} : { keep: options.keep }),
  });
  const later = rest.later
    .filter((task) => task.doneAt === undefined)
    .map((task) =>
      timedRow(
        task,
        options.inLine && rest.next?.task.id === task.id
          ? `in ${duration(rest.next.inMinutes)}`
          : undefined,
      ),
    );
  return {
    later,
    anytime: rest.anytime.map((task) => ({
      id: task.id,
      title: task.title,
      ticked: task.doneAt !== undefined,
    })),
    done: rest.done?.map((task) => ({ id: task.id, title: task.title })),
    slot: Math.max(0, ...later.map((row) => Math.min(row.minutes * 1.5, 90))),
  };
}

export type { Present };
