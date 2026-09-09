# Adnotia roadmap

Status: draft 0.1 · September 2026 · Milestones are sequential. Each has a definition of done. Do not start the next until the current one's tests pass.

## Implementation checkpoint

Milestones 0 to 7 and 9 are built and their gates pass. Milestone 8 is partly
done, and what remains of it is mostly review by a person rather than code.
Refreshed 2026-09-09.

**No figures are quoted here on purpose.** This section has carried a test count,
a bundle size and a list of unsigned commits twice, and been wrong about all
three within a day both times — a roadmap that says a thing is unbuilt when it is
built is worse than one that says nothing. The current numbers come from
`npm run check`, `npm test` and `npm run budget`, which are three commands and
cannot go stale.

### Done since the last checkpoint

- Report parity against the monolith, with every remaining difference recorded
  and argued in `tests/parity/report.test.ts`. None is open.
- The Library, the exclusion entries, About, the crisis page, and the parent
  guidance pages. The screeners are built and **not offered**: they are not ours
  to reproduce, see ADR-023.
- The whole Family space: profiles, the parent gate, the handed-over surface,
  the observation log, routines and the reward chart.
- Planning, mindfulness, exercise and preparation.
- The accessibility audit, the performance budget in CI, the regulatory and
  children's-code review, and the citation identifier pass.
- Milestone 9's navigation and check-in rework.
- A focus timer in `planning`, and linking between its tools, which Milestone 3
  did not ask for. The timer is the first thing in the build that needed an
  argument for why it is not a guilt mechanic rather than an assurance that it is
  not one; ADR-038 is that argument, and the test that holds it is named there.
- The clinician's sheet: a letterhead carrying the mark, the name and the
  provenance line, and a page of its own rather than the foot of the Records tab
  (ADR-034).
- What a browser extension can see is said, not detected: on the welcome page,
  in About, and as a third first-run step that offers a passcode. ADR-039,
  amending ADR-007.
- The store persists when the page is hidden or unloaded, so the last
  half-second of edits before a tab closes or a phone suspends the app is no
  longer lost. Best effort, and the limit is written in the handler.
- A backup download's object URL outlives the click by a second.
- The welcome page's screenshots are reproducible run to run; ADR-037 records
  the claim and the measurement that made it true.
- The deploy is gated on CI. Cloudflare builds from `release`, which only the
  `promote` job moves, by fast-forward, after every gate passes. No Cloudflare
  credential exists in GitHub. ADR-040, amending ADR-009, which now also records
  how the deploy runs and why `wrangler` is a devDependency.
- The README describes what is built, by space, and what is not.
- The edge was checked against the source for the first time, and was wrong:
  Cloudflare's Bot Fight Mode was injecting a script into every page. The CSP
  refused to run it, so nothing executed, but the served document was not the
  built one. It is off, and both documents are now byte-identical to `dist/`.
  ADR-009 records the method, which is a two-line `curl | diff` anyone can rerun.
- ADR-040's gate is configured as well as written: Workers Builds' production
  branch is `release` and its build command no longer re-runs the gates.
  Confirmed 2026-09-09.

### Known wrong, not yet corrected

Found in the September 2026 review and still in the tree. Each is small. Each is
user-facing wording about privacy, which is the one kind of wording this project
cannot afford to have wrong.

- **About says the passcode does not work from disk. It does.** Headless Chromium
  opening a page over `file://` reports `isSecureContext` true and
  `crypto.subtle` present, and the Secure Contexts specification lists `file:` as
  potentially trustworthy, so Firefox and Safari agree. The claim is in
  `src/kernel/shell/about.ts` (`singleFile`), `05-architecture.md` "Build",
  ADR-003, and a comment in `src/kernel/crypto/envelope.ts`. It matters more
  since ADR-039, which sends the extension-conscious to the one-file build and
  then tells them it is the one place they cannot lock. The code path is already
  right, because `isCryptoAvailable()` decides at runtime; only the words are
  wrong. Confirm in Firefox, which is on the development machine, before
  rewording, and amend ADR-003 with a dated note rather than a new ADR, since
  nothing is being decided.
- **The extension claim about file URLs is Chrome-specific.** ADR-039 and About
  say extensions must be granted file access separately and are not by default.
  That is Chrome's "Allow access to file URLs" toggle. Firefox lets an extension
  with the all-URLs host permission run on file pages with no separate step.
  Name Chrome, or soften to "in some browsers", and say so in ADR-039.
- **A reload in the debounce window after setting a passcode at first run**
  stores an encrypted document with first run incomplete. On the next open the
  person unlocks, meets first run again, is offered the passcode step again, and
  Set fails with "nothing has been encrypted", which is untrue. The hide flush
  narrows the window and does not close it. Two changes in
  `src/kernel/shell/shell.ts`: flush the store at the end of `onDone`, and omit
  `setPasscode` when `passcodeEnabled` is already true. A test for each.

### Still incomplete

- **Blocked on a person, not on code.** No evidence tier has been confirmed by
  anyone other than its author, which the rubric requires. No citation has been
  read against its original — the September 2026 pass resolved every identifier
  and checked no claim. The crisis numbers have not been confirmed against each
  organisation's own site. The paediatric guidance has not been read by a
  clinician. Permission to reproduce either screener has not been sought.
- **The site's own launch review.** The host itself is done: `adnotia.com` is
  live and ADR-040's gate is configured. What is unfinished is the paperwork the
  site rather than the app owes. ADR-035 lists the operator confirmations the
  About page's site statement depends on, and `03-scope.md` asks for a
  standard-by-standard Children's Code assessment of the distribution site before
  launch. Neither is code, and neither has been started.
- **Release tagging and publishing both artefacts.** `05-architecture.md`
  "Release" says: tag, CI builds both outputs, attach `adnotia.html` to the
  release. CI uploads the single file as a workflow artefact and nothing yet
  turns a tag into a GitHub release. `package.json` is at 0.0.0, About links to
  `/releases`, which is empty, and `CHANGELOG.md` has one "Unreleased" section
  waiting for a version.
- Screen-reader testing on real iOS and Android devices. No automated check
  substitutes for it.
- **Verified by hand, and holding.** The three paths where a defect costs most
  were driven end to end through the built single file in September 2026: the
  passcode round trip (encrypted at rest, wrong code rejected with nothing
  changed, right code restores everything), the backup round trip (encrypted
  file, storage cleared, restored into a fresh app, and a wrong passphrase
  leaving the document byte-identical), and the child hand-over (refused without
  a passcode, four cards, no tabs, no text input, no route to adult data, and a
  wrong code keeping you in). Nothing was found. The kernel suite already covers
  all of it; this was a check that the assembled build agrees.

### Decisions waiting on a person

None of these is for an agent to take. Each is a "stop and ask" item under
`CLAUDE.md`, written here so the question is not rediscovered from scratch.

- **The dependency list.** `CLAUDE.md` permits five and `package.json` holds
  ten. jsdom, prettier and the two `@types` packages are implied elsewhere in
  the same file, and `wrangler` is argued in ADR-009. Widen the list, or not. A
  linter is the piece of `npm run check` still missing, and it is a dependency.
- **The screener items in git history.** ADR-023 removed the ASRS items from
  the tree; they remain in history. Purging is a rewrite of `main`, and under
  ADR-040 a rewritten `main` makes the promote job fail on purpose, so it needs
  doing deliberately and once, with `release` reset by hand afterwards.
- **The open questions** at the end of `01-module-contract.md` and
  `04-family-space.md`: an adolescent space, a child's own check-in, a second
  carer merging entries, and country-specific instruments.
- A stray `copilot/fetch-cloudflare-setup-instructions` branch on the remote,
  to delete or keep.

### Next steps, as options

In the recommended order, and each sized so it can be picked up cold. The
dashboard settings that made ADR-040 true were the entry above this one and are
done; what is left is a choice.

1. **Close "Known wrong".** An agent, about an hour. Three small changes, each
   with a test, and dated amendments to ADR-003 and ADR-039.
2. **A release workflow.** An agent, a session. On a `v*` tag: run the gates,
   build both outputs, create a GitHub release with `adnotia.html` and a zip of
   `dist/` attached, and move the changelog's "Unreleased" under the version.
   Then tag `v0.1.0`. This finishes the code side of Milestone 8.
3. **Review packets.** An agent prepares, a person reviews. The human-blocked
   items stall because nobody has been handed something to review. From the
   Library entries as built, produce: a claim-by-claim list with its citation for
   the second reader; the crisis numbers beside the URL each was taken from; the
   paediatric guidance pages as one document for a clinician; and a draft
   permission request for ASRS v1.1 Part A, addressed as ADR-023 describes.
4. **A device accessibility script.** An agent prepares, a person runs. A
   checklist for VoiceOver and TalkBack against the built single file, so the
   real-device testing is repeatable and its result can be recorded here.
5. **Dark mode as a second token set.** `07-design-system.md` reserves it for
   later, and it is the first feature work worth doing once the above is
   closed.

Not on this list: anything on the exclusion list, and anything that needs the
network.

## Milestone 0 — foundations

Goal: an empty, correct shell that proves the architecture.

- Repository scaffold: Vite, TypeScript strict, Vitest, both build targets, CI running `npm run check` and `npm test`.
- `index.html` with the CSP from `05-architecture.md`. A test that asserts the CSP is present and contains `connect-src 'none'`.
- Kernel store with document, slices, debounced persist, `localStorage` adapter, and a host-storage adapter interface.
- Kernel migrations framework with `schemaVersion` 1 and the v0 → v1 import from `06-data-model.md`.
- Crypto: envelope, passcode set/change/remove, unlock screen, backup passphrase. Round-trip and wrong-key tests.
- Backup export and merge-restore with counts.
- Shell: first run, space choice, navigation, off-tab page pattern, settings.
- Design system: `tokens.css`, `base.css`, `print.css` ported from the monolith; every UI primitive in `src/kernel/ui/` with a test; the contrast check script.
- Dates: logging day, midnight-crossing arithmetic, `nearestPrior` lookup.
- Module registry with validation and every failure mode tested.
- The no-network test harness.

Done when: a fresh clone runs `npm install && npm test && npm run build && npm run build:single` green, and the app opens to first run with zero modules and nothing broken.

## Milestone 1 — the medication log as a module

Goal: parity with the monolith, proven by tests.

- `modules/medication` against the contract: manifest, `today` fields with follow-ups and `nearestPrior` carry, `records`, five `clinical` report sections (where things stand, dose over time, cover across the day drawn by the kernel from medication + sleep, per-dose comparison, side-effect grid), `library` entry with citations, fixtures, smoke test.
- `modules/sleep` split out: bed, wake, hours auto-computed, night-quality chips with the latency follow-up, `records`, its `clinical` section, `library` entry.
- Kernel-level wins/misses in Today and in the `clinical` report.
- Kernel-owned `clinical` header (identity, range, coverage), footer (about this record, questions), print and text export, "I have had the appointment", the fortnightly backup nag, the screen-only mirror.
- Parity tests: for the thirtyDays fixture, the monolith and the module build produce the same report text modulo whitespace, the same history lines, and the same text export.

Done when: parity tests pass, a real v0 export imports cleanly, and a person who used the monolith notices nothing missing.

## Milestone 2 — Library and the adult screener

- Library page rendering every module's entry with tier wording, enabled or not.
- Exclusion-list entries (cognitive training, neurofeedback, diets and supplements, "type" quizzes, cure claims), each short, each cited.
- The ASRS-5 exactly as specified in `03-scope.md`: the instrument's own wording, threshold only, route to assessment, adults, Library-only, never stored as a diagnosis.
- "About Adnotia" page: what it is, what it is not, the privacy commitments, the single-file download, licence, source link.
- The "if things are bad right now" page reachable in two taps from anywhere.

Done when: every shipped module has a complete Library entry that has been read by a human, and the screener has been checked item-for-item against the WHO form.

## Milestone 3 — planning and organisation (Tier A)

- `modules/planning`: the CBT-derived toolkit. Task breaking, time estimation with a reality check against recorded actuals, a today-plan sheet, implementation-intention prompts. `tools` contributions primarily; a small `today` footprint (did the plan hold, one line).
- Library entry that is honest that these derive from protocols with trial evidence and that the specific tools are Tier C where that is true.

Done when: a person can plan a morning in under a minute and the module's `today` cost is under 10 seconds.

## Milestone 4 — mindfulness and exercise (Tier B)

- `modules/mindfulness`: short guided practices as text and timer, no audio files (they are network or bundle weight), session log, Library entry with the low-confidence framing from the rubric.
- `modules/exercise`: prompts and a light log. Tier B wording.

Done when: both entries make their evidence limits clear in the first paragraph.

## Milestone 5 — Family space foundations

- Profiles: nickname, age band, create, switch, delete-with-confirm.
- `parentGate` primitive and the child surface host.
- `family.children[p].modules.<id>` slice routing in the store.
- Reserved-field rejection tested against a deliberately bad manifest.
- `screening` and `observations` reports in the engine with their own headers and footers.

Done when: a parent can create a profile, enter and leave child mode, and nothing from the Adult space is reachable from the child surface.

## Milestone 6 — should I seek advice

- Vanderbilt parent form, item-for-item against the NICHQ original, threshold only, no subscale labels, printed completed form plus blank teacher form, under-6 and 13–17 guidance pages.
- `modules/family-observations`: dated concrete entries, no scores, printed log with coverage footer.
- Parent Library entries: what assessment involves, how routes differ, the pipeline concern stated plainly.

Done when: the completed printed form has been compared side by side with the NICHQ PDF and a paediatric clinician has read the guidance pages.

## Milestone 7 — parent tools and the child surface

- `modules/family-routines`: schedules, first/then, praise prompts, the positive-only reward chart via the kernel primitive, sleep routine builder.
- `modules/child-tools`: visual timer, today's schedule, first/then board, chart view. `audience: "child"`, validated by the registry.
- School guidance page.
- Parent-facing crisis and safeguarding page.

Done when: a child can use the surface without help, and a parent cannot accidentally leave it open.

## Milestone 8 — launch readiness

- Regulatory and children's-code review recorded in `03-scope.md`.
- Citation verification pass on every Library entry, recorded with dates.
- Accessibility audit with a screen reader on iOS and Android.
- Performance budget check.
- `CHANGELOG.md`, release tagging, both artefacts published.
- Static host with a dedicated origin; the About page states the origin-scoping caveat.

## Milestone 9 — how the app is found

Added after Milestone 8 was under way, because the shape of the app turned out to
be wrong in a way no amount of launch readiness would fix. It read as a
medication log with other things bolted on, and three measurements said why:
medication contributed 14 of the 21 `today` fields; the assembler built a card
only for modules declaring `today` fields, so three of the six adult modules
appeared nowhere on the landing tab whatever a person enabled; and the Tools tab
mounted all nine tools expanded into one scroll with no index.

The separation that fixes it was already in `01-module-contract.md` — `today` is
the daily check-in, `tools` are things a person opens deliberately. The shell did
not express it.

- **Areas.** A closed vocabulary the kernel owns, on the module. ADR-030.
- **The tool index.** One card per area, an area page, a tool on its own page.
  Two taps to anything.
- **Navigation.** The index comes first; Today is a tab and is written as the
  day's record.
- **`log`.** A screen-only contribution so a module that asks no question can
  still say what happened. ADR-031.
- **The check-in.** A card opens at its required fields; unanswered optional ones
  sit behind one disclosure, and nothing answered is ever put away. ADR-032.

Done when: a person can find every tool they have enabled without scrolling past
the ones they have not, and the record of a day shows the whole day rather than
the parts that happen to be questions. Both hold.

## Deliberately not on the roadmap

Accounts. Sync. Notifications. Dark mode (later, as tokens). Audio. Any data leaving the device. Anything on the exclusion list.
