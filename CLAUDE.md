# Adnotia

Free, open-source, evidence-based tools for adults with ADHD and for parents of children who may have it. Everything runs in the browser. Nothing is ever sent anywhere.

You are building this from design documents that were written before the code. Read them before touching anything. They are the source of truth; when code and docs disagree, the docs win unless an ADR says otherwise.

## Read in this order

@docs/00-start-here.md
@docs/03-scope.md
@docs/01-module-contract.md
@docs/02-evidence-rubric.md
@docs/04-family-space.md
@docs/05-architecture.md
@docs/06-data-model.md
@docs/07-design-system.md
@docs/08-roadmap.md

Decisions already made live in `docs/decisions/`. Do not reopen them without writing a new ADR.

## Hard rules — these are not style preferences

1. **No network. Ever.** No `fetch`, no `XMLHttpRequest`, no `sendBeacon`, no WebSocket, no external `<script>`, `<link>`, font or image URL. The CSP in `index.html` sets `connect-src 'none'` and the test harness fails any build that makes a request. If you think a feature needs the network, it does not belong in this project.
2. **Describe, never prescribe.** Nothing shown to a clinician contains *should*, *increase*, *decrease*, *recommend*, or any equivalent. Nothing tells a person whether to take a dose. See `docs/03-scope.md` "Hard exclusions".
3. **No guilt mechanics.** No streaks, badges, points, "you missed N days", or shaming notifications anywhere. The one exception is the parent-configured reward chart in the Family space, and only as specified in `docs/01-module-contract.md`.
4. **No covert assessment.** Anything the app computes about a person is shown to that person first, in the same words. No hidden scoring, no credibility flags. This was considered and rejected; see `docs/decisions/ADR-005-no-covert-assessment.md`.
5. **No medication in the Family space.** The kernel rejects reserved field ids (`dose`, `med`, `times`, `onset`, `woreOff`, `rebound`) outside the Adult space. Do not work around this.
6. **Modules are opt-in and self-contained.** A module owns exactly one state slice and contributes through the contract's named points. No module reads another's slice without a declared dependency.
7. **Every module has a Library entry with a tier and citations.** No tier, no merge. "Evidence-based" as a phrase is reserved for Tier A.

## How to work in this repository

- **Stack:** TypeScript (strict), vanilla DOM, ES modules, Vite. No UI framework in Milestones 0–1. If module boilerplate becomes a real cost later, propose Preact in an ADR rather than adding it quietly.
- **Tests:** Vitest with jsdom. Every module ships `fixtures/` (empty, threeDays, thirtyDays) and a smoke test that renders every contribution against each fixture, runs every migration, and asserts no network call. `npm test` must pass before any commit.
- **The reference implementation** is `reference/adnotia-v0-monolith.html`. It is a working single-file app containing the complete medication log. **Port from it; do not extend it.** When porting a feature, write a parity test that replays the same fixture through the monolith (jsdom can run it) and the new module and compares output. `reference/README.md` explains what to keep and what the contract exercise already decided to move.
- **Two build outputs, always:** `npm run build` produces the PWA in `dist/`; `npm run build:single` produces `dist-single/adnotia.html`, one self-contained file. Both must work from a fresh clone. See ADR-003.
- **Copy and tone** follow `docs/07-design-system.md` "Voice". Sentence case. No exclamation marks. A missing day is "a day missing", not "you forgot".
- **Accessibility** is not optional: every interactive element keyboard-reachable, `aria-pressed` on toggles, contrast ≥ 4.5:1 checked against the token table.
- **Commits:** small, one concern each, imperative mood. Reference the milestone from `docs/08-roadmap.md` in the body.
- **ADRs:** any decision that changes something in `docs/` gets a new file in `docs/decisions/` before the code lands. Use the existing ADRs as the template.

## When to stop and ask the human

- Anything that would touch the hard rules above.
- Assigning or changing an evidence tier.
- Adding a dependency beyond Vite, TypeScript, Vitest, vite-plugin-pwa and vite-plugin-singlefile.
- Wording that will be printed for a clinician or shown to a child.
- Anything in `docs/04-family-space.md` marked as an open question.

Otherwise, decide, write it down, and keep going.

## Useful commands

```
npm install
npm run dev            # Vite dev server
npm test               # Vitest, all suites
npm run test:parity    # monolith vs module comparisons
npm run build          # PWA to dist/
npm run build:single   # one-file bundle to dist-single/adnotia.html
npm run check          # typecheck + lint + contrast + no-network audit
```

If a command above does not exist yet, Milestone 0 in the roadmap is where it gets created.
