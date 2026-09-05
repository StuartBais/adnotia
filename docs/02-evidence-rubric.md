# Adnotia evidence rubric

Status: draft 0.1 · September 2026 · Companion to `01-module-contract.md` and `03-scope.md`

## Why tiers

Almost every ADHD app presents every feature with equal confidence. Some of what they sell has good trial evidence, some has none, and some has been tested and found not to work. The person using the app cannot tell which is which.

Adnotia's answer is to attach a tier to every module and show it. The tier is a first-class field in the module manifest, it appears in the Library entry, and it is displayed where the person decides whether to turn the module on. It is an explicit, contestable claim rather than an implicit editorial choice. Getting a tier wrong is a bug and should be filed as one.

Tiers are assessed **within the space they apply to**. Adult-space modules are tiered on evidence in adults with ADHD; Family-space modules on evidence in children, adolescents and their parents. Evidence does not transfer between them: a technique with strong support in eight-year-olds earns nothing in the Adult space, and vice versa. Family-space tier assignments live in `04-family-space.md`.

## The tiers

### Tier A — established

**Criterion.** Either (a) the intervention has at least two randomised controlled trials in the relevant population (adults with ADHD for the Adult space; children or adolescents with ADHD and their parents for the Family space), or a meta-analysis of them, showing an effect on core symptoms or functional impairment, with risk of bias no worse than moderate; or (b) the module does not deliver an intervention itself but directly supports one that meets (a), by recording, structuring or communicating information a clinician uses.

**In-app wording.** "Established. This is based on treatments with repeated trial evidence in adults with ADHD." (Family space: "…in children with ADHD and their parents.")

**Examples.** Medication log (supports pharmacological treatment, which has the strongest evidence base of any ADHD intervention). Planning and organisation tools derived from published CBT protocols for adult ADHD. Structured psychoeducation.

### Tier B — promising

**Criterion.** Trial evidence exists in the relevant population but is limited: few trials, small samples, high risk of bias, inconsistent findings, or low confidence ratings in systematic reviews. Or: strong evidence in the general adult population for the problem addressed (for example insomnia) with a credible rationale for ADHD but limited direct testing.

**In-app wording.** "Promising. There is trial evidence for this in adults with ADHD, but the studies are small or have methodological weaknesses. Treat it as worth trying, not as proven." (Family space: substitute the relevant population.)

**Examples.** Mindfulness-based approaches. Sleep tracking and sleep-hygiene structure. Exercise prompts.

### Tier C — plausible

**Criterion.** No direct trial evidence in the relevant population, but the tool is a straightforward implementation of a technique used inside a Tier A protocol, or follows directly from well-established findings about ADHD (for example, that externalising time reduces time-blindness). The mechanism is credible; the specific tool is untested.

**In-app wording.** "Plausible. This tool comes from techniques used in evidence-based treatment, but this specific tool has not itself been tested in trials. Some people find it useful."

**Examples.** Visual timers. Body-doubling or "start with me" sessions. Task-breaking templates. Implementation-intention prompts ("if it's 8am, then I take the tablet").

### Excluded

**Criterion.** Any of: properly blinded trials show no meaningful effect; the intervention has shown harm; the claim is not falsifiable; or the tool would function as a diagnostic, prescribing or treatment-adjusting instrument (see `03-scope.md`).

Excluded things do not get a module. They get an entry in the Library explaining why they are absent, because people will ask.

## Tier assignment for the proposed first Adult-space modules

Family-space assignments are in `04-family-space.md`.

| Module | Proposed tier | Reasoning |
|---|---|---|
| Medication log | A (supporting) | Supports pharmacological treatment, the best-evidenced ADHD intervention. The module records; the treatment is the evidence base. |
| Planning and organisation | A | Derived from CBT protocols with RCT support in adults (Safren; Solanto). A 2025 network meta-analysis of 37 RCTs found CBT the most effective non-pharmacological intervention on core symptoms, short and long term. |
| Psychoeducation (the Library itself) | A/B | Structured psychoeducation has RCT support in adults; the tier of any individual Library article follows the evidence for that article's topic. |
| Sleep | B | Sleep problems in ADHD are well documented and CBT-I is strongly evidenced in the general population; direct ADHD trials are fewer. |
| Mindfulness | B | Mindfulness-based cognitive therapy ranked second in the 2025 network meta-analysis, but the same review rated confidence in most non-pharmacological evidence as low or very low, with roughly half of included trials at high risk of bias. A 2025 meta-analysis of MBIs in adults reached similar conclusions. |
| Exercise | B | Acute and modest effects on attention reported; heterogeneous studies. |
| Focus timers, body doubling | C | Widely used; mechanistically sensible (externalised time, reduced initiation cost); no direct trials. |
| ASRS screener | Not a treatment; handled under `03-scope.md` as a validated instrument with strict presentation rules. Does not receive a tier. The Family space's Vanderbilt screener is treated the same way. |

Anyone may challenge a tier by filing an issue with a citation. The default response to a credible challenge is to lower the tier until it is resolved, not to keep it.

## The exclusion list

These are the things Adnotia will not build, and why. Each gets a short Library entry.

**Computerised cognitive training, including working-memory training.** A 2023 meta-analysis of 36 randomised trials found that when outcomes were probably blinded, training had no effect on total ADHD symptoms or on hyperactivity/impulsivity; clinical effects were limited to small, short-term, setting-specific effects on inattention. An earlier meta-analysis of executive-function and attention training found no transfer to academic or behavioural outcomes and identified significant illusory rater effects, meaning unblinded raters saw improvement that blinded raters did not. Training improves the trained task. It does not improve ADHD. This is the single most common thing paid ADHD apps sell.

**Neurofeedback.** Excluded on the same principle: effects in blinded, sham-controlled trials have been small or absent, and the equipment and time cost are large. If well-controlled evidence changes, revisit.

**Elimination diets and supplements as treatment.** Small or null effects in adults, high heterogeneity, and a market full of overclaiming. Adnotia may mention in the Library that a modest omega-3 effect has been reported, and stop there.

**"Brain type" or "ADHD type" quizzes.** Not validated, not falsifiable, and they compete with the one instrument that is (the ASRS, which is handled separately).

**Anything claiming to "rewire", "retrain" or "cure".** Unfalsifiable by construction.

**Any tool that recommends, calculates or adjusts a dose.** Scope, not evidence; see `03-scope.md`.

**A note on reward charts.** Engagement mechanics are banned across the app. A parent-configured, positive-only reward chart in the Family space is not an engagement mechanic; it is a behavioural-parent-training technique with an evidence base, run by the parent, never by the app. The distinction is: the app never awards, removes or reminds about points on its own initiative. See `04-family-space.md`.

## Presenting tiers to the person

- The tier appears on the module card before the person enables it, in the in-app wording above, never as a bare letter.
- The Library entry always has four parts: what it is, what the evidence says, what it will not do, and citations with dates.
- Tiers are never used to rank modules against each other in the interface. A Tier C tool a person finds useful is not "worse" than a Tier A tool they do not use.
- "Evidence-based" as a phrase is reserved for Tier A. Tier B and C copy uses "promising" and "plausible" respectively.

## Review process

- Every Library entry carries `reviewed` and `nextReview` dates. Twelve months is the default interval; six for Tier B where the literature is moving.
- A review checks for new systematic reviews or network meta-analyses first, then individual RCTs.
- Tier changes are recorded in a changelog in the entry itself, so a person can see that something moved from B to A and why.
- The person who proposes a module is not the person who assigns its tier.

## Citations to verify before publication

These are the sources this rubric currently rests on. Each must be checked against the original before any of this ships, and the Library entries should quote effect sizes and confidence ratings from the papers, not from this document.

- Yang X, Zhang L, Yu J, Wang M. Short-term and long-term effect of non-pharmacotherapy for adults with ADHD: a systematic review and network meta-analysis. *Frontiers in Psychiatry*, 2025. doi:10.3389/fpsyt.2025.1516878
- Kim HH, Jung NH. Mindfulness-based interventions for adults with ADHD: a systematic review and meta-analysis. *Medicine*, 2025. doi:10.1097/MD.0000000000044308
- Nimmo-Smith V, et al. Non-pharmacological interventions for adult ADHD: a systematic review. *Psychological Medicine*, 2020. PMID 32036811
- Westwood SJ, et al. Computerized cognitive training in attention-deficit/hyperactivity disorder (ADHD): a meta-analysis of randomized controlled trials with blinded and objective outcomes. *Molecular Psychiatry*, 2023. PMC10208955
- Rapport MD, et al. Do programs designed to train working memory, other executive functions, and attention benefit children with ADHD? A meta-analytic review. *Clinical Psychology Review*, 2013.
- Safren SA, et al. Cognitive behavioral therapy vs relaxation with educational support for medication-treated adults with ADHD and persistent symptoms. *JAMA*, 2010.
- Solanto MV, et al. Efficacy of meta-cognitive therapy for adult ADHD. *American Journal of Psychiatry*, 2010.
- Cortese S, et al. Comparative efficacy and tolerability of medications for ADHD in children, adolescents, and adults: a systematic review and network meta-analysis. *Lancet Psychiatry*, 2018.
- Ustün B, Adler LA, Rudin C, Faraone SV, Lane MJ, Kessler RC, et al. The World Health Organization Adult Attention-Deficit/Hyperactivity Disorder Self-Report Screening Scale for DSM-5. *JAMA Psychiatry*, 2017. PMC5470397. (The instrument the Adult space uses; the scoring table is what `decisions/ADR-021` is waiting on.)
- Kessler RC, et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS). *Psychological Medicine*, 2005. (The origin of the ASRS family, and the reference behind the exclusion entry for "type" quizzes.)
- NICE guideline NG87: Attention deficit hyperactivity disorder: diagnosis and management. 2018, updated 2019.

Anything not on this list that appears in a Library entry needs its own citation. "Studies show" without a reference fails review.
