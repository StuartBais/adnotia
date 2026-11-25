# Adnotia product brief

Status: draft 0.1 · November 2026 · Follows ADR-043, ADR-044 and ADR-045

This is the document to build from. It replaces `01-module-contract.md`,
`05-architecture.md` and `07-design-system.md`, and the parts of `03-scope.md`
named below. Those files stay as the record of the first build. Where this
brief and a decision record disagree, the decision record wins and this brief
is wrong.

The research behind it is `reports/ADHD app design and tools.md`. A rule here
that rests on a finding says so, and says what kind of finding: a trial, a
guideline, what people report, or the author's judgement.

## What Adnotia is

A phone app for iOS and Android that helps adults with ADHD get through a day,
and helps parents of children who may have ADHD run a household and prepare for
appointments. Everything a person enters stays on their phone. There is no
account, no server, no advertising and no analytics. The source is public under
the AGPL-3.0.

It is a helper. It is not a treatment, a diagnostic tool, a prescriber, a
medical device or a crisis service, and it never says it is.

## What still stands from `03-scope.md`

Unchanged, and binding:

- "What Adnotia is not", and the medication log's purpose and its rules:
  describe, the clinician judges, it shows its own weaknesses, nothing is
  hidden from the person, reflection is private.
- No covert assessment.
- Hard exclusions 1 to 7 and 10 to 12.
- The screening rules, including that neither instrument ships without
  permission.
- Safety and comorbidity: the "if things are bad right now" page, two taps from
  anywhere, and no attempt to detect crisis from data.
- Tone.

Changed:

- **Exclusion 8** (charging) becomes: everything in the scope as it stood in
  September 2026 is free for good; backup, export, the clinician's report, the
  app lock and every accessibility setting are never behind payment; payment
  goes through the store, with no account or server of Adnotia's.
- **Exclusion 9** (streaks, badges, points) becomes the rewards rule below.
- **"Nothing is sent anywhere"** becomes "your data never leaves the device".
  The app's own code makes no request. A store purchase is between the
  operating system and the store.
- **The regulatory review** has to be redone for a store listing and for an app
  with a child's surface. Until it is, the September review describes a product
  that no longer exists.

## Who it is for, and the two moments that matter

The research found two wants with direct statements behind them, both from what
people with ADHD report and neither from a trial:

1. **Capture with almost no friction.** A thought has to be written down before
   it is gone, from wherever the person is.
2. **A way back with no accusation.** After an hour or a month away, the app
   shows where things are and says nothing about the gap.

Every screen is judged against those two first. A third idea, that a task is
typed once and every tool acts on it, is the owner's and the author's
judgement, supported by WCAG 2.2's rule against asking for the same information
twice; no user was found asking for it. It is built as a hypothesis and should
be the first thing tested with people.

People with ADHD rate apps low: 3.5% of 1,859 surveyed adults called a
productivity app "extremely helpful". Most praise goes to paper, other people
and timers. The app earns its place by being as quick as paper and as visible
as a note on the fridge, and it should make printing and widgets first-class
for that reason.

## Structure

Five places. Nothing else is top-level.

| Place | Holds |
|---|---|
| **Today** | The running task, the rest of today as timed items plus an "anytime" group, what got done, and capture |
| **Tasks** | The inbox and every task; a task opens to its steps, estimate and a way to start |
| **Routines** | Ordered lists a person runs: morning, evening, night-before, and any they make |
| **Library** | Everything else: sleep, exercise, mindfulness, if-then phrases, problem-solving, the evidence pages. New domains arrive here |
| **Me** | Settings, lock, backup, and the doors to Medication and Family |

Rules:

- No screen offers more than five main choices (W3C cognitive accessibility
  guidance).
- The path to the most-used thing is: open the app, do it. Capture is reachable
  from every screen in one tap.
- Tools that act on a task are actions on the task, reached from it. They are
  not places.
- Growth goes into the Library, never into the tab bar.
- First run asks for nothing it can ask for later, and the app is usable before
  any setup.

## Domains and how they link

A domain owns its records. Other domains may refer to a record by id and may
call the owning domain's functions; they never copy it.

**Tasks** (`src/domains/tasks`, built). One list. A task has a title, optional
steps, an optional estimate, work sessions stored as start and stop times, and
a "when" that is one of: no date (inbox), anytime on a date, or at a time on a
date. Starting work on one task stops any other. Estimate sits beside time
actually worked. There is no field for how long a task was put off.

**Routines.** The same object for an adult and for a child profile: ordered
steps and an optional anchor, which may be an event ("after breakfast") as well
as a clock time, because adults with ADHD show a large impairment in
remembering to act at a time and none when prompted by an event (one study,
read as an abstract). A run records what was ticked. It never records what was
not.

**Options.** Rewards and reminders, below.

**Day.** Sleep, exercise and mindfulness logs, kept from the first build and
reached from the Library.

**Medication.** Its own section behind its own door. It reads nothing from any
other domain and nothing reads it. It has its own sleep fields for the cover
chart. A person who uses both enters a night twice, and that cost is accepted.

**Family.** Child profiles, the observation log, the parent tools and the
child's surface. Joined to the rest in exactly three ways: a task a parent
captures for a child's sake is a task in the parent's own list; routines are
the shared object above, owned by a profile; and Family is one step from Me.
Nothing reaches the child's surface except what the parent authored for it.
Medication takes no part.

## Rewards

Off until chosen. A person may turn on, for the whole day or for one list or
routine, and change at any time:

- a list of what got done today;
- a tally that only goes up and never resets;
- a brief acknowledgement when something is completed.

There is no option that takes anything away, resets, or reports a gap, and the
app never sends a message designed to shame. Some people ask for rewards and
streaks and some are harmed by a broken one (what people report; no trial in
adults with ADHD either way; general-population studies find a displayed break
reduces later use). The owner has asked for the person to choose what helps
them; a resetting streak is left out as the author's recommendation and is the
owner's to overrule.

On the child's surface the only reward is the parent-run chart: positive-only,
every change made by the parent, no reminder.

## Alerts

Only what a person sets or starts: a reminder they asked for, and a warning
from a timer they started. The app raises nothing on its own initiative (W3C:
"Reminders must be set only at the user's request"). Whether a device-only app
can schedule local alerts with no server on both platforms is unconfirmed and
must be checked before this is promised.

## Evidence

Every tool carries a tier, shown in words where a person decides to use it, and
a Library entry with what it is, what the evidence says, what it will not do,
and citations. Tiers are judged within a population and do not transfer between
adults, children and, later, autistic people.

- **Established (A).** Repeated trial evidence, or direct support for a
  treatment that has it.
- **Promising (B).** Limited or indirect trial evidence.
- **Plausible (C).** Untested, and a direct implementation of a technique from
  an established programme.
- **Widely used.** "Many people with ADHD say this helps them. It has not been
  tested in trials." A tool enters this tier on repeated first-person reports
  from independent sources, named in its entry. It never borrows the word
  "evidence".

What the research means for wording: the only non-drug approach with blinded
trial support in adults is a therapist-taught skills package, and its benefit
at about twelve weeks shows on clinicians' ratings and not on patients' own. No
single tool a phone can deliver has been trialled alone. So no tool is
described as established on its own account, and an entry says who noticed the
improvement.

The exclusion list in `02-evidence-rubric.md` stands. A tier is final only when
someone other than its author has confirmed it, and nobody yet fills that role.

## Design

**Proposed, November 2026: Lantern, with the Now capsule (ADR-047).** The owner
set the Bookmark Edition aside after trying it, and chose this direction from
ten (`design/explore/`). It keeps the palette below, changes the look and the
type, and is specified in `design/lantern/SPEC.md`. When ADR-047 is accepted,
this section is rewritten from that specification. Until then, the rest of
this section describes ADR-045.

The direction is the Bookmark Edition, in charcoal and terracotta (ADR-045).

**The idea.** A printed daily edition. The running task is the headline. A
numbered bookmark holds your step while you capture something else and brings
you back to the same sentence.

**Colour.**

| Role | Value |
|---|---|
| Ink | `#222624` |
| Paper | `#FFFFFF` |
| Accent | `#F28C5E` |
| Stone | `#EEF0EC` |
| Sage tint | `#DFE9E0` |
| Muted ink | `#595C5B` |

Every text pairing is at least 4.5:1; the table of ratios is in ADR-045.
Nothing carries meaning by colour alone. No colour is described as helping
attention, anywhere.

**Type.** A serif for what a person reads and acts on: the task, the step, the
numbers. A sans for controls and context. Faces to be confirmed. A
dyslexia-friendly face is offered as a setting, as the two best-regarded
planners do.

**Rules that come from guidance or findings.**

- Time is shown as a quantity as well as a number: marks or a bar beside a
  literal count.
- The current step gets the largest type on a focus screen, not the clock.
- Returning to a screen restores where the person was, including an unsaved
  draft.
- No red, no "overdue", no count of what was not done. A past item is simply
  unscheduled again.
- Renaming or moving a control is a cost. A small study of autistic adults
  found a change of wording cost more than a change of style; labels and order
  are treated as fixed once shipped.
- Touch targets at least 44 px; real controls with labels; reduced motion
  respected; the app's text follows the phone's text size.

**Rules that are identity, and say so.** The serif headline, the ruled lines,
the bookmark shape, the palette.

**Still to design.** Icons, motion and haptics, the full type scale, large-text
layouts, a dark scheme, the child's surface in this direction, and the
clinician's printed sheet in the new type.

## The phone

- **Storage.** In the app's own sandbox, encrypted with the existing envelope.
  The key may be held by the platform's secure store and released by biometrics
  as a convenience; the passcode remains the thing that unlocks.
- **Backup.** The app opts out of the operating system's cloud backup, so the
  claim that data never leaves the device stays true. The encrypted export,
  through the share sheet, is how data is kept or moved. The app says this
  plainly, because a person who loses their phone without an export loses
  everything.
- **The child's surface.** An Android app cannot hard-lock itself, and a child
  can leave screen pinning. The surface needs the app's own exit code and must
  not promise more than that. A printed schedule is a first-class output.
- **Print.** The clinician's report, the observation log and routines print
  through the platform's own print sheet.
- **How it is built** is undecided. The existing TypeScript core and its tests
  favour wrapping over rewriting twice; that needs its own decision record and
  is a dependency decision for the owner.

## What is kept, and what is rebuilt

Kept, with their tests: encryption, backup and restore, the store and its
migrations, date arithmetic, the report engine, the medication log's logic and
report, the Library's content.

Rebuilt: the shell and navigation, every interface primitive, the planning,
routine and Family interfaces, the design system.

Gone: the browser app as a product, the single-file build, the welcome page as
anything but a page that links to the two stores and the source.

## Order of work

1. The remaining domain models and the version 2 document (tasks 2 to 4 in
   `docs/handoff/copilot-tasks.md`).
2. The decision on how the phone apps are built.
3. **One tool built properly, as the benchmark:** Today, capture, a task
   opened, and focus, in the chosen direction, on a real phone. Nothing else is
   built until this feels right in the hand.
4. Tasks and Routines in full.
5. Medication, moved behind its own door with its own sleep fields. The
   clinician's sheet is reviewed by the owner before it changes.
6. Family, including the child's surface.
7. Library and the fourth tier's first entries.
8. Store readiness: the regulatory and store-policy review, real-device
   screen-reader testing, the listing wording.

## Open, and whose it is

| Question | Whose |
|---|---|
| How the phone apps are built | Owner |
| Whether a resetting streak is offered | Owner |
| The two typefaces | Owner |
| Who confirms evidence tiers | Owner, to find a second reader |
| Regulatory and store review for an app with a child's surface | A qualified person |
| Whether "enter a task once" is what people want | Testing with people |
| Whether local alerts work with no server | To be checked in the build |
| What `adnotia.com` shows until the first store release | Owner |
