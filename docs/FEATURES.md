# Features: Adnotia

*10 features agreed on 25 November 2026*

---

## Overview

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| 1 | Adult Area Index and Today Record | must-have | medium |
| 2 | Medication, Sleep, Planning and Focus Tools | must-have | high |
| 3 | Clinician's Sheet and Assessment Preparation | must-have | medium |
| 4 | Evidence Library and Crisis Pages | must-have | medium |
| 5 | Family Space: Profiles, Observations, Routines and Star Chart | must-have | high |
| 6 | Private Storage, Encrypted Backup and Dual Builds | must-have | high |
| 7 | Full App Rebuild for Usability | must-have | high |
| 8 | Bookmark Edition Visual Design | should-have | medium |
| 9 | Human Review of Evidence and Content | must-have | medium |
| 10 | ADHD Screeners | nice-to-have | high |

---

## Feature details

### 1. Adult Area Index and Today Record

**Priority:** must-have · **Complexity:** medium

An index of areas (Focus and starting, Calm, Movement, Medication and body, Preparing for an appointment) plus a Today view written as the day's record. It combines a check-in built from the enabled tools with a record of what has already happened.

**Scope:** Area index navigation, a Today view assembled from the module registry and enabled modules, and a day-record data model reading from the storage domains. Built and passing its milestone gates.

_✓ Already built in the imported codebase_


### 2. Medication, Sleep, Planning and Focus Tools

**Priority:** must-have · **Complexity:** high

An opt-in medication log (dose, cover, side effects) with carry-forward, and a sleep log with computed duration that never overwrites typed answers. Planning tools cover task breakdown, time estimate, day plan, if-then prompts and a focus timer that keeps no counts. Three text-and-timer mindfulness practices with no audio and a light movement log with no targets or streaks round out the set.

**Scope:** Medication opt-in gate and carry-forward logic, sleep duration calculation, linked planning tools, timer without persistence of counts, mindfulness practices and movement log. All are modules registered in the kernel.

_✓ Already built in the imported codebase_


### 3. Clinician's Sheet and Assessment Preparation

**Priority:** must-have · **Complexity:** medium

A self-kept record report with letterhead, coverage line, day-by-day table and cover chart, available as print and text export. Includes a place to write down specific examples for assessments.

**Scope:** Report generation from records, print stylesheet, plain-text export, and an assessment examples editor. Built and gated.

_✓ Already built in the imported codebase_


### 4. Evidence Library and Crisis Pages

**Priority:** must-have · **Complexity:** medium

A Library with an evidence tier and citations for each module, plus entries explaining what was deliberately left out and why. Crisis resources are one tap from every screen, with a separate parent-facing crisis page.

**Scope:** Library content model with tiers and citations, excluded-item entries, a persistent crisis link in the app shell, and adult and parent crisis pages.

_✓ Already built in the imported codebase_


### 5. Family Space: Profiles, Observations, Routines and Star Chart

**Priority:** must-have · **Complexity:** high

Child profiles (nickname and age band only), dated home and school notes printed with a coverage line and no scoring, ordered routines with first-and-then prompts, and a parent-run star chart where stars are never lost. A passcode-locked child-facing screen and parent guidance pages are included. Medication fields are blocked by the registry.

**Scope:** Profile model, notes list and print view, routine and reward domains, locked child view, guidance content, and a registry rule that blocks medication fields in the family space.

_✓ Already built in the imported codebase_


### 6. Private Storage, Encrypted Backup and Dual Builds

**Priority:** must-have · **Complexity:** high

Local-only storage with an optional passcode that encrypts it, encrypted backup export with merge-restore, legacy single-file import, visible save failures with retry, and stale-tab protection. Ships as an installable PWA with a welcome page, and also as a single self-contained HTML file.

**Scope:** Encryption layer, backup and merge-restore with counts, schema 1→2 migration (tasks, routines, rewards, completions, reminders), vite-plugin-pwa build, vite-plugin-singlefile build, and a welcome page with real screenshots.

_✓ Already built in the imported codebase_


### 7. Full App Rebuild for Usability

**Priority:** must-have · **Complexity:** high

Rebuild the whole app so it feels less clunky, with simpler navigation, faster flows and a coherent experience across the adult and family spaces. It builds on the shared domains from the schema migration and keeps the privacy-first, no-network principles.

**Scope:** Usability review of current flows, a new navigation and interaction model, a rebuilt UI layer on the shared domains (tasks, routines, rewards, completions, reminders), and a data-compatible upgrade path. Existing vitest suites guard against regressions. Evaluate the phone-app approach from ADR-043 against an improved PWA.


### 8. Bookmark Edition Visual Design

**Priority:** should-have · **Complexity:** medium

A new charcoal and terracotta visual identity (ADR-045) applied across the whole app, so the interface looks calm and consistent.

**Scope:** Design tokens for color, type and spacing, component restyling, and contrast and accessibility checks. Verified in both the PWA and single-file builds, and delivered together with the rebuild.


### 9. Human Review of Evidence and Content

**Priority:** must-have · **Complexity:** medium

Independent confirmation of evidence tiers, citation checks, crisis number verification and clinician review of paediatric guidance. This is needed to finish launch readiness (milestone 8).

**Scope:** A review checklist and process, recruiting reviewers, recording sign-offs in the Library, correcting entries after review, and verifying crisis numbers by region. This is mostly non-code work with some content updates.


### 10. ADHD Screeners

**Priority:** nice-to-have · **Complexity:** high

Adult and other screeners, currently listed as not offered yet with reasons. They would be added only once licensing, evidence and safe framing are settled.

**Scope:** Review of screener licensing and validity, a results framing that avoids diagnostic claims, scoring logic kept local, Library entries for each screener, and a link into appointment preparation.


---

*Feature list agreed on 25 November 2026. Changes after this point are tracked in the Decisions Register.*