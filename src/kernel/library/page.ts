// The Library.
//
// Every module's evidence entry, enabled or not, so a person can read why a tool
// exists before turning it on — and read why the things that are missing are
// missing. docs/02-evidence-rubric.md fixes the four parts an entry has and the
// words the tier is given; neither is ours to paraphrase.
//
// Nothing here ranks. A Tier C tool a person finds useful is not worse than a
// Tier A tool they do not use, so modules appear in the order the build lists
// them and no tier sorts above another.

import type { Citation, LibraryEntry, ModuleManifest } from '../registry/types';
import type { Space } from '../store/document';
import { card, el } from '../ui/index';
import { EXCLUSIONS, type Exclusion } from './exclusions';
import { tierWording } from './tiers';

export const LIBRARY_STRINGS = {
  title: 'The Library',
  sub: 'What each tool is for, what the evidence says, and what it will not do.',
  tiersProposed:
    'Every tier here is a proposal. The rubric requires that a tier is assigned by someone ' +
    'other than the person who wrote the module, and that has not happened yet.',
  unverified: 'These references have not been checked against the originals.',
  verified: (when: string) => `References checked against the originals in ${when}.`,
  reviewed: (reviewed: string, next: string) => `Reviewed ${reviewed}. Next review ${next}.`,
  whatItIs: 'What it is',
  evidence: 'What the evidence says',
  wontDo: 'What it will not do',
  references: 'References',
  exclusionsTitle: 'What is not here',
  exclusionsSub:
    'Things people ask about that this app does not include, and why. Each was considered.',
  whatWouldChangeIt: 'What would change this',
  noCitations: 'No reference is claimed for this. It is a scope decision, not an evidence one.',
} as const;

function part(heading: string, body: string): HTMLElement {
  return el('div', { class: 'lib-part' }, [el('h3', { text: heading }), el('p', { text: body })]);
}

/** A reference a person could actually look up, with its year in plain sight. */
function citation(source: Citation): HTMLElement {
  return el('li', {}, [
    el('span', { text: `${source.authors} (${source.year}). ${source.title}. ` }),
    el('i', { text: source.venue }),
    el('span', { text: `. ${source.doi_or_url}` }),
  ]);
}

function citations(sources: readonly Citation[], verified: string | undefined): HTMLElement {
  const children: (Node | string)[] = [el('h3', { text: LIBRARY_STRINGS.references })];

  if (sources.length === 0) {
    children.push(el('p', { class: 'hint', text: LIBRARY_STRINGS.noCitations }));
    return el('div', { class: 'lib-part' }, children);
  }

  const list = el('ul', { class: 'refs' });
  for (const source of sources) list.append(citation(source));
  children.push(list);

  // ADR-020: the absence is stated on the entry, not left to a design document.
  children.push(
    el('p', {
      class: verified === undefined ? 'sub warn' : 'hint',
      text:
        verified === undefined ? LIBRARY_STRINGS.unverified : LIBRARY_STRINGS.verified(verified),
    }),
  );
  return el('div', { class: 'lib-part' }, children);
}

export function moduleEntry(manifest: ModuleManifest, space: Space): HTMLElement {
  const entry: LibraryEntry = manifest.contributes.library;

  return card({
    title: manifest.name,
    children: [
      el('p', { class: 'tier', text: tierWording(entry.tier, space) }),
      part(LIBRARY_STRINGS.whatItIs, entry.whatItIs),
      part(LIBRARY_STRINGS.evidence, entry.whatTheEvidenceSays),
      // Never optional. docs/01-module-contract.md: an entry without it fails review.
      part(LIBRARY_STRINGS.wontDo, entry.whatItWontDo),
      citations(entry.citations, entry.citationsVerified),
      el('p', {
        class: 'hint',
        text: LIBRARY_STRINGS.reviewed(entry.reviewed, entry.nextReview),
      }),
    ],
  });
}

export function exclusionEntry(exclusion: Exclusion): HTMLElement {
  return card({
    title: exclusion.title,
    children: [
      part(LIBRARY_STRINGS.whatItIs, exclusion.whatItIs),
      part(LIBRARY_STRINGS.evidence, exclusion.why),
      part(LIBRARY_STRINGS.whatWouldChangeIt, exclusion.whatWouldChangeIt),
      citations(exclusion.citations, undefined),
    ],
  });
}

export interface LibraryOptions {
  /** Every module in the build, enabled or not. */
  modules: readonly ModuleManifest[];
  space: Space;
}

export function renderLibrary(options: LibraryOptions): HTMLElement {
  const root = el('div', { class: 'library' });

  root.append(
    card({
      title: LIBRARY_STRINGS.title,
      sub: LIBRARY_STRINGS.sub,
      children: [el('p', { class: 'sub warn', text: LIBRARY_STRINGS.tiersProposed })],
    }),
  );

  // Build order, not tier order. See the note at the top of this file.
  for (const manifest of options.modules) root.append(moduleEntry(manifest, options.space));

  root.append(card({ title: LIBRARY_STRINGS.exclusionsTitle, sub: LIBRARY_STRINGS.exclusionsSub }));
  for (const exclusion of EXCLUSIONS) root.append(exclusionEntry(exclusion));

  return root;
}
