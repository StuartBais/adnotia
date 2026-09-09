# ADR-041: The backup passphrase is the one that must be strong, so enforce it

Status: accepted · September 2026 · Amends ADR-007

## Context

ADR-007 chose an optional six-digit passcode deriving an AES-GCM-256 key through
PBKDF2-SHA256 at 500 000 iterations, and it was honest about the cost:

> A six-digit code is weak against offline GPU attack on exfiltrated ciphertext;
> the backup passphrase is the one that must be strong.

That sentence is the whole design. The passcode is deliberately low-friction
because it is typed on every open by people the app is written for — tired,
distracted, reading at one in the morning — and because there is no recovery
path, so a code somebody cannot recall is data destroyed. The backup passphrase
carries the weight instead: it is chosen once per export, and the backup file is
the artefact that actually leaves the device.

The rule for it was `passphrase.length >= 8`, with no other condition.

So the mitigation the ADR rests on was never built. Eight characters of anything
includes eight lowercase letters, which is hours of one consumer GPU against
500 000 iterations, and includes two short words stuck together, which is much
less. A real backup of real data sealed with `coolthis` — eight characters,
two common words — was opened by somebody who was not meant to have it. Nothing
in the code was broken. The code did exactly what it said; what it said was not
what the ADR relied on.

Two smaller things were found alongside it.

**The iteration count had not moved since it was written.** 500 000 was a
reasonable figure for PBKDF2-SHA256 when ADR-007 was written and is now below
current guidance.

**The envelope header was unauthenticated.** `iter` is read out of the file to
derive the key. An attacker holding a stolen backup could edit it to `1`,
and the file would still open for anyone who knew the passphrase — but far more
usefully, it makes each guess in an offline attack essentially free. The
iteration count defending the file was a field the attacker controlled.

## Decision

**The backup passphrase must be at least 12 characters, and must not be one of a
few obviously guessable shapes.** Digits alone whatever the length, fewer than
five distinct characters, a run across the keyboard, or one of a small list of
the most-used passwords. `isValidBackupPassphrase` keeps its signature;
`backupPassphraseProblem` returns the reason so the interface can say what is
wrong rather than that something is.

The blocklist is deliberately tiny, twenty entries. A real breach corpus is
megabytes, would have to ship in the bundle and in the single file against a
150 kB budget, and would buy little once the length rule is in place, because
nearly all of such a list is short. The copy does the teaching: *four or five
ordinary words in a row, and nothing you use anywhere else.*

**PBKDF2 iterations rise from 500 000 to 1 200 000.** Measured at 108 ms on the
development machine against 56 ms, so roughly a second on a mid-range phone, once
per unlock. The count already lives in the envelope, so existing documents open
at the count they were sealed with and only new seals cost more.

**The envelope gains version 2, whose header is bound as AES-GCM
`additionalData`.** `v`, `kdf`, `iter` and `salt` are authenticated with the
ciphertext, so editing any of them fails decryption. Version 1 is read forever
and never written again; a version 1 document is rewritten as version 2 by its
next save, with the same key, at no cost to the person.

**The six-digit passcode is unchanged.** It is not being made strong, because
making it strong would make it a passphrase, and this ADR does not reopen that
trade. What changes is that the thing ADR-007 said must be strong now is.

## What this does not do

**It does not separate the screen lock from the vault key.** The passcode still
both gates the interface and derives the storage key, which means the strength of
data at rest is still the strength of six digits. Splitting them is the real fix
for that and it is a larger decision: it means a second secret, and a long one,
with no recovery, for a population this app exists to be gentle with. Forcing a
16-character passphrase on somebody with ADHD and no reset produces written-down
passphrases, abandoned encryption and lost records, and data loss is a safety
outcome too. That argument deserves its own ADR and its own evidence, not a
paragraph in this one.

**It does not adopt Argon2id.** It is the better KDF and it was considered. It
needs a WebAssembly library, which needs `wasm-unsafe-eval` in `script-src` —
weakening the exact CSP that absorbed an injected script at the edge in
September 2026 (ADR-009) — plus a dependency beyond the five `CLAUDE.md` permits,
inlined into the single-file build against a budget with about 62 kB spare.
Revisit if the CSP question can be answered; PBKDF2 at a raised count is the
cheaper 80%.

**It does not add a strength meter or generate passphrases.** A generator wants a
wordlist, and a diceware list is roughly 25 kB gzipped against that same 62 kB.

## Consequences

- A stolen backup is meaningfully harder to open. Not impossible: a passphrase is
  still a passphrase, and this buys a factor, not a guarantee.
- **Interop with the reference monolith ends in one direction, deliberately.**
  The monolith decrypts without `additionalData` and so cannot open a version 2
  envelope. `06-data-model.md` claimed the format was interchangeable "and vice
  versa", and that half is now false. The half that matters is unchanged and
  still tested: the monolith's files open here, which is the v0 import in
  `06-data-model.md`. That path is one-way by design — the old key is removed
  once the import is confirmed — and nothing takes a person back.
- Existing backups still restore. Restore never validated the passphrase; it
  decrypts, and a file made under the old rule opens under the new one. Somebody
  with a weak passphrase is not locked out, and is not told to re-export either,
  which is a gap: the interface has no way to say "the file you already have is
  weak". Worth fixing when the verify-backup flow is built.
- Unlock is about twice as slow, once per page load.
- Anyone whose passphrase was `coolthis` should treat the file as compromised
  rather than the passphrase, and re-export. It is a test fixture now, named in
  `tests/kernel/crypto.test.ts` so the case it represents cannot come back.
