# Adnotia

Free, open-source tools for adults with ADHD and for parents of children who may have it. Built on interventions with published evidence and honest about how strong that evidence is.

Everything runs in your browser. Nothing is sent anywhere. There are no accounts, no analytics, no advertising and no paid tier.

## Status

Unreleased development build. The Adult space has working medication and sleep
logs, history and descriptive reports. Foundations and medication-log parity are
still in progress; passing tests do not mean the launch-readiness reviews are
complete. See [the roadmap checkpoint](docs/08-roadmap.md#implementation-checkpoint).

## Available now

- Opt-in medication and sleep logs. Medication eligibility is asked before
  enabling the log. Today supports past-day editing and automatic sleep duration
  that preserves manual answers.
- Records, report range selection, appointment questions, print and text export.
- Settings for module enable/disable, ordering, separately confirmed data
  deletion, and switching between spaces. Disabling a module keeps its records.
- Optional passcode encryption, set/change/remove controls, and Lock now. An
  encrypted backup must be generated before changing passcode settings.
- Backup export and merge-restore, visible save failures and retry, encrypted
  legacy import, and stale-tab conflict detection.
- PWA and self-contained HTML builds from the same source.

The Family space is currently an empty shell, not a working set of parent or
child tools. Planning tools, screeners, the complete Library, and launch reviews
remain unfinished. The medication log is not yet certified against the
roadmap's full report/history/text-export parity requirement.

## Data and passcodes

Data belongs to this browser and origin. Opening another host or the single-file
build starts a separate store; move records using backup and restore. Clearing
browser data deletes the local records.

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

## What it will do

- **Adult space.** A daily check-in assembled from the tools you turn on. A medication log, if you take medication, that produces a one-page report for your prescriber: what you recorded, side by side, with no conclusions drawn for them. Planning tools derived from CBT for adult ADHD. Sleep. Mindfulness, labelled honestly as promising rather than proven. A Library explaining the evidence behind every tool, and behind the things deliberately left out.
- **Family space.** For parents and carers: a validated screening form to help decide whether to seek an assessment, an observation log to prepare for it, and tools drawn from behavioural parent training. A small, visual surface a parent can hand to a child. No medication tracking for children, by design.

## What it will never do

Recommend a dose. Diagnose. Score your credibility. Send your data anywhere. Show ads. Charge money. Use streaks or guilt. See `docs/03-scope.md`.

## Running it

Requires Node.js 24 or newer.

```sh
npm install
npm run dev
```

`npm run build` produces the installable web app. `npm run build:single` produces one self-contained HTML file you can keep, email or host yourself.

```sh
npm run check
npm test
npm run build
npm run build:single
```

The checks cover types, the no-network audit and token contrast. Tests cover
kernel and module behavior, including passcode flows, restore, eligibility,
module management, date selection, and space switching. They do not replace
real-device accessibility, printed-layout, citation, or clinical review.

## Contributing

Read `docs/00-start-here.md`. Every module needs a Library entry with an evidence tier and citations before it can be merged. Changes to scope go through a decision record.

## Licence

AGPL-3.0. See `LICENSE`.
