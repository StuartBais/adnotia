# ADR-044: What the research settled, and what the owner decided from it

Status: accepted · November 2026 · Amends ADR-043, ADR-006, ADR-008, ADR-019
and ADR-038; corrects `02-evidence-rubric.md` and `04-family-space.md`

## Context

ADR-043 called for research before a product brief. It is in
`reports/ADHD app design and tools.md`, with the notes behind it in
`research_notes/`, each opening with what was read at source and what was not.
The report listed fifteen places where the findings cut across ADR-043 or the
standing rules. The owner decided six of them on 14 November 2026.

## Decisions

**1. Rewards are the person's choice.** "No guilt mechanics" is replaced by:
the app offers rewards and counts as options, a person turns each on or off
whenever they like, and may set them for a day, a list or a routine. Nothing of
the kind is on until chosen.

The research is the reason the rule moved. No study has tested streaks on
outcomes in adults with ADHD. Some interviewees ask for rewards, badges and
streaks; a count that never resets was well received; experts warn against
feedback that penalises; the best-regarded app in the category has streaks.

One thing is carried forward as the author's recommendation, for the brief to
confirm or drop: the options offered do not include one that takes something
away or announces a loss, because a reset is the one mechanic with evidence of
harm, in general-population studies. And the app still never sends a message
designed to shame, whatever is switched on.

**2. Alerts are only the ones a person sets or starts.** A reminder the person
asked for, and a warning from a timer they started. The app raises nothing on
its own initiative. This follows W3C's cognitive accessibility guidance,
"Reminders must be set only at the user's request", and it replaces
"notifications are not on the roadmap".

**3. The app opts out of the operating system's cloud backup.** iOS and Android
copy an app's data to the person's cloud account by default. Leaving that on
would make "your data never leaves the device" untrue. The encrypted export
remains how a person moves or keeps their data.

**4. The medication section gets its own sleep fields.** It shares nothing with
the sleep tool, in either direction, so decision 7 of ADR-043 holds without the
clinician's report losing its sleep band. A person who uses both enters a night
twice. That cost is accepted for the separation.

**5. Two sentences in the documents were wrong and are corrected.**

- `02-evidence-rubric.md` said a 2025 network meta-analysis (Yang et al.) found
  CBT "the most effective non-pharmacological intervention on core symptoms,
  short and long term", and that mindfulness-based cognitive therapy "ranked
  second". On that paper's point estimates CBT was third in the short term and
  fourth in the long term, and mindfulness second and then first. Its effect
  sizes are also implausibly large. The planning row now rests on Ostinelli et
  al. 2025 and Gosling et al. 2025, both read in full, and says what they say:
  the benefit of CBT at about 12 weeks is on clinicians' ratings and not on
  patients' own. The mindfulness Library entry, which repeated the ranking, is
  reworded. ADR-025 quotes the old sentence and is left as the record it is.
- `04-family-space.md` said the children's sleep intervention improves "both
  sleep and daytime functioning". In the 2015 trial the benefit on ADHD symptoms
  was reported by parents only, and the 2019 trial of 361 children improved
  sleep and found no benefit in other domains.

**6. Three proposed tiers change, as proposals.** The owner asked for what
needs fixing to be fixed and has nobody yet to act as second reader, so these
are marked as awaiting one, which is what the rubric requires before a tier is
final:

- the visual schedule, first / then board, visual timer and reward chart, as
  aids on their own: C, not A. No trial has tested any of them alone in children
  with ADHD. The parent-training techniques they come from stay at A for
  parenting and conduct outcomes;
- the children's sleep routine: B, not A/B;
- nothing else moves. The report notes that exercise and sleep at B are
  generous and that goal management fits C better; those are left for the
  second reader.

**The fourth tier's wording,** as a draft for the brief: "Widely used. Many
people with ADHD say this helps them. It has not been tested in trials."

## Still open

- Who the second reader of tiers is. Until there is one, every tier in the
  build is a proposal by its author, as the roadmap already says.
- Whether "enter a task once" is what people want. No user said it in anything
  read. It goes into the brief as a design hypothesis, supported by WCAG 2.2's
  rule against asking for the same information twice.
- Store rules for an app with a child's surface, which were read only in
  summary, and the fact that an Android app cannot hard-lock itself, so the
  child's surface needs the app's own exit code and cannot promise more.
- How the phone apps are built.

## Consequences

- `CLAUDE.md` hard rules 1, 3 and 6 are superseded as ADR-043 and this record
  describe, and a note at its head now says so.
- The person-set alert and the reward options each need the argument ADR-038
  made for the focus timer: what stops this being used against the person. The
  brief owes one for each.
- A night entered twice is the first known cost of keeping medication apart. If
  it proves to be a real nuisance, the answer is a new ADR, not a quiet link.
