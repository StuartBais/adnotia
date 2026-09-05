// Boot.
//
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';

import {
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
  MODULES,
} from './kernel/index';
import { mountApplication } from './kernel/shell/application';

const app = document.querySelector<HTMLElement>('#app');

async function boot(root: HTMLElement): Promise<void> {
  // A browser with storage blocked still runs; it just forgets on close, and
  // the app says so rather than failing at the first write.
  const usable = isLocalStorageAvailable();
  await mountApplication({
    adapter: usable ? localStorageAdapter() : memoryStorageAdapter(),
    container: root,
    modules: MODULES,
    storageAvailable: usable,
  });
}

if (app) void boot(app);
