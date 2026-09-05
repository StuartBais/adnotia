// Boot.
//
// Milestone 0: the shell opens to first run with no modules registered. The
// medication log arrives in Milestone 1; see docs/08-roadmap.md.

import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';

import {
  createStore,
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
  migrateDocument,
  mountShell,
  MODULES,
  V0_KEY,
} from './kernel/index';

const app = document.querySelector<HTMLElement>('#app');

async function boot(root: HTMLElement): Promise<void> {
  // A browser with storage blocked still runs; it just forgets on close, and
  // the app says so rather than failing at the first write.
  const usable = isLocalStorageAvailable();
  const store = createStore({
    adapter: usable ? localStorageAdapter() : memoryStorageAdapter(),
    onPersistError: () => {
      // Losing a write silently is the one thing this app must not do.
      console.error('Adnotia could not save. Download a backup so you do not lose today.');
    },
  });

  await store.load();

  // A document from the v0 monolith, still under its own key. The old key is
  // left untouched until the person confirms the import worked.
  if (usable && store.document().kernel.settings.firstRunComplete !== true) {
    const v0 = globalThis.localStorage.getItem(V0_KEY);
    if (v0 !== null && v0 !== '') {
      try {
        const imported = migrateDocument(JSON.parse(v0));
        store.updateKernel(() => ({
          ...imported.kernel,
          settings: { ...imported.kernel.settings, firstRunComplete: true },
        }));
        for (const [id, slice] of Object.entries(imported.modules)) store.set(id, slice);
      } catch {
        // An encrypted v0 document needs the passcode first. Left for the
        // unlock flow rather than guessed at here.
      }
    }
  }

  mountShell({ store, container: root, modules: MODULES });

  if (!usable) {
    const warning = document.createElement('p');
    warning.className = 'hint';
    warning.textContent =
      'This browser is not letting Adnotia save anything, so nothing will be here next time.';
    root.prepend(warning);
  }
}

if (app) void boot(app);
