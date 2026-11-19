# Adnotia / phone studies

**Open [index.html](index.html) from disk.** Choose a direction and scroll horizontally to compare its five 390 × 844 phone screens at their drawn size. A wide desktop window shows the whole strip. Each direction is also a complete file on its own: no server, JavaScript, framework, font service or build step.

The [research notebook](RESEARCH.md) precedes the drawings. Its ten numbered principles below are design constraints and hypotheses, not clinical claims. The three looks are alternatives, not themes for an existing component set.

## A · [Margin Press](direction-a.html)

**The current task is the lead headline in a two-ink daily edition, with a rule of type marking the minutes left.** The top story gets solid ink; appointments get a narrow time column; anytime work gets neither a clock nor a box. The timer is made of 25 printing strokes: 18 tall and seven short, with the literal count beside them. Capture is a single writable slip. In Family, the order is a numbered contents list and the child preview is a short excerpt.

- **From the reading:** Mela changes the scale of the same words when the job changes (principles 3 and 6). CapWords makes the result look like the thing just captured (4); grug shows how much identity can reside in lettering alone (9). Here it is typesetting, not a copied word card or hand-drawn alphabet.
- **Type:** Fraunces Semibold for headlines, step numbers and the big remaining-time figure; its contrasting strokes make the title look set in ink. Public Sans for instructions, times and controls; it keeps a long line of task copy quieter than the headline.
- **Worry:** a long title or larger text setting could push the first appointment below the fold. A repeated rule could become visual noise. Test with a two-line translation and the largest native text setting; the numeric timer must still work if the rule is removed.

| Ink / surface (either order) | Contrast |
| --- | ---: |
| Plum `#361936` / butter `#FFE99A` — default, running panel and button | 12.88:1 |
| Plum `#361936` / pink `#F5CEE3` — Capture, Family and menu | 10.98:1 |

## B · [Rivet Dial](direction-b.html)

**A task is a reading on a calibrated dial; timed stops line up against a single measuring rail.** The title and remaining time sit side by side. The arc shows 18/25 by length and by the position of its pointer. Scheduled events have a stem and a time; anytime entries are off the stem. The same rail can carry a sequence rather than a clock in task detail and Family. In Focus, the dial takes the space previously given to the rail.

- **From the reading:** Tide Guide and the Flighty design studies give a reading both a position and a number (2, 6). Llama Life reviewers distinguish shifting estimates from fixed appointments (1). Marvin's moving-target complaint is why every control stays put and the sweep is static (7, 10).
- **Type:** Barlow Condensed Semibold gives task names and tall instrument numerals room side by side. IBM Plex Mono is reserved mainly for readings, units and navigation: times line up, and the units don't look like part of the task name.
- **Worry:** a gauge can imply a target to hit, or suggest elapsed instead of remaining time. Dark navy is an identity choice, not a recommended mode. In a daylight test, ask what the needle means without explaining it. If the answer is “how well I'm doing”, change the instrument.

| Foreground | On midnight `#10182D` | On slate `#23314C` |
| --- | ---: | ---: |
| Porcelain `#E7EFFF` — names and instructions | 15.28:1 | 11.26:1 |
| Silver `#AEBFDC` — units, indices and secondary labels | 9.48:1 | 6.99:1 |
| Lime `#D8F780` — active reading and control face | 14.73:1 | 10.86:1 |

The primary control reverses midnight/lime, also 14.73:1. The pointer, the idle arc and the words “min left” remain different without hue.

## C · [Pocket Props](direction-c.html)

**A task is a cut-paper prop: it comes forward on a small stage while the rest of the day waits in the wings.** The school letter recurs on Today, in the capture pocket and on the opened task. Two later appointments share the width like a pair of objects on a shelf. In Focus the word and the sandglass take centre stage, with the current instruction on a separate strip below. Sam's shirt is a preview of the first action, not an avatar to maintain.

- **From the reading:** CapWords makes an object the unit of recognition (3, 9); the parent-made Morning Routine board shows why a shirt can say something useful that a generic reward cannot (8). Focus Friend reviews argue both for an identifiable object and against making an interruption cost something (5). The props here are original SVG silhouettes; no one chooses an icon as a condition of capture.
- **Type:** Bricolage Grotesque for the broad, irregular silhouettes of names and headlines; Atkinson Hyperlegible for directions and times, where clearly differentiated letterforms matter more than a display voice. Neither is prescribed for ADHD.
- **Worry:** custom tasks will not all have an apt illustration, and the look may feel too young to some adults. Test an unpictured task and a long name in the two-column row. A text-only task must feel finished; don't turn icon selection into a new job.

| Ink / surface (either order) | Contrast |
| --- | ---: |
| Ink `#17214D` / sky `#C8DAFF` | 10.97:1 |
| Ink `#17214D` / apricot `#FFB48E` | 8.94:1 |
| Ink `#17214D` / cream `#FFF0BD` | 13.56:1 |
| Cream `#FFF0BD` / stage blue `#293E99` | 8.22:1 |

## What the controls demonstrate

The five frames are **snapshots, not simultaneous app state**. Capture shows the example name being entered at 09:58. The opened task is ready to start at 10:00. Today and Focus show the same task at 10:07, with 18 minutes left of the original 25. Family shows a different, earlier part of the morning. Editing a field does not change the sample in another frame.

- **Today → Capture:** one name and Save; no date, estimate or categorisation required. The confirmation explains that the file stores nothing. A capture without a date belongs in Tasks, not automatically in today's Anytime group.
- **Today / Tasks / Routines / Library:** four labelled destinations. The selected destination is marked, not a redundant action. In these studies Tasks opens the example task inside that destination. Routines and Library explain the destinations not drawn. In the detail, Start opens Focus; Pause previews a stop with the same remaining time. Capture and Focus put the tabs away and keep a labelled return to Today.
- **Today → Me → Family → Hand to Sam:** the parent sees all five steps; the handoff preview shows only the first instruction and what follows. Its close control is for the reviewer. The intended app would require the parent code to return, not claim to lock the operating system. Me also names Settings and the separate Medication destination; neither section is drawn and neither feeds these screens.

The five default frames have **5 / 3 / 5 / 2 / 2** actionable controls respectively, even counting the input, Back and inactive tabs. Today's large running readout is information, not a second, competing button. A trade-off worth testing in all three: do people expect to tap that readout to resume? Nothing animates, alerts, scores, resets or reports a missed day.

## Reading the boards

Contrast is `(lighter relative luminance + 0.05) / (darker + 0.05)` in sRGB, rounded to two decimals. The common gallery uses `#FAF3DE` on `#191C25` (15.35:1); direction labels use butter (14.08:1), lime (14.21:1) or apricot (9.86:1) on the same ground. `#838897` is a gallery rule/outline, not body text. The index borrows each direction's display face for its title and uses Public Sans for its own copy.

All six typefaces are unmodified Latin WOFF2 subsets distributed by Fontsource under the SIL Open Font License 1.1. The fonts, copyright notices and licence text are embedded in the HTML files that use them. The type and artwork travel with the file.

Checked the rendered boards opened as local files with the network offline: all fifteen frames fit at the reference size, every actionable target is at least 48 × 48 CSS px, and the text pairs clear 4.5:1 including menus, feedback and preview controls. These are checks on the drawings, **not** tests with users or native Dynamic Type, VoiceOver or TalkBack.
