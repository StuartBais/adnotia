# ADR-012: How a module tells the report frame what it cannot know

Status: accepted · September 2026 · Extends `01-module-contract.md` "reports"

## Context

`01-module-contract.md` gives the kernel the report's header, its footer and its
print and text export, and gives modules only the sections in between. The reason
is trust: a prescriber has to be able to read the framing of a record without
wondering which module wrote it.

Porting the monolith's report showed that three phrases in that kernel-owned
frame cannot be computed by the kernel.

- The header names what the record is about. In the monolith that is the
  medication, in bold, before the dates. The kernel must not know that a
  prescription has a name; `03-scope.md` and the reserved-field rule exist
  precisely to stop that knowledge leaking into shared code.
- The header ends with how many days had a missed or skipped dose. Adherence is
  a medication concept.
- "About this record" ends with the range the focus rating moved across, which is
  a statement about how the record was kept rather than what it says — so it
  belongs in the footer — but focus lives in a module slice.

Three options were considered.

1. **Teach the kernel about medication.** Rejected. It is the exact coupling the
   scope document is built to prevent, and it would leave a build without the
   medication module carrying dead concepts.
2. **Move the phrases into sections.** Rejected. They would then appear in the
   middle of the report rather than in the header and the record-quality note,
   which is where a clinician looks for them, and the frame would lose the one
   job it has.
3. **Let a section offer the phrases, and let the frame decide.** Accepted.

## Decision

`ReportSection` gains one optional method:

```ts
frame?: (context: unknown) => {
  subject?: string;   // what the record is about, for the header
  header?: string;    // a clause appended to the coverage line
  quality?: string;   // a sentence for "About this record"
};
```

- The engine calls `frame` on every section of the report, in weight order,
  **whether or not `when` includes that section**. The header still has to name
  the record over a range too thin to draw a section from.
- The first non-empty `subject` wins. `header` and `quality` accumulate in weight
  order.
- The frame works with none of them. A report built from modules that offer
  nothing prints a header with the dates and the coverage, and a record-quality
  note with the timing sentences, and reads correctly.

A section may offer a phrase. It may not decide where the phrase goes, whether it
appears, or what surrounds it. That stays with the kernel.

## Consequences

- The kernel keeps no medication vocabulary. `src/kernel/reports/` does not
  contain the words dose, adherence or focus.
- The rules for clinical sections apply to `frame` unchanged: it describes, it
  reaches no conclusion, and everything it produces is shown to the person in the
  same words, because the person reads the same header.
- A module could use `subject` to put wording in front of a clinician that the
  section rules would otherwise catch. The smoke test that scans clinical
  sections for *should*, *increase*, *decrease* and the rest scans `frame` output
  too.
- If a second module ever offers a `subject`, the lower weight wins silently.
  That is deliberate: reports have one subject, and the alternative is a header
  that grows a list.

## Also decided here

The kernel's clinical report is titled **"Daily record"**. The monolith called it
"ADHD medication log", which the kernel cannot say: the same report is produced
for someone logging only sleep. The subject line beneath carries the medication
name when there is one.

**This title is clinician-facing wording and has not been reviewed by a human.**
`CLAUDE.md` puts such wording on the stop-and-ask list; it is flagged here rather
than assumed settled.
