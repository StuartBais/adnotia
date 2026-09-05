// The module smoke test, generated from one helper so a module cannot opt out.
//
// docs/01-module-contract.md "Testing a module" fixes the list: render every
// today field against each fixture, render every records and reports
// contribution against each fixture without error, run migrate from every prior
// version, confirm no network request, and confirm the declared today cost is
// within budget.

import { describe, expect, it } from 'vitest';
import {
  measure,
  validateManifest,
  TODAY_COST_BUDGET,
  type ModuleManifest,
  type TodayField,
} from '../../src/kernel/index';

type Fixture = { version?: number; days?: Record<string, Record<string, unknown>> };

function fixtureEntries(manifest: ModuleManifest): [string, Fixture][] {
  const fixtures = manifest.fixtures;
  if (fixtures === undefined) return [];
  return [
    ['empty', fixtures.empty as Fixture],
    ['threeDays', fixtures.threeDays as Fixture],
    ['thirtyDays', fixtures.thirtyDays as Fixture],
  ];
}

/** Every field the module declares, following each followUp one level down. */
function allFields(fields: readonly TodayField[]): TodayField[] {
  const found: TodayField[] = [];
  for (const field of fields) {
    found.push(field);
    if (typeof field.followUp === 'function') {
      for (const probe of [undefined, '', 'probe', ['probe'], 1, true]) {
        const more = field.followUp(probe);
        if (Array.isArray(more)) found.push(...more);
      }
    }
  }
  return found;
}

/** Run the standard suite against a manifest. */
export function smokeTest(manifest: ModuleManifest): void {
  describe(`${manifest.id}: the module contract`, () => {
    it('registers without complaint', () => {
      expect(validateManifest(manifest)).toEqual([]);
    });

    it('declares a tier and a Library entry with citations', () => {
      expect(['A', 'B', 'C']).toContain(manifest.tier);
      expect(manifest.contributes.library.citations.length).toBeGreaterThan(0);
      expect(manifest.contributes.library.whatItWontDo.length).toBeGreaterThan(0);
    });

    it('fits the today budget', () => {
      const budget = measure([manifest]);
      expect(budget.total).toBeLessThanOrEqual(TODAY_COST_BUDGET);
    });

    it('ships all three fixtures', () => {
      expect(fixtureEntries(manifest)).toHaveLength(3);
    });
  });

  describe(`${manifest.id}: every today field`, () => {
    const fields = allFields(manifest.contributes.today ?? []);

    it('has an id, a label, a type and a cost', () => {
      for (const field of fields) {
        expect(field.id, 'field id').toBeTruthy();
        expect(field.label, `${field.id} label`).toBeTruthy();
        expect(field.type, `${field.id} type`).toBeTruthy();
        expect(typeof field.cost, `${field.id} cost`).toBe('number');
      }
    });

    it('survives being asked for a follow-up with any value', () => {
      for (const field of manifest.contributes.today ?? []) {
        if (typeof field.followUp !== 'function') continue;
        for (const probe of [undefined, null, '', 'x', [], ['x'], 0, 3, true, false]) {
          expect(() => field.followUp?.(probe), `${field.id} followUp`).not.toThrow();
        }
      }
    });
  });

  describe(`${manifest.id}: against each fixture`, () => {
    for (const [name, fixture] of fixtureEntries(manifest)) {
      const dates = Object.keys(fixture.days ?? {}).sort();
      const context = { dates, days: fixture.days ?? {} };

      it(`renders records for ${name}`, () => {
        const records = manifest.contributes.records;
        if (records === undefined) return;
        const container = document.createElement('div');
        expect(() => records.render(container, context)).not.toThrow();
      });

      it(`renders every report section for ${name}`, () => {
        for (const section of manifest.contributes.reports ?? []) {
          const shown = section.when?.(context) ?? true;
          if (!shown) continue;
          expect(() => section.render(context), `${section.id} render`).not.toThrow();
          expect(() => section.renderText(context), `${section.id} renderText`).not.toThrow();
          expect(() => section.title(context), `${section.id} title`).not.toThrow();
        }
      });

      it(`derives without throwing for ${name}`, () => {
        if (typeof manifest.derive !== 'function') return;
        for (const day of Object.values(fixture.days ?? {})) {
          expect(() => manifest.derive?.(day)).not.toThrow();
        }
        expect(() => manifest.derive?.({})).not.toThrow();
      });
    }
  });

  describe(`${manifest.id}: migrations`, () => {
    it('runs from every prior version', () => {
      if (manifest.version === 1) {
        expect(manifest.migrate).toBeUndefined();
        return;
      }
      for (let from = 1; from < manifest.version; from++) {
        for (const [, fixture] of fixtureEntries(manifest)) {
          expect(() => manifest.migrate?.(structuredClone(fixture), from)).not.toThrow();
        }
      }
    });
  });

  describe(`${manifest.id}: the clinical report`, () => {
    it('never addresses the clinician with a recommendation', () => {
      // docs/03-scope.md: the words should, increase, decrease and recommend do
      // not appear in anything addressed to a clinician.
      const forbidden = /\b(should|increase|decrease|recommend|advise|suggest)\b/i;

      for (const [, fixture] of fixtureEntries(manifest)) {
        const context = { dates: Object.keys(fixture.days ?? {}).sort(), days: fixture.days ?? {} };
        for (const section of manifest.contributes.reports ?? []) {
          if (section.report !== 'clinical') continue;
          if (section.when?.(context) === false) continue;
          expect(section.render(context), `${section.id} render`).not.toMatch(forbidden);
          expect(section.renderText(context), `${section.id} renderText`).not.toMatch(forbidden);
        }
      }
    });

    it('never addresses the clinician through the report frame either', () => {
      // A `frame` contribution lands in the kernel-owned header and footer, so it
      // reaches a clinician without passing through `render`. The same rule
      // applies to it. See docs/decisions/ADR-012-report-frame-contributions.md.
      const forbidden = /\b(should|increase|decrease|recommend|advise|suggest)\b/i;

      for (const [, fixture] of fixtureEntries(manifest)) {
        const context = { dates: Object.keys(fixture.days ?? {}).sort(), days: fixture.days ?? {} };
        for (const section of manifest.contributes.reports ?? []) {
          if (section.report !== 'clinical' || typeof section.frame !== 'function') continue;
          for (const [slot, phrase] of Object.entries(section.frame(context))) {
            if (typeof phrase !== 'string') continue;
            expect(phrase, `${section.id} frame.${slot}`).not.toMatch(forbidden);
          }
        }
      }
    });

    it('makes no network request while rendering', () => {
      // The guard in tests/setup.ts throws on any networking primitive, so
      // reaching for one here fails rather than passing against a stub.
      for (const [, fixture] of fixtureEntries(manifest)) {
        const context = { dates: Object.keys(fixture.days ?? {}).sort(), days: fixture.days ?? {} };
        for (const section of manifest.contributes.reports ?? []) {
          expect(() => section.render(context)).not.toThrow();
        }
      }
    });
  });
}
