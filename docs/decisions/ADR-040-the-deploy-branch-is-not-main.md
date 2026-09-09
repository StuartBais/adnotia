# ADR-040: The deploy branch is not main

Status: accepted · September 2026 · Amends ADR-009

## Context

`adnotia.com` is a Worker with static assets, built and deployed by Cloudflare
Workers Builds from the connected GitHub repository. Its production branch was
`main`, which is the default, so every push to `main` built and went live.

CI runs `npm run check`, `npm test` and both builds on the same push. It has no
say in the deploy. The two run beside each other and neither waits for the other,
so a commit that fails the gates still reaches `adnotia.com` as long as
`vite build` succeeds — and `vite build` does not run the tests, the typecheck,
the no-network audit or the contrast check. Every gate this repository has can be
red while the thing people load is the commit that made them red.

That is a live-site problem rather than a tidiness one. `03-scope.md` makes
promises the build enforces mechanically — no network, `connect-src 'none'`,
contrast at 4.5:1 — and `scripts/check-no-network.mjs` exists precisely so a
network call is caught before it ships. A deploy path that skips it removes the
enforcement while leaving the promise.

## What was considered

**Run the gates inside the Cloudflare build command.** Set it to
`npm ci && npm run check && npm test && npm run build`, so a red gate fails the
build and the previous deployment stays live. This works, needs nothing new, and
was what ADR-009 recorded when the deploy was first written down. Its weakness is
where the verifying happens: the gates run on Cloudflare, off GitHub, on every
push, duplicating what CI just did; the result is a build log rather than a
commit status; and the connection between "CI is green" and "what is live is
good" stays a coincidence of two systems doing the same work.

**Deploy from GitHub Actions with `cloudflare/wrangler-action`.** CI runs the
gates and then deploys the exact `dist/` it tested. It is the only option where
what is live *is* the artefact that was verified, rather than something rebuilt
from the same commit.

It was rejected for this repository, on ADR-009's own reasoning. It requires a
Cloudflare API token with deploy rights, stored as a secret on a public repo. A
token that can deploy to this origin can serve arbitrary JavaScript from the
origin where every person's `localStorage` lives — which is the exact harm the
rest of ADR-009 is about. That ADR turns off six Cloudflare features because they
inject script into the page; adding a credential that could do the same thing
deliberately, in order to gain a build guarantee, is the wrong trade for this
project. The threat is not that GitHub leaks secrets, it is that the blast radius
here is somebody's medical record and the mitigation is available without the
credential.

## Decision

Cloudflare's production branch is **`release`**, not `main`. Non-production
branch builds stay off.

`release` is moved only by CI, and only by fast-forward:

- `.github/workflows/ci.yml` gains a `promote` job with `needs: check`, so it
  cannot start unless every gate passed. It runs only on a push to `main`.
- It pushes the verified commit to `release` with the workflow's built-in
  `GITHUB_TOKEN`, scoped to `contents: write` on that job alone. The rest of the
  workflow keeps `contents: read`.
- The push is not forced. `release` can therefore only ever move forward along
  `main`'s history, and a force-push to `main` makes the promote fail loudly
  rather than rewriting what is live.

**No Cloudflare credential exists anywhere in GitHub.** Cloudflare keeps pulling
from git as it already does; it is simply pointed at a branch that only verified
commits reach.

Cloudflare's build command stays `npm ci && npm run build`. It does not re-run
the gates, because by construction nothing reaches `release` without them having
passed, and running them twice would make the deploy slower without making it
safer.

## Consequences

- **A broken `main` cannot reach `adnotia.com`.** `release` does not move, and
  the previous deployment keeps serving. That is the whole point.
- **`release` is a record of what is live**, readable in GitHub as a branch that
  is some number of commits behind `main`. When it lags, the gates are red and
  the commits between the two are the ones to look at.
- **A deploy is now two steps and can stall between them.** CI can pass while the
  Cloudflare build fails for a reason of its own, and then `release` has moved
  and the site has not. The build log is the place that says so; nothing in this
  repository can.
- **What is live is built from a verified commit, not built *as* the verified
  artefact.** Cloudflare rebuilds from source. For a deterministic Vite build the
  gap is small, but it is real, and it is the one thing the rejected option would
  have closed. If it ever stops being small — a build that is not reproducible, a
  toolchain difference between the two environments — the answer is to deploy the
  CI artefact, which needs the token and needs this ADR revisited rather than
  worked around.
- **The dashboard setting is outside this repository**, like everything else in
  ADR-009. If somebody sets the production branch back to `main`, the gate is
  gone and nothing here will notice. That is the same exposure as the injection
  toggles, and it is written down for the same reason.
