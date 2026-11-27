import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, memoryStorageAdapter, type StorageAdapter } from '../../src/kernel/store';
import { FAILED, KEY, migratingCodec, startBench, type Started } from '../../src/bench/boot';
import { ABOUT } from '../../src/bench/screens/places';

// Starting the prototype (PROTOTYPE-PLAN.md section 5): its own key, a codec
// that migrates what was stored, and one plain screen when what was stored
// cannot be read, whose "Start again" clears that key and nothing else.

let container: HTMLElement;
let started: Started | undefined;

afterEach(() => {
  started?.destroy();
  started = undefined;
  container?.remove();
});

async function start(adapter: StorageAdapter, confirm: (q: string) => boolean = () => true) {
  container = document.createElement('div');
  document.body.append(container);
  started = await startBench({
    container,
    adapter,
    now: () => new Date('2026-11-24T10:05:00'),
    confirm,
  });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('the migrating codec', () => {
  it('raises a version 1 document to the current schema on the way in', async () => {
    const v1 = { schemaVersion: 1, kernel: { settings: {} }, modules: {}, family: {} };
    const decoded = (await migratingCodec.decode(JSON.stringify(v1))) as Record<string, unknown>;
    expect(decoded['schemaVersion']).toBe(SCHEMA_VERSION);
    expect(decoded['domains']).toMatchObject({ tasks: [] });
  });
});

describe('starting', () => {
  it('opens a document an older build wrote', async () => {
    const adapter = memoryStorageAdapter();
    await adapter.write(
      KEY,
      JSON.stringify({ schemaVersion: 1, kernel: { settings: {} }, modules: {}, family: {} }),
    );
    await start(adapter);
    expect(container.textContent).not.toContain(FAILED.title);
  });

  it('says so plainly when what is stored cannot be read, and changes nothing', async () => {
    const adapter = memoryStorageAdapter();
    await adapter.write(KEY, '{ not json');
    await adapter.write('adnotia-v1', 'the app’s own document');
    await start(adapter, () => false);
    expect(container.querySelector('h1')?.textContent).toBe(FAILED.title);
    expect(container.textContent).toContain(FAILED.body);

    // Declining the confirm leaves everything where it was.
    [...container.querySelectorAll('button')].find((b) => b.textContent === FAILED.again)!.click();
    await settle();
    expect(await adapter.read(KEY)).toBe('{ not json');
  });

  it('starts again on its own key only, after a confirm', async () => {
    const adapter = memoryStorageAdapter();
    await adapter.write(KEY, '{ not json');
    await adapter.write('adnotia-v1', 'the app’s own document');
    const asked: string[] = [];
    await start(adapter, (question) => {
      asked.push(question);
      return true;
    });
    [...container.querySelectorAll('button')].find((b) => b.textContent === FAILED.again)!.click();
    await settle();
    await settle();
    expect(asked).toEqual([FAILED.confirm]);
    expect(await adapter.read(KEY)).not.toBe('{ not json');
    expect(await adapter.read('adnotia-v1')).toBe('the app’s own document');
    expect(container.textContent).not.toContain(FAILED.title);
  });

  it('says in About that nothing is kept, where the browser lets it keep nothing', async () => {
    const open = async () => {
      container = document.createElement('div');
      document.body.append(container);
      started = await startBench({ container, now: () => new Date('2026-11-24T10:05:00') });
      const tap = (name: string) =>
        [...container.querySelectorAll('button')].find((b) => b.textContent === name)!.click();
      tap('Me');
      tap(ABOUT_ROW);
      return container.textContent ?? '';
    };
    const ABOUT_ROW = 'About this prototype';
    // Safari blocking all cookies: touching storage throws.
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    try {
      const text = await open();
      expect(text).toContain(ABOUT.keepsNothing);
      expect(text).not.toContain(ABOUT.data);
    } finally {
      blocked.mockRestore();
      started?.destroy();
      started = undefined;
      container.remove();
    }
    // Where it can keep things, About says where they are.
    const text = await open();
    expect(text).toContain(ABOUT.data);
    expect(text).not.toContain(ABOUT.keepsNothing);
    localStorage.removeItem(KEY);
  });
});
