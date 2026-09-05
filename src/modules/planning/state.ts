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
}

export interface Task {
  id: string;
  title: string;
  steps: Step[];
  created: IsoDate;
}

export interface Estimate {
  id: string;
  title: string;
  /** What they thought it would take, in minutes. */
  minutes: number;
  /** What it actually took, once they say. */
  actual?: number;
  date: IsoDate;
}

export interface PlanItem {
  id: string;
  text: string;
  at?: ClockTime;
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
}

export interface PlanningSlice {
  version: number;
  tasks?: Task[];
  estimates?: Estimate[];
  plans?: Record<IsoDate, { items: PlanItem[] }>;
  intentions?: Intention[];
  days?: Record<IsoDate, PlanningDay>;
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
