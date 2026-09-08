# ADR-036: A welcome page in front of the app

Status: accepted · September 2026 · Amends ADR-009, follows ADR-035

## Context

Somebody who found `adnotia.com` got the app shell: a first-run question with no
explanation of what they had found. Nothing to read, nothing to share, nothing
for a search engine to index.

ADR-009 says, in terms: "Adnotia is served from `adnotia.com` as a dedicated
origin. **Nothing else is hosted there**," and "A future decision to serve from a
subdomain, or to host anything else on the apex, needs its own ADR and a
migration story for people's data." A welcome page is something else. This is
that ADR.

## Decision

**The welcome page is `/`. The app is `/app/`. Same origin.**

`localStorage` is scoped to an origin and not to a path, so the split moves
nothing: the app reads the same `adnotia-v1` key at `/app/` that it read at `/`.
**No migration story is needed, and none is offered** — the site has never been
deployed, there are no releases, no installed apps and no bookmarks. That is the
whole reason this is cheap now and would not have been later.

A subdomain was never an option: that *is* a different origin, and it would
separate people from their records with no error and no way back, which is the
thing ADR-009 exists to prevent.

**Somebody who already has a record never sees the page.** A script in the head,
before anything paints, sends them to `/app/`. `?welcome` overrides it, so the
page stays readable and shareable by somebody who uses the app. Reading
`localStorage` *throws* where a browser is set to block site data, and there the
welcome page is the right answer, so the failure path is the default path.

## What the copy may not say, and why it is a rule

This page is the highest-risk document in the project, and not for a reason
anybody would guess from looking at it.

The MHRA sets **intended purpose** — the thing that decides whether Adnotia is a
medical device — from "the device's labelling, instructions for use and any
promotional materials", and the guidance names **the landing page**. The
September 2026 review in `03-scope.md` concluded Adnotia is not a device and
listed what would change that. Three of those items are things a landing page
could do in one sentence written in a hurry:

- the indicative verbs — **detects, screens, predicts, measures, monitors your
  ADHD**
- describing the report as showing **whether a medication is working**
- implying the app helps somebody **find out whether they have ADHD**

So the page describes **recording**. It says what the app will not do in its own
section, including that it will not tell anybody whether they have ADHD.
`tests/kernel/welcome.test.ts` fails the build on any of the above, on
"evidence-based" outside Tier A, and on an exclamation mark.

## The two things that would have shipped broken

**The service worker would have eaten the page.** `dist/sw.js` registers a
`NavigationRoute`, which answers *every* navigation inside its scope from the
precached app shell. Registered at the origin root, the first person to open the
app would have found the welcome page silently replaced by it — online and
offline, for as long as the registration lived. It now carries a
`navigateFallbackDenylist` for `/`, and its precache glob is scoped to the app's
own output so the welcome page is never versioned with the app.

**The redirect would never have run.** The page's CSP is `script-src 'self'`,
which blocks an inline script outright. The redirect has to be inline — it must
run before anything paints, and a separate file means a request and a flash of a
page not meant for that person — so the build authorises it by SHA-256 hash, the
same technique `scripts/finish-single.mjs` uses. Nothing in jsdom enforces CSP, so
every test would have passed with a dead redirect; a test now recomputes the hash
from the built file.

## Consequences

`scripts/check-no-network.mjs` audited one `index.html` and **swallowed a missing
file**. Had it not been changed, moving the app would have left `npm run check`
printing "No-network audit passed" while auditing the welcome page and not the
app — hard rule 1 unenforced, silently, behind a green tick. It now names both
documents and fails when a named one is absent.

`scripts/check-budget.mjs` had the same shape of fault and did briefly exhibit it:
it measured whatever sat at `dist/index.html`, so after the move it reported 4.4
kB of a 150 kB budget with 145 kB to spare — passing loudly while measuring
nothing anybody had budgeted. It now budgets the app, and gives the welcome page a
tighter budget of its own, because that page is loaded by somebody on mobile data
with no reason yet to wait for it.

The audit also learned a distinction it should always have had: an `<a href>` to
the source repository is not a network request. It forbids what a document
*loads* — scripts, stylesheets, fonts, images — and not where a person may choose
to go.

Unmatched paths still fall back to `/index.html`. That is now the welcome page,
and it is the right fallback rather than a compromise: a stranger following a
broken link gets the introduction, and somebody with a record is sent straight on
by the redirect. A mistyped app URL heals itself.
