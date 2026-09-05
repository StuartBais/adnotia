# Changelog

User-visible changes and every migration, as `docs/05-architecture.md` "Release"
and `docs/06-data-model.md` "Migration rules" require. Each migration is listed
with its version pair and a one-line description.

## Unreleased

Milestone 0 is in progress; nothing has been released yet.

### Migrations

| Versions | Description |
|---|---|
| schema 0 → 1 | Imports a v0 monolith document from `adhd-titration-log-v1`: splits each day into `modules.medication`, `modules.sleep` and `kernel.days`, renames the sleep fields and `lastAppt`, and enables the modules it finds data for. |

### Added

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
- CI running `npm run check`, the test suites and both builds on every push.
