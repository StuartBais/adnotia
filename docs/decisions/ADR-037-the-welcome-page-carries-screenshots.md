# ADR-037: The welcome page carries screenshots, and they are generated

Status: accepted · September 2026 · Amends 07-design-system.md, follows ADR-036

## Context

ADR-036 put a welcome page at `/`. It shipped as words: a headline, three
promises, a list of what the app will not do, and two links. It is accurate and
it is dull, and a page nobody stays on does not invite anybody in.

`07-design-system.md` says, under Iconography: "The logo mark is the only
graphic." That sentence was written about the *app*, where it is right — an
interface for somebody who is tired and distracted should not be decorated, and
`ADR-027` already pairs every chart with the same information in words. ADR-035
and ADR-036 then drew a line the sentence predates: the website and the app are
different documents with different obligations. This ADR says what the website's
are.

## Decision

**The welcome page may carry pictures of the app. It carries nothing else.**

No illustration, no iconography, no stock photography, no decorative shapes. Not
a stylistic preference: a picture of anything other than the product is a claim
about the product that nobody has to stand behind, and this is a health page
where the claims are governed. The mark stays the only graphic *in the app*, and
that sentence in `07-design-system.md` now says so in as many words.

**The pictures are generated, by `scripts/shots.mjs`, from a real build.**

A real Chromium loads the real `dist/`, seeded with a real record, and presses
the things a person presses. Nothing is drawn, mocked up, or retouched. Three
consequences, and each is the reason:

- **A hand-made image is a promise that decays.** The interface changed
  substantially over Milestone 9 — Today stopped being the landing, the tools
  grew an index — and any screenshot taken by hand before that week would now be
  a picture of an app that does not exist, on the page that introduces it.
- **The record in the pictures is the modules' own `thirtyDays` fixtures**, via
  `scripts/shots/seed.ts`, which imports them rather than copying them. A renamed
  field is then a build error, not a screenshot of an empty app.
- **The clock is frozen** at the end of the fixtures' range. Regenerate the
  images in a year and a difference between them and these means the interface
  changed, not that time passed.

That last property had to be earned rather than assumed. It was checked with two
runs, which agreed, and the claim went into this ADR. Over twenty runs `today`
came out one of two ways at about seven to three — the shot with native form
controls in it, differing only inside those controls, by less than five per cent
on any pixel: invisible, and enough to change every byte. Chromium was painting
whatever the compositor had ready. `--run-all-compositor-stages-before-draw` and
`--disable-partial-raster` make it paint everything first, and twelve consecutive
runs then agreed. `--disable-lcd-text` and `--font-render-hinting=none` are there
alongside them, which also removes the colour fringing subpixel text leaves on
glyph edges once a shot is scaled down on the page.

Removing any of those four brings the flapping back, quietly, and the only symptom
is a screenshot that shows up in `git status` having changed nothing.

They are committed, and generating them is not part of `npm run build`. The
welcome page is static and must deploy without a browser or ImageMagick present.

## What was asked for and is not here

The brief was that the page should "feel human", and the first thing that means
in this genre is a photograph of a person. There is not one, for two reasons and
only the first is about capability.

**A photograph of a person on a health page reads as a testimonial** whether or
not it is captioned as one. The face says *this worked for someone like you*,
which is a claim about outcomes that nothing in this project has evidence for and
that `03-scope.md` would not let the text make. Putting it in a picture instead
of a sentence does not make it a smaller claim; it makes it an unwritten one.

**And these cannot be generated.** Everything else on the page is either the
product or the truth about it, both of which a script can produce and a test can
check. A photograph of a human being is neither. If one is ever wanted here it
has to be a real person who agreed, supplied by the maintainer, and it should
come with an ADR of its own about what the caption is allowed to say.

What carries the warmth instead is the writing — "Why it exists" is a person
talking, and the last line of it is addressed to somebody reading at one in the
morning, which `03-scope.md` names as the person the whole app is written for.

## Consequences

- `07-design-system.md` Iconography is amended: the mark is the only graphic in
  the app; the welcome page may show the app.
- `scripts/check-budget.mjs` counts `<img>` on the welcome page, against a
  separate 200 kB budget, and fails on an image the build has not got. It counted
  only `<script src>` and `<link href>` before, so three screenshots could have
  been added to the first page anybody loads without moving a number anywhere.
  The page's own 100 kB budget is unchanged and the images are `loading="lazy"`.
- `tests/kernel/welcome.test.ts` checks every `<img>` against
  `scripts/shots/manifest.json`: the file exists, the dimensions are stated and
  correct, and the alt text is the one the shot was taken with. A regenerated
  screenshot of something else fails the build rather than getting a caption
  describing the old one.
- Regenerating is `npm run build && npm run shots`, and needs Chromium and
  ImageMagick. Neither is in CI and neither should be.
