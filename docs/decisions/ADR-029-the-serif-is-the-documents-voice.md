# ADR-029: The serif is the document's voice, the sans is the interface's

Status: accepted · September 2026 · Amends `07-design-system.md`, follows ADR-028

## Context

ADR-028 moved the palette off cream and made sage the accent, because the old
combination read as a well-known AI company's brand. It left the other half of
that signal in place: an old-style serif — Iowan Old Style, falling back to
Palatino — setting the masthead, every card heading, the page titles, the
calendar month, the Library headings, the history labels, and the child's timer.

Fourteen rules used it. Twelve were interface. Two were the printed report.

That ratio is the finding. A face chosen for the register of a printed document
was doing almost all of its work on screens, where it was the loudest remaining
piece of an identity that was not ours.

The constraint is unchanged and absolute: **no font files.** `05-architecture.md`
allows only system stacks, and CLAUDE.md's first hard rule forbids an external
font URL. So this is a question of which system faces, and where.

## Decision

**The serif is reserved for the report sheet.** The token is renamed `--serif` →
`--doc-serif`, named for where it is allowed rather than for what it is, and a
test asserts that exactly two selectors use it: `.sheet h2` and `.sheet h3`.

Everything else takes the sans. What the serif did by its shape, the sans now
does by weight and tracking: 600 on the masthead, page titles, card headings, the
history label, the calendar month and the child surface, with negative letter
spacing from −0.012 em at 15 px to −0.023 em at 30 px. A system sans set at 30 px
and weight normal reads as an operating system dialog, and a test catches a
heading that goes back to normal.

**The serif itself changes**, from `Iowan Old Style, Palatino Linotype, Palatino,
Georgia` to `Charter, Bitstream Charter, Cambria, Noto Serif, Georgia`. Charter
resolves on Apple systems, Cambria on Windows, Noto Serif on Android, Georgia
everywhere else. All four are sturdier and quieter than a warm old-style, and
Charter was drawn by Matthew Carter to hold up on low-resolution printers — which
is exactly what happens to a report a person prints at home and carries to an
appointment.

## Consequences

The distinction is now a rule somebody can hold in their head, and it is honest:
the serif marks the one artefact that leaves the screen. A new heading gets the
sans without anybody having to decide, and if someone reaches for the serif on a
button the test says no.

The app is quieter. That is the intended direction — it is a notebook you take to
a doctor, not an essay — but it is a real loss of warmth on screen, and it is
worth saying so rather than pretending the change is free. The warmth that
remains is in the mark, the sage, and the off-white ground.

The child surface loses the serif too, and gains from it. Large old-style
numerals on a countdown are harder for a young reader than a heavy sans at the
same size, and `docs/05-architecture.md` already sets that surface at ≥ 16 px with
48 px targets for the same reason.

Nothing here is a claim about legibility for ADHD specifically. As with the
palette in ADR-028, there is no good evidence that a typeface choice helps
attention, and the ordinary rules — size floors, line height, contrast, no font
files to fail to load — are what the accessibility section actually holds.
