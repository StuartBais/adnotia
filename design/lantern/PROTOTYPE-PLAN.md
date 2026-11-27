# Plan: rebuild the benchmark prototype as Lantern with the Now capsule

This plan is for the prototype at `/bench/`. It uses `design/lantern/SPEC.md` (draft 6, final for this purpose) and `design/lantern/board.html`. Where SPEC and the code disagree, SPEC wins.

The plan merges two earlier plans, "fidelity" and "phone-feel". It corrects both against draft 6, and where they differ it takes the simpler design. Nothing in the repository was edited while writing it. I did two things in the scratchpad: downloaded the font file and measured it (section 9).

The aim is a prototype the owner can hold on an iPhone, in Safari and from the home screen, to decide how the phone apps get built: a Capacitor wrapper, React Native, or native. It stays:

- plain TypeScript and vanilla DOM, with no new npm dependency;
- under its own storage key, `adnotia-bench`;
- linked from nowhere;
- with no network request of any kind.

## Defaults taken for the owner's questions

Section 21 lists eleven questions for the owner. So the build is not held up, it goes ahead on these answers. Each one is easy to change, and the owner can overrule any of them.

1. **The font.** Bundled as a trial, with its licence beside it. ADR-047 still calls the typeface proposed.
2. **First open.** The example day loads relative to the current time. "Start empty" is in About this prototype.
3. **White places.** A Charcoal or White switch is in Settings. About explains the status-bar limit in home-screen mode.
4. **Coming back the same day.** The app restores exactly where the person was if they were away under 15 minutes, and opens on Today otherwise.
5. **A forgotten clock.** It closes as written, at the end of the estimate. With no estimate, it closes at the last moment the app was open, once the app has been in the background for 15 minutes. A switch in Settings says whether a session the app closed reads "Paused" or "Timer stopped".
6. **+5 min with no estimate.** It sets the estimate to the whole minutes worked so far plus 5.
7. **Clock format.** 24-hour, as drawn.
8. **How long.** For a timed item it sets both the slot's length and the estimate, kept equal.
9. **The pieces the spec does not draw.** Built as proposed.
10. **Running routines.** Left out of this round (chunk 8).
11. **Android.** Not this round. A manifest for `/bench/` waits until the owner says they will try it on Android.

---

## 1. Scope

### In

- **The frame** (SPEC 3): header row, dock line, drawer, hairline and tabs. It is anchored to the bottom safe area, with the compact handle below 740 pt.
- **Today** (5.1, 5.7, 5.7b, 5.7c), in every state:
  - running;
  - over the estimate;
  - no estimate;
  - paused, and paused with the estimate used up;
  - nothing running, with idle rules 1 to 3;
  - nothing planned (7b).
- **The drawer** (9.8) at lip, folded, half and open. It follows the finger, springs to rest, and has the covered last row. Hide sits at the foot.
- **Focus** (5.4): running, paused and over the estimate. It has +5 min, Set aside, the foot line, and "⌄ Today" or "⌄ Tasks".
- **Capture** (5.5) from Today, from Focus and from a place. The keyboard is up on open, the sheet rides it, and drafts are kept.
- **The Now capsule** (4) in every state in the table, shown and hidden by the table in section 4.
- **Tasks** (5.6): Inbox, Today, Coming up and Done.
- **Task pages:**
  - unlit with nothing running;
  - unlit while another runs (3a and 3b);
  - the running task's own page (8);
  - a paused task's page and a done task's page, both undrawn.
- **Sheets:** the when sheet, the "⋯" sheet (note, rename, delete with a confirm), and the note and rename sheets.
- **Routines** (5.9): the list, with "Ran today".
- **Library:** five rows, each leading to "Not in this prototype."
- **Me:** "If things are bad right now", Settings, and About this prototype.
- **The behaviours:**
  - Undo, with its six-second Next line and Focus foot;
  - the tap guard;
  - the forgotten clock;
  - the 04:00 boundary;
  - slots that pass unstarted;
  - restoring where the person was;
  - one running thing.
- **Display settings:** white or charcoal places (an owner setting); Reduce Motion first, then the animated path; Increase Contrast and Reduce Transparency through CSS media queries.
- **The font:** Instrument Sans, bundled.
- **Guards:** the no-network audit, the budget, the edge cache rule and the tests, all extended to the bench.

### Optional, last, if time allows

- **Running routines.** This means a routine's own page with Start, the routine in the lantern and the capsule, and Pause for a routine. It also includes "+ New routine". The brief puts "Tasks and Routines in full" after the benchmark, so this round can do without it.

### Out of this round

- **Outside the app:**
  - Lock Screen and Live Activity;
  - Dynamic Island;
  - Android notification;
  - Lock Screen and Control Centre capture control;
  - Action button, Quick Settings tile and widget;
  - local alerts.

  A web page cannot draw any of them. No picture page stands in for them either: the board already shows them.
- **Larger text.** This covers the `[data-ax]` layouts in SPEC 11: Pause as a circle, the capsule growing to 88, and "Inbox ⌄". It also covers Bold Text, custom accessibility actions and the Large Content Viewer. The web can follow iOS Dynamic Type only roughly, through `font: -apple-system-body`; that is a finding for the build decision, not work for this round.
- **Haptics.** iOS has no web API for them. The checkbox-switch trick is undocumented, so it is left out.
- **Medication and Family** rows in Me. They are left out, and About says so.
- **Library content, rewards beyond "List what got done today", reminders, and the celebrate acknowledgement.**
- **Offline use.** `/bench/` is not precached and stays that way.
- **What SPEC marks "not yet designed":** the left-handed dock, charcoal sheets and keyboard at night, the child's surface and the clinician's sheet.

---

## 2. What draft 6 changed that both plans got wrong

Check every item here against SPEC as you build.

1. **Hide on the open drawer is at the foot, not in the header.**
   - It sits in the folded handle's band (684–754). "⌄ Hide" is a 20 pt down chevron and "Hide" in muted 13/18 at 650, at y 715–735, with its ink ending at x 366.
   - It is one button over the whole band, named "Hide the rest of today". The left of the band is plain stone.
   - The open drawer's header row (76–120) holds only "Rest of today" (a place title) and Me.
   - As the drawer opens, "Rest of today ⌃" crossfades to "⌄ Hide" in the same place over 150 ms (SPEC 5.2, 9.8, 10).
2. **Durations are one short track, not marks or squares** (9.2).
   - Write the number, then 7 pt (6 in a 13/18 second line), then a track 4 tall with round ends.
   - The track is 1.5 pt a minute and stops at 90 pt. It is muted on light and ash on charcoal.
   - In a column of timed rows, the tracks sit in a slot as long as the longest in that list (30 pt for 20 min), left-aligned. So "10 min", "20 min" and "15 min" all end on one line at x 329.
   - Tracks appear only in the open drawer's rows, the half drawer and inbox second lines. They never appear on the when pill, the idle sentence or the Next line.
3. **The bar with no estimate grows as one length.** It is terracotta from the leading edge, with no track behind it, no tick and no end cap. Its full width is one hour, and past an hour it stays full.
4. **The Next line has a row for a slot that passed** (9.8). The rows are checked in this order; the six-second rows outrank all of them:

   | Order | Situation | Line 1 | Line 2 |
   |---|---|---|---|
   | 1 | A timed item starts within 15 minutes | "Next · in 10 min" | The time and the title |
   | 2 | A timed item's slot is under way and it has not been started | "Next · until 10:40" | "10:30 Call the dentist" |
   | 3 | The top of Anytime today holds an item whose slot passed today | "Anytime today" | The title, with no time and no mark |
   | 4 | A timed item is next | "Next · in 25 min" | The time and the title |
   | 5 | No timed item is left | "Anytime today" | The first anytime title |
   | 6 | Nothing is left | "Rest of today" | "Nothing else planned" |

   - Screen 7c therefore reads "Anytime today" over "Call the dentist". Its handle is named "Anytime today: Call the dentist. Rest of today".
   - Focus's foot follows the same rows, running or paused, with "Later today" in place of "Next". For example: "Anytime today · Call the dentist".
5. **The keyboard rule** (SPEC 3) applies to every field outside the capture sheet: "Add a step", the note, a rename, and "New routine".
   - The dock line, the drawer and the tabs stay where they are, behind the keyboard. Only the content scrolls, so the field and the line under it sit above the keys.
   - If the person then leaves, the field's text is kept as a draft for that field.
   - The note and rename sheets ride the keyboard as capture does. The frame behind them does not move.
6. **Focus counts five choices:** Step done, Pause, Capture, +5 min and the done step's disc. Paused Focus also counts five: Resume, Step done, Set aside, Capture and the disc. The fidelity plan said four.
7. **Focus layout:**
   - the context line at 166–186, 24 above the done step;
   - a hair-dark hairline at 754;
   - the foot at 776–796;
   - its Undo pill at 764–808.
8. **The lamp's centre moved:**

   | Screen | Centre |
   |---|---|
   | Today and 7c | (170, 380) |
   | 7b | (170, 390) |
   | 7 | (170, 220) |
   | Above the capture sheet | (170, 190) |
   | Focus | (190, 330) |

   The ellipse is 360 × 300. It runs from `lamp` #323634, through 66% of that lift at 38% and 22% at 72%, to charcoal at its edge.
9. **3a's when pill holds "· in 25 min" inside it.** The pill runs from x 24 to 315, with no fill and a 1 pt edge of ash at 36%.
10. **The Tasks switcher is sized to its words.** Each label gets 17.7 pt either side, measured at weight 700, so the parts are 75.6, 78.6, 114.1 and 73.7 wide. It is not 1 : 1 : 1.4 : 1.
11. **"Ran today" is an 18 pt ash check and the words in ash.** There is no sage disc.
12. **Undo after "Start this instead"** reads "Started Call the dentist" over "Write the school email at step 2". VoiceOver says "Started Call the dentist. Write the school email keeps its place at step 2."
13. **The covered row is one ramp over ring and title together.**
    - The ramp runs from nothing at the ring's top (row top + 10) to 30% stone at the ring's foot (row top + 34).
    - The edge the list goes under casts `0 −6 10 −6 rgba(34,38,36,.16)`. It sits at 606 on the open drawer and at 754 on the half drawer.
    - Nothing is masked out or faded to nothing.
14. **Capture's lane on the half drawer.**
    - Every anytime title on the half drawer wraps to end by x 286, so the title column is 222 pt wide. There is no stone fade beside the disc.
    - A wrapped row grows to 62.
15. **On white places the drawer's lift is short:** `0 −1 0 rgba(34,38,36,.08)` and `0 −1 5 rgba(34,38,36,.08)`. The 14 pt gap under the capsule stays white.

---

## 3. What exists now

These are facts read from the tree on 25 November 2026.

### The bench code

- `src/bench/app.ts` (1,045 lines) renders the whole screen with `container.replaceChildren(view())`. A `setInterval` re-renders Today and Focus every 15 s.
- It keeps a separate focus box in `domains.focus = {taskId, minutes, baseWorked}`. "Ten more minutes" changes that box, not the task's estimate.
- It holds a Wake Lock in Focus.
- `ui.ts` has `h()`, `bookmark()` and `tally()`. `bench.css` (702 lines) is the Bookmark look.
- `main.ts` builds the store on `adnotia-bench` with the plain codec. Unlike the app (`src/kernel/shell/application.ts`), it does not wrap decode in `migrateDocument`. A failed `load()` leaves a blank page.
- `tests/bench/bench.test.ts` holds 10 tests tied to Bookmark wording. Its setup is reusable: a memory store, an injected `now`, `confirm` and `mountBench`.

### The page

`bench/index.html` already has the app's CSP (`connect-src 'none'`, `font-src 'self'`) and `viewport-fit=cover`. It sets `theme-color #FFFFFF`, `color-scheme light` and the `default` status bar style, all three wrong for charcoal.

### The build

- `vite.config.ts` builds `bench/index.html` as the `bench` input in the PWA build only; the single-file build does not include it.
- `appPlumbingOnly()` strips the manifest link and the service-worker registration from `dist/bench/index.html`. It throws if it finds nothing to strip.
- The service worker's `globPatterns` include `assets/**/*.{js,css}`, which sweeps the bench's chunks into the app's precache.
- `navigateFallbackDenylist` has `/^\/bench\//`.
- `assetsInlineLimit` is 4096, so a 57 kB font is emitted as a file, not inlined. That matters, because `font-src 'self'` blocks `data:` fonts.

### Gaps in the guards

- `scripts/check-no-network.mjs` scans `src/**`, but its `REQUIRED` list names only `index.html` and `app/index.html`, so `bench/index.html` is not audited.
- `scripts/check-budget.mjs` never measures `/bench/`.
- `deploy/_headers` has no `no-cache` rule for `/bench/`, so a phone can be served a stale prototype from the edge (ADR-009).
- The font-file bans in `tests/kernel/csp.test.ts`, `styles.test.ts` and `welcome.test.ts` cover the app, `src/styles` and the welcome page only. A font under `src/bench` breaks no test.

### The model

**Tasks** (`src/domains/tasks`):

- `When` is none, anytime or timed. A timed item has `durationMinutes`.
- `Task.sessions` are `{start, stop?}`, and `Task` has an index signature.
- The functions are `capture`, `addStep`, `rename`, `setNotes`, `setEstimate`, `schedule`, `unschedule`, `reorderSteps` (children only), `startWork`, `stopWork(…, at)`, `complete`, `reopen`, `remove`, `inbox`, `forDate`, `stepsOf`, `running`, `minutesWorked` and `doneOn`.
  - `startWork` stops every other task and throws on a done one.
  - `stopWork` accepts any date, so a session can be closed in the past.
  - `complete` also stops the task's session.
  - `forDate` sorts timed items by time and returns anytime items in array order.
  - `doneOn` uses the calendar day, not the logging day.

**Routines:** `Routine.steps[].minutes?`, `RoutineRun{date, startedAt, ticked[{stepId, at}], finishedAt?}`, `startRun`, `tickStep`, `untickStep`, `finishRun`, `currentRun`, `nextStep` and `runsOn`.

**Rewards:** `resolve(settings, scope)` and `setOption` cover `doneList`, `tally` and `celebrate`, all off by default.

**Store:**

- `updateDomains(fn)` writes the domains and notifies `'domains'`.
- `DomainsState` has an index signature, so an unknown key such as `bench` survives.

### Kernel helpers

- `src/kernel/shell/crisis.ts` exports `CRISIS_LINES`, `CRISIS_STRINGS` and `CRISIS_REVIEWED` as data.
- `src/kernel/dates` has `loggingDay`, `addDays`, `toMinutes` and `fromMinutes`.
- `formatClockTime` writes "10:30am", while the board writes "10:30".

### The renders

- `design/lantern/shots/NN-*.png` are 844 × 1752. The 390 × 844 screen sits at offset (32, 32) and is 780 × 1688 px.
- The board renders were made with Playwright 1.63 from `/opt/node-tools/node_modules`, loaded through `require` in a CommonJS script. ImageMagick is installed. `google-chrome` is at `/usr/bin/google-chrome`.

---

## 4. Decisions taken: the simpler of two designs

| Question | Taken | Why |
|---|---|---|
| Where prototype-only state lives | **`domains.bench`** (one versioned object), written with `updateDomains` | One write path and one subscription. A task change and its prototype fact (set aside, passed slot) land in one write, so each undo is atomic. The bench has its own document key, so nothing reaches the app's schema |
| Old bench data | **Drop `domains.focus`** on load. A running session keeps running, because it lives on the task | Folding the focus box into the estimate is cleverer but not needed for a prototype |
| Rendering | **Persistent layers.** A layer re-renders only when its view-model's key changes, and a ticker patches live text and bar widths in place | Whole-tree replacement loses focus, scroll, the keyboard and a drag in progress |
| Whether the task's name fits on the capsule's line 2 | **CSS only.** Line 2 is one fixed-height row with `flex-wrap: wrap; overflow: hidden`. The "· name" item has `white-space: nowrap`, so it wraps, whole, out of sight when it does not fit | No measuring code, and it follows the font loading, resizing and text size by itself |
| The font file | **Google Fonts' latin subset woff2,** already variable on width and weight | No subsetting tools needed. Verified below. The latin-ext subset is left out |
| Waiting for the font | **Neither a preload nor an awaited load.** `font-display: block` | Nothing measures text, so nothing waits on it |
| The dock line | **One fixed layer** holding the slot and capture, above the drawer and Focus. The capsule ignores a tap while the list under it is moving (a scroll event within the last 150 ms) | Capture never changes element, so it never moves, and the morphs have one target. The cost is named under risks |
| Navigation | **One stack for the current tab.** Switching tabs resets it. Focus is a layer, not a page. Each level (a pushed page, Focus, a sheet, the open drawer) pushes one `history` entry, and `popstate` closes the top level | Gives Safari's edge swipe and Android back their spec behaviour (SPEC 11 "Android") without per-tab stacks |
| Coming back | **Restore exactly** (tab, stack, Focus, list choice, scroll) if away under 15 minutes. **Otherwise open on Today.** The drawer's position is kept for the logging day either way | Resolves SPEC 5.7 "restores exactly" against 7c. Owner question 4 |
| Undo after Start | **Add `discardSession(tasks, id, start)`** to `src/domains/tasks`, with its own test and commit | "As if it had never begun". Otherwise a 6-second session makes the task read as paused. The real app needs it too |
| "Top of Anytime today" for a passed slot | **A prototype-local list, `bench.passed`,** in slot order, sorted first. No model change | The real model will need top-level order (gap G3) |
| Seeding scenes | **Scenario buttons** in About this prototype | They serve both the owner and the comparison harness, and no test hook ships |
| First open | **Load the example day relative to now** | The board's day is on the phone at once. Owner question 2 |
| Settings for the owner | **Four switches:** places, "List what got done today", what a closed session is called, and motion | The rest of SPEC 14 is built as drawn |
| The comparison harness | **A Playwright script in the scratchpad,** not committed | Matches how the board renders are made, and adds no dependency |
| Bench checks after the build | **In `page.test.ts` and `check-budget.mjs`,** not `check-built.mjs` | Fewer places to change |
| The covered row | **One fixed gradient** at the list's bottom edge. At rest, the list's visible height is cut to a row boundary, so that row is the covered one | No per-row JavaScript |
| Medication, Family, Outside the app, haptics, large-text layouts, celebrate | **Out** | See scope |

---

## 5. File layout

Everything is under `src/bench/` unless named otherwise.

| File | Holds |
|---|---|
| `main.ts` | Boot: the store on `adnotia-bench` with a migrating codec (`migrateDocument` around decode, as the app does), then `migrateBench`. If load fails, one plain screen says so; its "Start again" clears only `adnotia-bench`, after a confirm. Then mount, and wire the lifecycle: `visibilitychange`, `pagehide`, `pageshow` and window `focus` |
| `app.ts` | `mountBench({store, container, now, confirm})` keeps this signature, so test setup carries over. It creates the layers, routes, handles history and back, and runs the region renderer |
| `state.ts` | **Pure** rules with an injected `now`: `present`, `timeFacts`, `nextLine`, `idleLantern`, `restOfToday`, `capsuleMode`, `drawerPositions`, `closeForgotten`, `dayBoundary`, `passSlots`, `migrateBench`. No DOM |
| `actions.ts` | Every change, each returning the next domains and an explicit inverse for undo. Enforces one running thing |
| `example.ts` | `exampleDay(now)` and the scenarios (section 7) |
| `clock.ts` | `createTicker()`: aligned `setTimeout`s, per second or per minute. Stops when hidden |
| `format.ts` | `clock24`, the long date "Tuesday 24 November" (a fixed `en-GB` formatter), the minute phrases, durations |
| `strings.ts` | Every spoken label, hint and announcement from SPEC 11, as constants, so tests can assert them |
| `ui.ts` | `h()` (kept). The icon sprite: the board's `<symbol>` set from `board.html` lines 2627–2900 (`i-*` only, not `app-mark` or the `s-*` system glyphs), injected once. Also `bar()`, `durationTrack()`, `pill()`, `ring()` and `disc()`. `bookmark()` and `tally()` are deleted |
| `drawer.ts` | Drawer positions, the drag, the spring, the covered-row edge |
| `keyboard.ts` | `visualViewport` tracking for sheets, and the field rule for everything else |
| `screens/` | `today.ts`, `focus.ts`, `capture.ts`, `tasks.ts`, `task.ts` (unlit, running, paused and done), `routines.ts`, `library.ts`, `me.ts`, `crisis.ts`, `settings.ts`, `about.ts`, `sheets.ts` (when, ⋯, note, rename, confirm) |
| `bench.css` | Rewritten: tokens, type roles, frame, components |
| `fonts/InstrumentSans-latin.woff2`, `fonts/OFL.txt`, `fonts/README.md` | The face, its licence, and where it came from |

Also:

- `bench/index.html`: page metas (section 13).
- `src/domains/tasks/index.ts`: `discardSession`, with a test in `tasks.test.ts`.
- `deploy/_headers`, `scripts/check-no-network.mjs`, `scripts/check-budget.mjs` and `vite.config.ts` (one `globIgnores` line): section 16.
- `tests/bench/*.test.ts`: section 17.

---

## 6. Data: what comes from the model, what is the prototype's, and the gaps

### From the model

| Need | From |
|---|---|
| One running task; starting one stops the rest | `startWork`, `running` |
| The time box belongs to the task | `estimateMinutes`, and `minutesWorked` across all sessions |
| Current step, "step 2 of 3", "After this", the previous done step | `stepsOf` plus `doneAt`. The current step is the first undone one by `order` |
| Step done, Done, un-tick | `complete` and `reopen`, on the step and on the task |
| +5 min | `setEstimate` |
| Closing a forgotten session at the estimate's end | `stopWork(tasks, id, pastDate)` |
| Capture to Inbox or Today | `capture`, then `schedule({kind:'anytime', date: today})` |
| Inbox order and newest end | Array order, which is capture order |
| Later today, Anytime today | `forDate(topLevel, today)`, with `bench.passed` ids sorted first in Anytime |
| A past day's item back to the inbox | `unschedule`. Keep today's `returnPastToInbox` |
| Notes, rename, delete with its steps | `setNotes`, `rename`, `remove` |
| Routines and "Ran today" | `domains.routines`, `runsOn(runs, today)` with `finishedAt` |
| "List what got done today" | `resolve(domains.rewards, {kind:'day'}).doneList` and `setOption` |

### Prototype-only state: `domains.bench`

```ts
interface BenchState {
  version: 1;
  day: IsoDate;                                         // the logging day the day-scoped fields belong to
  setAside?: { taskId: string; at: string };            // gap G1
  closedByApp?: { taskId: string; at: string };         // a session the app closed itself; cleared when that task starts
  away?: { since: string };                             // written on hide and pagehide, then flushed
  passed: string[];                                     // ids whose slot passed today, in slot order (day-scoped)
  drawer: { running: 'folded' | 'open'; idle: 'half' | 'folded' | 'open' };   // day-scoped
  ui?: { at: string; tab: Tab; stack: Page[]; focus?: { returnTo: Tab }; list: TaskList; scroll: Record<string, number> };
  drafts: { capture?: { text: string; to: 'inbox' | 'today' }; fields: Record<string, string> };
  settings: { places: 'charcoal' | 'white'; closedLabel: 'paused' | 'stopped'; motion: 'system' | 'reduced' };
}
```

Held in memory only:

- the undo slot;
- the tap guard's end time;
- the set of rows ticked since the list was opened;
- a drag in progress;
- which sheet is open.

Scroll positions are written on hide and on a page change, never on each scroll event, because every write clones the whole document.

**`migrateBench(domains)`** is pure, safe to run twice, and keeps unknown keys. It:

- removes `domains.focus`;
- adds `bench` with defaults if it is missing;
- resets the day-scoped fields when `bench.day` is not today's logging day.

### Gaps in the model, and how the prototype handles each

| Gap | Handling here |
|---|---|
| **G1. No paused or set-aside state** | Paused is derived (section 7). "Set aside" is `bench.setAside`. The real app needs a field or a session flag |
| **G2. No way to take back a session** | Add `discardSession`. Undo after Start and after Start this instead uses it |
| **G3. No order for top-level tasks** | `bench.passed` sorts passed items first. "The person's own order" is capture order. The real app needs a top-level reorder |
| **G4. A slot passing is not a model concept** | `passSlots` computes it, then applies `schedule(anytime, today)` and adds the id to `bench.passed` |
| **G5. "The last moment the app was open" is not recorded** | `bench.away.since` |
| **G6. A timed item has two lengths,** `durationMinutes` and `estimateMinutes` | The when pill and the timed rows show the slot's length. The bar uses the estimate, falling back to the slot's length. The when sheet's "How long" sets both for a timed item and the estimate for anything else. Owner question 8 |
| **G7. Routine runs have no timing and no pause** | Only if the optional routines chunk is built. A step's minutes count from the later of `startedAt` and the last tick. Pause for a routine is owner question 10 |
| **G8. One running thing across tasks and routines** | Enforced in `actions.ts`, if routines run |
| **G9. `inbox()` returns steps too** | Filter to top-level tasks, as now |
| **G10. `doneOn` uses the calendar day** | Use `loggingDay(new Date(doneAt))` in the bench. The fix belongs in the model, later |
| **G11. Undrawn lists** | Tasks › Coming up is grouped by date under muted day labels. Tasks › Done is newest first, each row a sage disc that un-ticks. No counts in either |
| **G12. Undrawn task pages** | An unlit page shows its steps as plain text on the rail, with no Now and nothing to tap, which keeps 3a at five choices. A paused page is page 8 with the paused bar, white minutes and no end time. A done page has a sage "Done" line and a quiet "Not done after all" pill |

---

## 7. The rules, as pure functions in `state.ts`

All are table-tested in `tests/bench/state.test.ts` against the spec's scenes:

| Scene | Time |
|---|---|
| Screens 1 to 6, 8 and 9 | Tuesday 24 November 2026, 10:05 |
| Screen 7 | 9:58 |
| Screen 7c | 13:20 |
| Screen 7b | Monday 14 December, 9:12 |

### `present(domains, bench, now)`

Returns running, paused or none.

- **Running** is `running(tasks)`.
- **Paused** applies when nothing is running. It is the top-level, not-done task whose latest `stop` falls on today's logging day. If `bench.setAside` names that task at or after that stop, nothing is paused.
- Paused ends by itself at 04:00, when "today" moves, and when anything else starts.

### `timeFacts(task, now)`

| Fact | How it is worked out |
|---|---|
| `worked` | `minutesWorked(task, now)` |
| `estimate` | `estimateMinutes`, else a timed item's `durationMinutes`, else none |
| Minutes left | `ceil(estimate − worked)`, so it never reads "0 min left" |
| Minutes so far | `floor(worked)` |
| Used up | `worked ≥ estimate` |
| `endsAt` | The open session's start plus `(estimate − worked before this session)`. It is fixed for the session, so it never jitters |
| The bar's fill | `left / estimate` |
| The bar with no estimate | `worked / 60`, capped at 1 |

### `nextLine(state, now, undo)`

- The six-second rows come first (SPEC 9.8):

  | After | Line 1 | Line 2 |
  |---|---|---|
  | Step done or Done | "Step done" | The step |
  | A tick | "Done" | The title |
  | Start | "Started" | The title |
  | Start this instead | "Started X" | "Y at step N" |
  | Save | "Saved to the inbox" | The text |
  | Resume | "Resumed" | "Y, step N" |
  | Set aside | "Set aside" | The title |

- Then the six ordered rows in section 2, item 4.
- If nothing is left but something today was running, paused or done, it reads "Rest of today" over "Nothing else planned".
- If nothing is running or paused and nothing has today's date, it returns `lip`.
- The present task is in no list. The Next line names the true next item, even on that item's own page.
- `focusFoot()` uses the same rows, joined on one line with "·", with "Later today" in place of "Next".

### `idleLantern(state, now)`

Rules 1 to 4 of SPEC 5.7.

1. **A timed item starts within 15 minutes, or its slot is under way.**
   - Within 15 minutes: "Nothing running · starts at 10:30, in 5 min", then "Next booked", then the title, then Start.
   - Under way (undrawn; a proposal): "Nothing running · until 10:40", then "Booked now", then the title, then Start.
2. **Otherwise, the first item in Anytime today.** Its sentence reads "3 steps · 25 min · would end about 10:23".
3. **Anytime today is empty but timed items remain:** "Free until 14:00", then "Ring the bank at 14:00", with no Start.
4. **Nothing has today's date:** screen 7b.

The status line adds "· free until HH:MM" from the next timed start, or nothing if there is none.

### `restOfToday(state, now)`

- **Later today:** timed items sorted by time.
- **Anytime today:** passed items first, then the rest in their order.
- **Done today:** only with `doneList` on.
- Only the next timed row carries its "in N min" line, and only on the open drawer, not the half drawer.

### `capsuleMode(view, present, drawer, sheet)`

Returns `button`, `picture` or `hidden`, following the SPEC 4 table.

| Situation | Capsule |
|---|---|
| Nothing running or paused | hidden |
| Today with the drawer at its lip, folded or half | hidden |
| Focus | hidden |
| The present task's own page | hidden |
| The crisis page | hidden |
| Capture opened from Today or Focus | hidden |
| Tasks, Routines, Library, Me and their pushed pages | button |
| Any other task's page | button |
| The open drawer over any tab | button |
| A sheet raised from a place | picture: `aria-hidden`, `inert` and `tabindex=-1` |

It is lifted on charcoal places, and plain charcoal on white places and on the stone drawer.

### `drawerPositions(state, largeText = false)`

| Situation | Allowed positions |
|---|---|
| Running or paused | folded, open |
| Idle | half, folded, open |
| 7b | lip only |

The default is folded while running or paused, half when idle, and lip on 7b. `bench.drawer` keeps the person's choice for the logging day, separately for running and idle.

### `closeForgotten(state, now)`

It runs on boot, on becoming visible, on `pageshow` and on window `focus`.

- **With an estimate:** a task is running, `away.since` is set, and `now − max(since, estimateEnd) > 15 min`. Then:
  - call `stopWork(tasks, id, estimateEnd)`;
  - set `bench.closedByApp`;
  - the app opens on 7c in its used-up form.
- **With no estimate:** after 15 minutes away, close at `since`. That is the literal reading of SPEC 4; owner question 5.
- If iOS killed the page before `away` was written, nothing is closed.
- Nothing ever shows the time away.

### `dayBoundary(state, now)`

It runs when `loggingDay(now)` is later than `bench.day`.

- A past-dated item goes back to the inbox.
- A session still open from before the boundary is closed at its estimate's end, or at `away.since` (else at the boundary) when there is no estimate.
- `setAside`, `closedByApp`, `passed`, `drawer` and `ui` are reset, and `bench.day` is set to today.
- Paused goes, because it is derived.
- Nothing is announced.

### `passSlots(state, now)`

For each timed item today that is not done and not present, whose `time + durationMinutes ≤ now` and which has no session started today:

- call `schedule(anytime, today)`;
- append its id to `bench.passed`.

Items are taken in slot order, the earlier first.

### Format rules (`format.ts`)

- **Clock:** 24-hour as drawn ("10:30", "14:00", "ends 10:23"), with hours under 10 written "9:58". Owner question 7.
- **Lengths of an hour or more:** "1 h 20 min" and "in 1 h 20 min". These are undrawn; a proposal.
- **Never** "0 min left", and never seconds inside the app.

---

## 8. The frame

### Layers

They are created once, in this stacking order from the bottom:

```
#bench.app [data-ground=present|place|stone] [data-places=charcoal|white] [data-drawer=lip|folded|half|open]
           [data-compact] [data-motion=full|reduced]
  .screen        the current page: Today's canvas, or a place or page with its own scroller (.body)
  .fade          24 pt fade, white or charcoal, under the dock line on places while a capsule shows
  .drawer-shade  the drawer's rounded-top shadow as its own layer with no fill, above the fade (SPEC 5.3)
  .drawer        one stone sheet moved by translateY: handle, list, and the open state's header row and cover band
  .tabs          four tabs on stone, fixed
  .focus         the Focus layer: full screen, its own header, content, hairline and foot
  .dock          the dock line: slot (capsule | Step done + Pause/Resume | "⌃ Focus") + the capture disc
  .sheet         sheets
  .live          aria-live="polite"
```

### Rendering

- Each layer renders from its own view-model, and replaces its children only when that view-model's key (a cheap string) changes.
- Several writes in one action coalesce into one render per animation frame.
- The ticker never re-renders. It patches registered live nodes: the bar's `--p`, the minute text, and the capsule's and lit block's spoken labels.
- Scrollers carry `data-scroll-key`, and their `scrollTop` is restored after a render.
- Focus is restored by element id.

### Geometry

Every row of SPEC 3 is computed from the safe areas. On a 390 × 844 screen with insets of 54 and 34, these land exactly on the board.

```css
:root{
  --sa-top: max(env(safe-area-inset-top, 0px), 20px);
  --sa-bot: env(safe-area-inset-bottom, 0px);
  --tabs-b: max(calc(var(--sa-bot) - 2px), 12px);   /* tabs end 32 above the bottom: y 812 */
  --handle: 70px;                                    /* 52px when compact */
  /* bottom offsets */
  --hair-b:   calc(var(--tabs-b) + 58px);            /* hairline, y 754 */
  --fold-b:   calc(var(--hair-b) + var(--handle));   /* folded drawer top, y 684 */
  --dock-b:   calc(var(--fold-b) + 14px);            /* dock line 606–670 */
  --lit-b:    calc(var(--dock-b) + 64px + 56px);     /* lit block bottom, y 550 */
  --lip-b:    calc(var(--tabs-b) + 82px);            /* lip, y 730 */
  /* top offsets */
  --hdr-t:    calc(var(--sa-top) + 4px);             /* header row 58–102 */
  --open-t:   calc(var(--sa-top) + 6px);             /* open drawer top, y 60 */
}
@media (max-height: 739px){ :root{ --handle: 52px } }   /* compact: the one-line handle */
```

- **Width.**
  - Content runs from x 24 to `100vw − 24`. Everything ends on that one right edge.
  - The capsule runs from 24 to `100vw − 98`. Capture is 64 wide with its right edge 24 from the screen's.
  - Above 500 px wide, the app sits in a centred 430 px column, for desktop review.
- **The half drawer's top** is measured after render: Start's bottom + 16, or the unlit block's bottom + 16 under rule 3. It is never less than `--sa-top + 312`, which is y 366 on the board.
- **Compact heights.** The handle is one 52 pt line: "Next 10:30 Call the dentist · in 25 min ⌃". The grabber sits in its top 6 pt, and the spoken label is unchanged.
- **The root.** `#bench` is `position: fixed; inset: 0; overflow: hidden`. `html` and `body` get `overscroll-behavior: none` and a charcoal background. Every scroller gets `overflow-y: auto; overscroll-behavior: contain`, keeping native momentum. Every list ends with 96 pt of bottom padding. Use `100dvh` or `inset: 0`, never `100vh`.

### Navigation and back

| Level | What it is | What back does |
|---|---|---|
| The tab | Today, Tasks, Routines, Library | — |
| The stack | Pages pushed on the current tab: a task, Me, crisis, Settings, About, a Library topic | Goes back one page |
| Focus | A layer with `returnTo` | Closes Focus, like "⌄ Today" |
| A sheet | Capture, when, ⋯, note, rename, confirm | Closes it and keeps the text |
| The open drawer | — | Folds it |

- Each level pushes one `history` entry. `popstate` closes the top level, so Safari's edge swipe and Android back follow SPEC 11 "Android".
- Switching tabs clears the stack.
- Opening the drawer never changes the current tab.
- Me is pushed on the current tab, and that tab stays current.
- "⌄ Today" names the tab Focus returns to: "⌄ Tasks" when Focus was opened from the capsule on Tasks or a page under it.

---

## 9. Tokens, type and the font

### Tokens

Copy the board's `:root` (`board.html` line 21 onward) and add `--lamp: #323634`. Leave out its board-only colours.

| Token | Value |
|---|---|
| charcoal | #222624 |
| white | #FFFFFF |
| ash | #A9AFAB |
| terracotta | #F28C5E |
| stone | #EEF0EC |
| sage | #DFE9E0 |
| muted | #595C5B |
| ash-20 | #3D413F |
| ash-30 | #4B4F4D |
| ash-8 | #2D312F |
| ash-15 | #363B38 |
| ash-edge | #737875 |
| tint-stone | #DEE0DC |
| tint-white | #EDEEED |
| hair-dark | rgba(169,175,171,.16) |
| hair-light | rgba(34,38,36,.10) |

**Shadows,** exactly as SPEC 7 lists them:

- the drawer, in its dark and short light forms;
- the cover;
- the capsule on light, and lifted;
- the capture disc on charcoal and on light, with its 15% hairline;
- the current tab and the quiet pill (`0 1 3`);
- the light thumb (iOS's own) and the dark thumb;
- sheets;
- the one halo, on the tick of a lantern-size bar.

Every shadow on the dock line ends inside the 14 pt gap.

**Fades:**

- On places while a capsule shows: white or charcoal, from 0 at 582 to 0.94 at 606, and 0.94 down to the drawer.
- None on the open or half drawer.

**The falloff** is a `::before` behind the lantern block or Focus's step block. It uses the radial gradient in section 2, item 8, at the per-screen centre given there. It never moves, and it is never on places, task pages, the running task's page or sheets.

**White places.** `[data-places=white]` swaps:

- the place ground to white;
- pills to tint-white;
- the capsule to charcoal with its light-ground shadows;
- the fade to white;
- the drawer's lift to the short one.

**Media queries:**

- `prefers-contrast: more`: hairlines go to 25%, the lifted capsule's edge goes to ash at 80%, and ash-20 pills gain a 1 pt ash outline.
- `prefers-reduced-transparency`: fades become solid bands.

There is no red anywhere, and no colour means "late".

### Type

One class per row of the SPEC 8 table, with the exact size, line height, weight and tracking:

| Role | Size/line | Weight | Tracking |
|---|---|---|---|
| Step in Focus | 44/50 | 700 | −0.026em |
| Step | 40/46 | 700 | −0.024em |
| Idle sentence and page title | 32/38 | 700 | −0.022em |
| Place title | 28/34 | 700 | −0.02em |
| Minutes in Focus | 24/30 | 600 | |
| Minutes | 22/28 | 600 | |
| Heading | 22/28 | 700 | |
| Field | 22/28 | 500 | |
| Context | 20/26 | 600 | |
| Control | 17/22 | 600 | |
| Sheet title | 17/22 | 650 | |
| Row | 17/22 | 500 | |
| Meta | 15/20 | 500 | |
| Meta strong | 15/20 | 600–650 | |
| Label | 13/18 | 650 | +0.01em |
| Tab | 12/16 | 600, 700 when current | |

- Set `font-variant-numeric: tabular-nums` on the body, and `font-synthesis: none`.
- The width axis is used twice: the capsule's task name at `font-stretch: 95%`, and "Paused" at `90%`.
- Nothing goes below 12 pt or below weight 400.

### The font

- **Source.** Google Fonts' Instrument Sans v4 latin subset, a variable woff2 with `wdth` 75–100 and `wght` 400–700. It is downloaded once, outside the build.

  ```
  curl -o InstrumentSans-latin.woff2 https://fonts.gstatic.com/s/instrumentsans/v4/pxicypc9vsFDm051Uf6KVwgkfoSbT2lBgGygpg.woff2
  curl -o OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/OFL.txt
  ```

  Put each download in a new empty folder. In the scratchpad, `fontdl/latin.woff2` is the same file. Of the licence copies there, use `fontprobe/OFL2.txt`, not `OFL.txt`, which is a 404 page.
- **Checked 25 November 2026,** in Chromium, by the probe in `scratchpad/planprobe2/`:
  - size 57,100 bytes; sha256 `19f8ec3200550a11859c7e52d7378354bf71bc6dd0441fdde79b9a660513f5e4`;
  - the width axis works: "Write the school email" at 500/15 is 155.8 pt at width 100 and 147.0 at width 95, as SPEC 4 says;
  - "Paused" at 650/15 and width 90 is 46.7 pt, inside the 54 pt column;
  - tabular figures exist: "1111" and "0000" are both 40.8 pt, against 26.2 proportional;
  - "Write the question" at 700/40 and −0.024em is 338.3 pt, so it fits Today's 342 on one line;
  - "Write the school email at step 2" at 600/17 is 249.1 pt, inside the 252 pt beside Undo.
- **Licence.** The copyright line names no Reserved Font Name, so the file keeps its name. `OFL.txt` sits beside it. `fonts/README.md` records the URL, the date, the sha256, the unicode range, these measurements and how to refresh the file. The About page credits the face and its licence.
- **CSS.** One `@font-face`:

  ```css
  @font-face{font-family:"Instrument Sans";src:url("./fonts/InstrumentSans-latin.woff2") format("woff2");
    font-weight:400 700;font-stretch:75% 100%;font-style:normal;font-display:block}
  ```

  The family falls back to `-apple-system, system-ui, sans-serif`. Characters outside latin (Ł, ő) fall back to the system face; that is accepted.
- **The build.** Vite hashes the file into `dist/assets/`, because 57 kB is over the 4,096 inline limit. A woff2 gains nothing from gzip, so it is budgeted as served.

---

## 10. Components (SPEC 9)

### The lantern

- A wrapper holds one `button.lit-block`. Inside it, in order: the Now line (with "Focus ›" as ash words at its right on Today), the task title, the step, the bar, the minutes and the note.
- The visible spans are `aria-hidden`. The button carries SPEC 11's label, and its hint is in an `aria-describedby` span.
- On Today it is bottom-aligned to `--lit-b` and grows upward.
- When paused, "Set aside" is a separate 44 pt `button`, positioned at the right of the minutes row and outside the block's button.

### The bar

`bar({size, state, p})`:

**Sizes:**

| Where | Size | Form |
|---|---|---|
| Focus | full width × 12, square ends | Tick and halo, no cap |
| Today | 342 × 10 | Tick 2 × 18, halo, cap 2 × 14 |
| The running task's page | 132 × 8 | Tick 2 × 16, halo, cap 2 × 12 |
| The capsule | 238 × 4 | Cap 2 × 8, no tick |

**States:**

| State | How it looks |
|---|---|
| burn | Terracotta fill on the ash-30 track |
| paused | Ash fill on the ash-30 track; the tick and halo go, the cap stays |
| over | A 1 pt ash outline only |
| count-up | A terracotta length with no track, no tick and no cap; full width is one hour |

The fill width is `calc(var(--p) * 100%)`. The ticker sets `--p` once a second, or once a minute under Reduce Motion.

### Duration tracks

`durationTrack(min, slot?)` draws the number, then the 7 (or 6) pt gap, then the track: 4 tall, radius 2, `min(min × 1.5, 90)` long. In timed columns the track sits in a slot of the list's longest track.

### The capsule

- A `button`, 64 tall with a radius of 32, with padding 16 on the left and 14 on the right.
- **Line 1:** a 54 pt first column holding the 7 pt dot and "Now", or "Paused" in ash at width 90. Then the step at 17/22 and 600, cut with an ellipsis.
- **The bar:** 238 × 4.
- **Line 2:** the minutes (terracotta while running, white while paused), then "· name" at width 95 in ash, which wraps out of sight whole when it does not fit (section 4).
- Every row of the SPEC 4 state table applies:
  - running;
  - used up ("27 min so far", the outline, the name gives way);
  - no estimate ("7 min so far" and the growing length);
  - paused;
  - paused and used up ("estimate 25" in white);
  - a task with no steps (the title on line 1, the minutes only on line 2).
- The label is exactly SPEC 4's, with the hint "Opens focus."
- No drag, no long press, and `-webkit-touch-callout: none`.
- It ignores a tap within 150 ms of a scroll event on the active scroller.

### The capture disc

- 64 pt, terracotta, with a 28 pt charcoal plus at a 2.25 stroke.
- On light grounds it has its light shadow and a 15% charcoal inner hairline; on charcoal, the dark shadow.
- Name "Capture", hint "Write something down. It goes to the inbox."
- With a draft kept: a 12 pt white dot with a 2 pt charcoal ring, and the name "Capture, draft kept".

### Pills

| Kind | Height |
|---|---|
| On the dock line: Step done, Pause, Resume, "⌃ Focus" | 64 |
| Start, Start this instead, Open the inbox | 56, with padding 18 and 22 |
| Header pills, +5 min, Set aside, Save, Undo | 44 |

- Glyph and word are centred by their ink: Step done takes +2 on its right, Pause +4 and Resume +6.
- The variants follow the SPEC 9.5 table.
- Delete is a muted text button with a confirm sheet.

### Switches

- **The Tasks switcher** is a `tablist` of `tab`s with `aria-selected`, so it reads "Inbox, selected, 1 of 4". Parts are sized to their words with equal padding, as in section 2, item 10.
- **Capture's Inbox or Today** is a `radiogroup` with two equal parts.
- **Light and dark thumbs** follow SPEC 9.6. There are no outlines.

### Rows

- 11 above and below the text: 44 for one line, 62 for two.
- **Ring rows:** a 24 pt ring in a 44 pt `button` named "Mark done: …". The row itself is a separate `button` that opens the task.
- **A ticked row** stays in place as a sage disc button, "Undo done: …", until the list is next opened.
- **Timed rows:** a 60 pt time column at 650, the title from x 84, and the duration track at the right.
- **Routine rows:** no ring, a chevron, and "Ran today" with an ash check.
- **The covered-row edge** is one fixed gradient element at the list's bottom edge (section 2, item 13). At rest, the list viewport's height is cut to the last whole row boundary, measured after render, so that row is the covered one. Rows that pass under it while scrolling are simply cut by the edge.

### The drawer

- Lip, folded, half and open are values of `translateY` on one tall stone sheet.
- The handle is one `button` the full width of the drawer's top, with contents by position:

  | Position | Handle |
  |---|---|
  | Folded | The two Next lines at the left; "Rest of today ⌃" at the right, centred across both lines |
  | Half | "Rest of today" in charcoal 17/22 at 600, and the up chevron |
  | Open | Plain stone at the left; "⌄ Hide" at the right, in the folded handle's place |
  | Lip | No handle: `inert` and not in the reading order |

- While Undo shows, "Rest of today ⌃" is hidden and the Undo pill takes the right.
- **The open drawer's own header row** (76–120) holds "Rest of today" as a place title and a tint-stone Me.

### Sheets

- Stone, with a 24 radius on the top corners and a grabber. The title is in charcoal 17/22 at 650, and "Close" is a muted text button.
- A sheet is modal: everything behind it gets `inert`, except Me above the capture sheet.
- Close, a swipe down, a tap outside and back all keep the text.

### Header, tabs and icons

- **Header:** Me is 52 × 44 and ends at x 366. "⋯" is a 44 pt circle.
- **Tabs:** four equal 52 pt lozenges. The current one is a white lozenge with the filled glyph, a 700 label and `aria-current="page"`. There are never badges.
- **Icons** come from the sprite. A lone icon gets a spoken name; an icon beside a word is `aria-hidden`. The app mark is never used inside the app.

---

## 11. The screens and their states

Each screen gets its own `describe` in `screens.test.ts`, checking structure, exact visible strings, the capsule's mode, the choice count and the reading order.

**Choice counts** (SPEC 3): the frame is not counted (tabs, Me, back, "⋯" and the handle). A list counts once.

| Screen | Choices |
|---|---|
| 1 | 4 |
| 2 | 3 |
| 3a and 3b | 5 |
| 4 | 5 |
| 5 | 4 |
| 6 | 4 |
| 7 | 4 |
| 7b | 2 |
| 7c | 5 |
| 8 | 4 |
| 9 | 4 |
| Paused Focus | 5 |
| An unlit task page with nothing running | 4 |

### 1. Today, running (SPEC 5.1)

- **Header:** the date "Tuesday 24 November" in ash, and Me in ash-20.
- **The lantern**, at the geometry in SPEC 5.1 (322–550):
  - the Now line: the dot, "Now", "· step 2 of 3", and "Focus ›";
  - the title at 20/26;
  - the step at 40/46;
  - the bar;
  - "18 min left" in terracotta, then "of 25 · ends 10:23";
  - the note line.
- **The step** is the first undone step, or the task's title when it has no steps.
- **Dock:** Step done (x 24–162; it reads "Done" on the last step or for a task with no steps), Pause (172–292) and capture.
- **Drawer:** folded, with the Next line.
- **Over the estimate:** the outline, "27 min so far" in terracotta and "estimate 25" in ash, with no end time.
- **No estimate:** the growing length and "7 min so far".

### 7c. Paused (SPEC 5.7c)

- **The block** runs 308–550:
  - a pause glyph and "Paused" in white, "· step 2 of 3", and "Focus ›";
  - the bar frozen in ash;
  - "18 min left" in white and "of 25", with no end time;
  - "Set aside", a separate 44 pt pill at the right of the minutes row;
  - the note.
- **Dock:** Step done in ash-20, "▶ Resume" in white in Pause's place, and capture.
- **Next line:** "Anytime today" over "Call the dentist".
- **Used up:** the outline, and "estimate 25" in white.
- **The label** depends on Settings: "Paused" by default, or "Timer stopped · step 2 of 3" when the session was closed by the app (`closedByApp`) and the setting says so.

### 7. Nothing running (SPEC 5.7)

- **Status line:** "Nothing running" in white at 17/22 and 650, then "· free until 10:30".
- **The unlit block** is a button that opens the task's page:
  - "First on today's list";
  - the idle sentence at 32/38;
  - "Starts with: Find the school address";
  - "3 steps · 25 min · would end about 10:23".
- **Start:** a white 56 pt pill.
- **The half drawer:**
  - the handle "Rest of today ⌃";
  - Later today, with no "in" line;
  - Anytime today, with titles wrapping by x 286, ending on a covered row at 754.
- **Dock:** capture alone. The only terracotta on screen is the disc.
- **Rules 1 and 3** are rendered from `idleLantern`.

### 7b. Nothing planned (SPEC 5.7b)

- **The block**, bottom-aligned at 550: "Nothing planned for today" (32/38, two lines), "Anything without a date is in the inbox.", and "Open the inbox" (hint "Opens at the newest items.").
- **The drawer** is at its lip: no grabber, no words, `inert`.
- **Dock:** capture alone.
- "Open the inbox" goes to Tasks › Inbox, scrolled to its newest end.

### 2. The rest of today: the open drawer (SPEC 5.2)

- Charcoal from 0 to 60, then the drawer from 60, with the grabber at 66–71.
- **Header row (76–120):** "Rest of today" and a tint-stone Me.
- **Later today:** timed rows. Only the next one carries "in 25 min". The duration tracks share a 30 pt slot.
- **Anytime today:** ring rows.
- **The list** ends on a covered row at 606. Below it, the cover band holds the capsule and capture on the dock line, then "⌄ Hide" at the foot (section 2, item 1).
- **Focus lands** on the "Rest of today" heading.
- A row opens its task, and a ring ticks it.
- "Done today" (rows not tappable) appears only with `doneList` on.

### 3a and 3b. A task opened while another runs (SPEC 5.3)

- **Header:** "‹ Today", "⋯" and Me.
- **Title** at 32/38 (122–160).
- **The when pill** (176–220, x 24–315): a field with an edge holding the calendar glyph, "Today, 10:30", "· 10 min" and "· in 25 min". A tap opens the when sheet.
- **"Start this instead"** (240–296):
  - ash-20 on charcoal;
  - on white, the quiet pill: #DEE0DC, a 10% edge and the 0 1 3 lift.

  Under it: "Starting this stops the timer on Write the school email. It keeps its place at step 2."
- **Steps:** the label "Steps", then "+ Add a step". That control turns in place into a one-line field: Enter adds a step and keeps the field open, and blur ends it. The keyboard follows the field rule.
- **Dock:** the capsule over the fade, and capture.
- **Drawer:** folded, naming the true next item, even this one. Its shadow layer sits above the fade.
- **White:** a white ground, tint-white header pills, a stone when pill with a hair-light edge, a charcoal capsule, a white fade and the short drawer lift.
- **"Start this instead"** runs `startWork(new)`, which stops the old task. The page lights as page 8 (on white over 300 ms, or 150 ms reduced). The announcement and Undo are as in section 2, item 12.
- **With nothing running,** the button reads "Start": white on charcoal, charcoal on white. There is no sentence.
- **With another task paused,** the button also reads "Start", with no sentence. The paused capsule goes when this one starts.

### 8. The running task's own page (SPEC 5.8)

- **Header:** "‹ Today", "⋯" and Me.
- **Title** at 32/38.
- **The meta line,** set inline so each "·" keeps its word spaces: "Today · 25 min estimate · 7 min so far".
- **The bar row:** the 132 × 8 bar, "18 min left" and "ends 10:23".
- **The step rail** (rows 58 tall from 244):
  - a 2 pt hair-dark line at x 37;
  - 28 pt discs, each with the 5 pt charcoal ring;
  - a done step's disc is a button, "Undo step done: …";
  - the current step is a white disc with its number, the step at 22/28 and 600, then "● Now";
  - steps to come are charcoal discs with an ash ring.
- **The note** is an ash-8 field button that opens the note sheet.
- **Dock:** a white "⌃ Focus" pill (24–292) and capture. No capsule.
- **Reached** from "Start" or "Start this instead" on its page, and from its row in Tasks › Today, where it carries the Now tag.

### 4. Focus (SPEC 5.4)

- **A layer** over everything but the dock and sheets. No tabs and no drawer.
- **Header:** "⌄ Today" (named "Back to Today", hint "The timer keeps running.") and Me.
- **Content,** at the geometry in section 2, item 7:
  - the context line, "Focus · Write the school email · step 2 of 3";
  - the done step's disc button and the step in ash;
  - the step, an `h1` at 44/50 with `tabindex=-1`;
  - "After this: …";
  - the bar, edge to edge;
  - the minutes, stacked, with "+5 min" right-aligned on the same row;
  - the note;
  - the hairline at 754;
  - the foot line (section 7). For six seconds after an undoable tap it shows that tap's words and an Undo pill.
- **"+5 min"** sets the estimate to `max(estimate, floor(worked)) + 5`. With no estimate it sets `floor(worked) + 5` (owner question 6).
- **Paused Focus:** the bar frozen, the minutes white, "Set aside" in +5 min's place, Resume in Pause's place, and Step done in ash-20.
- **The screen stays awake:** a Wake Lock is held while running, released on hide and taken again on show. This is the existing code.

### 5. Capture (SPEC 5.5)

- **Opening.** The disc's click handler opens the sheet and focuses the field in the same synchronous call. iOS raises the keyboard only then.
- **The sheet** (from 280):
  - the grabber;
  - "Capture" and "Close";
  - a white field (344–400), an `input` with no wrapping `form` and `enterkeyhint="enter"`; the placeholder is "What's on your mind?";
  - the helper line, "Goes to the inbox with no date. Plan it later if you like." or "Goes on today's list, anytime.";
  - the row on the keyboard: Inbox or Today (x 24–200) and Save (x 270–366, terracotta with charcoal text).
- **Riding the keyboard.** The sheet's bottom is `var(--kb)`, which `keyboard.ts` sets to `innerHeight − (visualViewport.height + visualViewport.offsetTop)` on the viewport's `resize` and `scroll` events.
- **Above the sheet,** from Today: the lantern without the note or "Focus ›". The Now line has the task joined ("● Now · step 2 of 3 · Write the school email"), the step at 40, the bar and the minutes, at 112–256, with the lamp at (170, 190).
  - From Focus: the context line, the step at 40, the edge-to-edge bar and the minutes.
  - When it does not fit (an SE height), the capsule rides the sheet's edge as a picture.
- **From a place,** the capsule rides the sheet's top edge as a picture.
- **Me above the sheet stays live.** It closes the sheet, keeps the draft and opens Me (hint "Keeps your draft.").
- **Save, or the return key:**
  1. `capture`, then `schedule` to today if Today was chosen;
  2. the sheet drops;
  3. announce "Saved to inbox";
  4. focus goes to the step on Today or in Focus, or to the disc on a place;
  5. the Next line, or Focus's foot, shows "Saved to the inbox" over the text, with Undo.
- **Undo** removes the item and reopens the sheet with the text.
- **Leaving** by Close, a swipe down, a tap above, Me or back keeps the draft (persisted) and shows the draft dot.
- **On Tasks,** Save leaves the inbox's scroll where it was.

### 6a and 6b. Tasks (SPEC 5.6)

- **Header:** "Tasks" as a place title, and Me.
- **The switcher** (114–158): Inbox, Today, Coming up, Done.
- **Inbox:**
  - the helper line "Anything with no date waits here.";
  - top-level, not-done tasks with no date, in capture order;
  - second lines "2 steps", "3 steps · 30 min" plus track, "15 min" plus track, or a 12 pt note glyph and the start of the note;
  - it always opens scrolled to its newest end.
- **Today:** the drawer's list and metric, with the present task carrying the Now tag (a charcoal pill on white; a terracotta dot and "Now" on charcoal), plus "Done" for done today.
- **Coming up** and **Done:** gap G11.
- **Dock:** the capsule over the fade, and capture.
- **Drawer:** folded, with its shadow above the fade.
- **White (6b):** a stone track with a white thumb, charcoal titles and rings, muted second lines, a white fade and a charcoal capsule.
- **Never shown:** counts, badges, swipe actions, or how long an item waited.

### 9. Routines (SPEC 5.9)

- **Header:** "Routines", and Me.
- **The helper line:** "Open a routine to start it."
- **Four rows,** 62 tall from 142: the title, "N steps", "Ran today" with an ash check (only for a run finished on today's logging day), and a chevron.
- **"+ New routine"** (398–442).
- **Dock:** the capsule and capture.
- **Without the optional chunk:**
  - a row opens a routine page with its name, its steps (with minutes where set) and the muted line "Running a routine is not in this prototype.";
  - "+ New routine" opens a page saying the same.

### Library, Me and the pages under Me

- **Library:** "Library", and five rows (Sleep, Exercise, Mindfulness, Thinking tools, How we know), each a name over one muted line. Each opens a page saying "Not in this prototype." The capsule shows.
- **Me:** "Me", and three rows:
  1. **"If things are bad right now".** It renders `CRISIS_LINES`, `CRISIS_STRINGS` and `CRISIS_REVIEWED` in the Lantern style. It has no capsule and no timer of any kind, and capture stays. It is two taps from anywhere.
  2. **"Settings":**
     - Places: Charcoal or White;
     - List what got done today: off or on, the real `doneList`;
     - A session the app closed reads: Paused or Timer stopped;
     - Motion: As the phone or Reduced.
  3. **"About this prototype":**
     - what it is;
     - that data stays in this browser, unencrypted, and that a home-screen copy keeps its data apart from Safari's;
     - how to add it to the home screen;
     - what to try on the phone (section 13);
     - the font credit and licence;
     - under a "Prototype" heading, the scenario buttons (below) and "Delete everything", with a confirm.

### The when sheet and the ⋯ sheet

- **The when sheet** has large option rows:
  - "No date (inbox)";
  - "Today, anytime";
  - "Today at a time", which reveals a native `type=time` input;
  - "Tomorrow";
  - "Pick a day", which reveals a native `type=date` input.

  Then "How long" with −5 and +5, then "Done". The choices call `schedule` and `unschedule`; "How long" works as in G6.
- **The ⋯ sheet** offers "Add a note" (or "Edit the note"), "Rename" and "Delete". Delete opens a confirm sheet, then runs `remove`, which takes the task's steps with it.

### The example day and scenarios (`example.ts`)

**`exampleDay(now)`** builds the board's day on the real models.

**Running:** "Write the school email", anytime today, estimate 25, with the note "When is the permission slip due?". Its steps:

1. "Find the school address", done 3 minutes ago;
2. "Write the question";
3. "Read it once and send".

One session started 7 minutes ago.

**Later today:**

| Slot | Task | Length |
|---|---|---|
| T1: the next :00 or :30 at least 20 minutes ahead | "Call the dentist" | 10 min |
| T1 + 30 min | "Walk to the park" | 20 min |
| T1 + 3 h 30 | "Ring the bank" | 15 min |

At 10:05 these are 10:30, 11:00 and 14:00. Any slot ending after 23:30 is dropped.

**Anytime today,** the ten from SPEC 5.2:

- "Renew the parking permit"
- "Order printer ink"
- "Book the boiler service"
- "Pay the window cleaner"
- "Text Sam about Saturday"
- "Water the plants"
- "Find the passport"
- "Back up the photos"
- "Post the birthday card"
- "Sort the recycling"

**Done earlier today:** "Bins out".

**Inbox,** in capture order:

1. "Birthday present for Mum"
2. "Cancel the gym trial" (2 steps)
3. "Ask about the boiler quote" (note "Thursday or Friday morning, before eleven")
4. "Look into swimming lessons" (3 steps, 30 min)
5. "Return the library books" (15 min)
6. "Fix the bike light"

**Routines:**

| Routine | Steps | Today |
|---|---|---|
| Morning | 6 | Finished earlier today |
| Leaving the house | 4, with minutes | Step 2 is "Put shoes on", 2 min |
| Evening wind-down | 5 | |
| Sunday reset | 7 | |

The step names are plain household steps for the builder to write.

**Scenario buttons,** under About › Prototype:

| Button | What it builds | Screen |
|---|---|---|
| "Load the example day" | As above, at now | 1 |
| "Load: not started yet" | As above with no session and step 1 not done | 7 (at 9:58 the board's) |
| "Load: a pause left" | The day built at now − 3 h 15, the session stopped then with 7 min worked; `passSlots` then runs | 7c (at 13:20 the board's) |
| "Load: a clock left running" | The day built at now − 2 h, the session open, `away.since` = now − 1 h 50 | Closed on load, then 7c with the outline |
| "Load: weeks away" | The day built at now − 21 days; the boundary rule returns everything to the inbox | 7b (at Monday 14 December 9:12 the board's) |
| "Start empty" | Nothing | 7b |

**First open,** with nothing stored, loads the example day (owner question 2).

---

## 12. Behaviours

### Undo

- There is one live slot: `{line1, line2, spokenName, inverse, until}`. It lasts 6 s, timed on `performance.now()`.
- Only a newer undoable action replaces it.
- It is held while the Undo pill has DOM focus (`focusin` and `focusout`); this stands in for "while VoiceOver focus is on it".
- It is cleared on hide.
- It shows on the folded Next line and on Focus's foot. Where neither is on screen, a ticked row's disc is the way back.

| Action | Inverse |
|---|---|
| Step done | `reopen(step)` |
| Done | `reopen(step)` if one was finished, `reopen(task)`, and `startWork(task)` if it was running |
| Tick | `reopen(task)` |
| Start | `discardSession(task, start)` |
| Start this instead | `discardSession(new, start)`, then `startWork(old)` |
| Save | `remove(id)`, then reopen the sheet with the text |
| Resume | `stopWork(task, now)` |
| Set aside | Clear `bench.setAside` |

Undo announces "Undone", then the state now ("Now: Write the question").

### The tap guard

Step done, Pause and Resume, on Today and in Focus, ignore taps:

- during a morph (about 350 ms);
- until 1,000 ms after Today or Focus has grown out of the capsule;
- until 500 ms after either was reached any other way, including on launch.

They give no feedback while ignoring a tap.

### The ticker (`clock.ts`)

- The next tick is scheduled with `setTimeout` at the next whole second while a bar is visible and motion is full. Otherwise it is the next whole minute. There is no `setInterval`.
- A minute tick always runs while visible, for "in N min", "free until", passed slots and the 04:00 boundary.
- Ticking stops on `visibilitychange: hidden`.
- On visible, `pageshow` or window `focus`, `wake()` runs these in order:
  1. `closeForgotten`;
  2. `dayBoundary`;
  3. `passSlots`;
  4. the restore rule;
  5. one render.
- Every value is computed from `Date` and the stored timestamps, so a skipped tick costs nothing.

### Hide and leave

On `visibilitychange: hidden` and `pagehide`:

- write `bench.away.since` and the `ui` restore state, including scroll;
- clear undo;
- release the wake lock;
- `flush()` the store.

### One running thing

- Starting a task stops any other, through `startWork`.
- With the optional routines chunk, starting a task leaves a running routine unfinished and no longer present. Starting a routine stops the running task, which keeps its place.

---

## 13. Phone-specific work

### `bench/index.html`

- **Viewport:** `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-visual`. Chrome on Android honours the last part, which keeps the frame behind the keyboard there; Safari already behaves that way. Zoom is not blocked.
- **Status bar:** `apple-mobile-web-app-status-bar-style: black-translucent`, so the canvas runs under the status bar with white glyphs.
- **Colour:**
  - `theme-color`: #222624;
  - `color-scheme`: dark on the root, light on sheets and fields, so a light keyboard rises over the stone sheet. This needs a device check.
- **Other metas:** `format-detection: telephone=no`.
- **Kept as they are:** `apple-mobile-web-app-capable`, the title "Adnotia test", `/icon-180.png`, `robots noindex`, and the CSP.
- **At runtime,** `theme-color` follows the top of the current screen (charcoal, or white on white places), which tints Safari's toolbar.

### CSS for the hand

- `touch-action: manipulation` everywhere, and `none` on the drawer's handle and grabber.
- `-webkit-tap-highlight-color: transparent`, with a plain `:active` fill and no scaling.
- `-webkit-touch-callout: none` and `user-select: none` on controls, never on fields.
- Field text at 16 px or more, so iOS does not zoom. The capture field is 22 and others are 17.
- Every target at least 44 × 44.

### The keyboard (`keyboard.ts`)

- **Capture and the note and rename sheets** focus their field inside the tap handler and ride `--kb`. A unit test asserts `document.activeElement` straight after the click.
- **Any other field** ("Add a step", "New routine") follows the SPEC 3 rule.
  - The fixed frame is left alone: on iOS the layout viewport does not shrink, so it already stays behind the keyboard.
  - On `focusin`, the content scroller scrolls at once so the field and the line under it sit in the top 40% of the screen, and adjusts again when the viewport resizes.
  - Bottom padding equal to the keyboard's height lets it scroll that far.
- **Text in any field is kept** in `bench.drafts.fields[key]` on input, debounced by the store.

### The drawer (`drawer.ts`)

- **Dragging.** Pointer events on the handle band and the grabber, with `setPointerCapture`. The drawer follows the finger one to one, through `requestAnimationFrame`. The list itself scrolls and does not drag the drawer.
- **On release,** the position is projected by velocity (v × 0.2 s) to the nearest allowed position. It settles on a critically damped spring (ζ = 1, response 0.35 s, no overshoot).
- **Under Reduce Motion,** it still follows the finger, then snaps without travel.
- **Closing.** A tap on the folded or half handle opens it. Hide, a tap on the current tab, a pull down and back all fold it.

### What to try on the phone

About lists these too. Try each in a Safari tab and from the home screen:

- the safe areas, the status-bar glyphs, and no page bounce;
- the bar burning, and the minutes right after locking the phone for 5 minutes;
- a forgotten clock: start, lock for 45 minutes, come back to paused Today with "estimate 25" and nothing said about the time away;
- the drawer's drag and snap; flicking the inbox and then tapping to stop it;
- mis-taps between the capsule and capture, and between the capsule's slot and Step done;
- the keyboard rising with the capture sheet riding it, whether the page ever pans, and the draft surviving a reload;
- Reduce Motion on and off, and Increase Contrast;
- a VoiceOver pass of Today, Focus, capture and Tasks;
- charcoal against white places, in daylight and at night;
- the lamp on an OLED screen.

---

## 14. Motion (SPEC 10)

### Phase A: Reduce Motion, built first and used everywhere until phase B lands

- Lantern to capsule, capsule to Focus, and the capture sheet are 200 ms crossfades. The capsule fades in already in its slot.
- Lighting on Start, and a task page turning charcoal, is a 150 ms colour change.
- Tab switches and pushed pages are fades.
- The bar steps once a minute, together with the number.

`data-motion` follows `prefers-reduced-motion` unless Settings › Motion overrides it.

### Phase B: the animated path

This is what tests WebKit's smoothness for the build decision.

1. **The drawer follows the finger and springs** (section 13).
2. **The lantern and the capsule as one layer at two sizes.**
   - A FLIP of the step (40 → 17), the bar (342 × 10 → 238 × 4, the tick fading in the first 100 ms) and the minutes (22 → 15), with the radius going from 0 to 32.
   - The note, "of 25 · ends", "step 2 of 3", "Focus ›", Step done and Pause fade in the first 100 ms.
   - It is driven frame by frame by the drawer's drag; otherwise it runs on the spring. The spring is sampled into a CSS `linear()` easing, falling back to `cubic-bezier`.
3. **Capsule to Focus** grows in about 400 ms. The step goes from 17 to 44 and the bar stretches edge to edge; the rest fades in over the last 120 ms. "⌄ Today" reverses it.
4. **Capture.** The disc grows into the sheet in about 300 ms, and on Today the block slides up. Save drops the sheet, and the confirmation crossfades into the Next line over 150 ms.
5. **Start.** The sentence grows from 32 to 40, the bar draws from empty to full in 250 ms, and the drawer folds from half on the spring.
6. **Step done.** The finished step rises and turns ash as the next one rises into place, over 250 ms.
7. **Pause and Resume.** The fill turns ash or back over 150 ms, and the pills crossfade in place.
8. **Pushed pages** slide.

Never: bounce, pulse, a glow that moves, shimmer, confetti or sound.

---

## 15. Accessibility (SPEC 11)

- **Labels.** Every label and hint in the SPEC 11 table, word for word, from `strings.ts`. Hints go through `aria-describedby`.
- **No custom actions.** The web has no equivalent. Pause and Step done are visible buttons in Focus and on Today.
- **Announcements**, through `.live`:
  - "Saved to inbox";
  - "Step done. Now: …";
  - "Started Call the dentist. Write the school email keeps its place at step 2.";
  - "Paused";
  - "Done: …";
  - "Undone", followed by "Now: …".
- **Where focus lands:**
  - opening Focus: the step;
  - closing capture: the step, or the disc on a place;
  - opening the drawer: its heading.
- **Reading order.** DOM order matches SPEC 11's lists 1 to 9: top to bottom, then the dock line, then the drawer, then the tabs. The tests assert the sequence of accessible names for each screen.
- **Nothing by colour alone.** Now and Paused are words; the current tab has a filled glyph and 700 weight; a selected segment has a thumb and 700 weight; done has a check and "done" in its label; used up is said in words and drawn as an outline.

---

## 16. Build and checks

- **`deploy/_headers`:** add `/bench/` and `/bench/index.html` with `Cache-Control: no-cache`. Extend the loop in `tests/kernel/headers.test.ts` to both paths.
- **`scripts/check-no-network.mjs`:** add `bench/index.html` to `REQUIRED`.
- **`scripts/check-budget.mjs`:** a bench section.
  - It measures `dist/bench/index.html`, plus its `<script src>` and `<link href>` files gzipped, plus each font named by `url()` in its CSS, as served.
  - The budget is 150 kB. Expect about 25 kB of JS and CSS plus 57.1 kB of font, about 85 kB.
  - It fails when a referenced font is missing from `dist/`.
- **`vite.config.ts`:** add `globIgnores: ['assets/bench-*']`, so the app's service worker stops precaching the prototype. No other change: the font is emitted to `dist/assets/*.woff2` and is not matched by the precache globs.
- **Gates for every commit:**
  - `npm test` and `npm run check`;
  - and, for anything touching the build, `npm run build && npm run budget && npm run check:built`.
- **Commits:** small, imperative and one concern each, citing `09-product-brief.md` order of work item 3 and ADR-047. Work on a branch.
- **Docs, at the end:**
  - a dated note on ADR-047, which is still proposed: the vendored font, its source and hash, and the bench budget;
  - the checkpoint at the top of `docs/08-roadmap.md`;
  - one line in `design/lantern/README.md` saying `/bench/` follows this design;
  - the header comment in `app.ts`.

  No new ADR: ADR-047's consequences already call for this rebuild and for bundling the font.

---

## 17. Tests

All tests run in Vitest with jsdom, a fake clock and fake timers. `visualViewport`, `matchMedia`, `navigator.wakeLock` and `document.fonts` are feature-detected. `tests/bench/bench.test.ts` is replaced by the files below.

| File | What it holds |
|---|---|
| `src/domains/tasks/tasks.test.ts` (added to) | `discardSession` removes only the named session and leaves the others alone |
| `tests/bench/page.test.ts` | The bench's meta CSP equals the app's, directive for directive. Nothing external is referenced. `viewport-fit=cover`, `black-translucent` and `theme-color` are set. `@font-face` points at a relative file that exists, with `OFL.txt` beside it. No `http` appears anywhere under `src/bench` |
| `tests/bench/tokens.test.ts` | Parses the `:root` of `bench.css`. Every text pair in SPEC 7 is at least 4.5:1 and within 0.1 of its documented ratio. Every colour literal in the file is a SPEC 7 token, or an rgba of charcoal, black, white, ash or terracotta, so no red can creep in |
| `tests/bench/state.test.ts` | Every function in section 7, at the spec's scenes: `present` (running, paused, set aside then resumed then paused, ending at 04:00), `timeFacts` (ceil and floor, `endsAt` steady, no estimate), every row of the Next-line table and the foot, idle rules 1 to 4, the capsule table row by row, the drawer positions, `closeForgotten` (inside and outside the margin, no estimate, killed page), `passSlots` (two in slot order, a started one untouched), `dayBoundary`, `migrateBench` (twice, keeping unknown keys) and `exampleDay` at 10:05 |
| `tests/bench/clock.test.ts` | Ticks fall on second or minute boundaries; they stop when hidden; `wake()` runs in its order on show; nothing is left running after `destroy` |
| `tests/bench/screens.test.ts` | Per screen: structure, the exact visible strings, the capsule's mode, the choice count, the reading order by accessible names, and the labels from `strings.ts`. Also: the capture field is focused synchronously in the click; return saves; Me above the sheet keeps the draft; the draft dot; Hide is at the foot of the open drawer and the header has none; "Done today" appears only with `doneList`; the Places switch flips `data-places`; the inbox opens at its newest end and Save leaves its scroll |
| `tests/bench/undo.test.ts` | Each inverse restores the record it changed; the 6 s life; replacement only by a newer undoable tap; the hold while focused; the tap guard's two lengths |
| `tests/bench/never.test.ts` | Across every screen and scenario: no `overdue`, `late`, `missed`, `behind`, `streak`, `welcome back`, `great job`, `!`, `0 min left` or seconds; no count on a tab; no figure for time away |

The rules the old suite held carry over in the new files: one task record; capture returns to the same step with the draft kept; a past item is unscheduled quietly; the step outranks the clock.

---

## 18. The visual comparison harness

It is kept in the scratchpad and not committed, at `/tmp/claude-0/-home-user-adnotia/40bc3f4a-3604-5263-bbdf-1c8d2efee11f/scratchpad/lantern/proto-compare/compare.cjs`. It works the way `scratchpad/lantern/r7/render.js` made the board renders.

```
cd /home/user/adnotia && npm run build
NODE_PATH=/opt/node-tools/node_modules node <scratchpad>/lantern/proto-compare/compare.cjs
```

### Setup

- **Serve `dist/`** from a small Node `http` server in the same script, on 127.0.0.1. It sends `font/woff2` for `.woff2`.
- **The browser context:**
  - Chromium at 390 × 844 and device scale 2;
  - `locale: 'en-GB'` and `timezoneId: 'Europe/London'`;
  - `reducedMotion: 'reduce'`, so the shots are deterministic.
- **After load,** `page.addStyleTag` adds `:root{--sa-top:54px!important;--sa-bot:34px!important}`. The page's CSP allows inline styles. For screen 05 it also adds `--kb:336px!important`, standing in for the keyboard so the sheet sits where the board draws it.
- **The time** is set per scene with `page.clock.setFixedTime(...)`. `Date` is fixed and timers keep running. Undo and the tap guard use `performance.now()`, so they behave normally.
- **Each scene is reached by pressing what a person presses,** with `getByRole` and SPEC 11's names. It starts from Me › About this prototype › a scenario button, so no test hook ships.

### Scenes

| Board shot | Clock | Path |
|---|---|---|
| 01-today | Tue 24 Nov 2026 10:05 | Load the example day |
| 02-rest-of-today | 10:05 | Tap the handle |
| 03a-task-opened-charcoal | 10:05 | From 02, tap "Call the dentist" |
| 03b-task-opened-white | 10:05 | Settings › Places › White, then as 03a |
| 04-focus | 10:05 | Tap the lit block |
| 05-capture | 10:05 | Tap Capture, type "Ask Ana about Friday". Compare above y 508 only |
| 06a-tasks-charcoal | 10:05 | Save, wait 6.5 s, then Tasks |
| 06b-tasks-white | 10:05 | The same, after Places › White |
| 07-nothing-running | 9:58 | Load: not started yet |
| 07b-nothing-planned | Mon 14 Dec 9:12 | Load: weeks away |
| 07c-paused | 13:20 | Load: a pause left |
| 08-running-task | 10:05 | Tasks › Today, then the email's row |
| 09-routines | 10:05 | Routines |

### Output

Everything goes to `<scratchpad>/lantern/proto-compare/out/`.

- **`NN.png`:** the prototype at 780 × 1688.
- **`NN-side.png`:** the board crop beside the prototype, made with `convert board.png -crop 780x1688+32+32 +repage crop.png` and `convert crop.png NN.png +append NN-side.png`.
- **`NN-diff.png`:** from `compare -fuzz 8% -metric AE`. The pixel count is a trend, not a gate.
- **`report.json`**, printed as a summary:
  - **Geometry,** measured with `getBoundingClientRect` on elements carrying `data-geo` and compared with the SPEC numbers below. A difference of more than 1 pt fails.
  - **The font is real:** `document.fonts.check('700 40px "Instrument Sans"')`.
  - **No request** except to the local origin, logged with `page.on('request')`.
  - **No visible text under 12 px.**
  - **Every interactive element at least 44 × 44.**
  - **No horizontal overflow.**

**Geometry targets** (y unless stated):

| Element | Target |
|---|---|
| Header and Me | 58–102 |
| Dock line | 606–670 |
| Capsule | x 24–292 |
| Capture | x 302–366 |
| Folded drawer top | 684 |
| Lip | 730 |
| Half drawer top | 366 |
| Open drawer top | 60 |
| Open drawer header | 76–120 |
| Hairline | 754 |
| Tabs | 760–812, x 16–374 |
| Today | Step 386–432, bar 460–470, block bottom 550 |
| 7c | Block 308–550, Set aside 472–516 |
| Focus | Context 166–186, step 252–352, bar 420–432 at x 0–390, +5 min 455–499, foot 776–796 |
| Capture | Sheet top 280, field 344–400, row 442–486 |
| 3a | Title 122–160, when pill 176–220 at x 24–315, Start this instead 240–296 |
| 6a | Switcher 114–158, rows from 200 |
| 9 | Rows from 142, 62 apart |
| Open drawer's Hide | Ink at 715–735, ending at x 366 |

**Things to check by eye:**

- the lamp's centre;
- the capsule's line 2 showing "18 min left · Write the school email" whole;
- the covered rows;
- the duration tracks ending at x 329 and in their slot;
- pills centred by their ink.

**Extra shots** at 375 × 667 (insets 20 and 0, the compact handle) and at 430 × 932 (59 and 34). There is no board to compare them with; they check the frame holds on other phones.

The board's status bar and home indicator are not drawn by the prototype; the phone draws them.

---

## 19. Order of work

Every chunk ends green: `npm test && npm run check`, plus `npm run build && npm run budget && npm run check:built` where the build is touched. Refresh the roadmap checkpoint at the end of each chunk.

### Chunk 0: plumbing, font and guards

Half a session.

**Build:**

- `_headers` no-cache for `/bench/`, and the headers test;
- `REQUIRED` += `bench/index.html`;
- the bench budget section;
- `globIgnores`;
- the font files and their README;
- the `@font-face` rule, applied to the existing screens' body font;
- `page.test.ts`;
- the comparison harness skeleton (serve, load and screenshot 01 of today's UI).

**Check:**

- `npm run budget` prints a bench total of about 70 kB;
- on the phone, today's screens render in Instrument Sans, in Safari and from the home screen, proving the font loads under the CSP.

### Chunk 1: the rules, pure

Tests only, nothing wired in.

**Build:**

- `discardSession` and its test, as its own commit;
- `state.ts`, `format.ts`, `strings.ts` and `example.ts`;
- `state.test.ts` and `clock.ts` with `clock.test.ts`.

**Check:** `state.test.ts` reads as the spec's rules, one `it` per table row.

### Chunk 2: the frame and Today

This replaces the old UI.

**Build:**

- the page metas;
- tokens, type and the icon sprite;
- the layout variables;
- the layers and the region renderer;
- the ticker's live nodes;
- `migrateBench`, the migrating codec and the error screen in `main.ts`;
- `wake()` and hide wiring;
- Today in every state (1, over the estimate, no estimate, 7c and used up, 7 with rules 1 to 3, and 7b), with the lamp;
- the drawer static at lip, folded and half, and the open drawer by tap, with its list, cover and Hide at the foot;
- the capsule component (needed on the open drawer);
- tabs, with Tasks, Routines and Library as bare places for now;
- Me with the crisis page, and About with the scenario buttons;
- Undo on the Next line, and the tap guard.

Delete `bookmark()`, `tally()`, the old CSS and `bench.test.ts`.

**Tests:** the Today and open-drawer parts of `screens.test.ts`; `undo.test.ts`; `never.test.ts` for these screens.

**Check:**

- harness 01, 02, 07, 07b and 07c within 1 pt on the geometry;
- on the phone: the safe areas, white status glyphs, the bar burning, the minutes right after a 5-minute lock, and "Load: a clock left running" opening on 7c.

### Chunk 3: Focus

**Build:**

- the Focus layer: running, paused and used up;
- +5 min and Set aside;
- the foot line following the Next line's rows, with Undo;
- "⌄ Today" or "⌄ Tasks";
- the wake lock;
- history entries for Focus.

**Tests:** the Focus parts of `screens.test.ts`, including the five choices.

**Check:** harness 04. On the phone, Today and Focus are told apart at a glance.

### Chunk 4: capture and the keyboard

**Build:**

- the sheet over Today, Focus and places;
- synchronous focus;
- `--kb` from `visualViewport`;
- Inbox or Today, and Save;
- return saves;
- the lantern raised above the sheet, falling back to the capsule as a picture;
- Me live above the sheet;
- the persisted draft and the dot;
- Undo reopening the sheet;
- the announcements and where focus lands.

**Check:**

- harness 05 (above the keyboard);
- on the phone: the keyboard rises with the field visible and the row riding it, the page never pans, and a draft survives a reload.

### Chunk 5: places, the capsule on them, and the pages

**Build:**

- **The capsule** in every state, with the line-2 fit, the scroll guard, and the fade and drawer-shadow layers.
- **Tasks:** the switcher, the inbox opening at its newest end, Today with the Now tag, Coming up and Done.
- **Task pages:**
  - unlit (3a and 3b), with Start and Start this instead (its sentence and Undo);
  - running (8);
  - paused and done (G12).
- **"Add a step"** with the field rule.
- **Sheets:** the when sheet, the ⋯ sheet, note, rename and delete.
- **Routines (9)** and the routine page without running.
- **Library.**
- **Settings,** with all four switches.
- **History and back** for pushed pages and sheets.
- **The restore rule.**

**Tests:** the rest of `screens.test.ts`; `tokens.test.ts`.

**Check:**

- harness 03a, 03b, 06a, 06b, 08 and 09;
- on the phone: charcoal against white places in daylight and at night, flicking the inbox and tapping to stop, and back by Safari's edge swipe.

### Chunk 6: the drawer in the hand

**Build:**

- the drag, velocity projection and spring;
- the allowed positions per mode, kept per day;
- the covered row cut to a row boundary at rest;
- the half drawer's lane (titles wrapping by x 286);
- "Rest of today ⌃" crossfading to "⌄ Hide";
- the Reduce Motion form of the lantern fading into the capsule as the drawer opens.

**Check:** on the phone, the drag feel, the snap, Hide at the foot, and opening over every tab. Harness 02 and 07 again.

### Chunk 7: the animated path

**Build:** phase B items 2 to 8 in section 14, behind `data-motion=full`.

**Check:** on the phone only, flipping Settings › Motion to compare the two paths. Watch for dropped frames during the drag-driven morph.

### Chunk 8 (optional): running routines

**Build:**

- the routine page's Start, which stops the running task and keeps its place;
- the routine in the lantern and the capsule ("2 min left · Leaving the house", and "Leaving the house · step 2 of 4" untimed);
- Step done as `tickStep`, Done as `finishRun`, and Undo as `untickStep`;
- Pause, as the owner answers question 10;
- "+ New routine", built with `create`, `addStep` and `setStepMinutes`.

**Check:** the screens tests for a routine, and the phone.

### Chunk 9: round-up

**Build:**

- the docs in section 16;
- the "What to try" list in About, brought up to date;
- a last full harness run, with its results summarised in the roadmap checkpoint.

---

## 20. What the prototype cannot tell the owner

Each of these bears on the choice between Capacitor, React Native and native.

- **No web page can build** the Lock Screen Live Activity, the Dynamic Island, Android's Live Update, the capture controls or the widget. Any route, a wrapper included, needs native code for them: a Swift widget extension plus a plugin, or a native module.
- **iOS Dynamic Type** reaches the web only roughly, through `-apple-system-body`. Bold Text and the Large Content Viewer do not reach it at all.
- **There are no haptics** on iOS from the web.
- **The keyboard** is followed after the fact through `visualViewport`, not animated with it.
- **The status-bar style** is fixed at launch in home-screen mode.
- **Tapping the status bar** does not scroll an inner list to the top.
- **The screen cannot be held upright.** A web page on an iPhone, in Safari or from the home screen, cannot lock its orientation, so the screen turns when the phone does.
- **A drag that starts on the capsule** does not scroll the list underneath, because the dock is fixed (section 4).
- **Accessibility custom actions** do not exist on the web.
- **The fairer test is the home-screen copy.** A WKWebView wrapper (Capacitor) behaves like it, not like a Safari tab.

---

## 21. Owner questions

1. **The font.** May the prototype bundle Instrument Sans (Google Fonts' latin variable woff2, 57 kB, with `OFL.txt` beside it) in `src/bench/fonts/` as a trial, while ADR-047 still calls the typeface proposed?
2. **First open.** With nothing stored, should the prototype load the example day relative to the current time, with "Start empty" in About? The alternative is to open on "Nothing planned for today".
3. **White places.** Should Settings carry a Charcoal or White switch for the places? In home-screen mode iOS fixes the status-bar style at launch, so with white places the clock and battery glyphs may be white on white; the white option would then be judged in a Safari tab.
4. **Coming back the same day.** Should the prototype restore exactly where the person was if they were away under 15 minutes, and otherwise open on Today? This resolves SPEC 5.7's "restores exactly where the person was" against 7c, which opens on paused Today at 13:20 of the same day.
5. **A forgotten clock** (SPEC 4 and 14).
   - When the person watched the clock run past the estimate and then left, should the session close at the estimate's end, as written, losing overtime they saw counted, or at the moment they left?
   - With no estimate, should the session close at the last moment the app was open once it has been in the background 15 minutes (the literal reading), or only at 04:00?
6. **+5 min with no estimate.** Should it set the estimate to the whole minutes worked so far plus 5? The spec covers only a used-up estimate.
7. **Clock format.** 24-hour as drawn ("10:30", "ends 10:23"), or follow the phone's setting? "10:30am" does not fit the 60 pt time column.
8. **A timed item's two lengths.** Should the when sheet's "How long" set both the slot's length and the estimate, kept equal, with the bar falling back to the slot's length when no estimate is set?
9. **The pieces the spec does not draw.** Are these proposals acceptable?
   - Tasks › Coming up grouped by day.
   - Tasks › Done newest first, with an un-tick disc.
   - An unlit task page's steps as plain text on the rail, with no Now.
   - A paused task's page as page 8 with the paused bar.
   - A done task's page with "Not done after all".
   - Me pushed on the current tab, with that tab still current.
   - "⌄" plus the tab's name when Focus is opened from a pushed page.
   - "in 1 h 20 min" for an hour or more.
   - Idle rule 1 with a slot under way reading "Nothing running · until 10:40" and "Booked now".
10. **Routines.** Do you want running routines (chunk 8) before deciding how the phone apps are built? If so, what does Pause mean for a routine? The proposal is that it freezes the current step's minutes, with Resume and Set aside as for a task.
11. **Android.** Will you also try it on an Android phone? Chrome installs a page full screen only with a manifest, which the build strips from `/bench/` today. The prototype would need a manifest of its own.

---

## 22. Risks

- **The status bar in home-screen mode.** iOS reads the status-bar style once, at launch. `black-translucent` is right for charcoal and for the open drawer's charcoal top. It is wrong on white places, where the glyphs may be invisible. Safari's handling of a runtime `theme-color` on iOS 26 is unconfirmed.
- **Safari on iOS 26 in a tab.** The floating toolbar sits over the bottom of the page, and the safe-area values there differ from home-screen mode. The dock and tabs may be partly covered. The toolbars can also push a 6.1-inch phone under 740 pt, giving the compact handle in a tab but not from the home screen, which the owner may take for a bug. The home-screen copy is the fair test.
- **The keyboard.** iOS raises it only when `focus()` runs synchronously inside the tap. Positioning from `visualViewport` lags the keyboard's own animation, so the sheet may jitter or land late, and iOS may pan the page anyway. This is the screen most likely to feel un-native, which is evidence for the build decision rather than a reason to skip it.
- **The fixed dock.** A drag that starts on the capsule does not scroll the list under it, which differs from SPEC 4. The 150 ms scroll guard stops a momentum-stopping tap from opening Focus, but the list keeps moving under that tap. If this feels wrong, the fallback is the capsule placed sticky inside each place's scroller.
- **Drawer gestures in Safari.** Page rubber-banding and the edge swipe back can fight the drawer drag. Pushed history entries help, but this needs a device check.
- **The re-render model.** Moving from whole-tree replacement to layers with live nodes is the largest code change. Regressions show as stale minutes, lost focus or a wrong reading order, so the screen tests must assert the order of accessible names.
- **The forgotten clock** needs `visibilitychange` or `pagehide` to write `away.since`. If iOS kills a suspended page first, nothing is closed and the clock reads as running past its margin. The rule's edges are also open (owner question 5).
- **The font.**
  - It is 57.1 kB and gains nothing from gzip.
  - `font-display: block` hides text briefly on a slow first load.
  - `font-stretch` on the width axis needs confirming in Safari.
  - Characters outside latin fall back to the system face.
  - The capsule's name fits by 4 pt in 238, so a different rasteriser may drop the name on a phone although it fits on the board.
- **The harness.** It depends on the Playwright copy installed on this machine, not on a repository dependency, and it lives in a scratchpad that can be cleared. Chromium renders differ from Safari's, so pixel figures are a trend; the 1 pt geometry check is the real one.
- **Storage.**
  - A home-screen copy keeps its data apart from Safari's, so the owner may see two different datasets.
  - Safari may evict a tab's storage after seven days without a visit.
  - Old Bookmark-round data loses its separate focus box on first load, though a running session keeps running.
- **Wake Lock** in home-screen web apps was broken before iOS 18.4, so Focus may let the screen sleep.
- **The model.** Paused, set aside and the order of passed items live only in the prototype (`domains.bench`), so the real model still has no answer to them. `discardSession` is a small, tested addition to shared code.
- **The crisis lines** reused from `src/kernel/shell/crisis.ts` are still unconfirmed by a person. Nothing should be promoted from the prototype.
- **Other screen sizes.** The board is drawn at 390 × 844. The half drawer's top, the compact handle and the lantern's bottom alignment on other sizes are inferred from SPEC 3 and may need adjusting.
- **Scope.** The animated morph (chunk 7) and running routines (chunk 8) are large. They are last, so the Reduce Motion path, the part that decides the build question, lands first.
