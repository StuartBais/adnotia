import { describe, expect, it } from 'vitest';
import { EXCLUSIONS, GUIDANCE, MODULES, type Citation } from '../../src/kernel/index';

// The citation pass of September 2026. See docs/02-evidence-rubric.md for what
// it did and, more importantly, what it did not.
//
// Every reference in the build was resolved against Crossref or PubMed. Three
// were wrong, and one of the three was wrong in the way that matters most: the
// DOI given for Safren's ADHD trial resolved to a paper about anxiety in primary
// care. Nothing in the repository could have caught it, because a DOI that is
// well-formed and belongs to a real paper looks exactly like a correct one.
//
// These tests cannot check a reference against the world — that needs a network
// and the app has none by design. They hold the things that are checkable from
// inside: that identifiers are shaped like identifiers, and that the same work
// cited twice is described the same way both times. The second is what would
// have caught the NICE year drifting between 2018 and 2019 in the same build.

interface Sourced {
  where: string;
  citation: Citation;
}

function everyCitation(): Sourced[] {
  const found: Sourced[] = [];
  for (const manifest of MODULES) {
    for (const citation of manifest.contributes.library.citations) {
      found.push({ where: `module ${manifest.id}`, citation });
    }
  }
  for (const exclusion of EXCLUSIONS) {
    for (const citation of exclusion.citations) {
      found.push({ where: `exclusion "${exclusion.title}"`, citation });
    }
  }
  for (const entry of GUIDANCE) {
    for (const citation of entry.citations) {
      found.push({ where: `guidance "${entry.title}"`, citation });
    }
  }
  return found;
}

const ALL = everyCitation();

describe('every citation in the build', () => {
  it('there are some, or none of this means anything', () => {
    expect(ALL.length).toBeGreaterThan(20);
  });

  it('carries an identifier a reader can actually resolve', () => {
    // One of four shapes, and nothing else. A bare title is not a citation: it
    // is a thing the reader has to go and find, which is the work we are meant
    // to have done for them.
    const SHAPES = [
      /^(doi:)?10\.\d{4,9}\/\S+$/, // a DOI, with or without the prefix
      /^PMID \d{7,8}$/,
      /^PMC\d{6,8}$/,
      /^https:\/\/\S+$/,
    ];
    const unresolvable = ALL.filter(
      (entry) => !SHAPES.some((shape) => shape.test(entry.citation.doi_or_url)),
    ).map((entry) => `${entry.where}: ${entry.citation.doi_or_url}`);
    expect(unresolvable).toEqual([]);
  });

  it('gives a year that could be a year', () => {
    for (const entry of ALL) {
      expect(entry.citation.year, entry.where).toBeGreaterThan(1980);
      expect(entry.citation.year, entry.where).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });

  it('names authors and a venue rather than leaving either blank', () => {
    for (const entry of ALL) {
      expect(entry.citation.authors.length, entry.where).toBeGreaterThan(4);
      expect(entry.citation.venue.length, entry.where).toBeGreaterThan(3);
      expect(entry.citation.title.length, entry.where).toBeGreaterThan(15);
    }
  });
});

describe('the same work, cited twice', () => {
  /** Everything keyed by its identifier, normalised so `doi:` does not split one. */
  function grouped(): Map<string, Sourced[]> {
    const map = new Map<string, Sourced[]>();
    for (const entry of ALL) {
      const key = entry.citation.doi_or_url.replace(/^doi:/, '').toLowerCase();
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }

  it('is described identically wherever it appears', () => {
    // Six works are cited by more than one module, and each is written out again
    // where it is used. That is fine — modules own their entries — but two
    // copies that disagree mean at least one is wrong, and the reader has no way
    // to tell which.
    const shared = [...grouped().values()].filter((group) => group.length > 1);
    expect(shared.length).toBeGreaterThan(2);

    const disagreements: string[] = [];
    for (const group of shared) {
      const first = group[0] as Sourced;
      for (const other of group.slice(1)) {
        for (const field of ['title', 'authors', 'year', 'venue'] as const) {
          if (first.citation[field] !== other.citation[field]) {
            disagreements.push(
              `${first.citation.doi_or_url} — ${field}: ` +
                `${first.where} says ${JSON.stringify(first.citation[field])}, ` +
                `${other.where} says ${JSON.stringify(other.citation[field])}`,
            );
          }
        }
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('does not appear under two different identifiers', () => {
    // The other direction: one work with two DOIs is the same bug wearing a
    // different hat, and it hides from the check above.
    const byTitle = new Map<string, Set<string>>();
    for (const entry of ALL) {
      const key = entry.citation.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      byTitle.set(
        key,
        (byTitle.get(key) ?? new Set()).add(entry.citation.doi_or_url.replace(/^doi:/, '')),
      );
    }
    const split = [...byTitle.entries()]
      .filter(([, ids]) => ids.size > 1)
      .map(([title, ids]) => `${title.slice(0, 50)}: ${[...ids].join(' vs ')}`);
    expect(split).toEqual([]);
  });
});
