# ADR-025: A tool can carry its own tier

Status: accepted · September 2026 · Extends `01-module-contract.md`, implements `02-evidence-rubric.md`

## Context

`02-evidence-rubric.md` says two things that are both right and cannot both be
expressed by one number on a manifest.

Its tier table rates **planning and organisation as Tier A**: "Derived from CBT
protocols with RCT support in adults (Safren; Solanto). A 2025 network
meta-analysis of 37 RCTs found CBT the most effective non-pharmacological
intervention on core symptoms."

Its Tier C examples include **"task-breaking templates"** and
**"implementation-intention prompts"** — the actual contents of that toolkit —
under the criterion "the tool is a straightforward implementation of a technique
used inside a Tier A protocol… The mechanism is credible; the specific tool is
untested."

Both are true. The protocol has trial evidence; a particular template inside a
particular app does not. `08-roadmap.md` asks for exactly this to be said out
loud: "a Library entry that is honest that these derive from protocols with trial
evidence and that the specific tools are Tier C where that is true."

Saying it only in the Library is not enough. The rubric's own presentation rule
is that "the tier appears on the module card before the person enables it", and
the reason is that a person should not have to hold a paragraph in their head to
know how much weight something carries. Someone opening a visual timer inside a
Tier A module will reasonably assume the timer is the Tier A part. Rule 7 in
`CLAUDE.md` reserves "evidence-based" for Tier A, and a Tier C tool sitting
silently inside a Tier A module borrows the phrase without ever using it.

## Decision

`Tool` gains an optional `tier`. Absent means the module's tier applies unchanged,
which is the case for almost every tool. Present, it is shown on the tool in the
rubric's own wording, exactly as a module's tier is shown on its card — never as
a bare letter, and never styled to rank one tool above another.

The tier on a tool is only ever **lower** than its module's. A tool cannot claim
more evidence than the module it ships in; if it had more, it would be its own
module. The registry rejects a manifest that tries.

## What this does not do

It does not let a module author assign a tier. `03-scope.md` requires that "the
tier is assigned by someone other than the author", and that is unchanged. What
ships here carries the rubric's own assignments, taken from its Tier C examples
list, and where the rubric does not name a tool the tool carries no tier and the
Library says the question is open. Inventing one would be the thing this ADR
exists to prevent, done at a smaller scale.

## Consequences

- The planning module can ship honestly: a Tier A toolkit whose task-breaking and
  if–then tools say plainly that they are plausible rather than established.
- The Library entry lists the tools and what is claimed for each, so the tiering
  is legible in one place as well as at the point of use.
- A future module in the same position — a Tier B module containing one
  well-evidenced component — is expressible without splitting it in two, though
  splitting remains the better answer where the parts are genuinely separate
  tools a person would enable independently.
