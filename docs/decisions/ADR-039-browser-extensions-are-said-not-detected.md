# ADR-039: Browser extensions are said, not detected

Status: accepted · September 2026 · Amends ADR-007

## Context

An extension with permission to read the pages you visit can read what Adnotia
stores. That is not a flaw in this app; it is true of every website. But this app
holds a medical record, so the question of what to do about it was put directly:
could Adnotia detect an extension with those permissions and show a warning
before somebody opens the app, so they can accept the risk knowing it is there?

The goal is right and this ADR keeps it. The mechanism cannot be built, and the
reason it cannot be built is also the reason it should not be faked.

## Why detection is not available

**There is no API.** `chrome.management` exists only for extensions themselves,
deliberately: the installed-extension list is a fingerprinting surface browsers
have spent years closing. Nothing web-facing exposes it.

Two side channels remain and neither is usable here:

- **Probing `chrome-extension://<id>/<resource>`.** It needs a hard-coded list of
  extension ids, so it only ever finds extensions somebody thought of in advance.
  Manifest V3's dynamic resource URLs defeat it, Firefox randomises the extension
  UUID per *installation* so it cannot work there at all, and a blocklist could
  never be updated anyway — hard rule 1 means this app fetches nothing, so the
  list would be stale from the day it shipped.
- **Noticing that the DOM was changed.** This finds extensions that *modify* a
  page.

## Why it should not be faked

That second point is not a limitation, it is an inversion. **The extension you
can detect is the one that visibly changes your page. The one that quietly reads
`localStorage` and sends it somewhere leaves no trace at all.** Detection would
be anti-correlated with the danger.

And a conditional warning teaches people what its silence means. Ship a screen
that says "we found a risky extension" and you have promised, by implication,
that a quiet load means checked-and-clear — a promise that would be most
confident exactly where it was most wrong. For a medical record that is worse
than saying nothing.

This is the same failure this repository keeps finding in itself: a budget that
measured the wrong document, tests that skipped every run, a no-network audit
that swallowed a missing file. A guard that cannot guard is worse than an absent
one, because people stop looking.

## Decision

**The risk is stated unconditionally, in the places where the choice is still
free, and a passcode is offered at first run.**

1. **The welcome page says it**, in "What it will not do". That page is read by
   somebody who has not typed anything yet, which is the only moment the decision
   costs them nothing.
2. **About has a section of its own**: what an extension can see, that no site
   can check — "and Adnotia does not pretend to check" — what a passcode does and
   does not do, and the two things that actually help.
3. **First run offers a passcode**, as a third step after the modules, skippable
   in one press.

**Not an interstitial on every load.** `07-design-system.md` gives the `nag`
primitive a limit of once per fortnight per topic for a reason, and a warning
somebody dismisses daily is invisible inside a week.

### Why first run, given the friction

It was raised as an objection and overruled, and the objection was weaker than it
looked. A passcode has no recovery path, and first run is the only moment at
which forgetting it costs nothing at all — there is no record yet. Every later
moment is worse. It is one screen, it is skippable with a single press, and the
step is not offered at all where there is no crypto or no storage to use it with.

### What a passcode is honestly worth

Two cases, and ADR-007 collapsed them into one when it listed "a nosy extension"
among the realistic threats it protects against:

- **An extension collecting storage in bulk across every site** — which is what
  nearly all of this actually is — gets an encrypted envelope and nothing it can
  use. This is a real and large reduction in the realistic risk, and it is why
  the passcode is worth promoting rather than leaving in Settings.
- **An extension targeting Adnotia specifically** defeats it completely. With
  host permissions it can read the decrypted record off the DOM while the app is
  open, inject into the page's main world, or hook `crypto.subtle` and capture
  the passcode as it is typed. **No client-side scheme can stop this**, which is
  the same sentence ADR-007 already applies to a compromised host.

The app now says both halves. It says the second one in the passcode step itself,
so nobody sets a code believing it does more than it does.

### The two things that genuinely help

- **A browser profile with no extensions in it.**
- **The one-file build, opened from disk.** Extensions have to be granted access
  to `file://` URLs separately, and are not granted it by default. This is not
  absolute — somebody can turn it on — but it is a real difference, and it is
  something the project already ships.

## Consequences

- ADR-007's "protects against the realistic threats: … a nosy extension" is
  amended by this record and split into the two cases above.
- Nothing in the app claims to have scanned, checked or found anything, and
  `safety.test.ts` fails on the wording that would imply it: "we scanned", "no
  extensions found", "none detected", "you are safe".
- The first-run step never lets somebody into an app they believe is encrypted
  and is not: the code is applied and awaited before first run completes, and a
  failure is reported on that screen. A test mutates it to finish anyway.
- The validation tests assert against the status line and against the setter,
  not against the whole screen. They did search the whole screen at first, and
  "Six digits or more" is also the field's permanent hint — so a mutation that
  accepted a three-digit code passed them. That is now two false-passing tests
  found by mutation in this repository, both the same shape.
- Eleven mutations were run and all were caught.
