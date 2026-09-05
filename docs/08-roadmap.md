# Adnotia roadmap

Status: draft 0.1 · September 2026 · Milestones are sequential. Each has a definition of done. Do not start the next until the current one's tests pass.

## Milestone 0 — foundations

Goal: an empty, correct shell that proves the architecture.

- Repository scaffold: Vite, TypeScript strict, Vitest, both build targets, CI running `npm run check` and `npm test`.
- `index.html` with the CSP from `05-architecture.md`. A test that asserts the CSP is present and contains `connect-src 'none'`.
- Kernel store with document, slices, debounced persist, `localStorage` adapter, and a host-storage adapter interface.
- Kernel migrations framework with `schemaVersion` 1 and the v0 → v1 import from `06-data-model.md`.
- Crypto: envelope, passcode set/change/remove, unlock screen, backup passphrase. Round-trip and wrong-key tests.
- Backup export and merge-restore with counts.
- Shell: first run, space choice, navigation, off-tab page pattern, settings.
- Design system: `tokens.css`, `base.css`, `print.css` ported from the monolith; every UI primitive in `src/kernel/ui/` with a test; the contrast check script.
- Dates: logging day, midnight-crossing arithmetic, `nearestPrior` lookup.
- Module registry with validation and every failure mode tested.
- The no-network test harness.

Done when: a fresh clone runs `npm install && npm test && npm run build && npm run build:single` green, and the app opens to first run with zero modules and nothing broken.

## Milestone 1 — the medication log as a module

Goal: parity with the monolith, proven by tests.

- `modules/medication` against the contract: manifest, `today` fields with follow-ups and `nearestPrior` carry, `records`, five `clinical` report sections (where things stand, dose over time, cover across the day drawn by the kernel from medication + sleep, per-dose comparison, side-effect grid), `library` entry with citations, fixtures, smoke test.
- `modules/sleep` split out: bed, wake, hours auto-computed, night-quality chips with the latency follow-up, `records`, its `clinical` section, `library` entry.
- Kernel-level wins/misses in Today and in the `clinical` report.
- Kernel-owned `clinical` header (identity, range, coverage), footer (about this record, questions), print and text export, "I have had the appointment", the fortnightly backup nag, the screen-only mirror.
- Parity tests: for the thirtyDays fixture, the monolith and the module build produce the same report text modulo whitespace, the same history lines, and the same text export.

Done when: parity tests pass, a real v0 export imports cleanly, and a person who used the monolith notices nothing missing.

## Milestone 2 — Library and the adult screener

- Library page rendering every module's entry with tier wording, enabled or not.
- Exclusion-list entries (cognitive training, neurofeedback, diets and supplements, "type" quizzes, cure claims), each short, each cited.
- ASRS v1.1 Part A exactly as specified in `03-scope.md`: WHO wording, threshold only, route to assessment, adults, Library-only, never stored as a diagnosis.
- "About Adnotia" page: what it is, what it is not, the privacy commitments, the single-file download, licence, source link.
- The "if things are bad right now" page reachable in two taps from anywhere.

Done when: every shipped module has a complete Library entry that has been read by a human, and the screener has been checked item-for-item against the WHO form.

## Milestone 3 — planning and organisation (Tier A)

- `modules/planning`: the CBT-derived toolkit. Task breaking, time estimation with a reality check against recorded actuals, a today-plan sheet, implementation-intention prompts. `tools` contributions primarily; a small `today` footprint (did the plan hold, one line).
- Library entry that is honest that these derive from protocols with trial evidence and that the specific tools are Tier C where that is true.

Done when: a person can plan a morning in under a minute and the module's `today` cost is under 10 seconds.

## Milestone 4 — mindfulness and exercise (Tier B)

- `modules/mindfulness`: short guided practices as text and timer, no audio files (they are network or bundle weight), session log, Library entry with the low-confidence framing from the rubric.
- `modules/exercise`: prompts and a light log. Tier B wording.

Done when: both entries make their evidence limits clear in the first paragraph.

## Milestone 5 — Family space foundations

- Profiles: nickname, age band, create, switch, delete-with-confirm.
- `parentGate` primitive and the child surface host.
- `family.children[p].modules.<id>` slice routing in the store.
- Reserved-field rejection tested against a deliberately bad manifest.
- `screening` and `observations` reports in the engine with their own headers and footers.

Done when: a parent can create a profile, enter and leave child mode, and nothing from the Adult space is reachable from the child surface.

## Milestone 6 — should I seek advice

- Vanderbilt parent form, item-for-item against the NICHQ original, threshold only, no subscale labels, printed completed form plus blank teacher form, under-6 and 13–17 guidance pages.
- `modules/family-observations`: dated concrete entries, no scores, printed log with coverage footer.
- Parent Library entries: what assessment involves, how routes differ, the pipeline concern stated plainly.

Done when: the completed printed form has been compared side by side with the NICHQ PDF and a paediatric clinician has read the guidance pages.

## Milestone 7 — parent tools and the child surface

- `modules/family-routines`: schedules, first/then, praise prompts, the positive-only reward chart via the kernel primitive, sleep routine builder.
- `modules/child-tools`: visual timer, today's schedule, first/then board, chart view. `audience: "child"`, validated by the registry.
- School guidance page.
- Parent-facing crisis and safeguarding page.

Done when: a child can use the surface without help, and a parent cannot accidentally leave it open.

## Milestone 8 — launch readiness

- Regulatory and children's-code review recorded in `03-scope.md`.
- Citation verification pass on every Library entry, recorded with dates.
- Accessibility audit with a screen reader on iOS and Android.
- Performance budget check.
- `CHANGELOG.md`, release tagging, both artefacts published.
- Static host with a dedicated origin; the About page states the origin-scoping caveat.

## Deliberately not on the roadmap

Accounts. Sync. Notifications. Dark mode (later, as tokens). Audio. Any data leaving the device. Anything on the exclusion list.
