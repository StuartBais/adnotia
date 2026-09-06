# ADR-026: Guidance prose carries a tier and its references

Status: accepted · September 2026 · Implements `02-evidence-rubric.md`, extends `04-family-space.md`

## Context

The Family space has four pages that are prose rather than tools: what an
assessment involves, what to do under six, what to do at thirteen and over, and
talking to the school. They are the only things in the app that a person reads
and acts on without ever being asked to fill anything in.

Until now they carried nothing. A module's evidence goes through
`LibraryEntry` — a tier in the rubric's fixed wording, references, and the
statement that nobody has checked them — and none of that machinery reached a
guidance page, because a guidance page is not a module and has no manifest.

That gap does not survive contact with what the pages actually say. The school
page tells a parent that a daily report card is worth asking for, that effects
are larger across a whole day, and that home involvement matters. Those are
findings. `02-evidence-rubric.md` is explicit that they are covered:
"Psychoeducation (the Library itself) | A/B | … the tier of any individual
Library article follows the evidence for that article's topic."

So the choice was not whether these pages make evidence claims. It was whether
the app holds prose to the standard it holds a checkbox to.

## Decision

Every guidance page carries a `GuidanceEvidence`: a tier, its citations, and an
optional `citationsVerified`. Each page renders it at the foot through one
shared `evidenceNote`, which prints the tier in `tierWording`'s fixed sentence
and the references through the same `citationList` the Library uses.

`GUIDANCE` — the list the Family Library renders — spreads that evidence onto
each listing, so the registry of pages and the claim each one makes cannot
drift apart.

Tiers assigned: **B** for the three assessment pages, because they describe what
guidelines recommend rather than a treatment with its own trials, which is the
reasoning `04-family-space.md` already gives for the under-six page. **A** for
the school page, which that document proposes on the grounds that "classroom
behavioural interventions have consistent support; the app only explains and
helps the parent ask".

## Consequences

Prose is now as expensive to write as a tool, which is the point. A new guidance
page cannot be added without deciding what it rests on, and a test walks
`GUIDANCE` and fails a page that has a tier with no references behind it, or
references the page never prints.

The Tier A on the school page is the one to look at hardest at review. Both
meta-analyses behind it pool single-case designs rather than randomised trials,
and the rubric's Tier A wording says "repeated trial evidence". The page states
that limit in its own words — what the evidence shows is the targeted behaviour
improving while the card runs, not a change in attention or impulsivity — but
the tier itself is a judgement, and like every tier in this build it is still a
proposal until somebody other than its author confirms it.

`citationsVerified` is absent on all four, so all four print that nobody has
read the originals. Two of the school page's DOIs were resolved against the
publishers rather than against a summary; that is not the same as reading the
papers, and the pages do not claim it is.
