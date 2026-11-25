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
  const adapter =
    options.adapter ?? (isLocalStorageAvailable() ? localStorageAdapter() : memoryStorageAdapter());
  const now = options.now ?? (() => new Date());
  const confirm = options.confirm ?? ((question: string) => window.confirm(question));

  let store: KernelStore | undefined;
  let bench: { destroy(): void } | undefined;
  let destroyed = false;

  async function open(): Promise<void> {
    const candidate = createStore({ adapter, key: KEY, codec: migratingCodec, now });
    try {
      await candidate.load();
    } catch {
      candidate.dispose();
      if (!destroyed) failed();
      return;
    }
    if (destroyed) {
      candidate.dispose();
      return;
    }
    store = candidate;
    bench = mountBench({ store, container, now, confirm });
    // Best effort: write the last change before the page goes away.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void candidate.flush();
    });
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

  await open();

  return {
    destroy() {
      destroyed = true;
      bench?.destroy();
      store?.dispose();
    },
  };
}
