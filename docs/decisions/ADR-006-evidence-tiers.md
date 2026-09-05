# ADR-006: Every module carries a visible evidence tier

Status: accepted · 2026-09

## Context
Paid ADHD apps present brain training and validated interventions with equal confidence. Users cannot tell which is which. Blinded trials show computerised cognitive training does not improve ADHD symptoms.

## Decision
Every module has a tier (A, B, C) from `02-evidence-rubric.md`, shown before the person enables it, with a Library entry stating what the evidence supports, what it does not, and citations with review dates. Things contradicted by blinded trials are on an exclusion list with their own Library entries explaining their absence. "Evidence-based" as a phrase is reserved for Tier A.

## Consequences
- No tier, no merge.
- Tier assignment is made by someone other than the module's author.
- A credible challenge lowers a tier pending resolution.
