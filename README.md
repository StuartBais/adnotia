# Adnotia

Free, open-source tools for adults with ADHD and for parents of children who may have it. Built on interventions with published evidence and honest about how strong that evidence is.

Everything runs in your browser. Nothing is sent anywhere. There are no accounts, no analytics, no advertising and no paid tier.

## Status

Pre-code. The design documents in `docs/` are complete drafts; the code is being built against them milestone by milestone. See `docs/08-roadmap.md`.

## What it will do

- **Adult space.** A daily check-in assembled from the tools you turn on. A medication log, if you take medication, that produces a one-page report for your prescriber: what you recorded, side by side, with no conclusions drawn for them. Planning tools derived from CBT for adult ADHD. Sleep. Mindfulness, labelled honestly as promising rather than proven. A Library explaining the evidence behind every tool, and behind the things deliberately left out.
- **Family space.** For parents and carers: a validated screening form to help decide whether to seek an assessment, an observation log to prepare for it, and tools drawn from behavioural parent training. A small, visual surface a parent can hand to a child. No medication tracking for children, by design.

## What it will never do

Recommend a dose. Diagnose. Score your credibility. Send your data anywhere. Show ads. Charge money. Use streaks or guilt. See `docs/03-scope.md`.

## Running it

```
npm install
npm run dev
```

`npm run build` produces the installable web app. `npm run build:single` produces one self-contained HTML file you can keep, email or host yourself.

## Contributing

Read `docs/00-start-here.md`. Every module needs a Library entry with an evidence tier and citations before it can be merged. Changes to scope go through a decision record.

## Licence

AGPL-3.0. See `LICENSE`.
