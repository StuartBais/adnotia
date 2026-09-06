# ADR-028: Sage leads and terracotta answers

Status: accepted · September 2026 · Amends `07-design-system.md`

## Context

The palette was cream `#F3EDE2` with a deepened-terracotta accent `#A85A31` and
an old-style serif for headings. That combination is close enough to a
well-known AI company's brand to be mistaken for it, and it was: the observation
that prompted this was that the app looked "very Claude".

The logo is fixed. It is sage `#728871` and terracotta `#CA7F58`, and
`07-design-system.md` makes `assets/logo.svg` canonical. So the palette had to
move around the mark rather than away from it.

Before choosing anything, the question worth asking was whether colour choice is
constrained by evidence here at all, since this is an app for people with ADHD
and the internet is confident that it is.

**It mostly is not, and the most-repeated claim does not hold.** The line that
blue-yellow information is harder for ADHD readers traces to a study that
measured colour *saturation discrimination* in 30 adults, found a difference only
in females, for blue and red alike, and tested nothing on a screen. The
colour-vision literature in ADHD is small, inconsistent and about perceptual
thresholds rather than interfaces. A palette justified by colour psychology would
fail `02-evidence-rubric.md` as squarely as anything on its exclusion list.

**Two things do hold, and they constrain contrast rather than hue.**

Pattern glare — visual discomfort while reading — is driven by hard
black-on-white contrast meeting the stripe pattern that lines of text make. And
ADHD carries a raised rate of migraine, odds ratio about 1.8 in a cross-sectional
study of over 26,000 people, with the association strongest for *migraine with
visual disturbance*. Those two together are a specific reason for this app to
care about glare.

The third is the ordinary rule that follows from the uncertainty rather than from
any finding: where the perceptual literature is this unsettled, colour must never
be the only carrier of meaning.

## Decision

**Sage leads, terracotta answers.** `--mark`, the primary accent, becomes a
deepened sage `#3F6144`: buttons, links, selected chips, the tier badge. Deepened
terracotta becomes `--terra-deep` `#A85231`, the second voice — focus ratings,
the severity ramp — and `--flag` keeps warnings. Both still come out of the mark,
so nothing in the interface competes with the logo, and the hierarchy that read
as somebody else's brand is the thing that inverted.

The ground moves from cream to cool stone `#EAECE7` on `#F8F9F6` paper.

**Body text drops from 15.6:1 to 12.9:1.** `--ink` becomes a soft near-black
`#2B2F2C`. That is comfortably past WCAG AAA's 7:1 and deliberately short of the
black-on-white maximum the glare research implicates. This is the one place in
the palette where the evidence made the choice rather than taste.

Hues are described in the design document as an identity choice, because that is
what they are.

## Consequences

The accent gained headroom rather than spending it: `mark on paper` went from
4.8:1 to 6.6:1, because a deepened sage can go darker than a terracotta before it
stops looking like itself. Every documented pair is now at or above 5.1:1 where
several used to sit at 4.8.

The charts needed rebalancing, not recolouring. A sage cover band beside the old
pale-sage sleep band would have read as one band, so the sleep band became a
neutral `#C9CFD4` and the focus dots took terracotta. The severity ramp stays
terracotta — it is free now that terracotta does not lead — and still descends in
lightness as well as warming in hue, so it survives greyscale and colour
blindness.

**The change found a bug worth more than the palette.** Ten colours were written
into `base.css` by hand, six of which duplicated the value of a token that
already existed. Changing `--chart-sleep` did nothing to the sleep band, which is
the one thing a token is for. Every colour now resolves through a token, and a
test fails the build if a hex other than white appears in `base.css` — with a
companion that asserts `print.css` stays entirely grey.

Dark mode remains out of scope and remains a second token set when it comes. The
token names are all role names rather than colour names, which is what makes that
possible; `--terra-deep` is the one that breaks the pattern, and it is named for
the pigment because "the second voice" is not a CSS identifier.
