import { describe, expect, it, vi } from 'vitest';
import {
  createRegistry,
  ManifestError,
  MODULES,
  RESERVED_FIELD_IDS,
  TODAY_COST_BUDGET,
  validateManifest,
  type ModuleManifest,
} from '../../src/kernel/index';

// Every failure mode in docs/05-architecture.md "Module registration" and
// docs/01-module-contract.md "Family space rules".

function library() {
  return {
    tier: 'A' as const,
    whatItIs: 'A daily record of dose, cover, side effects and sleep.',
    whatTheEvidenceSays: 'It supports pharmacological treatment, which has trial evidence.',
    whatItWontDo: 'It will not tell you or your prescriber what dose to take.',
    citations: [
      {
        title: 'Comparative efficacy and tolerability of medications for ADHD',
        authors: 'Cortese S, et al.',
        year: 2018,
        venue: 'Lancet Psychiatry',
        doi_or_url: '10.1016/S2215-0366(18)30269-4',
      },
    ],
    reviewed: '2026-09',
    nextReview: '2027-09',
  };
}

/** A manifest that passes everything, to be broken one rule at a time. */
function valid(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'medication',
    name: 'Medication log',
    version: 1,
    tier: 'A',
    audience: 'adult',
    summary: 'A daily record, summarised into one page for your prescriber.',
    dependencies: [],
    contributes: {
      today: [
        {
          id: 'focus',
          label: 'Focus and follow-through',
          type: 'scale5',
          anchors: ['', 'Scattered', 'Patchy', 'Mixed', 'Mostly there', 'Locked in'],
          cost: 3,
        },
      ],
      library: library(),
    },
    fixtures: { empty: {}, threeDays: {}, thirtyDays: {} },
    ...overrides,
  };
}

const rules = (manifest: ModuleManifest): string[] =>
  validateManifest(manifest).map((issue) => issue.rule);

/** A manifest with no fixtures key at all, which is what a forgetful author ships. */
function withoutFixtures(manifest: ModuleManifest): ModuleManifest {
  const { fixtures: _omitted, ...rest } = manifest;
  return rest as ModuleManifest;
}

describe('a valid manifest', () => {
  it('passes', () => {
    expect(validateManifest(valid())).toEqual([]);
  });

  it('registers', () => {
    const registry = createRegistry([valid()]);
    expect(registry.all()).toHaveLength(1);
    expect(registry.get('medication')?.name).toBe('Medication log');
    expect(registry.rejected).toEqual([]);
  });
});

describe('identity', () => {
  it('needs an id', () => {
    expect(rules(valid({ id: '' }))).toContain('id');
  });

  it('needs a lowercase id', () => {
    expect(rules(valid({ id: 'Medication' }))).toContain('id');
    expect(rules(valid({ id: 'med_log' }))).toContain('id');
    expect(rules(valid({ id: '1med' }))).toContain('id');
  });

  it('needs a name and a summary', () => {
    expect(rules(valid({ name: '' }))).toContain('name');
    expect(rules(valid({ summary: '   ' }))).toContain('summary');
  });

  it('needs a whole version of 1 or more', () => {
    expect(rules(valid({ version: 0 }))).toContain('version');
    expect(rules(valid({ version: 1.5 }))).toContain('version');
    expect(rules(valid({ version: -1 }))).toContain('version');
  });

  it('refuses two modules sharing an id', () => {
    expect(() => createRegistry([valid(), valid()])).toThrow(/share the id/);
  });
});

describe('the tier', () => {
  it('must be A, B or C', () => {
    expect(rules(valid({ tier: 'D' as never }))).toContain('tier');
    expect(rules(valid({ tier: undefined as never }))).toContain('tier');
  });

  it('must match the Library entry', () => {
    const manifest = valid({ tier: 'B' });
    // The manifest says B, the Library entry still says A.
    expect(rules(manifest)).toContain('library');
  });
});

describe('the Library entry', () => {
  it('is required, including for Tier C', () => {
    expect(rules(valid({ contributes: { library: undefined as never } }))).toContain('library');
  });

  it('needs whatItWontDo, because the honest limits are not optional', () => {
    const entry = { ...library(), whatItWontDo: '' };
    const issues = validateManifest(valid({ contributes: { library: entry } }));
    expect(issues.some((issue) => issue.message.includes('whatItWontDo'))).toBe(true);
  });

  it('needs whatItIs and whatTheEvidenceSays', () => {
    expect(rules(valid({ contributes: { library: { ...library(), whatItIs: '' } } }))).toContain(
      'library',
    );
    expect(
      rules(valid({ contributes: { library: { ...library(), whatTheEvidenceSays: '' } } })),
    ).toContain('library');
  });

  it('needs at least one citation', () => {
    const issues = validateManifest(
      valid({ contributes: { library: { ...library(), citations: [] } } }),
    );
    expect(issues.some((issue) => issue.message.includes('citation'))).toBe(true);
  });

  it('needs review dates as YYYY-MM', () => {
    expect(
      rules(valid({ contributes: { library: { ...library(), reviewed: '2026' } } })),
    ).toContain('library');
    expect(rules(valid({ contributes: { library: { ...library(), nextReview: '' } } }))).toContain(
      'library',
    );
  });
});

describe('today fields', () => {
  it('need an id, a label, a type and a cost', () => {
    const field = { id: '', label: '', type: 'nope', cost: 'free' } as never;
    const issues = rules(valid({ contributes: { today: [field], library: library() } }));
    expect(issues).toContain('today');
  });

  it('reject an unknown type', () => {
    const field = { id: 'x', label: 'X', type: 'slider', cost: 1 } as never;
    const issues = validateManifest(valid({ contributes: { today: [field], library: library() } }));
    expect(issues.some((issue) => issue.message.includes('unknown type'))).toBe(true);
  });

  it('reject two fields sharing an id', () => {
    const field = { id: 'focus', label: 'Focus', type: 'number' as const, cost: 1 };
    const issues = validateManifest(
      valid({ contributes: { today: [field, { ...field }], library: library() } }),
    );
    expect(issues.some((issue) => issue.message.includes('share the id'))).toBe(true);
  });

  it('require options on chips and anchors on a scale', () => {
    const chips = { id: 'side', label: 'Side effects', type: 'chips' as const, cost: 2 };
    expect(rules(valid({ contributes: { today: [chips], library: library() } }))).toContain(
      'today',
    );

    const scale = { id: 'mood', label: 'Mood', type: 'scale5' as const, cost: 2 };
    expect(rules(valid({ contributes: { today: [scale], library: library() } }))).toContain(
      'today',
    );
  });

  it('must fit the forty-second budget', () => {
    const heavy = Array.from({ length: 10 }, (_, index) => ({
      id: `field${index}`,
      label: `Field ${index}`,
      type: 'number' as const,
      cost: 5,
    }));
    const issues = validateManifest(valid({ contributes: { today: heavy, library: library() } }));
    expect(issues.some((issue) => issue.rule === 'today-budget')).toBe(true);
    expect(issues.some((issue) => issue.message.includes(`${TODAY_COST_BUDGET}s budget`))).toBe(
      true,
    );
  });

  it('accept a module exactly at the budget', () => {
    const fields = Array.from({ length: 8 }, (_, index) => ({
      id: `field${index}`,
      label: `Field ${index}`,
      type: 'number' as const,
      cost: 5,
    }));
    expect(rules(valid({ contributes: { today: fields, library: library() } }))).not.toContain(
      'today-budget',
    );
  });
});

describe('no medication in the Family space', () => {
  it.each(RESERVED_FIELD_IDS)('rejects the reserved field id "%s" for a parent module', (id) => {
    const manifest = valid({
      id: 'family-thing',
      audience: 'parent',
      contributes: {
        today: [{ id, label: 'Something', type: 'text', cost: 2 }],
        library: library(),
      },
    });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.rule === 'reserved-field')).toBe(true);
  });

  it('allows the same ids in the Adult space', () => {
    const manifest = valid({
      contributes: {
        today: [{ id: 'dose', label: 'Dose', type: 'number', cost: 3 }],
        library: library(),
      },
    });
    expect(rules(manifest)).not.toContain('reserved-field');
  });

  it('catches a reserved id hidden in a followUp', () => {
    const manifest = valid({
      id: 'family-thing',
      audience: 'parent',
      contributes: {
        today: [
          {
            id: 'mood',
            label: 'Mood',
            type: 'chips',
            options: [{ v: 'ok', l: 'OK' }],
            cost: 2,
            followUp: () => [{ id: 'dose', label: 'Dose', type: 'number', cost: 2 }],
          },
        ],
        library: library(),
      },
    });
    expect(rules(manifest)).toContain('reserved-field');
  });
});

describe('a child module', () => {
  function child(overrides: Partial<ModuleManifest['contributes']> = {}): ModuleManifest {
    return valid({
      id: 'child-tools',
      audience: 'child',
      contributes: { library: library(), ...overrides },
    });
  }

  it('may contribute tools and a Library entry', () => {
    const manifest = child({
      tools: [{ title: 'Visual timer', icon: 'timer', mount: () => undefined }],
    });
    expect(rules(manifest)).not.toContain('child-surface');
  });

  it('may declare no today fields, because it asks the child nothing', () => {
    const manifest = child({
      today: [{ id: 'howWasToday', label: 'How was today?', type: 'chips', options: [], cost: 2 }],
    });
    expect(rules(manifest)).toContain('child-surface');
  });

  it('may declare no reports', () => {
    const manifest = child({
      reports: [
        {
          report: 'observations',
          id: 'child.thing',
          title: () => 'Thing',
          weight: 10,
          render: () => '',
          renderText: () => '',
        },
      ],
    });
    expect(rules(manifest)).toContain('child-surface');
  });

  it('may declare no settings and no records', () => {
    expect(rules(child({ settings: [{ id: 's', label: 'S', type: 'toggle' }] }))).toContain(
      'child-surface',
    );
    expect(rules(child({ records: { render: () => undefined } }))).toContain('child-surface');
  });
});

describe('report sections', () => {
  function section(overrides: Record<string, unknown> = {}) {
    return {
      report: 'clinical',
      id: 'medication.standing',
      title: () => 'Where things stand',
      weight: 10,
      render: () => '<table></table>',
      renderText: () => 'Efficacy: …',
      ...overrides,
    } as never;
  }

  it('need an id, a report, a weight and both renderers', () => {
    expect(
      rules(valid({ contributes: { reports: [section({ id: '' })], library: library() } })),
    ).toContain('reports');
    expect(
      rules(valid({ contributes: { reports: [section({ report: '' })], library: library() } })),
    ).toContain('reports');
    expect(
      rules(
        valid({ contributes: { reports: [section({ weight: 'first' })], library: library() } }),
      ),
    ).toContain('reports');
  });

  it('need renderText, because the text export is not optional', () => {
    const issues = validateManifest(
      valid({ contributes: { reports: [section({ renderText: undefined })], library: library() } }),
    );
    expect(issues.some((issue) => issue.message.includes('renderText'))).toBe(true);
  });

  it('may not put a parent module into the clinical report', () => {
    const manifest = valid({
      id: 'family-observations',
      audience: 'parent',
      contributes: { reports: [section()], library: library() },
    });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.message.includes('Adult-space only'))).toBe(true);
  });
});

describe('dependencies', () => {
  it('must name a registered module', () => {
    expect(() => createRegistry([valid({ dependencies: ['sleep'] })])).toThrow(
      /not a registered module/,
    );
  });

  it('are fine when the module is there', () => {
    const sleep = valid({
      id: 'sleep',
      tier: 'B',
      contributes: { library: { ...library(), tier: 'B' } },
    });
    const registry = createRegistry([sleep, valid({ dependencies: ['sleep'] })]);
    expect(registry.all()).toHaveLength(2);
  });

  it('may not be circular through self-reference', () => {
    expect(rules(valid({ dependencies: ['medication'] }))).toContain('dependencies');
  });
});

describe('migrations', () => {
  it('are required once version is above 1', () => {
    expect(rules(valid({ version: 3 }))).toContain('migrate');
  });

  it('are run from every prior version against the fixtures', () => {
    const migrate = vi.fn((state: unknown, _fromVersion: number) => state as object);
    const manifest = valid({ version: 4, migrate });
    expect(validateManifest(manifest)).toEqual([]);
    expect(migrate).toHaveBeenCalledTimes(3);
    expect(migrate.mock.calls.map((call) => call[1])).toEqual([1, 2, 3]);
  });

  it('fail when the migration throws', () => {
    const manifest = valid({
      version: 2,
      migrate: () => {
        throw new Error('cannot read days of undefined');
      },
    });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.message.includes('cannot read days'))).toBe(true);
  });

  it('fail when the migration returns nothing', () => {
    const manifest = valid({ version: 2, migrate: () => undefined });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.message.includes('did not return a slice'))).toBe(true);
  });

  it('need fixtures to be checked against', () => {
    const manifest = withoutFixtures(valid({ version: 2, migrate: (s) => s as object }));
    expect(rules(manifest)).toContain('migrate');
  });
});

describe('fixtures', () => {
  it('are required', () => {
    expect(rules(withoutFixtures(valid()))).toContain('fixtures');
  });

  it('must cover zero, three and thirty days', () => {
    const manifest = valid({
      fixtures: { empty: {}, threeDays: undefined as never, thirtyDays: {} },
    });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.message.includes('threeDays'))).toBe(true);
  });
});

describe('a tool that carries its own tier', () => {
  const tool = (tier?: 'A' | 'B' | 'C') => ({
    title: 'A tool',
    icon: 'x',
    ...(tier === undefined ? {} : { tier }),
    mount: () => {},
  });

  it('may carry less than its module', () => {
    // docs/02-evidence-rubric.md rates planning Tier A while naming
    // task-breaking templates among its Tier C examples. ADR-025.
    const manifest = valid({
      tier: 'A',
      contributes: { ...valid().contributes, tools: [tool('C')] },
    });
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('may carry nothing, and then its module’s tier applies', () => {
    const manifest = valid({ contributes: { ...valid().contributes, tools: [tool()] } });
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('may not claim more than its module', () => {
    // A tool with more evidence than the module it ships in would be its own
    // module. Letting it say so is how a Tier C module smuggles in a Tier A claim.
    const library = { ...valid().contributes.library, tier: 'C' as const };
    const manifest = valid({
      tier: 'C',
      contributes: { ...valid().contributes, library, tools: [tool('A')] },
    });
    const issues = validateManifest(manifest);
    expect(issues.some((issue) => issue.rule === 'tool-tier')).toBe(true);
    expect(issues.some((issue) => issue.message.includes('cannot claim more evidence'))).toBe(true);
  });

  it('rejects a tier that is not a tier', () => {
    const manifest = valid({
      contributes: {
        ...valid().contributes,
        tools: [{ ...tool(), tier: 'D' as unknown as 'A' }],
      },
    });
    expect(validateManifest(manifest).some((issue) => issue.rule === 'tool-tier')).toBe(true);
  });
});

describe('how the registry handles a bad manifest', () => {
  it('throws in development, so it cannot be missed', () => {
    expect(() => createRegistry([valid({ id: '' })], { strict: true })).toThrow(ManifestError);
  });

  it('skips it in production, so one module cannot take the app down', () => {
    const onError = vi.fn();
    const registry = createRegistry([valid(), valid({ id: 'Broken' })], {
      strict: false,
      onError,
    });
    expect(registry.all()).toHaveLength(1);
    expect(registry.rejected).toHaveLength(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('never half-mounts: a rejected module is absent, not partial', () => {
    const registry = createRegistry([valid({ id: 'broken', version: 5 })], {
      strict: false,
      onError: () => undefined,
    });
    expect(registry.get('broken')).toBeUndefined();
    expect(registry.all()).toEqual([]);
  });

  it('reports every problem at once, not just the first', () => {
    const issues = validateManifest(valid({ id: '', name: '', version: 0, tier: 'Z' as never }));
    expect(issues.length).toBeGreaterThanOrEqual(4);
  });
});

describe('the registry', () => {
  it('ships the modules in this build, and every one of them validates', () => {
    expect(MODULES.map((manifest) => manifest.id)).toEqual([
      'medication',
      'sleep',
      'planning',
      'mindfulness',
      'exercise',
      'preparation',
      'family-observations',
      'family-routines',
      'child-tools',
    ]);
    // createRegistry throws in strict mode, so this failing means a shipped
    // module would not have registered.
    expect(createRegistry().all()).toHaveLength(MODULES.length);
  });

  it('separates modules by the space they mount in', () => {
    const parent = valid({
      id: 'family-observations',
      audience: 'parent',
      contributes: { library: library() },
    });
    const registry = createRegistry([valid(), parent]);
    expect(registry.forAudience('adult').map((m) => m.id)).toEqual(['medication']);
    expect(registry.forAudience('parent').map((m) => m.id)).toEqual(['family-observations']);
    expect(registry.forAudience('child')).toEqual([]);
  });
});
