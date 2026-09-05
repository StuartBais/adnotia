# ADR-017: Four things the report will not say

Status: accepted · September 2026 · Applies `03-scope.md` and `02-evidence-rubric.md`

## Context

Porting the monolith's report left four open questions, each about wording a
clinician reads. `CLAUDE.md` puts such wording on the stop-and-ask list; the
maintainer delegated these four. They are recorded here so that "we decided" is
distinguishable from "nobody looked", and so any of them can be reopened with an
argument rather than a preference.

Three of the four are about the same line. `03-scope.md` says the report

> presents the four things prescribers weigh, efficacy, duration, tolerability
> and adherence, side by side, and stops. The prescriber weighs them. That is
> their job and the app does not pretend to do it.

The test each of these had to pass was not "does it contain a forbidden word" but
"does it weigh anything on the clinician's behalf".

## 1. The report is titled "Daily record"

The monolith calls it "ADHD medication log". The kernel owns the header and does
not know that a prescription has a name (ADR-012); the same report is produced
for someone logging only sleep, and a title naming medication would be false on
that page.

"Daily record" is neutral, true of every configuration, and specific enough
because the subject line directly beneath it carries the rest: *Elvanse ·
1 September to 30 September · 29 of 30 days logged (97%)*. A prescriber knows
what the document is within one line of the title.

Rejected: putting the self-report caveat in the title ("Self-recorded daily
log"). The footer already carries that caveat in reviewed wording, and saying it
twice makes the page look defensive rather than plain.

## 2. The optimal-dose sentence is not restored

The monolith's verdict block ends:

> Optimal dose is usually described as the lowest one giving meaningful
> functional improvement with tolerable side effects.

It contains no forbidden word, which is why it was an open question rather than
an obvious cut. It is still out, for two reasons.

It tells the reader how to weigh the four rows above it. That is the sentence
`03-scope.md` stops before. The block presents efficacy, duration, tolerability
and adherence and stops; this sentence resumes.

It is also an unreferenced clinical generalisation — "usually described as" by
whom — and `02-evidence-rubric.md` fails an unreferenced claim at review.

The cost is real: the sentence helped a reader understand what the four rows are
for, and the person reads this page too. That need is better met by the
screen-only reflection, which is for the person and never printed, than by a line
addressed to both parties at once.

## 3. "Side effects over time" keeps the comparison and loses the verdict

The monolith's section compares the first half of the range with the second and
labels each effect **new**, **gone**, **easing**, **worsening** or **steady**.
The label comes from `(days reported ÷ days in half) × mean severity`, compared
across halves against thresholds of 0.7 and 1.3. That composite is never shown.

A number the app computes, does not display, and converts into a word a clinician
reads is the hidden scoring hard rule 4 forbids, and ADR-005 rejected in a more
obvious form. The thresholds are also arbitrary: nothing establishes that a 30%
change in an unshown composite is the boundary between "steady" and "easing".

The comparison underneath it is sound and is ported: for each effect, how many
days in the first half and how many in the second, with the severity actually
rated. A reader can see the direction without being told it, which is the whole
posture of the report.

The section's legend is not ported either:

> Most stimulant side effects settle within the first one to two weeks. The ones
> marked steady or worsening are the ones worth raising.

The first sentence is an unreferenced clinical claim. The second tells a clinician
what to raise, which is the same act as recommending, in a milder voice.

## 4. The 30-minute sleep-latency claim is not restored

The monolith says a latency at or above thirty minutes is "usually treated as
clinically meaningful". The threshold is real and citable — it appears in the
standard insomnia criteria — but it arrives here with no citation, inside a
Tier B module, and `02-evidence-rubric.md` is explicit that a claim without a
reference fails review.

The number itself is reported plainly, which is the descriptive part. The
interpretation may return when the citation pass in Milestone 8 can attach a
verified source to it. Until then the section reports the latency and stops.

## What this ADR does not decide

The evidence tiers. `03-scope.md` requires that "the tier is assigned by someone
other than the author", which is a process rule about who, not a judgement that
can be delegated to the author. Medication still carries the rubric's proposed
Tier A (supporting) and sleep its Tier B, both unconfirmed, and every citation in
both Library entries is still unverified.

## Consequences

- Three of the six open entries in the report parity register close. What remains
  open there is unbuilt work, not undecided wording.
- Anyone restoring one of these needs to answer the argument here, not merely
  prefer the monolith's version.
- The screen-only reflection now carries a debt: it is where a person is supposed
  to learn what the four rows are for, and it does not exist yet.
