# ADR-027: Chart labels stay inside the picture, and everything they say is also in words

Status: accepted · September 2026 · Amends `05-architecture.md`

## Context

`05-architecture.md` says "text never below 12.5 px on screen; print never below
7.5 pt". The accessibility audit in Milestone 8 found one thing that breaks it
and cannot be fixed by changing a number.

Chart tick labels are `font-size: 9px` in the chart's own coordinates. The SVG is
drawn with `width="100%"` against a 640-unit `viewBox`, so everything in it
scales with the container. In a report sheet on a phone — around 340 px of
content — the scale is 0.53 and a label renders at about 4.8 CSS px. On paper the
scale is about 1.09 and it renders at about 7.3 pt. It is under both floors.

Raising the number does not work, and this is the part worth writing down.
Because the text scales with the graphic, its rendered size is fixed by the ratio
of container width to `viewBox` width, and that ratio differs by roughly 2×
between a phone and a printed page. A size that clears 12.5 px on the phone is
over 25 px on paper. There is no single number that satisfies both, and there is
no CSS that exempts text from a `viewBox` transform.

Three options were considered.

**Move the labels into HTML around the SVG.** Correct, and permanent: HTML text
does not scale with the graphic, so one declaration holds at any width. It means
laying out three charts' labels in a grid or with computed percentage offsets,
because two of the three place labels against row positions computed inside the
SVG.

**Render the SVG at a fixed pixel width inside a scrolling container.** Also
correct, and much smaller. It makes the report sheet — which is otherwise fluid,
and is a preview of a printed page — the one thing on the screen that scrolls
sideways on a phone.

**Treat the chart as a graphic and require its content to exist in words.** This
is what `07-design-system.md` already assumes for the plain-text export: "charts
replaced by a bracketed note". A note is only acceptable there because the report
says the same things in prose and tables.

## Decision

The third, made conditional and then made true.

Chart labels stay inside the SVG. In exchange, no figure a chart plots may be
available from the picture alone: every chart carries an `aria-label` describing
what it shows, a legend in body text below it, and its content stated in words in
the same section of the same report.

That was asserted before it was checked, and checking it found it false for one
of the three. The severity grid sits directly above a table carrying every row
label, the days each was reported, the worst rating and the count. The day
timeline is paired with the shared day table under ADR-013, and its own legend
names the axis: "Each row is one day, running from 6pm to 6pm." The dose chart
had nothing. Its plain-text export carried the summary sentence — how many days,
from when to when, across how many dose levels and which — and the HTML report,
the one that is printed and handed to a clinician, carried the chart and a
heading. So a prescriber reading the printed report had the dose levels only as
7-point marks inside the picture.

That section now renders the same sentence it exports.

## Consequences

The floors in `05-architecture.md` gain a stated exception rather than a silent
one: they govern HTML text, and text inside a chart is exempt on the condition
above. `tests/kernel/a11y.test.ts` excludes `svg` selectors from the screen floor
and says why in the same place.

The condition is now the thing to hold, so it is tested rather than described. A
chart section that draws a figure it does not also state is a regression, and the
test that catches it is worth more than the one that measured the font size.

This is a decision about a graphic, not about text. It does not licence small
type anywhere else, and it is the only exemption in the accessibility rules.

If a chart is ever added whose content genuinely cannot be stated in words, this
decision does not cover it, and the labels move into HTML.
