# ADR-014: Preserve the origin of automatically derived values

Status: accepted - 2026-09

## Context

ADR-010 requires automatic sleep duration to remain editable and never overwrite
what the person typed. A stored duration alone cannot distinguish a calculation
from a manual answer. The Today assembler currently stores its first calculation
as though it were a manual answer, so changing the times leaves stale hours.

## Decision

- Today reserves an optional `_derived` object in a module's day record. It maps
  field ids to their last automatically calculated values.
- A value still matching this metadata may be recalculated when its inputs
  change. The corresponding visible control updates without rebuilding the form.
- Typing a nonempty answer removes that field's automatic status, even if the
  answer equals the calculation. Clearing it permits automatic calculation again.
- When required inputs are cleared, a still-automatic value is cleared too.
- Existing values without metadata are treated as manual. There is no reliable
  way to infer their origin, so no migration guesses or rewrites them.
- This additive metadata travels with the day through persistence and backup.
  It contains only the calculation's previous value, not a score or assessment,
  and is not itself report content. Older builds preserve it as an unknown key.

## Consequences

Automatic duration remains correct after time edits and reloads, while explicit
answers keep priority. This refines ADR-010 without changing the module's derive
signature or the meaning of hours actually asleep.
