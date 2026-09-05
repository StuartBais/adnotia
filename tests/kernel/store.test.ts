import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDocument,
  createStore,
  DOCUMENT_KEY,
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
  plainJsonCodec,
  SCHEMA_VERSION,
  type AdnotiaDocument,
  type KernelStore,
  type StorageAdapter,
} from '../../src/kernel/store/index';

// See docs/06-data-model.md and docs/05-architecture.md "Store".

const disposable: KernelStore[] = [];

function store(options: Parameters<typeof createStore>[0] = {}): KernelStore {
  const made = createStore({ debounceMs: 0, ...options });
  disposable.push(made);
  return made;
}

/** Storage that records what it was asked to write. */
function recordingAdapter(): StorageAdapter & { writes: string[]; held: Map<string, string> } {
  const held = new Map<string, string>();
  const writes: string[] = [];
  return {
    writes,
    held,
    async read(key) {
      return held.get(key) ?? null;
    },
    async write(key, value) {
      writes.push(value);
      held.set(key, value);
    },
    async remove(key) {
      held.delete(key);
    },
  };
}

afterEach(() => {
  for (const made of disposable.splice(0)) made.dispose();
  vi.useRealTimers();
});

describe('a new document', () => {
  it('starts at the current schema version, in the Adult space, with nothing enabled', () => {
    const doc = createDocument({ now: new Date('2026-09-05T20:12:00.000Z') });
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.space).toBe('adult');
    expect(doc.createdAt).toBe('2026-09-05T20:12:00.000Z');
    expect(doc.kernel.enabledModules).toEqual([]);
    expect(doc.modules).toEqual({});
    expect(doc.family.children).toEqual({});
  });

  it('has no passcode until someone sets one', () => {
    expect(createDocument().kernel.settings.passcodeEnabled).toBe(false);
  });
});

describe('slices in the Adult space', () => {
  it('is undefined before anything is written', () => {
    expect(store().get('medication')).toBeUndefined();
  });

  it('round-trips what a module writes', () => {
    const s = store();
    s.set('medication', { version: 3, days: { '2026-09-04': { dose: '50' } } });
    expect(s.get('medication')).toEqual({ version: 3, days: { '2026-09-04': { dose: '50' } } });
  });

  it('writes to modules.<id>, which the module never sees', () => {
    const s = store();
    s.set('sleep', { version: 1 });
    expect(s.document().modules['sleep']).toEqual({ version: 1 });
  });

  it('keeps one module out of another module’s slice', () => {
    const s = store();
    s.set('medication', { version: 3, days: { '2026-09-04': {} } });
    s.set('sleep', { version: 1, days: {} });
    expect(s.get('medication')).toEqual({ version: 3, days: { '2026-09-04': {} } });
  });

  it('deletes a slice entirely, which is separate from disabling it', () => {
    const s = store();
    s.set('medication', { version: 3 });
    s.deleteSlice('medication');
    expect(s.get('medication')).toBeUndefined();
    expect(s.document().modules).toEqual({});
  });
});

describe('holding a slice', () => {
  it('hands back something that cannot be mutated behind the store’s back', () => {
    const s = store();
    s.set('medication', { version: 3, days: {} });
    const held = s.get<{ version: number }>('medication');
    expect(() => {
      (held as { version: number }).version = 99;
    }).toThrow();
    expect(s.get<{ version: number }>('medication')?.version).toBe(3);
  });

  it('copies what it is given, so the caller’s object is not the document’s', () => {
    const s = store();
    const mine = { version: 1, days: { '2026-09-04': { bed: '23:40' } } };
    s.set('sleep', mine);
    mine.days['2026-09-04'].bed = '01:00';
    expect(s.get<typeof mine>('sleep')?.days['2026-09-04']?.bed).toBe('23:40');
  });

  it('freezes nested values, not just the top level', () => {
    const s = store();
    s.set('sleep', { version: 1, days: { '2026-09-04': { bed: '23:40' } } });
    const held = s.get<{ days: Record<string, { bed: string }> }>('sleep');
    expect(() => {
      (held as { days: Record<string, { bed: string }> }).days['2026-09-04']!.bed = '01:00';
    }).toThrow();
  });
});

describe('slices in the Family space', () => {
  // The shell owns profile creation; this stands in for it until Milestone 5.
  function withChild(): KernelStore {
    const doc = createDocument();
    doc.family.children['c_8f2a'] = {
      nickname: 'Sam',
      ageBand: '6-11',
      createdAt: '2026-09-05T20:40:00.000Z',
      modules: {},
    };
    doc.family.children['c_1b7d'] = {
      nickname: 'Alex',
      ageBand: '12-17',
      createdAt: '2026-09-05T20:41:00.000Z',
      modules: {},
    };
    return store({ adapter: memoryStorageAdapter({ [DOCUMENT_KEY]: JSON.stringify(doc) }) });
  }

  it('routes a slice to the chosen child', async () => {
    const s = withChild();
    await s.load();
    s.useSpace('family');
    s.useProfile('c_8f2a');
    s.set('family-observations', { version: 1, entries: ['first'] });

    expect(s.document().family.children['c_8f2a']?.modules['family-observations']).toEqual({
      version: 1,
      entries: ['first'],
    });
    expect(s.document().modules['family-observations']).toBeUndefined();
  });

  it('never lets two children’s data mix', async () => {
    const s = withChild();
    await s.load();
    s.useSpace('family');

    s.useProfile('c_8f2a');
    s.set('family-observations', { version: 1, entries: ['Sam'] });
    s.useProfile('c_1b7d');
    expect(s.get('family-observations')).toBeUndefined();

    s.set('family-observations', { version: 1, entries: ['Alex'] });
    s.useProfile('c_8f2a');
    expect(s.get<{ entries: string[] }>('family-observations')?.entries).toEqual(['Sam']);
  });

  it('refuses to resolve a slice when no profile is chosen', async () => {
    const s = withChild();
    await s.load();
    s.useSpace('family');
    expect(() => s.get('family-observations')).toThrow(/no child profile is selected/i);
    expect(() => s.set('family-observations', { version: 1 })).toThrow(/useProfile/);
  });

  it('refuses a profile that does not exist', async () => {
    const s = withChild();
    await s.load();
    s.useSpace('family');
    s.useProfile('c_nope');
    expect(() => s.get('family-observations')).toThrow(/c_nope/);
  });

  it('forgets the profile on returning to the Adult space', async () => {
    const s = withChild();
    await s.load();
    s.useSpace('family');
    s.useProfile('c_8f2a');
    s.useSpace('adult');
    expect(s.profile()).toBeUndefined();
  });
});

describe('the kernel slice', () => {
  it('is where wins, misses and questions live', () => {
    const s = store();
    s.updateKernel((kernel) => ({
      ...kernel,
      days: { '2026-09-04': { createdAt: '2026-09-04T21:30:00.000Z', win: 'Got out on time' } },
    }));
    expect(s.document().kernel.days['2026-09-04']?.win).toBe('Got out on time');
  });

  it('records enabled modules and their order', () => {
    const s = store();
    s.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: ['medication', 'sleep'],
      moduleOrder: ['sleep', 'medication'],
    }));
    expect(s.document().kernel.enabledModules).toEqual(['medication', 'sleep']);
    expect(s.document().kernel.moduleOrder).toEqual(['sleep', 'medication']);
  });
});

describe('subscriptions', () => {
  it('tells a subscriber its slice changed', () => {
    const s = store();
    const heard = vi.fn();
    s.subscribe('medication', heard);
    s.set('medication', { version: 3 });
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('does not tell it about another slice', () => {
    const s = store();
    const heard = vi.fn();
    s.subscribe('medication', heard);
    s.set('sleep', { version: 1 });
    expect(heard).not.toHaveBeenCalled();
  });

  it('stops on unsubscribe', () => {
    const s = store();
    const heard = vi.fn();
    const stop = s.subscribe('medication', heard);
    stop();
    s.set('medication', { version: 3 });
    expect(heard).not.toHaveBeenCalled();
  });

  it('tells every subscriber to the same slice', () => {
    const s = store();
    const first = vi.fn();
    const second = vi.fn();
    s.subscribe('medication', first);
    s.subscribe('medication', second);
    s.set('medication', { version: 3 });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('persistence', () => {
  it('writes the whole document, never a part of it', async () => {
    const adapter = recordingAdapter();
    const s = store({ adapter });
    s.set('medication', { version: 3 });
    await s.flush();

    const written = JSON.parse(adapter.writes.at(-1) as string) as AdnotiaDocument;
    expect(written.schemaVersion).toBe(SCHEMA_VERSION);
    expect(written.kernel).toBeDefined();
    expect(written.family).toBeDefined();
    expect(written.modules['medication']).toEqual({ version: 3 });
  });

  it('debounces, so a burst of edits is one write', async () => {
    vi.useFakeTimers();
    const adapter = recordingAdapter();
    const s = createStore({ adapter, debounceMs: 500 });
    disposable.push(s);

    s.set('medication', { version: 3 });
    s.set('medication', { version: 3, days: {} });
    s.set('sleep', { version: 1 });
    expect(adapter.writes).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(500);
    expect(adapter.writes).toHaveLength(1);
  });

  it('holds nothing after dispose, so no timer outlives the page', async () => {
    vi.useFakeTimers();
    const adapter = recordingAdapter();
    const s = createStore({ adapter, debounceMs: 500 });
    s.set('medication', { version: 3 });
    s.dispose();

    await vi.advanceTimersByTimeAsync(5000);
    expect(adapter.writes).toHaveLength(0);
  });

  it('reads back what it wrote', async () => {
    const adapter = memoryStorageAdapter();
    const first = store({ adapter });
    first.set('medication', { version: 3, days: { '2026-09-04': { dose: '50' } } });
    await first.flush();

    const second = store({ adapter });
    await second.load();
    expect(second.get('medication')).toEqual({ version: 3, days: { '2026-09-04': { dose: '50' } } });
  });

  it('starts a fresh document when nothing is stored', async () => {
    const s = store({ adapter: memoryStorageAdapter() });
    await s.load();
    expect(s.document().schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.document().modules).toEqual({});
  });

  it('reports a storage failure rather than losing the write silently', async () => {
    const onPersistError = vi.fn();
    const s = store({
      adapter: {
        async read() {
          return null;
        },
        async write() {
          throw new Error('QuotaExceededError');
        },
        async remove() {},
      },
      onPersistError,
    });
    s.set('medication', { version: 3 });
    await s.flush();
    expect(onPersistError).toHaveBeenCalledTimes(1);
    expect((onPersistError.mock.calls[0]?.[0] as Error).message).toBe('QuotaExceededError');
  });

  it('refuses to treat something that is not a document as one', async () => {
    const s = store({ adapter: memoryStorageAdapter({ [DOCUMENT_KEY]: '{"hello":"world"}' }) });
    await expect(s.load()).rejects.toThrow(/not an Adnotia document/);
  });
});

describe('unknown keys', () => {
  it('survive a load and save, because a newer build may still read them', async () => {
    const doc = createDocument();
    const fromNewerBuild = {
      ...doc,
      somethingNew: { kept: true },
      modules: { future: { version: 9, unrecognised: ['a', 'b'] } },
    };
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: JSON.stringify(fromNewerBuild) });

    const s = store({ adapter });
    await s.load();
    s.set('medication', { version: 3 });
    await s.flush();

    const written = JSON.parse((await adapter.read(DOCUMENT_KEY)) as string) as Record<
      string,
      unknown
    >;
    expect(written['somethingNew']).toEqual({ kept: true });
    expect((written['modules'] as Record<string, unknown>)['future']).toEqual({
      version: 9,
      unrecognised: ['a', 'b'],
    });
  });

  it('survive inside a module’s own slice', async () => {
    const s = store();
    s.set('medication', { version: 3, aFieldThisBuildHasNeverHeardOf: 'kept' });
    expect(s.get<Record<string, unknown>>('medication')?.['aFieldThisBuildHasNeverHeardOf']).toBe(
      'kept',
    );
  });
});

describe('the storage adapters', () => {
  it('uses the key from the data model', () => {
    expect(DOCUMENT_KEY).toBe('adnotia-v1');
  });

  it('reads and writes localStorage', async () => {
    expect(isLocalStorageAvailable()).toBe(true);
    const adapter = localStorageAdapter();
    await adapter.write('probe', 'value');
    expect(await adapter.read('probe')).toBe('value');
    await adapter.remove('probe');
    expect(await adapter.read('probe')).toBeNull();
  });

  it('is missing rather than empty for a key never written', async () => {
    expect(await memoryStorageAdapter().read('nothing')).toBeNull();
  });
});

describe('the codec seam', () => {
  it('stores plain JSON until encryption lands', async () => {
    const doc = createDocument();
    expect(JSON.parse(await plainJsonCodec.encode(doc))).toEqual(doc);
  });

  it('lets the kernel put something else in the middle', async () => {
    const adapter = recordingAdapter();
    const reversed = {
      async encode(document: AdnotiaDocument) {
        return [...JSON.stringify(document)].reverse().join('');
      },
      async decode(raw: string) {
        return JSON.parse([...raw].reverse().join('')) as unknown;
      },
    };

    const first = store({ adapter, codec: reversed });
    first.set('medication', { version: 3 });
    await first.flush();
    expect(adapter.writes.at(-1)).not.toContain('"medication"');

    const second = store({ adapter, codec: reversed });
    await second.load();
    expect(second.get('medication')).toEqual({ version: 3 });
  });
});
