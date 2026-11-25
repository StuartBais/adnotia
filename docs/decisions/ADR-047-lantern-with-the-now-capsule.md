# ADR-047: Lantern, with the Now capsule

Status: proposed · November 2026 · The owner chose this direction; the board
that develops it is waiting for their confirmation. When accepted, it
supersedes ADR-045's direction and type and keeps ADR-045's palette.

## Context

ADR-045 chose the Bookmark Edition, and the benchmark prototype was built in it
so the owner could try it (`src/bench/`, at `/bench/` on the site). The owner
tried it and set it aside: "Not sold", and then "the design is not what I
really want". The palette was liked. The look was not.

Ten new directions were drawn (`design/explore/`). Each was briefed from four
research sweeps, built and reviewed by two different agents, and scored by
three agent judges. The judges are agents, not people, so the scores were a
first sort and nothing more. The owner looked at all ten and chose:

> Lantern, but with Glasshouse's pinned now capsule.

Lantern ranked first overall. Its weaknesses were that Today and Focus looked
almost the same, and that the rest of the day was hidden in a drawer, which
risks out of sight, out of mind. Glasshouse was the easiest to use and the
least distinctive. Its idea was a "Now" capsule docked above the tabs on every
screen, which answers what is happening now and how long is left, in the same
place wherever the person is.

`design/lantern/` develops the combination: a specification (`SPEC.md`), a
board of phones and the Lock Screen (`board.html`), and their renders
(`shots/`). It was written, drawn, and judged through several rounds by agents
for faithfulness to the owner's words, ease of use for an adult with ADHD, and
craft.

## Decision (proposed)

**The direction is Lantern, with the Now capsule.**

- **Today is the lantern.** A dark charcoal canvas is lit by one sentence: the
  step the person is on, in very large white type. One terracotta bar burns
  down beneath it, with the minutes in words ("18 min left of 25 · ends
  10:23"). The rest of today waits on a light stone drawer below, folded to
  one Next line that is always visible.
- **Everywhere else, the same step travels as a capsule.** On Tasks, Routines,
  Library, Me, a task opened and the open drawer, the step is folded into a
  charcoal capsule holding the step, the bar and the minutes left. One tap
  opens Focus. The capsule is hidden wherever the lit step is already on
  screen, and when nothing is running.
- **The capsule has one fixed place.** It sits on a dock line above the drawer
  and the tabs, with the capture button beside it, the same on every screen.
  Capture is one tap from anywhere and never moves.
- **Focus is told apart from Today.** Focus has no tabs and no drawer, a bar
  that runs the full width, "+5 min", and a context line that names it.
- **Outside the app it is the same object.** The Lock Screen Live Activity and
  the Dynamic Island carry the step, the bar and the minutes, with Step done
  available without unlocking.

**The palette is ADR-045's, with charcoal promoted.** In the Bookmark Edition,
charcoal was ink on white paper. Here it is the ground of the present: Today,
Focus, the running task's page, the capsule and the Live Activity. Stone holds
the rest of the day. Lantern's ash, and mixes of ash over charcoal, carry
secondary text and controls on the dark ground. The measured ratios include
white on charcoal 15.3, ash on charcoal 6.9, terracotta on charcoal 6.3,
charcoal on stone 13.4 and muted on stone 5.9. Terracotta is never text on a
light ground and never carries white text. The full token table, with every
pairing measured, is section 7 of the specification.

**Type is one sans face, and the serif is gone.** The board uses Instrument
Sans (SIL Open Font License, variable width and weight). It is proposed, not
confirmed. The app will bundle the font file with its licence beside it and
make no request for it.

**The rules from the product brief stand.** They came from guidance and
findings rather than taste:

- time is a bar, a number and an end time;
- the step outranks the clock;
- capture never loses a person's place;
- there is no red, no "overdue", no count of what was not done, and no streak;
- nothing is carried by colour alone;
- text contrast is at least 4.5:1, measured from pixels;
- touch targets are at least 44 pt;
- a screen offers no more than five main choices.

The specification shows each of these screen by screen.

## Still the owner's to decide

- **Charcoal or white for the other places.** Tasks and a task's page are drawn
  both ways (3a and 3b, 6a and 6b). Charcoal leads, because it is Lantern as
  chosen. White makes the capsule the one dark thing on screen.
- **How the app behaves.** Section 14 of the specification lists each decision
  with a proposed answer:
  - what happens to a timer that is left running;
  - how long Undo stays;
  - where a timed item goes when its slot passes;
  - whether starting a routine stops the running task;
  - whether the time box belongs to the task or the step.
- **The typeface.**

## What this is not

- It is not a claim that a dark screen, this palette or this typeface helps
  attention. The research found no evidence that any of them does, and the
  Library and the store listing must not say so.
- It has not been tried on a phone or with a screen reader. The board is a
  drawing, and the judges who scored it are agents.
- It is not a finished design system. The specification lists the screens it
  describes but does not draw, and the things it leaves out on purpose.

## Consequences

- The benchmark prototype is rebuilt in this direction, so the owner can hold
  it rather than look at a picture of it. It stays plain web code under its own
  storage key, linked from nowhere, and building it commits to nothing,
  including how the phone apps are built (`09-product-brief.md`, "The phone").
- When this record is accepted, the Design section of `09-product-brief.md` is
  rewritten from the specification, and `CLAUDE.md` points here instead of at
  ADR-045. Until then the brief carries a note pointing here.
- The design boards in `design/` load their typefaces from Google Fonts when
  opened, and the PNGs are the record. Nothing in `design/` is built or shipped,
  and the app makes no request.
