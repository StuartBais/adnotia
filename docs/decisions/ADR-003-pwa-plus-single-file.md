# ADR-003: PWA as the primary build, single file as a release artefact

Status: accepted · 2026-09

## Context
The v0 monolith was one HTML file. That made it inspectable, free to host and trivially self-hostable, but it will not scale past a few modules. Almost every user will run the app from a home screen icon over https.

## Decision
Vite builds two outputs from the same source: a PWA with a service worker for offline and install, and one self-contained `adnotia.html` with everything inlined. The PWA is what is deployed; the single file is attached to every release and downloadable from the About page.

## Consequences
- `'unsafe-inline'` for styles in the CSP; scripts remain `'self'` with build-time hashes in the single file.
- Encryption requires a secure context; the single file opened as `file://` says so instead of failing silently.
- Both builds run in CI on every push.
