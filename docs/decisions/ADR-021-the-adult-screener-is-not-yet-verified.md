# ADR-021: The adult screener is built, and not yet offered

Status: accepted · September 2026 · Implements `03-scope.md` "Screening"
Amended by `ADR-022-asrs-5-replaces-asrs-v1-1.md`: the first of the three problems
below is resolved — the ASRS-5 is now the instrument the Adult space is meant to
use. The other two still hold the gate closed.

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

**It is a different instrument.** *(Resolved by ADR-022, which chose the ASRS-5
deliberately. Kept here because it is why the discrepancy below was looked for at
all.)* It is the ASRS-5, the DSM-5 screening scale published by Ustün, Adler,
Kessler and others in *JAMA Psychiatry* in 2017, not ASRS v1.1 Part A. Both are
six items and both trace back to Kessler's group, so they are easy to confuse.
They have different item wording and, more importantly, different scoring: v1.1
Part A counts shaded responses and asks for four or more, while the ASRS-5 sums
responses against a cutoff.

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

The instrument is settled (ADR-022). What remains is the scoring table from
Ustün et al. (2017), and one question answered from it:

**Does the ASRS-5 score as a plain 0–4 sum across six items, or does it weight
response categories differently per item?**

- **Plain sum.** The achievable maximum is 24, the transcription's "25" is simply
  an error, and what is left is checking the six items and the five response
  labels against the paper.
- **Weighted.** The items alone are not enough. The weights *are* the instrument,
  a plain sum is a different test wearing its name, and the cutoff of 14 belongs
  to the weighted score rather than to the sum.

Either way the item text in `asrs.ts` is replaced from the paper rather than
corrected against it, and `verified` is set to the month a person did that.

## Consequences

- Milestone 2's definition of done — "the screener has been checked item-for-item
  against the WHO form" — is untouched by this ADR. It still requires the check.
- The Library is honest about the gap in the place a person would look for the
  screener, rather than silently not having one.
- The scoring, the threshold and the outcome wording are all in one file, so
  swapping instruments is a data change and a test change, not a rewrite.
