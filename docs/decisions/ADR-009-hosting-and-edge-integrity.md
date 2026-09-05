# ADR-009: adnotia.com as a dedicated origin, and no edge that rewrites the page

Status: accepted · 2026-09

## Context
The app is deployed to `adnotia.com`, an apex domain held at Cloudflare. Two things follow that are not obvious.

First, `localStorage` is scoped to an origin. A person's entire document lives there, so the origin is not a deployment detail: it is where the data is. Sharing an origin with anything else, or moving between apex and subdomain, separates people from their records with no error and no way back.

Second, a CDN can rewrite the document it serves. Several Cloudflare features do exactly that, by design: Web Analytics injects a beacon, Rocket Loader rewrites and defers scripts, Email Obfuscation injects a decoder, Bot Fight Mode injects a challenge script, and Zaraz injects whatever it is configured to. Any of these puts third-party JavaScript into a page that promises none, which is hard rule 1 in `CLAUDE.md` and the sixth hard exclusion in `03-scope.md`.

The single-file build makes this sharper. Its CSP carries a build-time SHA-256 hash of its one inlined script (ADR-003). Any edge feature that alters those bytes — an injected tag, a minifier, an HTML rewriter — invalidates the hash and the file stops working entirely.

## Decision
- Adnotia is served from `adnotia.com` as a dedicated origin. Nothing else is hosted there. The About page states the origin-scoping caveat, and a person moving between origins is told to move their data by backup and restore.
- Every Cloudflare feature that injects or rewrites page content stays off: Web Analytics, Rocket Loader, Email Obfuscation, Bot Fight Mode, Zaraz, and any HTML minification or optimisation. Always Use HTTPS stays on, because `crypto.subtle` requires a secure context (ADR-007).
- `deploy/_headers` is the source of the deployed response headers and is copied into `dist/` by the build. It repeats the `<meta>` CSP verbatim and adds `frame-ancestors 'none'`, which browsers honour only in a header.
- `tests/kernel/headers.test.ts` fails if the header policy and the meta policy ever diverge.

## Consequences
- The privacy claim is verifiable at the edge as well as in the source: a reviewer can read `deploy/_headers` and see that `connect-src 'none'` is served, not merely declared.
- The hosting choice is now a correctness constraint rather than an ops preference. Changing host is fine; turning on an HTML-rewriting feature is not, and would be caught as "the downloaded single file stopped working" long before anyone suspected the CDN.
- These are dashboard settings, outside the repository and outside CI. They are written down here because nothing in the build can enforce them.
- A future decision to serve from a subdomain, or to host anything else on the apex, needs its own ADR and a migration story for people's data.
