import { describe, expect, it } from 'vitest';
import { AREAS, MODULES, areaBlurb, areaName, areasIn, isArea } from '../../src/kernel/index';
import { audienceInSpace } from '../../src/kernel/registry/types';

// Areas are how a person finds anything. The index is built from them, so the
// invariant that matters is not "every area has a name" but "every module lands
// somewhere its own space will actually draw".

describe('the area vocabulary', () => {
  it('is closed, and the kernel owns it', () => {
    expect(AREAS.length).toBeGreaterThan(3);
    expect(new Set(AREAS).size).toBe(AREAS.length);
    expect(isArea('focus')).toBe(true);
    expect(isArea('wellness')).toBe(false);
    expect(isArea(undefined)).toBe(false);
  });

  it('gives every area a name and a line saying what is in it', () => {
    for (const area of AREAS) {
      expect(areaName(area).length, area).toBeGreaterThan(3);
      expect(areaBlurb(area).length, area).toBeGreaterThan(20);
    }
  });

  it('names them in the app’s voice: sentence case, no shouting', () => {
    // docs/07-design-system.md "Voice": sentence case everywhere, no exclamation
    // marks. A directory of Title Case Nouns is a different app.
    for (const area of AREAS) {
      const name = areaName(area);
      expect(name, area).not.toMatch(/!/);
      expect(name.slice(1), area).toBe(name.slice(1).replace(/\b[A-Z][a-z]/g, (w) => w));
      expect(name[0], area).toBe(name[0]?.toUpperCase());
    }
  });

  it('splits cleanly between the two spaces', () => {
    const adult = areasIn('adult');
    const family = areasIn('family');
    expect(adult.length).toBeGreaterThan(0);
    expect(family.length).toBeGreaterThan(0);
    // No area belongs to both: an adult must never be shown a parent's area.
    expect(adult.filter((area) => family.includes(area))).toEqual([]);
    // And between them they account for the whole vocabulary — an area in
    // neither list is one no index would ever draw.
    expect([...adult, ...family].sort()).toEqual([...AREAS].sort());
  });
});

describe('every module in the build', () => {
  it('declares an area', () => {
    for (const manifest of MODULES) expect(isArea(manifest.area), manifest.id).toBe(true);
  });

  it('lands in an area its own space draws', () => {
    // The bug this catches: a parent module filed under an adult area is
    // registered, enabled, and invisible — its space never renders that area.
    const misplaced = MODULES.filter(
      (manifest) =>
        !(['adult', 'family'] as const).some(
          (space) =>
            audienceInSpace(manifest.audience, space) && areasIn(space).includes(manifest.area),
        ),
    ).map((manifest) => `${manifest.id} (${manifest.audience}) is filed under ${manifest.area}`);
    expect(misplaced).toEqual([]);
  });

  it('leaves no area of a space empty', () => {
    // An area with no modules is a card that opens onto nothing. If one turns
    // up here, either a module is missing or the area should not exist yet.
    for (const space of ['adult', 'family'] as const) {
      const empty = areasIn(space).filter(
        (area) =>
          !MODULES.some(
            (manifest) => manifest.area === area && audienceInSpace(manifest.audience, space),
          ),
      );
      expect(empty, space).toEqual([]);
    }
  });
});
