# ADR-023: The screeners are not ours to reproduce

Status: accepted · September 2026 · Corrects `03-scope.md`, supersedes ADR-022

## Context

`03-scope.md` says the two screening instruments are "both free and validated".
Validated is right. Free is wrong, and it is wrong in the way that matters to a
project distributed publicly under AGPL-3.0.

The claim was never checked. It was checked now, on the way to filling in
ADR-021's missing scoring table, and the answer stops the screener for a
different and larger reason than the one ADR-021 recorded.

### ASRS v1.1

The form carries this notice:

> © World Health Organization 2003 All rights reserved. Based on the Composite
> International Diagnostic Interview © 2001 World Health Organization. All rights
> reserved. Used with permission. Requests for permission to reproduce or
> translate — **whether for sale or for noncommercial distribution** — should be
> addressed to Professor Ronald Kessler, PhD, Department of Health Care Policy,
> Harvard Medical School.

Noncommercial distribution is named explicitly. It is reproduced widely and
without evident objection, on clinic sites, health plans and universities, which
is presumably why the design documents assumed it was free to use. Widely
tolerated is not the same as licensed, and an AGPL repository is not a clinic
handout: everyone who forks it republishes whatever is in it.

### The NICHQ Vanderbilt

Checked when Milestone 6 reached it, and it is the same answer in a softer voice.
The form the American Academy of Pediatrics publishes carries, on its last page:

> Original document included as part of *Caring for Children With ADHD: A
> Resource Toolkit for Clinicians*, 2nd Edition. **Copyright © 2002 American
> Academy of Pediatrics. All Rights Reserved.** The American Academy of
> Pediatrics does not review or endorse any modifications made to this document
> and in no event shall the AAP be liable for any such changes.

It is genuinely given away — downloadable from the AAP and from NICHQ, in English
and Spanish, and described as free for use — but "free to download and use in a
clinic" and "licensed for anyone to republish inside their software" are
different things, and the notice says All Rights Reserved rather than the second
one. The sentence about modifications is also pointed: transcribing a form into
an app *is* a modification, and it is the specific thing that sentence disclaims.

`04-family-space.md` described it as "free to reproduce". That claim is now
corrected there, as the equivalent adult claim was corrected in `03-scope.md`.

### ASRS-5

Worse, and in a way that also explains ADR-021's missing table. New York
University licenses the adult ADHD scales — the paper's own conflict-of-interest
statement records that an author "has received royalty payments (as inventor)
from New York University for license of adult attention-deficit/hyperactivity
disorder (ADHD) scales and training materials since 2004". NYU's licensing page
lists the ASRS DSM-5 and offers it free of charge for non-commercial academic and
research use, under an agreement requiring an institutional signatory and renewed
annually.

The per-item response weights are not published anywhere because they are the
licensed part. ADR-021 was looking for a table that is deliberately not in the
paper.

## What the scoring turned out to be

Worth recording, because it settles ADR-021's open question and confirms the
transcription was unusable regardless of licensing.

Ustün et al. (2017), Table 1 footnote: the never response scores 0 for every
question, and the top response is worth **6 on question 3, 5 on questions 1 and
2, 4 on question 5, 3 on question 6 and 2 on question 4** — a scale of 0–25. The
response categories are weighted differently per item, exactly as suspected.

So the transcription supplied was the right maximum printed over the wrong grid:
a uniform 0–4 table, which reaches 24, beneath a stated maximum of 25 taken from
the weighted instrument. The cutoff of 14, with its 91.4% sensitivity and 96.0%
specificity, belongs to the weighted score. Applied to a plain sum it is a
different test wearing the same number — and that plain-sum version is what
several secondary sources and at least one published validation circulate.

## Decision

**No instrument ships until someone holds permission in writing.**

- `ASRS_ITEMS` is empty. The six items were briefly in this repository and have
  been removed; they are not ours to publish.
- `ScreenerSource` gains `rights`, saying who holds them, and `licensed`, a date
  set when permission was obtained. `isUsable` now requires items *and* a
  verified date, and the absence of either shuts the gate.
- The machinery — scoring, threshold, and every presentation rule `03-scope.md`
  fixes — stays, and is tested against a stand-in instrument of six questions of
  our own with the same shape and none of the wording.
- The page tells the reader plainly that both candidates are copyrighted and that
  permission has not been obtained.
- ADR-022 chose the ASRS-5 over v1.1 on clinical grounds that still stand. It is
  superseded only on the practical point: of the two, v1.1 is the one that could
  realistically be licensed here, because its scoring is printed on its own form
  while the ASRS-5's is the thing NYU licenses.

## What would unblock it

In order of likelihood.

1. **Written permission from Professor Kessler** to reproduce ASRS v1.1 Part A in
   a free, non-commercial, open-source application, and to redistribute it as
   part of the source. The address is on the form. This is the route the design
   documents assumed already existed.
2. **A licence from NYU** covering the ASRS-5 and its scoring rules on terms
   compatible with AGPL-3.0. Unlikely: publishing the source means publishing the
   scoring rules, which is the asset.
3. **Ship no screener.** `03-scope.md` argues against this — refusing one "would
   push people toward the unvalidated quizzes that fill the space" — and that
   argument is still good. But shipping one without permission is not the
   alternative to those quizzes; it is the same disregard for provenance with
   better intentions.

Whichever way it goes, `03-scope.md` no longer says the instruments are free.

## Consequences

- The Library shows the screener as "Not yet" and says why, which is the honest
  state of it.
- The exclusion entry for "type" quizzes still says they compete with "the one
  instrument that is [validated]". That remains true and remains the reason to
  pursue permission rather than abandon the screener.
- All three instruments this project would use are copyrighted and none is ours
  to redistribute without asking. That is a fact about screening instruments
  generally rather than bad luck three times, and it is worth knowing before any
  future module is designed around one.
- The items were pushed to a public repository before this was checked, so they
  are in the git history as well as having been in the tree. Purging history is
  the repository owner's call.
