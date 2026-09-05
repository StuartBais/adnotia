# ADR-021: The adult screener is built, and not yet offered

Status: accepted · September 2026 · Implements `03-scope.md` "Screening"

## Context

`03-scope.md` allows one adult screening instrument, and is specific about it:

> The Adult space uses the WHO Adult ADHD Self-Report Scale, ASRS v1.1, Part A
> only. … It uses the WHO's own item wording and scoring threshold, unmodified.

The reason it is included at all is in the same section: refusing to include any
screener "would push people toward the unvalidated quizzes that fill the space".
The Library entry for those quizzes says they "compete with the one instrument
that is [validated]". Both arguments depend entirely on this one being handled
properly. An instrument reproduced loosely is not a validated instrument with a
small error in it; it is one of the quizzes, with better branding.

A transcription was supplied to build from. Three things are wrong with it as a
source, in increasing order of seriousness.

**It is a different instrument.** It is the ASRS-5, the DSM-5 screening scale
published by Ustün, Adler, Kessler and others in *JAMA Psychiatry* in 2017, not
ASRS v1.1 Part A. Both are six items and both trace back to Kessler's group, so
they are easy to confuse. They have different item wording and, more importantly,
different scoring: v1.1 Part A counts shaded responses and asks for four or more,
while the ASRS-5 sums responses against a cutoff.

**It is not a primary source.** It came from a third-party quiz site, not from
the paper and not from a WHO form. The scope document asks for the instrument's
own wording; a reproduction of a reproduction is not that, however faithful it
may turn out to be.

**Its arithmetic does not close.** It states "the maximum possible score is 25",
and six items with a top response of 4 sum to 24. A one-point discrepancy in a
transcription is not a typo to be waved through — it is the signature of an
instrument whose per-item response weighting has been flattened. If the published
ASRS-5 weights response categories differently across items, then a plain 0–4 sum
does not reproduce the published score, and the cutoff of 14 does not carry the
sensitivity and specificity that make the cutoff worth anything. A screener
scored the wrong way against the right threshold gives confident answers that
mean nothing.

## Decision

The screener is built and is not offered to anyone.

- `ScreenerSource` carries the instrument, the paper, what the transcription came
  from, and an optional `verified` date. `verified` is absent.
- While it is absent, `isUsable()` is false, the Library shows the entry as "Not
  yet", and the page renders one card explaining that a screening instrument will
  only be shown in its own published wording with its own threshold.
- A test asserts that the documented maximum and the maximum the items can
  actually produce disagree, so the discrepancy is recorded by the build rather
  than by a memory of this document.
- Everything else the scope document requires is implemented and tested now,
  because none of it depends on which instrument the items come from: the
  Library-only route, the single-bit outcome, the score never being shown, the
  routing to assessment, the adults-only statement, and the result not being
  stored — which is enforced by handing the page no store at all.

## What unblocks it

One of two things, and a person to do it.

1. **ASRS v1.1 Part A**, which is what `03-scope.md` names: its six items, its
   response options, and the shaded-response rule, taken from the WHO form or
   from Kessler et al. (2005), with `verified` set to the month it was checked.
2. **The ASRS-5**, if it is preferred — it is newer and DSM-5-aligned, and there
   is a real argument for it — taken from Ustün et al. (2017), *including the
   per-item response weights*, and confirming whether the total runs to 24 or 25
   and why. Choosing it means amending `03-scope.md`, because that document names
   v1.1 explicitly, and amending the citation list in `02-evidence-rubric.md`,
   which currently cites the 2005 paper.

Either way the item text in `asrs.ts` is replaced from the primary source rather
than corrected against it.

## Consequences

- Milestone 2's definition of done — "the screener has been checked item-for-item
  against the WHO form" — is untouched by this ADR. It still requires the check.
- The Library is honest about the gap in the place a person would look for the
  screener, rather than silently not having one.
- The scoring, the threshold and the outcome wording are all in one file, so
  swapping instruments is a data change and a test change, not a rewrite.
