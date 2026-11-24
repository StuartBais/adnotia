# ADR-045: The Bookmark Edition, in charcoal and terracotta

Status: accepted · November 2026 · Supersedes ADR-028 and ADR-029; settles the
design item ADR-043 left open

## Context

ADR-043 said the design would be rebuilt from research and not restyled, and
left the design system undecided. The research found no evidence that any
colour, typeface or dark mode helps people with ADHD, so the look is a choice
of identity, made on taste and held to the rules that do have support: few
choices on a screen, short paths, memory and time made visible, and nothing
carried by colour alone.

Ten directions were drawn: three sketches by the author of this record, and
seven by a second model working from its own research (`design/mockups/`, pull
requests #5, #6 and #7). The owner looked at all of them.

## Decision

**The direction is the Bookmark Edition** (`design/mockups/bookmark-edition.html`,
pull request #6): a printed daily edition. The running task is the headline in
large serif type, minutes are drawn as tally marks beside a literal count, and
a numbered bookmark holds a person's step while they capture a stray thought
and brings them back to the same sentence. It was chosen over the others
because it is the only one that designs the interruption, and capture without
losing your place is the want the research found the most direct support for.

**The colours are not the ones it was drawn in.** The owner rejected the plum,
yellow and pink, and chose a palette taken from the first build's sage,
terracotta and stone, so the mark and the site still belong to it:

| Role | Value | Used for |
|---|---|---|
| Ink | `#222624` | Text, and whole panels with light text on them |
| Paper | `#FFFFFF` | The main surface |
| Accent | `#F28C5E` | The bookmark, labels on ink; dark text sits on it |
| Stone | `#EEF0EC` | Capture and task detail |
| Sage tint | `#DFE9E0` | Family |
| Muted ink | `#595C5B` | Placeholders and secondary text on paper |

Ink on paper is 15.3:1, on the accent 6.3:1, on stone 13.4:1, on the sage tint
12.3:1, and muted ink on paper 6.8:1. The accent is lighter and more orange
than the logo's terracotta because dark text has to sit on it, and the logo's
own value gave about 4.1:1.

**Type** stays as drawn for now: a serif for the task, the instruction and the
numbers a person reads, and a sans for controls and context. The mock-up uses
Fraunces and Public Sans. The owner has chosen the look and not yet these two
faces; they are to be confirmed, with their licences, before a font file is
bundled. Font files are permitted since ADR-043.

**Pocket Props' drawn pictures** are kept for the child's first/then view, as
the Bookmark Edition's own Family screen already does.

## What this is not

- It is not a claim that this look helps attention. The Library and the store
  listing must not say so.
- It is not a finished design system. It is one direction, five screens and a
  palette. Icons, motion, the full type scale, large-text behaviour and a dark
  scheme are still to do, and none has been tried on a phone or with a screen
  reader.
- The first build's rule that the serif appears only on the clinician's sheet
  (ADR-029) is gone. The serif is now the app's voice.

## Consequences

- `07-design-system.md` no longer describes what is being built. The product
  brief carries the new tokens until a design system document replaces it.
- The contrast check in `npm run check` reads the first build's token table. It
  stays as it is while the first build is the code in `src/`, and gets the new
  table when the new interface has a stylesheet.
- Pull request #7 (Ribbon, Ledger, Beacon) overwrites the files of the three
  merged directions. It is not the chosen direction, and merging it would
  delete them.
