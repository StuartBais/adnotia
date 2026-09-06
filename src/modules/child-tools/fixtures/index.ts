// Empty, all three, and that is the honest shape of it.
//
// This module holds no state of its own. Everything it draws — the routine, the
// pair, the chart — belongs to `family-routines` and reaches it read-only
// through a declared dependency. Its own slice has nothing in it because a child
// writes nothing.
//
// The variation a smoke test wants lives in the parent module's fixtures, which
// is where a test that cares should look.

import type { ModuleFixtures } from '../../../kernel/index';

const nothing = { version: 1 };

export const empty = nothing;
export const threeDays = nothing;
export const thirtyDays = nothing;

export const fixtures: ModuleFixtures = { empty, threeDays, thirtyDays };
