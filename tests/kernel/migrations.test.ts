import { describe, expect, it } from 'vitest';
import {
  createDocument,
  detectSchemaVersion,
  importV0,
  isV0Document,
  migrateDocument,
  SCHEMA_VERSION,
  V0_KEY,
} from '../../src/kernel/store/index';

// See docs/06-data-model.md "Migration rules" and "The v0 monolith mapping".

/** A monolith document with one full day in it. */
function v0Document(): Record<string, unknown> {
  return {
    entries: {
      '2026-09-04': {
        date: '2026-09-04',
        med: 'Elvanse',
        dose: '50',
        unit: 'mg',
        times: ['08:00'],
        carriedFrom: '2026-09-03',
        carriedBack: true,
        adherence: 'ontime',
        focus: 4,
        mood: 3,
        onset: '09:30',
        woreOff: '16:30',
        rebound: 'mild',
        reboundTime: '17:00',
        appetite: 'reduced',
        heart: 'fine',
        side: ['dry'],
        detail: { dry: { sev: 'mild', time: '11:00', note: '', bpm: '' } },
        bed: '23:40',
        wake: '07:00',
        sleep: '7.25',
        sleepq: ['latency'],
        sleepLatency: '45',
        sleepNote: 'Took a while',
        win: 'Got out on time',
        miss: 'Skipped lunch',
        notes: 'A steadier day',
        createdAt: '2026-09-04T21:30:00.000Z',
      },
    },
    questions: [{ id: 'q1', text: 'Is the afternoon dip the dose?', added: '2026-09-01' }],
    baseline: { focus: 2, mood: 2, sleep: '6', note: '' },
    lastBackup: '2026-09-01',
    lastAppt: '2026-08-14',
    overall: 'mi',
    baseHidden: true,
    last: { med: 'Elvanse', dose: '50', unit: 'mg', times: ['08:00'] },
  };
}

describe('recognising a document', () => {
  it('reads the schema version of a v1 document', () => {
    expect(detectSchemaVersion(createDocument())).toBe(SCHEMA_VERSION);
  });

  it('treats a monolith document as version 0', () => {
    expect(isV0Document(v0Document())).toBe(true);
    expect(detectSchemaVersion(v0Document())).toBe(0);
  });

  it('refuses something that is neither', () => {
    expect(() => detectSchemaVersion({ hello: 'world' })).toThrow(/not an Adnotia document/);
    expect(() => detectSchemaVersion(null)).toThrow();
    expect(() => detectSchemaVersion('a string')).toThrow();
  });

  it('knows the key the monolith used', () => {
    expect(V0_KEY).toBe('adhd-titration-log-v1');
  });
});

describe('migrating a document', () => {
  it('takes a v0 document to the current schema version', () => {
    const migrated = migrateDocument(v0Document());
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('leaves a document already at the current version alone', () => {
    const doc = createDocument();
    expect(migrateDocument(doc)).toEqual(doc);
  });

  it('is safe to run twice', () => {
    const once = migrateDocument(v0Document(), { now: new Date('2026-09-05T00:00:00.000Z') });
    const twice = migrateDocument(once, { now: new Date('2026-09-05T00:00:00.000Z') });
    expect(twice).toEqual(once);
  });

  it('hands back a document from a newer build untouched', () => {
    const fromFuture = { ...createDocument(), schemaVersion: 99, somethingNew: true };
    expect(migrateDocument(fromFuture)).toEqual(fromFuture);
  });

  it('says so when there is no path from a version', () => {
    expect(() => migrateDocument({ ...createDocument(), schemaVersion: -1 })).toThrow(
      /No migration from schema version -1/,
    );
  });
});

describe('the v0 import', () => {
  const { document, counts } = importV0(v0Document(), {
    now: new Date('2026-09-05T00:00:00.000Z'),
  });
  const day = '2026-09-04';
  const medication = document.modules['medication']?.['days'] as Record<
    string,
    Record<string, unknown>
  >;
  const sleep = document.modules['sleep']?.['days'] as Record<string, Record<string, unknown>>;

  it('lands in the Adult space', () => {
    expect(document.space).toBe('adult');
  });

  it('moves medication fields to modules.medication.days', () => {
    expect(medication[day]).toMatchObject({
      med: 'Elvanse',
      dose: '50',
      unit: 'mg',
      times: ['08:00'],
      adherence: 'ontime',
      focus: 4,
      mood: 3,
      onset: '09:30',
      woreOff: '16:30',
      rebound: 'mild',
      reboundTime: '17:00',
      appetite: 'reduced',
      heart: 'fine',
      side: ['dry'],
      detail: { dry: { sev: 'mild', time: '11:00', note: '', bpm: '' } },
    });
  });

  it('splits sleep into its own module, renaming as the mapping says', () => {
    expect(sleep[day]).toEqual({
      bed: '23:40',
      wake: '07:00',
      hours: '7.25',
      quality: ['latency'],
      latency: '45',
      note: 'Took a while',
    });
  });

  it('moves wins, misses and the day note to the kernel', () => {
    expect(document.kernel.days[day]).toEqual({
      win: 'Got out on time',
      miss: 'Skipped lunch',
      notes: 'A steadier day',
      createdAt: '2026-09-04T21:30:00.000Z',
    });
  });

  it('keeps createdAt, which the record-quality footer depends on', () => {
    expect(document.kernel.days[day]?.createdAt).toBe('2026-09-04T21:30:00.000Z');
  });

  it('moves the kernel-level fields, renaming lastAppt', () => {
    expect(document.kernel.questions).toEqual([
      { id: 'q1', text: 'Is the afternoon dip the dose?', added: '2026-09-01' },
    ]);
    expect(document.kernel.baseline).toEqual({ focus: 2, mood: 2, sleep: '6', note: '' });
    expect(document.kernel.overall).toBe('mi');
    expect(document.kernel.lastAppointment).toBe('2026-08-14');
    expect(document.kernel.lastBackup).toBe('2026-09-01');
    expect(document.kernel.settings.baseHidden).toBe(true);
  });

  it('enables the modules it found data for', () => {
    expect(document.kernel.enabledModules).toEqual(['medication', 'sleep']);
    expect(document.kernel.moduleOrder).toEqual(['medication', 'sleep']);
  });

  it('drops only what is exactly recoverable', () => {
    // `date` repeats its own key; `last` is the carry cache nearestPrior recomputes.
    expect(medication[day]).not.toHaveProperty('date');
    expect(sleep[day]).not.toHaveProperty('date');
    expect(document.kernel).not.toHaveProperty('last');
    expect(JSON.stringify(document)).not.toContain('"last"');
  });

  it('keeps carry provenance with the prescription it describes', () => {
    expect(medication[day]).toMatchObject({ carriedFrom: '2026-09-03', carriedBack: true });
  });

  it('counts what it found, for the confirmation the person is shown', () => {
    expect(counts).toEqual({
      days: 1,
      medicationDays: 1,
      sleepDays: 1,
      kernelDays: 1,
      questions: 1,
    });
  });

  it('does not mutate what it was given', () => {
    const original = v0Document();
    const copy = structuredClone(original);
    importV0(original);
    expect(original).toEqual(copy);
  });
});

describe('the v0 import on partial data', () => {
  it('enables only medication when there is no sleep', () => {
    const { document } = importV0({
      entries: { '2026-09-04': { dose: '50', focus: 3 } },
    });
    expect(document.kernel.enabledModules).toEqual(['medication']);
    expect(document.modules['sleep']).toBeUndefined();
  });

  it('enables only sleep when there is no medication', () => {
    const { document } = importV0({ entries: { '2026-09-04': { bed: '23:00', wake: '07:00' } } });
    expect(document.kernel.enabledModules).toEqual(['sleep']);
    expect(document.modules['medication']).toBeUndefined();
  });

  it('enables nothing for an empty monolith document', () => {
    const { document, counts } = importV0({ entries: {} });
    expect(document.kernel.enabledModules).toEqual([]);
    expect(counts.days).toBe(0);
  });

  it('keeps a day that recorded only a win', () => {
    const { document } = importV0({
      entries: { '2026-09-04': { win: 'Got out', createdAt: '2026-09-04T21:00:00.000Z' } },
    });
    expect(document.kernel.days['2026-09-04']?.win).toBe('Got out');
    expect(document.modules['medication']).toBeUndefined();
  });

  it('preserves a field this build has never heard of', () => {
    const { document } = importV0({
      entries: { '2026-09-04': { dose: '50', aFieldFromLater: 'kept' } },
    });
    const days = document.modules['medication']?.['days'] as Record<
      string,
      Record<string, unknown>
    >;
    expect(days['2026-09-04']?.['aFieldFromLater']).toBe('kept');
  });

  it('skips an entry that is not an object', () => {
    const { document, counts } = importV0({ entries: { '2026-09-04': null } });
    expect(counts.days).toBe(0);
    expect(document.kernel.days).toEqual({});
  });

  it('refuses something that is not a monolith document', () => {
    expect(() => importV0({ hello: 'world' })).toThrow(/not a v0 Adnotia document/);
  });
});
