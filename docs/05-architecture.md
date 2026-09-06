# Adnotia architecture

Status: draft 0.1 · September 2026 · Implements `01-module-contract.md` under the constraints of `03-scope.md`

## Constraints the architecture must satisfy

1. Runs entirely in the browser with no server and no network requests, enforced by Content Security Policy, not policy.
2. Works offline and installs to a phone home screen.
3. Also ships as one self-contained HTML file, from the same source.
4. Modules can be added, enabled, disabled and removed independently.
5. Data survives schema changes for years, including restores from old backups.
6. Encryption at rest is optional and transparent to modules.
7. A person can read the source and verify every claim above.

## Stack and why

| Choice | Reason |
|---|---|
| TypeScript, strict | The module contract is a set of shapes. Types catch violations at compile time; the kernel catches the rest at registration. |
| Vanilla DOM, ES modules | Bundle stays small and inspectable. The design system is bespoke and simple. Revisit via ADR if module UI boilerplate becomes a measurable cost. |
| Vite | Dev server, TypeScript, and two production outputs with minimal configuration. |
| vite-plugin-pwa | Manifest and service worker for offline and install. |
| vite-plugin-singlefile | The one-file build. |
| Vitest + jsdom | Fast unit and smoke tests; jsdom can also execute the reference monolith for parity tests. |
| No runtime dependencies | Nothing else ships to the user. |

Playwright may be added later for a handful of end-to-end flows (first run, enable module, print report, passcode round-trip). Not before Milestone 2.

## Repository layout

```
adnotia/
  CLAUDE.md                     agent instructions
  README.md                     human overview
  LICENSE                       AGPL-3.0
  index.html                    shell entry, CSP meta, no external refs
  vite.config.ts                two build targets
  package.json
  docs/                         design documents and ADRs (source of truth)
  reference/                    v0 monolith and porting notes
  assets/                       logo.svg, icon sources
  src/
    kernel/
      store/                    document, slices, persistence, migrations
      crypto/                   PBKDF2 + AES-GCM envelope, passcode, backup passphrase
      backup/                   export, restore, merge
      shell/                    router, spaces, navigation, first run
      today/                    check-in assembler, cost budget, carry rules
      reports/                  report registry, header, footer, print, text export
      library/                  evidence entries, tier wording
      ui/                       design system primitives
      dates/                    logging day, clock arithmetic across midnight
      events/                   typed event bus
      family/                   profiles, parentGate, child surface host
      registry.ts               static list of all module manifests
      kernel.ts                 the object handed to modules
    modules/
      medication/
        manifest.ts
        today.ts
        reports/
        records.ts
        library.ts
        migrate.ts
        fixtures/
        medication.test.ts
      sleep/
      planning/
      mindfulness/
      family-screener/
      family-observations/
      family-routines/
      child-tools/
    styles/
      tokens.css
      base.css
      print.css
    main.ts
  tests/
    harness/                    no-network guard, fixture loader, monolith runner
    parity/                     monolith vs module comparisons
    kernel/
```

A module is a directory. Deleting the directory and its line in `registry.ts` removes it completely. Nothing else references it.

## The kernel

### Document

One JSON document per person, described in `06-data-model.md`. The kernel owns the top level; modules own slices under `modules.<id>` (Adult space) or `family.children[<profileId>].modules.<id>` (Family space).

### Store

```ts
interface Store {
  get<T>(sliceId: string): Readonly<T> | undefined;
  set<T>(sliceId: string, next: T): void;        // debounced persist
  subscribe(sliceId: string, fn: () => void): () => void;
}
```

The store hands a module a slice scoped to the current space and, in the Family space, the current child profile. A module never sees the path. Persistence is debounced 500 ms, encrypts if a passcode is set, and writes to `localStorage` (or the host storage adapter when embedded). Every write is the whole document; partial writes are not attempted.

### Migrations

Two levels. The kernel migrates the document shape (`schemaVersion`). Each module migrates its own slice (`manifest.version`, `manifest.migrate`). Order on load: decrypt, kernel migration, then each enabled module's migration, then render. Unknown slices and unknown fields are preserved untouched. Migrations are pure functions and are tested from every prior version.

### Crypto

PBKDF2-SHA256 (500 000 iterations, 16-byte salt) to AES-GCM-256 with a 12-byte IV per write. Two independent uses: the app passcode (digits, ≥ 6) and the backup passphrase (≥ 8 characters, chosen per export). Keys live in memory for the page's life only. `crypto.subtle` requires a secure context; the UI states plainly when it is unavailable rather than falling back silently. Details in `06-data-model.md`.

### Shell and spaces

The shell owns first run, space selection (Adult or Family), navigation, and page routing. Navigation is a small fixed set: Today, Tools, Records, Library, plus Settings. Family adds the child-profile switcher and "hand to child". There is no deep-link routing to individual modules; modules appear inside these areas.

### Today assembler

Collects `today` fields from every enabled module, groups by module in the person's chosen order, sums declared `cost`, warns above 90 seconds, offers to hide optional fields, applies `carry` rules, and persists per field into the module's slice under `days[<date>]`. Owns the date picker, the after-midnight rule and "same as [date]".

### Reports engine

Named reports with an audience. `clinical` (Adult), `screening` and `observations` (Family). The engine owns header, footer, ordering by `weight`, print stylesheet and plain-text export; modules supply sections. Every section receives a `ReportContext` with the date range, the days in range, coverage figures and, for `clinical`, the dose grouping helpers the medication module exposes so shared visuals (cover across the day) can be drawn by the kernel from medication and sleep data together.

### Library

Renders every module's `library` entry, enabled or not, with tier wording from the rubric. Also hosts the two screeners and the exclusion-list explanations. The screeners are kernel-owned code, not modules, because their presentation rules are fixed by `03-scope.md` and `04-family-space.md`.

### UI primitives

`scale5`, `chips`, `chipsMulti`, `timeInput`, `numberInput`, `textInput`, `detailRow`, `linkRow`, `calendar`, `card`, `nag` (fortnightly cap enforced here), `rewardChart` (Family, positive-only, parent-initiated). All primitives are keyboard-operable and carry the right ARIA. Modules do not build their own controls.

### Events

Typed bus: `day:changed`, `entry:saved`, `module:enabled`, `module:disabled`, `appointment:marked`, `profile:changed`, `childMode:entered`, `childMode:left`. Modules subscribe; the kernel emits.

### Family

Profiles (nickname, age band), the `parentGate` primitive (passcode to enter and to leave), and the child surface host, which mounts only `audience: "child"` modules and blocks navigation until the gate opens.

## Module registration

`registry.ts` imports every manifest statically. There is no dynamic or remote loading; the set of modules is the set in the build. At startup the kernel validates each manifest:

- required fields present, `id` lowercase and unique, `version` integer ≥ 1;
- `audience` valid; `"child"` manifests declare no `today`, `reports`, free-text fields or links;
- no reserved field id (`dose`, `med`, `times`, `onset`, `woreOff`, `rebound`) outside `audience: "adult"`;
- `today` cost sum ≤ 40;
- `library` entry complete, `tier` in `A | B | C`, `citations` non-empty;
- `migrate` handles `fromVersion` 1 through `version − 1` (checked by running it on fixtures).

A manifest that fails validation throws at startup in development and is skipped with a console error in production. It never half-mounts.

## Security posture

`index.html` carries:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; connect-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'">
```

`connect-src 'none'` makes "no network" a browser-enforced property. `'unsafe-inline'` for styles is needed for the single-file build and is acceptable given `script-src 'self'`; the single-file build inlines scripts with a nonce or hash generated at build time. Fonts are system stacks; there are no font files.

The service worker precaches the app shell and serves it offline. It never fetches anything else, because there is nothing else to fetch.

## Build

`vite.config.ts` exposes two modes:

- `build` → `dist/` with manifest, service worker, hashed assets. Deploy to any static host with a dedicated origin (see `03-scope.md` on `localStorage` scoping).
- `build:single` → `dist-single/adnotia.html`, all CSS and JS inlined, icon as data URI, no service worker. Offered as a download from the Library's "About" page and works when opened over `https` or from any static host; opened as `file://` it works except for encryption, which needs a secure context, and it says so.

Both builds run in CI on every push. The single-file output is a release artefact.

## Testing strategy

- **Kernel unit tests:** store, migrations (every version pair), crypto round-trips including wrong-key rejection, backup merge, dates across midnight, cost budget, registration validation including each failure mode.
- **Module smoke tests:** generated from a shared helper; a module cannot opt out.
- **Parity tests:** `tests/parity/` loads `reference/adnotia-v0-monolith.html` in jsdom with a fixture, extracts report text and history text, and compares to the module build's output for the same fixture. These are how Milestone 1 proves it lost nothing.
- **No-network guard:** the test harness stubs `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket` and `EventSource` to throw; any test that trips one fails.
- **Contrast check:** a script reads `tokens.css` and asserts every text-on-surface pair used by the design system is ≥ 4.5:1.
- **Print snapshot:** the `clinical` report for the thirtyDays fixture is rendered with `print.css` applied and snapshotted as text; layout changes must be intentional.

## Accessibility

Keyboard reachable throughout; visible focus; `aria-pressed` on every toggle chip; live regions for save confirmation and month changes in the calendar; `prefers-reduced-motion` respected; text never below 12.5 px on screen; print never below 7.5 pt. The child surface additionally uses large targets (≥ 48 px) and no text smaller than 16 px.

Held by `tests/kernel/a11y.test.ts`, which checks these against the real stylesheet and the real rendered app rather than against a list kept beside them. It reads `base.css` into selectors and resolves them with `element.matches` (`tests/kernel/styleRules.ts`), so a class added to the child surface is measured rather than assumed; it records click listeners as they are attached and fails any that landed on something the keyboard cannot focus; and it asserts the focus ring, the motion block, `aria-pressed` on every rendered chip, and the live regions.

**Known gap: text inside the charts.** `svg .tick` is 9 px in the chart's own coordinates, and the SVG is drawn with `width="100%"` against a 640-unit `viewBox`, so it scales with its container. In a report sheet on a phone (≈ 340 px of content) that is about 4.8 CSS px, and on paper about 7.3 pt. It fails both floors. It cannot be fixed by changing the number: text that scales with the graphic cannot hold a fixed pixel floor across the roughly 2× range between a phone and a printed page — a size that clears 12.5 px on the phone is over 25 px on paper. The fix is to take the labels out of the SVG and lay them out in HTML around it, and until that is done the charts are exempted from the check explicitly rather than silently.

Screen-reader testing on iOS and Android is still outstanding, and no automated check substitutes for it.

## Performance budget

Initial load ≤ 150 kB compressed for the PWA including all modules. If a module pushes past that, lazy-load its `tools` and `reports` renderers; `today` fields and `library` entries stay eager because first run needs them.

Enforced by `scripts/check-budget.mjs`, which runs in CI after both builds. It counts what `dist/index.html` actually asks the browser for, gzipped, and reports the service worker's precache and the single file separately rather than budgeting them. A budget nobody measures is a sentence in a document, and this one can only be broken by a module that was fine on its own.

## Internationalisation

Not in the first milestones, but every user-facing string lives in a per-module `strings.ts` from the start so the move to a string table is mechanical. Clinical report wording is treated as reviewed text and changes go through review.

## Release

Tag, CI builds both outputs, attach `adnotia.html` to the release, deploy `dist/` to the static host. `CHANGELOG.md` records user-visible changes and every migration.
