// Where the document is persisted.
//
// `localStorage` is the default. The interface exists so the app can be embedded
// in a host that supplies its own storage, which docs/05-architecture.md calls
// the host storage adapter. Nothing here touches the network, and there is no
// adapter that could.

export class StorageChangedError extends Error {
  constructor() {
    super('Data changed in another tab. Download a backup of changes here before reloading.');
    this.name = 'StorageChangedError';
  }
}

/**
 * Refuses a write when what is stored is not what this tab last read or wrote
 * (ADR-016). Where the browser has Web Locks, the check and the write run
 * inside one, so they are atomic between tabs. `lock: false` leaves the lock
 * out: a lock's callback is a task, so a write started as the page goes away
 * may never run, while without it a plain codec checks and writes within the
 * same task. The prototype at /bench/ takes that trade; the app does not.
 */
export function guardedStorageAdapter(
  adapter: StorageAdapter,
  documentKey: string,
  initial: string | null,
  options: { lock?: boolean } = {},
): StorageAdapter {
  const { lock = true } = options;
  let expected = initial;
  async function change(key: string, value: string | null): Promise<void> {
    const write = async () => {
      if (key === documentKey && (await adapter.read(key)) !== expected)
        throw new StorageChangedError();
      if (value === null) await adapter.remove(key);
      else await adapter.write(key, value);
      if (key === documentKey) expected = value;
    };
    const locks = lock ? globalThis.navigator?.locks : undefined;
    if (locks) await locks.request(`${documentKey}:write`, write);
    else await write();
  }
  return {
    read: (key) => adapter.read(key),
    write: (key, value) => change(key, value),
    remove: (key) => change(key, null),
  };
}

export interface StorageAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * True when `localStorage` can actually be used. Safari in private mode and
 * some embedded webviews expose the object and throw on use, so this writes.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__adnotia_probe__';
    globalThis.localStorage.setItem(probe, probe);
    globalThis.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function localStorageAdapter(): StorageAdapter {
  return {
    async read(key) {
      return globalThis.localStorage.getItem(key);
    },
    async write(key, value) {
      globalThis.localStorage.setItem(key, value);
    },
    async remove(key) {
      globalThis.localStorage.removeItem(key);
    },
  };
}

/** In-memory storage, for tests and for a host that supplies nothing. */
export function memoryStorageAdapter(seed: Readonly<Record<string, string>> = {}): StorageAdapter {
  const held = new Map<string, string>(Object.entries(seed));
  return {
    async read(key) {
      return held.get(key) ?? null;
    },
    async write(key, value) {
      held.set(key, value);
    },
    async remove(key) {
      held.delete(key);
    },
  };
}
