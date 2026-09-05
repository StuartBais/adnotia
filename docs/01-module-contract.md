# Adnotia module contract

Status: draft 0.1 · September 2026 · Companion to `02-evidence-rubric.md` and `03-scope.md`

## Why a contract

Adnotia is a set of tools, not one app. Each tool is a module. The contract exists so a module can be built, reviewed, enabled and removed without touching any other module, and so the shell can assemble a coherent experience from whatever a person has switched on.

The medication log is the first module and the test of this contract. If the contract cannot express something the medication log already does, the contract is wrong, not the log.

## Principles every module inherits

1. **Opt-in.** Nothing is on by default except the shell. A person who does not take medication must never see a dose field. The home screen is built from what the person enabled, and medication is one option among several.
2. **Describe, never prescribe.** Modules record, summarise and reflect. They never tell the person what to do about their treatment. See `03-scope.md` for the hard list.
3. **No guilt mechanics.** No streaks, badges, points, "you missed three days" banners, or notifications designed to shame. A gap in the record is a fact to show, never a failure to punish.
4. **Short by default.** The whole daily check-in across every enabled module must be completable in about ninety seconds. Modules budget for that and the shell enforces it.
5. **Nothing leaves the device.** Modules make no network requests. Not for fonts, not for analytics, not for "anonymous" usage counts. The kernel has no networking primitive to offer them.
6. **Evidence is visible.** Every module carries a tier from the evidence rubric and a Library entry stating what the evidence supports and what it does not.
7. **Works alone, works together.** A module functions with nothing else enabled, and does not read another module's data without declaring the dependency.

## The manifest

Every module is a single ES module whose default export is a manifest.

```js
export default {
  id: "medication",              // stable, lowercase, never renamed once shipped
  name: "Medication log",
  version: 3,                    // schema version of THIS module's state
  tier: "A",                     // from the evidence rubric
  audience: "adult",             // "adult" | "parent" | "child"; see Family space rules below
  summary: "A daily record of dose, cover, side effects and sleep, summarised into one page for your prescriber.",

  eligibility: {
    question: "Are you currently taking medication for ADHD?",
    enableIf: "yes",
    note: "You can turn this on later if that changes."
  },

  dependencies: [],              // other module ids this reads from; almost always empty

  contributes: {
    today:    [ /* fields */ ],
    tools:    [ /* views */ ],
    records:  { /* history renderer */ },
    reports:  [ /* sections for named reports */ ],
    library:  { /* evidence entry */ },
    settings: [ /* module toggles */ ]
  },

  migrate(state, fromVersion) { /* return state at `version` */ },

  // Optional. Values that follow from what was just entered, merged into the
  // day before it is saved. Sees only this module's own day record, runs once
  // per save, and never overwrites something the person typed.
  // See decisions/ADR-010-derived-fields.md.
  derive(day) { /* return a partial day record */ },

  fixtures: { empty: {...}, threeDays: {...}, thirtyDays: {...} }
};
```

## Contribution points

### `today` — the daily check-in

The shell owns one check-in for the day. Modules add fields to it. The shell groups fields by module, orders modules by the person's chosen order, and renders one scrolling form.

Each field declares:

```js
{
  id: "focus",
  label: "Focus and follow-through",
  type: "scale5" | "chips" | "chipsMulti" | "time" | "timeList" | "number" | "text" | "toggle",
  options: [...],                // chips only: { v, l } pairs
  anchors: [...],                // scale5 only: six strings, index 1–5 used
  optional: true,
  cost: 3,                       // estimated seconds to answer; the shell sums these
  followUp: (value) => [ /* more fields shown only when this has a value */ ],
  carry: "none" | "previous" | "nearestPrior"   // prefill behaviour
}
```

Rules:

- A module's `today` fields must total **≤ 40 seconds** of declared cost. The shell warns the person when all enabled modules exceed ninety and offers to hide optional fields.
- `followUp` is the only way to ask for detail. Never show a detail field unconditionally.
- `carry: "nearestPrior"` means "the value from the closest earlier day that had one", not "the most recently saved value". This distinction is what makes backfilling correct.
- Fields never validate against each other across modules.
- A field's value is stored under `modules.<id>.days[<date>].<fieldId>`. Modules do not choose their own storage key for daily data.

### `tools` — in-the-moment views

Things a person opens deliberately and uses now: a timer, a plan-the-next-hour sheet, a breathing exercise. A tool is a view with a title, an icon name, and a `mount(container, kernel)` function. Tools may keep their own transient state and may write to the module's state slice (a completed session, for instance) but must not add fields to `today` from inside a tool.

### `records` — history

Each module renders its own history. The shell provides the date range and a container; the module returns rows. Records are read-only views onto `today` data plus anything a tool saved.

### `reports` — sections for named reports

The kernel owns reports. A report has a name, an audience, a header, a footer and a print stylesheet. Modules contribute sections.

The first named report is `clinical`: one page for a prescriber. Its header (identity, range, coverage percentage), its footer (record quality, questions for the appointment) and its print and text export belong to the kernel, not to any module.

```js
{
  report: "clinical",
  id: "medication.standing",
  title: (ctx) => "Where things stand on " + ctx.currentDoseLabel,
  weight: 10,                    // lower prints earlier
  when: (ctx) => ctx.days.length >= 3,
  render: (ctx) => "<table>…</table>",      // print HTML
  renderText: (ctx) => "Efficacy: …"       // plain-text export
}
```

Rules for `clinical` sections:

- Every number shown must be reproducible from the day-level data. No hidden scoring.
- Sections describe. They never contain the words *should*, *increase*, *decrease*, *recommend*, or any equivalent addressed to the clinician.
- Anything shown to the clinician is shown to the person first, in the same words.
- Sections state their own coverage when it matters ("7 of 14 nights recorded").

### `library` — the evidence entry

Required for every module, including Tier C. The shell renders these in one place so a person can read why a tool exists before turning it on.

```js
{
  tier: "A",
  whatItIs: "…one paragraph…",
  whatTheEvidenceSays: "…two or three paragraphs, plain language, with the strength of evidence stated…",
  whatItWontDo: "…the honest limits…",
  citations: [ { title, authors, year, venue, doi_or_url } ],
  reviewed: "2026-09",
  nextReview: "2027-09"
}
```

### `settings`

Module-level toggles only. A module may not add global settings.

## State

- A module owns exactly one namespaced slice: `modules.<id>`. It never reads or writes outside it, except through a declared dependency.
- The slice carries its own `version`. `migrate(state, fromVersion)` must handle every version ever shipped and be safe to run twice.
- Unknown fields are preserved, never stripped. A backup from a newer build restored onto an older build keeps the data it does not understand.
- Encryption is transparent. The kernel encrypts the whole document; modules see plain objects.
- Backups include every slice, enabled or not. Disabling a module hides it; deleting its data is a separate, explicit action.

## Kernel services

The kernel exposes exactly these to a module. Anything not here is not available, by design.

| Service | What it does |
|---|---|
| `store.get(id)` / `store.set(id, slice)` | Read and write the module's slice, debounced, encrypted at rest |
| `dates` | ISO helpers, "logging day" (respects the after-midnight rule), clock arithmetic that crosses midnight |
| `ui` | Shared primitives: scale, chips, time input, calendar picker, detail row, link row |
| `reports.registerSection` | Contribute to a named report |
| `events.on / emit` | `day:changed`, `entry:saved`, `module:enabled`, `module:disabled`, `appointment:marked` |
| `evidence.tier(id)` | Look up a tier's display wording from the rubric |

There is no `fetch`, no `navigator.sendBeacon`, no timer that outlives the page.

## Lifecycle

1. **Register.** The build includes the module; it appears in the Library and in "Add a tool", off.
2. **Enable.** The shell asks the eligibility question. On the right answer, the slice is created at the current `version` and contributions mount.
3. **Migrate.** On every load, if `slice.version < manifest.version`, `migrate` runs before anything renders.
4. **Disable.** Contributions unmount. Data stays. The Library entry remains visible.
5. **Delete data.** Explicit, confirmed, separate from disable.

## Testing a module

Each module ships fixtures for zero days, three days and thirty days of data, and a smoke test that:

- renders every `today` field with each fixture,
- renders every `records` and `reports` contribution with each fixture without error,
- runs `migrate` from every prior version to the current one,
- confirms the module makes no network request (the test harness has no network and fails on any attempt),
- confirms the declared `today` cost is within budget.

## Family space rules

Modules declare an `audience`. The kernel enforces these constraints at registration, not at review.

- **`"adult"`** modules mount only in the Adult space. Unchanged from the rest of this document.
- **`"parent"`** modules mount in the Family space against a chosen child profile. Their state lives at `family.children[<profileId>].modules.<id>`, one slice per child, so profiles never share data and a profile deletes cleanly. They may contribute to the `screening` and `observations` reports but never to `clinical`, which is adult-only.
- **`"child"`** modules mount only on the handed-over surface behind the kernel's `parentGate`. They may declare **no** `today` fields, **no** `reports`, **no** free-text inputs and **no** links. They may read their own slice and the parent-configured schedule and chart for that child, and write only tool-usage events. A `"child"` module that declares anything else fails to register.
- No module of any audience may contribute a dose field, a medication name field or a titration report section to the Family space. The kernel rejects field ids matching a reserved list (`dose`, `med`, `times`, `onset`, `woreOff`, `rebound`) outside the Adult space.
- The reward chart is the one place a Family module may show points. It must be positive-only (no removal), parent-initiated for every change, and free of any reminder or streak. The kernel provides it as a shared `ui` primitive so no module reimplements it differently.

## Anti-patterns that fail review

- A field shown unconditionally that most people leave blank.
- Any streak, count-of-consecutive-days, or "keep it up" copy.
- Reading another module's slice without a declared dependency.
- A report section that reaches a conclusion for the clinician.
- A Library entry without a `whatItWontDo`.
- A migration that drops fields it does not recognise.
- Anything that requires the person to remember to do something at a fixed time in order for the module to work.
- A `"child"` module that asks the child anything, or a `"parent"` module that scores what a parent records.

## Worked example: the medication log as a module

This is the existing app expressed in the contract. Everything it does today maps to a contribution point.

| Existing feature | Contribution |
|---|---|
| Date picker, after-midnight default | Kernel `dates.loggingDay()`, kernel calendar in `ui` |
| Medication name, dose, times, carried forward | `today` fields with `carry: "nearestPrior"` |
| Focus, mood scales with anchors | `today` `scale5` fields |
| Coverage: onset, wore off, rebound | `today` fields; rebound time is a `followUp` |
| Body: appetite, heart, side effects with severity | `today` chips; severity, time and note are `followUp` |
| Sleep window and night quality | Belongs to a separate `sleep` module that `medication` declares as an optional dependency for its report |
| Wins and misses | Kernel-level `today` fields available to any module's report |
| Same as yesterday | Kernel `ui` action operating on `carry` metadata |
| Missing-day prompts | Kernel, driven by which modules have `today` fields |
| History list | `records` |
| Where things stand, dose over time, cover across the day, per-dose comparison, side-effect grid | Five `reports.clinical` sections, weights 10–50 |
| Baseline | `settings` for the module; surfaced in the `clinical` header by the kernel |
| Questions for the appointment, "I have had the appointment" | Kernel; the `clinical` report footer |
| About this record | Kernel; the `clinical` report footer |
| Before you go (the mirror) | Kernel-level, screen-only, never printed; reads any module's data through a `reflect(ctx)` hook modules may optionally provide |
| Passcode, backup, restore | Kernel |

Two things the exercise exposed, which is what it was for:

1. **Sleep is its own module.** People who do not take medication have every reason to track sleep. It becomes `sleep`, Tier B, and `medication` reads it as an optional dependency for the cover-across-the-day chart.
2. **Wins and misses are not medication-specific.** They move to the kernel as general daily fields, and any report can use them.

## Open questions

- Should a module be able to contribute to another module's report section (e.g. sleep annotating the medication cover chart), or only add its own sections? Current answer: only its own, and the chart moves to the kernel as a shared visual that reads from both.
- Is `cost` in seconds the right budget unit, or should it be taps?
- Do tools need their own state schema and migrations, or is "a tool may write into the module slice" sufficient?
