// What this module says already happened today. See ../mindfulness/log.ts for
// why a module with no daily question needs one at all.
//
// No total and no target. docs/03-scope.md bans both, and a line per movement is
// what the person actually did rather than a figure to measure it against.

import type { LogContribution } from '../../kernel/index';
import { KIND_LABELS } from './strings';
import type { ExerciseDay } from './state';

export const log: LogContribution = {
  weight: 50,
  lines: (day) => {
    const moved = (day as ExerciseDay).moved ?? [];
    return moved.map((movement) => {
      const kind = KIND_LABELS.get(movement.kind) ?? 'Something';
      const time = movement.minutes === 1 ? '1 minute' : `${movement.minutes} minutes`;
      // The note is the person's own words and rarely a sentence, so it joins
      // with a dash rather than after a full stop: "A walk, 20 minutes — to the
      // shops" rather than "20 minutes. to the shops".
      const note = movement.note?.trim();
      return note === undefined || note === '' ? `${kind}, ${time}.` : `${kind}, ${time} — ${note}`;
    });
  },
};
