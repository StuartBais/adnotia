import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  guardedStorageAdapter,
  memoryStorageAdapter,
  StorageChangedError,
} from '../../src/kernel/store/adapters';
import { createStore } from '../../src/kernel/store/store';
import { createDocument, DOCUMENT_KEY } from '../../src/kernel/store/document';
import { createPasscodeCodec } from '../../src/kernel/crypto/codec';

describe('stale-tab protection', () => {
  it('does not let an older plaintext tab overwrite newly encrypted data', async () => {
    const initial = JSON.stringify(createDocument());
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: initial });
    const first = createStore({
      adapter: guardedStorageAdapter(adapter, DOCUMENT_KEY, initial),
    });
    const stale = createStore({
      adapter: guardedStorageAdapter(adapter, DOCUMENT_KEY, initial),
    });
    await first.load();
    await stale.load();
    try {
      await first.setCodec(await createPasscodeCodec('123456', { iterations: 1000 }), true);
      const encrypted = await adapter.read(DOCUMENT_KEY);
      stale.set('sleep', { version: 1, note: 'Unsaved local changes' });
      await expect(stale.flush()).rejects.toBeInstanceOf(StorageChangedError);
      expect(await adapter.read(DOCUMENT_KEY)).toBe(encrypted);
      expect(stale.get('sleep')).toEqual({
        version: 1,
        note: 'Unsaved local changes',
      });
    } finally {
      first.dispose();
      stale.dispose();
    }
  });
});

describe('the write lock', () => {
  // jsdom has no Web Locks. This stand-in runs the callback as a task, as a
  // browser does, and records each lock asked for.
  const asked: string[] = [];
  beforeEach(() => {
    asked.length = 0;
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: (name: string, callback: () => Promise<void>) => {
          asked.push(name);
          return new Promise<void>((resolve, reject) =>
            setTimeout(() => void callback().then(resolve, reject), 0),
          );
        },
      },
    });
  });
  afterEach(() => {
    delete (navigator as { locks?: unknown }).locks;
  });

  it('takes the lock around the check and the write by default', async () => {
    const adapter = memoryStorageAdapter();
    const guarded = guardedStorageAdapter(adapter, DOCUMENT_KEY, null);
    await guarded.write(DOCUMENT_KEY, 'next');
    expect(asked).toEqual([`${DOCUMENT_KEY}:write`]);
    expect(await adapter.read(DOCUMENT_KEY)).toBe('next');
  });

  it('can check and write without it, inside the same task', async () => {
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: 'first' });
    const guarded = guardedStorageAdapter(adapter, DOCUMENT_KEY, 'first', { lock: false });
    // Not awaited: a page going away does not wait for the next task.
    void guarded.write(DOCUMENT_KEY, 'next');
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(asked).toEqual([]);
    expect(await adapter.read(DOCUMENT_KEY)).toBe('next');
    // And it still refuses to write over another tab's change.
    await adapter.write(DOCUMENT_KEY, 'from another tab');
    await expect(guarded.write(DOCUMENT_KEY, 'stale')).rejects.toBeInstanceOf(StorageChangedError);
    expect(await adapter.read(DOCUMENT_KEY)).toBe('from another tab');
  });
});
