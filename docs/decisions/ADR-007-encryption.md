# ADR-007: Optional passcode encryption at rest; separate passphrase for backups

Status: accepted · 2026-09

## Context
`localStorage` is readable by anyone with the unlocked device, any extension with page access, or anyone sharing the browser profile. Backup files leave the device and are the likeliest leak.

## Decision
An optional numeric passcode (≥ 6 digits) derives an AES-GCM-256 key via PBKDF2-SHA256 (500 000 iterations) and encrypts the whole document. Backups are encrypted with a separate, longer passphrase chosen per export. Keys live only in memory for the page's life. There is no recovery path, and the UI says so and forces a backup first.

## Consequences
- Protects against the realistic threats: a picked-up phone, a shared profile, a nosy extension, a leaked file.
- Does not protect against a compromised host, which could capture the passcode; no client-side scheme can. Stated plainly in the app.
- A six-digit code is weak against offline GPU attack on exfiltrated ciphertext; the backup passphrase is the one that must be strong.
