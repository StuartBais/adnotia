// What this module says already happened today.
//
// The day's record builds a card only for a module that asks a daily question,
// and this module asks none — it is one tool and a timer. So a practice done
// this morning was recorded, and appeared nowhere on the screen a person opens
// to see their day. See docs/decisions/ADR-031.
//
// It describes and it does not count. "Sat for three minutes" is what happened;
// a total, a streak or a weekly figure would be the app having an opinion about
// how much sitting is the right amount, which docs/03-scope.md rules out.

import type { LogContribution } from '../../kernel/index';
import { byId } from './practices';
import type { MindfulnessDay } from './state';

function minutes(total: number): string {
  return total === 1 ? '1 minute' : `${total} minutes`;
}

export const log: LogContribution = {
  weight: 40,
  lines: (day) => {
    const sessions = (day as MindfulnessDay).sessions ?? [];
    return sessions.map((session) => {
      const practice = byId(session.practice);
      // The practice may have been renamed or removed since; the record still
      // says how long it was, which is the part that happened.
      return practice === undefined
        ? `Sat for ${minutes(session.minutes)}.`
        : `${practice.name}: sat for ${minutes(session.minutes)}.`;
    });
  },
};
