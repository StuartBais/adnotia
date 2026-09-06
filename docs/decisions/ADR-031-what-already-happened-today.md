# ADR-031: What already happened today

Status: accepted · September 2026 · Extends `01-module-contract.md`, follows ADR-030

## Context

ADR-030 moved the landing to an index of areas so the app stopped opening on a
dose form. That fixed which screen a person sees first. It did not fix the screen
itself.

The day's record is assembled by `mountToday`, which builds a card for each
module that declares `today` fields. Three of the six adult modules declare none:
mindfulness, exercise and preparation are tools, not questionnaires. So a person
who sat for three minutes this morning and walked to the shops this afternoon
opened the record of their day and saw a medication form and nothing else. Not
because anybody decided that; because the assembler had no way to hear from a
module that does not ask a question.

That is the structural half of "a medication log with things bolted on", and it
is the half a navigation change cannot reach.

## Decision

A new contribution point, `log`, beside `mirror` in `Contributions`:

```ts
export interface LogContribution {
  weight: number;
  lines: (day: Readonly<Record<string, unknown>>) => string[];
}
```

The kernel collects lines from every enabled module, sorts by weight, and prints
them in one card, **So far today**, above the questions. A person's day reads as
one thing: what happened, then what is left to write down.

**It is not `columns`,** and that was the decision worth making carefully.
`DayColumn.cell` has almost exactly this signature — one module's own day record
in, a string out — so reusing it was tempting. But only medication and sleep
declare `columns`, because that seam feeds the clinical report's day-by-day
table. Putting "sat for three minutes" into it would put a mindfulness practice
into a prescriber's document, which is precisely the leak the module contract
exists to prevent. `mirror` is the right precedent: a screen-only seam that never
leaves the device.

Two rules, both from `03-scope.md`, and both enforced by the shape rather than by
review:

**It never leaves the screen.** The Today view carries `data-print="never"`, and
a test asserts a logged practice appears in neither `report.html` nor
`report.text`.

**It carries no guilt.** A module with nothing to say returns no lines, and the
card disappears entirely — no heading, no empty row, no dash. There is no way to
express "you did not meditate today", because `lines` can only return things that
happened. A test holds that, and another holds that exercise reports two
movements rather than forty-five minutes: a total is the app having an opinion
about how much is the right amount, which the scope document rules out.

## Consequences

Mindfulness and exercise gain a `log` and needed no new storage to do it — both
already key their sessions by date, because their tools wrote them that way. The
day's record now shows what their tools recorded without asking a single extra
question, which is the point: `01-module-contract.md` already warns that a field
most people leave blank fails review.

Modules that ask a daily question do not also log it. Medication's dose is on the
screen already, three inches below, and a module repeating itself would make the
card noise rather than a record.

Preparation and planning are eligible and do not use it yet. Their tools write
entries and plans, and whether a plan written this morning belongs in the record
of how the day went is a judgement about that module rather than about this seam.

The card is titled "So far today" rather than "Your day" or anything that sounds
like a summary of a person. It names what is underneath it — things that already
happened — so the questions below read as the rest of the same record.
