# Adnotia Family space: parents and children

Status: draft 0.1 · September 2026 · Extends `01-module-contract.md`, `02-evidence-rubric.md` and `03-scope.md`

## Why a separate space

Adnotia began as tools for adults managing their own ADHD. Parents of children with suspected or diagnosed ADHD have a different job: deciding whether to seek advice, preparing for that conversation, and running a household in a way that the evidence says helps. Children need almost nothing from an app, and what they do need is small, visual and handed to them by a parent.

So the app has two spaces. The **Adult space** is the person's own. The **Family space** belongs to a parent or carer, holds one or more child profiles, and contains a small child-facing surface the parent can hand over. The two spaces share the kernel and nothing else. A person can use both.

## Who the Family space is for

Parents and carers of children roughly 4 to 17 where ADHD is suspected, being assessed, or diagnosed. Two age bands, because the evidence and the tools differ:

- **Younger children, about 4 to 11.** Everything is parent-mediated. The child touches the app only through the handed-over surface.
- **Adolescents, 12 to 17.** More autonomy over the tools, still set up and held by the parent. No self-report screening, because the free validated instruments are parent- and teacher-completed and the adolescent self-report scales are proprietary.

Adolescents may also be curious about the Adult space. It is not blocked, but the adult screener states it is for adults and the medication log's eligibility question is asked plainly.

## The first job: should I seek advice?

This is the reason the space exists and the thing it must do well. A parent wondering whether their child's behaviour warrants a doctor's visit has a validated, free instrument available to them, and almost no app offers it honestly.

### The instrument

The NICHQ Vanderbilt ADHD Diagnostic Parent Rating Scale. Validated for ages 6 to 12, and the form many paediatricians and GPs use themselves. It is **not** free to reproduce, which this document previously said it was. The form carries "Copyright © 2002 American Academy of Pediatrics. All Rights Reserved" and a note that the AAP does not endorse modifications to it. It is freely downloadable for clinical use; redistributing it inside this source is a different permission and has not been obtained. See `decisions/ADR-023-the-screeners-are-not-ours-to-reproduce.md`. It is presented under exactly the rules `03-scope.md` sets for the adult screener, with three additions.

- Items and scoring use the NICHQ wording unmodified.
- The only outcome reported to the parent is whether the responses are or are not consistent with seeking an assessment. The form's symptom-count structure is never turned into "meets criteria", a percentage, a severity label, or a probability.
- The Vanderbilt includes screening items for oppositional, conduct, anxiety and mood problems. **These are never labelled as disorders in the app.** The parent sees that "there are concerns in more than one area that are worth raising", and no more. Labelling a child's mood items as "depression screen: positive" is a diagnostic act and is excluded.
- The deliverable is the completed form, printed, for the parent to take to the appointment. That is how clinicians actually use it, and it makes the app's contribution honest: it helped fill in a form the doctor would have handed over anyway, but with two weeks of thought instead of five minutes in a waiting room.
- The teacher version is printable too, blank, with a short note explaining that assessment usually needs a view from a second setting. The app never asks the parent to enter a teacher's answers.

### Outside the validated range

- **Under 6.** No validated free screener. The app offers guidance instead: what is developmentally ordinary at this age, what patterns guidelines say are worth raising with a health visitor or GP, and how to describe them. It does not score anything.
- **13 to 17.** The Vanderbilt is validated to 12. The app says so, offers the observation log (below) as the preparation tool, and routes to a clinician conversation rather than a number.

### What it is careful not to do

The screener is presented alongside a plain statement that ADHD is diagnosed by a clinician over time, across settings, with information from more than one adult, and that a screening form is the start of that process, never its end. The reverse error matters too: a parent whose responses fall below the threshold is told that the threshold is a screening convention, not a verdict, and that persistent concerns are always worth raising.

## The second job: an observation log

Assessment depends on impairment in more than one setting, over months. Parents arrive at appointments with impressions; clinicians want examples. A dated, structured record of specific observations does for the parent what the medication log does for an adult: it replaces recollection with a record.

Each entry is short and concrete:

- when and where (home, school, elsewhere),
- what happened, in the parent's words,
- what was going on beforehand (tired, hungry, transition, screen time ending),
- what helped, if anything.

Nothing is scored. Nothing is rated on a scale. The log prints as a dated list for the appointment, with a coverage line ("14 entries across 6 weeks, from home and school") and the same record-quality footer the adult report uses. It is the antidote to both over-referral driven by one terrible week and under-referral driven by a parent who has normalised a great deal.

## Parent tools

These come from behavioural parent training, the first-line psychosocial intervention for childhood ADHD in most guidelines and the one NICE recommends first for children under five. The evidence needs stating carefully, and the Library entry states it this way:

> Parent training reliably improves parenting and reduces children's conduct problems, including when the people rating the outcome do not know which families had the training. Its effect on core ADHD symptoms is smaller, and in the short term largely disappears when only blinded ratings are counted, though modest effects appear at longer follow-up. In plain terms: these tools help the household, and they help behaviour. They are not a treatment for the attention and impulsivity themselves. ADHD is not caused by parenting, and parenting approaches still measurably help.

The tools are the components the evidence identifies as active ingredients, chiefly antecedent management and reinforcement:

- **Routines and visual schedules.** Morning, after school, bedtime. Built by the parent, shown to the child.
- **First / then.** The simplest antecedent tool. "First shoes, then tablet."
- **Specific praise prompts.** Reminders and worked examples of labelled praise, because reinforcement of desired behaviour is one of the two components most associated with reductions in negative parenting.
- **A positive reward chart.** Parent-configured, positive-only. Points are earned, never lost. The app never runs it autonomously, never nags, never adds a streak. This is a behavioural technique with an evidence base, which is why it is permitted here while engagement mechanics are banned everywhere else. The distinction is written into the contract.
- **A sleep routine.** Sleep problems are common in children with ADHD and a brief behavioural sleep intervention has trial evidence for improving both sleep and daytime functioning. Bedtime routine builder plus the child sleep observations in the log.
- **School.** Plain guidance on talking to the school, what a daily report card is and why it has evidence, and how to ask for one. The app does not manage the report card; the school does.

Psychoeducation for parents lives in the Library, tiered like everything else.

## The child-facing surface

Deliberately tiny. A parent unlocks, taps "hand to [child's name]", and the phone shows only:

- a visual timer,
- today's visual schedule,
- the first / then board,
- the child's own reward chart, view only.

No text entry. No settings. No links. No way to reach the parent's data, the Adult space, or anything outside the app. Leaving child mode requires the parent code. The child's name is a nickname chosen by the parent and nothing else about the child is asked for beyond an age band.

Whether the child should be able to record anything at all, even a three-face "how was today", is an open question deliberately left out of the first version. Data a child generates about themselves needs its own thinking and is not needed for the first job.

## What the Family space excludes

Everything in `03-scope.md` applies. In addition, the Family space never:

1. **Tracks a child's medication.** No dose fields, no times, no side-effect chips, no titration report. This is deliberate, and not an oversight to be fixed later. Paediatric titration is clinician-led, involves school-setting reports, growth and cardiovascular monitoring, and structured clinic instruments. A parent-kept log without that context is the wrong tool, and a parent who wants one should ask the clinic for its own monitoring forms. The Library says this in plain words so that the absence is understood as a choice.
2. Collects self-report screening from a child or adolescent.
3. Labels any Vanderbilt subscale as a disorder, or shows counts, percentages, severities or probabilities.
4. Compares one child with another, or with norms, in the interface.
5. Attempts to detect risk, abuse, neglect or mood disorder from anything recorded. Guidance may list circumstances guidelines say warrant urgent advice; the app never applies that list to the data.
6. Lets a child enter free text or reach anything outside child mode.
7. Exports or shares a child's data except by the parent printing a form or the observation log.
8. Uses engagement mechanics on the child surface beyond the parent-configured reward chart described above.

## Safety

- **The absence of networking is the primary child-safety property.** Nothing can contact the child, nothing can be shown to the child from outside the app, and nothing about the child leaves the device. This is structural, not a policy, and the Library says so.
- Child mode is kiosk-like. Exit requires the parent code. Screen-lock behaviour follows the device.
- A parent-facing "if things are bad right now" page carries child- and parent-specific resources alongside the general ones, reviewed each release with the review date printed.
- Regulatory codes for services likely to be used by children, such as the UK Age Appropriate Design Code, apply in spirit even to an app with no server: high privacy by default, no nudges, no profiling, data minimisation. The Family space should be reviewed against the relevant code before launch and the review recorded in `03-scope.md`.
- Deleting a child profile deletes everything recorded about that child, after confirmation, and this is available in one place.

## Architecture notes

- Modules gain an `audience` field: `"adult"`, `"parent"` or `"child"`. A `"child"` module may contribute only to the handed-over surface and may declare no `today` fields, no `reports` and no free-text inputs. The contract enforces this.
- Family state lives under `family.children[<profileId>].modules.<id>`, one slice per child per module, so two children's data never mix and a profile can be deleted cleanly.
- The kernel gains a `parentGate` primitive: a view that requires the passcode to enter and to leave. Child mode is built on it.
- The `clinical` report is adult-only. The Family space has its own named reports: `screening` (the completed Vanderbilt, parent and blank teacher form) and `observations` (the dated log with its coverage footer).

## Evidence tiers for the first Family modules

| Module | Audience | Proposed tier | Reasoning |
|---|---|---|---|
| Vanderbilt screener | parent | Validated instrument, not a treatment; presentation rules as above | Free, widely used in primary care, validated 6 to 12. |
| Observation log | parent | A (supporting) | Supports clinical assessment, which is the evidenced pathway. Records; does not score. |
| Routines, first / then, praise, reward chart | parent, child surface | A for parenting and conduct outcomes; honest that blinded effects on core symptoms are small | Multiple meta-analyses; antecedent and reinforcement components identified as active ingredients. |
| Sleep routine | parent | A/B | RCT evidence for brief behavioural sleep intervention in children with ADHD; parent-reported outcomes. |
| School guidance and daily report card | parent | A | Classroom behavioural interventions have consistent support; the app only explains and helps the parent ask. |
| Under-6 guidance | parent | B | Guideline-derived; no scoring. |
| Parent psychoeducation | parent | A/B | Component of most parent-training programmes, though higher doses of psychoeducation alone are associated with weaker parental outcomes. |

## Citations to verify before publication

- Daley D, et al. Behavioral interventions in attention-deficit/hyperactivity disorder: a meta-analysis of randomized controlled trials across multiple outcome domains. *Journal of the American Academy of Child and Adolescent Psychiatry*, 2014.
- Sonuga-Barke EJS, et al. Nonpharmacological interventions for ADHD: systematic review and meta-analyses of randomized controlled trials of dietary and psychological treatments. *American Journal of Psychiatry*, 2013.
- Dekkers TJ, et al. Meta-analysis: which components of parent training work for children with attention-deficit/hyperactivity disorder? *Journal of the American Academy of Child and Adolescent Psychiatry*, 2022. PMID 34224837
- Doffer DPA, et al. Sustained improvements by behavioural parent training for children with attention-deficit/hyperactivity disorder: a meta-analytic review of longer-term child and parental outcomes. *JCPP Advances*, 2023. PMC10501699
- Hiscock H, et al. Impact of a behavioural sleep intervention on symptoms and sleep in children with ADHD, and parental mental health: randomised controlled trial. *BMJ*, 2015.
- Wolraich ML, et al. Psychometric properties of the Vanderbilt ADHD Diagnostic Parent Rating Scale in a referred population. *Journal of Pediatric Psychology*, 2003.
- NICE guideline NG87: Attention deficit hyperactivity disorder: diagnosis and management. 2018, updated 2019. (Parent-training recommendations for children under 5 and as adjunct for older children.)
- Fabiano GA, et al. A meta-analysis of behavioral treatments for attention-deficit/hyperactivity disorder. *Clinical Psychology Review*, 2009.

## Open questions

- Should adolescents get their own space between Family and Adult, or is "Family tools with more autonomy" enough for a first version?
- Is a three-face daily check-in for the child worth the data question it raises, and who owns that data?
- Should the observation log allow a second parent or carer to add entries on a different device via encrypted export and merge, given that assessment values multiple informants?
- Where a country's public system uses a different first-line instrument, should the app offer it, or hold to one instrument for consistency?
