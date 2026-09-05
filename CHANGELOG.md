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
- CI running `npm run check`, the test suites and both builds on every push.
