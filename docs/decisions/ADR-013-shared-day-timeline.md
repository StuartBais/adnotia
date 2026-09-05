# ADR-013: The shared day timeline

Status: accepted · September 2026 · Extends `01-module-contract.md` "reports"

## Context

`reference/README.md` records a decision from the contract exercise:

> The cover chart is drawn by the kernel from medication and sleep data together,
> not by the medication module alone.

In the monolith the chart was easy, because one file owned everything: one row
per day on a 6pm-to-6pm clock, with the night's sleep as a grey band, the hours
the medication was working as a solid one, vertical ticks for doses taken and a
dot for rebound. Splitting sleep into its own module took that away. The chart
draws from two modules and belongs to neither.

`05-architecture.md` says the report context carries "the dose grouping helpers
the medication module exposes so shared visuals can be drawn by the kernel from
medication and sleep data together". Read literally that puts medication
vocabulary — onset, wore off, rebound — inside the kernel, which ADR-012 has just
finished keeping out of it.

Three options.

1. **Medication draws it, reading sleep through its declared dependency.** The
   dependency mechanism allows this and it would work today. Rejected: it
   contradicts the reference note, and it makes the chart the property of one
   module, so a future module with something to put on a day's row would have to
   ask medication's permission to appear.
2. **The kernel reads both modules' day records directly.** Rejected for the
   reason above: the kernel would have to know the field names.
3. **Modules contribute marks; the kernel draws.** Accepted.

## Decision

`Contributions` gains `timeline`:

```ts
timeline?: {
  parts: (day) => { bands?, ticks?, marks? };  // sees only its own day record
  legend: string;                              // its half of the sentence below
  weight: number;                              // lower draws first, underneath
}
```

- The engine walks the enabled modules in `timeline.weight` order, calls `parts`
  with each module's own day record for each date in range, and merges what comes
  back into one row per day. Rows with nothing on them are dropped, so a gap in
  the record is absent rather than drawn as an empty stripe.
- The rows and the joined legend arrive on `ReportContext` as `timeline` and
  `timelineLegend`. The kernel's own `kernel.timeline` section draws them.
- Weight orders the drawing, not just the legend: sleep is weight 10 because its
  band is the widest thing on a row, and a narrower band drawn underneath it
  would disappear.
- **No dependency is declared or needed.** Sleep does not know medication exists,
  and medication does not know sleep does. Each speaks only for its own data.

The drawing itself lives in `src/kernel/ui/charts.ts` with the other design-system
primitives, because `07-design-system.md` is where the chart palette is specified
and `print.css` is what maps it to greys. The primitives are generic: a band, a
tick, a mark, a cell. Nothing in `src/kernel/ui/charts.ts` knows what a dose is.

## Consequences

- The chart is genuinely drawn by the kernel from both modules together, which is
  what the reference note asked for, by a route the note did not anticipate.
- A third module — an exercise log, say — appears on the chart by adding a
  `timeline` contribution and nothing else.
- A module can put a band on a row without any section of its own, so the chart is
  not evidence that a module contributes to the clinical report. The engine still
  filters contributors by the report's audience, so a Family-space module cannot
  reach the adult chart.
- Medication keeps `dependencies: ['sleep']`, but now only for the two places that
  genuinely need another module's numbers: the waking-day figure in "where things
  stand" and the sleep line in "how each dose performed".
- The band-clipping rule is the kernel's: a band whose end falls before its start
  once rotated onto the row is not drawn at all. Silently drawing it wrapped would
  put a person's sleep in the wrong half of the day, which is worse than an
  absence a reader can see.
