# Lantern with the Now capsule

November 2026. The owner looked at the ten directions in `design/explore/` and chose "Lantern, but with Glasshouse's pinned now capsule". This folder develops that choice. It is a drawing, not a decision: ADR-045 stands until the owner confirms this direction and a new ADR records it.

## The idea

A dark charcoal canvas lit by one sentence, the step you are on, in very large white type, with one terracotta bar burning down beneath it. Everywhere else, that sentence travels folded into a charcoal Now capsule that names its task. The capsule sits in a fixed slot above the drawer and the tabs, with the capture button beside it, one tap from Focus on every screen. Charcoal means now, and the stone drawer holds the rest of today.

## What is here

- `board.html` is the board: a header showing the capsule at every size, thirteen phones at 390 × 844 (Today running and paused, the rest of today, a task opened in charcoal and in white, Focus, capture, Tasks in charcoal and in white, nothing running, nothing planned, the running task's page and Routines) and the Lock Screen strip.
- `shots/board.png` is its render at twice the size, `shots/NN-*.png` is each phone on its own, and `shots/10-live-activity.png` is the strip outside the app.
- `SPEC.md` is the full specification the board was drawn from: the capsule's rules, every screen top to bottom, tokens with measured contrast, type, components, motion, accessibility, what was left out, and the decisions the design depends on (section 14).

## How it was made

1. Three agents each proposed a way to combine the two: keep Lantern and carry the step as a capsule; make the lantern and the capsule one object at two sizes; or use the capsule to fix the judges' two complaints about Lantern. The complaints were that Today and Focus looked alike and that the day was hidden.
2. Three judges scored the proposals for faithfulness to what the owner asked for, ease of use for an adult with ADHD, and craft. "Lantern, carried" won, and the other two contributed grafts.
3. One agent wrote the spec, one built the board from it, and a second designer who had not built it reviewed and fixed it.
4. Judges scored the board through the same three lenses for three rounds, and in the fourth and fifth rounds a fourth judge also compared each phone with the round before and looked for anything that had broken. A fix pass followed every round.

The judges are agents, not people. The fifth round scored it 8.5 for faithfulness, 8.5 for ease of use, 8 for craft and 7.5 for regressions; this board is the fix pass after it (draft 6 of the specification).

## For the owner to choose

- **Charcoal or white for the other places.** Tasks and a task page are drawn both ways (3a and 3b, 6a and 6b). Charcoal is Lantern as chosen. White makes the capsule the one dark thing on the screen, so "what is now" reads faster.
- **The decisions in SPEC section 14.** Examples: what happens to a timer left running, how long Undo stays, and where an item goes when its time slot passes. Each has a proposed answer, and each is the owner's to confirm.
- **The typeface.** Instrument Sans, under the SIL Open Font License, as Lantern used. Not confirmed.

## Fonts

The board loads Instrument Sans from Google Fonts when opened, so it needs a connection, and the PNGs are the record. The app itself would bundle the font file and make no request.
