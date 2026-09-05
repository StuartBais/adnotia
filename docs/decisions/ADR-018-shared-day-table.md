# ADR-018: The shared day-by-day table

Status: accepted · September 2026 · Extends `01-module-contract.md`, follows ADR-013

## Context

The monolith's report ends with a table of every day in the range: date, dose,
times taken, focus, mood, onset and wearing-off, rebound, sleep, side effects.
It is the section a prescriber turns to when a figure further up the page
surprises them, and the only one that lets them check an average against the days
it came from.

It reads from medication, from sleep, and from nothing else in particular. The
same argument ADR-013 made about the cover chart applies: a table that draws on
two modules belongs to neither, and giving it to one of them would mean any
future module wanting a column had to ask that module's permission.

## Decision

`Contributions` gains `columns`, a list of `DayColumn`:

```ts
{
  label: 'Dose',
  weight: 10,          // lower prints further left
  numeric: true,       // right-aligned, tabular numerals
  cell: (day) => '50mg',           // this module's own day record
  note: (day) => '23:30–07:00',    // optional smaller second line
  legend: 'Focus and mood are self-rated 1 to 5, where 5 is best.'
}
```

- The engine collects every enabled module's columns, sorts them by weight, and
  fills each row from that module's own day record. The kernel owns the table
  element, the ordering, the "Day" column and the em dash that means nothing was
  recorded. Columns return an empty string; they do not choose how emptiness
  looks.
- A row where every column is empty is dropped. An all-dash row says only that
  the person did not log that day, which the coverage line has already said once,
  in a form that does not take up a row.
- Legends accumulate in the same weight order, so the sentence under the table is
  assembled from the columns that are actually present.
- **No dependency is declared or needed.** Medication takes weights 10 to 60 and
  80; sleep takes 70 and lands between them. Neither module knows the other
  exists, and the monolith's column order falls out of two independent numbers.

## Why a column and not a row

A row-shaped contribution — "give me your line for this day" — was the obvious
alternative and is worse. It fixes the column count per module, so two modules
cannot share a heading or interleave; it makes the table's width a function of
which modules are on, so the same report changes shape between people in a way a
clinician cannot predict; and it puts the em dash inside each module, which is
how two modules end up spelling "nothing" differently.

## Consequences

- A third module joins the table by declaring a column and nothing else.
- `bodyLines` — the description of what the person reported about their body — is
  now shared by History and by this table, because two implementations of the
  same sentence is how the same day comes to read differently in two places.
- Cells are values, never arithmetic. The table's whole purpose is to be the
  thing the averages can be checked against, and a cell that had itself been
  averaged would defeat that.
- The Family space's `observations` report can reuse this when it arrives; the
  seam is not adult-only, though the engine still filters contributors by the
  report's audience.
