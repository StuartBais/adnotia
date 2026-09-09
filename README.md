# Adnotia

Free, open-source tools for adults with ADHD and for parents of children who may have it. Built on interventions with published evidence and honest about how strong that evidence is.

Everything runs in your browser. Nothing is sent anywhere. There are no accounts, no analytics, no advertising and no paid tier.

## Status

Unreleased. Milestones 0 to 7 and 9 of [the roadmap](docs/08-roadmap.md) are
built and their gates pass. Milestone 8, launch readiness, is partly done, and
what remains of it is mostly review by people rather than code. Passing tests do
not mean those reviews are complete. See
[the implementation checkpoint](docs/08-roadmap.md#implementation-checkpoint)
for the current position and [`CHANGELOG.md`](CHANGELOG.md) for what has
changed.

## What is built

### The Adult space

- **An index of areas**, not a list of modules: Focus and starting, Calm,
  Movement, Medication and body, and Preparing for an appointment. One card per
  area, an area page, and a tool on its own page. Two taps to anything.
- **Today, written as the day's record.** A check-in assembled from the tools
  you have turned on, opening at what it needs, plus a list of what already
  happened: the timer you ran, the walk you took. A missing day is a day
  missing, and that is all it says.
- **Medication log.** Dose, cover, side effects and the sleep beside them,
  carried forward from the nearest earlier day that had a value. Asked whether
  you take medication before it can be turned on. Off by default, like
  everything else.
- **Sleep.** Bed and wake times, a duration worked out for you that never
  overwrites an answer you typed, and how the night went.
- **Planning and getting started.** Break something down, work out how long it
  will really take, set out a day one line at a time, an if-this-then-that
  prompt, and a focus timer that runs stretches and breaks and keeps no count of
  any of it.
- **Mindfulness practice.** Three short practices, as words and a timer. No
  audio.
- **Moving.** A light log of what you did, without a target or a streak.
- **Preparing for an assessment.** A place to write down specific examples, so
  a first appointment is spent on your life rather than on trying to remember
  it.
- **The clinician's sheet.** One page for an appointment: a letterhead saying
  what the record is and that it is self-kept, how many days were logged out of
  how many, a day-by-day table, the cover chart, and print and text export. You
  read it before anybody else does; nothing is in it that you have not seen.
- **Records**, your own history by date.
- **The Library.** An entry for every module with its tier in plain words and
  its citations, entries for the things deliberately left out and why, and a
  page for the adult screener that says it is not offered yet, and why.
- **About**, and a crisis page one tap from every screen.

### The Family space

- **Child profiles.** A nickname and an age band. Nothing else about the child
  is asked for.
- **What we have noticed.** A dated note of specific things, from home and from
  school, printed as a list with a coverage line for an appointment. Nothing is
  scored.
- **Routines and the chart.** Parts of the day set out in order, a first and
  then, prompts for saying what you noticed, and a star chart you run yourself.
  Stars are earned and never lost, and the app never awards or reminds on its
  own.
- **For your child.** The screen you hand over: a timer, today's list, first
  and then, and their stars. No text entry, no settings, no links, and no way
  back out without the passcode.
- **Guidance pages.** What an assessment involves, if they are under six, if
  they are thirteen or older, and talking to the school. A parent-facing crisis
  page.
- **No medication in the Family space.** The registry rejects a dose field
  outside the Adult space. This is a decision, not a gap.

### The kernel

- Settings for turning modules on and off, ordering them, deleting a module's
  records as a separate confirmed step, and switching between spaces.
  Disabling a module keeps its records.
- An optional passcode that encrypts everything stored, offered at first run.
  Setting, changing or removing it later needs an encrypted backup generated
  first.
- Backup export and merge-restore with counts, import of a record kept by the
  original single-file version, visible save failures with retry, and refusal
  to save from a tab that has gone stale.
- Two builds from one source: an installable web app, with the welcome page at
  `/` and the app at `/app/`, and one self-contained HTML file.

## Still incomplete

- **Blocked on a person, not on code.** No evidence tier has been confirmed by
  anyone other than its author, which the rubric requires. No citation has been
  read against its original. The crisis numbers have not been confirmed against
  each organisation's own site. The paediatric guidance has not been read by a
  clinician.
- **The screeners are not offered.** The adult and parent screeners are built
  and tested against stand-in questions, and neither instrument ships, because
  both are copyrighted and permission to reproduce them has not been obtained.
  See [ADR-023](docs/decisions/ADR-023-the-screeners-are-not-ours-to-reproduce.md).
- Screen-reader testing on real iOS and Android devices.
- Release tagging, publishing both artefacts, and the live host.

## Data and passcodes

Data belongs to this browser and origin. Opening another host or the single-file
build starts a separate store; move records using backup and restore. Clearing
browser data deletes the local records.

Anything a browser stores can be read by an extension you have allowed to read
the pages you visit. That is true of every site, and no site can tell you which
extensions you have, so the app says so rather than pretending to check. With a
passcode set, such an extension finds an encrypted envelope in storage rather
than your record. Nothing can protect what is on the screen while the app is
open.

A passcode encrypts stored data, not an unlocked page. Reloading an encrypted
copy requires the passcode; Lock now saves pending changes before locking.
There is no passcode recovery. Keep an encrypted backup and its separate
passphrase. Encryption does not protect against a compromised host or code
running in an unlocked page.

When browser encryption is unavailable, passcode controls are unavailable and
the backup action explicitly offers an unencrypted file. Readable backup files
need private storage. A download being offered does not prove the file was kept
or can be restored; verify backups before relying on them.

If another tab changes the stored document, saving from a stale tab is refused
and its local changes remain available for backup. Cross-tab writes use Web
Locks where supported; without Web Locks, conflict detection is best-effort.
Do not edit the same records in multiple tabs at once.

## What it will never do

Recommend a dose. Diagnose. Score your credibility. Send your data anywhere. Show ads. Charge money. Use streaks or guilt. See `docs/03-scope.md`.

## Running it

Requires Node.js 24 or newer.

```sh
npm install
npm run dev
```

`npm run build` produces the installable web app in `dist/`. `npm run build:single`
produces `dist-single/adnotia.html`, one self-contained file you can keep, email
or host yourself.

```sh
npm run check          # formatting, types, the no-network audit, token contrast
npm test               # every suite, including parity against the original
npm run build
npm run build:single
npm run check:built    # the built output: the redirect, the worker, the manifest
npm run budget         # the performance budget, measured against the build
```

That is what CI runs on every push. `npm run shots` regenerates the welcome
page's screenshots from a real build; it needs Chromium and ImageMagick and is
not part of the build.

Tests cover the kernel and every module against its fixtures, parity with the
original single-file app, passcode and backup flows, cross-tab conflicts, the
Family space and the child surface, the wording the welcome page and About may
not use, agreement between citations of the same work, and the match between
the served headers and the page's own policy. They do not replace real-device
accessibility, printed-layout, citation or clinical review.

## Contributing

Read `docs/00-start-here.md`. Every module needs a Library entry with an evidence tier and citations before it can be merged. Changes to scope go through a decision record.

## Licence

AGPL-3.0. See `LICENSE`.
