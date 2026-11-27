import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, memoryStorageAdapter, type StorageAdapter } from '../../src/kernel/store';
import {
  CHANGED,
  FAILED,
  KEY,
  migratingCodec,
  startBench,
  type Started,
} from '../../src/bench/boot';
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

// Two tabs of the prototype share its key. A tab that read an older copy must
// not write it over a newer one (ADR-016), and coming back to a tab whose copy
// is older, with nothing of its own waiting, opens the newer one quietly.
describe('another tab', () => {
  const tap = (name: string) =>
    [...container.querySelectorAll('button')].find((b) => b.textContent === name)!.click();
  /** The page goes to the background and comes back, as a Safari tab switch does. */
  const away = async () => {
    window.dispatchEvent(new Event('pagehide'));
    await settle();
  };
  const back = async () => {
    window.dispatchEvent(new Event('pageshow'));
    await settle();
  };
  const tasks = async (adapter: StorageAdapter) =>
    (JSON.parse((await adapter.read(KEY))!) as { domains: { tasks: unknown[] } }).domains.tasks
      .length;

  /** Another tab of the prototype saves: here, a day with nothing in it. */
  const otherTabSaves = async (adapter: StorageAdapter) => {
    const newer = JSON.parse((await adapter.read(KEY))!) as { domains: { tasks: unknown[] } };
    newer.domains.tasks = [];
    const written = JSON.stringify(newer);
    await adapter.write(KEY, written);
    return written;
  };

  it('opens what another tab saved when it is come back to', async () => {
    const adapter = memoryStorageAdapter();
    await start(adapter);
    await away();
    await otherTabSaves(adapter);
    await back();
    await settle();
    expect(container.textContent).not.toContain(CHANGED.title);
    expect(container.textContent).not.toContain('Call the dentist');
    await away();
    expect(await tasks(adapter)).toBe(0);
  });

  it('does not write over what another tab saved, and says so', async () => {
    const adapter = memoryStorageAdapter();
    await start(adapter);
    await away();
    await back();
    // Both on screen at once, as two windows can be: the other saves, then this one changes.
    const written = await otherTabSaves(adapter);
    tap('Me');
    tap('About this prototype');
    tap('Load: weeks away');
    await away();
    await settle();
    expect(await adapter.read(KEY)).toBe(written);
    expect(container.querySelector('h1')?.textContent).toBe(CHANGED.title);
    expect(container.textContent).toContain(CHANGED.body);
    // Its button opens what is stored now, and saving works again from there.
    tap(CHANGED.again);
    await settle();
    await settle();
    expect(container.textContent).not.toContain(CHANGED.title);
    await back();
    await away();
    expect(await tasks(adapter)).toBe(0);
    expect(container.textContent).not.toContain(CHANGED.title);
  });

  it('still lets About rewrite the day in a tab of its own', async () => {
    const adapter = memoryStorageAdapter();
    await start(adapter);
    tap('Me');
    tap('About this prototype');
    tap('Start empty');
    await away();
    expect(await tasks(adapter)).toBe(0);
    await back();
    tap('Me');
    tap('About this prototype');
    tap('Load the example day');
    await away();
    expect(await tasks(adapter)).toBeGreaterThan(0);
    await back();
    tap('Me');
    tap('About this prototype');
    tap(ABOUT.deleteAll);
    await away();
    expect(await tasks(adapter)).toBe(0);
    expect(container.textContent).not.toContain(CHANGED.title);
  });

  it('saves on pagehide before the page can go, where the browser has Web Locks', async () => {
    // A lock's callback is a task, and a reload does not wait for one.
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: (_name: string, callback: () => Promise<void>) =>
          new Promise<void>((resolve) => setTimeout(() => void callback().then(resolve), 0)),
      },
    });
    try {
      const adapter = memoryStorageAdapter();
      await start(adapter);
      tap('Tasks');
      window.dispatchEvent(new Event('pagehide'));
      for (let i = 0; i < 20; i++) await Promise.resolve();
      const stored = JSON.parse((await adapter.read(KEY)) ?? '{}') as {
        domains?: { bench?: { ui?: { tab?: string } } };
      };
      expect(stored.domains?.bench?.ui?.tab).toBe('tasks');
    } finally {
      delete (navigator as { locks?: unknown }).locks;
    }
  });
});
