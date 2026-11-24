import { describe, expect, it } from 'vitest';
import {
  createDocument,
  emptyDomains,
  mergeDocuments,
  migrateDocument,
  migrateOneToTwo,
  restoreBackup,
  routineBookOf,
  SCHEMA_VERSION,
  type AdnotiaDocument,
} from '../../src/kernel/index';
import { smallDay as tasks } from '../../src/domains/tasks/fixtures';
import { smallDay as routines } from '../../src/domains/routines/fixtures';
import * as routineModel from '../../src/domains/routines';

// Schema version 2 adds the shared domains (ADR-046). See docs/06-data-model.md.

const NOW = new Date('2026-11-18T08:00:00.000Z');

/** A document as version 1 wrote it: no `domains`, everything else as now. */
function versionOne(): Record<string, unknown> {
  const { domains: _absent, ...rest } = createDocument({ now: NOW });
  return {
    ...rest,
    schemaVersion: 1,
    modules: { medication: { version: 3, days: { '2026-11-17': { dose: '50' } } } },
    somethingNew: { keep: true },
  };
}

function withDomains(change: (doc: AdnotiaDocument) => void): AdnotiaDocument {
  const doc = createDocument({ now: NOW });
  change(doc);
  return doc;
}

describe('schema version 2', () => {
  it('is the version a new document is created at, with empty domains', () => {
    const doc = createDocument({ now: NOW });
    expect(SCHEMA_VERSION).toBe(2);
    expect(doc.schemaVersion).toBe(2);
    expect(doc.domains).toEqual(emptyDomains());
  });

  it('migrates a version 1 document by adding empty domains and changing nothing else', () => {
    const before = versionOne();
    const migrated = migrateDocument(structuredClone(before));
    const { domains, schemaVersion, ...rest } = migrated as unknown as Record<string, unknown>;
    const { schemaVersion: _one, ...expected } = before;
    expect(schemaVersion).toBe(2);
    expect(domains).toEqual(emptyDomains());
    expect(rest).toEqual(expected);
  });

  it('is safe to run twice, and keeps a domains object that was already there', () => {
    const once = migrateOneToTwo(versionOne());
    expect(migrateOneToTwo(once)).toEqual(once);
    const partial = { ...versionOne(), domains: { tasks: tasks, future: 'keep' } };
    const kept = migrateOneToTwo(partial) as AdnotiaDocument;
    expect(kept.domains.tasks).toBe(tasks);
    expect(kept.domains['future']).toBe('keep');
    expect(kept.domains.reminders).toEqual([]);
  });

  it('hands back a document from a newer build untouched', () => {
    const fromFuture = { ...createDocument({ now: NOW }), schemaVersion: 3, extra: 1 };
    expect(migrateDocument(fromFuture)).toEqual(fromFuture);
  });

  it('does not move any module data into the domains', () => {
    const before = versionOne() as unknown as AdnotiaDocument;
    const migrated = migrateDocument(structuredClone(before));
    expect(migrated.modules['medication']).toEqual(before.modules['medication']);
    expect(migrated.domains.tasks).toEqual([]);
  });
});

describe('where a child’s routines live', () => {
  it('keeps the adult’s routines in the domains and each child’s inside their profile', () => {
    const doc = withDomains((d) => {
      d.domains.routines = routines['self']!;
      d.family.children['sam'] = {
        nickname: 'Sam',
        ageBand: '6-11',
        createdAt: NOW.toISOString(),
        modules: {},
        routines: routines['child:sam']!,
      };
    });
    const book = routineBookOf(doc);
    expect(routineModel.routinesFor(book, { kind: 'self' }).map((r) => r.id)).toEqual(['morning']);
    expect(
      routineModel.routinesFor(book, { kind: 'child', profileId: 'sam' }).map((r) => r.id),
    ).toEqual(['sam-morning']);
    expect(routineModel.routinesFor(book, { kind: 'child', profileId: 'nobody' })).toEqual([]);
  });
});

describe('merging the domains from a backup', () => {
  const task = (id: string, title: string) => ({ ...tasks[0]!, id, title });

  it('merges tasks by id: the backup wins on the same id, and both sides’ others are kept', () => {
    const live = withDomains((d) => {
      d.domains.tasks = [task('a', 'live a'), task('b', 'live b')];
    });
    const backup = withDomains((d) => {
      d.domains.tasks = [task('b', 'backup b'), task('c', 'backup c')];
    });
    const { document, counts } = mergeDocuments(live, backup);
    expect(document.domains.tasks.map((t) => [t.id, t.title])).toEqual([
      ['a', 'live a'],
      ['b', 'backup b'],
      ['c', 'backup c'],
    ]);
    expect(counts.entriesAdded).toBe(1);
    expect(counts.entriesUpdated).toBe(1);
  });

  it('merges routines and runs by id, for the adult and inside a child’s profile', () => {
    const profile = (shelf: routineModel.Shelf) => ({
      nickname: 'Sam',
      ageBand: '6-11',
      createdAt: NOW.toISOString(),
      modules: {},
      routines: shelf,
    });
    const samShelf = routines['child:sam']!;
    const live = withDomains((d) => {
      d.domains.routines = routines['self']!;
      d.family.children['sam'] = profile({ routines: samShelf.routines, runs: [] });
    });
    const backup = withDomains((d) => {
      d.domains.routines = { routines: routines['self']!.routines, runs: [] };
      d.family.children['sam'] = profile(samShelf);
    });
    const { document } = mergeDocuments(live, backup);
    expect(document.domains.routines.runs.map((r) => r.id)).toEqual(['run-self']);
    expect(document.family.children['sam']?.routines?.runs.map((r) => r.id)).toEqual(['run-sam']);
    expect(document.family.children['sam']?.routines?.routines).toHaveLength(1);
  });

  it('unions completions without doubling them, and merges reminders by id', () => {
    const completion = { at: NOW.toISOString(), scope: 'day' };
    const reminder = {
      id: 'r1',
      attachedTo: { kind: 'text', text: 'Bins' },
      when: { kind: 'at', date: '2026-11-18', time: '19:00' },
      createdAt: NOW.toISOString(),
    } as const;
    const live = withDomains((d) => {
      d.domains.completions = [completion];
    });
    const backup = withDomains((d) => {
      d.domains.completions = [completion, { at: NOW.toISOString() }];
      d.domains.reminders = [reminder];
    });
    const { document } = mergeDocuments(live, backup);
    expect(document.domains.completions).toHaveLength(2);
    expect(document.domains.reminders).toEqual([reminder]);
  });

  it('keeps the reward choices made on this device, and takes the backup’s only where none was made', () => {
    const live = withDomains((d) => {
      d.domains.rewards = { default: { tally: false }, scopes: { day: { doneList: true } } };
    });
    const backup = withDomains((d) => {
      d.domains.rewards = {
        default: { tally: true, celebrate: true },
        scopes: { day: { doneList: false }, 'routine:bedtime': { celebrate: true } },
      };
    });
    const { rewards } = mergeDocuments(live, backup).document.domains;
    expect(rewards.default).toEqual({ tally: false, celebrate: true });
    expect(rewards.scopes).toEqual({
      day: { doneList: true },
      'routine:bedtime': { celebrate: true },
    });
  });

  it('fills an option the backup set inside a scope this device has only partly chosen', () => {
    const live = withDomains((d) => {
      d.domains.rewards = { default: {}, scopes: { day: { doneList: true } } };
    });
    const backup = withDomains((d) => {
      d.domains.rewards = { default: {}, scopes: { day: { doneList: false, tally: true } } };
    });
    expect(mergeDocuments(live, backup).document.domains.rewards.scopes['day']).toEqual({
      doneList: true,
      tally: true,
    });
  });

  it('keeps two completions that share a time and scope, and restoring twice adds none', () => {
    const twin = { at: NOW.toISOString(), scope: 'day' };
    const backup = withDomains((d) => {
      d.domains.completions = [twin, { ...twin }];
    });
    const once = mergeDocuments(createDocument({ now: NOW }), backup).document;
    expect(once.domains.completions).toHaveLength(2);
    expect(mergeDocuments(once, backup).document.domains.completions).toHaveLength(2);
    const partial = withDomains((d) => {
      d.domains.completions = [twin];
    });
    expect(mergeDocuments(partial, backup).document.domains.completions).toHaveLength(2);
  });

  it('is idempotent, and leaves both inputs untouched', () => {
    const live = withDomains((d) => {
      d.domains.tasks = [task('a', 'a')];
    });
    const backup = withDomains((d) => {
      d.domains.tasks = [task('b', 'b')];
      d.domains.routines = routines['self']!;
    });
    const liveBefore = structuredClone(live);
    const backupBefore = structuredClone(backup);
    const once = mergeDocuments(live, backup);
    const twice = mergeDocuments(once.document, backup);
    expect(twice.document).toEqual(once.document);
    expect(twice.counts.entriesAdded).toBe(0);
    expect(live).toEqual(liveBefore);
    expect(backup).toEqual(backupBefore);
  });

  it('restores a version 1 backup into a version 2 document without losing the domains', async () => {
    const live = withDomains((d) => {
      d.domains.tasks = [task('a', 'kept')];
    });
    const { document } = await restoreBackup(live, JSON.stringify(versionOne()));
    expect(document.schemaVersion).toBe(2);
    expect(document.domains.tasks.map((t) => t.title)).toEqual(['kept']);
    expect(document.modules['medication']).toBeDefined();
  });
});
