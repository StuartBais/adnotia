// The session log.
//
// Day-keyed, so it fits the machinery every other module uses. A session is what
// was done and for how long, and nothing else: no rating of how it went, no
// count of days in a row, no total. docs/03-scope.md bans streaks outright, and
// a mindfulness practice with a streak on it is a practice you can fail at,
// which is the opposite of the point.

import type { IsoDate } from '../../kernel/index';

export interface Session {
  id: string;
  /** A practice id, or whatever it was if the practice has since changed. */
  practice: string;
  minutes: number;
}

export interface MindfulnessDay {
  sessions?: Session[];
}

export interface MindfulnessSlice {
  version: number;
  days?: Record<IsoDate, MindfulnessDay>;
}

export interface DatedSession extends Session {
  date: IsoDate;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Every session, newest first. */
export function sessions(slice: MindfulnessSlice | undefined): DatedSession[] {
  const days = slice?.days ?? {};
  const out: DatedSession[] = [];
  for (const date of Object.keys(days).sort().reverse()) {
    for (const session of days[date]?.sessions ?? []) out.push({ ...session, date });
  }
  return out;
}

/** Add one to a day, keeping whatever was already there. */
export function record(
  slice: MindfulnessSlice | undefined,
  date: IsoDate,
  session: Session,
): MindfulnessSlice {
  const base: MindfulnessSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  days[date] = { sessions: [...(days[date]?.sessions ?? []), session] };
  return { ...base, days };
}

export function remove(
  slice: MindfulnessSlice | undefined,
  date: IsoDate,
  id: string,
): MindfulnessSlice {
  const base: MindfulnessSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  const kept = (days[date]?.sessions ?? []).filter((session) => session.id !== id);
  if (kept.length === 0) delete days[date];
  else days[date] = { sessions: kept };
  return { ...base, days };
}
