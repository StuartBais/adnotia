import './bench.css';
import {
  createStore,
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
} from '../kernel/store';
import { mountBench } from './app';

// Its own key, so the prototype never reads or writes the first build's
// document, and a passcode set there cannot lock it.
const KEY = 'adnotia-bench';

async function boot(): Promise<void> {
  const container = document.getElementById('bench');
  if (!container) return;
  const persistent = isLocalStorageAvailable();
  const store = createStore({
    adapter: persistent ? localStorageAdapter() : memoryStorageAdapter(),
    key: KEY,
  });
  await store.load();
  mountBench({ store, container });
  // Best effort: write the last change before the page goes away.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void store.flush();
  });
}

void boot();
