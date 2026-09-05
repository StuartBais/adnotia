# Changelog

User-visible changes and every migration, as `docs/05-architecture.md` "Release"
and `docs/06-data-model.md` "Migration rules" require. Each migration is listed
with its version pair and a one-line description.

## Unreleased

Foundations and medication-log parity are in progress; nothing has been released
yet. See the implementation checkpoint in `docs/08-roadmap.md` for current limits.

### Fixed

- The report printed the stored code for "overall, compared with before you started" — a
  prescriber would have read `mi` where the monolith reads "much better".
- The thirty-day sleep fixture contained `24:50`, which is not a time. This build rejected
  it and the monolith did not, so every figure drawn from it differed between the two. Bed
  times now wrap past midnight.
- A dose block with no prescription recorded was labelled `medication ?mg` in lower case at
  the head of its own block.
- History showed neither focus, mood, rebound nor appetite, and dated each line `2026-09-30`
  rather than `30 Sept, Wed`.

- Startup now unlocks encrypted documents before rendering the shell, imports
  encrypted legacy records without removing their original key, and leaves
  unreadable data in place with a retry screen.
- Medication eligibility is checked both during first run and when enabling a
  tool in Settings. Disabled tools retain their data.
- Today now exposes the existing calendar, prevents future-day selection, and
  keeps the selected logging date across tab changes.
- Stale-tab writes are rejected when another tab has changed the stored
  document, including encryption changes. Web Locks serialize writes where
  available; without them the conflict check is best-effort. Local unsaved
  changes remain available for backup.
- Tapping the selected space keeps its selection active; switching spaces
  preserves Adult records. Lock-screen headings follow the existing typography.
- Restore now applies and persists the complete merged document before confirming
  success, and keeps the confirmation visible after the shell refreshes.
- Failed writes remain visible across navigation, with a retry action that saves
  the current in-memory data. Storage-unavailable warnings survive first run.
- Automatic sleep duration updates onscreen and in storage when times change,
  including after reload. Explicit answers and legacy durations remain untouched.
  Additive `_derived` metadata records automatic values; no existing records are
  rewritten. See ADR-014.

### Migrations

| Versions     | Description                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| schema 0 → 1 | Imports a v0 monolith document from `adhd-titration-log-v1`: splits each day into `modules.medication`, `modules.sleep` and `kernel.days`, renames the sleep fields and `lastAppt`, and enables the modules it finds data for. |

### Added

- Passcode settings with an encrypted-backup prerequisite, masked inputs,
  set/change/remove actions, and Lock now. Encryption changes publish only after
  storage accepts the new document; failed changes retain the previous codec.
- Manage tools in Settings: enable/disable, ordering, and separate confirmed
  data deletion. Space selection is available after first run.
- Masked backup passphrases and an explicitly labelled unencrypted backup option
  when browser encryption is unavailable.
- Vite, TypeScript strict and Vitest scaffold, with the PWA and single-file build targets.
- The content security policy, served both as a `<meta>` tag and as real response headers from `deploy/_headers`.
- The kernel date and clock service: logging day, midnight-crossing arithmetic, `nearestPrior` carry.
- The kernel store: document, slices, debounced persist, `localStorage` and host adapters.
- The kernel migration framework and the v0 import.
- Optional passcode encryption at rest and the backup-passphrase primitives, in the envelope format the monolith already used, so a v0 document opens unchanged.
- Backup export and merge-restore: a backup carries every slice, is encrypted with a
  passphrase chosen per export, and restores by merging rather than replacing.
- The module registry, validating every manifest at registration: tier and Library entry,
  the forty-second check-in budget, reserved medication field ids outside the Adult space,
  and what a child module may contribute.
- The design system's stylesheets — tokens, base and print — ported from the reference
  implementation, with a contrast check that fails the build if a text-on-surface pair
  drops below 4.5:1.
- Every shared UI primitive in `src/kernel/ui/`: scales, chips, follow-up detail rows,
  inputs, the calendar, cards, link rows, the nag, the mirror, and the Family space's
  positive-only reward chart and parent gate.
- The shell: first run, the choice between the Adult and Family spaces, the four tabs,
  the off-tab page pattern, and settings with backup and restore.
- The Today assembler: one check-in built from whatever is turned on, with carry rules,
  follow-ups that stay hidden until wanted, and the ninety-second budget.
- The sleep module, Tier B: bed and wake times, hours filled in from them, night-quality
  chips with a follow-up on how long it took to drop off, its own history and its section
  of the clinical report.
- The medication log, Tier A supporting: the prescription carried forward, adherence,
  focus and mood, cover, side effects with severity asked only once one is ticked, its own
  history, and the "where things stand" and side-effect sections of the clinical report.
- Wins, misses and the day's note as kernel fields, filled in at the end of the check-in
  and readable by any report, so a person who logs only sleep still records them.
- The reports engine: the kernel owns the header (what the record is about, the dates, the
  coverage), the footer ("about this record", the questions for the appointment), the
  ordering of sections by weight, the print stylesheet and the plain-text export. Modules
  supply only the sections in between, and may offer the frame short phrases it cannot work
  out for itself. See `docs/decisions/ADR-012-report-frame-contributions.md`.
- The clinical report itself, reachable from Records: the range to cover, the person's own
  overall word, a list of questions that prints at the end, "I have had the appointment",
  Print, and Copy as text.
- The chart primitives — the stair chart, the day timeline and the severity grid — in the
  design system alongside the palette they draw with, so no module draws its own.
- The shared day timeline: one row per day on a 6pm-to-6pm clock, drawn by the kernel from
  every module that puts something on it. Sleep draws its band, medication draws its cover,
  its dose ticks and its rebound dots, and neither knows the other exists. A person logging
  only sleep still gets the chart. See `docs/decisions/ADR-013-shared-day-timeline.md`.
- The remaining clinical sections: dose over time with a rolling average of focus, how each
  dose performed against the person's own before-medication baseline, and the side-effect
  severity grid above the table it already had.
- Report parity against the v0 monolith: the same thirty-day dataset is read by the monolith
  running in jsdom and by this build through the v0 import, and their reports, history lines
  and text exports are compared. Every deliberate difference is named in a register in the
  test with its reason, and the register says how many are still open rather than implying
  parity that does not exist yet.
- Prettier, pinned to the house style, with `npm run check` failing on unformatted code.
  Formatting was drifting between contributors because nothing checked it.
- CI running `npm run check`, the test suites and both builds on every push.
