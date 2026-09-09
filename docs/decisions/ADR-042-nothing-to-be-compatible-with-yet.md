# ADR-042: There is nothing to be compatible with yet, so stop carrying it

Status: accepted · September 2026 · Amends ADR-003, ADR-007 and ADR-041

## Context

The repository carried three things whose only purpose was compatibility with
what came before:

- **The v0 import.** `migrations/v0.ts`, the `V0_KEY` branch in the application's
  start path, and its tests: about 350 lines that read the monolith's flat
  `entries` shape out of `adhd-titration-log-v1` and produce a v1 document.
- **Envelope version 1.** A read path for envelopes sealed without a bound
  header, added as a compatibility branch by ADR-041 one commit before this one.
- **The parity suite.** `tests/parity/`, about 860 lines, loading
  `reference/adnotia-v0-monolith.html` in jsdom and comparing its report text,
  history lines, date arithmetic and text export against the module build's
  output for the same fixtures.

All of it was written to protect people with existing data. There are none. The
app is unreleased, `package.json` is at 0.0.0, there are no published releases,
and the author — the only person who has run either build — confirms no v0 or v1
data exists that anybody needs.

Compatibility is cheap to keep for a week and expensive to keep for a decade,
and the moment to decide is before the first release. After it, this is
somebody's data and the answer is permanently no.

## Decision

Remove all three.

**The v0 import goes.** `schemaMigrations` is now empty and `schemaVersion` 1 is
the first shape anybody's data is in. The machinery stays: `detectSchemaVersion`
and `migrateDocument` still refuse a version they have no path for and still hand
back a newer document untouched, because the first real migration will be written
against those rules. `tests/kernel/migrations.test.ts` now tests the machinery
rather than the one migration that used it.

**Envelope version 1 goes.** `Envelope.v` is `2` and nothing else. This is worth
more than the five lines it saves: there is now no code path in this repository
that reads a header an attacker could have edited, and that is an invariant
rather than a default. A file claiming to be version 1 is refused, and there is a
test that says so.

**The parity suite goes**, and this is the part that costs something real, so it
is written down plainly rather than filed under tidying.

## What the parity tests were worth, and what replaces them

They did their job. Milestone 1's definition of done was parity with the
monolith, and they proved it: the same report text to the letter, the same
history lines, the same text export, with every remaining difference recorded and
argued in a register that asserted the gaps were declared rather than forgotten.

What is lost is the cross-check against a second implementation. Nothing now
proves the clinician's report says what the predecessor said. What remains is
that the report is still tested directly and thoroughly — fifty tests in
`tests/kernel/reports.test.ts`, plus each module's own suite, plus the print and
text-export tests — so the report is not untested. It is unanchored.

That is an honest loss and the argument for accepting it is that the anchor had a
finite purpose. A parity test answers "does the rewrite match the thing it
replaced". Once the answer is yes and the thing it replaced is frozen, the test
stops being a specification and becomes a second implementation that has to keep
being maintained, executed and reasoned about — including in every future change
where the right answer is deliberately *not* what the monolith did. The register
of argued differences was already three entries long and growing in one
direction.

The risk being taken: a future change to report wording or figures will no longer
be caught by a comparison, only by the direct tests. If that turns out to be too
loose, the answer is more direct tests, not a resurrected monolith.

## Consequences

- `reference/adnotia-v0-monolith.html` stays in the repository and is no longer
  executed by anything. `reference/README.md` and `CLAUDE.md` now say it is
  history: read it to see where something came from, and never as a reason for
  what the code should do. The provenance comments through `src/kernel/ui/` stay
  accurate.
- `npm run test:parity` is gone. `npm test` is the whole suite.
- 1212 tests, down from 1273. The drop is the parity suite and the v0 import
  tests, not coverage of anything this build still does.
- **Interop with the monolith is over in both directions.** ADR-041 ended one;
  this ends the other. `06-data-model.md`'s v0 mapping section is replaced by a
  note saying where it went.
- Anyone who somehow does hold v0 or v1 data — an old browser profile, a backup
  file from a build before today — cannot open it with this build, and the
  failure will look like a wrong passcode rather than an unsupported format.
  That is the accepted cost of the premise. If the premise turns out to be wrong
  for even one person, the code is in git history and this ADR is the place to
  record the reversal.
- The next milestone that adds a `schemaVersion` migration writes the first entry
  in an empty map, against rules that are still tested.
