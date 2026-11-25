// Mounting the prototype in a test, and reading it the way a person and a
// screen reader do. Shared by screens.test.ts and never.test.ts.

import { vi } from 'vitest';
import { createStore, memoryStorageAdapter, type KernelStore } from '../../src/kernel/store';
import { ANNOUNCE_AFTER, UNDO_MS, mountBench } from '../../src/bench/app';
import type { ScenarioId } from '../../src/bench/example';
import { loadScenario, migrateBench, type BenchDomains } from '../../src/bench/state';

export interface Mounted {
  store: KernelStore;
  container: HTMLElement;
  /** The moment the prototype is told it is. Move it, then tick. */
  clock: { now: Date };
  /** The tap guard's clock, in ms. It only goes forward; see settle(). */
  mono: { now: number };
  destroy(): void;
}

let current: Mounted | undefined;

/**
 * The prototype on a memory store at `at` (local time), loaded with a
 * scenario as its button would load it, optionally changed after.
 */
export async function mount(
  at: string,
  scenario: ScenarioId | 'nothing' = 'example',
  edit?: (state: BenchDomains, now: Date) => BenchDomains,
): Promise<Mounted> {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const clock = { now: new Date(at) };
  const store = createStore({
    adapter: memoryStorageAdapter(),
    key: 'adnotia-bench',
    now: () => clock.now,
  });
  await store.load();
  if (scenario !== 'nothing') {
    let state = migrateBench(store.document().domains, clock.now);
    state = loadScenario(state, scenario, clock.now);
    if (edit) state = edit(state, clock.now);
    store.updateDomains(() => state);
  }
  const container = document.createElement('div');
  document.body.append(container);
  const mono = { now: 0 };
  const bench = mountBench({
    store,
    container,
    now: () => clock.now,
    monotonic: () => mono.now,
    confirm: () => true,
  });
  // The screen has been in the hand a while: launch's half second is over.
  mono.now = 10_000;
  current = {
    store,
    container,
    clock,
    mono,
    destroy() {
      bench.destroy();
      container.remove();
      store.dispose();
      vi.useRealTimers();
    },
  };
  return current;
}

export function unmount(): void {
  current?.destroy();
  current = undefined;
}

/** Moves the clock on and lets the ticker run up to it. */
export function advance(mounted: Mounted, minutes: number): void {
  mounted.clock.now = new Date(mounted.clock.now.getTime() + minutes * 60_000);
  const ms = Math.max(1000, Math.min(minutes * 60_000, 60_000));
  mounted.mono.now += ms;
  vi.advanceTimersByTime(ms);
}

/**
 * Lets the tap guard's clock run on by `ms` (by default, past any guard), as
 * a person's hand takes a moment between one screen and the next tap.
 */
export function settle(mounted: Mounted, ms = 2000): void {
  mounted.mono.now += ms;
}

/**
 * What the live region says once it has spoken: it is emptied on each
 * announcement and filled a moment later, so a repeat is read again.
 */
export function said(mounted: Mounted): string {
  vi.advanceTimersByTime(ANNOUNCE_AFTER);
  return mounted.container.querySelector('.live')?.textContent ?? '';
}

/** Lets the six seconds of an Undo run out. */
export function outlastUndo(): void {
  vi.advanceTimersByTime(UNDO_MS);
}

/**
 * Safari's edge swipe, or the back button: one step back in history, and the
 * popstate that follows it. jsdom moves through history on its timers.
 */
export function goBack(): void {
  history.back();
  vi.advanceTimersByTime(1);
}

/** How many levels above the tab the current history entry stands for. */
export const historyDepth = (): unknown => (history.state as { depth?: unknown } | null)?.depth;

const state = (mounted: Mounted) => mounted.store.document().domains as BenchDomains;
export { state as stateOf };

// ---------------------------------------------------------------- reading it

const hiddenFromReaders = (node: Element): boolean =>
  node.closest('[aria-hidden="true"], [hidden], [inert], .live') !== null;

/** A control's accessible name: its label, or its text read without hidden parts. */
export function nameOf(node: Element): string {
  const label = node.getAttribute('aria-label');
  if (label !== null) return label;
  return readText(node);
}

/** Text as a screen reader reaches it: hidden subtrees skipped. */
export function readText(node: Node): string {
  if (node instanceof Element && node.closest('[aria-hidden="true"], [hidden]')) return '';
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  let out = '';
  for (const child of node.childNodes) out += readText(child);
  return out.replace(/\s+/g, ' ').trim();
}

/** The hint read after a control's name, through aria-describedby. */
export function hintOf(node: Element): string | undefined {
  const ids = node.getAttribute('aria-describedby');
  if (!ids) return undefined;
  return ids
    .split(/\s+/)
    .map((id) => node.ownerDocument.getElementById(id)?.textContent ?? '')
    .join(' ');
}

const CONTROLS = 'button, a[href], input, textarea, select';

/**
 * What a screen reader reads, in order: controls by name, headings and
 * paragraphs by their text (SPEC 11 "Reading order"). Hidden and inert parts
 * are skipped.
 */
export function readingOrder(container: HTMLElement): string[] {
  const out: string[] = [];
  const walk = (node: Element) => {
    if (hiddenFromReaders(node)) return;
    if (node.matches(CONTROLS)) {
      out.push(nameOf(node));
      return;
    }
    // The bar where it is read alone, in Focus: a meter, by its name (SPEC 11).
    if (node.matches('[role="meter"]')) {
      out.push(nameOf(node));
      return;
    }
    if (node.matches('h1, h2, h3, p, li[aria-label]')) {
      const text = node.matches('li[aria-label]') ? nameOf(node) : readText(node);
      if (text) out.push(text);
      if (!node.querySelector(CONTROLS)) return;
    }
    for (const child of node.children) walk(child);
  };
  walk(container);
  return out;
}

/** Every control a person can reach. */
export function controls(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(CONTROLS)].filter(
    (node) => !hiddenFromReaders(node),
  );
}

/**
 * The main choices on a screen (SPEC 3 "Counting the five choices"): the
 * frame is not counted (the tabs, Me, a back control, "⋯" and the drawer's
 * handle, which on the open drawer is Hide), and a list counts once however
 * many rows it has. The six-second Undo, on the Next line or Focus's foot, is
 * counted as frame (SPEC 5.4).
 */
export function choices(container: HTMLElement): number {
  let lists = 0;
  const seen = new Set<Element>();
  let count = 0;
  for (const node of controls(container)) {
    if (node.closest('nav') || node.classList.contains('me')) continue;
    if (['b-handle', 'b-hide', 'b-back', 'f-back', 'b-undo'].includes(node.id)) continue;
    const list = node.closest('.list');
    if (list) {
      if (!seen.has(list)) {
        seen.add(list);
        lists++;
      }
      continue;
    }
    count++;
  }
  return count + lists;
}

/** The control with this accessible name, or a failure that shows what there is. */
export function button(container: HTMLElement, name: string | RegExp): HTMLElement {
  const found = controls(container).find((node) =>
    typeof name === 'string' ? nameOf(node) === name : name.test(nameOf(node)),
  );
  if (!found) {
    throw new Error(
      `No control named ${String(name)}. There are: ${controls(container).map(nameOf).join(' | ')}`,
    );
  }
  return found;
}

export const press = (container: HTMLElement, name: string | RegExp): void =>
  button(container, name).click();

/** Everything visible, as one string, for words that must or must not appear. */
export const visibleText = (container: HTMLElement): string =>
  (container.textContent ?? '').replace(/\s+/g, ' ');
