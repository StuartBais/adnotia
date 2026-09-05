# ADR-022: The adult screener is the ASRS-5

Status: superseded on the practical point by
`ADR-023-the-screeners-are-not-ours-to-reproduce.md` · September 2026

The clinical argument below still stands: the ASRS-5 is the current instrument
and v1.1 is written against DSM-IV. What it did not check is whether either can
be reproduced here. Neither can, without permission, and the ASRS-5 is the harder
of the two to obtain — its scoring rules are the part New York University
licenses, which is why they are not published. ADR-023 has the detail.

## Context

`03-scope.md` named the WHO Adult ADHD Self-Report Scale, ASRS v1.1, Part A. That
choice was made when the design documents were written and reflects the
instrument most people have heard of rather than a comparison of the two.

ASRS v1.1 dates from 2005 and its items are written against DSM-IV. The ASRS-5
was published by Ustün, Adler, Rudin, Faraone, Lane, Kessler and colleagues in
*JAMA Psychiatry* in 2017, by substantially the same group, and was built against
DSM-5 with the screening task itself as the design goal — the items were selected
for how well they separate, rather than inherited from a longer symptom checklist.

Two things follow that matter here.

The diagnostic criteria moved. DSM-5 changed the age-of-onset threshold and the
symptom count required in adults, and lowered the bar for adult diagnosis
accordingly. A screener whose items were written for the previous criteria is
pointing at a slightly different target from the clinician it refers people to.

And the point of a screener is its operating characteristics. `03-scope.md`
includes one at all because refusing to "would push people toward the unvalidated
quizzes that fill the space", and its stated purpose is "to indicate whether a
formal assessment is worth seeking". That is a claim about how often it is right,
and the newer instrument was derived to be better at exactly that.

## Decision

The Adult space uses the ASRS-5. `03-scope.md`, `08-roadmap.md` and the citation
list in `02-evidence-rubric.md` are amended to match.

Everything else in `03-scope.md` "Screening" is unchanged and still binding: the
instrument's own wording and threshold unmodified, Library-only, one bit of
outcome, no percentage or severity, routing to assessment, adults only, and the
result never stored as a diagnosis. Those rules were written about a screener,
not about that screener.

## This does not lift the gate

ADR-021 holds the screener closed for a reason that is about **scoring**, not
about which instrument was chosen. The transcription to hand states a maximum of
25 for six items whose top response is 4, which sums to 24. Choosing the ASRS-5
does not reconcile those numbers; it makes reconciling them the next task.

The specific thing needed is the scoring table from Ustün et al. (2017), and the
answer to one question: **does the ASRS-5 score as a plain 0–4 sum across six
items, or does it weight response categories differently per item?**

- If it is a plain sum, the achievable maximum is 24, the "25" in the
  transcription is an error, and what remains is checking the six items and the
  five response labels against the paper.
- If it is weighted, the items alone are not enough. The weights are the
  instrument, a plain sum is a different test wearing its name, and the cutoff of
  14 belongs to the weighted score rather than to the sum.

Until that is answered from the paper, `ASRS_SOURCE.verified` stays absent and
the Library goes on saying "Not yet".

## Consequences

- `02-evidence-rubric.md` gains the 2017 citation. Kessler et al. (2005) stays,
  because it is still the origin of the ASRS family and the reference the
  exclusion entry for "type" quizzes points at.
- Nothing in the code changes: `asrs.ts` already names the ASRS-5 and the 2017
  paper as its source, because that is what the transcription actually was. This
  ADR makes the documents agree with it rather than the other way round.
- The design documents were right to be specific about the instrument, and wrong
  about which one. That is the kind of thing the first milestones were expected
  to surface; `00-start-here.md` says so in as many words.
