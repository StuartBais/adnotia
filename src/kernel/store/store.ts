// The store.
//
// Modules see one namespaced slice and never the path to it. In the Adult space
// that is `modules.<id>`; in the Family space it is
// `family.children[<profileId>].modules.<id>`, one slice per child, so two
// children's data never mix and a profile deletes cleanly.
//
// Every write persists the whole document, debounced. See
// docs/05-architecture.md "Store" and docs/01-module-contract.md "State".

import {
  createDocument,
  isDocumentShaped,
  DOCUMENT_KEY,
  type AdnotiaDocument,
  type KernelState,
  type FamilyState,
  type ModuleSlice,
  type Space,
} from './document';
import { plainJsonCodec, type DocumentCodec } from './codec';
import { memoryStorageAdapter, type StorageAdapter } from './adapters';

/** What a module is handed. Anything not here is not available to a module. */
export interface Store {
  get<T>(sliceId: string): Readonly<T> | undefined;
  set<T>(sliceId: string, next: T): void;
  subscribe(sliceId: string, listener: () => void): () => void;
}

export interface KernelStore extends Store {
  /** The whole document, frozen. For the kernel, backups and reports. */
  document(): Readonly<AdnotiaDocument>;
  /** Read from storage. Creates a document when there is nothing stored. */
  load(): Promise<void>;
  /** Persist now rather than on the debounce. */
  flush(): Promise<void>;
  setCodec(next: DocumentCodec, passcodeEnabled: boolean): Promise<void>;
  replaceDocument(next: AdnotiaDocument): void;
  persistence(): 'saved' | 'pending' | 'error';
  subscribePersistence(listener: () => void): () => void;
  persistenceError(): unknown;
  space(): Space;
  useSpace(space: Space): void;
  profile(): string | undefined;
  /** Choose the child profile that Family-space slices resolve against. */
  useProfile(profileId: string | undefined): void;
  /** Kernel-only writes. Modules never write outside their slice. */
  updateKernel(update: (kernel: Readonly<KernelState>) => KernelState): void;
  /**
   * Kernel-only writes to the child profiles. A module never sees this: it sees
   * one slice, scoped to the profile in use, and cannot tell there are others.
   */
  updateFamily(update: (family: Readonly<FamilyState>) => FamilyState): void;
  /** Remove a slice entirely. Explicit and separate from disabling a module. */
  deleteSlice(sliceId: string): void;
  /** Stop the debounce timer. No timer outlives the page. */
  dispose(): void;
}

export interface CreateStoreOptions {
  adapter?: StorageAdapter;
  codec?: DocumentCodec;
  key?: string;
  /** docs/05-architecture.md: persistence is debounced 500 ms. */
  debounceMs?: number;
  now?: () => Date;
  /**
   * Storage can fail: a full quota, a private window, a host that refuses.
   * Losing a write silently is the one thing this app must not do.
   */
  onPersistError?: (error: unknown) => void;
}

/** Recursively freeze, so a caller cannot mutate the document by holding a slice. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const held of Object.values(value as Record<string, unknown>)) deepFreeze(held);
  return Object.freeze(value);
}

/** A defensive copy, so what a caller keeps is never what the document holds. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createStore(options: CreateStoreOptions = {}): KernelStore {
  const {
    adapter = memoryStorageAdapter(),
    codec: initialCodec = plainJsonCodec,
    key = DOCUMENT_KEY,
    debounceMs = 500,
    now = () => new Date(),
    onPersistError,
  } = options;

  let codec = initialCodec;
  let document = createDocument({ now: now() });
  let profileId: string | undefined;
  let persistenceError: unknown;

  const listeners = new Map<string, Set<() => void>>();
  const persistenceListeners = new Set<() => void>();
  let persistence: 'saved' | 'pending' | 'error' = 'saved';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let writing: Promise<void> = Promise.resolve();

  function notify(sliceId: string): void {
    for (const listener of listeners.get(sliceId) ?? []) listener();
  }

  function setPersistence(next: typeof persistence): void {
    if (persistence === next) return;
    persistence = next;
    for (const listener of persistenceListeners) listener();
  }

  function enqueueWrite(operation: () => Promise<void>): Promise<void> {
    setPersistence('pending');
    // Chained so two writes cannot interleave and leave a torn document.
    const pending = writing.then(async () => {
      try {
        await operation();
      } catch (error) {
        persistenceError = error;
        setPersistence('error');
        onPersistError?.(error);
        throw error;
      }
    });
    writing = pending.catch(() => undefined);
    return pending;
  }

  function persistNow(): Promise<void> {
    return enqueueWrite(async () => {
      const snapshot = document;
      await adapter.write(key, await codec.encode(snapshot));
      if (document === snapshot) setPersistence('saved');
    });
  }

  function schedulePersist(): void {
    setPersistence('pending');
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void persistNow().catch(() => undefined);
    }, debounceMs);
  }

  /** The container a slice id resolves against in the current space and profile. */
  function slices(): Record<string, ModuleSlice> {
    if (document.space === 'adult') return document.modules;

    if (profileId === undefined) {
      throw new Error(
        'No child profile is selected, so there is no Family slice to read or write. ' +
          'Call useProfile() first.',
      );
    }
    const child = document.family.children[profileId];
    if (child === undefined) {
      throw new Error(`No child profile ${profileId}.`);
    }
    return child.modules;
  }

  function replace(next: AdnotiaDocument): void {
    document = deepFreeze(next);
  }

  return {
    document() {
      return document;
    },

    persistence() {
      return persistence;
    },

    persistenceError() {
      return persistenceError;
    },

    subscribePersistence(listener) {
      persistenceListeners.add(listener);
      return () => {
        persistenceListeners.delete(listener);
      };
    },

    async load() {
      let raw: string | null = null;
      try {
        raw = await adapter.read(key);
      } catch (error) {
        onPersistError?.(error);
        throw error;
      }

      if (raw === null) {
        replace(createDocument({ now: now() }));
        return;
      }

      const decoded = await codec.decode(raw);
      // Anything unrecognisable is left alone rather than overwritten: a
      // document this build cannot read may still be readable by another.
      if (!isDocumentShaped(decoded)) {
        throw new Error(`What is stored under ${key} is not an Adnotia document.`);
      }
      replace(decoded);
    },

    async flush() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      await persistNow();
    },

    setCodec(next, passcodeEnabled) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      return enqueueWrite(async () => {
        const snapshot = document;
        const secured = clone(snapshot);
        secured.kernel.settings.passcodeEnabled = passcodeEnabled;
        await adapter.write(key, await next.encode(secured));
        codec = next;
        if (document === snapshot) {
          replace(secured);
          setPersistence('saved');
        } else {
          const latest = clone(document);
          latest.kernel.settings.passcodeEnabled = passcodeEnabled;
          replace(latest);
          schedulePersist();
        }
        notify('kernel');
      });
    },

    replaceDocument(next) {
      if (!isDocumentShaped(next)) throw new Error('That is not an Adnotia document.');
      replace(clone(next));
      if (
        document.space === 'adult' ||
        (profileId !== undefined && !document.family.children[profileId])
      ) {
        profileId = undefined;
      }
      for (const sliceId of listeners.keys()) notify(sliceId);
      schedulePersist();
    },

    space() {
      return document.space;
    },

    useSpace(space) {
      if (document.space === space) return;
      replace({ ...clone(document), space });
      // A space change invalidates the profile, which belongs to the Family space.
      if (space === 'adult') profileId = undefined;
      schedulePersist();
    },

    profile() {
      return profileId;
    },

    useProfile(next) {
      profileId = next;
    },

    get<T>(sliceId: string) {
      return slices()[sliceId] as Readonly<T> | undefined;
    },

    set<T>(sliceId: string, next: T) {
      const copy = deepFreeze(clone(next)) as unknown as ModuleSlice;
      const doc = clone(document);

      if (doc.space === 'adult') {
        doc.modules[sliceId] = copy;
      } else {
        if (profileId === undefined) {
          throw new Error(
            'No child profile is selected, so there is no Family slice to write. ' +
              'Call useProfile() first.',
          );
        }
        const child = doc.family.children[profileId];
        if (child === undefined) throw new Error(`No child profile ${profileId}.`);
        child.modules[sliceId] = copy;
      }

      replace(doc);
      notify(sliceId);
      schedulePersist();
    },

    deleteSlice(sliceId) {
      const doc = clone(document);
      if (doc.space === 'adult') {
        delete doc.modules[sliceId];
      } else {
        if (profileId === undefined) throw new Error('No child profile is selected.');
        const child = doc.family.children[profileId];
        if (child === undefined) throw new Error(`No child profile ${profileId}.`);
        delete child.modules[sliceId];
      }
      replace(doc);
      notify(sliceId);
      schedulePersist();
    },

    updateFamily(update) {
      const doc = clone(document);
      doc.family = update(doc.family);
      replace(doc);
      // Every slice in the current space may have moved, and the profile in use
      // may have been deleted out from under the caller.
      if (profileId !== undefined && doc.family.children[profileId] === undefined) {
        profileId = undefined;
      }
      for (const sliceId of listeners.keys()) notify(sliceId);
      schedulePersist();
    },

    updateKernel(update) {
      const doc = clone(document);
      doc.kernel = update(doc.kernel);
      replace(doc);
      notify('kernel');
      schedulePersist();
    },

    subscribe(sliceId, listener) {
      let set = listeners.get(sliceId);
      if (set === undefined) {
        set = new Set();
        listeners.set(sliceId, set);
      }
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(sliceId);
      };
    },

    dispose() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    },
  };
}
