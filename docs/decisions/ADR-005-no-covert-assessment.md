# ADR-005: No covert assessment of the person

Status: accepted · 2026-09

## Context
A proposal was made to include hidden checks that would signal to a clinician whether a person seemed to be seeking a higher dose than they needed, without the person knowing.

## Decision
Rejected, permanently. Anything the app computes about a person is shown to that person first, in the same words. The transparent replacements are the record-quality footer (shown to both parties) and the screen-only mirror (shown to the person alone).

## Reasoning
No validated instrument distinguishes drug-seeking from under-treatment in ADHD. A home-made version detects inconsistency and poor recall, which are ADHD symptoms, so it fires hardest on the people whose need is greatest. A false positive in a controlled-substance context costs someone treatment and marks their record. And a document known to contain hidden scoring is one no clinician can trust, including the honest parts.

## Consequences
- Hard exclusion 5 in `03-scope.md`.
- The contract forbids report sections from reaching conclusions for the clinician.
- This ADR exists so the question is not re-litigated by accident.
