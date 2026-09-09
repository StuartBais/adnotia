# ADR-038: A focus cycle, without a score, and tasks that link

Status: accepted · September 2026 · Extends ADR-025, ADR-030, ADR-031

## Context

Two things were asked for together, and they turn out to be one thing: the
planning tools should link, and there should be a timer you can point at what you
are working on.

**The linking is the plain half.** `planning` kept four independent lists —
`tasks`, `estimates`, `plans`, `intentions` — and none of them referenced each
other. So "do the tax return" was typed into *Break something down*, typed again
into *How long will this take?*, and typed a third time into *A plan for today*.
Three keyboards for one thing somebody is already avoiding, in a module whose
roadmap bar is planning a morning in under a minute.

**The timer is the half that needed deciding.** What was asked for was a full
cycle: a stretch, a break, and a longer break after every fourth. That last
clause is the problem. A longer break after every fourth stretch cannot be
implemented without knowing which stretch it is on, and a count of finished
stretches is points. `03-scope.md` excludes those outright — "Uses streaks,
badges, points, or notifications designed to shame" — and `CLAUDE.md` makes it a
hard rule, "not a style preference".

The concern was put before the cycle was chosen, and the cycle was chosen. This
records what was built instead of refusing, and why it is not the excluded thing.

## Decision

**The cycle is built. The position in it never leaves the sitting.**

The reasoning has the shape `02-evidence-rubric.md` already uses for the Family
space's reward chart — "not an engagement mechanic … the app never awards,
removes or reminds about points on its own initiative". That entry is
distinguished by *who drives it*; this one is distinguished by *how long the
number lives* and *what it is allowed to say*. Three conditions, all enforced in
`src/modules/planning/focus.ts`:

1. **It is a variable in a closure.** `done` is never written to the slice, so it
   dies with the page. There is nothing to restore, nothing to back up, nothing
   to compare tomorrow with, and nothing for a future report to reach.
2. **It cannot grow.** The only question ever asked of it is
   `longBreakAfter(done, every)`, which is a modulo. What exists is a position in
   a repeating pattern — like knowing which song you are on — and a position
   cannot accumulate into a total.
3. **Nothing it drives is phrased as attainment.** The module's whole vocabulary
   for it is "a longer break after this one" and "a short break after this one":
   sentences about what comes next, which have no better and worse version.
   There is no wording anywhere in the module for what has been finished.

**A number is not the same as a score.** The thing `03-scope.md` excludes is a
figure a person can be behind on. This one resets to zero every time the page
closes, is bounded by the cycle length, and appears in no sentence a person could
fail. If any of those three stops being true, this ADR has been broken and the
mechanic is the excluded one.

### What is kept, and it is not the count

Finished stretches are recorded as time spent, the way the mindfulness module
records a practice: *"25 minutes on log in and see what it asks for."* One line
per stretch through the `log` seam (ADR-031), which forbids totals in as many
words — "Describe what happened; count nothing."

**Stopping half way records the minutes that happened, not nothing.** This is the
subtlest part and it is deliberate: a tool that only records completed rounds has
quietly made completing them the thing that counts, and the person who stopped at
seven minutes has been told their seven minutes did not happen. Under a minute is
not recorded and nothing is said about it either.

### It is not called Pomodoro, and the numbers are labelled

Twenty-five and five and a longer one after four are a method somebody published
in the nineteen-nineties. `02-evidence-rubric.md` puts focus timers at Tier C —
"Widely used; mechanistically sensible … no direct trials" — and using the brand
would import its specific numbers as though they were findings, which is the
failure mode the rubric exists to prevent. So they are presented as settings with
defaults, the tool says on its face that they are "a convention rather than a
finding", and the Library entry says the timer has the weakest claim of the five
tools. (The name is also a trademark, which ADR-023 is the precedent for being
careful about.)

**The tier is applied, not assigned.** The rubric already proposes Tier C for
focus timers; this is the same move ADR-025 made for the other two Tier C tools
in this module, and `CLAUDE.md`'s stop-and-ask on tiers is not engaged by
applying one that is already written down.

### It does not force a stop, and it cannot

The cycle advances on its own — a cycle that needs pressing is not a cycle — but
what it advances is a clock, not the person. When a stretch runs out it says
"Time is up. Carry on if you are in the middle of something."

This is partly a design position: interrupting somebody with ADHD who has finally
got going is the part of this method people report as worst. It is also simply
true of the build. There is no sound and no notification anywhere in Adnotia, and
the kernel offers no timer that outlives the page, so nothing here *can*
interrupt anybody. The tool says so on its face rather than leaving it to be
discovered by somebody who locked their phone and trusted it.

### Two levels, and a way down

Breaking down stays task-to-steps. A step that turns out to be a thing of its own
can be **promoted** into its own task, linked back to the one it came from.

Arbitrary nesting was refused. A tree is somewhere to spend an hour organising
instead of starting, which is the specific failure this module is written
against, and the protocols it derives from use one level. Promotion gives the
depth where it is genuinely needed without giving anywhere to hide.

The step is not removed when it is promoted. Deleting a line somebody wrote,
because they said it was bigger than they thought, is the app losing their work
to keep its own model tidy. It is also not offered on a step already done.

### Every link stores the label as well as the id

There is no referential integrity in a document a person edits and can restore
from a backup, so a deleted task must leave a readable line behind rather than a
blank row. Every linked record — plan item, estimate, focus session — keeps the
text it was given alongside the id. And typing over a picked line drops the link
and keeps the words: what somebody typed wins over what the app thought they
meant.

## The slice stays at version 1

Everything here is an optional field; nothing was renamed and nothing was
restructured, so a slice written before this is a valid slice for after it.
`06-data-model.md` asks for a migration when one is needed, and none is. Bumping
the version would make this the build's first module migration and it would be an
identity function — ceremony that a later reader trusts as though it did
something.

## Consequences

- `planning` gains a fifth tool and a `log` contribution, and is no longer
  four-tools-from-CBT: the Library entry, the module summary and the eligibility
  note all say five now, and say which one is not from the protocols.
- The guard that matters is `planning.test.ts` → "forgets where it was in the
  cycle when the page goes": it runs three stretches, throws the page away,
  mounts a fresh one over the same slice, and asserts the next break is the short
  one. If the position is ever persisted — including by deriving it from the
  saved sessions, which is the tempting version — that test fails.
- "writes no count of anything into the record" asserts the exact keys of a saved
  session rather than searching for suspicious words, because the slice
  legitimately contains `done` on a step and a test that cannot tell those apart
  gets deleted the first time it cries wolf.
- The tools in `planning.test.ts` are mounted by title rather than by index.
  They were indexed, and inserting a fifth tool in the middle pointed four
  existing tests at the wrong tool.
- Fifteen mutations were run against this and all were caught, including the four
  that matter most: deriving the position from the saved record, moving the long
  break to the wrong stretch, recording the full length when somebody stopped
  early, and smuggling a round number into a saved session.
