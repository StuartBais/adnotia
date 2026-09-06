// What a parent sets up for one child.
//
// Three things, and all three are read on the handed-over surface: a set of
// named routines, a first/then pair, and a reward chart. None of it is scored,
// and the chart in particular is governed by docs/04-family-space.md:
//
//   "Parent-configured, positive-only. Points are earned, never lost. The app
//    never runs it autonomously, never nags, never adds a streak."
//
// So there is no function here that removes a point, and none that adds one
// without a parent asking. That is not an oversight to be filled in later.

import type { ClockTime } from '../../kernel/index';

export interface RoutineStep {
  id: string;
  text: string;
  at?: ClockTime;
}

export interface Routine {
  id: string;
  name: string;
  steps: RoutineStep[];
}

export interface FirstThen {
  first: string;
  then: string;
}

export interface Chart {
  /** What earns a star, in the parent's words. */
  earns: string;
  goal?: number;
  /** What the goal is worth. Set by the parent; the app never suggests one. */
  reward?: string;
  points: number;
}

export interface RoutinesSlice {
  version: number;
  routines?: Routine[];
  firstThen?: FirstThen;
  chart?: Chart;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Steps in the order they happen: timed first, by time, then the rest. */
export function ordered(steps: readonly RoutineStep[]): RoutineStep[] {
  const timed = steps.filter((step) => (step.at ?? '') !== '');
  const untimed = steps.filter((step) => (step.at ?? '') === '');
  return [...timed.sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')), ...untimed];
}

/**
 * Award one star. The only way points move, and it takes a parent pressing
 * something: there is deliberately no `take` beside it.
 */
export function award(chart: Chart | undefined): Chart {
  const base: Chart = { earns: '', points: 0, ...chart };
  return { ...base, points: base.points + 1 };
}

/**
 * Start the chart again at zero. Not the same as taking a point away — it is
 * what a parent does when a goal has been reached and they are setting the next
 * one, and it is the only thing that lowers the number.
 */
export function startAgain(chart: Chart | undefined): Chart {
  const base: Chart = { earns: '', points: 0, ...chart };
  return { ...base, points: 0 };
}

export function reachedGoal(chart: Chart | undefined): boolean {
  if (chart?.goal === undefined || chart.goal <= 0) return false;
  return chart.points >= chart.goal;
}
