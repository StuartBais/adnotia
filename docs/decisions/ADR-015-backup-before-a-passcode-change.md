# ADR-015: A backup before any passcode change

Status: accepted · September 2026 · Extends `06-data-model.md` and ADR-007

## Context

The passcode encrypts the document at rest with a key derived on the device
(ADR-007). There is no server, no account and no recovery question, so there is
no route back into an encrypted document without the passcode. That is the point
of the design and it is not negotiable.

It also means a passcode mistake is unrecoverable in a way almost nothing else in
this app is. Three ways to lose everything:

- Setting a passcode and mistyping it identically twice, then closing the tab.
- Changing a passcode and forgetting the new one.
- Removing a passcode while the current one is wrong, on a build where that
  silently re-encrypts rather than failing.

The person this app is written for may be tired, distracted or reading at one in
the morning. "Your passcode cannot be recovered" in a hint under a field is not
a safeguard; it is a sentence they will not read.

## Decision

The passcode page is two cards. The first offers an encrypted backup. The second
holds the set, change and remove controls, and its `<fieldset>` is **disabled**
until a backup has been generated and handed to the browser in this visit.

This applies to setting a first passcode and to removing one, not only to
changing an existing one:

- Setting one is when a person first has something to lose.
- Removing one still rewrites the stored document, and a wrong current passcode
  at that moment is the same loss by a different route.

The backup is encrypted with a separate passphrase of the person's choosing, as
`06-data-model.md` already requires. The page says plainly to keep that
passphrase apart from the passcode, and states what encryption does not protect
against: anything while the page is unlocked, and a compromised host.

## What this does not guarantee

A browser will not tell a page whether a download reached the disk. The controls
unlock when the backup has been **generated and offered**, which is the strongest
signal available; it is not proof the person has a file. A person who cancels the
save dialogue gets the controls anyway.

This is a real limitation and the alternative is worse: there is no way to verify
delivery, so demanding proof would mean never unlocking the controls at all.

## Alternatives rejected

- **A warning instead of a gate.** Rejected: the warning already existed as a
  hint and describes exactly the loss people take anyway. If the consequence is
  unrecoverable, an interstitial that costs one click is proportionate.
- **Gate only on change and remove, not on set.** Rejected above.
- **A recovery code.** That is a second secret to lose, and writing it anywhere
  the app could reach turns it into a key stored beside the lock.

## Consequences

- Turning encryption on costs one extra step. That step produces the backup the
  fortnightly reminder would have asked for anyway.
- `lastBackup` is stamped when the backup is generated, so the reminder does not
  immediately nag someone who has just made one.
- A browser without `crypto.subtle` sees neither card, only a plain statement
  that encryption is unavailable here and nothing has changed (ADR-007).
- If the backup cannot be generated — a passphrase under eight characters is the
  usual reason — the controls stay disabled and the page says why.
