# ADR-033: The Family space's day had no record

Status: accepted · September 2026 · Follows ADR-031

## Context

Found by driving the built file through the Family space after Milestone 9,
which is the first time anybody had walked that space end to end rather than
testing its pieces.

**The Family space's Today tab rendered a date picker over nothing at all.** No
cards, no empty state, no explanation. Both parent modules were enabled and the
tab was blank.

The cause is one condition asking the wrong question. `mountToday` finishes with:

```ts
if (modules.length === 0) { /* say there is nothing to record */ }
```

"Is anything enabled" and "was anything drawn" are not the same question. In the
Adult space they coincide, because the modules that declare `today` fields are
the ones a person enables first. In the Family space they never coincide:
`family-observations` and `family-routines` are both enabled and **neither
declares a `today` field**, because the parent's daily record is the observation
log, which `04-family-space.md` specifies as dated entries in the parent's own
words rather than as a question with an answer.

So `groups()` returned nothing, the empty state did not fire because two modules
were enabled, and the tab drew a heading and stopped.

This predates Milestone 9. It became worth finding because Milestone 9 made Today
a deliberate destination rather than the screen you land on and scroll past.

## Decision

**The empty state asks whether anything was rendered.** `root.children.length === 0`
rather than `modules.length === 0`. One condition, and it is the honest one:
the question the empty state answers is "is there nothing here", which is a fact
about the page and not about the registry.

**`family-observations` contributes a `log`.** A parent who notes that the
reading book was left at school again now sees that on the record of the day,
the same way ADR-031 put a practice and a walk there for the Adult space. The
Family Today stops being a tab that exists and does nothing.

It repeats what the parent wrote rather than summarising it. `04-family-space.md`
is explicit that nothing in this space scores what a parent records, and a count
— "2 things noted" — is the app measuring how much they have noticed. A test
holds that.

## Consequences

Two spaces, one rule: the day's record shows what happened, whether the module
that knows about it asked a question or not. The Adult space got that in ADR-031
and the Family space was left behind because its modules ask nothing at all,
which is the same gap one layer down.

The blank tab was invisible to the test suite, and the reason is worth recording.
Every Family test mounts a specific view with specific modules and asserts what
is in it; none of them asked whether the whole space hangs together when a person
walks through it. Driving the built file is the only thing here that does, and it
has now found four defects nothing else did: the `'s chart` title with no name,
the duplicated heading, "Medication and body" opening onto a single row, and
this.
