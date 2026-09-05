# Start here

These documents were written before the code. They are the source of truth. When code and docs disagree, the docs win unless a decision record in `decisions/` says otherwise.

## Reading order

1. `03-scope.md` — what Adnotia is, is not, and will never do. Read this first even though it is numbered third; everything else answers to it.
2. `01-module-contract.md` — what a module must declare and may contribute. The medication log is expressed in it as a worked example.
3. `02-evidence-rubric.md` — the tiers, the exclusion list, and the initial tier assignments.
4. `04-family-space.md` — the parent and child extension, with its own exclusions.
5. `05-architecture.md` — stack, layout, kernel, build, tests.
6. `06-data-model.md` — the document schema, envelope, backup and migrations, including the v0 import.
7. `07-design-system.md` — tokens, components, print, voice.
8. `08-roadmap.md` — milestones in order, each with a definition of done.
9. `decisions/` — eight ADRs recording what has already been decided and why.

## Also in this repository

- `reference/adnotia-v0-monolith.html` — the working single-file predecessor. It is the behavioural reference for the medication and sleep modules. Port from it; do not extend it. See `reference/README.md`.
- `assets/logo.svg` — the canonical mark. `assets/icon-180.png` — the home screen icon.
- `CLAUDE.md` at the root — agent instructions, including the hard rules and when to stop and ask.

## Status of these documents

All are draft 0.1. Every citation list is marked "verify before publication". Tier assignments are proposals. Open questions are listed at the end of the documents that have them. The intent is that the first milestones will surface what these documents got wrong, and that those corrections land as ADRs and edits rather than as silent divergence.
