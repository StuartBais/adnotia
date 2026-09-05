# ADR-024: Preparing for an assessment, instead of screening for one

Status: accepted · September 2026 · Extends `03-scope.md` "Screening", follows ADR-023

## Context

ADR-023 established that neither adult screening instrument can be reproduced
here without written permission. That leaves a hole where `03-scope.md` put a
job:

> its stated purpose is to indicate whether a formal assessment is worth seeking

The obvious response is to write six questions of our own and pick a threshold.
That is refused, and the refusal is not close. `02-evidence-rubric.md` excludes
"'brain type' or 'ADHD type' quizzes" on the grounds that they are "not
validated, not falsifiable, and they compete with the one instrument that is",
and `03-scope.md` hard exclusion 4 forbids anything that "scores toward a
diagnosis". A home-made screener written in an honest voice is still a home-made
screener; the honest voice makes it more persuasive rather than more valid. The
whole reason the real instrument is worth licensing is its 91.4% sensitivity and
96.0% specificity, and those numbers cannot be borrowed for different items.

But a score is one way to do that job, not the job itself. The Family space
already specifies the other way, and rates it Tier A (supporting):

> Assessment depends on impairment in more than one setting, over months. Parents
> arrive at appointments with impressions; clinicians want examples. A dated,
> structured record of specific observations does for the parent what the
> medication log does for an adult: it replaces recollection with a record.
> … Nothing is scored. Nothing is rated on a scale.

An adult has the same problem from the other end, and nobody licenses a notebook.

## Decision

A `preparation` module for the Adult space: a dated log of specific examples, and
a printable page to take to a first appointment.

An entry is short and concrete, mirroring the Family log's fields:

- when, and where it happened — work, home, study, driving, socially, elsewhere;
- what happened, in the person's own words;
- what was going on beforehand;
- what it cost.

Plus one thing the Family log does not need and no screener helps with at all:
**a place to gather what happened before you were twelve.** DSM-5 requires
several symptoms present in childhood, it is the question adult assessments most
often turn on, and it is the one a person can least answer off the top of their
head in a room. The module prompts for where to look — school reports, a parent
or older sibling, early appraisals — and records what they find. It does not ask
them to rate any of it.

The output is a named `preparation` report with the Adult audience: the entries
dated and grouped by setting, the childhood notes, a coverage line, and the same
record-quality footer the clinical report uses.

## What it must never do

The failure mode is drift, and it is a gentle slope: a log that counts becomes a
log that hints, and a log that hints is a screener wearing a notebook's clothes.
So, enforced by tests rather than intended:

- **No totals presented as meaning anything.** A coverage line — "14 entries
  across 6 weeks, from work and home" — describes the record, the way the report
  header already does. "14 entries" followed by any interpretation does not.
- **No scale, no rating, no severity** on any field. The Family log's rule
  applies unchanged.
- **No threshold, no traffic light, no summary judgement**, and nothing that
  reads as one: not "that is a lot", not "this pattern suggests", not a count of
  settings offered as evidence of pervasiveness.
- **It never says whether to seek an assessment.** It says what assessment
  involves and helps a person arrive able to answer the questions they will be
  asked. Deciding is theirs, and diagnosing is a clinician's.

## The real instrument is still named

`03-scope.md`'s argument for including a screener at all — that refusing one
pushes people toward unvalidated quizzes — is still good, and this module does
not replace it. The Library says plainly that a validated instrument exists,
which one it is, that a clinician may well use it, and where it is published.
Naming and linking is not reproducing, and it gets most of the value with none of
the exposure. If permission arrives (ADR-023), the screener and this module sit
alongside each other and do different jobs.

## Tier

Proposed **A (supporting)**, by the same reasoning `02-evidence-rubric.md` applies
to the medication log and `04-family-space.md` to the observation log: it does not
deliver an intervention, it supports the evidenced pathway by recording,
structuring and communicating what a clinician uses. As with every tier in this
build, it is a proposal until someone other than the author assigns it.

## Consequences

- A fourth named report, `preparation`, adult audience. The engine already
  filters contributors by a report's audience, so this needs no new mechanism.
- `Tool` contributions are rendered for the first time, so the Tools tab stops
  being a placeholder.
- The module is honest about being a notebook. Its Library entry says the
  evidence is for the pathway it supports, not for the notebook, and that it
  cannot tell anyone whether they have ADHD.
