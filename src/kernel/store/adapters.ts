// Where the document is persisted.
//
// `localStorage` is the default. The interface exists so the app can be embedded
// in a host that supplies its own storage, which docs/05-architecture.md calls
// the host storage adapter. Nothing here touches the network, and there is no
// adapter that could.

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
