# Adnotia design system

Status: draft 0.1 · September 2026 · The reference monolith implements all of this; port the CSS, do not reinvent it.

## Principles

Designed for someone who may be tired, distracted, ashamed of a gap in the record, or reading at one in the morning. Low friction over completeness. Tap over type. Optional detail hidden until wanted. Nothing that makes a gap feel like a failure.

## Colour

Derived from the logo: sage and terracotta on cool stone. The logo colours themselves are used only for the mark and for chart fills; text and controls use deepened variants that meet contrast requirements.

Sage leads and terracotta answers. Green is what the app does — buttons, links, selected chips, the tier badge — and warm orange is what it wants you to look at: a warning, a rating, the severity of a side effect. Both come out of the mark, so nothing in the interface competes with it.

```css
:root {
  --ground:     #EAECE7;   /* page */
  --paper:      #F8F9F6;   /* cards, inputs */
  --ink:        #2B2F2C;   /* primary text; soft, not hard, black */
  --ink2:       #5C6360;   /* secondary text */
  --line:       #D2D6CF;   /* input borders */
  --line2:      #E2E6DF;   /* card borders, dividers */
  --sage:       #728871;   /* logo; the mark and chart fills only */
  --terra:      #CA7F58;   /* logo; the mark and chart fills only */
  --mark:       #3F6144;   /* primary accent: selected chips, buttons, links */
  --mark-soft:  #DFE9E0;   /* hover, selected backgrounds */
  --terra-deep: #A85231;   /* the second voice: ratings, severity */
  --flag:       #8A5524;   /* warnings, cautions */
  --flag-soft:  #F6E7DA;
}
```

Checked contrast ratios (must stay ≥ 4.5:1; `npm run check` enforces):

| Pair | Ratio |
|---|---|
| ink on paper | 12.9 |
| ink2 on paper | 5.8 |
| mark on paper | 6.6 |
| white on mark | 7.0 |
| flag on flag-soft | 5.1 |
| terra-deep on paper | 5.1 |
| ink on ground | 11.4 |
| ink2 on ground | 5.2 |

### Two choices made on evidence rather than taste

Both are about glare, and both are the reason the ground is not white and the text is not black.

**Pattern glare** — the visual discomfort that comes from high-contrast text — is driven by the combination of a hard black-on-white contrast and the stripe pattern that lines of text make. **ADHD carries a raised rate of migraine** (OR ≈ 1.8 in a cross-sectional study of over 26,000 people), and the association is strongest for *migraine with visual disturbance*. So the ground is an off-white and body text sits at about 13:1 rather than the 15.6:1 it used to: comfortably past WCAG AAA's 7:1, and deliberately short of the maximum. Nothing anywhere uses zebra striping or dense hatching.

**No hue here is chosen for an effect on attention.** There is no good evidence that any particular colour helps people with ADHD. The colour-vision literature in ADHD is small and inconsistent — the study most often cited for a blue-yellow effect measured saturation discrimination in 30 adults, found a difference only in females, for both blue and red, and tested nothing on a screen. A palette built on colour psychology would fail `02-evidence-rubric.md`, so the hues are an identity choice and are described as one.

What does follow from that uncertainty is the ordinary rule, kept strictly: **nothing carries meaning by hue alone.** Chips state themselves in `aria-pressed`, the severity ramp descends in lightness as well as warming in hue, and every chart is paired with the same information in words (`decisions/ADR-027`).

Chart colours: cover band `--mark`; sleep band `#C9CFD4`, neutral because a sage band beside a sage cover band is one band; gap band `#E4E7E1`; dose ticks `--ink`; rebound `--flag`; focus dots `--terra-deep`; severity ramp `#F0DFD1` → `#D9A176` → `--terra-deep`, unrated `#DDE0DA`, absent `#EFF1EC`. Print maps everything to greys (see Print).

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

One copy of the artwork exists. `src/kernel/ui/logo.ts` imports that file with `?raw` and `vite.config.ts` inlines it into `index.html` as the tab icon at build time, so nothing is pasted into a second place to go stale. Inline rather than `<link href>` because the single-file build has to work saved to a disk with nothing beside it. The mark is `aria-hidden`: the word Adnotia is always next to it, and announcing both makes a screen reader say the name twice. Each copy's clip-path ids are rewritten per instance, because SVG ids are document-global and two marks sharing them clip to whichever resolved first.

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
