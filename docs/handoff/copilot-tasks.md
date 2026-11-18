# Tasks to hand to GitHub Copilot

Written 18 November 2026. Each task below is a self-contained brief: paste one
into a new GitHub issue and assign it to Copilot, or paste it into Copilot
chat. They are chosen because none depends on the two things still undecided
(the visual direction, and how the phone apps are built), and none touches a
decision that is the owner's to take.

Do them in the order given. Tasks 1 to 3 are independent of each other; task 4
needs 1 and 2 merged first.

## Paste this at the top of every task

```
Context: Adnotia is being rebuilt as a phone app around shared domains. Read
CLAUDE.md, then docs/decisions/ADR-043 and ADR-044, before anything else.
Those two records win over the older numbered documents.

Rules for this task:
- TypeScript strict, no new dependencies, no UI framework.
- Pure logic only: no DOM, no network, no timers that outlive a call, no
  Date.now() inside logic (take the current time as an argument).
- Vitest tests beside the code. `npm test` and `npm run check` must pass.
- Do not edit anything under src/kernel/crypto, src/kernel/backup,
  src/kernel/reports or src/modules/medication.
- Do not change any evidence tier, any Library wording, or any text printed
  for a clinician or shown to a child.
- Do not add streaks that reset, "overdue" or "missed" counts, or any field
  that measures how long something was put off.
- Small commits, imperative mood. Open a pull request against main; do not
  merge it.
- If the brief is unclear or seems to conflict with ADR-043 or ADR-044, stop
  and say so in the pull request instead of guessing.
```

## Task 1: the shared task model

```
Create src/domains/tasks/ as pure TypeScript with tests. This is the one task
list every tool will act on, so a person never types a task twice (ADR-043,
decision 6).

A Task has: id, title, createdAt, optional notes, optional parentId (a
sub-step of another task), an order within its parent, optional
estimateMinutes, a list of work sessions (each a start and an optional stop
timestamp), optional doneAt, and a "when" that is exactly one of:
  - none (it sits in the inbox),
  - anytime on a given date,
  - at a time on a given date, with a duration in minutes.
Preserve unknown keys on a task, as the existing store does.

Write pure functions that take a task list and return a new one:
capture(title, now), rename, setNotes, schedule(when), unschedule,
addStep(parentId, title, now), reorderSteps, setEstimate,
startWork(id, now), stopWork(id, now), complete(id, now), reopen, remove
(removes its steps too).

Write selectors: inbox(tasks), forDate(tasks, date) split into timed (sorted
by time) and anytime, stepsOf(tasks, id), running(tasks) (the task with an
open work session, if any), minutesWorked(task, now), doneOn(tasks, date).

Rules to hold with tests:
- starting work on one task stops any other running one;
- completing a task stops its running session;
- a task with steps is not auto-completed when its steps are, and completing
  it does not complete its steps;
- every function leaves its input untouched;
- dates are local "YYYY-MM-DD" and times "HH:MM", matching
  src/kernel/dates; reuse its helpers and do not write new date maths.

Add fixtures: empty, a small day (five tasks, one running, one with three
steps), and a thirty-day history. No UI, and do not wire it into the shell.
```

## Task 2: the shared routine model

```
Create src/domains/routines/ as pure TypeScript with tests. A routine is the
same kind of object whether it belongs to an adult or is one a parent built
for a child (ADR-043, decision 8).

A Routine has: id, title, an owner that is either "self" or a child profile
id, an ordered list of steps (id, title, optional minutes), and an optional
anchor that is either a time of day or a free-text event such as "after
breakfast". A RoutineRun records one use: routineId, date, startedAt, the ids
of steps ticked with the time each was ticked, and an optional finishedAt.

Pure functions: create, rename, addStep, removeStep, reorderSteps,
setAnchor, startRun(routineId, now), tickStep, untickStep, finishRun,
abandonRun (removes the run without trace).

Selectors: routinesFor(owner), currentRun(runs, routineId, date),
nextStep(routine, run), runsOn(runs, date).

Rules to hold with tests:
- a run never records a step as skipped or missed; an unticked step is
  simply absent from the run;
- nothing counts consecutive days;
- a routine owned by a child profile can be listed without reading any
  "self" routine, and the reverse;
- unknown keys are preserved; inputs are never mutated.

Fixtures as in task 1. No UI.
```

## Task 3: reward and reminder options

```
Create src/domains/options/ as pure TypeScript with tests, for two things
ADR-044 decided.

Rewards (ADR-044, decision 1). Everything is off until the person turns it
on. Model a RewardSettings object with a default scope and per-scope
overrides, where a scope is "day", a task list id, or a routine id. The
options a scope can switch on are:
  - doneList: show what was completed today;
  - tally: a running total of completed items that never goes down and
    never resets;
  - celebrate: a brief acknowledgement when something is completed.
Write resolve(settings, scope) returning the effective options, and
tally(completions) returning the total. There is deliberately no option that
resets, removes or reports a gap. Add a test that the exported option names
contain nothing matching /streak|missed|overdue|lost/i.

Reminders (ADR-044, decision 2). Model a Reminder the person sets: id, what
it is attached to (a task id, a routine id, or free text), and when (a date
and time, or minutes before a timed task). Model a TimerWarning derived from
a running timer: minutes before the end. Write
due(reminders, timers, now) returning what should be raised now, and
nextDue(reminders, timers, now). Hold with a test that due() can only ever
return something created from a Reminder or a running timer, so the app has
no path to raise an alert on its own initiative.

This is logic only: do not call any notification API.
```

## Task 4: document shape for the new domains (after 1 and 2)

```
Add the new domains to the stored document. Read docs/06-data-model.md and
src/kernel/store first.

- Raise schemaVersion to 2. Version 2 adds a top-level "domains" object
  holding tasks (the list from src/domains/tasks), routines and routineRuns
  (src/domains/routines) and options (src/domains/options). Existing keys
  stay where they are.
- Write the 1 to 2 migration as a pure function in
  src/kernel/store/migrations, registered the way the framework expects. It
  adds an empty "domains" object and changes nothing else. It must be safe
  to run twice and must preserve unknown keys.
- Extend the backup merge so tasks, routines and runs merge by id (the
  backup's record wins on the same id, everything else is unioned), and
  report counts the way the existing merge does. This is the one permitted
  edit under src/kernel/backup; change nothing else there.
- Tests: migration from a version 1 fixture, idempotence, unknown-key
  preservation, a newer document handed back untouched, and merge cases.
- Add the migration to CHANGELOG.md under "Unreleased".

Do not move or convert any existing module data into the new domains.
```

## Task 5: a review packet for a second reader

```
Documentation only; change no source file.

Create docs/review/claims.md. For every Library entry in src/modules/*/
library.ts and src/kernel/library, list each factual claim the entry makes
as one row: the entry, the claim quoted exactly, the citation it rests on
(authors, year, DOI or PMID as given in the entry), and an empty "checked
by / date / verdict" column. Do not rephrase, judge or correct any claim.

Create docs/review/crisis-numbers.md listing every phone number, text
number and URL on the crisis pages (src/kernel/shell, search for the crisis
page), each beside the organisation it belongs to and an empty "confirmed
on the organisation's own site, date" column. Do not look the numbers up
and do not change them.

Add one line to the top of each file saying it was generated on its date
from the source at a named commit, so a reader can tell if it has gone
stale.
```

## What not to hand over

- Anything visual. The direction has not been chosen.
- Anything that wraps or packages the app for a phone. That needs an ADR and
  a dependency decision.
- The medication section's own sleep fields. It changes what a clinician is
  handed, which the owner reviews.
- Evidence tiers, Library wording, or anything shown to a child.
