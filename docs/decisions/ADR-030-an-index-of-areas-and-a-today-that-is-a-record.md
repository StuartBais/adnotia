# ADR-030: An index of areas, and a Today that is a record

Status: accepted · September 2026 · Amends `05-architecture.md`, `01-module-contract.md`, `07-design-system.md`

## Context

The app read as a medication log with other things bolted on. That is a fair
reading of the interface rather than a matter of taste, and three measurements
say why.

**Today was 67% medication.** The medication module contributes 14 of the 21
module-level `today` fields; sleep has 6, planning has 1.

**`mountToday` builds a card only for modules that declare `today` fields.**
Mindfulness, exercise and preparation declare none, so they produced no card at
all on the tab the app opened on. Enabling half the adult modules changed nothing
about the front door — not because of an oversight but because the front door was
structurally incapable of showing them.

**The Tools tab mounted every tool from every enabled module, fully expanded, in
one scroll.** Nine of them for an adult with everything on, in registration
order, with nothing to say what was there short of scrolling past all of it. An
accumulation rather than a chooser. `Tool.icon` had been in the contract since
the beginning and was rendered nowhere.

The distinction that fixes this was already the contract's:
`01-module-contract.md` defines `today` as the daily check-in and `tools` as
"things a person opens deliberately and uses now". The shell did not express it.
It rendered the log as the front door and the tools as a pile.

## Decision

**Areas.** A closed vocabulary the kernel owns, beside the tier wording and for
the same reason: if each module named its own, eight modules would produce eight
almost-synonyms and the index would be a list of one-item lists. Named for what
a person would be doing, in the app's voice — "Medication and body" rather than
"Medical", because the person opening it is not doing medicine.

**The area belongs to the module, not the tool.** An area is not a bag of tools:
medication and sleep contribute none at all — they are a daily log and a report
— and a vocabulary that could only hold tools would leave the two most
substantial modules in the app with nowhere to live. If a tool ever genuinely
belongs somewhere its module does not, that is the point to add an optional
override the way ADR-025 did for `tier`.

**The Tools tab becomes an index and moves first.** One card per area, each
opening a page, each of those opening one tool. Two taps to anything and the
whole map on one screen. An area page lists whatever its modules offer: tools,
the day's log where the area asks a daily question, and the history where the
area reaches the clinical report.

**Today becomes a tab, and is written as the day's record.** Its empty state said
"Nothing to fill in", which is a form's voice. A person opening this at nine in
the morning is not there to write up a day that has not happened.

## Consequences

Four tabs either way, reordered rather than added, so the `[role="tab"]` count
of four that two suites assert still holds and `EMPTY` stays exhaustive over
`TabId` without a compile error.

Every module now declares where it is found, and three invariants are held
rather than assumed: a module lands in an area its own space actually draws, so a
parent module filed under an adult area cannot be registered, enabled and
invisible; the two spaces partition the vocabulary exactly; and no area of a
space is empty, so no card opens onto nothing.

That last test earned its place immediately. "Talking to school" was in the first
draft of the vocabulary, and the school guidance is a Library page rather than a
module — so it was an area that would have drawn a card opening onto nothing. It
is gone. Where that guidance should be found is its own decision.

Driving the built file caught the other one. "Medication and body" opened onto a
single row, because neither of its modules contributes a tool. It links to the
history now, keyed off reaching the clinical report rather than off `records`,
which every module contributes and which would therefore have put the row in
every area and made it mean nothing.

**The child surface does not share this.** `src/kernel/family/childSurface.ts`
mounts its tools inline and must keep doing so: it is four cards a child uses
directly, not an index to navigate, and its integration test requires the timer
to read 5:00 on arrival. The two loops look alike and are not the same thing.
That test passing untouched is the evidence they stayed separate.

`05-architecture.md` already said to "lazy-load its `tools` and `reports`
renderers" if the performance budget ever bites. Tools opening as pages is the
change that makes that possible; nothing needs it yet at 82 kB of a 150 kB
budget.

This is presentation and one additive manifest field. No store, schema,
migration, report section, timeline mark or parity output moves.
