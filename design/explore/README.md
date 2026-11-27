# Ten directions for the phone app

November 2026. Drawn after the owner set aside the Bookmark Edition (ADR-045) with "the design is not what I really want". The palette in ADR-045 was liked; the look was not. Nothing here is decided, and ADR-045 stands until a direction is chosen and recorded in a new ADR.

## What this is

Ten design directions, each a board of three phone screens at 390 × 844 with the same content in all ten: Today, a task opened, and focus, on the task "Write the school email", step 2 of 3, 18 minutes left of 25. Same content makes them comparable. Only the design differs.

- `index.html` is the gallery, in ranked order.
- `contact-sheet.jpg` is all ten on one image.
- `<slug>.html` is each board, and `shots/<slug>.png` is its render at twice the size.
- `RESEARCH.md` is what the four research sweeps found, which the directions were briefed from.
- `JUDGING.md` is every judge's notes on every direction, and what each polish pass left unfixed.

## How they were made

1. Four research sweeps, one each on Apple's current design language, Google's Material 3 Expressive, the best-regarded planning and focus apps, and the best-regarded calm and wellbeing apps.
2. A director chose ten directions that differ from each other as much as possible. Four use the owner's charcoal and terracotta. None is editorial or led by a serif, because that is what was rejected.
3. Each direction was built and rendered by one agent, which iterated on its own screenshots, then reviewed and fixed by a second agent that had not built it.
4. Three judges scored every board out of ten through one lens each: modern, intuitive for an adult with ADHD, and distinct enough to be the brand.

The judges are agents, not people, so the scores are a first sort.

## Ranked

| | Direction | Idea | Colour | Modern | Intuitive | Distinct | Average |
|---|---|---|---|---|---|---|---|
| 1 | Lantern | A dark canvas lit by the current step alone in very large type, with one terracotta bar burning down beneath it. The rest of the day waits in a drawer. | Owner's | 9 | 8 | 6 | 7.7 |
| 2 | Level | The screen is the timer: a pool-blue plane fills the display and drops like a water level as the minutes pass. | Its own | 7 | 5 | 9 | 7.0 |
| 3 | Deck | The day is a hand of cards. The running task is the top card, the next ones fan out beneath, and "Not now" sends a card to the back. | Its own | 8 | 6 | 6 | 6.7 |
| 4 | Roundels | Every task is a disc holding a drawn picture, inside a ring that is its length. | Its own | 6 | 7 | 7 | 6.7 |
| 5 | Glasshouse | Close to native iOS. The running task rides in a "Now" capsule docked above the tab bar on every screen. | Owner's | 7 | 9 | 2 | 6.0 |
| 6 | Quarters | The day is four bands of colour, and the screen takes the colour of the part of the day you are in. | Its own | 6 | 5 | 7 | 6.0 |
| 7 | Strata | Today is one column where length is time, and the running item is the only filled shape. | Owner's | 5 | 7 | 5 | 5.7 |
| 8 | Halo | The day is a clock face, with the running task as a terracotta band shrinking from now. | Owner's | 5 | 4 | 8 | 5.7 |
| 9 | Nightline | A dark departures board: one line per item, and every status said in words, such as "next in 25 min". | Its own | 4 | 8 | 3 | 5.0 |
| 10 | Springform | Material 3 Expressive, where shape shows state and the thing to press is always the biggest button. | Its own | 5 | 6 | 2 | 4.3 |

## What the judges agreed on

- **Lantern is the strongest all round,** and the best use of the owner's palette. Its weakness is that Today and Focus look almost the same, and the rest of the day is hidden in a drawer, which for this audience risks out of sight, out of mind.
- **Glasshouse is the easiest to use and the least distinctive.** It answers what now, what next, how to capture and how long left in the same place on every screen, and it looks like stock iOS.
- **The most distinctive ideas are in other colours.** Level, Roundels and Quarters would need redrawing in charcoal and terracotta before they could be judged against the owner's palette fairly. Halo is the most distinctive one already in it, but its Today dial is hard to read.
- **Things that failed across several directions:** visuals that need decoding (Halo's dial, Level's glass, Springform's shapes, Deck's colours), the capture button moving between screens, and anything placed above "now" on Today.
- **No direction shames.** None has overdue marks, missed counts or streaks.

Parts can be combined. Glasshouse's fixed "Now" capsule and capture button would fit inside Lantern, for instance, and Nightline's "next in 25 min" wording would fit anywhere.

## Fonts

Each board loads its typeface from Google Fonts when opened, so the boards need a connection and the PNGs are the record. Every face named is under the SIL Open Font License. The app itself would bundle its font and make no request, as the boards say.
