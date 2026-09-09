# ADR-007: Optional passcode encryption at rest; separate passphrase for backups

Status: accepted · 2026-09

## Context
`localStorage` is readable by anyone with the unlocked device, any extension with page access, or anyone sharing the browser profile. Backup files leave the device and are the likeliest leak.

## Decision
An optional numeric passcode (≥ 6 digits) derives an AES-GCM-256 key via PBKDF2-SHA256 and encrypts the whole document. Backups are encrypted with a separate, longer passphrase chosen per export. **ADR-041 amends the numbers and enforces the passphrase.** The iteration count is 1 200 000, the passphrase minimum is 12 characters with a check against obviously guessable shapes, and the envelope header is authenticated. This ADR's own sentence below — that the backup passphrase is the one that must be strong — was the reasoning; for two years it was not the rule. Keys live only in memory for the page's life. There is no recovery path, and the UI says so and forces a backup first.

## Consequences
- Protects against the realistic threats: a picked-up phone, a shared profile, a leaked file, and an extension collecting browser storage in bulk across every site.
- **Amended by ADR-039**: "a nosy extension" was one item here and is really two. An extension that hoovers up `localStorage` everywhere gets an envelope and nothing it can use. An extension that targets Adnotia defeats this completely — with host permissions it reads the decrypted record off the DOM while the app is open, or hooks `crypto.subtle` and captures the passcode. That is the same class as a compromised host, below, and no client-side scheme addresses it. The app says both halves rather than the comfortable one.
- Does not protect against a compromised host, which could capture the passcode; no client-side scheme can. Stated plainly in the app.
- A six-digit code is weak against offline GPU attack on exfiltrated ciphertext; the backup passphrase is the one that must be strong.
