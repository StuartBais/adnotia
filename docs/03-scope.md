# Adnotia scope

Status: draft 0.1 · September 2026 · Companion to `01-module-contract.md` and `02-evidence-rubric.md`

## What Adnotia is

A free, open-source set of tools for adults with ADHD, and for parents and carers of children who may have it, built on interventions with published evidence and honest about how strong that evidence is. Everything runs in the browser. Nothing is sent anywhere. There are no accounts, no analytics, no advertising and no paid tier.

It is a helper. It records, structures and reflects what a person reports about their own life, and it makes that easier to use: by them, and where they choose, by the people who treat them.

## What Adnotia is not

- Not a diagnostic tool. It never tells anyone they have or do not have ADHD.
- Not a prescriber. It never tells anyone to start, stop, raise, lower, skip or time a medication.
- Not a medical device. Its outputs are descriptive records of self-report, not clinical measurements.
- Not a crisis service. It links to help; it is not help.
- Not a substitute for therapy, coaching or a clinician.
- Not something a child uses alone. Children reach it only through the Family space, on a surface a parent hands over. See `04-family-space.md`.

## Two spaces

Adnotia has an **Adult space**, which is a person's own, and a **Family space**, which belongs to a parent or carer and holds one or more child profiles. They share the kernel and nothing else. The Family space has its own scope document, `04-family-space.md`, and everything in this document applies there as well.

## The home screen is not the medication log

Most adults with ADHD are not on medication at any given time, and many never will be. The medication log is one tool among several, off by default, and enabled only when a person says they are currently taking medication for ADHD.

First run asks one question: *what would you like help with?* The first choice is whether this is for you or for a child you care for. The options that follow are the enabled-able modules for that space, with their tier wording. The home screen is then built from the person's choices. Someone who picks planning and sleep never sees a dose field, a side-effect chip or a clinical report.

## The medication log, specifically

### Purpose

To help people bring clear, structured self-report to their prescriber, so that decisions about starting, adjusting or stopping medication rest on a fortnight of recorded days rather than a few minutes of recollection in a consulting room.

The intended effect is fewer people over-prescribed because a rough patch was remembered as worse than it was, and fewer people under-prescribed because a good week was remembered as fine when the record shows the dose wearing off at two in the afternoon. That is the aim. It is not a guarantee, and the app never claims it as one.

### How it stays on the right side of the line

- **It describes.** Every report section states what was recorded. None of them reach a conclusion about the dose. The words *should*, *increase*, *decrease*, *recommend* and their equivalents do not appear in anything addressed to a clinician.
- **The clinician judges.** The report presents the four things prescribers weigh, efficacy, duration, tolerability and adherence, side by side, and stops. The prescriber weighs them. That is their job and the app does not pretend to do it.
- **It shows its own weaknesses.** The report states how many days were logged out of how many, how many entries were written the same day versus filled in later, and whether ratings varied or sat flat. The person sees this section before the clinician does.
- **Nothing is hidden from the person.** Anything shown to a clinician is shown to the person first, in the same words. There is no concealed scoring, no credibility flag, no "patient may be drug-seeking" logic in any form. See the note on covert assessment below.
- **Reflection is private.** The "before you go" notes that point out flat ratings or heavy side-effect load are for the person, on screen only, never printed and never shared.

### Why there is no covert assessment

The app was, at one point, asked to include hidden checks that would signal to a clinician whether a person seemed to be seeking a higher dose than they needed. This was considered and rejected, and the reasoning is recorded here so it is not re-litigated by accident.

There is no validated set of items that distinguishes drug-seeking from under-treatment in ADHD. Home-made versions detect inconsistency, poor recall and day-to-day variability, which are ADHD symptoms, so they would fire hardest on the people whose need is greatest. A false positive in a controlled-substance context costs someone access to treatment and marks their record. And a document known to contain hidden scoring is a document no clinician can trust, including the parts that are just arithmetic on timestamps.

The honest replacement is transparent record quality, shown to both parties, plus private reflection for the person. Both exist. Nothing else in this space will be added.

## Hard exclusions

Adnotia never:

1. Recommends, calculates, suggests or adjusts a dose or a dose time.
2. Checks drug interactions or gives information about combining substances.
3. Tells a person whether to take a dose today.
4. Diagnoses, scores toward a diagnosis, or tells a person they "likely have" a condition.
5. Scores, flags or characterises a person's credibility, motives or honesty, visibly or invisibly.
6. Sends data off the device, including "anonymised" or "aggregated" data.
7. Shows advertising or sponsored content.
8. Charges for anything or gates anything behind payment.
9. Uses streaks, badges, points, or notifications designed to shame.
10. Tracks a child's medication, in any form, or collects self-report screening from a child or adolescent. Children's tools exist only in the Family space and are parent-mediated; see `04-family-space.md` for that space's own exclusions.
11. Presents Tier B or Tier C material using the phrase "evidence-based".
12. Ships a module, article or tool from the exclusion list in `02-evidence-rubric.md`.

Adding anything to this list requires a change to this document. Removing anything from it requires a very good reason, written down.

## Screening

Adnotia includes two screening instruments, one per space, both validated, both presented under the rules below. **Neither is free to reproduce.** Both are copyrighted and redistributing either as part of this source needs written permission from the rights holder; see `decisions/ADR-023-the-screeners-are-not-ours-to-reproduce.md`. Until that permission exists the app ships the presentation rules and no instrument. The Adult space uses the ASRS-5, the WHO Adult ADHD Self-Report Screening Scale for DSM-5 (Ustün et al., 2017). It replaced ASRS v1.1 Part A, which was named here first and is written against DSM-IV; see `decisions/ADR-022-asrs-5-replaces-asrs-v1-1.md`. The Family space uses the NICHQ Vanderbilt parent form, described in `04-family-space.md`. This section describes the adult instrument; the rules apply to both. It is validated, free, and its stated purpose is to indicate whether a formal assessment is worth seeking. Refusing to include any screener would push people toward the unvalidated quizzes that fill the space.

Presentation rules, all of which are mandatory:

- It lives in the Library, never in the daily check-in and never on the home screen.
- It uses the WHO's own item wording and scoring threshold, unmodified.
- The only outcome it reports is whether the responses are or are not consistent with seeking a formal assessment. It never says "you have ADHD", "you probably have ADHD", or any percentage.
- It is followed by plain information on how to seek an assessment, with the note that routes differ by country and by whether care is public or private.
- The result is not stored as a diagnosis, is not shown in any clinical report, and is not read by any other module.
- The adult instrument is for adults and says so. Nobody under 18 is offered it; parents concerned about a child are pointed to the Family space.

The obvious concern is that a screener and a medication log in the same app look like a pipeline to stimulants. The answer is structural: the screener points to a clinician, not to a prescription; the medication log only exists for people who say they are already being treated; and nothing connects the two. This paragraph should appear, in plainer words, in the Library entry for the screener.

## Safety and comorbidity

ADHD in adults commonly co-occurs with depression, anxiety and substance-use disorders, and adults with ADHD have elevated rates of self-harm. Adnotia is not a mental-health crisis tool and must not behave like one, but it must not be silent either.

- A static "if things are bad right now" page is reachable from every screen in two taps. It lists a small number of international crisis lines and the instruction to search for the local emergency number, states plainly that the app cannot help in a crisis, and nothing else.
- Because the app has no network access, this list is reviewed and updated with each release, and its review date is printed on the page.
- No module attempts to detect crisis, mood disorder or risk from the data. That is a diagnostic act and is excluded. The page is simply always available.
- The Family space has a parent-facing version of this page with child- and parent-specific resources. Nothing about it is shown on the child surface.

## Data and privacy commitments

These are promises the architecture enforces, not policies a future maintainer could quietly change.

- No server, no accounts, no analytics, no third-party requests of any kind. The kernel exposes no networking primitive to modules, so a module cannot violate this by accident.
- All data stays in the browser. An optional passcode encrypts it at rest with a key derived on the device.
- Backups are user-initiated, encrypted with a passphrase of the person's choosing, and restorable onto any copy of the app.
- The source is public under the AGPL-3.0, so the privacy claims are verifiable and closed forks with tracking are not permitted.
- Clearing browser data deletes everything. The app says so and nags about backups no more than once a fortnight, in plain language, without alarm.
- Storage is scoped to the origin the app is served from, so the origin is where the data is, not a deployment detail. Adnotia is served from a dedicated origin that hosts nothing else; a person who moves between origins, or who opens the single-file build from disk, starts empty and moves their data across by backup and restore. The About page says this plainly. See `decisions/ADR-009-hosting-and-edge-integrity.md`.

## Regulatory posture

Adnotia is designed to remain a general-wellbeing and self-record tool. The hard exclusions are what keep it there: software that records self-report is generally treated differently from software that influences treatment decisions. This document is not legal advice. Before public launch, the scope should be reviewed against the current position in the jurisdictions where it will be promoted, at minimum the UK, EU and US, and that review should be recorded here with its date. The Family space additionally needs review against codes for services likely to be used by children, such as the UK Age Appropriate Design Code, even though no data leaves the device.

### Review of September 2026

Reviewed against primary sources by the author, who is not a lawyer and not a regulatory consultant. This is a desk review that reads the guidance and applies it honestly to what the app actually does. It is not legal advice, it does not clear the app for launch, and its main purpose is to name precisely what a person with the relevant qualification should be asked. Where it finds a risk it says so rather than reasoning its way to the comfortable answer.

Sources read in full rather than in summary: MHRA, *Medical device stand-alone software including apps (including IVDMDs)* v1.10; Data Protection Act 2018 s.123 and the ICO's scope guidance for the Children's Code.

#### Is Adnotia a medical device? Probably not, and the reason it is close is worth knowing

The qualifying test is intended purpose, and the MHRA is explicit that this is set by the manufacturer: "A medical purpose is determined by what the manufacturer states in the device's labelling, instructions for use and any promotional materials," which it lists as adverts, the app store description and category, the landing page and social media.

Two things this rules out as defences before anything else.

Being free and open source is not one. The guidance includes "Freeware / open-source software" in what it covers, and notes that "The regulations apply to all methods of software distribution. It applies to products that have been 'placed on the market' rather than sold." Publishing under the AGPL and charging nothing changes nothing here.

Nor is the disclaimer at the top of this document, on its own: "General disclaimers (for example 'this product is not a medical device') are not acceptable if medical claims are made or implied elsewhere in the product labelling or associated promotional literature." The line "Not a medical device" in *What Adnotia is not* does work only so long as everything else — the Library, the landing page, the About page, the report itself — makes no medical claim. It is a summary of a position that has to be held everywhere, not a shield.

The limb Adnotia sits closest to is **monitoring**: "devices that monitor the progress or severity of disease, an injury or handicap". Under it, the guidance's list of things unlikely to be devices opens with a sentence that describes this app almost exactly:

> Apps and software that simply replace a written diary/log of symptoms that can be used when consulting with the patient's doctor. **However, the addition of features that enhance the data presented may bring it into the remit of the UK MDR 2002.**

The first sentence is what Adnotia is for. The second is the live risk, and it is not hypothetical, because the app does add features that enhance the data presented. Named honestly, in order of how much they enhance it:

1. **The 7-day rolling average of focus on the dose chart**, whose legend tells a clinician "read this, not the dots". That is not presentation of what was recorded; it is a derived series plus an instruction on how to weigh it. It is the single item in the app that most resembles what the guidance is warning about, and it is worth putting to a reviewer by name.
2. **The dose chart plotting focus ratings against dose over time.** Juxtaposing an intervention with an outcome invites an inference about the intervention. The app never draws that inference and the words *should*, *increase*, *decrease* and *recommend* are absent by rule — but the arrangement does some of the work.
3. **The severity grid and the coverage percentages.** These are arithmetic on what was entered — how many days, how many rated, how bad at worst. Closest to "stores or transmits medical data without change", which the guidance lists as a non-medical function.

Against that, the things that keep it on the right side are structural rather than cosmetic, and each is already a hard rule elsewhere in this document: no dose calculation of any kind; no conclusion about a dose; no diagnosis, prognosis or risk figure; no alarm or threshold that fires on the data; no link to a specific medicine's dosing; no screening instrument scored in the app; and nothing hidden from the person that is shown to a clinician. The guidance's "most likely to be a device" list is three items — linked to a specific medicine or device, intended to influence the actual treatment, or resulting in a diagnosis or prognosis — and the app is on none of them.

**Assessment:** on the guidance as written, Adnotia is the diary sentence rather than the enhancement caveat, and is not a medical device. The margin is not large, and it is smallest at the rolling average.

**What would change the answer:** adding a threshold that fires; adding any figure the person did not enter and cannot check; describing the report as showing whether a medication is working; adding a "compare your scores" feature; scoring a screening instrument in the app; or any promotional wording using the MHRA's indicative verbs — *detects*, *screens*, *predicts*, *measures*, *monitors your ADHD*.

**To put to a qualified person, by name:** the rolling average and its legend; whether the `clinical` report's name and its framing as a document for an appointment constitute an implied medical claim; and whether the EU position under MDR Rule 11 differs, given that a device under Rule 11 that informs decisions with therapeutic impact classifies higher than Class I and the qualification reasoning above would need to hold there too.

#### Data protection: UK GDPR and GDPR

The app processes no personal data on anybody's behalf but the person's own. There is no server, no account, no analytics and no third-party request; the kernel exposes no networking primitive, and `scripts/check-no-network.mjs` fails the build if one appears. Data written in the browser is held on the device under the origin's storage and never transmitted. On the face of it there is no controller and no processing to regulate.

The exception is the site that distributes the app. Serving `adnotia.com` involves processing IP addresses and request logs, which are personal data, and that processing has a controller whoever operates the origin. The privacy commitments in this document are about the app; the distribution site needs its own short, accurate statement, and it is the only place a data protection obligation actually attaches.

#### The UK Children's Code

Section 123 of the Data Protection Act 2018 applies the Code to information society services **that process personal data** and are likely to be accessed by children in the UK. Both limbs have to be met.

The app meets the second and not the first. It is plainly likely to be accessed by children — the Family space exists to hand a phone to one — and it processes no personal data on the provider's side. On a literal reading the Code's standards, which are obligations of a controller under the UK GDPR, have nothing to attach to.

That is a thin answer and `04-family-space.md` is right not to rest on it: "Regulatory codes for services likely to be used by children… apply in spirit even to an app with no server." The Code's substance — high privacy by default, no nudges, no profiling, data minimisation, no detrimental use of data — is the design already. The child surface collects no self-report, holds no state of its own, shows no adult module, has no way out except a passcode, and the one mechanic that could be an engagement loop is add-only, parent-driven and forbidden from acting on its own initiative.

Where the Code does bite literally is the distribution site, on the same reasoning as above: it processes personal data and is likely to be accessed by children. A standard-by-standard assessment of `adnotia.com` against the fifteen standards is a launch task, and it is a short one for a static site with no analytics.

#### United States

The FDA's position on general wellness and low-risk software, and the exclusions in section 520(o) of the FD&C Act as amended by the 21st Century Cures Act — which carve out certain software for maintaining or encouraging a healthy lifestyle, and software that serves as an electronic patient record — point the same way as the MHRA reasoning above, and for the same reasons. This was not read to primary source and is the weakest part of this review.

COPPA applies to operators that collect personal information from children under 13. Nothing is collected, maintained or transmitted, so there is no operator in the sense the rule uses.

#### What this review does not settle

It was done by the author, on the author's own product, which is the wrong person for the job even when the reading is careful. Nothing here has been checked by a lawyer or a regulatory consultant. The US section rests on secondary sources. And a desk review of guidance cannot substitute for the judgement of somebody who has taken a borderline product through an actual determination.

The four questions to put to that person are listed above by name rather than left as "review the regulatory position", so that the conversation starts at the hard parts.

## Tone

Every screen is written for someone who may be tired, distracted, ashamed of a gap in the record, or reading at one in the morning.

- Plain language. Short sentences. No jargon that a Library entry has not explained.
- Forgiving. A missing day is "a day missing", not "you forgot".
- Low friction. If a field is optional, it is hidden until wanted. If a value can be carried forward, it is.
- No exclamation marks, no cheerleading, no "great job".
- Honest about limits, including the app's own.

## Governance

- Changes to this document, the evidence rubric or the module contract are made by pull request with a written rationale, and are visible in history.
- A new module needs a manifest, a Library entry with citations, fixtures and a passing smoke test before review. The tier is assigned by someone other than the author.
- Anyone may file an evidence challenge. The default response to a credible challenge is to lower the tier pending resolution.
- If a maintainer wants to add something that conflicts with the hard exclusions, the answer is a fork, not an exception.
