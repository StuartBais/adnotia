# Adnotia design system

Status: draft 0.1 · September 2026 · The reference monolith implements all of this; port the CSS, do not reinvent it.

## Principles

Designed for someone who may be tired, distracted, ashamed of a gap in the record, or reading at one in the morning. Low friction over completeness. Tap over type. Optional detail hidden until wanted. Nothing that makes a gap feel like a failure.

## Colour

Derived from the logo: sage and terracotta on cream. The logo colours themselves are used only for the mark and for chart fills; text and controls use deepened variants that meet contrast requirements.

```css
:root {
  --ground:     #F3EDE2;   /* page */
  --paper:      #FDF9EE;   /* cards, inputs; the logo's cream */
  --ink:        #221F1A;   /* primary text */
  --ink2:       #6E6455;   /* secondary text */
  --line:       #DED3C1;   /* input borders */
  --line2:      #EBE3D5;   /* card borders, dividers */
  --sage:       #728871;   /* logo; chart fills only */
  --sage-deep:  #4F6A52;   /* text/controls on sage */
  --terra:      #CA7F58;   /* logo; chart fills only */
  --mark:       #A85A31;   /* primary accent: selected chips, buttons, links */
  --mark-soft:  #F6E5D8;   /* hover, selected backgrounds */
  --flag:       #856019;   /* warnings, cautions */
  --flag-soft:  #F7EBD6;
}
```

Checked contrast ratios (must stay ≥ 4.5:1; `npm run check` enforces):

| Pair | Ratio |
|---|---|
| ink on paper | 15.6 |
| ink2 on paper | 5.5 |
| mark on paper | 4.8 |
| white on mark | 5.0 |
| flag on flag-soft | 4.8 |
| sage-deep on paper | 5.7 |
| white on sage-deep | 6.0 |

Chart colours: cover band `--mark`; sleep band `#BCCBBB`; gap band `#EFE8DA`; dose ticks `--ink`; rebound `--flag`; focus dots `--sage-deep`; severity ramp `#F2DECD` → `#D79A6E` → `--mark`, unrated `#E2DACB`, absent `#F6F1E6`. Print maps everything to greys (see Print).

Dark mode: not in the first milestones. When it comes, it is a second token set, not per-component overrides.

## Typography

Two families, system-provided, no font files:

- **Headings:** `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`, weight normal. Masthead 30 px, card heading 19 px, report h2 22 px, report h3 16 px.
- **Everything else:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Body 16 px, labels 14 px, hints 12.5 px, chips 14 px, table cells 12.5 px.

Line height 1.45 body, 1.5 for anything a clinician reads. Minimum 12.5 px on screen. Tabular numerals on anything numeric.

## Layout

Single column, max width 680 px, 14 px side padding. Cards: `--paper`, 1 px `--line2` border, 10 px radius, 16 px padding, 12 px between cards. Sections stack; nothing side-by-side below 480 px except paired time inputs.

Tabs: a pill strip with the active tab lifted onto `--paper`. Off-tab pages (baseline, passcode) open with a Back button and return to the originating tab.

## Components

All live in `src/kernel/ui/`. Modules do not build their own controls.

| Primitive | Behaviour |
|---|---|
| `scale5` | Five equal chips 1–5, `aria-pressed`, end labels beneath, selected anchor text beneath that in `--mark`. Tapping the selected value clears it. |
| `chips` / `chipsMulti` | Pill buttons, wrap freely, `aria-pressed`. Selected: `--mark` fill, white text. Flag variant uses `--flag`. |
| `detailRow` | Follow-up block revealed by a chip: 2 px left border in the chip's colour, warm tint background, optional severity chips, time, number, and a one-line note. Never shown unconditionally. |
| `timeInput`, `numberInput`, `textInput` | Native inputs, 16 px text to stop iOS zooming, 8 px radius, `--line` border, `--mark` focus ring. |
| `calendar` | Custom month grid. One tap selects and closes. Dots mark logged days. Future days disabled. "Jump to today" respects the after-midnight rule. Locale-aware first weekday. |
| `linkRow` | Full-width row with a label left and a status or action word right in `--mark`. Used for off-tab pages. |
| `card` | As above. |
| `nag` | `--flag-soft` panel with one action. The kernel shows it at most once per fourteen days per topic. Copy is plain and unalarmed. |
| `mirror` | Screen-only reflection list. Never printed. |
| `rewardChart` | Family only. Positive-only, parent-initiated, no reminders, no streaks. |
| `parentGate` | Passcode to enter and to leave. Large targets for the child surface. |

Buttons: 8 px radius, 11 px 16 px padding, 15 px text. Primary is `--mark` fill; secondary is `--paper` with `--line` border. Destructive actions are secondary buttons with a confirm step, never red.

Focus: 2 px `--mark` outline with 1 px offset on every interactive element.

## Motion

Almost none. Save confirmation fades its colour over 200 ms. Everything else is instant. Respect `prefers-reduced-motion`.

## Print

`print.css` is part of the design system, not an afterthought. The `clinical`, `screening` and `observations` reports print; nothing else does.

- Page margin 13 mm, portrait. Body 10 pt, tables 7.6 pt, headings 16 / 11.5 pt.
- All colour goes to greys: cover band `#333`, sleep band `#C9C9C9`, severity ramp `#DDD` → `#999` → `#333`, lines black.
- Rows and dose blocks do not break across pages.
- Everything that is not the report is `display: none`, including the mirror, the tabs, the masthead and the off-tab pages.
- Text export mirrors print structure: `=` under h2, `-` under h3, tables as ` | `-separated rows, charts replaced by a bracketed note.

## Iconography

The logo mark is the only graphic. It is an inline SVG in the masthead (34 × 31 px) and the lock screen (44 × 40 px), and a 180 px PNG for the home screen icon. `assets/logo.svg` is canonical; do not embed the original raster.

Two clip-path halves, one shared path. When embedding, use two full `<path>` elements, never `<use>` referencing a path that already carries a `clip-path` — the clone inherits it and the second half disappears. This bit us once.

## Voice

Written for the person described in Principles.

- Sentence case everywhere, including headings and chip labels.
- Short sentences. Plain words. No jargon a Library entry has not explained.
- Forgiving. "A day missing", not "you forgot". "Filled in later", not "backfilled late".
- No exclamation marks. No "great job". No cheerleading.
- Anchors and chips are phrased the way a person would say them: "Took ages to drop off", "Couldn't switch my brain off", "Locked in, followed things through".
- Anything a clinician reads is descriptive and specific: "Cover 9:30am to 4:30pm, about 7h of a 17h waking day." Never "should", "increase", "decrease", "recommend".
- Anything a child reads is concrete and present-tense: "First shoes, then tablet."
- Evidence wording is fixed by the rubric: "Established", "Promising", "Plausible". "Evidence-based" appears only for Tier A.
