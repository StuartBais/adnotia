// Mounting the prototype in a test, and reading it the way a person and a
// screen reader do. Shared by screens.test.ts and never.test.ts.

import { vi } from 'vitest';
import {
  createStore,
  memoryStorageAdapter,
  type DomainsState,
  type KernelStore,
  type StorageAdapter,
} from '../../src/kernel/store';
import {
  ANNOUNCE_AFTER,
  DRAFT_AFTER,
  FOCUS_FADE_MS,
  SHEET_FADE_MS,
  UNDO_MS,
  mountBench,
} from '../../src/bench/app';
import type { ScenarioId } from '../../src/bench/example';
import { loadScenario, migrateBench, type BenchDomains } from '../../src/bench/state';

export interface Mounted {
  store: KernelStore;
  /** What the store persists to: what a reload boots from. */
  storage: StorageAdapter;
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
  return start(new Date(at), (state, now) => {
    if (scenario === 'nothing') return undefined;
    const loaded = loadScenario(migrateBench(state, now), scenario, now);
    return edit ? edit(loaded, now) : loaded;
  });
}

/**
 * A reload: the page goes away as Safari's would (pagehide, unless `hide` is
 * false, as for a page killed before it could say so), and a fresh load
 * `minutesAway` later boots from exactly what reached storage, history and
 * all. A write still waiting on the store's debounce is lost, as it would be.
 */
export async function reload(
  mounted: Mounted,
  minutesAway: number,
  options: { hide?: boolean; edit?: (state: BenchDomains) => BenchDomains } = {},
): Promise<Mounted> {
  if (options.hide ?? true) window.dispatchEvent(new Event('pagehide'));
  // Let what pagehide sent to storage land. Only promises stand between the
  // flush and the adapter, so this runs no timer the page holds.
  await new Promise<void>((resolve) => setImmediate(resolve));
  const at = new Date(mounted.clock.now.getTime() + minutesAway * 60_000);
  if (current === mounted) unmount();
  else mounted.destroy();
  const { edit } = options;
  return start(at, (state) => (edit ? edit(state as BenchDomains) : undefined), mounted.storage);
}

async function start(
  at: Date,
  seed: (state: DomainsState, now: Date) => DomainsState | undefined,
  storage: StorageAdapter = memoryStorageAdapter(),
): Promise<Mounted> {
  // Frames too: the drawer follows a finger, and springs, a frame at a time.
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
  const clock = { now: at };
  const store = createStore({
    adapter: storage,
    key: 'adnotia-bench',
    now: () => clock.now,
  });
  await store.load();
  const seeded = seed(store.document().domains, clock.now);
  if (seeded) store.updateDomains(() => seeded);
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
    storage,
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

/** Lets Focus's 200 ms fade out run its course, as it closes (SPEC 10). */
export function outlastFade(): void {
  vi.advanceTimersByTime(FOCUS_FADE_MS);
}

/** Lets the capture sheet's 200 ms fade out run its course, as it closes (SPEC 10). */
export function outlastSheet(): void {
  vi.advanceTimersByTime(SHEET_FADE_MS);
}

/**
 * Typing into the capture field: its words, then the input event a keyboard
 * sends, then the moment after which the draft is kept.
 */
export function type(mounted: Mounted, text: string): HTMLInputElement {
  const field = mounted.container.querySelector<HTMLInputElement>('#c-field');
  if (!field) throw new Error('No capture field: the sheet is not open');
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  vi.advanceTimersByTime(DRAFT_AFTER);
  return field;
}

// ---------------------------------------------------------------- the drawer in the hand

/** Where the drawer's top rests at 390 × 844 with the board's insets (SPEC 9.8). */
export const BOARD_STOPS: Readonly<Record<string, number>> = {
  open: 60,
  half: 366,
  folded: 684,
  lip: 730,
};

/**
 * The frame laid out as on the board, which jsdom does not do: the app 390 ×
 * 844, and the drawer's resting places where its probes would measure them.
 * Everything else measures as jsdom does, at nothing. Undone after each test.
 */
export function layOut(): void {
  const real = Element.prototype.getBoundingClientRect;
  const box = (top: number, height: number, width: number) =>
    ({
      x: 0,
      y: top,
      left: 0,
      top,
      width,
      height,
      right: width,
      bottom: top + height,
      toJSON: () => ({}),
    }) as DOMRect;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this.classList.contains('app')) return box(0, 844, 390);
    const probe = this instanceof HTMLElement ? this.dataset['probe'] : undefined;
    if (probe !== undefined) return box(BOARD_STOPS[probe] ?? 0, 0, 0);
    return real.call(this);
  });
}

const pointer = (type: string, clientY: number) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientY, pointerId: 7 });

/**
 * A finger on `on`: down at the first y, then to each y after it, `every`
 * ms apart with a frame between, then lifted unless `up` is false. With the
 * default pace and a moment's hold before lifting, it lets go with no
 * speed, so it rests at the place nearest where it let go. Lifted, it sends
 * the click a mouse sends; `click: false` is a touch that moved, which
 * sends none.
 */
export function pull(
  mounted: Mounted,
  on: Element,
  ys: number[],
  { every = 200, up = true, click = true }: { every?: number; up?: boolean; click?: boolean } = {},
): void {
  const [first, ...rest] = ys;
  // Where a captured pointer's click goes, should what was pressed be gone.
  const surface = on.closest('.drawer, .foot') ?? on;
  on.dispatchEvent(pointer('pointerdown', first ?? 0));
  for (const y of rest) {
    mounted.mono.now += every;
    on.dispatchEvent(pointer('pointermove', y));
    vi.advanceTimersByTime(16);
  }
  if (up) {
    mounted.mono.now += every;
    on.dispatchEvent(pointer('pointerup', ys[ys.length - 1] ?? 0));
    if (click) {
      (on.isConnected ? on : surface).dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
    }
  }
}

/** Lets the drawer's spring run for `ms`, a frame every 16 ms. */
export function fly(mounted: Mounted, ms = 800): void {
  for (let spent = 0; spent < ms; spent += 16) {
    mounted.mono.now += 16;
    vi.advanceTimersByTime(16);
  }
}

/** How many levels above the tab the current history entry stands for. */
export const historyDepth = (): unknown => (history.state as { depth?: unknown } | null)?.depth;

const state = (mounted: Mounted) => mounted.store.document().domains as BenchDomains;
export { state as stateOf };

// ---------------------------------------------------------------- reading it

const hiddenFromReaders = (node: Element): boolean =>
  node.closest('[aria-hidden="true"], [hidden], [inert], .live') !== null;

/** A control's accessible name: its label, what labels it, or its text read without hidden parts. */
export function nameOf(node: Element): string {
  const label = node.getAttribute('aria-label');
  if (label !== null) return label;
  const by = node.getAttribute('aria-labelledby');
  if (by !== null) {
    return by
      .split(/\s+/)
      .map((id) => node.ownerDocument.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
  }
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
 * paragraphs by their text (SPEC 11 "Reading order"), and any other text it
 * would come to on its way, so words kept for a hint or a label that are
 * also read where they stand show up as read twice. Hidden and inert parts
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
      for (const child of node.children) walk(child);
      return;
    }
    for (const child of node.childNodes) {
      if (child instanceof Element) walk(child);
      else if (child.nodeType === Node.TEXT_NODE) {
        const text = (child.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (text) out.push(text);
      }
    }
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
 * many rows it has, as a switch of parts does ("Inbox or Today", SPEC 5.5),
 * the Tasks switcher, and How long's −5 and +5 around its minutes.
 * The six-second Undo, on the Next line or Focus's foot, is counted as frame
 * (SPEC 5.4), and so is Me carried above the capture sheet.
 */
export function choices(container: HTMLElement): number {
  let lists = 0;
  const seen = new Set<Element>();
  let count = 0;
  for (const node of controls(container)) {
    if (node.closest('nav') || node.classList.contains('me')) continue;
    if (['b-handle', 'b-hide', 'b-back', 'f-back', 'b-undo', 'c-me', 'b-more'].includes(node.id)) {
      continue;
    }
    const list = node.closest('.list, [data-list], [role="radiogroup"], [role="tablist"]');
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

/**
 * The control with this accessible name, or a failure that shows what there
 * is. A plain button is found before a tab or a radio of the same name, as a
 * person asking for the button "Today" means the tab bar's, not the Tasks
 * switcher's (which pressTab finds) or capture's Today.
 */
export function button(container: HTMLElement, name: string | RegExp): HTMLElement {
  const named = controls(container).filter((node) =>
    typeof name === 'string' ? nameOf(node) === name : name.test(nameOf(node)),
  );
  const plain = (node: HTMLElement) => {
    const role = node.getAttribute('role');
    return role === null || role === 'button';
  };
  const found = named.find(plain) ?? named[0];
  if (!found) {
    throw new Error(
      `No control named ${String(name)}. There are: ${controls(container).map(nameOf).join(' | ')}`,
    );
  }
  return found;
}

export const press = (container: HTMLElement, name: string | RegExp): void =>
  button(container, name).click();

/** A part of a tab list by its name: the Tasks switcher's "Today", say. */
export function pressTab(container: HTMLElement, name: string): void {
  const found = controls(container).find(
    (node) => node.getAttribute('role') === 'tab' && nameOf(node) === name,
  );
  if (!found) throw new Error(`No tab named ${name}`);
  found.click();
}

/**
 * Text as it is drawn for a sighted person: the visually hidden words kept
 * for screen readers (.vh) and hidden parts are skipped, and words hidden
 * only from screen readers are kept, because they are on the screen.
 */
export function drawnText(node: Node): string {
  const raw = (part: Node): string => {
    if (part instanceof Element && part.closest('.vh, [hidden], .live')) return '';
    if (part.nodeType === Node.TEXT_NODE) return part.textContent ?? '';
    let out = '';
    for (const child of part.childNodes) out += raw(child);
    return out;
  };
  return raw(node).replace(/\s+/g, ' ').trim();
}

/** Everything visible, as one string, for words that must or must not appear. */
export const visibleText = (container: HTMLElement): string =>
  (container.textContent ?? '').replace(/\s+/g, ' ');
