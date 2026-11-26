// What each part of the screen shows, worked out from the state and a moment
// (design/lantern/PROTOTYPE-PLAN.md section 8, "Rendering"). Pure: no DOM.
//
// Each part has a static form, from which its key is made, and the live facts
// the ticker patches in place: the bar, the minutes and the spoken labels. So
// a part is rebuilt only when what it holds changes, never because a second
// passed.

import * as model from '../domains/tasks';
import type { Task } from '../domains/tasks';
import { runsOn } from '../domains/routines';
import { addDays, loggingDay, type IsoDate } from '../kernel/dates';
import {
  barState,
  estimateOf,
  slotStart,
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
  say,
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
  /**
   * The row's spoken name, "10:30, Call the dentist, 10 minutes", with
   * ", in 25 minutes" after the title where the "in" line shows. SPEC 11 gives
   * no words for it; these follow its Next line and Focus foot.
   */
  label: string;
  /** The present, in Tasks › Today: its Now tag (SPEC 9.7), or Paused. */
  tag?: string;
}

export interface AnytimeRow {
  id: string;
  title: string;
  /** Ticked since the list was opened: a sage disc that un-ticks it. */
  ticked: boolean;
  /** The present, in Tasks › Today: its Now tag (SPEC 9.7), or Paused. */
  tag?: string;
}

export interface DayList {
  later: TimedRow[];
  anytime: AnytimeRow[];
  /** Only with "List what got done today" on. */
  done: { id: string; title: string }[] | undefined;
  /** The longest track among the timed rows, so every number ends on one line. */
  slot: number;
}

const timedRow = (task: TimedTask, inMinutes: number | undefined): TimedRow => {
  const time = clock24(task.when.time);
  const soon = inMinutes === undefined ? '' : `, in ${durationSpoken(inMinutes)}`;
  return {
    id: task.id,
    time,
    title: task.title,
    minutes: task.when.durationMinutes,
    length: duration(task.when.durationMinutes),
    inLine: inMinutes === undefined ? undefined : `in ${duration(inMinutes)}`,
    label: `${time}, ${task.title}${soon}, ${durationSpoken(task.when.durationMinutes)}`,
  };
};

export function dayList(
  state: BenchDomains,
  now: Date,
  options: {
    exclude?: string;
    keep?: ReadonlySet<string>;
    inLine?: boolean;
    /** Tasks › Today: the present listed with its tag, and Done always (SPEC 5.6). */
    tasks?: boolean;
  } = {},
): DayList {
  const rest = restOfToday(state, now, {
    ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
    ...(options.keep === undefined ? {} : { keep: options.keep }),
    ...(options.tasks ? { includePresent: true, done: true } : {}),
  });
  const lit = options.tasks ? present(state, now) : undefined;
  const tagOf = (task: Task) =>
    lit && lit.kind !== 'none' && lit.task.id === task.id
      ? { tag: lit.kind === 'running' ? T.now : T.paused }
      : {};
  const later = rest.later
    .filter((task) => task.doneAt === undefined)
    .map((task) => ({
      ...timedRow(
        task,
        options.inLine && rest.next?.task.id === task.id ? rest.next.inMinutes : undefined,
      ),
      ...tagOf(task),
    }));
  return {
    later,
    anytime: rest.anytime.map((task) => ({
      id: task.id,
      title: task.title,
      ticked: task.doneAt !== undefined,
      ...tagOf(task),
    })),
    done: rest.done?.map((task) => ({ id: task.id, title: task.title })),
    slot: Math.max(0, ...later.map((row) => Math.min(row.minutes * 1.5, 90))),
  };
}

// ---------------------------------------------------------------- Tasks

/** A row in Tasks (SPEC 5.6): a ring and a title, and a muted second line. */
export interface TaskRow {
  id: string;
  title: string;
  /** Done, or ticked since the list was opened: a sage disc that un-ticks it. */
  done: boolean;
  /** "9:00", a booked item's time, in Coming up. */
  time: string | undefined;
  /** "3 steps": steps still to do. */
  steps: string | undefined;
  /** The minutes, drawn with their track. */
  minutes: number | undefined;
  /** With nothing else to say, the start of the note, after its glyph. */
  note: string | undefined;
}

export type TasksView =
  | { list: 'inbox'; rows: TaskRow[] }
  | { list: 'today'; day: DayList; empty: boolean }
  | { list: 'coming'; groups: { date: IsoDate; label: string; rows: TaskRow[] }[] }
  | { list: 'done'; rows: TaskRow[] };

/** "Today", "Tomorrow", or "Thursday 26 November". */
export function dayWord(date: IsoDate, today: IsoDate): string {
  if (date === today) return T.today;
  if (date === addDays(today, 1)) return T.tomorrow;
  return longDate(date);
}

/**
 * The start of a note, for a row's second line: its first line up to the
 * first clause ends, "Thursday or Friday morning" (SPEC 5.6). The board cuts
 * the example there; how much to show is otherwise undrawn, so this is a
 * proposal, and a long first clause is still cut by the row's width.
 */
export function noteStart(note: string): string {
  const first = note.trim().split('\n')[0] ?? '';
  const clause = /^(.*?)[,;.:](?:\s|$)/.exec(first);
  return (clause?.[1] ?? first).trim();
}

const isTop = (task: Task) => task.parentId === undefined;

/**
 * A row's facts. In Done the row is the title alone: what is left of a task
 * that is finished is not a thing to show.
 */
function taskRow(state: BenchDomains, task: Task, bare = false): TaskRow {
  const left = stepFacts(state.tasks, task).left;
  const timed = task.when.kind === 'timed' ? task.when : undefined;
  const minutes = timed ? timed.durationMinutes : task.estimateMinutes;
  const steps = left > 0 ? stepCount(left) : undefined;
  const note = task.notes?.trim();
  const quiet = steps === undefined && minutes === undefined && timed === undefined;
  const done = task.doneAt !== undefined;
  if (bare) {
    return {
      id: task.id,
      title: task.title,
      done,
      time: undefined,
      steps: undefined,
      minutes: undefined,
      note: undefined,
    };
  }
  return {
    id: task.id,
    title: task.title,
    done,
    time: timed && clock24(timed.time),
    steps,
    minutes: minutes !== undefined && minutes > 0 ? minutes : undefined,
    note: quiet && note ? noteStart(note) : undefined,
  };
}

export interface TasksOptions {
  /** Rows ticked since the list was opened, which stay where they were. */
  keep?: ReadonlySet<string>;
  /** In Done, rows un-ticked since it was opened, and when they had been done. */
  undone?: ReadonlyMap<string, string>;
}

/**
 * One of the four lists (SPEC 5.6, plan G11). The inbox holds what has no
 * date, in the order it came in. Today is the drawer's own list, with the
 * present in it carrying its tag and what got done today under Done. Coming
 * up is grouped by day under muted labels, and Done is newest first. None
 * says how many, and none says how long anything waited.
 */
export function tasksView(
  state: BenchDomains,
  now: Date,
  list: 'inbox' | 'today' | 'coming' | 'done',
  options: TasksOptions = {},
): TasksView {
  const today = loggingDay(now);
  const keep = options.keep ?? new Set<string>();
  const open = (task: Task) => task.doneAt === undefined || keep.has(task.id);
  switch (list) {
    case 'inbox':
      return {
        list,
        rows: state.tasks
          .filter((task) => isTop(task) && task.when.kind === 'none' && open(task))
          .map((task) => taskRow(state, task)),
      };
    case 'today': {
      const day = dayList(state, now, { keep, inLine: true, tasks: true });
      const empty =
        day.later.length === 0 && day.anytime.length === 0 && (day.done?.length ?? 0) === 0;
      return { list, day, empty };
    }
    case 'coming': {
      const later = state.tasks.filter(
        (task) => isTop(task) && task.when.kind !== 'none' && task.when.date > today && open(task),
      );
      const dates = [...new Set(later.map((task) => (task.when as { date: IsoDate }).date))].sort();
      return {
        list,
        groups: dates.map((date) => {
          const onDay = later.filter(
            (task) => task.when.kind !== 'none' && task.when.date === date,
          );
          const timed = onDay
            .filter((task): task is TimedTask => task.when.kind === 'timed')
            .sort((a, b) => slotStart(a.when).getTime() - slotStart(b.when).getTime());
          const anytime = onDay.filter((task) => task.when.kind === 'anytime');
          return {
            date,
            label: dayWord(date, today),
            rows: [...timed, ...anytime].map((task) => taskRow(state, task)),
          };
        }),
      };
    }
    case 'done': {
      const undone = options.undone ?? new Map<string, string>();
      // A row un-ticked and ticked again keeps the place it had.
      const when = (task: Task) => Date.parse(undone.get(task.id) ?? task.doneAt ?? '');
      return {
        list,
        rows: state.tasks
          .filter((task) => isTop(task) && (task.doneAt !== undefined || undone.has(task.id)))
          .sort((a, b) => when(b) - when(a))
          .map((task) => taskRow(state, task, true)),
      };
    }
  }
}

// ---------------------------------------------------------------- a task's page

/** The when pill (SPEC 5.3): the time, how long, and how soon, as one object. */
export interface WhenPill {
  /** "Today, 10:30", "Today", "Tomorrow", "No date". */
  day: string;
  /** "10 min": a booked item's slot, or else the estimate. */
  length: string | undefined;
  /** Minutes until a booked item today starts, while it is still to come. Follows the clock. */
  soon: number | undefined;
}

export function whenPill(task: Task, now: Date): WhenPill {
  const today = loggingDay(now);
  const when = task.when;
  if (when.kind === 'timed') {
    const start = slotStart(when).getTime();
    const ahead = when.date === today && start > now.getTime();
    return {
      day: `${dayWord(when.date, today)}, ${clock24(when.time)}`,
      length: duration(when.durationMinutes),
      soon: ahead ? Math.ceil((start - now.getTime()) / 60_000) : undefined,
    };
  }
  const estimate = task.estimateMinutes;
  return {
    day: when.kind === 'none' ? T.noDate : dayWord(when.date, today),
    length: estimate !== undefined && estimate > 0 ? duration(estimate) : undefined,
    soon: undefined,
  };
}

/** The when pill's spoken name: "When: Today, 10:30, 10 minutes, in 25 minutes". */
export function whenSpoken(task: Task, pill: WhenPill): string {
  const minutes =
    task.when.kind === 'timed' ? task.when.durationMinutes : (task.estimateMinutes ?? 0);
  return say.when([
    pill.day,
    ...(pill.length === undefined ? [] : [durationSpoken(minutes)]),
    ...(pill.soon === undefined ? [] : [`in ${durationSpoken(pill.soon)}`]),
  ]);
}

export interface RailStep {
  id: string;
  title: string;
  number: number;
  done: boolean;
  current: boolean;
}

export interface TaskPageView {
  id: string;
  title: string;
  /**
   * Unlit (SPEC 5.3), the present's own page running or paused (5.8, plan
   * G12), or done (G12).
   */
  kind: 'unlit' | 'running' | 'paused' | 'done';
  when: WhenPill;
  steps: RailStep[];
  note: string | undefined;
  /** On an unlit page: what Start would stop, if anything runs. */
  instead: { title: string; step: number | undefined } | undefined;
  /** The present's view, on its own page. */
  present: PresentView | undefined;
}

export function taskPageView(state: BenchDomains, now: Date, id: string): TaskPageView | undefined {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return undefined;
  const lit = presentView(state, now);
  const own = lit && lit.task.id === id ? lit : undefined;
  const facts = stepFacts(state.tasks, task);
  const running = model.running(state.tasks);
  const other = running && running.id !== id ? running : undefined;
  return {
    id,
    title: task.title,
    kind: task.doneAt !== undefined ? 'done' : own ? own.kind : 'unlit',
    when: whenPill(task, now),
    steps: facts.steps.map((step, index) => ({
      id: step.id,
      title: step.title,
      number: index + 1,
      done: step.doneAt !== undefined,
      current: step.id === facts.current?.id,
    })),
    note: task.notes?.trim() || undefined,
    instead:
      !own && task.doneAt === undefined && other
        ? { title: other.title, step: stepFacts(state.tasks, other).position?.number }
        : undefined,
    present: own,
  };
}

/** The page's make-up, for a key: not its figures, which move in place. */
export const taskPageKey = (view: TaskPageView): unknown[] => [
  view.id,
  view.title,
  view.kind,
  view.when.day,
  view.when.length,
  view.when.soon !== undefined,
  view.steps,
  view.note,
  view.instead,
  view.present && presentKey(view.present),
];

// ---------------------------------------------------------------- Routines

/** A row in Routines (SPEC 5.9): its title, how many steps, and whether it ran today. */
export interface RoutineRow {
  id: string;
  title: string;
  steps: number;
  /** A run finished on today's logging day. Goes at 04:00, and says nothing else. */
  ranToday: boolean;
}

/** Which routines ran today: a run of theirs finished on today's logging day. */
function ranToday(state: BenchDomains, now: Date): Set<string> {
  return new Set(
    runsOn(state.routines.runs, loggingDay(now))
      .filter((run) => run.finishedAt !== undefined)
      .map((run) => run.routineId),
  );
}

/** The adult's routines, in their own order, with nothing counted but their steps. */
export function routinesView(state: BenchDomains, now: Date): RoutineRow[] {
  const ran = ranToday(state, now);
  return state.routines.routines.map((routine) => ({
    id: routine.id,
    title: routine.title,
    steps: routine.steps.length,
    ranToday: ran.has(routine.id),
  }));
}

export interface RoutineStepView {
  title: string;
  number: number;
  /** "2 min", where the step is timed. */
  minutes: number | undefined;
}

/**
 * A routine's own page, without running (owner default 10): its name, its
 * steps with their minutes, and, where Start would stand, what the app does
 * there, including what starting would do to a task that runs (SPEC 5.9, 12).
 */
export interface RoutinePageView {
  id: string;
  title: string;
  steps: RoutineStepView[];
  /** The task that runs now, which starting the routine would stop. */
  instead: { title: string; step: number | undefined } | undefined;
}

export function routinePageView(state: BenchDomains, id: string): RoutinePageView | undefined {
  const routine = state.routines.routines.find((item) => item.id === id);
  if (!routine) return undefined;
  const running = model.running(state.tasks);
  return {
    id,
    title: routine.title,
    steps: routine.steps.map((step, index) => ({
      title: step.title,
      number: index + 1,
      minutes: step.minutes !== undefined && step.minutes > 0 ? step.minutes : undefined,
    })),
    instead: running
      ? { title: running.title, step: stepFacts(state.tasks, running).position?.number }
      : undefined,
  };
}

// ---------------------------------------------------------------- Library

/**
 * The five rows of the Library (SPEC 12). The names are SPEC's; the lines
 * under them are proposals, except where SPEC says in brackets what a row
 * holds. Each opens a page that says it is not in this prototype.
 */
export const LIBRARY: readonly { topic: string; name: string; line: string }[] = [
  { topic: 'sleep', name: 'Sleep', line: 'Bedtimes, waking and winding down' },
  { topic: 'exercise', name: 'Exercise', line: 'Moving more, in small ways' },
  { topic: 'mindfulness', name: 'Mindfulness', line: 'Short practices, a few minutes each' },
  { topic: 'thinking', name: 'Thinking tools', line: 'If-then phrases and problem-solving' },
  { topic: 'evidence', name: 'How we know', line: 'What the evidence says, and how strong it is' },
];

export const libraryTopic = (topic: string) => LIBRARY.find((item) => item.topic === topic);

/** Estimates, for the running page's meta line: the one the bar measures. */
export { estimateOf };

export type { Present };
