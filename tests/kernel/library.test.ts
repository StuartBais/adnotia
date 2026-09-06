import { describe, expect, it } from 'vitest';
import {
  EXCLUSIONS,
  LIBRARY_STRINGS,
  MODULES,
  RESERVED_PHRASE,
  moduleEntry,
  renderLibrary,
  tierWording,
  type ModuleManifest,
} from '../../src/kernel/index';

// The Library. See docs/02-evidence-rubric.md "Presenting tiers to the person"
// and docs/decisions/ADR-020-unverified-citations-are-visible.md.

const text = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

/**
 * The manifest's tier and the Library entry's tier are two fields, and the
 * registry rejects a manifest where they disagree — so a fixture must set both
 * or it is testing something that could never ship.
 */
function entryWith(over: Partial<ModuleManifest['contributes']['library']>): ModuleManifest {
  return {
    id: 'demo',
    name: 'Demo',
    version: 1,
    tier: over.tier ?? 'A',
    audience: 'adult',
    area: 'focus',
    summary: 's',
    contributes: {
      library: {
        tier: 'A',
        whatItIs: 'What it is.',
        whatTheEvidenceSays: 'What the evidence says.',
        whatItWontDo: 'What it will not do.',
        citations: [
          {
            title: 'A paper',
            authors: 'Someone',
            year: 2020,
            venue: 'A journal',
            doi_or_url: 'doi:x',
          },
        ],
        reviewed: '2026-09',
        nextReview: '2027-09',
        ...over,
      },
    },
  };
}

describe('the tier, in the words the rubric fixes', () => {
  it('never shows a bare letter', () => {
    const rendered = text(moduleEntry(entryWith({}), 'adult'));
    expect(rendered).toContain('Established.');
    expect(rendered).not.toMatch(/\bTier [ABC]\b/);
  });

  it('says which population the evidence is in, and changes it by space', () => {
    expect(tierWording('A', 'adult')).toContain('adults with ADHD');
    expect(tierWording('A', 'family')).toContain('children with ADHD and their parents');
  });

  it('reserves "evidence-based" for Tier A', () => {
    // docs/02-evidence-rubric.md: B and C say promising and plausible instead.
    expect(tierWording('B', 'adult').toLowerCase()).not.toContain(RESERVED_PHRASE);
    expect(tierWording('C', 'adult')).toContain('Plausible.');
    // Tier C names the phrase only to describe where the technique came from.
    expect(tierWording('C', 'adult')).toContain('techniques used in evidence-based treatment');
  });

  it('does not rank one module against another', () => {
    // Build order, not tier order, and the two must differ here or the test
    // cannot tell them apart: a Tier C module is listed before a Tier A one.
    const plausible = { ...entryWith({ tier: 'C' }), id: 'plausible', name: 'Plausible thing' };
    const established = {
      ...entryWith({ tier: 'A' }),
      id: 'established',
      name: 'Established thing',
    };
    const rendered = renderLibrary({ modules: [plausible, established], space: 'adult' });

    const order = [...rendered.querySelectorAll('.card > h2')].map((h) => h.textContent).slice(1);
    expect(order.slice(0, 2)).toEqual(['Plausible thing', 'Established thing']);
    expect(text(rendered)).not.toMatch(/\b(best|better than|ranked|strongest tool)\b/i);
  });
});

describe('an entry', () => {
  it('has the four parts the rubric requires', () => {
    const rendered = text(moduleEntry(entryWith({}), 'adult'));
    for (const heading of [
      LIBRARY_STRINGS.whatItIs,
      LIBRARY_STRINGS.evidence,
      LIBRARY_STRINGS.wontDo,
      LIBRARY_STRINGS.references,
    ]) {
      expect(rendered).toContain(heading);
    }
  });

  it('shows its review dates', () => {
    expect(text(moduleEntry(entryWith({}), 'adult'))).toContain(
      'Reviewed 2026-09. Next review 2027-09.',
    );
  });

  it('prints a reference a person could look up', () => {
    const rendered = text(moduleEntry(entryWith({}), 'adult'));
    expect(rendered).toContain('Someone (2020). A paper.');
    expect(rendered).toContain('doi:x');
  });

  it('says so when nobody has checked the references', () => {
    expect(text(moduleEntry(entryWith({}), 'adult'))).toContain(LIBRARY_STRINGS.unverified);
  });

  it('says when someone has', () => {
    const rendered = text(moduleEntry(entryWith({ citationsVerified: '2026-10' }), 'adult'));
    expect(rendered).toContain('References checked against the originals in 2026-10.');
    expect(rendered).not.toContain(LIBRARY_STRINGS.unverified);
  });
});

describe('every entry this build ships', () => {
  it.each(MODULES.map((m) => [m.name, m] as const))('%s is complete', (_name, manifest) => {
    const entry = manifest.contributes.library;
    expect(entry.whatItIs.length).toBeGreaterThan(40);
    expect(entry.whatTheEvidenceSays.length).toBeGreaterThan(40);
    // docs/01-module-contract.md: an entry without the honest limits fails review.
    expect(entry.whatItWontDo.length).toBeGreaterThan(40);
    expect(entry.citations.length).toBeGreaterThan(0);
    expect(entry.reviewed).toMatch(/^\d{4}-\d{2}$/);
    expect(entry.nextReview).toMatch(/^\d{4}-\d{2}$/);
  });

  it.each(MODULES.map((m) => [m.name, m] as const))(
    '%s does not call itself evidence-based unless it is Tier A',
    (_name, manifest) => {
      const entry = manifest.contributes.library;
      if (entry.tier === 'A') return;
      const prose = `${entry.whatItIs} ${entry.whatTheEvidenceSays} ${entry.whatItWontDo}`;
      expect(prose.toLowerCase()).not.toContain(RESERVED_PHRASE);
    },
  );

  it('is honest that no tier here has been confirmed', () => {
    // docs/03-scope.md: the tier is assigned by someone other than the author.
    expect(text(renderLibrary({ modules: MODULES, space: 'adult' }))).toContain(
      LIBRARY_STRINGS.tiersProposed,
    );
  });
});

describe('what is not here', () => {
  it('names every exclusion the rubric names', () => {
    const rendered = text(renderLibrary({ modules: MODULES, space: 'adult' }));
    for (const exclusion of EXCLUSIONS) expect(rendered).toContain(exclusion.title);
    expect(EXCLUSIONS.length).toBeGreaterThanOrEqual(6);
  });

  it('says what would change each one, so an exclusion is not a prejudice', () => {
    for (const exclusion of EXCLUSIONS) {
      expect(exclusion.whatWouldChangeIt.length, exclusion.id).toBeGreaterThan(20);
    }
  });

  it('cites the evidence where the exclusion rests on evidence', () => {
    const onEvidence = EXCLUSIONS.filter((e) => e.id !== 'dose-tools' && e.citations.length > 0);
    expect(onEvidence.length).toBeGreaterThanOrEqual(3);
  });

  it('does not call anyone foolish for having tried one', () => {
    for (const exclusion of EXCLUSIONS) {
      const prose = `${exclusion.whatItIs} ${exclusion.why} ${exclusion.whatWouldChangeIt}`;
      expect(prose, exclusion.id).not.toMatch(/\b(scam|snake oil|fool|gullible|nonsense|quack)/i);
    }
  });

  it('is honest that the dose exclusion is scope, not evidence', () => {
    const dose = EXCLUSIONS.find((e) => e.id === 'dose-tools')!;
    expect(dose.why).toContain('not about evidence');
    expect(dose.citations).toEqual([]);
  });
});

describe('the Library shows everything, enabled or not', () => {
  it('lists a module that is turned off', () => {
    const rendered = text(renderLibrary({ modules: MODULES, space: 'adult' }));
    for (const manifest of MODULES) expect(rendered).toContain(manifest.name);
  });

  it('still explains the exclusions when no module exists at all', () => {
    const rendered = text(renderLibrary({ modules: [], space: 'adult' }));
    expect(rendered).toContain(LIBRARY_STRINGS.exclusionsTitle);
    expect(rendered).toContain('Brain training');
  });
});
