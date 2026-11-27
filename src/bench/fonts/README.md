# Instrument Sans, bundled for the prototype

`InstrumentSans-latin.woff2` is the typeface of the Lantern design (`design/lantern/SPEC.md` section 8), bundled so the prototype at `/bench/` can be judged in it on a phone. It is a trial: ADR-047 still calls the typeface proposed, and nothing outside `src/bench/` uses it.

The prototype loads it from its own origin. The page's policy is `font-src 'self'`, so nothing else would load: not a font service, and not a `data:` URI either. `scripts/check-budget.mjs` fails if the stylesheet names a font the build has not got, or inlines one.

## What it is

- **Face:** Instrument Sans, by the Instrument Sans Project Authors, version 4 as served by Google Fonts.
- **Licence:** SIL Open Font License 1.1, in `OFL.txt` beside it. The copyright line names no Reserved Font Name, so the file may keep its name. The build copies `OFL.txt` to `/bench/OFL.txt`, because the deployed font is a copy too, and `scripts/check-built.mjs` fails if it is missing there or differs.
- **Cut:** one variable woff2, the `latin` subset, with a width axis (`wdth` 75 to 100) and a weight axis (`wght` 400 to 700). Upright only. The `latin-ext` subset is left out.
- **Unicode range,** as Google's stylesheet declares it for this subset: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD. A character outside it (Ł, ő) falls back to the system face. That is accepted.
- **Size:** 57,100 bytes. It is already compressed, so it is budgeted as served.
- **sha256:** `19f8ec3200550a11859c7e52d7378354bf71bc6dd0441fdde79b9a660513f5e4`

## Where it came from

Downloaded on 25 November 2026, each file into a new empty folder, outside the build:

```
curl -o InstrumentSans-latin.woff2 https://fonts.gstatic.com/s/instrumentsans/v4/pxicypc9vsFDm051Uf6KVwgkfoSbT2lBgGygpg.woff2
curl -o OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/OFL.txt
```

The woff2 URL is the `src` of the `latin` block in Google Fonts' stylesheet for Instrument Sans with both axes, whose `@font-face` declares `font-weight: 400 700` and `font-stretch: 75% 100%`. Check that a downloaded `OFL.txt` is the licence and not an error page before committing it: one copy fetched while planning was a 404 page.

## What was measured

In Chromium on 25 November 2026, against the numbers the design depends on:

| Text | Setting | Width |
|---|---|---|
| "Write the school email" | 500, 15 pt, width 100 | 155.8 pt |
| "Write the school email" | 500, 15 pt, width 95 | 147.0 pt, so the capsule's line 2 fits whole in 238 (SPEC 4) |
| "Paused" | 650, 15 pt, width 90 | 46.7 pt, inside the capsule's 54 pt first column |
| "1111" and "0000" | 600, 17 pt, tabular | both 40.8 pt (26.2 proportional), so tabular figures exist |
| "Write the question" | 700, 40 pt, −0.024em | 338.3 pt, one line in Today's 342 |
| "Write the school email at step 2" | 600, 17 pt | 249.1 pt, inside the 252 beside Undo |

The width axis still needs confirming in Safari.

## Refreshing it

Fetch Google Fonts' stylesheet for the face, take the `latin` block's `src` URL, download it and `OFL.txt` as above, and compare. If the hash changes, measure the table again before replacing the file: a new version can move a width the design was fitted to by 4 pt. Then update the size and hash here, and wherever else the prototype's records name them.
