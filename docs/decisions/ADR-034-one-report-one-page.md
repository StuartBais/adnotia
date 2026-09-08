# ADR-034: One report, one page

Status: accepted · September 2026 · Amends `05-architecture.md`, follows ADR-030

## Context

The clinical report sat at the bottom of the Records tab: your own history, one
card per module, and then — on the same scroll — the whole document a person
hands to a prescriber, with its range selector, its Print and Copy buttons, and
the screen-only mirror.

Every other named report already opened on a page of its own. `screening` and
`observations` are reached from the Family area index as `linkRow`s. The clinical
report was the only one that was not a destination, and it was the one that
matters most: it is the artefact that leaves the device.

Mixing the two also blurs what Records is for. A person opens Records to look
back at their own days. A report is a thing you make deliberately, for somebody
else, at a moment you choose.

## Decision

**Every named report opens on its own page, the clinical one included.** It is
reached from its module's area — "Medication and body" — beside the day's log and
the history:

```
Today's log              Fill in
What you have recorded   Look back
For an appointment       Open →
```

Records goes back to being only a person's own history.

**The route is named for the errand, not the document.** The report is titled
"Daily record" (ADR-017) and that is what the letterhead prints. In a list beside
"Today's log" and "What you have recorded", a third similar phrase says nothing
about which is which — so the row and the page are called "For an appointment",
and the document keeps its own name on the paper.

**One report per page is a print rule, not a preference.** `print.css` shows
every `.sheet`, so two reports on one screen come out of the printer as one
document. A test walks every tab and asserts at most one sheet is ever on screen.

## Consequences

The move broke no test, and that is the finding worth recording. Nothing in the
suite asserted the clinical report was reachable from the interface at all —
`mountReport` was covered in isolation, and the route to it was covered nowhere.
A document could have been unreachable in a shipped build and every gate would
have been green. There are now tests for the route itself: two taps from the
index, absent from Records, and never two sheets on a screen.

Building this surfaced a second defect that predates it. A named report opens as
an off-tab page, and the page's Back button and title heading were not marked
`noprint` — so printing a report put a Back button and a second copy of the title
above the sheet's own letterhead. That has been true of the Family reports since
they were built. Both are `noprint` now.

The Records route was considered and dropped. Two ways into one page is two
things to keep consistent, and the area index is where a person browses by what
they are trying to do.
