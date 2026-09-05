// The tier, in the words the rubric fixes.
//
// docs/02-evidence-rubric.md: "The tier appears on the module card before the
// person enables it, in the in-app wording above, never as a bare letter." The
// wording is not ours to paraphrase, so it lives in one place and every surface
// reads it from here.
//
// Tiers are also never used to rank modules against each other in the interface.
// A Tier C tool a person finds useful is not worse than a Tier A tool they do
// not use, so nothing here sorts or scores.

import type { Space } from '../store/document';
import type { Tier } from '../registry/types';

export function tierWording(tier: Tier, space: Space): string {
  const population =
    space === 'family' ? 'children with ADHD and their parents' : 'adults with ADHD';
  switch (tier) {
    case 'A':
      return `Established. This is based on treatments with repeated trial evidence in ${population}.`;
    case 'B':
      return `Promising. There is trial evidence for this in ${population}, but the studies are small or have methodological weaknesses. Treat it as worth trying, not as proven.`;
    case 'C':
      return 'Plausible. This tool comes from techniques used in evidence-based treatment, but this specific tool has not itself been tested in trials. Some people find it useful.';
  }
}

/** The one-word name of the tier. Never shown without the wording above. */
export function tierName(tier: Tier): string {
  return { A: 'Established', B: 'Promising', C: 'Plausible' }[tier];
}

/**
 * docs/02-evidence-rubric.md reserves the phrase "evidence-based" for Tier A.
 * A test scans every Library entry against this.
 */
export const RESERVED_PHRASE = 'evidence-based';
