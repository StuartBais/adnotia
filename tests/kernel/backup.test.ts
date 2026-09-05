import { describe, expect, it } from 'vitest';
import {
  backupFilename,
  backupIsEncrypted,
  createDocument,
  envelopeOf,
  exportBackup,
  mergeDocuments,
  restoreBackup,
  SCHEMA_VERSION,
  WrongKeyError,
  type AdnotiaDocument,
} from '../../src/kernel/index';

// See docs/06-data-model.md "Backup file" and ADR-007.

const FAST = 1000;
const PASSPHRASE = 'a good passphrase';

/** A document with medication days, sleep days, wins, questions and a profile. */
function documentWith(days: string[], options: { profile?: string } = {}): AdnotiaDocument {
  const doc = createDocument({ now: new Date('2026-09-01T00:00:00.000Z') });
  doc.kernel.enabledModules = ['medication'];
  doc.kernel.moduleOrder = ['medication'];
  doc.modules['medication'] = {
    version: 3,
    days: Object.fromEntries(days.map((date) => [date, { dose: '50', med: 'Elvanse' }])),
  };
  doc.kernel.days = Object.fromEntries(
    days.map((date) => [date, { createdAt: `${date}T21:00:00.000Z`, win: `win ${date}` }]),
  );
  if (options.profile !== undefined) {
    doc.family.children[options.profile] = {
      nickname: 'Sam',
      ageBand: '6-11',
      createdAt: '2026-09-01T00:00:00.000Z',
      modules: { 'family-observations': { version: 1, entries: [{ id: 'e1', what: 'first' }] } },
    };
  }
  return doc;
}

describe('the backup file', () => {
  it('is named for the day it was made', () => {
    expect(backupFilename(new Date(2026, 8, 5))).toBe('adnotia-2026-09-05.json');
  });

  it('is an envelope, with nothing readable in it', async () => {
    const backup = await exportBackup(documentWith(['2026-09-04']), {
      passphrase: PASSPHRASE,
      iterations: FAST,
    });
    expect(backup.encrypted).toBe(true);
    expect(envelopeOf(backup.content)).not.toBeNull();
    expect(backup.content).not.toContain('Elvanse');
    expect(backup.content).not.toContain('medication');
    expect(backupIsEncrypted(backup.content)).toBe(true);
  });

  it('uses a salt of its own, unrelated to any other export', async () => {
    const doc = documentWith(['2026-09-04']);
    const first = await exportBackup(doc, { passphrase: PASSPHRASE, iterations: FAST });
    const second = await exportBackup(doc, { passphrase: PASSPHRASE, iterations: FAST });
    expect(envelopeOf(first.content)?.salt).not.toBe(envelopeOf(second.content)?.salt);
  });

  it('refuses a passphrase that is too short', async () => {
    await expect(
      exportBackup(createDocument(), { passphrase: 'short', iterations: FAST }),
    ).rejects.toThrow(/at least 8 characters/);
  });

  it('refuses to export unencrypted when this browser can encrypt', async () => {
    await expect(exportBackup(createDocument())).rejects.toThrow(/needs a passphrase/);
  });

  it('carries every slice, enabled or not', async () => {
    const doc = documentWith(['2026-09-04']);
    doc.modules['sleep'] = { version: 1, days: { '2026-09-04': { bed: '23:40' } } };
    // sleep is not in enabledModules, and must still be in the file.
    const backup = await exportBackup(doc, { passphrase: PASSPHRASE, iterations: FAST });
    const restored = await restoreBackup(createDocument(), backup.content, {
      passphrase: PASSPHRASE,
    });
    expect(restored.document.modules['sleep']).toBeDefined();
  });
});

describe('restoring', () => {
  it('round-trips onto an empty document', async () => {
    const doc = documentWith(['2026-09-03', '2026-09-04']);
    const backup = await exportBackup(doc, { passphrase: PASSPHRASE, iterations: FAST });
    const { document, counts } = await restoreBackup(createDocument(), backup.content, {
      passphrase: PASSPHRASE,
    });

    expect(document.modules['medication']).toEqual(doc.modules['medication']);
    expect(document.kernel.days).toEqual(doc.kernel.days);
    expect(counts.entriesAdded).toBeGreaterThan(0);
    expect(counts.entriesUpdated).toBe(0);
  });

  it('refuses the wrong passphrase and changes nothing', async () => {
    const doc = documentWith(['2026-09-04']);
    const backup = await exportBackup(doc, { passphrase: PASSPHRASE, iterations: FAST });
    const live = documentWith(['2026-09-01']);
    const before = structuredClone(live);

    await expect(
      restoreBackup(live, backup.content, { passphrase: 'the wrong one' }),
    ).rejects.toThrow(WrongKeyError);
    expect(live).toEqual(before);
  });

  it('says when a passphrase is needed and none was given', async () => {
    const backup = await exportBackup(createDocument(), {
      passphrase: PASSPHRASE,
      iterations: FAST,
    });
    await expect(restoreBackup(createDocument(), backup.content)).rejects.toThrow(
      /needs the passphrase/,
    );
  });

  it('reads a plain backup, made where encryption was unavailable', async () => {
    const doc = documentWith(['2026-09-04']);
    const { document } = await restoreBackup(createDocument(), JSON.stringify(doc));
    expect(document.modules['medication']).toEqual(doc.modules['medication']);
  });

  it('migrates an old backup on the way in', async () => {
    // A v0 monolith export, restored years later.
    const v0 = JSON.stringify({
      entries: { '2026-09-04': { dose: '50', med: 'Elvanse', bed: '23:40', wake: '07:00' } },
    });
    const { document } = await restoreBackup(createDocument(), v0);
    expect(document.schemaVersion).toBe(SCHEMA_VERSION);
    expect(document.modules['medication']).toBeDefined();
    expect(document.modules['sleep']).toBeDefined();
  });

  it('refuses a file that is not a backup', async () => {
    await expect(restoreBackup(createDocument(), 'not json')).rejects.toThrow(/not an Adnotia/);
  });
});

describe('merging rather than replacing', () => {
  it('keeps days the live document has and the backup does not', () => {
    const live = documentWith(['2026-09-01', '2026-09-02']);
    const backup = documentWith(['2026-09-03']);
    const { document } = mergeDocuments(live, backup);

    const days = document.modules['medication']?.['days'] as Record<string, unknown>;
    expect(Object.keys(days).sort()).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });

  it('lets the backup win a day both have', () => {
    const live = documentWith(['2026-09-04']);
    const backup = documentWith(['2026-09-04']);
    (backup.modules['medication']?.['days'] as Record<string, Record<string, unknown>>)[
      '2026-09-04'
    ] = { dose: '70', med: 'Elvanse' };

    const { document, counts } = mergeDocuments(live, backup);
    const days = document.modules['medication']?.['days'] as Record<string, Record<string, unknown>>;
    expect(days['2026-09-04']?.['dose']).toBe('70');
    // Two records for the one date: the medication day and the kernel day.
    expect(counts.entriesUpdated).toBe(2);
    expect(counts.entriesAdded).toBe(0);
  });

  it('counts what it added and what it overwrote', () => {
    const live = documentWith(['2026-09-01', '2026-09-02']);
    const backup = documentWith(['2026-09-02', '2026-09-03']);
    const { counts } = mergeDocuments(live, backup);
    // One shared day and one new, in both the medication slice and kernel.days.
    expect(counts.entriesUpdated).toBe(2);
    expect(counts.entriesAdded).toBe(2);
  });

  it('adds a slice the live document has never had', () => {
    const live = documentWith(['2026-09-01']);
    const backup = documentWith(['2026-09-01']);
    backup.modules['sleep'] = { version: 1, days: { '2026-09-01': { bed: '23:40' } } };

    const { document, counts } = mergeDocuments(live, backup);
    expect(document.modules['sleep']).toBeDefined();
    expect(counts.modulesAdded).toBe(1);
  });

  it('unions the enabled modules and keeps the live order first', () => {
    const live = documentWith(['2026-09-01']);
    const backup = documentWith(['2026-09-01']);
    backup.kernel.enabledModules = ['sleep', 'planning'];
    backup.kernel.moduleOrder = ['sleep', 'planning'];

    const { document } = mergeDocuments(live, backup);
    expect(document.kernel.enabledModules).toEqual(['medication', 'sleep', 'planning']);
    expect(document.kernel.moduleOrder).toEqual(['medication', 'sleep', 'planning']);
  });

  it('deduplicates questions by text, not by id', () => {
    const live = createDocument();
    live.kernel.questions = [{ id: 'q1', text: 'Is the dip the dose?', added: '2026-09-01' }];
    const backup = createDocument();
    backup.kernel.questions = [
      { id: 'q9', text: '  is the dip the dose?  ', added: '2026-08-01' },
      { id: 'q2', text: 'Should I ask about sleep?', added: '2026-08-02' },
    ];

    const { document, counts } = mergeDocuments(live, backup);
    expect(document.kernel.questions).toHaveLength(2);
    expect(counts.questionsAdded).toBe(1);
  });

  it('takes the later of the two dates', () => {
    const live = createDocument();
    live.kernel.lastAppointment = '2026-08-14';
    live.kernel.lastBackup = '2026-09-01';
    const backup = createDocument();
    backup.kernel.lastAppointment = '2026-09-02';
    backup.kernel.lastBackup = '2026-08-20';

    const { document } = mergeDocuments(live, backup);
    expect(document.kernel.lastAppointment).toBe('2026-09-02');
    expect(document.kernel.lastBackup).toBe('2026-09-01');
  });

  it('keeps the live baseline and uses the backup’s only to fill a gap', () => {
    const live = createDocument();
    live.kernel.baseline = { focus: 3, mood: 3, sleep: '7', note: 'live' };
    const backup = createDocument();
    backup.kernel.baseline = { focus: 1, mood: 1, sleep: '5', note: 'backup' };
    expect(mergeDocuments(live, backup).document.kernel.baseline?.note).toBe('live');

    const empty = createDocument();
    expect(mergeDocuments(empty, backup).document.kernel.baseline?.note).toBe('backup');
  });

  it('never lets a backup change the passcode setting on this device', () => {
    const live = createDocument();
    live.kernel.settings.passcodeEnabled = true;
    const backup = createDocument();
    backup.kernel.settings.passcodeEnabled = false;
    // Otherwise a restore could lock someone out of their own document.
    expect(mergeDocuments(live, backup).document.kernel.settings.passcodeEnabled).toBe(true);
  });

  it('keeps the space this device is in', () => {
    const live = createDocument({ space: 'family' });
    const backup = createDocument({ space: 'adult' });
    expect(mergeDocuments(live, backup).document.space).toBe('family');
  });

  it('keeps the earlier createdAt, which is when the record really began', () => {
    const live = createDocument({ now: new Date('2026-09-01T00:00:00.000Z') });
    const backup = createDocument({ now: new Date('2026-01-01T00:00:00.000Z') });
    expect(mergeDocuments(live, backup).document.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('does not modify either document it was given', () => {
    const live = documentWith(['2026-09-01']);
    const backup = documentWith(['2026-09-02']);
    const liveBefore = structuredClone(live);
    const backupBefore = structuredClone(backup);
    mergeDocuments(live, backup);
    expect(live).toEqual(liveBefore);
    expect(backup).toEqual(backupBefore);
  });

  it('is idempotent: restoring the same backup twice adds nothing the second time', () => {
    const live = documentWith(['2026-09-01']);
    const backup = documentWith(['2026-09-02']);
    const once = mergeDocuments(live, backup);
    const twice = mergeDocuments(once.document, backup);
    expect(twice.document).toEqual(once.document);
    expect(twice.counts.entriesAdded).toBe(0);
  });
});

describe('merging the Family space', () => {
  it('adds a child profile the live document does not have', () => {
    const live = documentWith(['2026-09-01']);
    const backup = documentWith(['2026-09-01'], { profile: 'c_8f2a' });
    const { document, counts } = mergeDocuments(live, backup);

    expect(document.family.children['c_8f2a']?.nickname).toBe('Sam');
    expect(counts.profilesAdded).toBe(1);
  });

  it('keeps one child’s data out of another’s', () => {
    const live = documentWith(['2026-09-01'], { profile: 'c_8f2a' });
    const backup = documentWith(['2026-09-01'], { profile: 'c_1b7d' });
    const { document } = mergeDocuments(live, backup);

    expect(Object.keys(document.family.children).sort()).toEqual(['c_1b7d', 'c_8f2a']);
    expect(document.family.children['c_8f2a']?.modules).not.toBe(
      document.family.children['c_1b7d']?.modules,
    );
  });

  it('merges observation entries without duplicating them', () => {
    const live = documentWith(['2026-09-01'], { profile: 'c_8f2a' });
    const backup = documentWith(['2026-09-01'], { profile: 'c_8f2a' });
    const slice = backup.family.children['c_8f2a']?.modules['family-observations'];
    (slice as unknown as { entries: unknown[] }).entries = [
      { id: 'e1', what: 'first' },
      { id: 'e2', what: 'second' },
    ];

    const { document } = mergeDocuments(live, backup);
    const entries = document.family.children['c_8f2a']?.modules['family-observations']?.[
      'entries'
    ] as unknown[];
    expect(entries).toHaveLength(2);
  });
});
