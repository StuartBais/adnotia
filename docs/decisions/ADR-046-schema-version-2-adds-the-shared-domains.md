# ADR-046: Schema version 2 adds the shared domains

Status: accepted · November 2026 · Follows ADR-043, ADR-044 and the product brief

## Context

The product brief replaces isolated modules with shared domains: one task
list, routines that are the same object for an adult and a child, and the
reward and reminder options ADR-044 decided. The models exist as pure code in
`src/domains/`. They need a place in the stored document, a migration, and a
backup merge, before anything can be built on them.

Two things constrain where they go:

- **A child profile must still delete cleanly.** `04-family-space.md` requires
  that deleting a profile removes everything about the child, and the first
  build met that by construction: every child's data lives inside the profile.
- **A child's surface must not read adult records.** The routine model keeps
  one shelf of routines and runs per owner for that reason.

## Decision

`schemaVersion` becomes 2. A top-level `domains` object holds the adult's
records:

```json
"domains": {
  "tasks": [],
  "routines": { "routines": [], "runs": [] },
  "rewards": { "default": {}, "scopes": {} },
  "completions": [],
  "reminders": []
}
```

**A child's routines live inside the child's profile**, at
`family.children[<id>].routines`, with the same shape. Absent means none. So
deleting a profile still removes everything about the child by construction,
and nothing about a child sits in a structure the adult's tools iterate over.
`routineBookOf(document)` assembles the per-owner book the routine model reads.

This differs from the handoff brief, which put `routines` and `routineRuns` as
two flat lists under `domains`. The brief was written before the routine model
was, and flat lists would have broken both constraints above.

**The 1 to 2 migration** adds `domains` with every part empty and changes
nothing else. A `domains` object already present is kept with its own keys and
only filled in, so it is safe to run twice. No module data is moved or
converted; that happens, if at all, when each part of the app is rebuilt.

**The backup merge** treats the domains as it treats day records:

- tasks, routines, routine runs and reminders merge by `id`, the backup winning
  a collision and everything else unioned, with the counts reported as entries
  added and updated;
- completions are unioned without doubling, so a tally restored twice does not
  go up twice;
- reward settings on this device stand, and the backup's fill only what was
  never chosen here, because they are the person's settings, like the passcode.

## Consequences

- Every document written from now on is version 2. A version 1 document or
  backup is migrated on load and on restore.
- An older build that meets a version 2 document hands it back untouched, as
  the migration rules require.
- Nothing in the interface reads the domains yet.
