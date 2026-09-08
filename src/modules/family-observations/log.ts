// What this module says already happened today.
//
// The parent's daily record is this log, and it is a tool rather than a
// check-in: docs/04-family-space.md asks for dated, concrete entries in the
// parent's own words, which is not a question with an answer. So nothing this
// module records appeared on the day's record at all. See ADR-031 for the seam
// and ADR-033 for the blank tab this was found next to.
//
// It repeats what the parent wrote rather than summarising it. A count would be
// the app measuring how much a parent has noticed, and docs/04-family-space.md
// is explicit that nothing here scores what a parent records.

import type { LogContribution } from '../../kernel/index';
import { WHERE_LABELS } from './strings';
import type { ObservationDay } from './entries';

export const log: LogContribution = {
  weight: 20,
  lines: (day) => {
    const entries = (day as ObservationDay).entries ?? [];
    return entries.map((entry) => {
      const where = WHERE_LABELS.get(entry.where);
      const what = entry.what.trim();
      return where === undefined ? what : `${where}: ${what}`;
    });
  },
};
