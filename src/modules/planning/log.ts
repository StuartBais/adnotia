// What this module says already happened today.
//
// Before the focus timer, planning had a daily question ("how did the plan go?")
// and so it already had a card on the day's record. The timer is the part of it
// that produces something without being asked, and ADR-031 is exactly about
// that: a module that records something real and shows it nowhere is a day's
// record missing a piece of the day.
//
// One line per stretch, in the order they happened. No total, no count of
// stretches, no comparison with yesterday. docs/01-module-contract.md says it in
// the contract itself — "Describe what happened; count nothing" — and the
// arithmetic that would break it is arithmetic nothing here does.

import type { LogContribution } from '../../kernel/index';
import type { PlanningDay } from './state';

function minutes(total: number): string {
  return total === 1 ? '1 minute' : `${total} minutes`;
}

export const log: LogContribution = {
  weight: 30,
  lines: (day) =>
    ((day as PlanningDay).focus ?? []).map((session) =>
      // The label is what it was pointed at when it happened, so a task since
      // renamed or deleted still reads as the thing that was worked on.
      session.label === ''
        ? `Focused for ${minutes(session.minutes)}.`
        : `${minutes(session.minutes)} on ${session.label}.`,
    ),
};
