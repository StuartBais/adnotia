# ADR-019: The mirror, and the one thing the app asks for

Status: accepted · September 2026 · Implements `03-scope.md`, follows ADR-005

## Context

`03-scope.md` records that hidden checks — telling a clinician whether a person
seemed to be seeking more than they needed — were considered and rejected, and
names what replaces them:

> The honest replacement is transparent record quality, shown to both parties,
> plus private reflection for the person. Both exist.

The first half shipped with the report engine: "About this record" states how the
record was kept, in the same words to both parties. The second half is this. It
is the only place in the app that says something to the person that a clinician
will not read, and that asymmetry is the point — it runs the opposite way to the
one that was rejected.

Two of the five things the monolith reflected are about how the record was kept,
which the kernel can see. Three are about focus ratings, side-effect load and the
person's own notes, which it cannot.

## Decision: modules contribute observations, the kernel decides what is shown

`Contributions` gains `mirror`:

```ts
{
  weight: 10,                                  // lower is shown first
  observations: (context) => MirrorObservation[]   // { tag, text }
}
```

The context is the one a report section gets, over the same range, so a module
reflects on exactly the days the report covers.

The kernel owns the frame and the limits, as it does for the timeline and the
table:

- **Nothing under seven days.** A week is the least that describes a pattern
  rather than a day.
- **At most four lines.** Past that it stops being a reflection and becomes a
  lecture, which is a different thing done to a person rather than for them.
- **Screen only.** `print.css` hides `.mirror`, and a test asserts it. It is not
  in the report HTML, not in the text export, and not in a backup as anything but
  the data it was derived from.

Every line states a fact the person can check against the same report and says
why it might matter in the room. None is a warning. None counts a failure. Where
the record disagrees with itself, both halves are named and neither is called the
true one — "one of the two is closer to the truth" is as far as it goes, because
the app does not know which.

## The explainer the printed page gave up

ADR-017 removed a sentence defining an optimal dose from the printed report,
because it told a clinician how to weigh the four rows above it. That left the
person without something they had, and this ADR is where the debt is paid: the
first line of the mirror says what the four are and that the app does not weigh
them, for the person or for the prescriber.

It is not the removed sentence. It describes the report's own design, which needs
no citation, rather than restating an unreferenced clinical convention.

## Decision: the reminder is bounded, and it is the only one

`03-scope.md` promises the app "nags about backups no more than once a fortnight,
in plain language, without alarm". This is the only thing in the app that asks a
person to do something they did not ask to do, so:

- It appears on one screen, Today, and nowhere else.
- Not before five logged days: below that there is little to lose.
- Not within fourteen days of a backup, and not within fourteen days of being
  dismissed. **Dismissing does not switch it off**; it waits the same fortnight.
  An off switch would make the reminder either permanent or gone, and the
  fortnight is the honest middle.
- One action, and a way to say not now.
- It counts entries, never days missed. Hard exclusion 9 bans streaks and
  shaming, and "you have not backed up in 40 days" is a fact about a file while
  "you missed 12 days" is a fact about a person.

Taking a backup now records `lastBackup`, which the Settings page displayed and
nothing ever wrote — so it read "None yet" forever and this reminder would have
fired every time. A browser will not say whether the file reached the disk; that
it was made and handed over is the strongest available signal, the same limit
ADR-015 records for the passcode gate.

## Consequences

- The mirror is the third contribution seam of this shape, after ADR-013's
  timeline and ADR-018's table. The pattern is settled: modules offer, the kernel
  frames, no dependency is declared.
- A module can put words in front of the person through it. They are not printed
  and not exported, so the clinical-section rules do not apply to them — but the
  voice rules in `07-design-system.md` do, and hard exclusion 9 bans shaming
  outright. The module smoke test now scans every mirror line for it, so the
  surface is covered by the same reflex that covers the clinical sections.
- If a future module's observation would be better addressed to a clinician, that
  is a report section, not a mirror line, and the two must not be confused.
