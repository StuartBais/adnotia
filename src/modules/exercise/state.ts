// The log.
//
// Day-keyed like the other daily data. What was done and roughly how long, plus
// an optional line. No totals, no weekly minutes, no goal: docs/03-scope.md bans
// anything that turns a gap into a failure, and a weekly target is a gap
// generator.

import type { IsoDate } from '../../kernel/index';

export interface Movement {
  id: string;
  kind: string;
  minutes: number;
  note?: string;
}

export interface ExerciseDay {
  moved?: Movement[];
}

export interface ExerciseSlice {
  version: number;
  days?: Record<IsoDate, ExerciseDay>;
}

export interface DatedMovement extends Movement {
  date: IsoDate;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function movements(slice: ExerciseSlice | undefined): DatedMovement[] {
  const days = slice?.days ?? {};
  const out: DatedMovement[] = [];
  for (const date of Object.keys(days).sort().reverse()) {
    for (const movement of days[date]?.moved ?? []) out.push({ ...movement, date });
  }
  return out;
}

export function record(
  slice: ExerciseSlice | undefined,
  date: IsoDate,
  movement: Movement,
): ExerciseSlice {
  const base: ExerciseSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  days[date] = { moved: [...(days[date]?.moved ?? []), movement] };
  return { ...base, days };
}

export function remove(slice: ExerciseSlice | undefined, date: IsoDate, id: string): ExerciseSlice {
  const base: ExerciseSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  const kept = (days[date]?.moved ?? []).filter((movement) => movement.id !== id);
  if (kept.length === 0) delete days[date];
  else days[date] = { moved: kept };
  return { ...base, days };
}

/** One movement as a person reads it back. */
export function describe(movement: Movement, label: string): string {
  return `${label}, ${movement.minutes} minutes` + (movement.note ? ` — ${movement.note}` : '');
}
