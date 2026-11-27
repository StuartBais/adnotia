# Lantern, carried

Design specification for the phone app · November 2026 · draft 6

This follows the owner's choice, in their words: "Lantern, but with Glasshouse's pinned now capsule." It starts from the proposal the judges favoured, "Lantern, carried", and adds the ideas they named from the other two proposals. Where a judge's idea and the owner's request disagreed, the owner's request won. Drafts 2 to 6 each apply a review of the board by the judges (three lenses, and from draft 5 a fourth that looks for regressions); where they disagreed, the owner's request came first and the person using the app second. Section 15 says where each part came from, where a graft was changed, and what drafts 2 to 6 changed.

Sources:

- `design/explore/lantern.html`: the direction.
- `design/explore/glasshouse.html`: the capsule.
- `docs/09-product-brief.md`: "Who it is for", "Structure" and "Design".
- `src/domains/tasks`, `src/domains/routines` and `src/domains/options/rewards.ts`.

The brief's Design section still describes the Bookmark Edition. The rules it gives as coming from guidance or findings still hold here. Its identity rules (serif headline, ruled lines, bookmark) do not. Nothing in this design is editorial or led by a serif.

A builder can draw the board from this document alone.

**Units.** Measurements are in points on a 390 × 844 screen (iPhone 15 and 16 size), with a 54 pt top inset and a 34 pt bottom inset. On the board, one point is one CSS pixel. y is measured down from the top of the screen and x across from its left edge.

---

## 1. The idea

The app is a dark charcoal canvas lit by one sentence. That sentence is the step you are on, in very large white type, with one terracotta bar burning down beneath it. Wherever else you go in the app, the same lit sentence goes with you, folded into a charcoal Now capsule that sits in one fixed place above the day and the tabs, so what you are doing now is always one tap away. Charcoal means now and stone is the rest of today.

The other places (Tasks, Routines, Library and Me) are drawn in charcoal, which is Lantern's own one dark app and is the default (3a, 6a and 9), and a task's page and Tasks are drawn again in white, as the alternative (3b and 6b). Which one ships is the owner's to choose (section 5.6). Nothing else in this document depends on that choice.

---

## 2. Drawing the board

### Layout

- **Ground:** `#E4E6E2`, used on the board only and never in the app.
- **Width:** 1944, with 60 of padding on each side, so four 414 columns with 56 between them.
- **Row 1:** phones 1, 2, 3a and 3b.
- **Row 2:** phones 4, 5, 6a and 6b, then a band of notes beneath them, 40 below the tallest caption:
  - under 4, a panel headed "Today and Focus, told apart" (section 5.4);
  - under 5, the capture sheet opened from Focus, at half size, cropped just below its field and fading out over the plain stone under it, so no line of text sits in the fade (section 5.5);
  - under 6a and 6b, one panel spanning both columns: "A choice for the owner: the other places in charcoal or in white" (section 5.6).
  - The two panels share the band's height, so their frames end on one line.
- **Row 3:** phones 7, 7b, 7c and 8: the three ways back after time away, then the running task's own page. Then a band, 40 below the tallest caption: one panel across all four columns, "Weighed, not overlooked" (section 5.7). Its label, heading and one line about testing stand over 7, and its text runs in three paragraphs over 7b, 7c and 8, each 366 wide and set 24 inside its phone's column, so the note sits as one band under the row it is about.
- **Row 4:** phone 9, Routines, in column 1. Then column 2: "After a tap", with four Next lines in their six seconds after a tap (section 9.8), each fading into the board at its foot rather than cut flat. Then "Outside the app" across columns 3 and 4: the Lock Screen phone, then a column with a short text, the Live Activity after its estimate, and the Android notification (section 6). The two text columns are set 12 inside their columns, on the captions' edge. No column of the board is left empty, and no row has vertical rules.
- 80 between rows, captions included.

The charcoal and white versions of a place sit side by side in columns 3 and 4 of rows 1 and 2, charcoal first, so the choice reads down two columns.

The notes panels have a 1 pt edge of 14% charcoal, an 18 radius and padding 20 and 24. Inside: a muted 13/18 label at 650, a charcoal 18/24 heading at 650, and #3F4341 14/21 text.

### Header

The left column is 1100 wide. Top to bottom:

- Eyebrow, muted 14/20, weight 600: "Adnotia · phone app · design direction".
- Title, charcoal 80/80, weight 700, tracking −0.035em: "Lantern".
- Under it, muted 30/36, weight 600, in the owner's words: "with Glasshouse's pinned Now capsule".
- The idea, in #2E3230 at 20/30 and weight 450, in two sentences: Lantern's own opening line and one about the capsule. "**A dark charcoal canvas lit by one sentence:** the step you are on, in very large white type, with one terracotta bar burning down beneath it. Everywhere else, that sentence rides folded in a Now capsule, one tap from anywhere, in the row that never moves." The bold part is charcoal at weight 650. The white or charcoal choice is left to its own panel.
- A row of swatches, each a 16 pt square with a 5 pt radius and a 1 pt inner edge of 14% charcoal, labelled in 13.5/20 at weight 500:
  - "Charcoal #222624 now, and the canvas"
  - "White #FFFFFF text on charcoal, and the places if chosen"
  - "Ash #A9AFAB on charcoal only"
  - "Terracotta #F28C5E time and capture"
  - "Stone #EEF0EC the rest of today"
  - "Sage #DFE9E0 done"
  - "Muted #595C5B on light only"
- A type note in 13.5/20: "**Instrument Sans**, SIL Open Font License, variable width 75–100 and weight 400–700, bundled in the app. Step 40/46 and 44/50 at 700; the idle sentence 32/38. Nothing below 12 pt, no weight under 400. Text measures 4.7:1 to 15.3:1 against the pixels under it." That range holds for every line of text on the board, the covered last rows and the half-size capture inset included. Measured from the render, the lowest is terracotta on the lifted capsule (4.72). The covered rows' darkest glyph pixels stay at 5.5:1 or more down to their baselines, and their rings at 5.3:1 at their foot (section 9.7). The inset is cropped above its fade (section 5.5), so its lowest line measures 5.5:1.
- 40 below the type note, the capsule's other states, under a heading in charcoal 17/22 at 650, "The capsule paused, over its estimate, and with a long name". Three capsules on the board ground, 268 × 64 and 16 apart, as on a white place:
  - paused: "Paused" in ash where Now was, "Write the question", the bar frozen in ash, and "18 min left · Write the school email" in white and ash;
  - over the estimate: "● Now  Write the question", the empty outline, "27 min so far";
  - a longer name giving way: "● Now  Find the old policy", its bar at 60%, "12 min left", the task "Renew the car insurance online" not shown.

  Labelled 16 below in muted 13/18, up to 1000 wide: "Paused is said in words where Now was, with the bar frozen in ash and the minutes in white. Over the estimate, the track is an empty outline and the time counts up; "27 min so far" leaves no room for the name, so the name gives way. A longer name gives way the same way: "Renew the car insurance online" does not fit beside "12 min left", so line 2 shows the minutes alone and the name stays in the spoken label. A name is shown whole or not at all, never cut to a fragment." Draft 4 kept these states in the right column, which left an empty block about 1,100 by 340 under the left column's text.

The right column is 600 wide, with the heading "One object at every size" in charcoal 17/22, weight 650. It has no top padding, so its cap tops and the eyebrow's sit on one line (y 65 on the board). 6 below the heading, in muted 13/18, the graft is named: "From Glasshouse: the capsule's place above the tabs, its rule that it hides while the lit step shows, and white places, drawn only as one side of a choice (3b, 6b)." The column holds these exhibits, drawn at actual size and each labelled beneath in muted 13/18:

- Side by side, 16 apart: the capsule as on a white place, 268 × 64, reading "18 min left · Write the school email" on line 2; and the capsule **lifted, as on a charcoal place**, on a piece of the canvas (a charcoal tile with a 24 radius and padding 14 and 16), showing a routine step: "● Now  Put shoes on", its bar, and "2 min left · Leaving the house". Labelled 10 below: "The Now capsule, in the lantern's order: the step, the bar, then the minutes left and the task's name, set a little narrower so "Write the school email" fits whole. On a white place it is the one dark thing. On a charcoal place it is lifted on a lighter fill with a full ash edge (right, carrying a routine step)."
- The Dynamic Island in three states: compact, minimal and expanded (section 6), labelled "Dynamic Island: compact, minimal, and expanded on a long press. It never shows while the app is in front." The compact Island appears here only, not again in row 4.

A caption sits under the column in muted 13/18: "The step, the bar and the minutes, in the same order, on Today, in Focus, in the capsule, on the Lock Screen and in the Island."

### Phones and captions

**Phone frame**, as Lantern drew it:

- Outer size 414 × 868, with 12 of padding and a 66 radius.
- Fill: a 160° gradient #2A2D2C 0%, #0C0D0D 38%, #0C0D0D 70%, #262928 100%.
- Rings: 1.5 pt #5A5F5C, then 3 pt #141615.
- Shadows: 0 40 70 −24 rgba(20,24,22,0.45) and 0 16 30 −12 rgba(20,24,22,0.3).
- Screen: 390 × 844 with a 54 radius, clipped.

**Status bar**, 0–54 on every screen:

- The clock at x 52, 17/22, weight 600, in the system's own face.
- The camera island, a black 124 × 36 capsule centred at y 11–47.
- Signal, wifi and battery glyphs at the right, ending at x 360.
- Glyphs are white on charcoal, and charcoal on white or stone.

**The system's own text** (the status bar clock, the keyboard, the Lock Screen date and clock, the Android notification) is SF Pro on iOS and Roboto or the maker's face on Android, never Instrument Sans. The board sets it in Inter as a stand-in, and says so under the Lock Screen.

**Home indicator:** 136 × 5 at y 831. It is charcoal on light screens and white on charcoal screens.

**Captions:** under each phone, 390 wide:

- the number and short name in muted 13/18, weight 650 (for example "1 · Today");
- a title in charcoal 20/26, weight 650;
- one to three sentences in #3F4341 at 15/22, weight 450.

The text for each caption is given with its screen.

**Font.** The board may load Instrument Sans and Inter from Google Fonts, as the explore boards did. The app bundles its font file and makes no request.

**System drawing.** The keyboard and the Lock Screen are drawn in the current system's appearance: a light keyboard panel with 30 pt top corners and rounded keys, glass Lock Screen controls, and a mid-tone wallpaper standing in for the person's own, so the card's outline can be judged against something other than black.

---
## 3. The frame every screen shares

### Fixed rows

Every screen with tabs uses these rows. They are anchored to the bottom safe area, not to the screen edge, so with Android's three-button bar (a 48 pt inset) everything below the content moves up together.

| Part | y | x | What it is |
|---|---|---|---|
| Status bar | 0–54 | full width | System |
| Header row | 58–102 | 24 to 366 | Left: the date, a place's title, or a back pill. Right: Me, at this y on every screen except the open drawer (section 9.10) |
| Content | 110 to about 594 | 24 to 366 | Whatever the screen is for |
| Dock line | 606–670 | 24 to 366 | The capsule slot, x 24–292, then capture, x 302–366, centre (334, 638). Every object on it is 64 tall |
| Folded drawer | 684–844 | full width | Stone, with a 28 radius on its top corners |
| Drawer handle | 684–754 | full width | Grabber mark at 692; two lines at 704–746, and "Rest of today ⌃" at the right, 715–735. On the open drawer the same band holds "⌄ Hide" at 715–735 (section 9.8) |
| Hairline | 754 | 24 to 366 | 1 pt, charcoal at 10% |
| Tabs | 760–812 | 16 to 374 | Today, Tasks, Routines, Library |
| Home indicator | 831–836 | centred | System |

**One right edge.** Everything ends at x 366, mirroring the 24 pt left edge: text, the ink of a chevron, the bar's end cap, Me, capture, the switchers, the capture field and Save. Back pills start at x 24. The one exception is the duration track in a column of timed rows (screens 2 and 7): its slot ends at 366, not its ink. The slot is as long as the longest duration in that list, so the 20 min track ends at 366 and the 10 and 15 min tracks end inside it, at 351 and 358.5, and every number still ends on one line (section 9.2).

**The foot of a tabbed screen** is the dock line, 14 pt of gap, the folded drawer and the tabs. The tabs end at 812, 19 pt above the home indicator, and are inset to x 16–374 so the current tab's lozenge stays clear of the display's corner. The capsule rests close on the drawer, as Glasshouse's sat on its bar.

### The dock line

The dock line is the one row that never moves. Lantern's Today keeps its action buttons there, and capture is always at its right end.

- **On a charcoal screen of the present** (Today, Focus, and the running task's own page), the dock line holds that screen's main buttons, then capture. Today and Focus hold the same three, in the same places: Step done at x 24–162, Pause at x 172–292, capture. Paused, Resume takes Pause's place (section 5.7c).
- **One band.** Everything on the dock line is 64 tall with a 32 radius: the capsule, the capture disc, and the present's own pills (Step done, Pause, Resume, Focus). Draft 3 drew the pills 56 tall beside a 64 pt disc, so the row read as two heights.
- **On a place** (white or charcoal), it holds the Now capsule, then capture.
- **When nothing is running or paused**, a place's slot is empty, and capture stands alone.

Capture and the capsule are separate objects, 10 pt apart, with separate targets and separate names. Capture never sits inside the capsule.

### When a field has the keyboard

The capture sheet carries its own row on the keyboard (section 5.5). Any other field, such as "Add a step" on a task's page (3a, 3b), the note on the running task's page (8), "New routine" (9) or a rename, takes the keyboard without moving the frame:

- **The dock line, the folded drawer and the tabs stay where they are, behind the keyboard.** They are not lifted above it. In SwiftUI they ignore the keyboard's safe area (`.ignoresSafeArea(.keyboard)`), which SwiftUI otherwise counts as part of the bottom safe area; on Android only the content takes the keyboard's inset (`imePadding()` on the content, never on the dock line, the drawer or the tabs).
- **Only the content moves.** It scrolls so the field and the line under it sit above the keyboard.
- **Why.** Lifted, the capsule, capture, the two-line Next line and the tabs would stack about 200 pt above the keys, leaving about 100 pt for the field, and the capsule would sit just above the suggestion bar, where a tap meant for a suggestion would open Focus in the middle of typing.
- **Capture is one tap once the keyboard is put away.** While one of these fields has the keyboard, capture is behind it with the rest of the dock line, so reaching it takes the keyboard's own hide key (or a swipe down on the content, or Android's back) and then capture. Apart from an open sheet, which covers the dock line like everything else (9.9), this is the one exception to "capture is one tap from every screen", and it lasts only while the person is already typing somewhere. It is put to the owner in section 14. Lifting capture alone above the keys would put a disc beside the suggestion bar, the mis-tap named under Why.
- **Text in the field is kept.** When the keyboard goes, the foot is where it was. If the person then taps the capsule, capture, a tab, the Next line or Me while the field holds text, the text is kept as a draft in that field, as the capture sheet keeps its draft, and is there when they come back (section 4).

### Counting the five choices

No screen offers more than five main choices.

- **Not counted:** the frame, which is the four tabs, Me, a back control, a "⋯" menu and the drawer's handle. The handle is on every tabbed screen in the same place and does the same thing, like the tabs.
- **Counted:** everything else that can be tapped, including the capsule and capture.
- A list counts once, however many rows it has. The sections of one list, such as Later today and Anytime today, are one list.

Each screen in section 5 gives its count.

### Compact heights

On a screen shorter than 740 pt (iPhone SE at 667, or Android with large system bars):

- The drawer handle shrinks to one 52 pt line: "Next 10:30 Call the dentist · in 25 min ⌃". The words "Rest of today" are dropped, the chevron stays, and the grabber sits inside the line's top 6 pt. The spoken label is unchanged.

This gives back 18 pt on every screen, and capture keeps the same place relative to the tabs on every screen. (The gap between the dock line and the drawer is 14 at every height since draft 3.) One judge suggested a single dock line on short screens, with the capsule taking the Next line's place on light screens only. That was not taken, because it would move capture between Today and the places.

---
## 4. The Now capsule

### What it is

The capsule is the lit step at its smallest. It is a piece of the charcoal canvas carried to wherever the canvas is not. It shows the same facts as the lantern on Today, in the same order and the same colours (the step, then the bar, then the minutes left), and, where it fits whole, the one thing the lantern shows above the step: which task this is. On a white place it is the only dark object, so "what is running" is answered in one place everywhere. On a charcoal place it is lifted off the canvas by a lighter fill and a full ash edge, and found by that, its Now and its burning bar.

### Geometry

- A capsule at x 24–292 and y 606–670 (268 × 64, radius 32). The fill is solid, with no glass or blur.
- On white or stone it is charcoal, with the shadows 0 6 14 −6 rgba(34,38,36,0.4) and 0 2 5 rgba(34,38,36,0.12). Its edge measures 15.3:1 against white and 13.4:1 against stone.
- **Its shadows end inside the 14 pt gap above the drawer** (670 to 684), and so do the capture disc's. Draft 4's deeper shadows (0 12 26 −8 on charcoal) fell 16 pt onto the top of the stone drawer, where they showed as a grey smear across the grabber (#CECECE to #E0E0E0 against #EEF0EC) on every place and not on Today. On charcoal the shorter shadow loses nothing: the capsule is found there by its edge.
- On a charcoal place it is **lifted**: an ash-15 fill (#363B38, 1.34:1 against the canvas), a full 1 pt edge of `ash-edge` (#737875, ash at 60% over charcoal; 3.45:1 against the canvas, measured from the render), and the shadows 0 6 14 −6 rgba(0,0,0,0.7) and 0 2 5 rgba(0,0,0,0.4). On it, white measures 11.4, ash 5.1 and terracotta 4.72 (measured from the pixels under the text). Draft 3's ash-8 fill with a rim lit from above measured 1.16:1 and its edge 1.7:1, so on the default places the capsule was found by its text, not as an object.
- Padding is 16 on the left and 14 on the right, so the text runs from x 40 to x 278, 238 wide.

### Contents while running

Three rows, in the lantern's order.

**Line 1, y 613–635:**

- a 7 pt terracotta dot, crisp, with no halo, then "Now" in terracotta 15/20, weight 650, together in a 54 pt first column;
- from x 94, the step in white 17/22, weight 600: "Write the question".

A longer step is cut off with an ellipsis at the end of line 1. The whole step is in the capsule's spoken label and one tap away in Focus.

**The bar, y 639–643:** the full text width, 238 × 4: a rounded ash-30 track, a rounded terracotta fill at 72%, and the ash end cap (2 × 8) at its end. No white tick (section 9.2).

**Line 2, y 646–666:**

- "18 min left" in terracotta 15/20, weight 650;
- then, only if it fits whole in what remains of the 238 pt, "·" and the task title in ash 15/20, weight 500, set at width 95 on the font's width axis.

Line 2 reads "18 min left · Write the school email" on every place drawn. At width 100 the name needed 242 of the 238 pt, and draft 4 dropped it, which left Tasks and Routines, where nothing else names the email, with "Write the question" and no answer to "the question for what?". At width 95 it takes 147 pt and the whole line 234, with the 14 pt right padding the 32 radius needs at the baseline untouched. A routine step reads "2 min left · Leaving the house" (the header's lifted exhibit). Only the name is narrowed; "18 min left" and the step keep width 100.

**"left" is never dropped.** The same slot reads "27 min so far" once the estimate is used up, and a bar that is 72% full beside a bare "18" also fits the reading "18 minutes in", which gives the opposite answer to "how long is left". Draft 3 dropped "left" to make room for the title; the third review put it back. Where line 2 needs room, the title gives way first, whole, and "left" stays.

**The task is shown whole or not at all.** Where line 2 has no room for the whole name (a longer name, "27 min so far" once the estimate is used up, larger text), the name gives way whole and stays in the spoken label. It is never cut to a fragment such as "Write the sc…". The header shows a longer name giving way: "Renew the car insurance online" beside "12 min left". Which task is running is also said on the page that could change it (3a's sentence) and in Focus's context line.

**Not in the capsule:** "step 2 of 3", the note, "of 25" and the end time. The end time is on Today, in Focus, on the Lock Screen, in the Island and in the capsule's spoken label; the rule that time has an end time is a rule for Focus. The spoken label carries all of them.

**The bar measures the task's estimate.** The task model keeps time per task, and steps have no time of their own, so the bar is the whole task's 25 minutes and does not restart at each step.

### States

| State | Line 1 | Bar | Line 2 |
|---|---|---|---|
| Running | ● Now · step | Burning | "18 min left" in terracotta, then · and the task title in ash if it fits whole |
| Estimate used up | ● Now · step | The track drawn as a 1 pt ash outline with nothing inside and no end cap (6.9:1) | "27 min so far" in terracotta. Beside it the email's name does not fit, so it gives way. "estimate 25" is in the spoken label, on Today and in Focus. No colour changes, nothing flashes, and there is no alert unless the person set one when they started |
| No estimate | ● Now · step | A terracotta length growing from the leading edge, with no track behind it and no end cap; the bar's full width is an hour (section 9.2) | "7 min so far" in terracotta, then the title if it fits whole |
| Paused | "Paused" in ash 15/20 at 650, set at width 90 so it fits the 54 pt first column where Now was, then the step, which does not move | Frozen, its fill turned ash on the ash-30 track (3.7) | "18 min left" in white, then · and the task title in ash if it fits whole. Paused is said in words, not only shown by the bar going still or the minutes turning white |
| Paused, with the estimate used up | "Paused" · step | The empty outline | "estimate 25" in white, with "Paused" already on line 1, as on Today's Now line. Never "0 min left". The name gives way. This is the state the app opens on after a forgotten clock is closed |
| Routine step with minutes | ● Now · "Put shoes on" | That step's minutes | "2 min left" · "Leaving the house" |
| Routine step without minutes | ● Now · "Put shoes on" | None | "Leaving the house · step 2 of 4" in ash, with no minutes, so nothing pretends to time what is not timed |
| Task with no steps | ● Now · the task title | Burning | "18 min left" only, since the title is already on line 1 |

Terracotta means time is passing. So it appears in the capsule only while a clock is running.

**Why "Paused" moved to line 1.** Draft 4 put the pause glyph alone in the first column and "Paused · 18 min left" on line 2. The glyph left a 43 pt hole before the step, which read as a missing word, and "Paused" took the room the name needs. The word now stands where Now stands, so line 2 is the same shape running or paused. The glyph and the word together (about 68 pt) would not fit the column without moving the step.

**What paused means.** The task model has no paused state. Paused means that the task most recently worked on today has a stopped session, is not done, and has not been set aside, and that nothing else is running.

A paused capsule stays until one of these happens:

- something else starts;
- the person chooses "Set aside", on paused Today or in paused Focus;
- the logging day ends at 04:00.

Then it goes without comment.

**A clock left running in the background.** Once the app has been in the background for more than 15 minutes past the end of the estimate, the session is closed at the moment the estimate ran out, and the Live Activity ends at the same moment. When the person comes back, the app opens on paused Today (screen 7c), with the outline track and "estimate 25" in place of the minutes, and no figure for the time away, then or later. The same rule closes a session with no estimate at the last moment the app was open. The 15-minute margin is an owner decision (section 14). Inside the margin, "27 min so far" counts up as above, so finishing a few minutes over is shown truthfully and without fuss.

### Where it is shown and hidden

| Shown | Hidden |
|---|---|
| Tasks, Routines, Library and Me, and the pages pushed from them, except the one on the right | Today with the drawer folded: the lantern is on screen, and the canvas is the capsule at full size. This is Glasshouse's rule |
| Any task's page other than the running task's own | The running task's own page, which is lit charcoal and has its own "Focus" pill in the slot |
| The rest of today, with the drawer pulled open over any tab | Focus, because Focus is the capsule opened to full screen |
| The top edge of a sheet raised from a place, riding up with the sheet, as a picture only (below) | Capture opened from a charcoal screen of the present, where the lantern stays lit above the sheet |
| | "If things are bad right now", and every page under it. No timer of any kind is shown there. Capture stays |
| | Whenever nothing is running or paused. Its absence is part of the idle signal |

**On a sheet.** While a sheet is open over a place, the capsule riding its top edge cannot be tapped and has no spoken label of its own; the sheet is modal. Closing the sheet makes it a button again. So a draft in the capture sheet is never left behind by a tap on the capsule.

### Gestures

- **Tap anywhere on it** to open Focus. Focus grows out of the capsule (section 10).
- **There is no drag.** On every place the content scrolls under the dock line, and the capsule takes most of the width at the height where a thumb starts a flick. A drag that starts on the capsule scrolls the content underneath, so scrolling a list never opens Focus by accident.
- **A tap that stops a scroll is not a tap on the capsule.** While a list is still moving under its own momentum, the first touch on the capsule only stops the list, as it would anywhere else on the list. Flicking through the inbox and tapping to stop never opens Focus.
- There is no long press, no swipe to dismiss and no hidden menu, so a running clock cannot be put away by accident.
- Stopping the clock is a choice made in Focus, on Today, or on the Lock Screen.

### How it relates to the rest of the app

- **The drawer.** On Today, pulling the drawer up past the lantern's bar folds the lit step down into the capsule. Folding the drawer lets the capsule grow back into the lantern. Leaving Today by a tab also drops the step into the capsule, and returning brings it back. While something runs, the drawer has only two resting places, folded and open, so the step is never on screen twice. The half position exists only when nothing runs (section 9.8).
- **Focus.** Focus is the capsule opened all the way. It never shows the capsule. Leaving Focus folds it back into the capsule on the screen you came from, or into the lantern if that was Today.
- **Capture.** Capture is a separate disc beside the capsule, never inside it. When capture opens from a place, the capsule rides on the sheet's top edge and keeps burning. When capture opens from a charcoal screen of the present, the lantern itself stays lit above the sheet.
- **Starting another task.** On a task page, "Start this instead" lights that page and the capsule goes, because the new present is the page itself. Starting a routine from its own page stops the running task in the same way (it keeps its place), and the routine's page lights. Either way, the one-running-task rule is shown without a message, and for six seconds the Next line offers Undo (section 9.8).
- **A field in use.** While a field outside the capture sheet has the keyboard, the capsule stays behind the keyboard with the rest of the dock line; it is never lifted above the keys (section 3). If the person puts the keyboard away and taps the capsule while the field holds text, Focus opens and the text is kept as a draft in that field, as the capture sheet keeps its draft.
- **The Live Activity.** It is the same object outside the app (section 6). iOS does not show an app's own activity in the Dynamic Island while that app is in front, so the capsule and the Island are never on screen together.
  - On Pause, the Live Activity ends. A paused task left on the Lock Screen would be a reminder nobody asked for, so paused is shown only inside the app.
  - On Resume, a new Live Activity starts.

### Spoken label

The capsule is one button:

- **Label:** "Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23."
- **Hint:** "Opens focus."
- **Custom actions:** "Step done" and "Pause". These are standard accessibility actions, not hidden gestures.
- **When paused**, the label begins "Paused:". With the estimate used up, it ends "27 minutes so far, estimate 25."

---
## 5. The screens, in board order

Board order:

1. Today, running
2. The rest of today
3. A task opened while another runs: 3a in charcoal, 3b in white
4. Focus
5. Capture
6. Tasks: the inbox, 6a in charcoal, 6b in white
7. Nothing running
7b. Nothing planned: the way back after weeks
7c. Paused: the way back after a pause that was left
8. The running task's own page
9. Routines

The Lock Screen, the Live Activity, the Dynamic Island and Android's notification are in section 6, and on the board under "Outside the app".

Screens 1 to 6, 8 and 9 are at 10:05 on Tuesday 24 November, with "Write the school email" running at step 2 of 3. Screen 7 is at 9:58 on the same Tuesday, before the email was started. Screen 7c is at 13:20 on the same Tuesday: the email was paused at 10:05 and left. Screen 7b is at 9:12 on Monday 14 December, after three weeks away.

### 5.1 Today, running

**Caption.** "1 · Today". Title: "One sentence lit". Text: "The app opens on the current step, its bar burning down and the light falling off around it. The Next line names what comes next and opens the rest of today, and the row under the thumb holds Step done, Pause and capture."

**Surfaces.** Charcoal from the top of the screen to y 684, with the lantern's falloff (section 7) centred at about (170, 380), a little above the middle of the block: a pool at its brightest #323634 that reaches up toward the header and returns to the canvas, #222624, at the header row, the top corners and the screen's edges. So the sentence looks lit by a lamp and the dark above it reads as light dropping away. Measured from the render at x 170, the canvas lifts from #232725 at y 110 through #262A28 at 170 to #2A2E2C at 230 and #2B2F2D at 250. The ground on the dock row stays at #232725, and Pause measures 1.46:1 against it. Draft 5 centred the pool at (170, 430), which left the band from the header to about y 200 flat (#222624 to #242826). Stone below, as the folded drawer. There is no white.

**Top to bottom:**

- **Status bar,** 10:05, white glyphs.
- **Header row, 58–102.**
  - "Tuesday 24 November" in ash 15/20, weight 500, at x 24.
  - "Me" at the right, x 314–366: an ash-20 pill 44 tall with white 15/20 text at weight 600.
- **The lit block.** It is bottom-aligned so that it ends at y 550, 56 above the dock line. A longer step, or larger text, grows upward into the dark and never pushes the buttons down. The whole block is one button that opens Focus.
  - **322–342:** the terracotta dot and "Now" in terracotta 15/20 at weight 650, then "·" and "step 2 of 3" in ash at weight 500. At the right of this line, "Focus" in ash 15/20 at weight 600 with a 20 pt right chevron in ash, its stroke ending at x 366. These are words that label the block, with no fill, so they add no new control; the block is the target.
  - **346–372:** "Write the school email" in ash 20/26, weight 600.
  - **386–432:** "Write the question" in white 40/46, weight 700, tracking −0.024em.
  - **460–470:** the bar, x 24–366, 10 tall.
    - Terracotta fill from x 24 to x 270 (72%).
    - A white tick 2 × 18 at x 270, with a static terracotta halo.
    - The ash-30 track to x 366, and an ash end cap 2 × 14 at x 364.
  - **484–512:** "18 min left" in terracotta 22/28, weight 600, then a 9 pt gap and "of 25 · ends 10:23" in ash 15/20.
  - **530–550:** an 18 pt note glyph in ash, "Note" in ash at weight 650, an em space, then "When is the permission slip due?" in ash 15/20.
- **Dock line, 606–670.** Every object on it is 64 tall.
  - "Step done": a white pill, x 24–162, with a 20 pt check and "Step done" in charcoal 17/22 at weight 600.
  - "Pause": an ash-20 pill, x 172–292, with a pause glyph and "Pause" in white. It is 120 wide so that "▶ Resume" fits the same slot when paused (5.7c).
  - Glyph and word are centred by their ink, not their box (section 9.5): about 16 pt either side in Step done, 25 in Pause.
  - Capture: x 302–366 (section 9.4).
- **Folded drawer, from 684.** Stone, with a 28 radius on its top corners and the shadow 0 −6 22 rgba(0,0,0,0.24).
  - **Grabber mark:** 38 × 5 at y 692, muted at 42%.
  - **704–722:** "Next · in 25 min" in muted 13/18, weight 650, at the left.
  - **724–746:**
    - "10:30" in charcoal 17/22, weight 650, with tabular figures, at x 24;
    - "Call the dentist" in charcoal 17/22, weight 600, from x 84, ending by x 246, cut with an ellipsis if longer.
  - **715–735, at the right:** "Rest of today" in muted 13/18 at 650 and a 20 pt up chevron in muted, ending at x 366, centred across both lines. It is the handle's name and heads no column.
  - **No minutes on the Next line.** Draft 4 set "10 min" at the right of the second line, directly under "Rest of today ⌃". The left column reads label over value ("Next · in 25 min" over "10:30 Call the dentist"), so the right column read the same way, "Rest of today: 10 min", which a time-blind reader can take as how long the rest of the day is. Inline after the title, "· 10 min" would end at x 267, touching "Rest of today", whose ink starts at 266. The dentist's 10 minutes are in the open list, the half drawer and the task's page.
  - The whole area from 684 to 754 is one button.
  - **Hairline** at 754.
  - **Tabs, 760–812**, with Today current (section 9.11).
- **Home indicator** in charcoal on stone.

**Capsule:** not shown. The lantern is the capsule at full size.

**Choices: 4.** Focus (the lit block), Step done, Pause and Capture. Me, the drawer's handle and the tabs are the frame.

**Changes from Lantern's Today:**

1. The "Focus ›" label. A judge found nothing on Today visibly led into Focus. It is words, not a pill.
2. "in 25 min" and "Rest of today ⌃" on the Next line, and the minutes off it. The Next line is now the drawer's labelled handle: a tap opens the rest of today, so the drawer can be found without knowing it can be pulled. In Lantern, a tap on the Next line went straight to the dentist task, and its "— 10 min" sat at the right where "Rest of today ⌃" now sits.
3. The static falloff around the lit block, a pool that leaves the top and the edges of the screen at Lantern's own charcoal.

Everything else is as Lantern drew it.

**For six seconds after Step done,** the Next line reads "Step done" over "Write the question", with an Undo pill at its right (section 9.8). The finished step has already moved up out of the lantern, so the person sees what they did and how to take it back in the same place.

**No tap lands by accident.** Step done and Pause sit in the slot where the capsule sits on every other screen. So, on Today and in Focus, they ignore taps while the capsule is growing into the lantern or into Focus (about 350 ms), and for one second after either screen has grown out of the capsule (500 ms when it was reached any other way). People often tap again 0.6 to 1.2 s after a movement that felt slow, so a tap meant for the capsule, repeated just as it turns into the lantern, does nothing rather than finishing a step. The second is a starting value to test on a phone (section 14).

### 5.2 The rest of today

**Caption.** "2 · The rest of today". Title: "The day pulled up, the step carried". Text: "Opening the day keeps the light on: the step, bar and minutes fold into the Now capsule. The list ends above it on a covered row, its ring and title greying together toward their foot, and scrolls up from there, so no task hides behind the capsule. Hide sits where Rest of today was, so the drawer closes from the spot that opened it. Me sits 18 lower, below this drawer's edge."

**Surfaces:**

- Charcoal from 0 to 60, under the status bar, so the canvas is still felt behind.
- Stone from 60 down: the drawer at its open position.
- The capsule is charcoal on the stone.

**Top to bottom:**

- **Status bar,** 10:05, white glyphs on charcoal.
- **Drawer top at 60,** with a 28 radius. Grabber mark at 66–71.
- **Header row, 76–120,** one row where draft 2 had two:
  - "Rest of today" as a place title: charcoal 28/34, weight 700, tracking −0.02em, at x 24, the same as "Tasks" and "Routines" (section 9.10);
  - "Me" at x 314–366: an 8% charcoal pill (#DEE0DC on stone) with charcoal 15/20 text at weight 600.
  - There is no Hide in this row. Draft 5 drew "⌄ Hide" here as a header pill, which one thumb cannot reach from the foot, and it left the spot that had opened the drawer doing nothing. Hide is now at the foot (below).
  - **Why this row sits 18 lower than on every other screen:** the open drawer is a sheet whose edge is at 60, below the status bar, so that the canvas is still felt above it; its header has to sit below its grabber. Me is at 58–102 everywhere else.
- **"Later today"**, 132–150, in muted 13/18, weight 650.
  - Rows are sized to their text with 11 above and below (section 9.7): 44 for one line, 62 for two.
  - **154–216:** "10:30" in charcoal 17/22 at weight 650 with tabular figures. "Call the dentist" in charcoal 17/22 at weight 500, like every title in a list, with "in 25 min" under it in muted 13/18; the "in" line alone marks it as next. At the right, "10 min" and its track.
  - **216–260:** "11:00", "Walk to the park", "20 min".
  - **260–304:** "14:00", "Ring the bank", "15 min".
  - Times sit in a 60 pt column from x 24, and titles start at x 84. Each duration is the number, then 7 pt, then a short track 1.5 pt long per minute (section 9.2). The tracks sit in a slot 30 wide, the length of the longest in this list (20 min), left-aligned after the number, so "10 min", "20 min" and "15 min" end on one line at x 329 and the tracks run 336–351, 336–366 and 336–358.5. The slot, not every track's ink, ends at 366 (section 3). Draft 4 right-aligned the marks to x 366, so the numbers ended up to 16 pt apart.
- **"Anytime today"**, 320–338. Each row has a 24 pt charcoal ring (1.75 pt stroke) at x 24 inside a 44 pt target, with the title from x 64 in charcoal 17/22 at weight 500. Ten rows, 44 apart from 342: "Renew the parking permit", "Order printer ink", "Book the boiler service", "Pay the window cleaner", "Text Sam about Saturday", "Water the plants", "Find the passport", "Back up the photos", "Post the birthday card", "Sort the recycling". It is a busy day: six rows are on screen and four wait below.
- **The list ends above the dock line, on a covered row.** The last row on screen, "Water the plants" (562–606), is drawn as covered (section 9.7). Its ring and its title sit under one cover on one ramp, from nothing at the ring's top (572) to 30% stone at its foot (596), so the row greys toward its foot as one object and reads as going on under the edge. Measured from the render as the darkest pixel in each pixel row against stone, the ring runs from about 13:1 at its top to 5.3:1 at its foot, and the title from 10.5:1 at its cap tops to 5.5:1 at its baseline and descenders, so the whole circle and every glyph keep the 4.5:1 rule. No ring is cut or faded out. Draft 5 faded the ring to about 1.07:1 at its foot while the title greyed only to 30%, so the ring read as a loading arc or a broken C; draft 4 faded the whole row into stone, which took its baseline to about 1.9:1.
- **The edge the list goes under is drawn.** From 606 down to the tabs the drawer is a plain stone band, the cover, with a faint shadow along its top edge (0 −6 10 −6 at 16% charcoal) that falls about 10 pt onto the list, below the covered row's ink. The capsule and capture sit on the cover with nothing passing behind them. The rows after "Water the plants" scroll up from under its edge; the list ends with 96 pt of padding, so its last row can always rise clear of the capsule. On the static board nothing in the list shows below the dock line and no row is cut at the hairline.
- **The band under the dock line holds Hide, as one button over 684–754.** "⌄ Hide", a 20 pt down chevron and then "Hide" in muted 13/18 at weight 650, its ink ending at x 366, sits at 715–735: exactly where "Rest of today ⌃" sits on the folded drawer. So the drawer opens and closes from one spot, in reach of the right thumb, and capture does not move. It is the drawer's handle in its open state: one button over the band 684–754, named "Hide the rest of today", as the folded handle is one button over the same band, and the left of the band is plain stone as the handle's right column is. Draft 5 left the band empty, which read as a missing component, and put Hide in the header. Two judges had proposed letting the list run on under the capsule behind about 80% stone instead; that would put text at about 1.3:1 and hide a row behind the capsule while rows show above and below it, which is the draft 3 defect below.
- Draft 3 ran the list on under the dock line to the hairline, with solid stone behind the dock line only. Two rows were then hidden behind the band while rows above and below it showed, so the list looked whole while two tasks were missing, and the capsule looked dropped into the middle of the list. For this audience a task out of sight is easy to lose track of, so a covered row must read as covered, never as absent.
- **The running email is not in any list,** because it is the capsule.
- **Dock line, 606–670:** the capsule as in section 4, and capture at x 302–366. Anytime rows have no right-hand column, so capture's lane stays clear.
- **Hairline at 754. Tabs, 760–812,** with Today current.

**Choices: 3.** The day's list, the capsule and Capture. Me, Hide and the tabs are the frame.

**Notes:**

- The drawer is a layer that can be pulled open over any of the four tabs. Opening it never changes the current tab. Hide, pulling it down, tapping the current tab, or pressing Android's back returns you to exactly where you were.
- A row in Later today or Anytime today opens that task's page. Screen 3 is the 10:30 row opened from here.
- A tick ring marks the task done. The row stays where it is, as a sage disc with its title in muted, until the list is next opened, and the disc is a button that un-ticks it (section 9.7). The open drawer has no Next line, so the row itself is the way back.
- "Done today" appears only when the person has turned on "List what got done today" (`doneList` in the rewards options), which is off by default. It is then a third section after Anytime today: each row a 24 pt sage disc with a 16 pt charcoal check and a 1 pt hairline of charcoal at 10% (the disc alone is 1.1:1 on stone), and the title in muted 17/22. The rows are a quiet record and cannot be tapped; a done task is reopened in Tasks, under Done. There is no number anywhere. With the option off the section is absent: no heading, no empty state and no zero. The board draws the default.

### 5.3 A task opened while another runs: 3a in charcoal, 3b in white

**Captions.**

- "3a · A task opened, charcoal". Title: "Another task, the email still in reach". Text: "Lantern's default. Start this instead is a quiet ash pill under the when, with the sentence that says what it will do to the running task. Unlit, the page sits close to the running task's own (8); the capsule is what says another task runs."
- "3b · A task opened, white". Title: "The same page, if the places are white". Text: "Here the capsule is the one dark thing on the page. Start this instead is a filled grey pill with an edge and a slight lift, set apart from the when by its height. The Next line names the true next item, even when it is this one."

This is the screen the owner will set beside Lantern's own "Task opened", and the one where the white or charcoal choice shows most, so it is drawn both ways (section 5.6).

**3a, top to bottom:**

- **Status bar,** 10:05, white glyphs on charcoal.
- **Header row, 58–102.**
  - "‹ Today" at x 24: an ash-20 pill with a 20 pt back chevron and white 15/20 text at weight 600.
  - At the right, "⋯" (a 44 pt ash-20 circle), then "Me" at x 314–366.
- **122–160:** "Call the dentist" in white 32/38, weight 700, tracking −0.022em.
- **176–220:** the when pill, drawn as a field: a capsule 44 tall from x 24, with no fill and a 1 pt edge of ash at 36%, so it reads as a value to change and the one action below it stands apart. (Draft 3 filled it ash-8, which made five grey capsules of nearly one value on this page.) It contains:
  - an 18 pt calendar glyph in white;
  - "Today, 10:30" in white 15/20, weight 600 (15.3:1 on the canvas);
  - "·" and "10 min" in ash (6.9:1). No duration track here: with nothing beside it to compare, a quantity would only be decoration;
  - "·" and "in 25 min" in ash, so the when is one object: the time, how long, and how soon.

  The pill runs from x 24 to 315. A tap opens the when sheet (section 12), where "in 25 min" is not set: it follows from the time. Draft 5 set "in 25 min" outside the pill on its own, so the when read as two things.
- **240–296:** "Start this instead": an ash-20 pill from x 24, 56 tall and as wide as its words (padding 18 and 22), with a 20 pt play glyph and white 17/22 text at weight 600 (10.4:1). It is a secondary pill because it is not the present: the capsule is.
- **308–348:** in ash 15/20, on two lines: "Starting this stops the timer on Write the school email. It keeps its place at step 2."
- **372–390:** "Steps" in ash 13/18, weight 650.
- **394–438:** "+ Add a step": a 20 pt plus and "Add a step" in ash 17/22, weight 500.
- **Dock line:** the lifted capsule for the email (section 4), with capture at its right. A charcoal fade from 582 to 606 sits behind it.
- **Folded drawer.** Its Next line names the true next item, even when that is this task: "Next · in 25 min" over "10:30 Call the dentist", with "Rest of today ⌃" at the right. The Next line means one thing on every screen. Tabs show Today current, because the page was pushed from Today.
- **The drawer's shadow is drawn above the dock line's fade,** as a layer of its own with no fill, so the drawer's rounded top casts the same soft shadow across its whole width and its corners. Draft 4 drew the fade over the drawer's shadow down to 684, which cut the shadow off in a straight line and left it only in the corners, as grey ears outside the curve (#DBDBDB to #EBEBEB against #FDFDFD white).

**3b** is the same page on white:

- the ground is white, the status glyphs charcoal, the title charcoal;
- "‹ Today", "⋯" and Me are tint-white pills (#EDEEED) with charcoal text;
- the when pill is stone with a 1 pt edge of charcoal at 10%, "Today, 10:30" in charcoal and "· 10 min · in 25 min" in muted;
- "Start this instead" is a filled quiet pill: #DEE0DC (charcoal at about 13% on white), a 1 pt edge of charcoal at 10% and the tab lozenge's lift (0 1 3 rgba(34,38,36,0.12)), charcoal 17/22 text at weight 600 (11.5:1). The edge and lift make it read as pressable; draft 3's flat fill with no edge (1.33:1 on white) read as a disabled button, and draft 2's 1.5 pt outline as a form's ghost button. Its 56 pt height sets it apart from the 44 pt when pill;
- the sentence, "Steps" and "Add a step" are muted;
- the capsule is charcoal, the one dark thing on the page, over a white fade from 582 to 606;
- the folded drawer and tabs are as in 3a. On white the drawer's lift is short: a 1 pt hair of charcoal at 8% along its rounded top and a soft shadow, 0 −1 5 rgba(34,38,36,0.08), that reaches only about 6 pt above it. Stone is only 1.14:1 against white and needs an edge to read as a sheet, and the 14 pt gap under the capsule should stay white. Measured from the render, the gap is #FFFFFF beside the capsule and #EFEFEF to #F7F7F7 under it, where only the capsule's own shadow falls. Draft 5's drawer shadow, 0 −4 16 at 16%, added to the capsule's and took the gap under it to #E6E6E6. The white page runs on under the drawer to the foot of the screen, so the corners sit on white.

**Choices: 5.** When, Start this instead, Add a step, the capsule, Capture. Back, "⋯", Me and the handle are the frame. "⋯" holds Add a note, Rename and Delete.

**Notes:**

- **After "Start this instead":**
  - The email's session stops. It keeps step 2 as its place.
  - The page lights and becomes the running task's own page (5.8), and the capsule goes. On white the page turns to charcoal over 300 ms; on charcoal only the layout changes.
  - VoiceOver says: "Started Call the dentist. Write the school email keeps its place at step 2."
  - For six seconds the Next line reads "Started Call the dentist" over "Write the school email at step 2", with Undo, so the strip accounts for both tasks and keeps the page's promise in sight: the email waits at step 2. Undo stops the dentist's session, starts the email again at step 2, and returns to this page unlit. The line measures 249 of the 252 pt beside Undo. Draft 5's "Write the school email stopped" could read as abandoned, just after the page said the email keeps its place; "Write the school email kept at step 2" needs 288 pt, and a short name such as "Email" is one the app cannot make up.
- **When nothing is running,** the same button reads "Start": the white primary pill on charcoal (3a), and on white the charcoal pill (3b, the one place charcoal is used for a button on a white page). The sentence under it is absent. Start also leaves six seconds of Undo, which stops the session as if it had never begun (section 9.8).

### 5.4 Focus

**Caption.** "4 · Focus". Title: "The capsule opened all the way". Text: "The step sits at eye height between the step before and after it, the one white heading, and outranks the clock. Focus names itself in ash above it, the bar runs edge to edge, and +5 min sits with the minutes it changes. The row under the thumb is Today's; the foot says what is later."

**Surfaces.** Charcoal from edge to edge, with the lantern's falloff centred at about (190, 330), behind the step. There is no stone and no white surface anywhere.

**Top to bottom:**

- **Status bar,** 10:05, white glyphs.
- **Header row, 58–102.**
  - "⌄ Today" at x 24: an ash-20 pill with a 20 pt down chevron and white 15/20 text at weight 600. It names the place you return to. If Focus was opened from the capsule on Tasks, it reads "⌄ Tasks".
  - "Me" at the right, ash-20. Me stays here because the "if things are bad right now" page must be two taps from anywhere.
- **166–186:** the context line, a heading: "Focus" in ash 15/20 at weight 650, then "· Write the school email · step 2 of 3" in ash at 500. It sits 24 above the done step, so it reads as the heading of the step block it names, and the 64 pt above it, under the header row, is the lamp's. Draft 5 left it at 122–142 when it removed the white Focus title, which left a 68 pt hole between the line and the done step. Focus names itself at the head of its context line, where Lantern's own Focus carried only the context, so the step is the one white heading on the screen: one sentence lit, as on Today. "Am I in Focus?" is answered by that word together with what Focus alone has: the bar run edge to edge, "⌄ Today" where the date sits, +5 min beside the minutes, and no tabs or drawer. Draft 4 set "Focus" as a white page title at 32/38 and 700 directly above the 44 pt step, which gave the screen two white headings of nearly one weight.
- **210–234:** a 24 pt sage disc with a 16 pt charcoal check, then "Find the school address" in ash 17/22, weight 500. The disc sits in a 44 pt button named "Undo step done: Find the school address", which un-ticks it and makes it the current step again.
- **252–352:** "Write the question" in white 44/50, weight 700, tracking −0.026em. It wraps to two lines, "Write the" and "question", and it is the largest thing on screen.
- **366–388:** "After this:" in ash at weight 650, then "Read it once and send" in ash 17/22, weight 500.
- **420–432:** the bar, run **edge to edge**, x 0–390, 12 tall, with square ends, like a horizon under the step. The fill runs from x 0 to x 281 (72%), with a white tick 2 × 20 and its static halo. There is no end cap: the screen's edge is the end of the track. Today never draws its bar this way.
- **452–502:** the minutes, stacked as on the Lock Screen card: "18 min left" in terracotta 24/30, weight 600, over "of 25 · ends 10:23" in ash 15/20.
- **455–499:** "+5 min", an ash-20 pill 44 tall with white 15/20 at weight 600, right-aligned to x 366 on the minutes' row. The time sits with the control that changes it.
- **526–546:** the note line, as on Today.
- **Dock line, 606–670,** exactly as on Today, so what is under the thumb does not move between the two, every object 64 tall:
  - "Step done": a white pill, x 24–162;
  - "Pause": an ash-20 pill, x 172–292;
  - Capture at x 302–366.
- **754:** a 1 pt hairline of hair-dark, x 24–366, at the y of the tab hairline on every tabbed screen, so the foot line is set on the frame and the bottom of the screen reads as deliberate rather than empty.
- **776–796:** the foot, text only, not a control: "Later today · 10:30 Call the dentist · in 25 min" in ash 15/20, set where the tabs sit on a tabbed screen, so the foot is anchored and the band under the dock line is not left as dead charcoal. It is labelled with the drawer's own section name: the word "Next" is not used here, because "After this" already names the next step and two nexts on one screen meant two different things.
- **The foot follows the Next line's rows** (section 9.8), running or paused, in the same order and with the same priority: the two lines set on one, with "·" between the parts, and the drawer's section name where the Next line says "Next". A title too long for the line is cut with an ellipsis, and the "in" or "until" part keeps its place; with the titles drawn, the longest line ends at x 359 in ash 15/20. The rows:
  - first, for six seconds after a tap, the six-second rows: their two lines, with Undo (below). Otherwise, checked from the top down:
  - a timed item starts within 15 minutes: "Later today · 10:30 Call the dentist · in 10 min";
  - a timed item's slot is under way, unstarted: "Later today · 10:30 Call the dentist · until 10:40";
  - an item whose slot passed today is at the top of Anytime today: "Anytime today · Call the dentist", with no time, no mark and no "missed". So at 13:20 in paused Focus the foot names the dentist call, as paused Today's Next line does (7c), and not 14:00;
  - a timed item is next, later: "Later today · 10:30 Call the dentist · in 25 min", as drawn;
  - no timed item is left: "Anytime today" and the first anytime title;
  - nothing is left for today: "Rest of today · Nothing else planned".
- **Home indicator** in white.

**Capsule:** not shown, because this is the capsule opened.

**Choices: 5.** Step done, Pause, Capture, +5 min and the done step's disc, which undoes it. "⌄ Today" (a back control) and Me are the frame. Paused: Resume, Step done, Set aside, Capture and the disc. For the six seconds the foot carries Undo, it is the same Undo as the Next line's and is counted as frame, as it is on Today.

**How it differs from Today.** A risk with Lantern was that the two look alike. Each has what the other lacks:

- Today: the date in the header, the stone drawer with its Next line, and the tabs.
- Focus: its name at the head of the context line, the bar run edge to edge, +5 min beside the minutes, the step at eye height at 44 pt between the step before and after it, and a foot line in plain text that cannot be tapped (only its six-second Undo is a control), so nobody leaves Focus by accident.
- On both, the step is the one white heading.

The row under the thumb is the same on both, and Step done and Pause ignore taps for a moment as either screen appears (section 5.1). On the board, the panel "Today and Focus, told apart" under screen 4 says this.

**Behaviour:**

- "⌄ Today" keeps the clock running. Only Pause stops it.
- "+5 min" adds five minutes to the task's estimate. If the estimate is used up, it first sets the estimate to the time worked so far, so the bar shows five minutes left.
- On the last step, the white pill reads "Done" and completes the step and the task. A task with no steps also shows "Done".
- For six seconds after Step done or Done, the foot line reads "Step done · Write the question" with an Undo pill (764–808) at its right, as the Next line does on Today.
- **Paused Focus** is laid out as paused Today (5.7c):
  - the bar is ash and frozen with no tick or halo, and the minutes read "18 min left" in white with "of 25" in ash and no end time (with the estimate used up, "estimate 25" over the outline track, never "0 min left");
  - on the dock line, "▶ Resume" is the primary white pill in Pause's place, and Step done stays in its place as an ash-20 pill;
  - "Set aside" takes +5 min's place beside the minutes, an ash-20 pill 44 tall;
  - "Set aside" puts the capsule away, and the task keeps its place at its step.

### 5.5 Capture, from Today

**Caption.** "5 · Capture". Title: "The thought goes in, the step stays lit". Text: "The disc opens a sheet with the keyboard already up. The lantern rises into the top third and keeps burning. Me still works above the sheet and keeps the draft, so help stays two taps away. Below: the same sheet from Focus."

**Surfaces.**

- Charcoal canvas above, with the lit block still burning and the lantern's falloff centred on it, at about (170, 190).
- A stone sheet.
- The light system keyboard, in the current system's appearance.

**Top to bottom:**

- **Status bar,** 10:05, white.
- **Header row, 58–102:** the date and Me as on screen 1. **Me stays a working button:** a tap on it closes the sheet, keeping the draft, and opens Me, so the "if things are bad right now" page is still two taps from here. Draft 2 drew Me but let it do nothing; dimming it, as one judge suggested, would have put the crisis page three taps away.
- **The lantern, moved up into the top third,** without the note line or the Focus label:
  - **112–132:** "● Now · step 2 of 3 · Write the school email". The task title joins the Now line, as it does at large text sizes (section 11), so the lantern fits above the sheet;
  - **144–190:** "Write the question" in white 40/46, weight 700. It is still the largest text on screen;
  - **206–216:** the 10 pt bar;
  - **228–256:** "18 min left" in terracotta 22/28, then "of 25 · ends 10:23" in ash.
- **The sheet,** stone, from 280, with a 24 radius on its top corners:
  - **288–293:** the grabber mark;
  - **296–340:**
    - "Capture", the sheet's title, in charcoal 17/22, weight 650, at x 24, 307–329;
    - "Close" at the right in muted 17/22, weight 600 (5.9:1), with a 44 target, its ink ending at x 366. The title leads and the text button is the quieter of the two; draft 3 had them the other way round;
  - **344–400:** the field. It is white, x 24–366, with a 16 radius and 14 of padding. It holds "Ask Ana about Friday" in charcoal 22/28, weight 500, followed by a 2 pt charcoal caret. When empty, the placeholder "What's on your mind?" shows in muted;
  - **412–430:** "Goes to the inbox with no date. Plan it later if you like." in muted 13/18, with 12 above and below. With Today chosen, this reads "Goes on today's list, anytime.";
  - **442–486:** a row riding on the keyboard, its two parts the same height:
    - at the left, x 24–200, a two-part control, "Inbox" and "Today", on a #DEE0DC track 44 tall. Inbox is selected, shown by a white thumb with iOS's own thumb shadow, 0 3 8 rgba(0,0,0,0.12) and 0 3 1 rgba(0,0,0,0.04) (sections 7 and 9.6; the same rule as the Tasks switcher on white), and a label at weight 700. "Today" is muted at weight 600;
    - at the right, x 270–366, "Save": a terracotta pill 44 tall with charcoal 17/22 text at weight 600 (6.3:1). It is in the same right-hand column as the capture disc.
- **The keyboard,** 508–844, the light system keyboard in the system's face, drawn as the current system draws it: a light panel with 30 pt top corners and a highlight along its top edge, white keys with a 9 pt radius and a hairline shadow, and grey function keys. On iOS its return key is the default "return" key type, which still files the item in this one-line field. It is not "Done": everywhere else in this app "Done" means completing a task or a step, so it keeps that one meaning. On Android, the keyboard's action label is "Save" where the keyboard shows the label.

**Below it, in the notes band,** at half size: Focus with the same sheet risen. It is cropped just below the field, at sheet y 400, and fades out over the plain stone under it to y 436, so no keyboard shows, nothing reads as cut, and no line of text sits in the fade. Draft 5 cropped it lower and faded it over the helper line, the switch and Save, which measured 3.0, 2.3, 1.8 and 1.6:1 on the board.

- "⌄ Today" and Me;
- 112–132, the context line as in Focus: "Focus · Write the school email · step 2 of 3", in ash;
- 144–190, "Write the question" at 40/46 on one line;
- 206–218, the 12 pt bar edge to edge, and 228–258, the minutes;
- the sheet from 280, as above, down to its field; the helper line, the switch and Save are below the crop.

Its label, in muted 13/18: "From Focus: the same sheet. The step stays lit above it, and saving returns to Focus on the same step."

**Capsule:** not shown, because the lantern is in view. When capture opens from a place, the capsule rides on the sheet's top edge, as a picture only (section 4).

**Choices: 4.** Close, the field, Inbox or Today, Save. Me is the frame.

**Rules:**

- Nothing else is asked: no date picker, no steps and no estimate. Those belong to the task's page.
- **Save, or the keyboard's return key,** files the item, and the sheet drops.
  - The Next line then reads "Saved to the inbox" over "Ask Ana about Friday", with an Undo pill at its right. It lasts six seconds, is ended early only by a newer undoable tap, and stays while VoiceOver focus is on it.
  - In Focus, the foot line shows the same.
  - VoiceOver announces "Saved to inbox" and moves focus back to the step.
  - There is no other acknowledgement unless the person has turned that reward on.
- **Undo** removes the item and reopens the sheet with the text still in it.
- **Close, a swipe down, a tap above the sheet, Me, or Android's back** keeps the typed text as a draft.
  - The capture disc then shows a 12 pt white dot with a 2 pt charcoal ring at its top right, and its name becomes "Capture, draft kept".
  - The next tap reopens "Ask Ana about Friday".
  - The draft is never pushed at the person otherwise.
- **At large text sizes,** if the lantern no longer fits above the sheet, it shrinks into the capsule riding the sheet's edge.

### 5.6 Tasks: the inbox, in charcoal (6a) and in white (6b)

**Captions.**

- "6a · Tasks, charcoal". Title: "The inbox, on the canvas". Text: "Lantern's default: one dark app. Anything with no date waits here, in the order it came in, with no count and nothing about how long. The capsule is lifted off the canvas by a lighter fill and a full ash edge, so it still reads as an object."
- "6b · Tasks, white". Title: "The same inbox, if the places are white". Text: "On a white page the capsule is the one dark thing, found at a glance, and charcoal means only now. Nothing else on the screen changes."

**The choice.** Lantern drew one dark app, and the owner asked for Lantern with nothing from Glasshouse but the capsule, so charcoal is drawn first and called the default. White is drawn beside it as the alternative: it is Glasshouse's look, a second graft named so the owner can see it (section 13), and one judge recommends it. The panel under 6a and 6b puts the choice to the owner:

- **Charcoal, Lantern's default (3a, 6a, 9).** One dark app, as Lantern drew it, and calmer at night. The capsule is no longer the one dark thing, so it is lifted: a lighter fill, a full ash edge (3.4:1 against the canvas), its Now and its burning bar. A task that is not running is charcoal too, close to the running task's own page: only the capsule and the lit bar tell them apart. Long lists in white on charcoal may be harder to read in bright daylight, which is worth testing.
- **White, Glasshouse's look (3b, 6b).** Charcoal keeps one meaning, now: the capsule is the one dark thing on a place, found at a glance, and the change of light says where you are, which is the judge's reason for recommending it. Moving between Today and a place is a big change of light, and it is bright at night.
- Nothing else depends on the choice. Stone stays the rest of today either way, sheets stay stone, and capture and the capsule do not move.

**6a, top to bottom:**

- **Status bar,** 10:05, white glyphs.
- **Header row, 58–102:**
  - "Tasks" in white 28/34, weight 700, tracking −0.02em, at x 24;
  - "Me" at the right, ash-20.
- **114–158:** the list switcher, x 24–366 and 44 tall, on an ash-8 track (#2D312F). It has four parts, "Inbox", "Today", "Coming up" and "Done", each sized to its word with the same padding either side. The four labels, measured at weight 700 so nothing shifts when the selection moves, take 200 of the 342 pt, and the 142 left is shared out as 17.7 pt either side of each, so the parts are 75.6, 78.6, 114.1 and 73.7 wide. Measured from the render, the space either side of each label is 17.7 to 18.2 pt. Draft 5's proportion of 1 : 1 : 1.4 : 1 gave uneven gaps between the labels (37, 34 and 36 pt).
  - Inbox is selected: an ash-20 thumb inset 3 pt with the shadow 0 1 3 rgba(0,0,0,0.35), and its label in white 15/20 at weight 700.
  - The others are ash at weight 600 (5.9:1).
- **172–192:** "Anything with no date waits here." in ash 15/20.
- **Seven rows from 200, each sized to its text** with 11 above and below (section 9.7): 44 for one line, 62 for two, so the space between any two rows is the same 22 whatever they hold. Each has a 24 pt ash ring at x 24 in a 44 target, and the title from x 64 in white 17/22 at weight 500. Some carry a second line in ash 13/18; on those the ring is centred on the title line, as Reminders does, not floating between the two lines. There are no dividers and no cards:
  - 200–244: "Birthday present for Mum";
  - 244–306: "Cancel the gym trial", with "2 steps";
  - 306–368: "Ask about the boiler quote", with a 12 pt note glyph and "Thursday or Friday morning", the start of its note;
  - 368–430: "Look into swimming lessons", with "3 steps · 30 min" and a 45 pt track (section 9.2);
  - 430–492: "Return the library books", with "15 min" and a 22.5 pt track;
  - 492–536: "Fix the bike light";
  - 536–580: "Ask Ana about Friday", saved from screen 5 a moment ago, last because it came in last.
  - Draft 4 gave every row a fixed 56, so a one-line row had about 17 above and below its title and a two-line row 8, and the gaps measured on the ink ran from 22.5 to 40.5 pt, loosening toward the foot of the list. The drawer's rows were 44 at the same time, although Tasks › Today is the same list.
- **The dock line,** over a charcoal fade from 582 (rgba(34,38,36,0)) to 606 (0.94):
  - the lifted capsule (section 4);
  - capture, as on Today.
- **Folded drawer** with "Next · in 25 min" over "10:30 Call the dentist", and "Rest of today ⌃" at the right. Its shadow is drawn above the fade, as on 3a. Tabs show Tasks current. The drawer and tabs are stone.

**6b** is the same screen on white:

- the ground is white, the status glyphs charcoal, "Tasks" charcoal and Me an 8% charcoal pill;
- the switcher's track is stone; the selected thumb is white with iOS's own thumb shadow (0 3 8 rgba(0,0,0,0.12) and 0 3 1 rgba(0,0,0,0.04)) and a charcoal label at 700; the others are muted at 600;
- the helper line and second lines are muted, the titles charcoal, the rings charcoal;
- the fade behind the dock line is white;
- the capsule is charcoal, with its light-ground shadows;
- the drawer's lift is the short one with its 8% hair, as on 3b, and the white page runs on under the drawer;
- the folded drawer and the tabs are stone, as in 6a.

**Choices: 4.** The switcher, the inbox list, the capsule and Capture. Me, the handle and the tabs are the frame.

**Not shown:**

- no count anywhere;
- no badge on the tab or the app icon;
- nothing that shows how long an item has waited;
- no swipe actions.

A row opens its task, and a ring marks the task done. The ticked row stays in place, its disc a button that un-ticks it, until the list is next opened, and the Next line offers Undo for six seconds (sections 9.7 and 9.8).

**The inbox opens at its newest end every time,** not only from 7b. It lists in the order things came in, so the last things written down are in view above the dock line when it opens. With seven items, as drawn, the whole list shows.

**Save leaves the scroll where it was.** After a capture from Tasks, the list does not jump to its newest end, so a person halfway down a long inbox keeps their place. The new item is accounted for by the Undo strip, which names it ("Saved to the inbox" over "Ask Ana about Friday"), and it is at the newest end the next time the inbox opens.

**Tasks › Today and the drawer.** Tasks › Today is the same list as the drawer's "Rest of today", in the same order, with the same sections, rings and row metric, plus anything already done today under "Done" in Tasks only. They are one list reached two ways: from a tab when planning, and from the drawer when doing.

### 5.7 Nothing running

**Caption.** "7 · Nothing running". Title: "Nothing burns, and the day rests half open". Text: "Nothing running is said first, in white, and there is no terracotta on the canvas. The first thing on today's list is lit a size smaller than a running step, and the rest of today waits beneath it, clear of capture, its last row greying where it goes under the tabs. This is the screen after any time away, if anything has today's date."

**Surfaces.**

- Charcoal from 0 to 366, with the lantern's falloff centred on the unlit block, at about (170, 220).
- The stone drawer at its half position, from 366 to the foot. The tabs' band, from 754, is drawn as the cover the list goes under (section 9.7).
- There is no capsule anywhere in the app.

**Top to bottom:**

- **Status bar,** 9:58, white glyphs.
- **Header row:** "Tuesday 24 November" in ash, and Me.
- **110–132:** "Nothing running" in white 17/22 at weight 650, then "· free until 10:30" in ash 15/20 at weight 500. The answer to "what is happening now" comes first and in white. There is no dot.
- **The unlit lantern, 152–282,** 20 below the status line, so "Nothing running" and the lit item read as two things. Its text block is one button that opens the task's page.
  - **152–172:** "First on today's list" in ash 15/20, weight 500. It says why this item is shown, and it is smaller than "Nothing running" above it, so the hierarchy reads downward. Draft 2 set it at 20/26, larger than the status line.
  - **184–222:** "Write the school email" in white 32/38, weight 700, tracking −0.022em, on one line, 12 below the label. The idle sentence is a size smaller than a running step (40/46), so idle and running differ in size as well as in terracotta.
  - **232–254:** "Starts with:" in ash at weight 650, then "Find the school address" in ash 17/22.
  - **260–280:** "3 steps · 25 min · would end about 10:23", in ash 15/20. No duration track: one duration standing alone in a sentence has nothing to be compared with.
- **294–350:** "Start": a white pill, x 24–140, with a play glyph and charcoal 17/22 text at weight 600.
- **The drawer at half, from 366:**
  - **374–379:** the grabber mark.
  - **366–412:** the handle, one button named "Rest of today", drawn as one deliberate row, the drawer's name: "Rest of today" in charcoal 17/22 at weight 600 from x 24, 386–408, and the 20 pt up chevron in muted at the right, its ink ending at x 366. Draft 3 set the words alone at the far right above an empty left side.
  - **418–436:** "Later today" in muted 13/18.
  - Three rows, 44 tall, with time, title, minutes and track as on screen 2, the tracks in the same 30 pt slot so the minutes end on one line at x 329. There is no "in" figure here, because the canvas already says "free until 10:30":
    - 440–484: "10:30" "Call the dentist", "10 min";
    - 484–528: "11:00" "Walk to the park", "20 min";
    - 528–572: "14:00" "Ring the bank", "15 min".
  - **584–602:** "Anytime today".
  - Rows with rings:
    - 606–650: "Renew the parking permit";
    - 650–694: "Order printer ink";
    - 694–738: "Book the boiler service", drawn as covered (section 9.7): its ring and title grey together, on one ramp, to 30% stone at the ring's foot, so the ring measures 5.3:1 there and the title 6.4:1 at its baseline, measured from the render. Below it the tabs' band is drawn as the cover, with the same faint shadow along its top edge (at 754) as the open drawer's cover, so the row reads as passing under the tabs rather than as dimmed or done. Seven more anytime items wait below, and the covered row says so. Draft 5 faded the ring out at its foot, so it read as a loading arc; draft 4 drew the row at full strength over a fade from 730 that touched no text, so the half drawer looked like a whole list ending cleanly at the hairline while seven tasks were hidden, the defect section 5.2 names.
  - The lit email is not repeated in the list.
  - **Tabs, 760–812,** with Today current.
- **Capture** at x 302–366 and y 606–670, on the stone, beside the anytime rows. With nothing running, the dock line holds capture alone.

**Capture's lane.** When capture floats over a list with no capsule beside it (the half drawer), the list keeps the band behind it clear: nothing with a right-hand column (a duration, a time) rests in x 292–390 between y 582 and 694. Every anytime title on the half drawer ends by x 286, 16 short of the disc, wrapping to a second line only when it is longer than that, so no title is ever cut or faded beside it; such a row grows to 62, the two-line row of section 9.7. Here the timed rows end at 572, and the anytime titles that pass beside the disc end well short of x 286 ("Renew the parking permit" at 268), so none wraps. A longer one, such as "Renew the car insurance online", would take two lines. Every list ends with 96 pt of padding, so its last row can always scroll clear. Draft 5 faded a row's right edge under a stone clearing from x 286 to 302, which could cut a long title beside the disc.

**The only terracotta on the screen is the capture disc.**

**Choices: 4.** Start, the lit item (opens its page), the day's list and Capture. Me, the handle and the tabs are the frame.

**What the lantern lights when idle.** These rules are checked in order. The first line is "Nothing running" in white, then the rest in ash, except on 7b (rule 4), where nothing could be running:

1. A timed item that starts within 15 minutes, or whose slot is under way: "Nothing running · starts at 10:30, in 5 min", then "Next booked", then "Call the dentist", then Start.
2. Otherwise, the first item in Anytime today, in the person's own order. That is the case drawn here. The app never chooses by any other rule. A timed item whose slot passed unstarted has already gone to the top of Anytime today (section 9.8), so this rule lights it next, unmarked. While a task is running or paused the lantern is that task's, so the folded Next line names the passed item instead, under "Anytime today", and in Focus the foot line does (5.4), unless a timed item starts within 15 minutes or its slot is under way (section 9.8, and screen 7c). Either way, whatever in the app says what comes next names it.
3. If Anytime today is empty but timed items remain:
   - "Nothing running";
   - "Free until 14:00" as the white sentence;
   - "Ring the bank at 14:00" in ash beneath;
   - no Start button, because nothing on screen can be started yet.
4. If nothing has today's date: screen 7b (section 5.7b).

Start lights the lantern on the spot: the words stay and grow to 40/46, the bar appears full and starts to burn, "Now" appears, and the drawer folds to its Next line. For six seconds the Next line offers Undo, which stops the session as if it had never begun. Started at 9:58, by 10:05 this is screen 1.

**Coming back after time away:**

- After any time away, the app opens on this screen if anything has today's date and nothing runs; on 7b if nothing has today's date; on paused Today (7c) if a task was paused and left, or a session was closed in the background (section 4); or on screen 1 if something runs. There is no greeting, no "welcome back", no date of last use, no summary and no list of what moved. Nothing on any tab marks the days in between.
- Within the same logging day, the app restores exactly where the person was, including scroll position, an open drawer and drafts.
- At the logging-day boundary (04:00), these things happen quietly:
  - An item planned for a day that has passed goes back to the inbox with no date and no mark, in its usual order.
  - A paused capsule goes.
  - A session that was still running is closed at the moment its estimate ran out, so the days away are not counted as time worked. With no estimate, it closes at the last moment the app was open.
  - None of this is mentioned.
- A routine says "Ran today" only when it has run today.
- **At accessibility text sizes,** the half drawer rests folded to its Next line, so the lantern has room.

**On the board, in the band under row 3** (section 2): "7, 7b and 7c · Weighed, not overlooked". Heading: "While something runs, the rest of today stays folded", with "Whether that is enough is the first thing to test with people." under it. Then three paragraphs:

- "For this audience, a task out of sight is easy to lose track of. Lantern's fold is kept on purpose, so the step stays the one lit thing while it burns. When nothing runs, the day rests half open, as on 7."
- "What answers the risk: the Next line names what comes next and how soon on every tabbed screen, says Rest of today in words, and opens in one tap without putting the step out."
- "A timed item whose slot passes unstarted goes to the top of Anytime today, unmarked. The idle lantern lights it next. While a task runs or is paused, the Next line and Focus's foot name it, as on 7c, unless a timed item starts within 15 minutes or is under way."

Draft 5 set this panel in row 4 under "After a tap", far from the screens it is about, and quoted a review's warning on the owner's board; it now says the concern directly.

### 5.7b Nothing planned: the way back after weeks

**Caption.** "7b · Nothing planned". Title: "The way back after weeks". Text: "Whatever was planned for a day that has passed is back in the inbox, unmarked. So the canvas says only what is true now, low where the lantern sits, and offers one way in: the inbox, opened at its newest end. With nothing for today, the drawer rests at its lip as a plain stone edge: no grabber, no words, no empty line and no zero."

This is rule 4 of the idle lantern, and the usual screen after weeks away: every past-dated item has gone back to the inbox, so nothing has today's date. Draft 2's caption on screen 7 promised "the same screen after ten minutes or three weeks" without drawing this case.

**Surfaces.** Charcoal to 730, with the lantern's falloff centred a little above the unlit block, at about (170, 390), a pool of light that reaches up toward the header, with the top of the screen at the canvas's own charcoal (draft 5 centred it at 440, which left the upper canvas flat). Then the stone drawer, resting at its lip. No terracotta on the canvas.

**Top to bottom:**

- **Status bar,** 9:12, white glyphs.
- **Header row:** "Monday 14 December" in ash, and Me.
- **The unlit block,** bottom-aligned to end at 550, where the lantern sits on Today, so it is near the thumb and the canvas above it is simply quiet:
  - **368–444:** "Nothing planned for today" in white 32/38, weight 700, on two lines. It is the first line. Draft 4 put "Nothing running" above it, two negatives stacked in white on the screen meant for someone back after weeks, and with nothing planned there is nothing that could be running; the missing capsule and the absent terracotta already say it;
  - **454–474:** "Anything without a date is in the inbox." in ash 17/22;
  - **494–550:** "Open the inbox": a white pill from x 24, as wide as its words.
- **Dock line:** capture alone, at x 302–366.
- **The drawer at its lip,** from 730: stone with its 28 radius, and the tabs on it. There is no grabber, no handle, no words, no chevron and no hairline: nothing has today's date, so the drawer has nothing to hold and nothing to say. It is not a button and is not in the reading order. Draft 4 kept the grabber, a drag affordance that did nothing, because a pull only rubber-banded back: a small false promise on the screen for someone returning after weeks. Draft 3 kept the folded handle with only "Rest of today ⌃" at the right and an empty second line, which read as a render that failed. Capture and the tabs keep their places.
- **Tabs,** Today current.

**Choices: 2.** Open the inbox and Capture. Me and the tabs are the frame.

**Where "Open the inbox" lands.** On Tasks › Inbox, scrolled to its newest end, so the last things written down are in view above the dock line and a returning person is not dropped at the top of a long list sorted oldest first. Items that came back from past days keep their usual order and carry no mark. Planning one for today is its page's when pill, as always.

### 5.7c Paused: the way back after a pause that was left

**Caption.** "7c · Paused". Title: "Paused, and one tap to let it go". Text: "Where the app opens when a task was paused and left. Paused is said in words, the bar stands still in ash, and nothing says how long it has been. Resume is where Pause was, and Set aside puts the task away at its step. The dentist call, whose slot passed meanwhile, is on the Next line under Anytime today, unmarked." A smaller line, muted 13/18: "After a clock left running was closed at its estimate, the same screen shows the empty outline and reads "estimate 25" in place of the minutes."

This is the most common way back for this audience: something was paused, or its clock was forgotten and closed (section 4), and the person returns hours later. Draft 3 described it and did not draw it, and as described the only way to let go of the paused task was to open Focus first.

It is 13:20 on the same Tuesday. The email was paused at 10:05 with 18 minutes left. The 10:30 and 11:00 items passed unstarted and have quietly joined the top of Anytime today, in the order their slots fell, so the dentist call is first. The next timed item, 14:00, is 40 minutes away, so the Next line names the call (section 9.8).

**Surfaces.** As screen 1: charcoal to 684 with the lantern's falloff centred at about (170, 380), then the folded stone drawer. There is no terracotta on the canvas: terracotta means a clock is running.

**Top to bottom:**

- **Status bar,** 13:20, white glyphs.
- **Header row, 58–102:** "Tuesday 24 November" in ash, and Me. There is no greeting, no "welcome back" and no figure for the time away, then or later.
- **The lit block, 308–550,** one button that opens paused Focus. It ends at 550 as on Today; the minutes row is 44 tall for Set aside, so the block starts 14 higher than Today's.
  - **308–328:** a 16 pt pause glyph in ash where the Now dot sits, "Paused" in white 15/20 at weight 650, then "·" and "step 2 of 3" in ash at 500. "Focus ›" in ash at the right, as on Today.
  - **332–358:** "Write the school email" in ash 20/26, weight 600.
  - **372–418:** "Write the question" in white 40/46, weight 700. The step is still the largest thing on the screen.
  - **446–456:** the bar, 342 × 10, **frozen in ash**: its fill ash at 72% on the ash-30 track (3.7:1), the ash end cap kept, and no white tick and no halo, because nothing burns.
  - **480–508:** "18 min left" in white 22/28 at weight 600, then "of 25" in ash 15/20. There is no end time: a paused clock has none. The minutes are white, not terracotta.
  - **472–516:** "Set aside", an ash-20 pill 44 tall with white 15/20 at weight 600, right-aligned to x 366 on the minutes row, in the same place as paused Focus. It is a separate button, not part of the block, named "Set aside Write the school email. It keeps its place at step 2." So letting go is one tap from where the person lands.
  - **530–550:** the note line, as on Today.
- **Dock line, 606–670,** every object 64 tall, in Today's places:
  - "Step done": an ash-20 pill, x 24–162, with the check and white text. It stays, because the step may have been done while away;
  - "▶ Resume": the white primary pill, x 172–292, with a play glyph and charcoal 17/22 at 600, in Pause's place, so Pause and Resume are one spot that changes its word. Its content is centred by its ink, 17.5 pt either side: the play glyph's ink sits right of its box's centre, and draft 4 left 21 pt before the glyph and 14.5 after the word;
  - Capture at x 302–366.
- **Folded drawer:** "Anytime today" over "Call the dentist", from x 24 with no time, no mark and no "missed", and "Rest of today ⌃" at the right. The handle is named "Anytime today: Call the dentist. Rest of today." Tabs show Today current. Draft 5 named "14:00 Ring the bank" here, so the call that passed while the email was paused stayed out of sight on the most common way back: the paused email holds the lantern and Resume keeps the drawer folded, so the idle lantern could not light it, although section 9.8 promised it would not drop out of sight.

**With the estimate used up** (a clock left running, closed at its estimate): the track is the 1 pt ash outline with nothing inside, and the minutes row reads "estimate 25" in white, never "0 min left". Everything else is the same.

**Capsule:** not shown. The lantern is on screen, paused.

**Choices: 5.** The block (opens Focus), Set aside, Step done, Resume and Capture. Me, the handle and the tabs are the frame.

**Behaviour:**

- **Resume** starts a new session at step 2; the bar turns terracotta and burns, the minutes turn terracotta and gain their end time, and "Paused" becomes "Now". A new Live Activity starts. For six seconds the Next line offers Undo, which pauses it again.
- **Set aside** puts the task away with its place kept at step 2, ends the paused state, and leaves Today on the idle lantern (screen 7's rules). For six seconds the Next line reads "Set aside" over "Write the school email" with Undo.
- **Step done** finishes step 2 and moves the block to step 3, still paused.
- Spoken: the block's label begins "Paused:" and has no end time; VoiceOver reads "Paused" first.

### 5.8 The running task's own page

**Caption.** "8 · The running task". Title: "The task lit, its steps on a rail". Text: "Lantern's own task page: steps on an even rail with the current one marked Now, and the note in a dark field so the step stays the brightest thing. Every other task's page carries the capsule here. This one is the lit task itself, so the capsule is not shown and the slot holds Focus, which opens upward from the dock line."

**Surfaces.** Charcoal to 684, then the stone folded drawer. It is the one screen in Lantern with its own layout, so it is drawn.

**Top to bottom:**

- **Status bar,** 10:05, white glyphs.
- **Header row, 58–102:** "‹ Today" as an ash-20 pill with a back chevron at x 24, then at the right "⋯" (a 44 pt ash-20 circle) and Me.
- **122–160:** "Write the school email" in white 32/38, weight 700.
- **170–190:** "Today" in white at weight 600, then "· 25 min estimate · 7 min so far" in ash 15/20, set inline so each "·" has a word space and 0.3em on either side, as everywhere. Draft 4 set the line as separate flex pieces, which dropped the word spaces and left the first dot 8 pt after "Today" and 6 before "25".
- **202–222:** the bar, 132 × 8, with its tick, halo and end cap; 12 pt, then "18 min left" in terracotta 15/20 at weight 650; 12 pt, then "ends 10:23" in ash.
- **The steps, from 244,** on a rail, every row 58 tall so the discs sit on one even pitch: a 2 pt line of hair-dark at x 37, from the first disc's centre to the last. Each marker is a 28 pt disc, with the step 16 to its right:
  - 244–302: a sage disc with a 16 pt charcoal check and the same 5 pt charcoal ring as the other two, then "Find the school address" in ash 17/22 at 500. The disc sits in a 44 pt button named "Undo step done: Find the school address";
  - 302–360: a white disc marked "2" in charcoal 14 at 700, with a 5 pt charcoal ring that cuts the rail; "Write the question" in white 22/28 at 600, then 12 pt after it on the same baseline the terracotta dot and "Now" in terracotta 15/20 at 650, as the Now tag is drawn on charcoal. Draft 2 set "Now" above the step, which made the gap to step 1 74 pt and to step 3 56;
  - 360–418: a charcoal disc with a 1.5 pt ring of ash at 55% and the 5 pt charcoal ring outside it, marked "3" in ash; "Read it once and send" in ash 17/22.
  - Every disc carries the 5 pt charcoal ring, so the rail stops 5 pt short of each disc, above and below, and all four joins match. Draft 5 gave the ring to discs 2 and 3 only, so the rail touched the done disc and stood off the other two.
- **438–514:** the note in an ash-8 field, x 24–366, with a 20 radius and padding 14, 18 and 16: a 16 pt note glyph and "Note" in ash 13/18 at 650, then "When is the permission slip due?" in white 17/23 at 500 (13.2:1). A tap opens a stone sheet to edit it.
- **Dock line:** a white "⌃ Focus" pill, x 24–292 and 64 tall like everything on the dock line, then capture. The up chevron says Focus opens upward out of the page, as it grows out of the capsule elsewhere, and pairs with "⌄ Today" in Focus. Draft 2's play glyph read as "start again" on a task that was already running.
- **Folded drawer and tabs** as on screen 1, with Today current, because the page was pushed from Today.

**Capsule:** not shown. This page is the lit task, so the dock line's first slot, where every other page carries the capsule, holds the page's own way into Focus. Glasshouse showed its capsule here; Lantern showed "Back to it". Lantern's label becomes "Focus", so the way into Focus has one name everywhere.

**Choices: 4.** The steps (one list), the note, Focus and Capture. Back, "⋯", Me, the handle and the tabs are the frame.

### 5.9 Routines

**Caption.** "9 · Routines". Title: "The capsule on every place". Text: "Four routines and a way to add one. Morning ran earlier today, and that is all the list says about it. A routine starts from its own page, and starting one stops the email's timer, which keeps its place at step 2."

No direction drew Routines. It is drawn here with the capsule docked, so the board shows the capsule on a third place as well as Tasks and a task's page.

**Surfaces.** Charcoal, as a place drawn in the default (section 5.6). If the places are white, it follows 6b.

**Top to bottom:**

- **Status bar,** 10:05, white glyphs.
- **Header row, 58–102:** "Routines" as a place title, white 28/34 at 700, tracking −0.02em, and Me.
- **114–134:** "Open a routine to start it." in ash 15/20, the helper line, as Tasks has one.
- **Four rows, 62 tall, from 142,** with the row metric of every list (11 above and below the two lines), no ring (a routine is not ticked from the list), the title from x 24 in white 17/22 at weight 500 and a second line in ash 13/18, and a 20 pt right chevron in ash at the right, its ink ending at x 366, which says the row opens the routine's page. No dividers and no cards:
  - 142–204: "Morning", "6 steps". Before the chevron, an 18 pt check in ash (1.75 stroke), 4 pt, and "Ran today" in ash 15/20, with no disc. It is a plain fact about today, with no count, no streak and no days, and it is no brighter than the titles. Draft 5's sage disc (#DFE9E0) was the most luminous mark in the list and pulled the eye from the routines' names;
  - 204–266: "Leaving the house", "4 steps";
  - 266–328: "Evening wind-down", "5 steps";
  - 328–390: "Sunday reset", "7 steps".
- **398–442:** "+ New routine": a 20 pt plus and "New routine" in ash 17/22, as "Add a step" is drawn.
- Draft 4 drew three text-only rows with no trailing mark and left about 240 pt of bare canvas above the capsule, so the page looked unfinished beside Tasks.
- **Dock line:** the lifted capsule for the email, over the charcoal fade, and capture.
- **Folded drawer** with "Next · in 25 min" over "10:30 Call the dentist", and "Rest of today ⌃" at the right; its shadow above the fade, as on 3a. Tabs show Routines current.

**Choices: 4.** The list, New routine, the capsule and Capture. Me, the handle and the tabs are the frame.

**Rules:**

- A row opens the routine's own page, which has its own Start. Starting a routine while a task runs stops that task, which keeps its place at its step (section 14), with the same sentence under Start that a task's page shows ("Starting this stops the timer on Write the school email. It keeps its place at step 2.") and six seconds of Undo.
- A running routine lights the same lantern ("Leaving the house · step 2 of 4") and travels in the same capsule ("2 min left · Leaving the house", the header's lifted exhibit).
- "Ran today" shows only when the routine has run today, and goes at 04:00. Nothing is ever said about days a routine was not run, or how often it runs.

---
## 6. Outside the app: Lock Screen, Live Activity, Dynamic Island and Android

On the board these sit in row 4 under "Outside the app", at actual size, after every in-app screen. The column's text: "Drawn at actual size. The card starts on Start or Resume, and ends on Pause, on done, when another task starts, and with the logging day. The bar and the minutes are the system's own timers, so nothing has to be sent from a server. The Island's three states are in the header."

### The Lock Screen

**Caption.** "Lock Screen". Title: "The Lock Screen: the same object, at actual size". Text: "The step, the bar and the minutes, in the same order and colours as the capsule, and when the next booked item is. Step done works without unlocking, and a tap anywhere else opens Focus. There is no Pause here: pausing ends the card. Capture is the right-hand control, under the thumb as in the app; iOS lets the person change it." A smaller line: "System text (the status bar, the keyboard and this clock) is set in Inter, standing in for SF Pro. The wallpaper stands in for the person's own. The card's mark is the app's own, from assets/logo.svg."

**Surfaces:**

- The person's own wallpaper, drawn as a mid-tone landscape at dusk: a sky from #3F5363 at the top through #5B6F7C to a warm #B8977F horizon, and four layers of hills from #7D867F down to #2C3430. Draft 2's near-black gradient left the charcoal card with no outline (1.1 to 1.2:1). Here the card measures 2.6 to 4.1 against the hills behind it, and the date and clock sit on sky at 5.2 to 8.0 for white.
- A charcoal Live Activity card.

**Top to bottom:**

- Status glyphs in white, and a lock glyph centred at about y 66.
- "Tuesday 24 November" in white 19/24, weight 600, centred at about y 104, in the system's face.
- "10:05" in white, about 104 pt at weight 600, centred at about 128–236, in the system's face, as the current Lock Screen draws its clock.
- The Live Activity, x 16–374 and y 600–756, laid out below.
- At the foot, the system's two Lock Screen controls, each a 50 pt circle at y 772–822:
  - at the left, the camera control;
  - at the right, x 294–344, the person's optional Adnotia capture control, a white plus glyph on the system's glass circle (white at 16% with a light rim), which opens capture straight away. The right-hand slot is the one recommended in the app's setup, because it puts capture under the right thumb, as the capture disc is in the app at x 302–366. iOS lets the person put any control in either slot, or none, so this is a suggestion the person can change; it is drawn here as recommended. Draft 5 drew it at the left.
- Home indicator in white.

**Choices:** the card (opens Focus), Step done, and the optional capture control.

### Lock Screen Live Activity

The card is charcoal: the activity's background tint is #222624. It is 358 wide and 156 tall, inside the system's 160 limit, with 16 of padding and the system's corner radius.

**Row 1, 18 tall:**

- the app's mark, as on its home-screen icon: the logo from `assets/logo.svg` at 13 × 12 in an 18 pt stone square with a 5 radius;
- 8 pt of space, then "Write the school email · step 2 of 3" in ash 13/18, weight 500;
- "Adnotia" in ash 13/18 at the right.

**Row 2,** 6 below: "Write the question" in white 22/28, weight 700.

**Row 3,** 12 below: the bar, full width and 8 tall, with terracotta at 72% on ash-30, a white tick 2 × 16 and an ash end cap.

**Row 4,** 10 below and 44 tall:

- at the left, "18 min left" in terracotta 17/22 at weight 600, over "ends 10:23 · next 10:30" in ash 14/18. The second line says when the next booked item is, which is what a glance at a locked phone is most often for. "of 25" is in the spoken label;
- at the right, "Step done": a white pill 44 tall with a 16 pt check and charcoal 15/20 text at weight 600.

Step done runs without unlocking (an App Intent button, iOS 17 and later). The card then moves to "Read it once and send", step 3 of 3, and on the last step the button reads "Done". Tapping anywhere else on the card opens Focus. A Step done from here is taken back in the app: the next time the app opens, if the last thing done on the card was Step done, the Next line reads "Step done" over that step with Undo for six seconds, as after a tap in the app; after that, the done step's disc still un-ticks it (section 9.7). A tap in a pocket is then one tap from undone, where the person lands.

There is no Pause button on the Lock Screen. Pausing ends the activity, so a Pause button there would be a button that makes the card vanish, and one easily pressed in a pocket. Pause is in the app and in the expanded Island.

**After the estimate** (drawn beside the Lock Screen): the track turns to a 1 pt ash outline with nothing inside it and no tick, and row 4 reads "27 min so far" over "estimate 25". Its caption: "After the estimate: the track turns to an empty outline, nothing burns, and the time so far counts up. Nothing turns red and nothing alerts. If the app stays in the background 15 minutes past the estimate, the session is closed at the moment the estimate ran out, and the card goes."

### Dynamic Island

The Island's ground is black. Terracotta on black measures 8.7:1 and ash on black 9.4:1. It is drawn in the board's header only.

**Compact:**

- leading: the bar, 34 × 6, in its smallest form: a rounded ash-30 track and a rounded terracotta fill at 72%, no tick and no end cap;
- trailing: "18m" in terracotta 15/20, weight 650, with tabular figures.

These are the capsule's two ends.

**Minimal:** "18" in terracotta 14, weight 650.

**Expanded on a long press,** about 370 × 160:

- "Now" beside the camera at the left, and "step 2 of 3" in ash 13/18 at the right. The camera is drawn in black, as the system draws it: it is never shown inside the Island;
- "Write the question" in white 17/22, weight 700, below the camera, 38 from the top;
- the bar, 6 below it, full width and 6 tall, with its tick and end cap;
- 12 below the bar, so the tick clears the buttons: "18 min left" in terracotta 15/20 over "ends 10:23" in ash, then "Step done" as a white pill and "Pause" as an ash-20 pill with white text, each 44 tall, right-aligned to the bar's end, with 12 between the minutes and the first pill;
- last, 4 below, "Next · 10:30 Call the dentist" in ash 13/18. This keeps "what next" visible outside the app.

### How it behaves

**What it shows:** the same facts as the capsule, in the same order and colours.

**When it starts and ends:**

- It starts on Start or Resume.
- It ends straight away on Pause, on the task being done, and when another task starts (that task gets its own).
- It ends 15 minutes past the end of the estimate if the app has stayed in the background, at the same moment the session is closed (section 4).
- It ends at the end of the logging day at the latest. The app also sets a stale date and ends any activity whose day has passed the next time it runs.
- It never appears in the Island while the app is in front.

**With no server, the minutes cannot be pushed each minute.**

- The bar burns by itself, drawn with the system's timer-interval progress view.
- The minutes line is drawn with the system's timer text. If a minutes-only system format is available, it reads "18 min left". If not, it shows the system's minutes and seconds, and the end time "ends 10:23" carries the meaning.
- This needs checking in the build.

**Other states:**

- **When the estimate runs out** (the stale date is set to 10:23), the card switches by itself to its stale layout: the outline track, and "estimate 25" beside a system count-up of the time so far. Nothing turns red and nothing alerts. A second stale date 15 minutes later ends it.
- **No estimate:** the count runs up (`Text(timerInterval:countsDown: false)`), and the bar grows from the leading edge with no track behind it, its full width an hour (section 9.2).

### Android

Android has no Dynamic Island. The equivalent is an ongoing progress notification, a Live Update on Android 16 (`Notification.ProgressStyle`), with a status-bar chip reading "18m". It is drawn on the board as a stand-in, 358 wide on a system dark surface (#1B1D1C on the board), in the system's face:

- a header line: the app's mark, "Adnotia · ends 10:23", and at the right the chip, "18m" in charcoal on terracotta (6.3:1). The end time is fixed text set once at Start or Resume (the sub-text), so it never goes stale and needs no updates; the chip and the chronometer carry the minutes;
- the title "Write the question" in white 16/22 at 600;
- the text "Write the school email · step 2 of 3" in ash 14/20;
- the progress bar, full width and 6 tall, in its smallest form;
- one action, "Step done", in white 14/20 at 600, 44 tall.

Its caption: "Android 16: an ongoing Live Update with a chip in the status bar. The same step, bar and minutes, a fixed end time that never goes stale, one action, Step done, and no Pause."

A chronometer counts down (`setChronometerCountDown(true)`, or up with no estimate). It follows the same rules as iOS: no Pause on the notification, it ends on Pause, 15 minutes past the estimate in the background, and with the logging day. Whether keeping it current needs a foreground service, and of which declared type, is for the build to check. The chronometer counts by itself either way.

### Capture outside the app

These all open the same capture sheet, with the draft kept:

- an iOS Lock Screen and Control Centre control;
- the Action button;
- an Android Quick Settings tile;
- a home-screen widget.

The home-screen widget uses the same parts again (step, bar and minutes). It is not on this board.

---
## 7. Tokens, and where each colour may go

Lantern's tokens are kept. Ratios were measured with the WCAG 2.x formula.

| Token | Value | Text on it | May go | Never |
|---|---|---|---|---|
| `charcoal` | #222624 | white 15.3, ash 6.9, terracotta 6.3 | The present: Today's canvas, Focus, the running task's own page, the capsule, the Live Activity. Text and glyphs on every light surface. The plus of the capture disc. On white places, only the things that make or mark the present: the plain "Start" pill when nothing runs, and the "Now" tag. The ground of the places, drawn as the default (3a, 6a) | A decorative panel or card. A button on a white page that is not the present, such as "Start this instead" while something runs |
| `white` | #FFFFFF | charcoal 15.3 | Primary text on charcoal. The primary pill on charcoal (Step done, Start, Focus, and Resume when paused). The ground of the places, if the owner chooses white (3b, 6b): Tasks, Routines, Library, Me, and pages not running. Fields in sheets. The current tab's lozenge and a selected segment's thumb on light | Text on terracotta (2.4). Text on any light ground |
| `ash` | #A9AFAB | — | Secondary text, glyphs, rings, the bar's end cap and the paused bar on charcoal (6.9). The outline of a used-up bar track. Duration tracks on charcoal. Text on the lifted capsule (5.1) and on ash-8 (5.9). Text in the Island (9.4 on black) | Stone (1.9), white (2.2), ash-20 (4.6), terracotta (1.1) |
| `terracotta` | #F28C5E | charcoal 6.3 | On charcoal: the bar's fill, the minutes figure, the Now dot and word. On any surface: the capture disc (charcoal plus and ring) and the Save pill (charcoal text) | Text or glyph on stone (2.1), white (2.4) or sage. Under white text (2.4). On ash-20 (4.3). Any other fill. Any warning |
| `stone` | #EEF0EC | charcoal 13.4, muted 5.9 | The rest of today: the drawer in every position. Sheets. Switch tracks on white. The when pill | Ash or terracotta text |
| `sage` | #DFE9E0 | charcoal 12.3, muted 5.4 | The disc behind a done tick, and nothing else | Marking the current tab or a selection (1.1 against stone, 1.2 against white). Large areas |
| `muted` | #595C5B | — | Secondary text and duration tracks on stone (5.9), white (6.8), the tints (5.1 and 5.8) and sage (5.4) | On charcoal (2.3) |
| `ash-20` | #3D413F | white 10.4 | Secondary pills on charcoal: Pause, Step done while paused, +5 min, Set aside, Me, "⌄ Today", "‹ Today", "⋯", and "Start this instead" on a charcoal page. The selected thumb of a switch on charcoal | Ash text (4.6). Terracotta (4.3) |
| `ash-30` | #4B4F4D | — | The bar's track on charcoal. Terracotta against it is 3.4. The bare track against charcoal is 1.8, which is why the end cap exists | Text |
| `ash-8` | #2D312F | white 13.2, ash 5.9, terracotta 5.5 | The note field on the running task's page. The track of a switch on charcoal | The capsule (draft 3's lift, 1.16 against the canvas, was too weak) |
| `ash-15` | #363B38 (ash 15% over charcoal) | white 11.4, ash 5.1, terracotta 4.7 | The lifted capsule's fill on a charcoal place, 1.34 against the canvas | Any other surface: terracotta on it is the closest pair in the app to 4.5 |
| `ash-edge` | #737875 (ash 60% over charcoal) | — | The lifted capsule's full 1 pt edge, 3.4 against the canvas | Text |
| `tint-stone` | #DEE0DC (charcoal 8% on stone) | charcoal 11.5, muted 5.1 | Me on stone. The track of the Inbox and Today switch in the capture sheet. The Undo pill on the Next line. The same colour on a white page fills the quiet "Start this instead" pill, with a 1 pt edge of charcoal at 10% (`hair-light`) and a 0 1 3 lift (section 9.5) | The only mark of a state |
| `tint-white` | #EDEEED (charcoal 8% on white) | charcoal 13.2, muted 5.8 | Me, back pills and "⋯" on white | The only mark of a state |
| `hair-dark` | rgba(169,175,171,0.16) | — | The step rail and dividers on charcoal | — |
| `hair-light` | rgba(34,38,36,0.10) | — | The hairline under the drawer handle, the edge of the when pill on white, the edge of the quiet "Start this instead" pill, and the done disc's edge on light. The capture disc's edge on light is the same mix at 15% | — |
| `lamp` | #323634 (1.25 against the canvas) | white 12.3, ash 5.5, terracotta 5.1 | The brightest point of the lantern's falloff, behind the block on Today's canvas in every state (running, paused, idle, nothing planned, above the capture sheet) and in Focus | The places, a task's page, the running task's page, sheets |
| `black` | #000000 | terracotta 8.7, ash 9.4, white 21 | The Dynamic Island, which the system draws | — |

**Non-text contrast:**

- terracotta fill against its track: 3.4;
- the ash end cap against charcoal: 6.9;
- the used-up track's ash outline against charcoal: 6.9;
- the capture disc against charcoal: 6.3. On white and stone the disc itself is 2.4 and 2.1, so the control is identified by its charcoal plus (15.3 and 13.4), as any icon button is; its 1 pt hairline is a finish, not the cue;
- the capsule's edge against white and stone: 15.3 and 13.4. On a charcoal place its full ash edge measures 3.4 against the canvas (3.45 from the render, next to its own shadow), with a fill 1.34 lighter than the canvas; it is identified by its content, as any button is;
- the when pill on a charcoal page: a field with a 1 pt edge of ash at 36% (2.1), identified by its white text (15.3);
- the paused bar: an ash fill on the ash-30 track, 3.7;
- the current tab and a selected segment: the cue is not colour but a filled glyph (tabs) and the label at 700, on a white lozenge or thumb with a soft shadow. The lozenge alone is 1.1 against stone, and is not relied on;
- duration tracks: muted on stone 5.9 and on white 6.8, ash on charcoal 6.9. Each is one piece with nothing behind it, so it is a length and never a share;
- the quiet "Start this instead" on white: fill 1.33, edge 1.6, lift; identified by its charcoal label (11.5).

**Shadows:**

- the drawer: 0 −6 22 rgba(0,0,0,0.24). On a place with a capsule it is drawn as its own layer above the dock line's fade, so it falls evenly across the drawer's whole rounded top (5.3). On a white place it is short: 0 −1 0 rgba(34,38,36,0.08), a 1 pt hair along the rounded top, and 0 −1 5 rgba(34,38,36,0.08), which reaches about 6 pt up, so the 14 pt gap under the capsule stays white but for the capsule's own shadow (5.3);
- the cover, where a list goes under an edge (the open drawer at 606, the half drawer's tabs at 754): 0 −6 10 −6 rgba(34,38,36,0.16) along the edge's top, falling about 10 pt onto the list, below the covered row's ink (section 9.7);
- the capsule on light: 0 6 14 −6 rgba(34,38,36,0.4) and 0 2 5 rgba(34,38,36,0.12) (section 4);
- the capture disc on charcoal: 0 6 14 −6 rgba(0,0,0,0.55);
- the capture disc on light: 0 6 14 −6 rgba(34,38,36,0.45) and 0 2 5 rgba(34,38,36,0.14), with a 1 pt inner hairline of charcoal at 15%. Draft 3's 10% hairline and lighter shadow left the disc reading pastel on stone (2.1) and white (2.4);
- every shadow on the dock line ends inside the 14 pt gap above the drawer (670 to 684). Draft 4's reached 26 to 32 pt below the objects and greyed the top of the drawer under the capsule and the disc on every place;
- the current tab on light, and the quiet "Start this instead" pill on white: 0 1 3 rgba(34,38,36,0.12);
- a selected thumb on light: iOS's own thumb shadow, 0 3 8 rgba(0,0,0,0.12) and 0 3 1 rgba(0,0,0,0.04). The thumb is 1.15 against stone, so the shadow carries the lift and the label's weight the rest; the track's rim stays clean;
- a selected thumb on charcoal: 0 1 3 rgba(0,0,0,0.35);
- the capsule on charcoal, lifted: inset 0 0 0 1 #737875 (its edge), 0 6 14 −6 rgba(0,0,0,0.7) and 0 2 5 rgba(0,0,0,0.4);
- sheets: 0 −8 28 rgba(0,0,0,0.28).

**Halos:**

- the white tick on a lantern-size bar: 0 0 10 2 rgba(242,140,94,0.45).

That is the only halo. The Now dot is a crisp disc: at 7 pt a halo read as a muddy ring. Halos are static, appear on charcoal only, and never animate.

**The lantern's falloff:** a static radial falloff behind the block, wherever the block stands on Today's canvas (running, paused, idle, nothing planned, and raised above the capture sheet) and in Focus. It is an ellipse with radii 360 across and 300 down, from `lamp` (#323634) at its centre, through 66% of that lift at 38% and 22% at 72%, to charcoal at its edge, so it is a pool around the block and the top of the screen, the header and the corners stay at the canvas's own #222624, as Lantern drew it. Draft 4's ellipse, 540 by 520 on a screen 390 wide, lifted almost the whole canvas (#272B29 even at the top corners), so Today read greyer than Lantern's charcoal and the ground under the dock line rose to #2D312F, which took the ash-20 pills to 1.25:1 against it; they are back to 1.4. It is centred on the block, a little above its middle where the block sits low: about (170, 380) on Today and paused Today, (170, 390) on 7b, (170, 220) on 7, (170, 190) above the capture sheet, and (190, 330) in Focus. On Today that lifts the band from the header to the Now line (110 to 250) from #232725 to #2B2F2D at x 170, while the top corners stay at #222624 and the ground on the dock row at #232725, so Pause measures 1.46:1 against its ground. Draft 5 centred it at (170, 430) on Today and paused Today and (170, 440) on 7b, which left the canvas from the header to about y 200 flat. It never moves and never pulses. It is the light the sentence gives off, so the dark above the step reads as light dropping away rather than as unused space; on the unlit screens it is the same light, because the block still stands there. Draft 3's falloff peaked at #2A2E2C (1.11:1), which is invisible on a phone in daylight. Every text pair on it is measured at its brightest point: ash 5.5, terracotta 5.1, white 12.3.

**Fades:**

- white: rgba(255,255,255,0) at 582 to 0.94 at 606, and 0.94 down to the drawer, behind the dock line on white pages while a capsule shows;
- charcoal: the same in rgba(34,38,36) on charcoal places;
- on the open drawer and the half drawer there is no fade over text: the list ends on a covered row at a drawn edge, the cover, with its faint top shadow (section 9.7). Below the edge the drawer is solid stone down to the tabs, so nothing passes behind the capsule (5.2).

Without a capsule there is no full fade. Capture keeps its lane clear instead (section 5.7), and every list ends with 96 pt of padding.

**There is no red, and no colour for "late".** No hue is described anywhere as helping attention.

---

## 8. Type

Instrument Sans (SIL Open Font License), variable, at width 100 and weights 400 to 700, with two words in the capsule set narrower (below). It is the only face. Tabular figures are used on every time, count and minute (check that the bundled cut has `tnum`).

| Role | Size/line | Weight | Tracking | Used for |
|---|---|---|---|---|
| Step in Focus | 44/50 | 700 | −0.026em | The step in Focus |
| Step | 40/46 | 700 | −0.024em | The lit step on Today, the lantern above the capture sheet |
| Idle sentence | 32/38 | 700 | −0.022em | The first item lit when nothing runs |
| Page title | 32/38 | 700 | −0.022em | A page pushed under a back pill: a task's own page |
| Place title | 28/34 | 700 | −0.02em | A place, in the header row: Tasks, Routines, Library, Me, and "Rest of today" on the open drawer |
| Minutes in Focus | 24/30 | 600 | −0.01em | "18 min left" in Focus, over "of 25 · ends 10:23" |
| Minutes | 22/28 | 600 | −0.01em | "18 min left" on Today; in white, with no end time, when paused |
| Heading | 22/28 | 700 | −0.015em | The Live Activity step, the current step on the running task's page (at 600) |
| Field | 22/28 | 500 | −0.01em | The capture field |
| Context | 20/26 | 600 | −0.005em | The task title above the step |
| Control | 17/22 | 600 | −0.005em | Pill labels, the capsule's step, the title on the Next line, "Rest of today" on the half drawer's handle, Close |
| Sheet title | 17/22 | 650 | −0.005em | "Capture" at the top of its sheet, in charcoal |
| Row | 17/22 | 500 | 0 | List titles, "After this", the done line in Focus |
| Meta | 15/20 | 500 | 0 | The date, "of 25 · ends 10:23", the note line, helper lines, "First on today's list", the task title in the capsule (at width 95), Focus's context, "Ran today", Focus's foot |
| Meta strong | 15/20 | 600–650 | 0 | "Now", "Paused" (at width 90 in the capsule), Me, back pills, "Focus ›", "Focus" at the head of Focus's context line, "18 min left" in the capsule, segment labels, Undo, "+5 min", "Set aside" |
| Label | 13/18 | 650 | +0.01em | Section labels, "Next · in 25 min", "Rest of today" on the folded handle, and "Hide" on the open drawer |
| Tab | 12/16 | 600, or 700 when current | +0.01em | Tab labels |

**Floors.** Nothing is below 12 pt or below weight 400. Everything is sentence case. There are no uppercase micro-labels and no italics.

**The system's own text** (status bar, keyboard, Lock Screen clock, notifications) is never Instrument Sans. The app does not draw it.

**Larger text.** Text scales with the system text size, through iOS Dynamic Type and Android's font scale. Map each role to the nearest system style:

| System style | Roles |
|---|---|
| `largeTitle` | Step and idle sentence |
| `title1` | Page title and place title |
| `title2` | Heading |
| `title3` | Context |
| `body` | Control and row |
| `subheadline` | Meta |
| `footnote` | Label |
| `caption1` | Tab |

The step sizes are capped at 1.6 times their base: 64 on Today, 70 in Focus and 51 for the idle sentence. Everything else follows the system to the largest accessibility size. Bold Text moves 500 to 650 and 600 to 700.

**The width axis.** At regular sizes two words in the capsule use it, and nothing else does: the task's name on line 2 at width 95, so "18 min left · Write the school email" fits whole in 238 pt (draft 4 dropped the name over a 4 pt shortfall), and "Paused" at width 90, so it fits the 54 pt first column where Now sits. The difference is a few percent and reads as the same face. At accessibility sizes, the capsule's text and the tab labels may narrow to width 87.5 before they wrap or shorten. The step never narrows.

---

## 9. Components

### 9.1 The lantern

The lit block on charcoal, in this order:

1. the Now line;
2. the task title;
3. the step;
4. the bar;
5. the minutes;
6. the note.

It is bottom-aligned above the dock line on Today, and grows upward. In Focus it sits at eye height, framed by the step before and the step after, has no task title line, and its bar runs edge to edge.

When paused it keeps its size and order, with the pause glyph and "Paused" in place of the dot and "Now" (in the capsule, the word alone, section 4), the bar frozen in ash, the minutes in white with no end time, and "Set aside" beside the minutes (5.7c). There is no terracotta in it.

When idle it is unlit: "Nothing running" in white first, then the same structure a size smaller (32/38), with no dot, no bar and no terracotta. With nothing planned for today (7b) it holds only "Nothing planned for today", one line in ash and "Open the inbox", bottom-aligned where the lantern sits.

In every state the lantern's falloff sits behind it (section 7).

### 9.2 The bar, and duration tracks

**Shape.** A rounded track (radius half its height) in ash-30. The terracotta fill runs from the leading edge, and its length is the time left as a share of the estimate, so it burns down toward the leading edge.

- **The tick:** a white mark 2 wide and 8 taller than the bar, at the end of the fill.
- **The end cap:** a 2 wide ash mark, 4 taller than the bar, at the end of the track, so the whole estimate can be read against charcoal.

**Sizes:**

| Where | Size | Form |
|---|---|---|
| Focus | 390 × 12, edge to edge, square ends | Tick, halo; the screen's edge is the end |
| Today | 342 × 10 | Tick, halo, end cap |
| Lock Screen | 326 × 8 | Tick, end cap |
| The running task's page | 132 × 8 | Tick, halo, end cap |
| The Island, expanded | full width × 6 | Tick, end cap |
| The capsule | 238 × 4 | End cap, no tick |
| The Island, compact | 34 × 6 | Smallest |
| Android's notification | full width × 6 | Smallest |

**The smallest form,** for any bar under 60 wide or drawn by the system: one rounded ash-30 track and a rounded terracotta fill, with no tick and no end cap. At 56 pt, a fill, a white tick and a grey end cap together looked like a syringe, which is the wrong picture to carry on every screen of an app that keeps medication off them.

**The capsule's bar** is long and thin, so it keeps the end cap, which shows the whole estimate against charcoal, and drops the tick, which at 4 pt would only be noise.

**Focus's bar** runs edge to edge with square ends, a horizon under the step. It is the one bar drawn that way, and it is one of the marks that tell Focus from Today at a glance.

**States:**

- **Estimate used up:** at every size, the track turns to a 1 pt ash outline with nothing inside it, no fill, no tick and no end cap (6.9:1). It reads as "the time is spent", where an empty track with a tick at its far end read as zero or broken. The words say the rest: "27 min so far", "estimate 25".
- **Paused:** the fill turns ash and stops (3.7 against the track). The white tick and its halo go, because nothing burns; the end cap stays, so the whole estimate still reads.
- **No estimate:** there is nothing to burn down, so the bar counts up in the duration track's language (below): a terracotta length grows from the leading edge, one piece with round ends, with no track behind it, no tick and no end cap. Its full width stands for an hour, so 7 minutes is about 40 pt on Today (342 wide) and 28 pt in the capsule (238); past an hour it stays full and the number says how much. With nothing behind it, it cannot be read as a share of an estimate, and the words beside it, "7 min so far", say that it counts up. Drafts 4 and 5 drew terracotta squares here, one per five minutes, Glasshouse's pip meter (section 15).

**Duration tracks** sit after a duration in a list row: the number, 7 pt (6 in a 13/18 second line), then one short track.

- The track is Lantern's own duration mark, the burning bar at its smallest: 4 tall with round ends (radius 2), one piece, in muted on light and ash on charcoal, centred on the line's x-height. Its length is 1.5 pt a minute: 10 min is 15 pt, 15 is 22.5, 20 is 30, 30 is 45 and an hour 90. Longer stays at 90, and the number says how much.
- Lantern drew a 12 pt dash before the number for 10 min. Before the number a dash reads as a minus sign ("— 10 min"); after it, and as long as the time it stands for, it reads as a length. It is one piece, so it is not a count, and it is flat, so it cannot be taken for the pause glyph beside Pause.
- There is nothing behind it. A rounded track with part of it filled is the shape of the lantern's bar, which means time left, so draft 2's meters read as "half done" on tasks never started. A duration track is the whole of the time, drawn alone, so nothing reads as progress.
- One length is one minute wherever durations sit in a list.
- Tracks are drawn only where durations sit together and can be compared: the rows of the rest of today, the half drawer and the inbox. They are not drawn where one duration stands alone: the idle lantern's sentence and the when pill. The folded Next line carries no minutes at all (section 5.1).
- In a column of timed rows the tracks sit in a slot as long as the longest in that list (20 min, 30 pt, on screens 2 and 7), left-aligned after the number, so every number ends on one line at x 329; the slot, not every track's ink, ends at 366 (section 3). In an inbox row's second line the track follows the number directly.

The first board drew a bare 4 pt dash before the number, which read as a minus sign. Draft 2 drew a part-filled meter, which read as progress. Draft 3's upright marks read as pause. Drafts 4 and 5 drew small squares after the number, one per five minutes: they read as none of those, but they were Glasshouse's pip meter, a second graft from Glasshouse that the owner did not ask for and the board never named. Draft 6 returns to Lantern's own mark, moved after the number and scaled to the minutes.

A bar or a track always sits beside a written number. Time is shown as a quantity, as a number, and where it applies, as an end time.

### 9.3 The capsule

See section 4.

### 9.4 The capture disc

- A 64 pt terracotta disc with a 28 pt charcoal plus (2.25 stroke, round caps). The plus identifies the control: 6.3:1 on the disc, and the disc 6.3:1 against charcoal.
- On white or stone it has its shadow (section 7) and a 1 pt inner hairline of charcoal at 15%, and no ring. The 2 pt charcoal ring of the first board looked like a cartoon outline beside the soft-shadowed capsule; draft 3's 10% hairline left it pastel.
- Always at x 302–366 and y 606–670, with its centre at (334, 638), on every screen including Focus.
- It is the only terracotta control apart from Save, and it is never anywhere else.
- **Name:** "Capture". **Hint:** "Write something down. It goes to the inbox."
- **With a draft kept:** a 12 pt white dot with a 2 pt charcoal ring at its top right, and the name "Capture, draft kept".

### 9.5 Pills and buttons

Every pill has a radius of half its height. Main actions on the dock line (Step done, Pause, Resume, Focus) are 64 tall, the height of the capsule and the capture disc, so the dock line is one band of equal-height objects. Main actions elsewhere (Start, Start this instead, Open the inbox) are 56 tall with padding 18 and 22. Both have a 20 pt glyph, an 8 gap, and a 17/22 label at weight 600. Header pills ("⌄ Today", "‹ Today"), "+5 min", "Set aside" beside the minutes, Save and Undo are 44 tall with 15/20 (17/22 for Save) at weight 600.

"Focus" on the running task's page carries an up chevron, not a play glyph: Focus opens upward, and play means Start everywhere else.

| Kind | Fill | Text | Where |
|---|---|---|---|
| Primary on charcoal | white | charcoal | Step done, Done, Start, Focus, and Resume when paused |
| Secondary on charcoal | ash-20 | white | Pause, Step done while paused, +5 min, Set aside, Me, "⌄ Today", "‹ Today", "⋯", and "Start this instead" on a charcoal page |
| The present, on white | charcoal | white | "Start" on a white task page, when nothing runs |
| Quiet, on white | #DEE0DC, a 1 pt edge of charcoal at 10% and a 0 1 3 lift, 56 tall | charcoal | "Start this instead" on a white page, while something else runs |
| Quiet on light | tint-white or tint-stone | charcoal | Me, "‹ Today", "⋯" |
| Save | terracotta | charcoal | The capture sheet only |
| Text button | none | muted 17/22 at 600 | Close, with a 44 target, beside the sheet's charcoal title |
| Undo | tint-stone, 44 tall, padding 20 | charcoal 15/20 at 600 | At the right of the Next line, beside both its lines, and of Focus's foot line. A pill rather than an underlined word, so it reads as a native control by its shape |

"Focus ›" on Today is not a button: it is ash words and a chevron labelling the lit block, which is the button.

**A glyph and a word are centred by their ink, not their box.** A glyph's box is wider than its ink, and the play triangle's ink sits right of its box's centre, so on the dock line Step done takes 2 pt more padding on its right, Pause 4 and Resume 6. Each then has the same space either side of what is drawn (16, 25 and 17.5 pt).

Destructive actions (Delete) are quiet text buttons with a confirm step, never coloured.

### 9.6 Switches

**On light** (the Tasks switcher, and Inbox or Today in capture):

- a track in stone (on white) or tint-stone (on stone), 44 tall;
- each part a 44 pt target, sized to its word with the same padding either side, the labels measured at weight 700 so nothing shifts when the selection moves (17.7 pt either side in the Tasks switcher, whose parts are 75.6, 78.6, 114.1 and 73.7 wide); where the words are the same length, as in capture's Inbox and Today, the parts are equal;
- the selected part is a white thumb inset 3 pt with iOS's own thumb shadow (0 3 8 rgba(0,0,0,0.12) and 0 3 1 rgba(0,0,0,0.04)), and its label in charcoal at weight 700;
- the others are muted at weight 600.

**On charcoal** (the Tasks switcher in 6a): an ash-8 track, an ash-20 thumb with the shadow 0 1 3 rgba(0,0,0,0.35), the selected label white at 700 and the others ash at 600.

The selection is shown by the thumb's shape and the label's weight, never by fill alone. There is no outline: a 1.5 pt outline round the thumb made the switch read as a wireframe.

Focus has no segmented control. "+5 min" is a 44 pt pill beside the minutes, and Pause sits on the dock line as on Today.

### 9.7 Rows

**List rows:**

- sized to their text, with 11 above and below it: 44 for one line, 62 for two. The one metric holds in every list: the rest of today, the half drawer, Tasks and Routines, so the space between any two rows is the same 22 whatever they hold;
- the title in charcoal 17/22 at weight 500 (white on charcoal);
- an optional second line in muted 13/18 (ash on charcoal): steps, an estimate with its track, or the start of a note after a 12 pt note glyph. Never a date it was added, never how long it has waited. On a row with a second line, the ring is centred on the title line, not on the two lines;
- every title in a list at weight 500, the next item included: it is marked by its "in 25 min" line, not by weight;
- no dividers and no cards.

**Routine rows** (screen 9) have no ring, because a routine is not ticked from a list: the title from x 24, the step count as the second line, a 20 pt right chevron in ash at the right (the row opens the routine's page), and, only on a routine that has run today, an 18 pt check and "Ran today" before the chevron, both in ash on charcoal (muted on a white place), with no disc. The sage disc is kept for a done tick; "Ran today" is a plain fact, set no brighter than the titles.

**The covered row.** Where a list stops at an edge with more below it (the open drawer above the dock line, the half drawer at the tabs), the last row on screen is drawn as covered, so the list reads as going on and never as complete:

- **ring and title on one ramp.** One cover lies over the whole row, from nothing at the ring's top (10 below the row's top) to 30% stone at the ring's foot (34 below), so the ring and the title grey together toward their foot as one object. Charcoal under 30% stone is about 5:1 on stone: measured from the render as the darkest pixel in each pixel row, the ring runs from about 13:1 at its top to 5.3:1 at its foot, and the title from 10.5:1 at its cap tops to 5.5:1 at its baseline. The whole circle and every glyph stay above 4.5:1, so the ring is still a control that reads whole and the title is text like any other;
- **the edge is drawn.** Below the row the surface it goes under, the cover, carries a faint shadow along its top (0 −6 10 −6 at 16% charcoal) that falls about 10 pt onto the list, below the row's ink: at 606 on the open drawer, under the capsule and capture, and at 754 on the half drawer, along the tabs. So the row reads as passing under something, not as dimmed or done;
- no ring or title is cut by the edge or faded out.

Draft 5 faded the ring out at its foot to about 1.07:1 while the title greyed only to 30%, so the two parts fell at different rates and the ring read as a loading arc or a broken C, and nothing on screen 7 was drawn covering the row. Draft 4 faded the whole row into solid stone on screen 2, which took its title under 3:1, and left the half drawer's last row at full strength, so it looked like the end of the list.

**Titles beside the capture disc.** On the half drawer, where capture floats over the list with no capsule, every anytime title ends by x 286, 16 short of the disc, wrapping to a second line only when it is longer than that, so no title is ever cut or faded beside it; a wrapped row grows to 62 (section 5.7).

**Timed rows:**

- the time in a 60 pt column, charcoal 17/22 at weight 650 with tabular figures;
- the title from x 84;
- the minutes and their track at the right, the tracks in a fixed slot so the minutes form one column; the slot ends at 366 (section 9.2).

**Tick rings and done discs:**

- An open task has a 24 pt ring (charcoal on light, ash on charcoal; 1.75 stroke) in a 44 target. Tapping the ring marks the task done. Tapping the row opens it.
- **A ticked row stays where it was** until the list is next opened: its ring becomes a sage disc with a check, its title turns muted, and the disc is a button named "Undo done: Renew the parking permit" that un-ticks it. With "Done today" off, a mis-tapped ring would otherwise make a task vanish with nothing on screen, and for this audience a task out of sight is easy to lose track of. Where a folded Next line is on screen, it also reads "Done" over the title with Undo for six seconds (section 9.8).
- A done task has a 24 pt sage disc with a 16 pt charcoal check, and its title in muted. On light grounds the disc has a 1 pt hairline of charcoal at 10%, because sage alone is 1.1 against stone; the check (12.3) carries the meaning.
- **A done step's disc is a button.** In Focus and on the running task's page, the disc of a done step sits in a 44 pt target named "Undo step done: Find the school address". A tap un-ticks it and makes it the current step again. This is also how a Step done pressed on the Lock Screen is taken back.

**Section labels:** muted 13/18 at weight 650, 4 above the first row.

**The "Now" tag** marks the running task in a list on a white place: a charcoal pill 22 tall with white 13/18 at weight 650. On a charcoal place it is a terracotta dot and the word "Now" in terracotta 15/20 at 650, as in the capsule; the current step on the running task's rail carries it after its words.

### 9.8 The drawer

Stone, with a 28 radius on its top corners, a 38 × 5 grabber mark (muted at 42%), and the drawer shadow.

**Resting places:**

| Position | Drawer top | Contents | When |
|---|---|---|---|
| Lip | 730 | The tabs, on a plain stone edge, and nothing else: no grabber | Only when nothing has today's date (7b) |
| Folded | 684 | The handle (two lines of Next) and the tabs | The default while something runs or is paused; on places, always |
| Half | 366 | The handle, Later today, Anytime today and the tabs | Only when nothing runs or is paused. The default then, except at accessibility text sizes |
| Open | 60 | The grabber, a header row with "Rest of today" and Me, the whole of today ending above the dock line, the cover from 606 with the capsule, capture and "⌄ Hide" on it, and the tabs | Pulled open from any tab |

While something runs, a drag snaps to folded or open, never to half, so the lit step is never on screen twice.

**At its lip** the drawer has nothing to hold, so it says nothing: no grabber, no handle, no words, no chevron, no hairline and no empty-state line. It is a plain stone edge under the tabs, not a button and not in the reading order, and it offers no drag. A grabber there would promise a pull that could only rubber-band back. The moment anything has today's date (a capture saved to Today, say) the drawer rises to its folded place, grabber and Next line with it. Capture keeps its place, because the dock line does not depend on the drawer.

The drawer stays where the person leaves it for the rest of the logging day, separately for running and idle. Each new day starts at the default.

**The handle is one control on every drawer that holds something.** It is a button the full width of the drawer's top, with the grabber centred 8 below the edge and a 20 pt chevron ending at x 366:

| Position | Handle | At the left | At the right |
|---|---|---|---|
| Folded | 684–754 | The Next line, two lines, as in the table below. Line 2 stops by x 246 | "Rest of today ⌃" in muted 13/18 at 650, centred across both lines (715–735), so it names the handle and heads no column |
| Half | 366–412 | "Rest of today" in charcoal 17/22 at 600, one deliberate row (386–408): the drawer's name | The up chevron alone, in muted |
| Open | 684–754, the folded handle's place | Nothing: plain stone | "⌄ Hide", a 20 pt down chevron and "Hide" in muted 13/18 at 650, at 715–735, its ink ending at x 366, exactly where "Rest of today ⌃" sits when folded. Named "Hide the rest of today" |
| Lip | none | Nothing | Nothing |

**The toggle stays in one place, open or folded.** On the open drawer the handle is where it is when folded, at the foot under capture, so the drawer opens and closes from one spot in reach of the right thumb, and on opening "Rest of today ⌃" turns into "⌄ Hide" where it stood. Pulling the sheet down by its grabber, tapping the current tab and Android's back close it too. The first board put Hide under the capsule, between the list and the tabs, on a row of its own; draft 2 gave it a 44 pt row above the header, which cost a row of the day; drafts 3 to 5 put it in the header row by the grabber, out of the thumb's reach, which left the spot that had opened the drawer doing nothing and the band under the dock line empty. Here it sits under capture rather than under the capsule, in the same place as its folded twin.

When folded, the first two lines read as below. The six-second rows, at the foot of the table, take priority over every other row while they last; the others are checked from the top of the table down, and the first that applies is shown:

| Situation | Line 1 | Line 2 |
|---|---|---|
| A timed item starts within 15 minutes | "Next · in 10 min" | The time and the title |
| A timed item's slot is under way and it has not been started | "Next · until 10:40" | "10:30 Call the dentist" |
| The top of Anytime today holds an item whose slot passed today, and no timed item starts within 15 minutes | "Anytime today" | That item's title, "Call the dentist", from x 24, with no time, no mark and no "missed" (7c) |
| A timed item is next | "Next · in 25 min" | The time and the title. No minutes: under "Rest of today ⌃" they read as the length of the rest of the day (5.1) |
| No timed item is left today | "Anytime today" | The first anytime title |
| Nothing is left for today, after some was done | "Rest of today" | "Nothing else planned" |
| Nothing has today's date (7b) | No handle: the drawer rests at its lip (above) | None. No empty-state copy and no zero |
| For six seconds after Step done or Done | "Step done" | "Write the question", with the Undo pill at the right |
| For six seconds after a tick | "Done" | "Renew the parking permit", with Undo |
| For six seconds after Start | "Started" | "Write the school email", with Undo |
| For six seconds after Start this instead | "Started Call the dentist" | "Write the school email at step 2", with Undo, so both tasks are accounted for and the email's place is in sight (249 of the 252 pt beside Undo) |
| For six seconds after Save | "Saved to the inbox" | "Ask Ana about Friday", with Undo |
| For six seconds after Resume | "Resumed" | "Write the school email, step 2", with Undo |
| For six seconds after Set aside | "Set aside" | "Write the school email", with Undo |
| The first six seconds after the app opens, if the last thing done on the Lock Screen card was Step done | "Step done" | "Write the question", with Undo |

The Next line names the true next item on every screen, including the page of that item. Draft 2 skipped the item on its own page, so the one anchor for "what is next" changed meaning from page to page.

**Undo.** Each of these lasts the full six seconds. Other touches do not end it: only a newer undoable tap replaces it, with its own six seconds. It stays while VoiceOver focus is on it. Undo is a 44 pt tint-stone pill at the right of the handle, beside both lines, and "Rest of today ⌃" is hidden while it shows, so there is one control at the right. Undo after Step done un-ticks the step; after Done it also reopens the task; after a tick it un-ticks the task; after Start it stops the session as if it had never begun; after Start this instead it stops the new session and starts the old task again at its step; after Save it removes the item and reopens the sheet with the text; after Resume it pauses again; after Set aside it brings the paused task back. In Focus, the foot line shows the same words and Undo. The six seconds are an owner decision (section 14). Four of these are drawn on the board under "After a tap", each as the top of the drawer, rounded on its top corners only.

**A timed item whose slot ends unstarted** quietly loses its time and goes to the top of Anytime today, unmarked, on the same day, rather than into the person's order. Two that pass go in the order their slots fell, the earlier first. Whatever in the app says what comes next then names it, unless a timed item starts within 15 minutes or its slot is under way (the two rows of the table above for those, which come first because they are tied to a time):

- **when nothing runs or is paused,** the idle lantern lights the first anytime item, so it is the next thing lit (5.7, rule 2);
- **while a task runs or is paused,** the lantern is that task's, so the folded Next line names it under "Anytime today", on every tabbed screen and on a task's own page. This holds on the most common way back, paused Today (7c), where the drawer has no half position and Resume keeps it folded. Draft 5 named only the next timed item there, so a call that passed while a task was paused stayed hidden until that task was set aside or done;
- **in Focus, running or paused,** Focus has no Next line, so its foot line names it the same way: "Anytime today · Call the dentist", with no time and no mark (5.4). Draft 6 as first reviewed fixed the foot as "Later today" and the next timed item, so in paused Focus at 13:20 it read "Later today · 14:00 Ring the bank" and the call was out of sight.

A sheet, while it is open, covers these as it covers everything under it. Outside the app, the Lock Screen card names only the next booked time, as it always does (section 6). Nothing marks the item as missed, late or moved, anywhere. This is a product decision; see section 14.

### 9.9 Sheets

- Stone, with a 24 radius on the top corners, a grabber mark, and a header row with the sheet's title in charcoal 17/22 at 650 at the left and a text button (Close) in muted 17/22 at 600 at the right. The title leads; the button is the quieter.
- A sheet raised from a place carries the capsule on its top edge, as a picture only: it cannot be tapped while the sheet is open (section 4). The capsule is not repeated inside the sheet.
- Sheets close with Close, a swipe down, a tap outside or Android's back, and anything typed is kept.

### 9.10 Header and Me

**The header row** is 58–102.

- **Left:** the date (Today and the idle screen), a place title (Tasks, Routines, Library, Me), or a back pill naming where it goes ("‹ Today", "⌄ Today").
- **Right:** Me, 44 tall and 52 wide, ending at x 366, on every screen, so that the "if things are bad right now" page, which is Me's first row, is two taps from anywhere. Me is ash-20 on charcoal and the matching tint on light. Above the capture sheet it stays live: a tap closes the sheet, keeping the draft, and opens Me.
- **Me is at 58–102 on every screen but one.** On the open drawer (screen 2) the header row is 76–120, because the drawer is a sheet whose edge sits at 60, below the status bar, so that the canvas is still felt above it, and its row has to sit under its own grabber. The board says so in that screen's caption.
- A task's page also has "⋯" just left of Me.

**Titles: two treatments, no more.**

- **A place title** names where you are among the five places, and sits in the header row at the left, in 28/34 at 700, tracking −0.02em: "Tasks", "Routines", "Library", "Me", and "Rest of today" on the open drawer, which is a place pulled up over any tab.
- **A page title** names a page pushed from somewhere, and sits under its back pill at 122–160, in 32/38 at 700, tracking −0.022em: a task's own page ("Call the dentist", "Write the school email"). A page's context goes on its own line under the title.
- Today and Focus have no title: on Today the header row holds the date, and in Focus "Focus" leads the context line in ash at 15/20 and 650 under "⌄ Today". On both the lit step is the page and the one white heading. Draft 4 set "Focus" as a page title at 32, which gave Focus two white headings; draft 3 had four title treatments (Tasks at 28 in the header, a task's page at 32, Focus at 22 inline with its context, and Rest of today at 22 in a lowered header row).

### 9.11 Tab bar

Four equal items, x 16–374 and y 760–812, each 52 tall with a 26 radius and 4 between them. Each item is a 24 pt glyph over a 12/16 label. The bar ends 19 pt above the home indicator and its lozenges stay clear of the display's rounded corners; draft 2's ran 12 pt into the bottom safe area, with the current lozenge 9 pt above the home indicator.

- **Others:** a line glyph and the label in muted at weight 600.
- **Current:** a white lozenge with the shadow 0 1 3 rgba(34,38,36,0.12) and no outline, the filled form of the glyph in charcoal, and the label in charcoal at weight 700. It also carries the selected trait or `aria-current`. The filled glyph and the weight are the cue, not the lozenge's colour.

Sage is not used for the current tab.

There is never a badge or a count on a tab.

**Glyphs:**

| Tab | Glyph | Filled, when current |
|---|---|---|
| Today | A sun | A solid disc with heavier rays |
| Tasks | Two ticks beside three lines | Two solid discs with white ticks, and heavier lines |
| Routines | Two arrows in a loop | Heavier loop with solid arrowheads |
| Library | An open book | Solid pages with a white spine |

### 9.12 Icons

One hand-drawn set on a 24 grid: 1.75 stroke, with round caps and joins, and 2.25 for the check and plus at large sizes. There is no icon font and no emoji.

The set is: check, pause, play, plus, back chevron, down chevron, up chevron, right chevron, note, calendar, more (three dots), ring, and the four tab glyphs in their line and filled forms.

The app's mark, from `assets/logo.svg`, is used outside the app only: the home-screen icon, the Live Activity and the notification. It is never drawn inside a screen of the app.

Every icon that stands alone has a spoken name. Icons next to a word are hidden from screen readers.

---

## 10. Motion

These are notes for the build; the board is static. Motion explains where something went. It never celebrates, and it never runs on its own.

### Movements

**The lantern and the capsule are one layer at two sizes.**

- When the drawer opens, or Today is left by a tab, the layer's frame goes from the canvas to the slot, x 24–292 and y 606–670, and its corner radius goes from 0 to 32.
- A drag on the drawer drives this frame by frame. Otherwise it runs on a critically damped spring of about 350 ms, with no overshoot. In SwiftUI that is `.spring(response: 0.35, dampingFraction: 1)`. On Android it is a spring with a damping ratio of 1.
- Four parts travel and scale on that curve:

  | Part | On Today | In the capsule |
  |---|---|---|
  | Step | 40 pt | 17 pt |
  | Bar | 342 × 10 | 238 × 4, its tick fading out in the first 100 ms; the end cap stays |
  | Minutes | 22 pt, "18 min left" | 15 pt, "18 min left", moving under the bar; the words stay |
  | Dot and "Now" | The Now line | Line 1 |

- The note, "of 25 · ends 10:23", "step 2 of 3", "Focus ›", Step done and Pause fade out in the first 100 ms. The task title fades out too, and fades in after the minutes on line 2 only where it fits whole. Step done and Pause take no taps from the start of this movement until a second after it ends (section 5.1).
- The reverse is exact, and those parts fade in during the last 100 ms.
- The bar keeps burning throughout, because its fill is the live value on every frame.

**Capsule to Focus.**

- The capsule's frame grows to the full screen in about 400 ms on the same spring, with its radius going from 32 to the screen's corner.
- The step goes from 17 to 44 pt and rises to eye height, and the bar stretches out to both edges of the screen, its ends squaring as it reaches them.
- The context line, the done step, "After this", the controls and the foot line fade in over the last 120 ms.
- "⌄ Today" reverses the movement into the capsule, or into the lantern on Today.

**Capture.**

- The disc grows into the sheet in about 300 ms, critically damped, while the keyboard rises on the system's own curve.
- From Today, the lit block slides up into the top third at the same time, and the task title moves up into the Now line.
- Save drops the sheet, and the confirmation crossfades into the Next line over 150 ms.

**Starting.**

- On Today, the sentence grows from 32 to 40 pt, the bar draws in from empty to full over 250 ms, "Now" fades in, and the drawer folds from half to its Next line on the drawer spring.
- **Pausing and resuming.** The bar's fill turns from terracotta to ash (or back) over 150 ms and stops; the tick and halo fade; "Now" crossfades to "Paused"; the minutes turn white and lose their end time; Pause and Resume crossfade in the same slot, and Step done changes fill in place. Nothing moves.
- **The drawer at its lip** rises to its folded place on the drawer spring when something gets today's date.
- On a task page, the page turns from white to charcoal over 300 ms. If the places are charcoal, only the layout changes.

**Step done.**

- The finished step moves up and turns to ash, and the next step rises into its place, over 250 ms.
- The bar does not change, because it measures the task.
- The Next line crossfades to "Step done" and Undo over 150 ms, and back after six seconds.

**The drawer** follows the finger one to one. On release it springs to the nearest allowed resting place, taking the finger's speed into account. As it opens, "Rest of today ⌃" at the foot crossfades to "⌄ Hide" in the same place over 150 ms, and back as it folds.

**The bar** redraws every second, about 0.23 pt per second on Today.

**Numbers** change in place, with tabular figures in a fixed-width box. Digits do not roll.

**Haptics** are used only when the system's haptics are on: one light tap when the capsule settles, one when the drawer comes to rest, and one on Save and on Step done.

**Never:**

- bounce;
- pulse or glow that moves;
- shimmer, confetti or sound;
- a celebration, unless the person has turned on the brief acknowledgement in Rewards. Even then it is the words "Step done" or "Done" in the Now line for two seconds, and nothing else.

### Reduce Motion (and Android's Remove animations)

Build this path first. It is also the fallback while the animated path is unproven on older phones.

- Nothing travels or scales. Lantern to capsule, capsule to Focus and the capture sheet all become 200 ms cross-fades. The capsule fades in already in its slot, and Focus fades in whole.
- A drawer under a finger still follows the finger, because that movement is the person's own. The lantern fades instead of shrinking, and the capsule appears when the drawer stops.
- Lighting on Start, and on a task page, becomes a 150 ms colour change.
- The bar steps once a minute, together with the number, instead of burning continuously.
- Tab switches and pushed pages are fades.
- Haptics still follow the system setting.

**Other display settings:**

- Increase Contrast: hairlines go to 25%, the lifted capsule's edge on charcoal goes to ash at 80%, and ash-20 pills gain a 1 pt ash outline.
- Reduce Transparency: fades become solid bands.

Nothing else is translucent, so nothing else changes.

---

## 11. Accessibility

### Spoken labels

Labels use the same words as the screen.

| Element | Label | Hint, value or trait |
|---|---|---|
| The lit block on Today | "Now: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23. Note: When is the permission slip due?" | "Opens focus." |
| The bar, where read alone | Meter "Time left" | Value "18 of 25 minutes left" |
| The capsule | Section 4 | Section 4 |
| Capture | "Capture", or "Capture, draft kept" | — |
| Step done | "Step done: Write the question" | — |
| Pause | "Pause" | — |
| Resume | "Resume" | — |
| Set aside | "Set aside Write the school email. It keeps its place at step 2." | — |
| The lit block, paused | "Paused: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left. Note: …" | "Opens focus." |
| +5 min | "Add 5 minutes" | — |
| "⌄ Today" | "Back to Today" | "The timer keeps running." |
| The handle, folded | "Next, in 25 minutes: 10:30, Call the dentist. Rest of today" | "Shows the rest of today." |
| The handle, folded, naming a passed item (7c) | "Anytime today: Call the dentist. Rest of today" | "Shows the rest of today." |
| The handle, half | "Rest of today" | "Shows the rest of today." |
| The drawer at its lip (7b) | Not a control, not read | — |
| Hide, at the foot of the open drawer | "Hide the rest of today" | — |
| Undo on the Next line | "Undo step done: Write the question", and the like, naming what it takes back | — |
| A done step's disc | "Undo step done: Find the school address" | — |
| A tick ring | "Mark done: Renew the parking permit" | Each row is also a button that opens its task |
| A ticked row's disc | "Undo done: Renew the parking permit" | Until the list is next opened |
| "Open the inbox" (7b) | "Open the inbox" | "Opens at the newest items." |
| Start this instead | "Start this instead" | "Stops the timer on Write the school email. It keeps its place at step 2." |
| A done row | "Bins out, done" | — |
| A routine row | "Morning, 6 steps, ran today" | "Opens the routine." |
| Tabs | Their names | The current one has the selected trait |
| The Tasks switcher | "Inbox, selected, 1 of 4" | — |
| Me | "Me" | "Settings and help." Medication or Family is named in the hint only once the person has turned it on, so someone who never did never hears either word. Above the capture sheet: "Keeps your draft." |

### Announcements

- "Saved to inbox".
- "Step done. Now: Read it once and send".
- "Started Call the dentist. Write the school email keeps its place at step 2".
- "Paused". Pausing also ends the Live Activity.
- "Done: Renew the parking permit" after a tick.
- "Undone" after Undo, followed by what is now the case: "Now: Write the question".

### Where focus lands

- **Opening Focus:** on the step.
- **Closing the capture sheet:** back on the step (in Focus or on Today), or on the capture disc (on a place).
- **Opening the drawer:** on its heading.

### Reading order

The order is top to bottom, then the dock line, then the drawer.

1. **Today:** date, Me, the lit block, Step done, Pause, Capture, the handle, tabs.
2. **The rest of today:** "Rest of today" (a heading), Me, Later today with its rows, Anytime today with its rows, the capsule, Capture, "Hide the rest of today", tabs.
3. **A task opened:** Back, More, Me, "Call the dentist" (a heading), the when pill, "Start this instead", the sentence under it, Steps, "Add a step", the capsule, Capture, the handle, tabs.
4. **Focus:** "Back to Today", Me, "Focus, Write the school email, step 2 of 3" (a heading), "Undo step done: Find the school address", "Now: Write the question" (a heading), "After this: Read it once and send", the time meter, the minutes, "Add 5 minutes", the note, Step done, Pause, Capture, "Later today: 10:30, Call the dentist, in 25 minutes" (or whatever the foot reads, such as "Anytime today: Call the dentist").
5. **Capture:** the sheet is modal and the lantern above it is visual only. The order is "Capture" (a heading), Close, the field (with focus here on open), the helper line, Inbox or Today, Save, then Me, which keeps the draft.
6. **Tasks, in either colour:** "Tasks" (a heading), Me, the switcher, the helper line, the seven rows (each a row button and a ring), the capsule, Capture, the handle, tabs.
7. **Nothing running:** date, Me, "Nothing running, free until 10:30", the lit item ("First on today's list: Write the school email. Starts with Find the school address. 3 steps, 25 minutes, would end about 10:23", a button that opens the task), Start, "Rest of today", Later today, Anytime today, Capture, tabs.
7b. **Nothing planned:** date, Me, "Nothing planned for today" (a heading), "Anything without a date is in the inbox", Open the inbox, Capture, tabs. The drawer at its lip is not read.
7c. **Paused:** date, Me, the paused block ("Paused: Write the question …", a button that opens Focus), Set aside, Step done, Resume, Capture, the handle, tabs.
8. **The running task:** Back, More, Me, "Write the school email" (a heading), "Today, 25 minute estimate, 7 minutes so far", the time meter, the steps ("Undo step done: Find the school address", "Now, step 2: Write the question", "Step 3: Read it once and send"), the note, Focus, Capture, the handle, tabs.
9. **Routines:** "Routines" (a heading), Me, the helper line, the four rows, New routine, the capsule, Capture, the handle, tabs.
10. **Lock Screen:** the system reads the card as "Adnotia. Write the school email, step 2 of 3. Write the question. 18 of 25 minutes left, ends 10:23. Next: 10:30", then "Step done".

### Targets and colour

- Every target is at least 44 × 44. Capture and the capsule are separated by 10 pt and have different names.
- Nothing is shown by colour alone:
  - Now has the word and the dot;
  - paused says "Paused", on Today, in Focus and in the capsule, and the minutes lose their terracotta and their end time;
  - the current tab has a filled glyph and a heavier label;
  - a selected segment has a raised thumb and a heavier label;
  - done has a check, and "done" in its spoken label;
  - the estimate being used up is said in words ("27 min so far", "estimate 25") and drawn as an outline;
  - the white and charcoal places differ only in ground, and nothing means anything by it.
- Voice Control names match the visible words: "Step done", "Pause", "Start this instead", "Rest of today", "Hide", "Undo". The capture disc answers to "Capture".

### Large text

- **The lantern** grows upward into the dark. If it still does not fit:
  1. the note line moves to Focus and the task page only;
  2. the task title joins the Now line ("Now · step 2 of 3 · Write the school email");
  3. the block scrolls.

  The step is never cut off on Today or in Focus.
- **On the dock line of Today and Focus,** Pause becomes a 64 pt circle with the pause glyph at accessibility sizes. It keeps the name "Pause" and appears in the iOS Large Content Viewer. This leaves Step done its words and capture its place.
- **In Focus,** when the minutes and "+5 min" no longer fit on one row, "+5 min" moves under the minutes, left-aligned.
- **The capsule** grows from 64 to as much as 88 tall, growing upward. Line 1 may take two lines of the step. Line 2 gives way in this order, and "left" is never dropped:
  1. drops the task title whole, which stays in the spoken label (at regular sizes this already happens wherever the title does not fit);
  2. narrows "18 min left" to width 87.5;
  3. the bar keeps its full width; only its height stays 4.
- **The handle** drops "Rest of today" and keeps its chevron, then wraps its title to two lines and grows upward, and the dock line moves up with it by the same amount on every screen, so capture stays put relative to the tabs.
- **The half drawer** rests folded.
- **The Tasks switcher** becomes one pill, "Inbox ⌄", which opens a menu of the four lists.
- **The idle sentence** follows the step's cap, at 1.6 times its base.
- **Tab labels** stay at 12 and appear in the iOS Large Content Viewer on a long press. On Android they follow the font scale up to 1.3 times.
- **The capture sheet:** the field grows, and if the lantern no longer fits above it, it shrinks into the capsule riding the sheet's edge.

### Android

- Predictive back follows the visible structure:
  - from Focus to where it came from;
  - an open drawer folds;
  - the capture sheet closes and keeps the draft;
  - a task page goes back to the previous screen.
- TalkBack uses the same labels and order.

---

## 12. Screens described but not drawn

The running task's own page was described here in draft 1 and is drawn as screen 8 (section 5.8). Routines and paused Today were described here in draft 3 and are drawn in draft 4 as screens 9 and 7c (sections 5.9 and 5.7c).

**A routine's own page.** As a task's page (5.3): its name as a page title, its steps, and Start, with the sentence under Start when something else runs. Running, it is lit as the running task's page is (5.8), with "Leaving the house · step 2 of 4".

**Library.** A place with "Library", Me, and five rows, each a name in charcoal 17/22 over one plain line in muted 15/20:

- "Sleep";
- "Exercise";
- "Mindfulness";
- "Thinking tools" (if-then phrases, problem-solving);
- "How we know" (the evidence pages).

A tool's evidence tier is written in words inside the tool. It is never shown as a letter or a badge.

**Me.** A place (charcoal or white, as chosen) with "Me" and five rows:

- "If things are bad right now". Its page shows no capsule and no timer of any kind, even while something runs. Capture stays;
- "Settings" (lock, backup, rewards, reminders, text and display);
- "Medication";
- "Family";
- "About".

Medication and Family sit behind these two doors and appear nowhere else in this design.

**The when sheet.** A stone sheet with these options, all as large rows:

- "No date (inbox)";
- "Today, anytime";
- "Today at a time", which shows a time and a length when chosen;
- "Tomorrow";
- "Pick a day".

Below them, "How long" with −5 and +5 around the minutes, then "Done".

**Paused Focus.** As section 5.4 and screen 7c: the bar frozen in ash, the minutes in white with no end time, Resume as the white primary pill in Pause's place, Step done in ash-20, and Set aside in +5 min's place beside the minutes.

**Capture opened from a place.** The sheet as in 5.5, with the capsule riding its top edge as a picture (section 4). Not drawn.

**Done today.** The section described in 5.2, when the person turns it on.

---

## 13. Deliberately left out

**From Glasshouse,** everything except the capsule's place and its rules (the board names this under "One object at every size"), and one smaller thing named so the owner can see it: white places, drawn only as the alternative side of a choice. Left out:

- glass and blur;
- SF Pro inside the app;
- the floating white tab pill;
- the ring timer around an icon;
- title-case headers;
- the stock white list look as a given: white places are drawn, but only as the alternative side of a choice (3b and 6b), with charcoal drawn as the default;
- the capsule docked directly on the tab bar. Here it rides the dock line, resting 14 pt above the drawer's Next line and 90 pt above the tabs, so that capture keeps one place on every screen;
- Glasshouse's "18 min" without "left". Draft 3 took it to fit the task's name; the third review showed that a bare "18" beside a part-filled bar can be read as time spent, so "left" stays and the name gives way when it does not fit.
- Glasshouse's pip meter for durations, one pip per five minutes. It came in through the review of the first board and was drawn in drafts 3 to 5, as upright bars and then as small squares, without the board saying where it came from. Draft 6 draws Lantern's own mark instead, a short track after the number, scaled to the minutes (section 9.2), and the no-estimate bar grows as one length rather than counting squares.

**From Lantern:**

- the drawer's half position while something runs. It is kept only for when nothing runs;
- the Next line's tap straight into the dentist task. The tap now opens the rest of today;
- "End focus" in Focus, which read as stopping the clock. It is now "⌄ Today";
- the label "Back to it", now "Focus", with an up chevron;
- Focus's three-part control (+5 min, Pause, End focus). Focus now shares Today's dock line, with +5 min beside the minutes;
- the bar inset in Focus; it now runs edge to edge.
- the folded stone drawer in Focus. Lantern's Focus kept the drawer at its foot, with the Next line, and one pull brought the tabs back. Focus here is charcoal to the foot, with a foot line in plain text such as "Later today · 10:30 Call the dentist · in 25 min", following the Next line's rows (5.4); only its six-second Undo is a control. Two reasons: Focus and Today are told apart at a glance, since only Today has the stone drawer and the tabs (5.4), and nobody leaves Focus by accident, since the only ways out are "⌄ Today" and Me.

**Hidden gestures:**

- long-press menus;
- swipe actions on rows;
- swiping the capsule away, or dragging it up to open Focus.

Every action has a visible control, and the screen reader's custom actions only repeat visible controls.

**Anything that shames:**

- red;
- "overdue" or "late";
- counts of what was not done;
- streaks, points or badges;
- tab and icon badges;
- "you missed", "welcome back", greetings, or a summary of what happened while away.

A gap is never mentioned. A past item is simply unscheduled again.

**"Done today" by default.** It appears only when the person turns that reward on, and the board draws the default, so it is not on screen 2.

**Other things left out:**

- Seconds inside the app. The Lock Screen may show the system's minutes and seconds if a minutes-only format is not available.
- Pause on the Lock Screen.
- Anything the app starts, suggests or times by itself. The idle lantern lights the person's own first item and never starts it.
- A return key labelled Save on iOS, which the system cannot do, and a "Done" return key, because "Done" means finishing something here.
- Sound.
- Medication and Family on these screens. They are behind doors in Me.

**The Bookmark Edition's identity:** the serif headline, ruled lines and the bookmark.

**Not yet designed:**

- the rest of the charcoal set, which is drawn as the default: sheets, the drawer and the keyboard at night;
- a left-handed setting that mirrors the dock line, capture at the left, so capture is in one place for each person and under their thumb;
- the child's surface;
- the clinician's printed sheet;
- the home-screen widget;
- icons beyond the set above.

---

## 14. Decisions and checks this depends on

None of these is made here.

| Question | Assumed here | Whose |
|---|---|---|
| Charcoal or white places | Both drawn, charcoal first as Lantern's default (3a, 6a) and white, Glasshouse's look, as the alternative (3b, 6b). One judge recommends white, for the change of light that says where you are; the owner asked for Lantern, so charcoal leads. Nothing else depends on it | Owner |
| What is recorded when a timer is left running | Closed at the moment its estimate ran out once the app has been in the background 15 minutes past it, or with no estimate at the last moment the app was open. The app then opens paused, with no figure for the time away. Never shown as a fact about the person | Owner |
| The margin before a forgotten session closes | 15 minutes past the estimate | Owner |
| How long Undo stays | Six seconds, ended early only by a newer undoable tap, and longer while VoiceOver is on it. It covers Step done, Done, a tick, Start, Start this instead, Save, Resume and Set aside | Owner |
| A timed item whose slot passes unstarted | Loses its time and goes to the top of Anytime today the same day, unmarked, so the idle lantern lights it next, and while a task runs or is paused the folded Next line and Focus's foot name it under "Anytime today", unless a timed item starts within 15 minutes or is under way (9.8, 5.4, 7c). At the end of the day it goes to the inbox | Owner |
| Where "Open the inbox" lands after time away | Tasks › Inbox, at its newest end, as every time it opens. The alternative, a one-tap "Today" on every inbox row, was not taken: it adds a right-hand control to every row | Owner |
| A ticked task in a list | Stays in place, un-tickable, until the list is next opened | Owner |
| Taps ignored on Step done and Pause | During the capsule's movement, and for 1 s after Today or Focus has grown out of the capsule (500 ms when reached another way). Test on a phone | Build |
| What the paused Today offers | Resume as the primary action, Step done kept, Set aside beside the minutes, no end time and no figure for time away (5.7c) | Owner |
| Where the inbox opens | At its newest end, every time | Owner |
| A Step done from the Lock Screen | Undo in the Next line for six seconds the next time the app opens, then the done step's disc | Owner |
| Starting a routine while a task runs | Stops the task, which keeps its place. There is one lantern and one capsule | Owner |
| Whether the time box belongs to the task or the step | The task. The bar measures the task's estimate | Owner |
| Paused | Worked out from the latest stopped session today, plus "Set aside". The model has no paused field | Build |
| "Done today" and Tasks › Done | "Done today" follows the `doneList` reward (off by default). Tasks › Done is where a done task is reopened, and it shows no count | Owner |
| The five-choice count | The frame (tabs, Me, back, "⋯" and the drawer's handle) is not counted. The capsule and capture are. Paused Today has five | Owner |
| Live Activity minutes, buttons and lifetime | The system timer text, App Intent buttons (iOS 17 and later), and stale dates at the end of the estimate and 15 minutes later | Build |
| Whether the Live Activity keeps counting through an overrun | The card closes 15 minutes past the estimate if the app stays in the background, as drawn (section 6). The alternative: it keeps counting up ("40 min so far, estimate 25") until the person acts or the logging day ends. A task done in another app, such as an email, reaches the margin during real work, and a time-blind person may need the count most then; against it, a card that runs all day after a forgotten clock is the reminder nobody asked for | Owner |
| What a session the app closed itself is called | "Paused", as drawn: paused Today (7c) says "Paused" after a forgotten clock was closed at its estimate, though the person never paused it, which can prompt "did I forget something?". The alternative is "Timer stopped · step 2 of 3", with the same outline track and "estimate 25", so the words say what happened | Owner |
| Android Live Update, chip and foreground service | Android 16 `ProgressStyle`, with a chronometer and a fixed end time as sub-text. Whether a terracotta chip still qualifies for promotion to the system's surfaces is to be confirmed | Build |
| Local alerts when an estimate runs out | Only if the person set one when starting. Whether local alerts work with no server is unconfirmed | Build |
| Capture while a field has the keyboard | Behind the keyboard with the rest of the dock line, one tap once the keyboard is put away (section 3). The alternative, lifting capture alone above the keys, puts a disc beside the suggestion bar | Owner |
| The typeface | Instrument Sans, as Lantern used | Owner |

**To test with people, first:**

- whether the folded day while something runs is enough: whether people find the rest of today from the Next line, or lose tasks they cannot see (the "Weighed, not overlooked" note on the board);
- whether Today and Focus are now told apart at a glance, with "Focus" at the head of the context line, the edge-to-edge bar and +5 min beside the minutes, now that the step is the one white heading on both;
- whether the two-line Next handle on Today competes with the lit step on a real phone;
- whether "⌄ Today" reads as leaving with the clock still running;
- whether the idle lantern's "First on today's list" feels like the app choosing;
- mis-taps between the capsule and capture, and between the capsule's slot and Step done, on a real phone;
- whether the lifted capsule is found at a glance on charcoal places;
- whether duration tracks, a short length after the number, read as a quantity of time, and never as a trailing dash, as progress or as part of the bar;
- whether the task's name at width 95 in the capsule reads as the same face, and whether people miss it where a longer name gives way;
- whether the lantern's falloff, a pool at #323634 around the block, is seen on a real OLED screen in daylight and at night, and whether it ever reads as a smudge;
- whether the covered last row (ring and title greying together, under a drawn edge) reads as "the list goes on" on a phone, on the open drawer and the half drawer, and never as dimmed or done;
- whether people close the open drawer from "⌄ Hide" at the foot, where they opened it, or reach for the top of the sheet;
- whether "Anytime today" over a passed item on the Next line (7c), or at Focus's foot, is read as a plain reminder, with no sense of blame;
- whether the Undo line after Start this instead, "Started Call the dentist" over "Write the school email at step 2", reads as the email waiting at step 2 or as an instruction to write it there, since task titles are written as things to do. No form with a state word ("waits at step 2", "kept at step 2") fits the 252 pt beside Undo with the whole title; if people misread it, the title gives way first;
- whether anyone misses the next item's minutes on the Next line;
- the ash-20 pills on the lamp (Pause, Step done while paused) under Increase Contrast, with the 1 pt ash outline of section 10;
- whether "Open the inbox" at its newest end is where a returning person wants to start;
- whether the foot of a place (capsule, 14 pt, Next line, tabs) still reads as heavy, and whether a one-line handle on places at regular sizes would help;
- whether the keyboard's return key filing a capture surprises people. Undo covers a wrong save; if it still surprises, the key can put the keyboard away and leave Save to file;
- whether "Set aside" on paused Today is found, and whether it is ever taken as deleting the task;
- whether people want a left-handed dock line;
- charcoal and white places, in daylight and at night;
- the charcoal screens in daylight.

---

## 15. Where each part came from

**The base** is the proposal "Lantern, carried", which two of the three judges scored highest (8.5 and 8.5). It supplied:

- Today as Lantern drew it;
- the charcoal capsule above the folded stone drawer;
- the fixed capture position;
- the lantern sliding into the top third during capture;
- the idle screen with no terracotta;
- the running task's charcoal page;
- the Live Activity ending on Pause.

**From the judges' grafts:**

- **Capsule and capture as two objects on one dock line,** with a charcoal ring on the disc. This came from the slot proposal.
- **One layer at two sizes, and the Reduce Motion path built first.** From the slot proposal.
- **An ash end cap on the bar track, and paused said in words.** From the half-drawer proposal.
- **Never ash or terracotta on ash-20.** From the half-drawer proposal.
- **The Live Activity's minutes without push,** the no-estimate count-up, and the Android Live Update. From the half-drawer and first proposals.
- **The half drawer when nothing runs,** and the distance to the next booked item written on the idle lantern.
- **"⌄ Today" in place of "End focus".**
- **A visible way into Focus on Today** ("Focus ›"), with Pause kept on the face.
- **The draft dot,** the helper line in the capture sheet, and capture drawn from Focus as well (the inset).
- **Closing a forgotten session at the end of its estimate.**
- **A missed timed slot joining Anytime today.**
- **"Next" in the expanded Island.**
- **"3 of 6" for an untimed routine step.**
- **"Start this instead"** with its explanatory sentence.
- **The rule for returning after time away.**
- **"Anything with no date waits here."**
- **The current tab marked by something other than colour,** not sage. Draft 2 changed the outline to a filled glyph (below).
- **Save at the right of a row on the keyboard,** and no claim of a Save return key on iOS.
- **The lantern growing upward,** and the half drawer folding at accessibility sizes.
- **The full set of capture sources,** the note that the Island and capsule never show together, and the spoken "Saved to inbox" with focus returning to the step.
- **"Done today" flagged as a reward that is off until chosen.**

**From Glasshouse, beyond the capsule:**

- **White places, as the alternative side of a choice** (5.6). Charcoal is drawn first, as Lantern's default.
- Until draft 6, **duration marks, one per five minutes after the number**, which were Glasshouse's pip meter (two pips for 10 min, four for 20). They came in through the judges' review of the first board, and the board never said where they came from. Draft 6 replaced them with Lantern's own mark, a short track scaled to the minutes and moved after the number (section 9.2), so the capsule and the white alternative are now the only things taken from Glasshouse.

**Changed to fit the owner's request:**

- **The single dock line on short screens.** It was adapted into the compact rule in section 3, because it would have moved capture.
- **"Start this instead swaps the capsule in place."** It does so only where Start does not open the task's own page. On a task page, the page lights instead, because the running task's page stays Lantern's charcoal page.
- **"Done today".** Draft 1 drew it on. Draft 2 draws the default, off, and describes the section in 5.2.

**Changed in draft 2, from the review of the first board.** Three judges read it for faithfulness to the owner's choice, for ease of use, and for craft.

Faithful to what the owner asked for:

- **White places are no longer presented as settled.** Nobody asked for them, and Lantern was one dark app. Tasks is drawn in white (6a) and in charcoal (6b), side by side, with the trade-off set out under them for the owner (5.6). The header's idea no longer says "white is every other place".
- **The capsule names its task.** Glasshouse's capsule carried the task; the first board's did not, so on another task's page nothing said which task was running. Line 2 now ends with the task title, cut off if it must be, in place of the end time (section 4).
- **Lantern's running task page is drawn** (screen 8), where draft 1 only described it. The Lock Screen phone it replaced moved to "Outside the app", and the duplicates went: the Live Activity is drawn twice (running and used up) and the compact Island once.
- **"Start this instead" is quiet.** A charcoal pill 70 pt above the charcoal capsule gave a white page two dark "now" objects. It is now a tint-white pill with a charcoal outline, moved up under the when pill, and charcoal is kept for a plain Start when nothing runs.
- The header label now says the capsule sits above the Next line and the tabs, and section 13 says how that differs from Glasshouse.
- "Weighed, not overlooked" says on the board that the folded day while running was a choice, and what answers the risk.

Easier to use:

- **Focus shares Today's dock line:** Step done, Pause, capture, at the same x. On the first board Step done in Focus covered the place where Pause sits on Today.
- **Undo for the quick taps.** Step done, Done, Start this instead and Save each leave six seconds of Undo in the Next line, and a done step's disc un-ticks it (9.8, 9.7). Drawn under "After a tap".
- **The capsule is tap only.** A drag up on it would have opened Focus whenever someone started to scroll a list.
- **A forgotten clock stops counting.** After 15 minutes in the background past the estimate the session closes at the estimate and the app opens paused, so no screen shows the time away as a number (section 4).
- **No timer on the crisis page.**
- "Nothing running" is said first, in white, and the idle sentence is a size smaller than a running step. "Nothing … nothing booked" became "free until 10:30".
- The half drawer's handle says "Rest of today" in words, and capture keeps a clear lane on the idle screen.
- The Next line on a task's page skips that task.
- Tasks › Today is stated to be the same list as the drawer.
- The capsule riding a sheet is a picture only, so a tap cannot strand a draft.

Craft:

- The current tab is a white lozenge with a filled glyph and a heavier label, not an outlined chip; switch thumbs are white with a soft shadow, not outlined.
- The capture disc lost its 2 pt charcoal ring on light.
- Bars under 60 wide lost their tick and end cap, which made them look like a syringe.
- The bare duration dash, which read as a minus sign, became a small meter after the number, and left the when pill.
- The open drawer's Hide moved to the top by the grabber, and the handle is one control with words and a chevron on every drawer.
- The capture sheet rose to 280, with 12 above and below its helper line.
- "Focus ›" on Today is words, not a pill.
- The Now dot lost its halo.
- The system's own text (status bar, keyboard, Lock Screen clock) is in the system face, with Inter standing in on the board.
- The Live Activity carries the app's real mark, and the used-up track is an outline rather than an empty bar.
- Tasks shows seven realistic rows, and its switcher sizes "Coming up" to fit.
- The capture inset is cropped above the keyboard, and the rows have notes under every column.

Not taken in draft 2, and why:

- A count-free hint of more items on the Next line ("· more today"). The handle now says "Rest of today" on every screen, which does the same job without one more phrase on Today.
- Lifting the bar track to #565B58. Terracotta against it would drop to 2.9, under 3:1. The end cap carries the track's length on large bars instead.
- A default outline on Pause. Pause is identified by its glyph and white label (10.4); the outline stays an Increase Contrast setting.
- A lighter, one-line Next strip on places. It would make the handle differ between Today and the places, against "the same handle control on every drawer". The weight of the foot is listed as a test in section 14 instead.
- "18 min left on the email" in Focus. It needs a short name for every task, which the app cannot make up. The spoken label and Focus's context line say whose minutes they are.
- Raising the tab bar by 4 to 6 pt, which would move every row above it. Listed as a test. (Draft 3 raised it 10 pt, taking the space from the gap above the drawer, so nothing above it moved against the tabs.)

**Changed in draft 3, from the second review.** Three judges read the draft 2 board for faithfulness, ease of use and craft. Every must-fix item was applied, and the nice-to-fix items that improve the board without fighting this specification.

Faithful to what the owner asked for:

- **The task page is drawn in charcoal (3a) beside white (3b).** Draft 2 drew it only in white, which is Glasshouse's look, on the screen the owner will set beside Lantern's own.
- **Charcoal is drawn first and called Lantern's default** (3a, 6a), white as the alternative (3b, 6b). The panel keeps both cases, including one judge's argument for white.
- **The capsule names its task in full.** "18 min · Write the school email" fits because the bar moved out of line 2 to sit between the lines, in the lantern's own order, and "left" was dropped. The task is shown whole or not at all, never cut mid-word. (Reversed in draft 4: "left" came back, and the name now gives way whole when it does not fit beside it.)
- **The open drawer runs on under the capsule to the tabs,** with stone only behind the dock line, so the capsule rides over the day rather than floating in 200 pt of empty stone.
- **The foot of every tabbed screen is lighter:** 14 pt between the dock line and the drawer, where draft 2 had 34.
- **The header's idea is two sentences:** Lantern's opening line and one about the capsule.
- "Focus" on the running task's page has an up chevron, not a play glyph.

Easier to use:

- **Today and Focus look different.** Focus has its name as a title, the bar run edge to edge, and +5 min beside the minutes it changes, where draft 2 left it alone under Pause.
- **No tap lands by accident** on Step done or Pause in the capsule's slot: they ignore taps during the capsule's movement and for 500 ms after either screen appears.
- **Undo lasts its full six seconds,** ended only by a newer undoable tap, and now covers a tick and a plain Start too. A ticked row stays in place, un-tickable, until the list is next opened.
- **The Next line names the true next item on every screen,** including that item's own page.
- **Durations in lists are marks, one per five minutes, with no track,** so a task never started no longer reads as half done. The single durations on the Next line and in the idle sentence carry the number alone.
- **The way back after weeks is drawn** (7b): nothing planned, said plainly, one way in, and the inbox opened at its newest end. The drawer shows no empty-state line and no zero.
- A timed slot that passes unstarted goes to the top of Anytime today, so the idle lantern lights it next.
- Paused with the estimate used up reads "Paused · estimate 25", never "0 min left".
- Me stays live above the capture sheet and keeps the draft, so the crisis page stays two taps away. One judge suggested dimming Me; that would have made it three.
- A tap that stops a list's momentum does not open Focus.
- The Lock Screen card says when the next booked item is.

Craft:

- One right edge, x 366, for text, glyph ink and controls.
- The tab bar is inset to x 16–374 and ends at 812, clear of the bottom safe area.
- The paused capsule keeps its first column: the pause glyph alone sits there, and "Paused" moves to line 2, so the step does not jump.
- On charcoal places the capsule is lifted (ash-8, a rim lit from above, a deep shadow) instead of outlined.
- "Start this instead" on white is a filled quiet pill with no outline.
- The open drawer's Hide joins the header row.
- The running task's rail is on one even pitch, with Now beside the current step.
- The idle screen's "First on today's list" is set smaller than "Nothing running", with more air above the sentence.
- Undo is a 44 pt pill, and the Next lines under "After a tap" are rounded on top only, like the drawer they stand for.
- Save matches the switch's height, and the switch thumb's shadow no longer darkens the track's rim.
- The expanded Island has room between its bar and buttons, the buttons align to the bar's end, and its camera is black.
- The keyboard and Lock Screen are drawn in the current system appearance, and the Lock Screen has a mid-tone wallpaper so the card's outline shows.
- A static falloff of light around the lit block on Today and in Focus.
- The capture-from-Focus inset fades out at its foot, and the board's last rows were rebalanced.

Not taken in draft 3, and why:

- Dimming Me above the capture sheet. It would put the crisis page three taps away; Me works instead.
- Moving the bar to a thin track along the capsule's lower edge, with one line of minutes and task. It would put the minutes before the bar, breaking the lantern's order that every size keeps.
- A one-line Next handle on places at regular sizes. The handle would then differ between Today and the places; it stays a test.
- Recommending white places outright. The owner asked for Lantern, which is one dark app; the argument for white is kept in the panel for the owner to weigh.

**Changed in draft 4, from the third review.** The same three lenses read the draft 3 board. Every must-fix item was applied, with the nice-to-fix items that improve the board without fighting this specification or the owner's request.

Faithful to what the owner asked for:

- **The capsule is an object on the charcoal places.** An ash-15 fill and a full 1 pt edge of ash at 60% (3.4:1 against the canvas), where draft 3's fill was 1.16:1 and its edge 1.7:1. The header shows it lifted on a piece of the canvas beside the light-ground capsule.
- **The capsule is on a third place.** Routines is drawn (screen 9), so the board shows the capsule on Tasks, a task's page, the open drawer and Routines.
- **The lantern's falloff is visible.** It peaks at #323634 (1.25:1) where draft 3's peaked at #2A2E2C (1.11:1), it reaches the header, and it sits behind the block on every Today canvas, the unlit ones included, so 1 and 7b no longer read as unused space.
- **The board's last row is full.** Routines, "After a tap" and "Outside the app" share it.

Easier to use:

- **"18 min left" in the capsule.** "left" is back, and the task's name gives way whole when it does not fit beside it, never the word.
- **The open drawer hides nothing.** The list ends above the dock line with its last row fading whole from its top edge, and the band from the capsule to the tabs is plain stone, so no task sits silently behind the band.
- **Paused Today is drawn** (screen 7c), the screen the app opens on after a pause that was left or a clock that was forgotten: "Paused · step 2 of 3", the bar frozen in ash, white minutes with no end time, Resume as the primary action in Pause's place, and Set aside beside the minutes, so letting go is one tap from where the person lands.
- **Duration marks are small squares,** which cannot be taken for pause or for "more".
- **The nothing-planned drawer is quiet.** It rests at its lip with its grabber alone: no words, no empty line. The half drawer's handle is one deliberate row with the drawer's name at the left.
- **Focus's foot says "Later today"**, so "After this" is the only next on the screen, and it sits where the tabs sit elsewhere.
- **The capture keyboard's return key is "return",** so "Done" keeps one meaning.
- The inbox opens at its newest end every time; a Step done from the Lock Screen leaves its Undo in the Next line when the app next opens; the tap guard on Step done and Pause is a second after a screen grows out of the capsule; and the Android notification carries a fixed end time.

Craft:

- **Two title treatments:** place titles at 28 in the header row (Rest of today included), page titles at 32 under a back pill (Focus included). Me is at one y on every screen but the open drawer, and the board says why.
- **One band on the dock line:** every object on it is 64 tall. Step done and Pause are 138 and 120 wide so Resume fits Pause's slot.
- "Start this instead" on white has an edge and a lift, so it reads as pressable.
- The when pill on charcoal is a field (an edge, no fill), so the one action on 3a stands apart.
- "⌄ Hide" is a header pill, drawn like "⌄ Today".
- On two-line rows the ring sits on the title line. Every title in a list is at 500.
- The capture sheet's title leads in charcoal and Close is the quieter text button.
- The light switches' selected thumb has iOS's own thumb shadow.
- The capture disc on light has a 15% hairline and a fuller shadow.
- 20 pt between "Nothing running" and the lit item on screen 7.
- The "After a tap" strips fade into the board at their foot, and its text now says what the spec says: any newer undoable tap ends an Undo early.

Not taken in draft 4, and why:

- Taking the white phones off the main rows. The owner is to choose between charcoal and white, and the brief for this round was to keep both drawn.
- A one-line Next handle on places at regular sizes, and a compact handle at every height. The handle would then differ between Today and the places; both stay tests.
- A strip pairing Lantern's own screens with 1, 4 and 8. The board stays one drawing of this design; the comparison is for the review.
- Drawing the paused capsule in place on a screen. The board's places are all at 10:05 with the email running; paused is shown at full size on 7c and as a capsule in the header.
- An ash "Not running" line on 3a. The page's Start and its absent bar already say it, and a negative line on every unstarted task page is noise.
- Thinning the capsule's bar to 3 pt to give its lines more air. With "18 min left" alone on line 2 the capsule has more room across, and the 4 pt bar reads better on the lifted fill.
- Setting the paused glyph in a disc. It would not fit the 22 pt first line; the glyph keeps the step from moving.
- Capture opened from a place, drawn. Described in section 12; the board has two capture states already.
- A person glyph for Me. Words over icons for this audience, as Lantern drew it.
- Redrawing the Android notification on the system's own surface. It is drawn on a stand-in system surface already; whether a coloured chip qualifies for promotion is for the build to confirm (section 14).

**Changed in draft 5, from the fourth review.** Four judges read the draft 4 board: the same three lenses, and a fourth that compared every phone with the draft before it and looked for anything that had broken. Every must-fix item was applied, with the nice-to-fix items that improve the board without fighting this specification or the owner's request.

Faithful to what the owner asked for:

- **The capsule names its task again,** on every place drawn: "18 min left · Write the school email". Glasshouse's capsule always named it, and draft 4 dropped it over a 4 pt shortfall, so on Tasks and Routines the capsule said only "Write the question". The name is set at width 95 on the font's width axis and fits whole in 234 of the 238 pt, with the right padding the radius needs untouched. A longer name still gives way whole, and the header shows one doing so.
- **Focus lights one sentence,** as Lantern's did. "Focus" leads the context line in ash, where draft 4 set it as a white title at 32 above the 44 pt step, so the screen had two white headings.
- **The lamp is a pool,** radii 360 by 300 centred on the block, so the top and the edges of Today return to Lantern's #222624. Draft 4's 540 by 520 lifted almost the whole canvas.
- Screen 8's caption says why the capsule's slot holds Focus there, and section 15 now says that duration marks come from Glasshouse.

Easier to use:

- **The Next line reads one way.** Its minutes are gone and "Rest of today ⌃" is centred across both lines at the right. Draft 4's "10 min" sat under "Rest of today ⌃", so the right column read "Rest of today: 10 min".
- **The half drawer says its list goes on.** Its last row, "Book the boiler service", is drawn as covered, where draft 4 drew it whole above a fade that touched no text while seven tasks were hidden.
- **The covered row keeps the 4.5:1 rule.** On the open drawer and the half drawer the last row's ring fades out whole and its title greys only to about 5.3:1 at its baseline. Draft 4's fade took "Water the plants" to about 2:1, the one place on the board under the rule.
- **The way back after weeks says less.** 7b opens on "Nothing planned for today", without "Nothing running" above it, and the drawer at its lip is a plain stone edge with no grabber, which had promised a drag that only bounced back.
- **Paused says so where Now was.** In the capsule "Paused" stands in the first column, so line 2 has the same shape running or paused, and the lone pause glyph's 43 pt hole is gone.
- The Undo strip after Start this instead reads "Write the school email stopped", so it says what happened to both tasks.
- Me's hint names Medication or Family only once the person has turned it on.

Craft:

- **One row metric:** 11 above and below the text, 44 for one line and 62 for two, in Tasks, the rest of today, the half drawer and Routines. Draft 4's fixed 56 in Tasks left the gaps between rows anywhere from 22.5 to 40.5 pt.
- **The drawer meets a white page cleanly.** Its shadow is drawn above the dock line's fade, lighter on white with a 7% hair along the rounded top, so there is no seam at 684 and no grey ears at its corners.
- **No shadow lands on the drawer.** The capsule's and the disc's shadows end inside the 14 pt gap above it, where draft 4's greyed the top of the stone under them on every place.
- The minutes in a column of timed rows end on one line, with the marks in a fixed slot after them.
- The meta line on the running task's page has even spacing around its dots.
- Step done, Pause and Resume are centred by their ink.
- Routines has four rows and a chevron on each.
- The header's capsule states moved under the left column's text, which balances the two columns and leaves no capsule out of line.

Regressions, and the specification kept in step with the board:

- The no-estimate bar's marks are the same 5 × 5 square as the duration marks, so the claim that one mark is one shape everywhere is now true. Draft 4 drew them 6 wide and the bar's height, which would have read as pause at two marks.
- Section 7's `tint-stone` row gives the quiet "Start this instead" its edge and lift; 5.5 gives the capture sheet's thumb iOS's own shadow; section 4's "Paused, with the estimate used up" row describes the capsule's line 2 alone; 5.7 places "Weighed, not overlooked" in row 4; section 14's Undo row includes Resume and Set aside; Increase Contrast raises the lifted capsule's edge rather than lowering it.

Not taken in draft 5, and why:

- **Letting the open drawer's list run on under the capsule behind about 80% stone,** to fill the 84 pt below the dock line. Text there would measure about 1.3:1, under the rule every screen keeps, and a row hidden behind the capsule while rows show above and below it is the draft 3 defect. The band is listed as a test (section 14).
- **"Write the school email, kept at step 2"** on the Undo strip. It needs 290 of the 252 pt beside Undo. "stopped" says what happened, and the page's own sentence had already said it keeps its place.
- **The duration inline on the Next line** ("10:30 Call the dentist · 10 min"). It would end at x 267, touching "Rest of today ⌃", whose ink starts at 266.
- **"Today is open"** in place of "Nothing planned for today" on 7b. Dropping "Nothing running" above it removed the stacked negatives; the remaining line is plain and true.
- **A one-line Next handle on places at regular sizes,** to lighten the foot. The handle would differ between Today and the places; it stays a test.
- **Something lower on the task page for a task with no steps** (3a, 3b). The page already offers five choices, and a line that is not a choice would be filler.

**Changed in draft 6, from the fifth review.** The same four judges read the draft 5 board: faithfulness, ease of use, craft, and a fourth that compared every phone with the draft before it. Every must-fix item was applied, with the nice-to-fix items chosen for this round.

Faithful to what the owner asked for:

- **Durations are drawn in Lantern's own mark.** The small squares, one per five minutes, were Glasshouse's pip meter, a second graft the owner did not ask for and the board never named. A duration in a list is now the number and then one short track, the burning bar at its smallest, 1.5 pt a minute (9.2). The no-estimate bar grows as one length, its full width an hour, rather than counting squares.
- **The board names Glasshouse.** The subtitle is the owner's own words, "with Glasshouse's pinned Now capsule", and a line under "One object at every size" says what came from Glasshouse: the capsule's place above the tabs, its rule that it hides while the lit step shows, and white places, drawn only as one side of a choice. The owner's choice panel calls white "Glasshouse's look".
- **Section 13 records that Focus lost Lantern's folded stone drawer,** and why: Today and Focus are told apart, and nobody leaves Focus by accident.
- **The board describes the design, not the process.** "The judges' main worry" and "The judges warned" are gone from the panels; the concern is said directly. The history stays here.
- **Screen 8's caption** says that every other task's page carries the capsule and this one, being the lit task, does not; Focus opens upward from the dock line.

Easier to use:

- **Paused Today keeps the passed item in sight.** When the top of Anytime today holds an item whose slot passed today and no timed item starts within 15 minutes, the folded Next line reads "Anytime today" over it, with no mark and no "missed". 7c now reads "Anytime today" over "Call the dentist", where draft 5 named 14:00 and left the call hidden on the most common way back. Focus's foot follows the same rows, running or paused, so in paused Focus it reads "Anytime today · Call the dentist" (5.4). The promise in 9.8 and 5.7 now holds wherever the app says what comes next.
- **A field's keyboard does not lift the frame.** Outside the capture sheet, the dock line, the drawer and the tabs stay behind the keyboard, and text in the field is kept as a draft if the person then reaches the capsule (sections 3 and 4).
- **The open drawer closes from the spot that opened it.** "⌄ Hide" sits at 715–735 under capture, where "Rest of today ⌃" sits when folded, and the header's Hide pill is gone. The band under the dock line is no longer empty.
- **Save leaves the inbox's scroll where it was,** and the Undo strip names the new item (5.6).
- **Capture is the Lock Screen's right-hand control,** under the thumb as in the app, and the caption says iOS lets the person change it.
- **Titles beside capture on the half drawer wrap by x 286,** never cut beside the disc (5.7, 9.7).
- **The Undo strip after Start this instead reads "Write the school email at step 2",** which keeps the page's promise in sight and fits the 252 pt; "stopped" could read as abandoned.
- Section 14 adds two questions for the owner: whether the Live Activity keeps counting through an overrun, and whether a session the app closed itself says "Timer stopped" rather than "Paused".

Craft:

- **The covered row is one object.** Its ring and title grey on one ramp to 30% stone at the foot, so the whole circle stays at 5.3:1 or better, and the edge it goes under is drawn as a faint shadow (606 on the open drawer, 754 on the half drawer). Draft 5's ring faded to about 1.07:1 and read as a loading arc.
- **The rail on the running task's page is cut the same way at every disc:** the done disc carries the same 5 pt charcoal ring as the other two.
- **The lamp reaches up again.** Its centre moved to (170, 380) on Today and 7c and (170, 390) on 7b, so the band from 110 to 250 lifts toward #2B2F2D while the top corners stay at #222624 and Pause measures 1.46:1 against its ground.
- **The capture inset ends above its fade:** it is cropped below the field and fades over plain stone, so the type note's claim that every line of text on the board measures 4.7:1 or more is true.
- **Focus's context line sits 24 above the done step,** as the step block's heading, and a hairline at 754 sets the foot line on the frame.
- **"in 25 min" is inside the when pill,** so the when is one object.
- **The Tasks switcher has equal padding** either side of each label (17.7 pt).
- **"Ran today" is an ash check with no disc,** no brighter than the titles.
- **On white places the 14 pt gap under the capsule stays white:** the drawer's lift is a hair and a 6 pt shadow, so only the capsule's own shadow falls there.
- **The board's layout.** The header's two columns share one top line; the "Weighed, not overlooked" panel is a band under row 3, beside 7, 7b and 7c; the row-2 panels share one height; and row 4 has no vertical rules. Section 3 notes that the timed rows' track slot, not its ink, ends at x 366.

Not taken in draft 6, and why:

- **A smaller white alternative.** Both the charcoal and the white places stay at full size, so the owner can compare them fairly.
- **A one-line Next handle on places at regular sizes,** to lighten the foot. The handle would differ between Today and the places; it stays a test.
- **A paused capsule drawn on a place.** The places are drawn at 10:05 with the email running; the paused capsule is in the header and paused Today is 7c.
- **Something lower on the task page** (3a, 3b). The page already offers five choices, and a line that is not a choice would be filler.
