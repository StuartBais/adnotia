# ADR-016: Two tabs, one document

Status: accepted · September 2026 · Extends `05-architecture.md` "Store"

## Context

Every write persists the whole document (`06-data-model.md`), because there are
no partial writes. That is simple and it is safe within one tab, where the store
chains writes so two cannot interleave.

Across tabs it is not safe. Two tabs of the same origin share one `localStorage`
key and each holds its own in-memory document. The second tab to write wins, and
it writes a document that never saw the first tab's changes. A person with the
app open on a laptop and again in another window loses whichever they wrote
first, silently, with no error and nothing to notice.

This is not exotic. It is what happens when someone opens the app from a bookmark
having left it open in another window a week ago.

## Decision

The `localStorage` adapter is wrapped by `guardedStorageAdapter`, which:

- remembers the exact string it last wrote for the document key;
- before every write, reads the key back and compares. If what is stored is not
  what this tab last wrote, the write is refused with `StorageChangedError`
  rather than completing;
- takes the Web Locks lock `<key>:write` around the read-and-write pair where
  `navigator.locks` exists, so the check and the write are atomic between tabs.

The refusal surfaces through the store's persistence state, which the shell
already shows: the write stays pending, the person is told the data changed in
another tab, and is told to download a backup of the changes in this tab before
reloading. Nothing is discarded on their behalf.

## What this does and does not guarantee

**With Web Locks** — Chrome, Edge, Firefox, and Safari 16 onwards — the check and
the write happen inside one lock, so a conflicting write cannot land between
them. The guarantee is real.

**Without Web Locks** the check is best-effort and **not atomic**. Two tabs can
still read the same value, both find it as expected, and both write. The window
is small but it exists. The fallback catches the ordinary case — a tab that has
been open a long while — and does not catch a genuine race.

Neither mode merges. Detection is not reconciliation: the person is told, and the
existing backup-and-restore path, which merges rather than replaces, is how the
two versions are brought back together. Automatic merging on every write would
mean resolving conflicts inside a debounce with no one watching, which is how
data quietly goes missing rather than loudly failing.

## Alternatives rejected

- **`storage` events to keep tabs in step.** They fire in the *other* tab, after
  the fact, and say nothing about what a tab is about to write. They would let a
  tab notice it was overwritten; they would not stop it.
- **Last-write-wins, as before.** That is the bug.
- **A single-tab lock that refuses to open a second tab.** Hostile, and a person
  legitimately reopens the app all the time.
- **Automatic merge on conflict.** Rejected above.

## Consequences

- Losing a write is now visible instead of silent, which `05-architecture.md`
  calls the one thing this app must not do quietly.
- The refusal is a real failure state the shell has to render, which is why the
  store carries `persistence()` of `saved`, `pending` or `error` and a retry.
- A person genuinely working in two tabs will hit this and have to reconcile by
  backup and restore. That is inconvenient and honest.
- The non-atomic fallback should be re-examined when Web Locks are available
  everywhere the app supports; the guard can then become unconditional.
