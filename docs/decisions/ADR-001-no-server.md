# ADR-001: No server, no network, ever

Status: accepted · 2026-09

## Context
The app handles health data. Every hosted alternative in this space collects it. The simplest privacy claim that a person can verify is "nothing leaves your device".

## Decision
Adnotia has no backend, no accounts, no analytics and no network requests of any kind. The kernel exposes no networking primitive to modules. `index.html` sets `connect-src 'none'` so the browser enforces it. The test harness fails any attempt.

## Consequences
- No cross-device sync. Backup and merge-restore is the sync story.
- No push notifications. Reminders are the device's job, not the app's.
- Hosting is free static files on a dedicated origin.
- The single-file build and the open source licence are what make the claim auditable.
