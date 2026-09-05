# Reference implementation

`adnotia-v0-monolith.html` is the complete predecessor: a single self-contained file containing the medication log, sleep tracking, the clinical report with all its charts, the calendar, passcode encryption, encrypted backups, the baseline page, the mirror, the questions list and the record-quality footer. It works. Open it in a browser and it runs.

## What it is for

It is the behavioural specification for Milestone 1. Every feature in it maps to a contribution point in `docs/01-module-contract.md` (see the worked example there), and Milestone 1 is done when parity tests prove the module build produces the same report, history and text export for the same fixtures.

jsdom can execute it. `tests/parity/` should load it with `runScripts: "dangerously"`, inject a fixture into `localStorage` under `adhd-titration-log-v1`, and read the rendered DOM. The v0 storage shape is documented in `docs/06-data-model.md`.

## What to port

Everything under the "Worked example" table in the contract. In particular, these were hard-won and should not be reimplemented from scratch:

- The calendar (one-tap select, logged-day dots, future disabled, locale first weekday).
- `carry: "nearestPrior"` semantics (the prescription on a day is whatever the nearest *earlier* logged day recorded, falling through skipped days; a later day only if nothing earlier exists, with a warning).
- The after-midnight logging-day rule.
- Sleep duration across midnight and the averaging of clock times that straddle it.
- The verdict block ("Where things stand") and its exact wording constraints.
- The cover-across-the-day chart on a 6pm-to-6pm clock.
- The record-quality footer and the mirror's five observations.
- The crypto envelope, which is unchanged between v0 and v1.
- The print stylesheet.

## What the contract exercise already decided to change

- Sleep becomes its own module. The monolith stores it inside each medication day; the v0 → v1 migration splits it.
- Wins and misses move to the kernel.
- The cover chart is drawn by the kernel from medication and sleep data together, not by the medication module alone.
- The storage key changes to `adnotia-v1` with an import from the old key.
- The `last` carry-forward cache is dropped; `nearestPrior` recomputes it.

## What not to do

Do not add features to this file. Do not fix bugs in it unless a parity test needs the fix to establish correct behaviour, and then record the fix in the test. When Milestone 1 is complete, this file stays in the repository as a historical reference and the parity tests keep running against it.
