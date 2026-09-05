# ADR-020: An unverified citation says so, in the product

Status: accepted · September 2026 · Implements `02-evidence-rubric.md`

## Context

Every citation in this repository was taken from `02-evidence-rubric.md`, whose
own list is headed "Citations to verify before publication" and says each "must
be checked against the original before any of this ships". None has been.

That fact currently lives in three design documents and a run of commit messages.
It does not live anywhere a person reading the Library would find it, which is
the one place it changes what a reader should do with what they are reading.

The rubric is unusually direct about why this matters: it exists because "almost
every ADHD app presents every feature with equal confidence", and the tier is an
answer to that. A tier resting on references nobody has opened is the same
problem one level up.

## Decision

`LibraryEntry` gains an optional `citationsVerified`, a `YYYY-MM` set when
someone has checked every reference in that entry against the original paper.

- Absent means nobody has. The Library prints, on the entry: *These references
  have not been checked against the originals.*
- It is per entry rather than per build, because that is how checking is actually
  done — one entry, one sitting, one person — and because Milestone 8 has to
  record the dates.
- It says nothing about who checked. Authorship of the check is a governance
  question that belongs in the pull request, not in a field a module author
  fills in about themselves.

The tier is handled differently. Every tier in this build is still the rubric's
proposal, and `03-scope.md` requires that "the tier is assigned by someone other
than the author". That is a fact about the whole build rather than about an
entry, so the Library carries one standing notice rather than a per-entry field.
A field would imply the project tracks who assigned each tier, and it does not.

## Consequences

- The Library is honest about its own state to the person reading it, which is
  the same standard the report's record-quality footer holds itself to.
- The notice is a forcing function: it is visible, slightly embarrassing, and
  removed only by doing the work. That is the intended effect.
- A module cannot quietly ship with references nobody opened, because the absence
  shows on its own entry rather than in a document.
- When the Milestone 8 pass happens, filling the field is the record of it.
