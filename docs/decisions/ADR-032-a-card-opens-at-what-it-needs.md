# ADR-032: A card opens at what it needs

Status: accepted · September 2026 · Amends `07-design-system.md`, follows ADR-031

## Context

ADR-030 changed which screen the app opens on. ADR-031 made the day's record show
what already happened, so a module that asks no question could appear there at
all. Neither touched the shape of the check-in itself.

The medication log declares thirteen `today` fields — six of them already marked
`optional` — and the assembler rendered all thirteen at once. So the day's record
still read as a dose form: seven questions a person must answer, then six more
they usually will not, stacked in one card above everything else.

`01-module-contract.md` already fails "a field shown unconditionally that most
people leave blank" on review. The rule existed; there was nowhere to put the
answer.

There was also a defect underneath it. The check-in budget offers to hide the
optional questions across every card, and it hid them whether or not they held
anything. A person who recorded an onset time at ten in the morning and pressed
that button in the evening had their own record taken off the screen, with no way
to see or correct it.

## Decision

**A card opens at its required fields and keeps the rest behind one disclosure.**
Optional fields that are unanswered go behind a native `<details>`, whose summary
says how many there are and that they may not apply — "6 more questions, if they
apply". Native, so it is keyboard-operable and needs no script.

**Nothing answered is ever put away.** An optional field holding a value — today's
or one carried forward — stays open. A card whose optional fields are all filled
in shows no disclosure at all, because there is nothing left to fold.

**A card with nothing open shows everything.** The kernel's own "What actually
happened" is two optional fields and nothing else; folding it would hide a
two-question card behind a heading and cost a click for nothing. A card with no
opening has no opening to keep short.

**The budget's hide control now respects values too**, on the same reasoning. It
was a bug, and it is the same rule expressed in the one other place that hides a
field.

This is presentation. No contract change, no new field, nothing modules do
differently.

## Consequences

The medication card opens at seven fields instead of thirteen: what you take, the
dose, the units, when you took it, how the day went with taking it, and the two
scales. Coverage and body detail are one tap away and say what they cost before
you open them.

Sleep opens at two instead of five. Planning, "What actually happened" and
"Notes" are unchanged, because each is entirely optional and now shows itself
rather than folding.

The counted summary is deliberate. "More" tells a person nothing about whether it
is worth opening; "6 more questions, if they apply" tells them the size and the
likelihood in five words, and "if they apply" is the honest framing — these are
questions that often will not.

Driving the built file is what caught the all-optional case. The change looked
right in tests and turned three small cards into headings with a disclosure and
no content, which is worse than the problem it was solving.
