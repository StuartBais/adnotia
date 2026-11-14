# ADR-043: A phone app, rebuilt around shared domains

Status: accepted as direction · November 2026 · Supersedes ADR-003; amends
ADR-002, ADR-004, ADR-006, ADR-008 and ADR-039; will supersede ADR-009, ADR-028,
ADR-029, ADR-030, ADR-035, ADR-036, ADR-037 and ADR-040 when the documents that
replace them land

## Context

The first build was assembled quickly from documents written before any of it
existed, and the owner's verdict on the result is that the tools are clunky and
the look is generic. Both follow from decisions in those documents rather than
from how they were carried out.

- **The tools are forms.** `01-module-contract.md` has every module own one
  state slice, read no other, and build its interface from the kernel's seven
  primitives. So a task typed into the task breaker does not exist for the plan
  sheet or the timer, and a person re-enters it in each. A timer, a plan and a
  reward chart are all the same card with the same chips.
- **The look is a default.** System fonts, bordered cards on an off-white
  ground, pill chips and one narrow column. `07-design-system.md` codified it,
  and a change of palette did not make it anything else.
- **The browser is the wrong place for this data.** ADR-039 concluded that an
  extension with permission to read pages can read what the app stores, and that
  the app can say so but cannot detect or prevent it. For a record that includes
  medication and a child's behaviour, saying so is not enough.

Nothing has been released. `package.json` is at 0.0.0 and no person's data
exists in any format this build writes. As in ADR-042, the time to change
foundations is before somebody depends on them.

## Decision

The owner decided the following in November 2026. Each is settled; the detail
that follows from each is not, and is listed under "Not decided here".

1. **Adnotia becomes a phone app for iOS and Android, built together.** The
   browser version is withdrawn. The website becomes a page that says what the
   app is and links to the two store listings and to the source. The source
   stays public so that anybody can build and run it how they choose.
2. **The licence stays AGPL-3.0**, for the reason ADR-002 gives. Two things are
   added: a contributor agreement, so the owner can continue to distribute
   through stores whose terms differ from the AGPL's once other people
   contribute; and the rule that paid extensions are published as source like
   everything else, so that every line that ships can be read.
3. **Paid extensions are permitted, above the original scope only.** Hard
   exclusion 8 in `03-scope.md` ("charges for anything or gates anything behind
   payment") is replaced by three rules that are as hard as the one they
   replace:
   - everything in the scope as it stood in September 2026 stays free, for good;
   - backup, export and the clinician's report are never behind payment;
   - payment goes through the store's own purchase system, with no account and
     no server belonging to Adnotia.
4. **"No network, ever" becomes "your data never leaves the device".** A store
   purchase is a conversation between the operating system and the store. The
   app's own code still makes no request and still has no way to send a
   person's data anywhere, and that is still enforced rather than promised.
5. **Tools must be evidence-led, and may also be tools that many people with
   ADHD say help them.** The rubric gains a fourth tier for the second kind,
   worded so that nobody could mistake it for trial evidence. The exclusion list
   is untouched: something tested and found not to work is not built because it
   is popular.
6. **Shared domains replace isolated modules.** A person enters a thing once.
   Tasks are one list, and breaking a task down, planning a day, and timing a
   piece of work all act on that list. There will be more domains than the
   current modules, and domains may link to each other where a person would
   expect them to.
7. **Medication is its own section, linked to nothing.** No other tool reads
   it, and it reads no other tool.
8. **The Family space stays and is reworked**, and it is to serve a person who
   uses the app both for themselves and for their children better than two
   sealed spaces do.
9. **The design is rebuilt from research** into what adults with ADHD find
   usable and want to use, rather than restyled.
10. **What is kept from the first build:** encryption, backup and restore, the
    store, date arithmetic, the report engine, and their tests. **What is not:**
    the shell, the interface primitives, the module contract for tools, and the
    design system.

## What this lifts, and what it does not

Lifted, because each one stops the tools being good:

- a module owns exactly one slice and reads no other without a declared
  dependency (`CLAUDE.md` hard rule 6);
- modules do not build their own controls;
- no font files;
- the fixed navigation of Tools, Today, Records, Library;
- the two build outputs of ADR-003.

Not lifted, and nothing here should be read as loosening them:

- describe, never prescribe, in anything a clinician reads;
- no covert assessment (ADR-005);
- no medication in the Family space, and no self-report screening from a child;
- no advertising, no analytics, no account;
- no diagnosis, and no dose, timing or interaction advice;
- the exclusion list in `02-evidence-rubric.md`;
- every tool carries a visible tier and a Library entry, and a tier is assigned
  by somebody other than the tool's author.

**No guilt mechanics** stays as written until the research reports on it. What
people with ADHD say about rewards, streaks and gentle restarts is one of the
questions being asked, and if the rule changes it will change in the document
that replaces `03-scope.md`, with the finding beside it.

## Not decided here

- The list of domains and how they link.
- The name and exact wording of the fourth tier.
- How the Family space and a person's own tools are joined.
- The new design system.
- How the phone apps are built. The kernel is TypeScript with a storage adapter
  interface, which favours wrapping it over rewriting it twice, but that is a
  dependency decision and gets its own ADR.
- What the medication report does about sleep. Today the kernel draws sleep on
  the cover chart from the sleep module; under decision 7 it cannot.
- What happens to `adnotia.com` between now and the first store release.

## Consequences

- `03-scope.md`, `01-module-contract.md`, `05-architecture.md`,
  `07-design-system.md` and `08-roadmap.md` no longer describe what is being
  built. They stay as written, as the record of the first build, until a product
  brief replaces them. Until then this ADR wins where they disagree.
- The research behind the brief is kept in the repository, with its sources, so
  that a design rule can be traced to the finding it rests on.
- The regulatory review in `03-scope.md` has to be redone for a store listing.
  A store category and description are promotional material in the MHRA's sense,
  and a listing under "Medical" would say something the app must not.
- Two stores means two developer accounts, two reviews per release, and a
  second kind of reviewer reading the privacy claims.
- `LICENSE` is still a placeholder that says to replace it with the full text
  before the first public commit. That is now overdue.
- Everything on the roadmap's "Next steps, as options" list is overtaken except
  the review packets, which are about the evidence and remain wanted.
