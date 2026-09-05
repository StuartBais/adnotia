# ADR-008: A separate Family space, parent-mediated, with no medication tracking

Status: accepted · 2026-09

## Context
Parents of children with suspected ADHD need help deciding whether to seek advice and preparing for it. Children need very little from an app. The instruments and evidence for children differ from adults.

## Decision
A Family space with parent-held child profiles and a small handed-over child surface behind a parent gate. The first job is the NICHQ Vanderbilt parent form under strict presentation rules, plus a dated observation log. Parent tools derive from behavioural parent training with its evidence stated honestly. No child medication tracking, no child self-report screening, no subscale labels, no free text on the child surface.

## Consequences
- Modules gain an `audience` field; the registry enforces child-surface constraints and reserved field ids.
- Family state is per child under `family.children[p]`.
- A parent-configured positive-only reward chart is the single permitted exception to the no-engagement-mechanics rule, because it is a behavioural technique with evidence, run by the parent, not by the app.
- Children's design codes apply in spirit despite the absence of a server.
