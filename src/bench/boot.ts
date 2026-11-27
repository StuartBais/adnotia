// Starting the prototype (design/lantern/PROTOTYPE-PLAN.md section 5, main.ts).
//
// The store is built on its own key, `adnotia-bench`, so the prototype never
// reads or writes the first build's document and a passcode set there cannot
// lock it. Its codec brings what was stored up to the current schema on the
// way in, as the app's does (src/kernel/shell/application.ts), so a document
// written by an older build opens rather than failing on a missing `domains`.
//
// If what is stored cannot be read at all, one plain screen says so and
// changes nothing. Its "Start again" clears the prototype's own key, after a
// confirm, and nothing else.
//
// Two tabs of the prototype share that key. Its writes go through the app's
// guard (ADR-016), so a tab that read an older copy cannot write it over a
// newer one: it stops, and one plain screen says so. A tab shown again with
// nothing of its own waiting to be saved opens the newer copy quietly instead,
// which keeps that screen for the case it is for.

import {
  createStore,
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
  migrateDocument,
  plainJsonCodec,
  type DocumentCodec,
  type KernelStore,
  type StorageAdapter,
} from '../kernel/store';
import { guardedStorageAdapter, StorageChangedError } from '../kernel/store/adapters';
import { mountBench } from './app';
import { h } from './ui';

export const KEY = 'adnotia-bench';

/** The codec the prototype stores with: plain JSON, migrated on the way in. */
export const migratingCodec: DocumentCodec = {
  encode: (document) => plainJsonCodec.encode(document),
  decode: async (raw) => migrateDocument(await plainJsonCodec.decode(raw)),
};

export const FAILED = {
  title: 'This prototype could not read what it saved',
  body:
    'Nothing has been changed. Start again clears what the prototype keeps in this ' +
    'browser, and nothing else.',
  again: 'Start again',
  confirm: 'Clear what the prototype keeps in this browser and start again?',
} as const;

/**
 * Another tab of the prototype saved after this one read what was stored.
 * This tab stops saving rather than write its older copy over that, and says so.
 */
export const CHANGED = {
  title: 'This prototype was changed in another tab',
  body:
    'This tab has stopped saving, so that it does not write over that change. ' +
    'What was done in this tab since it last saved is not kept.',
  again: 'Open the newer copy',
} as const;

export interface StartOptions {
  container: HTMLElement;
  /** Where the document is kept. The browser's own storage unless a test says otherwise. */
  adapter?: StorageAdapter;
  now?: () => Date;
  confirm?: (question: string) => boolean;
}

export interface Started {
  destroy(): void;
}

export async function startBench(options: StartOptions): Promise<Started> {
  const { container } = options;
  // A browser that lets the prototype keep nothing (Safari blocking all
  // cookies) gets memory, and About says so rather than promising otherwise.
  const keeps = options.adapter !== undefined || isLocalStorageAvailable();
  const adapter = options.adapter ?? (keeps ? localStorageAdapter() : memoryStorageAdapter());
  const now = options.now ?? (() => new Date());
  const confirm = options.confirm ?? ((question: string) => window.confirm(question));

  let store: KernelStore | undefined;
  let bench: { destroy(): void } | undefined;
  let destroyed = false;
  /** What this tab last read or saved under its key: what the guard expects to find. */
  let seen: string | null = null;
  const tracked: StorageAdapter = {
    read: (key) => adapter.read(key),
    async write(key, value) {
      await adapter.write(key, value);
      if (key === KEY) seen = value;
    },
    async remove(key) {
      await adapter.remove(key);
      if (key === KEY) seen = null;
    },
  };

  async function open(): Promise<void> {
    let candidate: KernelStore | undefined;
    try {
      const source = await adapter.read(KEY);
      seen = source;
      candidate = createStore({
        // Without the guard's Web Lock: its callback is a task, and the write
        // app.ts starts on pagehide, which keeps where the person was across a
        // reload, has to land before the page goes. The plain codec checks and
        // writes within the event (src/kernel/store/adapters.ts).
        adapter: guardedStorageAdapter(tracked, KEY, source, { lock: false }),
        key: KEY,
        codec: migratingCodec,
        now,
        onPersistError: (error) => {
          if (error instanceof StorageChangedError && store === candidate) changed();
        },
      });
      await candidate.load();
    } catch {
      candidate?.dispose();
      if (!destroyed) failed();
      return;
    }
    if (destroyed) {
      candidate.dispose();
      return;
    }
    // The prototype writes where the person was and flushes when the page is
    // hidden or left (app.ts). A document that reads but has the wrong shape
    // inside throws here instead: mountBench takes down what it built, and
    // disposing the store drops the write it had waiting, so nothing changes.
    try {
      bench = mountBench({ store: candidate, container, now, confirm, keepsNothing: !keeps });
    } catch {
      candidate.dispose();
      if (!destroyed) failed();
      return;
    }
    store = candidate;
  }

  /** One plain screen in place of the prototype; its button opens what is stored now. */
  function changed(): void {
    if (destroyed) return;
    bench?.destroy();
    bench = undefined;
    store?.dispose();
    store = undefined;
    const again = h('button', {
      class: 'pill white pad',
      type: 'button',
      text: CHANGED.again,
      onclick: () => void open(),
    });
    container.replaceChildren(
      h(
        'main',
        { class: 'fail' },
        h('h1', { class: 't-idle', text: CHANGED.title }),
        h('p', { class: 't-row', text: CHANGED.body }),
        again,
      ),
    );
    // What had focus has gone with the prototype.
    again.focus();
  }

  function failed(): void {
    const again = h('button', {
      class: 'pill white pad',
      type: 'button',
      text: FAILED.again,
      onclick: () => {
        if (!confirm(FAILED.confirm)) return;
        void adapter
          .remove(KEY)
          .catch(() => undefined)
          .then(open);
      },
    });
    container.replaceChildren(
      h(
        'main',
        { class: 'fail' },
        h('h1', { class: 't-idle', text: FAILED.title }),
        h('p', { class: 't-row', text: FAILED.body }),
        again,
      ),
    );
  }

  /**
   * Coming back to this tab. When nothing of this tab's is waiting to be saved
   * and what is stored has moved on, another tab saved over this tab's last
   * save, which the guard only lets a tab do from that save or later: the
   * newer copy holds everything this tab had, so it is opened without a word.
   * The prototype's own wake may have queued a write by the time the read
   * comes back; that write comes from the older copy and goes with it.
   * Registered before the prototype mounts, so it runs before the prototype's
   * own wake on the same three events (clock.ts).
   */
  function onShow(): void {
    const at = store;
    if (destroyed || !at || document.visibilityState === 'hidden') return;
    if (at.persistence() !== 'saved') return;
    void adapter
      .read(KEY)
      .catch(() => seen)
      .then((stored) => {
        if (destroyed || store !== at || stored === seen) return;
        bench?.destroy();
        bench = undefined;
        at.dispose();
        store = undefined;
        return open();
      });
  }
  document.addEventListener('visibilitychange', onShow);
  window.addEventListener('pageshow', onShow);
  window.addEventListener('focus', onShow);

  await open();

  return {
    destroy() {
      destroyed = true;
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('pageshow', onShow);
      window.removeEventListener('focus', onShow);
      bench?.destroy();
      store?.dispose();
    },
  };
}
