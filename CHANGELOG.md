# Changelog

User-visible changes and every migration, as `docs/05-architecture.md` "Release"
and `docs/06-data-model.md` "Migration rules" require. Each migration is listed
with its version pair and a one-line description.

## Unreleased

Foundations and medication-log parity are in progress; nothing has been released
yet. See the implementation checkpoint in `docs/08-roadmap.md` for current limits.

### Added

- The logo is on screen. The stylesheet had sized `.brand .logo` and `.brand.big .logo`
  since the design system was written, and nothing rendered either — so the masthead, the
  first-run screen and both lock screens showed the name with no mark, and there was no tab
  icon or home-screen icon at all.
- The dose chart's legend describes the 7-day rolling average instead of telling a clinician
  to prefer it over the daily dots. The fact that justified the advice is kept.
- The printed clinical report now states, in words under the dose chart, how many days it
  covers and which dose levels it steps through. It said this only in the plain-text export,
  so a prescriber reading the printed sheet had the dose levels only as marks inside a
  picture. See ADR-027.
- Accessibility audit against the rules in `docs/05-architecture.md`, and the seven violations
  it found are fixed: six classes below the 12.5 px screen floor, and three on the child
  surface below its 16 px one. The rules are now held by tests against the real stylesheet.
- The performance budget is enforced in CI rather than checked at release. Initial load is
  75.8 kB gzipped against a 150 kB budget.
- Talking to the school: what a daily report card is, what the evidence for it does and does
  not show, and the specific things to ask for. There is nowhere to enter a teacher's
  ratings and there will not be — the card is the school's to run.
- The "if things are bad right now" page gains child- and parent-specific lines in the Family
  space, alongside the general ones rather than instead of them, with the parent's own line
  first. It still reads nothing and reacts to nothing.
- Guidance pages now carry a tier and their references, like every other evidence claim in
  the app. See ADR-026.
- Parent tools for the Family space: routines you build for a part of the day, a first/then
  pair, a star chart you run yourself, and worked examples of saying what you noticed.
- The screen you hand over, with the four things `docs/04-family-space.md` lists on it: a
  timer the child can start, the routine, the first/then pair, and their chart to look at.
  Nothing to type, nowhere to go, and the parent's code to get back out.
- A tool now receives the slices of the modules it declares as dependencies, read-only. It is
  how a child module reads the schedule and chart a parent set up, and it is scoped to what
  was declared rather than to everything.
- Parent guidance in the Family Library: what an assessment actually involves, what to do
  when a child is under six and no validated free form exists, and what to do at thirteen and
  over where the usual parent form stops being validated. None of it scores anything and none
  of it reads what the parent has written.
- An observation log for the Family space: dated entries with where, what happened in the
  parent's words, what was going on beforehand and whether anything helped. It prints as a
  dated list grouped by setting with a coverage line and the same record-quality footer the
  adult report uses. Nothing is scored, nothing is rated and nothing is labelled.
- The Family space foundations: child profiles with a nickname and an age band and nothing
  else, switching between them, and removal behind a confirmation that says what goes with it.
- The handed-over surface. It replaces the whole app rather than sitting in a tab, mounts only
  `audience: "child"` modules, offers no text entry and no links, and needs the parent's
  passcode to get back out. Handing over is refused outright when no passcode is set.
- The `screening` and `observations` reports, both Family-audience. The clinical report stays
  adult-only.
- A mindfulness module, Tier B: three practices written as steps with a timer, and a session
  log. No audio — the roadmap rules it out, and there is nothing here to fetch it with. The
  evidence limit sits on the practice as well as in the Library.
- An exercise module, Tier B: a light log of what you did and roughly how long. No target, no
  weekly minimum, no total.
- A countdown timer in the kernel, used by the mindfulness practice and needed later by the
  focus timer and the child surface. It works out where it is from the clock rather than from
  how often it was ticked, so a backgrounded tab does not come back wrong. It makes no sound.
- A planning module: a plan for the day, breaking something down so the first step is small
  enough to start, an estimate against what it actually took, and if–then prompts. Tools
  first, with one optional daily question at eight seconds.
- A tool can carry its own evidence tier where it is lower than its module's, shown in the
  rubric's own wording at the tool and listed in the Library. The registry rejects a tool
  claiming more than the module it ships in. See
  `docs/decisions/ADR-025-a-tool-can-carry-its-own-tier.md`.
- Somewhere to enter the before-medication baseline. The clinical report has always read it
  — "focus 2.9/5, against a self-rated 2/5 before medication" — and nothing wrote it, so that
  comparison never appeared for anyone.
- The check-in budget is shown. Above about ninety seconds the person is offered the option
  of hiding the optional questions, which the assembler could already do and nothing asked
  for. It describes the form, never the person.
- A "Preparing for an assessment" module: a dated log of specific examples — what happened,
  where, what was going on beforehand, what it cost — and a place to gather what can be found
  out about childhood, which is the question adult assessments most often turn on and the one
  a person can least answer in the room. It prints as a page to take to a first appointment.
  Nothing is scored, counted toward anything, or interpreted. See
  `docs/decisions/ADR-024-preparing-for-an-assessment.md`.
- Tool contributions are rendered, so the Tools tab is no longer a placeholder, and a fourth
  named report, `preparation`, with the Adult audience.
- Neither screening instrument is free to reproduce, and `docs/03-scope.md` no longer says
  they are. ASRS v1.1 is © WHO 2003 with permission requests addressed to Professor Kessler,
  naming noncommercial distribution explicitly; the ASRS-5's scoring rules are licensed by
  New York University and are not published. The screener ships with no items at all until
  permission is held in writing. See
  `docs/decisions/ADR-023-the-screeners-are-not-ours-to-reproduce.md`.
- The adult screener is the ASRS-5 rather than ASRS v1.1 Part A. The design documents named
  v1.1, which is written against DSM-IV; the ASRS-5 was built against DSM-5 by the same
  group with screening performance as the design goal. See
  `docs/decisions/ADR-022-asrs-5-replaces-asrs-v1-1.md`.
- The adult screener, built and deliberately not offered. Every presentation rule
  `docs/03-scope.md` fixes is implemented and tested — Library-only, one bit of outcome,
  the score never shown, routing to assessment, adults only, and the result not stored,
  which is enforced by handing the page no store at all. The instrument itself is gated
  behind a verification date that is not set. See
  `docs/decisions/ADR-021-the-adult-screener-is-not-yet-verified.md`.
- "If things are bad right now", one tap from every screen. It says plainly that the app
  cannot help, leads with the local emergency number, then lists a few free lines that a
  phone can dial in one tap. It asks nothing, records nothing and never reads the document.
- "About Adnotia": what it is, what it is not, what happens to what you write, the licence
  and the source, and the caveat `docs/03-scope.md` asks be stated plainly — that entries
  belong to the address the app was served from, so opening it at another one starts empty.
- The Library: every module's evidence entry, enabled or not, with the tier in the words
  `docs/02-evidence-rubric.md` fixes and never as a bare letter, the four parts an entry must
  have, its references with years, and its review dates. Modules appear in build order —
  nothing sorts one tier above another.
- The exclusion entries: brain training, neurofeedback, diets and supplements, "type"
  quizzes, cure claims, and anything that works out a dose. Each says what it is, what the
  evidence found, and what would change the decision, so an exclusion is a position rather
  than a prejudice.
- An entry whose references nobody has checked against the originals says so, on the entry.
  See `docs/decisions/ADR-020-unverified-citations-are-visible.md`.
- The screen-only reflection: at most four things worth knowing about your own record,
  shown before the report and never printed, exported or shared. Modules contribute what
  they notice; the kernel decides what is shown and holds the limits. This is the second
  half of the trade `docs/03-scope.md` makes in place of covert assessment — the first
  half, the record-quality footer, shipped with the report engine. See
  `docs/decisions/ADR-019-the-mirror-and-the-nag.md`.
- The fortnightly backup reminder, on Today only: after five logged days, not within a
  fortnight of a backup, and not within a fortnight of being dismissed. Dismissing does not
  switch it off.
- "Day by day": every day in the range with the values the person entered, assembled from
  every module's declared columns in weight order. Medication takes weights 10 to 60 and 80,
  sleep takes 70 and lands between them, and neither knows the other exists. See
  `docs/decisions/ADR-018-shared-day-table.md`.
- Wins, misses and the day's note now appear in History. They are kernel fields, so no
  module's history could show them and they had been silently absent.
- "Side effects over time": each reported effect in the first half of the range against the
  second, with the days and the severity in each. It carries no verdict about the direction
  and no advice about what to raise. See
  `docs/decisions/ADR-017-what-the-report-will-not-say.md`.

### Fixed

- Reports in the Family space read the adult module bag and so came out empty for every
  child. A module's slice lives under the child there, and the report engine holds the whole
  document rather than the store, so it has to route that itself.
- Opening the app in the Family space with children saved threw on the first module read,
  because nothing selected a child on load. A space with no child at all now says to add one
  rather than asking the store for a slice that cannot resolve.
- A report's audience is a space and a module's is an audience, and the engine compared them
  directly. `parent` never equals `family`, so the Family reports had no contributors.
- Adding a child appeared to work and was never written to disk. `updateFamily` changed the
  document in memory without scheduling the persist that every other writer schedules, so a
  parent could add a child, see it on the page, and find it gone on the next load.

- The report printed the stored code for "overall, compared with before you started" — a
  prescriber would have read `mi` where the monolith reads "much better".
- The thirty-day sleep fixture contained `24:50`, which is not a time. This build rejected
  it and the monolith did not, so every figure drawn from it differed between the two. Bed
  times now wrap past midnight.
- A dose block with no prescription recorded was labelled `medication ?mg` in lower case at
  the head of its own block.
- Downloading a backup from Settings never recorded that one had been taken, so the page
  said "None yet" however many were made, and the fortnightly reminder would have fired
  every time.
- History showed neither focus, mood, rebound nor appetite, and dated each line `2026-09-30`
  rather than `30 Sept, Wed`.

- Startup now unlocks encrypted documents before rendering the shell, imports
  encrypted legacy records without removing their original key, and leaves
  unreadable data in place with a retry screen.
- Medication eligibility is checked both during first run and when enabling a
  tool in Settings. Disabled tools retain their data.
- Today now exposes the existing calendar, prevents future-day selection, and
  keeps the selected logging date across tab changes.
- Stale-tab writes are rejected when another tab has changed the stored
  document, including encryption changes. Web Locks serialize writes where
  available; without them the conflict check is best-effort. Local unsaved
  changes remain available for backup.
- Tapping the selected space keeps its selection active; switching spaces
  preserves Adult records. Lock-screen headings follow the existing typography.
- Restore now applies and persists the complete merged document before confirming
  success, and keeps the confirmation visible after the shell refreshes.
- Failed writes remain visible across navigation, with a retry action that saves
  the current in-memory data. Storage-unavailable warnings survive first run.
- Automatic sleep duration updates onscreen and in storage when times change,
  including after reload. Explicit answers and legacy durations remain untouched.
  Additive `_derived` metadata records automatic values; no existing records are
  rewritten. See ADR-014.

### Migrations

| Versions     | Description                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| schema 0 → 1 | Imports a v0 monolith document from `adhd-titration-log-v1`: splits each day into `modules.medication`, `modules.sleep` and `kernel.days`, renames the sleep fields and `lastAppt`, and enables the modules it finds data for. |

### Added

- Passcode settings with an encrypted-backup prerequisite, masked inputs,
  set/change/remove actions, and Lock now. Encryption changes publish only after
  storage accepts the new document; failed changes retain the previous codec.
- Manage tools in Settings: enable/disable, ordering, and separate confirmed
  data deletion. Space selection is available after first run.
- Masked backup passphrases and an explicitly labelled unencrypted backup option
  when browser encryption is unavailable.
- Vite, TypeScript strict and Vitest scaffold, with the PWA and single-file build targets.
- The content security policy, served both as a `<meta>` tag and as real response headers from `deploy/_headers`.
- The kernel date and clock service: logging day, midnight-crossing arithmetic, `nearestPrior` carry.
- The kernel store: document, slices, debounced persist, `localStorage` and host adapters.
- The kernel migration framework and the v0 import.
- Optional passcode encryption at rest and the backup-passphrase primitives, in the envelope format the monolith already used, so a v0 document opens unchanged.
- Backup export and merge-restore: a backup carries every slice, is encrypted with a
  passphrase chosen per export, and restores by merging rather than replacing.
- The module registry, validating every manifest at registration: tier and Library entry,
  the forty-second check-in budget, reserved medication field ids outside the Adult space,
  and what a child module may contribute.
- The design system's stylesheets — tokens, base and print — ported from the reference
  implementation, with a contrast check that fails the build if a text-on-surface pair
  drops below 4.5:1.
- Every shared UI primitive in `src/kernel/ui/`: scales, chips, follow-up detail rows,
  inputs, the calendar, cards, link rows, the nag, the mirror, and the Family space's
  positive-only reward chart and parent gate.
- The shell: first run, the choice between the Adult and Family spaces, the four tabs,
  the off-tab page pattern, and settings with backup and restore.
- The Today assembler: one check-in built from whatever is turned on, with carry rules,
  follow-ups that stay hidden until wanted, and the ninety-second budget.
- The sleep module, Tier B: bed and wake times, hours filled in from them, night-quality
  chips with a follow-up on how long it took to drop off, its own history and its section
  of the clinical report.
- The medication log, Tier A supporting: the prescription carried forward, adherence,
  focus and mood, cover, side effects with severity asked only once one is ticked, its own
  history, and the "where things stand" and side-effect sections of the clinical report.
- Wins, misses and the day's note as kernel fields, filled in at the end of the check-in
  and readable by any report, so a person who logs only sleep still records them.
- The reports engine: the kernel owns the header (what the record is about, the dates, the
  coverage), the footer ("about this record", the questions for the appointment), the
  ordering of sections by weight, the print stylesheet and the plain-text export. Modules
  supply only the sections in between, and may offer the frame short phrases it cannot work
  out for itself. See `docs/decisions/ADR-012-report-frame-contributions.md`.
- The clinical report itself, reachable from Records: the range to cover, the person's own
  overall word, a list of questions that prints at the end, "I have had the appointment",
  Print, and Copy as text.
- The chart primitives — the stair chart, the day timeline and the severity grid — in the
  design system alongside the palette they draw with, so no module draws its own.
- The shared day timeline: one row per day on a 6pm-to-6pm clock, drawn by the kernel from
  every module that puts something on it. Sleep draws its band, medication draws its cover,
  its dose ticks and its rebound dots, and neither knows the other exists. A person logging
  only sleep still gets the chart. See `docs/decisions/ADR-013-shared-day-timeline.md`.
- The remaining clinical sections: dose over time with a rolling average of focus, how each
  dose performed against the person's own before-medication baseline, and the side-effect
  severity grid above the table it already had.
- Report parity against the v0 monolith: the same thirty-day dataset is read by the monolith
  running in jsdom and by this build through the v0 import, and their reports, history lines
  and text exports are compared. Every deliberate difference is named in a register in the
  test with its reason, and the register says how many are still open rather than implying
  parity that does not exist yet.
- Prettier, pinned to the house style, with `npm run check` failing on unformatted code.
  Formatting was drifting between contributors because nothing checked it.
- CI running `npm run check`, the test suites and both builds on every push.
