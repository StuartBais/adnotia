// The benchmark prototype, in the design "Lantern, with the Now capsule"
// (design/lantern/SPEC.md, draft 6; ADR-047), running on the real task model.
//
// It exists to be held on a phone so the owner can decide how the phone apps
// are built (docs/09-product-brief.md, order of work, items 2 and 3). It is
// not the app: nothing links to it, and it keeps its data under its own
// storage key so it cannot touch the first build's.
//
// The screen is a stack of persistent layers (plan section 8): the current
// page, the fade behind the dock line, the stone drawer, the tabs, the dock
// line and a live region. A layer is rebuilt only when what it shows changes,
// judged by a cheap key; the ticker never rebuilds anything, and moves the bar,
// the minutes and the spoken labels in place. So a tick never takes away the
// person's focus, scroll or a tap in progress.
//
// Built so far (plan section 19, chunks 2 to 4): the frame, Today in every
// state, the drawer at rest at its lip, folded and half and open by tap, the
// capsule on the places and the open drawer, the tabs with bare places, Me
// with the crisis page, About with the scenario buttons, Focus, a layer over
// the current tab with its own history entry, and capture: a sheet over
// whatever is open, riding the keyboard, with its own history entry and a
// draft that outlives it.

import { emptyDomains, type KernelStore } from '../kernel/store';
import * as act from './actions';
import type { ScenarioId } from './example';
import {
  capsuleLook,
  capsuleMode,
  dayBoundary,
  drawerPositions,
  handleLabel,
  handleLines,
  loadScenario,
  migrateBench,
  nextLine,
  passSlots,
  present,
  timeFacts,
  wake,
  type BenchDomains,
  type BenchUi,
  type DrawerPosition,
  type NextLine,
  type Page,
  type Tab,
  type TaskList,
  type View,
} from './state';
import { createTicker, type Ticker } from './clock';
import { trackKeyboard } from './keyboard';
import {
  dock,
  foldedDrawer,
  halfDrawer,
  hideFoot,
  hints,
  openDrawer as openDrawerNodes,
  tabs,
  type Built,
  type DockProps,
} from './frame';
import { lampOf, todayScreen } from './screens/today';
import {
  BACK_TO,
  aboutScreen,
  crisisScreen,
  meScreen,
  placeScreen,
  taskScreen,
  ABOUT,
} from './screens/places';
import { settingsScreen, type SettingsView } from './screens/settings';
import { focusFoot, focusKey, focusScreen, type FocusActions } from './screens/focus';
import { captureSheet, type CaptureTo } from './screens/capture';
import { ANNOUNCE, T } from './strings';
import { h, injectSprite } from './ui';
import { resolve as rewardOptions, setOption } from '../domains/options';
import {
  dayList,
  idleKey,
  idleLitId,
  presentKey,
  presentLive,
  presentView,
  todayView,
  type PresentLive,
  type PresentView,
} from './view';

export interface BenchOptions {
  store: KernelStore;
  container: HTMLElement;
  now?: () => Date;
  /** Asked before anything is deleted. Replaceable so tests need no dialog. */
  confirm?: (question: string) => boolean;
  /**
   * Milliseconds on a clock that only goes forward, for the tap guard:
   * performance.now unless a test gives its own. Kept apart from `now`, which
   * the comparison harness fixes, so the guard runs out there as on a phone.
   */
  monotonic?: () => number;
}

/** Where the person is: the current tab, the pages pushed on it, and the Tasks list. */
interface Nav {
  tab: Tab;
  stack: Page[];
  list: TaskList;
}

const CHARCOAL = '#222624';
const MINUTE_MS = 60_000;
const WHITE = '#FFFFFF';

const TODAY: Nav = { tab: 'today', stack: [], list: 'inbox' };

/**
 * The tap guard (SPEC 5.1, plan section 12). Step done, Pause and Resume sit
 * where the capsule sits everywhere else, so on Today they ignore taps while
 * the capsule grows into the lantern and for a second after, and for half a
 * second after Today is reached any other way, launch included. Starting
 * values, to try on a phone (SPEC 14).
 */
export const TAP_GUARD = { morph: 350, afterCapsule: 1000, other: 500 } as const;

/** How long an undoable tap can be taken back (SPEC 9.8; an owner decision, SPEC 14). */
export const UNDO_MS = 6000;

interface UndoSlot {
  undo: act.Undo;
  /** The drawer was folded at the tap, so it stays folded to hold the Undo. */
  hold: boolean;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** The six seconds are over, but the pill has focus: it goes when focus does. */
  expired: boolean;
}

/** How long the live region stays empty before it says something (ms). */
export const ANNOUNCE_AFTER = 100;

/** Focus fades in whole, and out, over this long (SPEC 10, Reduce Motion). */
export const FOCUS_FADE_MS = 200;

/** The capture sheet fades in and out over the same 200 ms (SPEC 10, Reduce Motion). */
export const SHEET_FADE_MS = 200;

/** Typing in the capture field is kept as a draft this soon after it stops (ms). */
export const DRAFT_AFTER = 300;

/** Room between what is raised above the capture sheet and the sheet's top. */
const RAISED_GAP = 12;

/** The Screen Wake Lock, where the browser has one: feature-detected, never required. */
interface WakeLockLike {
  release(): Promise<void>;
  addEventListener?(type: 'release', listener: () => void): void;
}
interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockLike>;
}

export function mountBench(options: BenchOptions): { destroy(): void } {
  const { store, container } = options;
  const now = options.now ?? (() => new Date());
  const confirm = options.confirm ?? ((question: string) => window.confirm(question));
  const monotonic = options.monotonic ?? (() => performance.now());

  const read = () => store.document().domains as BenchDomains;
  const commit = (next: BenchDomains) => {
    if (next !== read()) store.updateDomains(() => next);
  };

  // ---------------------------------------------------------------- boot

  let nav: Nav = { ...TODAY };
  /** Focus is open over the current tab and its pages (plan section 8). */
  let focusOpen = false;
  let pendingScroll: Record<string, number> | undefined;
  {
    const t = now();
    const stored = store.document().domains;
    // Nothing stored at all: the board's day, relative to now (owner question 2).
    const firstOpen = stored['bench'] === undefined && stored.tasks.length === 0;
    let state = migrateBench(stored, t);
    if (firstOpen) state = loadScenario(state, 'example', t);
    const woken = wake(state, t, { boot: true });
    store.updateDomains(() => woken.state);
    const ui = woken.state.bench.ui;
    if (!firstOpen && woken.restore === 'exact' && ui) {
      nav = { tab: ui.tab, stack: [...ui.stack], list: ui.list };
      pendingScroll = ui.scroll;
      focusOpen = ui.focus !== undefined && present(woken.state, t).kind !== 'none';
    }
  }

  // ---------------------------------------------------------------- layers

  container.classList.add('app');
  container.replaceChildren();
  injectSprite(container);
  const layer = {
    screen: h('div', { class: 'screen' }),
    fade: h('div', { class: 'fade', 'aria-hidden': 'true', hidden: true }),
    dock: h('div', { class: 'dock', 'data-geo': 'dock' }),
    drawer: h('div', { class: 'drawer', 'data-geo': 'drawer' }),
    // "⌄ Hide" at the open drawer's foot: its own layer, so it is read after
    // the capsule and capture on the cover (SPEC 11, list 2).
    foot: h('div', { class: 'foot' }),
    tabs: h('div', { class: 'tabs' }),
    // Focus, over everything but the dock line (SPEC 5.4), in two layers: what
    // is above the dock line, read before it, and the foot, read after it
    // (SPEC 11, list 4).
    focus: h('div', { class: 'focus', hidden: true }),
    focusFoot: h('div', { class: 'ffoot', hidden: true }),
    // Capture's sheet, above everything, the dock line included (SPEC 5.5).
    sheet: h('div', { class: 'sheet-layer', hidden: true }),
    live: h('div', { class: 'live', 'aria-live': 'polite' }),
  };
  container.append(hints());

  // The keyboard, for the capture sheet to ride (plan section 13). The frame
  // is the layout viewport, so its height is what the sheet is placed in.
  const keyboard = trackKeyboard({
    root: document.documentElement,
    viewport: window.visualViewport ?? undefined,
    layoutHeight: () => container.getBoundingClientRect().height || window.innerHeight,
    onChange: () => fitSheet(),
  });

  const keys = new Map<HTMLElement, string>();
  const patches = new Map<HTMLElement, Built['patch']>();
  /** Rows ticked since the list was opened: they stay in place as discs. */
  const ticked = new Set<string>();
  let shown: { position: DrawerPosition; tab: Tab; page: string | undefined } | undefined;
  /** Taps on Step done, Pause and Resume are ignored until this moment (monotonic). */
  let guardUntil = 0;
  /** What the dock line's slot held, and where, at the last render. */
  let lastSlot: 'present' | 'capsule' | 'none' | undefined;
  let lastScene = '';
  /** The next render follows a tap that grows the capsule back: a tab, back, or a fold. */
  let arrival: 'morph' | 'other' = 'other';
  /** The live Undo, if a tap in the last six seconds can be taken back. */
  let undo: UndoSlot | undefined;
  /** Where the drawer rested before it was opened, so Hide returns there. */
  let beforeOpen: { key: 'running' | 'idle'; position: 'half' | 'folded' } | undefined;
  let order = '';
  /** Whether the Focus layer was shown at the last render. */
  let focusShown = false;
  /** The Focus layer fading out after it closed (SPEC 10, Reduce Motion). */
  let leaving: ReturnType<typeof setTimeout> | undefined;
  let barRunning = false;
  /** Where the sheet was opened over, at the last render. */
  let sheetFrom: string | undefined;
  let destroyed = false;
  let announcing: ReturnType<typeof setTimeout> | undefined;
  /**
   * The capture sheet, while it is open: a level of its own over whatever is
   * open (plan section 8). Held in memory only; what it holds is kept as a
   * draft in the store.
   */
  let sheet: { to: CaptureTo; serial: number } | undefined;
  let sheetSerial = 0;
  /** Whether the sheet was shown at the last render. */
  let sheetShown = false;
  /** The sheet fading out after it closed. */
  let sheetLeaving: ReturnType<typeof setTimeout> | undefined;
  /** The raised lantern, or Today's step in Focus, coming back down: it fades in again. */
  let lowering: ReturnType<typeof setTimeout> | undefined;
  let draftTimer: ReturnType<typeof setTimeout> | undefined;
  /** Whether what is raised above the sheet fits, as last measured; else the capsule rides. */
  let raisedFits = true;

  /** A screen shorter than 740 pt, where the handle is one line (SPEC 3). */
  function compact(): boolean {
    const height = container.getBoundingClientRect().height;
    return height > 0 && height < 740;
  }

  function motion(state: BenchDomains): 'full' | 'reduced' {
    if (state.bench.settings.motion === 'reduced') return 'reduced';
    const query =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : undefined;
    return query?.matches ? 'reduced' : 'full';
  }

  /** Rebuilds a layer only when its key moved, keeping focus and scroll. */
  function paint(target: HTMLElement, key: string, build: () => Built): void {
    if (keys.get(target) === key) return;
    const active = document.activeElement;
    const focusId = active instanceof HTMLElement && target.contains(active) ? active.id : '';
    const quiet = isQuiet(active);
    const scroll = scrollOf(target);
    const built = build();
    target.replaceChildren(...built.nodes);
    keys.set(target, key);
    patches.set(target, built.patch);
    for (const node of target.querySelectorAll<HTMLElement>('[data-scroll-key]')) {
      const top = scroll[node.dataset['scrollKey'] ?? ''];
      if (top !== undefined) node.scrollTop = top;
    }
    if (focusId) {
      const again = document.getElementById(focusId);
      if (again && target.contains(again)) {
        if (quiet) focusOn(again, true);
        else again.focus();
      } else if (focusLost()) landFocus(quiet);
    }
  }

  /** Nothing has focus, or what had it is no longer on the page. */
  function focusLost(): boolean {
    const active = document.activeElement;
    return !active || active === document.body || !active.isConnected;
  }

  /**
   * The control that had focus went with the rebuild (Start, Set aside, Done
   * on the last step): focus lands on what took its place, the screen's own
   * block, rather than falling to the page. A place has no block of its own,
   * so there it lands on the handle, whose Next line says what happened and
   * holds its Undo.
   */
  function landFocus(quiet = false): void {
    const homes = [
      ...container.querySelectorAll<HTMLElement>('[data-focus-home]'),
      ...layer.drawer.querySelectorAll<HTMLElement>('#b-handle'),
    ];
    const home = homes.find((node) => !node.closest('[inert]'));
    if (home) focusOn(home, quiet);
  }

  /**
   * Focus put where the person will want it next, after a tap that took it
   * away: the step after the sheet drops, say. With `quiet`, no ring is drawn
   * (SPEC 5.5 draws none after Save). The field always shows its focus, and a
   * browser carries that to wherever focus is moved from it, so a tap on
   * Save, which never takes focus itself, would ring the whole lantern. The
   * mark goes with the next key or when focus leaves, and the ring is the
   * person's again.
   */
  function focusOn(node: HTMLElement, quiet: boolean): void {
    if (!quiet) {
      node.focus({ preventScroll: true });
      return;
    }
    node.dataset['quiet'] = '';
    node.addEventListener('blur', unquiet, { once: true });
    node.focus({ preventScroll: true, focusVisible: false });
  }

  function unquiet(event: Event): void {
    const node = event.currentTarget;
    if (node instanceof HTMLElement) delete node.dataset['quiet'];
  }

  /** Whether focus is where the app put it quietly, so a rebuild keeps it quiet. */
  function isQuiet(node: Element | null): boolean {
    return node instanceof HTMLElement && node.dataset['quiet'] !== undefined;
  }

  /** A key on what was focused quietly: the person is moving by keys, so the ring shows. */
  function onKeyDown(event: KeyboardEvent): void {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
    const target = event.target;
    if (target instanceof HTMLElement && isQuiet(target)) delete target.dataset['quiet'];
  }

  function scrollOf(root: ParentNode): Record<string, number> {
    const out: Record<string, number> = {};
    for (const node of root.querySelectorAll<HTMLElement>('[data-scroll-key]')) {
      out[node.dataset['scrollKey'] ?? ''] = node.scrollTop;
    }
    return out;
  }

  function viewOf(): View {
    const top = nav.stack[nav.stack.length - 1];
    if (top) return { kind: 'page', page: top };
    return nav.tab === 'today' ? { kind: 'today' } : { kind: 'place' };
  }

  /** A page whose task has gone (deleted, or from an old restore) is not shown. */
  function tidyNav(state: BenchDomains): void {
    const ids = new Set(state.tasks.map((task) => task.id));
    const kept = nav.stack.filter((page) => page.kind !== 'task' || ids.has(page.id));
    if (kept.length !== nav.stack.length) nav = { ...nav, stack: kept };
  }

  // ---------------------------------------------------------------- render

  function render(): void {
    if (destroyed) return;
    const state = read();
    const t = now();
    tidyNav(state);
    const view = viewOf();
    const current = present(state, t);
    // Focus goes with the present: after Done, Set aside, or the day's end, it
    // folds back to where it was opened, as "⌄ Today" would.
    if (focusOpen && current.kind === 'none') focusOpen = false;
    const wasFocus = focusShown;
    const showFocus = focusOpen;
    focusShown = showFocus;
    // The capture sheet is modal: everything under it is inert, Me excepted,
    // which the sheet carries over its own (SPEC 5.5).
    const sheetOpen = sheet !== undefined;
    const byMinute = motion(state) === 'reduced';
    const places = state.bench.settings.places;

    // The drawer. Below 740 pt the half drawer would bring timed rows under
    // capture's lane, so it rests folded there, as it does at large text sizes
    // (SPEC 9.8); a proposal, since SPEC draws the half drawer at 844 only.
    const rule = drawerPositions(state, t, { view, largeText: compact() });
    // While an Undo shows, a drawer that was folded at the tap stays folded,
    // so its Next line can hold the Undo, though the tap would send it to half
    // (Done, Set aside) or to its lip; it settles when the six seconds end.
    // Undrawn: a proposal from SPEC 9.8's "every quick tap can be taken back".
    const position: DrawerPosition =
      undo?.hold && (rule.position === 'half' || rule.position === 'lip')
        ? 'folded'
        : rule.position;
    const open = position === 'open';
    const ground = view.kind === 'today' ? 'present' : 'place';

    // Moving between lists clears the rows ticked in them.
    const page = view.kind === 'page' ? JSON.stringify(view.page) : undefined;
    if (shown && (shown.position !== position || shown.tab !== nav.tab || shown.page !== page)) {
      ticked.clear();
    }
    shown = { position, tab: nav.tab, page };

    container.dataset['drawer'] = position;
    container.dataset['ground'] = ground;
    container.dataset['places'] = places;
    container.dataset['motion'] = byMinute ? 'reduced' : 'full';
    if (showFocus) container.dataset['focus'] = 'open';
    else delete container.dataset['focus'];
    themeColor(!showFocus && ground === 'place' && places === 'white' ? WHITE : CHARCOAL);

    // The present, as it is now.
    const presentNow = presentView(state, t);
    const live = presentNow && presentLive(presentNow, t, byMinute);

    // The page.
    const today = view.kind === 'today' ? todayView(state, t) : undefined;
    layer.screen.className = today ? 'screen today' : 'screen';
    if (today) layer.screen.dataset['lamp'] = lampOf(today);
    else delete layer.screen.dataset['lamp'];
    paint(layer.screen, screenKey(view, today), () => screen(view, today, live));
    // The open drawer covers the screen, and Focus covers everything but the
    // dock line: what is under either is not read or reached.
    for (const under of [layer.screen, layer.fade]) {
      if (open || showFocus || sheetOpen) under.setAttribute('inert', '');
      else under.removeAttribute('inert');
    }
    for (const under of [layer.foot, layer.tabs]) {
      if (showFocus || sheetOpen) under.setAttribute('inert', '');
      else under.removeAttribute('inert');
    }

    // Focus, the capsule opened all the way (SPEC 5.4).
    if (showFocus && presentNow && live) {
      stopLeaving();
      const back = BACK_TO[nav.tab];
      paint(layer.focus, JSON.stringify(['focus', ...focusKey(presentNow, back)]), () =>
        focusScreen(presentNow, live, back, focusActions(presentNow)),
      );
      paint(layer.focusFoot, footKey(state, t), () => footOf(state, t));
    } else if (wasFocus) {
      startLeaving();
    }
    if (showFocus && sheetOpen) {
      for (const part of [layer.focus, layer.focusFoot]) part.setAttribute('inert', '');
    }

    // The dock line. On the open drawer the lantern has folded into the
    // capsule, which sits on the cover with capture (SPEC 5.2). In Focus it
    // holds Today's buttons in Today's places (SPEC 3).
    const mode = capsuleMode(showFocus ? { kind: 'focus' } : view, current, position, false);
    const lit = today?.kind === 'lit' && !open;
    const onDock = showFocus
      ? presentNow
      : lit && today?.kind === 'lit'
        ? today.present
        : undefined;
    const capsule =
      !lit && mode !== 'hidden' && presentNow && live
        ? {
            view: presentNow,
            live,
            look: capsuleLook(places, position),
            mode,
            onOpen: () => openFocus('capsule'),
          }
        : undefined;
    const props: DockProps = {
      ...(onDock ? { present: presentButtons(onDock) } : {}),
      ...(capsule ? { capsule } : {}),
      captureOnLight:
        !showFocus &&
        (open ||
          (ground === 'present' && position === 'half') ||
          (ground === 'place' && places === 'white')),
      // While the sheet is up, its draft is in it, not kept behind the disc.
      draftKept:
        !sheetOpen &&
        state.bench.drafts.capture !== undefined &&
        state.bench.drafts.capture.text.trim() !== '',
      onCapture: openCapture,
    };
    const slot = props.present ? 'present' : props.capsule ? 'capsule' : 'none';
    // The lantern and Focus fold into the capsule, and grow out of it, as a
    // 200 ms cross-fade, the capsule fading in already in its slot (SPEC 10,
    // Reduce Motion; the only path until the animated one is built).
    const morph =
      lastSlot !== undefined && lastSlot !== slot && (slot === 'capsule' || lastSlot === 'capsule');
    guardArrival(props, view, open, showFocus);
    paint(layer.dock, dockKey(props), () => dock(props));
    if (sheetOpen) layer.dock.setAttribute('inert', '');
    else layer.dock.removeAttribute('inert');
    if (morph) {
      for (const node of layer.dock.querySelectorAll('.capsule, .dock-pill')) {
        node.classList.add('enter');
      }
    }
    layer.fade.hidden = !(ground === 'place' && capsule !== undefined && !open);

    // The drawer, and Hide at its foot when it is open.
    if (position === 'lip' || showFocus || sheetOpen) layer.drawer.setAttribute('inert', '');
    else layer.drawer.removeAttribute('inert');
    paint(layer.drawer, drawerKey(state, t, position, today), () =>
      drawer(state, t, position, today),
    );
    const band = open ? bandUndo() : undefined;
    paint(layer.foot, open ? JSON.stringify(['hide', band?.undo.name]) : '', () => ({
      nodes: open
        ? hideFoot(
            hideDrawer,
            band && { ...band.undo.lines, name: band.undo.name, onUndo: takeBack },
          )
        : [],
    }));

    // The tabs.
    paint(layer.tabs, nav.tab, () => ({ nodes: tabs(nav.tab, chooseTab) }));

    // Capture's sheet (SPEC 5.5). Over Today or Focus, what is lit stays lit
    // above it; over a place, the capsule rides the sheet's top edge, as a
    // picture. Where what is lit does not fit above the sheet, the capsule
    // rides there too (measured in fitSheet).
    const from = !sheetOpen
      ? undefined
      : showFocus
        ? 'focus'
        : today?.kind === 'lit' && !open
          ? 'today'
          : 'place';
    if (from) container.dataset['sheet'] = from;
    else delete container.dataset['sheet'];
    let rides = false;
    if (sheet && from) {
      stopSheetLeaving();
      const ride =
        presentNow &&
        live &&
        (from !== 'place' || capsuleMode(view, current, position, true) === 'picture')
          ? {
              view: presentNow,
              live,
              look: from === 'place' ? capsuleLook(places, position) : ('lifted' as const),
            }
          : undefined;
      rides = ride !== undefined && (from === 'place' || !raisedFits);
      // Me is above the sheet wherever the screen under it has Me.
      const me = showFocus || open || !(view.kind === 'page' && view.page.kind === 'me');
      const rideKey = ride
        ? [presentKey(ride.view), ride.look, capsuleShape(ride.view, ride.live)]
        : null;
      paint(layer.sheet, JSON.stringify(['sheet', sheet.serial, me, rideKey]), () =>
        sheetOf(ride, me),
      );
    } else if (sheetShown) {
      startSheetLeaving();
    }
    if (sheetShown && !sheetOpen && (sheetFrom === 'today' || sheetFrom === 'focus')) lower();
    sheetShown = sheetOpen;
    sheetFrom = from;
    if (rides) container.dataset['ride'] = '';
    else delete container.dataset['ride'];

    // Reading order: top to bottom, then the dock line, then the drawer, except
    // where the drawer's list is read before capture: on the half drawer (SPEC
    // 11, list 7) and the open one, whose Hide is read after the dock line from
    // its own layer (list 2). Moving a node takes focus off anything inside it,
    // so only the drawer moves, and focus is put back where it was.
    const wanted = position === 'half' || open ? 'list-first' : 'dock-first';
    if (order === '') {
      container.append(
        ...(wanted === 'list-first'
          ? [
              layer.screen,
              layer.fade,
              layer.focus,
              layer.drawer,
              layer.dock,
              layer.foot,
              layer.tabs,
              layer.focusFoot,
              layer.sheet,
              layer.live,
            ]
          : [
              layer.screen,
              layer.fade,
              layer.focus,
              layer.dock,
              layer.drawer,
              layer.foot,
              layer.tabs,
              layer.focusFoot,
              layer.sheet,
              layer.live,
            ]),
      );
    } else if (order !== wanted) {
      const active = document.activeElement;
      const quiet = isQuiet(active);
      container.insertBefore(layer.drawer, wanted === 'list-first' ? layer.dock : layer.foot);
      if (
        active instanceof HTMLElement &&
        active.isConnected &&
        document.activeElement !== active
      ) {
        focusOn(active, quiet);
      }
    }
    order = wanted;

    barRunning =
      current.kind === 'running' &&
      (today?.kind === 'lit' || capsule !== undefined || showFocus || rides);
    patchAll(live);
    layout(position);
    fitSheet();
    // Focus has closed and what had focus went with it: back where it was
    // opened, on the capsule if it is there, otherwise the screen's own block
    // (or, on a place after Done or Set aside, the handle). Judged here, once
    // every layer's inert is settled: Done on the dock line loses its focus
    // while the drawer is still inert under Focus.
    if (wasFocus && !showFocus && (focusIn(layer.focus, layer.focusFoot) || focusLost())) {
      const capsuleButton = layer.dock.querySelector<HTMLElement>('#b-capsule');
      if (capsuleButton) capsuleButton.focus({ preventScroll: true });
      else landFocus();
    }
    holdAwake(showFocus);
    if (pendingScroll) {
      const restore = pendingScroll;
      pendingScroll = undefined;
      for (const node of container.querySelectorAll<HTMLElement>('[data-scroll-key]')) {
        const top = restore[node.dataset['scrollKey'] ?? ''];
        if (top !== undefined) node.scrollTop = top;
      }
    }
    ticker?.refresh();
    syncHistory();
    // An Undo kept past its six seconds for its focus goes once the pill has
    // lost it, however it lost it: here a paint took the pill away (Focus
    // opening or closing, the drawer opening) with no focusout to say so.
    if (undo?.expired && !undoHasFocus()) {
      undo = undefined;
      render();
    }
  }

  function patchAll(live: PresentLive | undefined): void {
    for (const patch of patches.values()) patch?.(live);
  }

  /** The ticker's second: the bar, the minutes and the labels, in place. */
  function patchLive(): void {
    const state = read();
    const t = now();
    const presentNow = presentView(state, t);
    patchAll(presentNow && presentLive(presentNow, t, motion(state) === 'reduced'));
  }

  // ---------------------------------------------------------------- the parts

  function screenKey(view: View, today: ReturnType<typeof todayView> | undefined): string {
    if (today) {
      return JSON.stringify([
        'today',
        today.kind,
        today.date,
        today.kind === 'lit'
          ? presentKey(today.present)
          : today.kind === 'idle'
            ? idleKey(today.idle)
            : today.heading,
      ]);
    }
    if (view.kind === 'page' && view.page.kind === 'settings') {
      return JSON.stringify(['page', view.page, settingsView(read())]);
    }
    if (view.kind === 'page' && view.page.kind === 'task') {
      const task = read().tasks.find((item) => item.id === (view.page as { id: string }).id);
      return JSON.stringify(['page', view.page, nav.tab, task?.title]);
    }
    return JSON.stringify([view.kind, view.kind === 'page' ? view.page : nav.tab]);
  }

  function screen(
    view: View,
    today: ReturnType<typeof todayView> | undefined,
    live: PresentLive | undefined,
  ): Built {
    if (today) {
      return todayScreen(
        today,
        live,
        {
          onMe: openMe,
          onFocus: () => openFocus('lantern'),
          onSetAside: (id) => run(act.setAside, id),
          onOpenTask: (id) => push({ kind: 'task', id }),
          onStart: (id) => run(act.start, id),
          onOpenInbox: () => go({ tab: 'tasks', stack: [], list: 'inbox' }),
        },
        () => todayView(read(), now()),
      );
    }
    const actions = {
      onMe: openMe,
      onBack: back,
      onPush: push,
      onScenario: scenario,
      onDeleteAll: deleteAll,
    };
    if (view.kind === 'page') {
      switch (view.page.kind) {
        case 'me':
          return meScreen(actions);
        case 'crisis':
          return crisisScreen(actions);
        case 'about':
          return aboutScreen(actions);
        case 'settings':
          return settingsScreen(settingsView(read()), {
            onBack: back,
            onMe: openMe,
            onChange: changeSettings,
          });
        case 'task': {
          const id = view.page.id;
          const task = read().tasks.find((item) => item.id === id);
          return taskScreen(task?.title ?? '', BACK_TO[nav.tab], actions);
        }
        default:
          return placeScreen(nav.tab === 'today' ? 'tasks' : nav.tab, actions);
      }
    }
    return placeScreen(nav.tab === 'today' ? 'tasks' : nav.tab, actions);
  }

  function dockKey(props: DockProps): string {
    return JSON.stringify([
      props.present
        ? [
            'present',
            props.present.taskId,
            props.present.paused,
            props.present.step,
            props.present.isLast,
          ]
        : props.capsule
          ? [
              'capsule',
              presentKey(props.capsule.view),
              props.capsule.look,
              props.capsule.mode,
              capsuleShape(props.capsule.view, props.capsule.live),
            ]
          : ['none'],
      props.captureOnLight,
      props.draftKept,
    ]);
  }

  /** What changes the capsule's make-up rather than its live figures. */
  function capsuleShape(view: PresentView, live: PresentLive): unknown[] {
    return [view.kind === 'paused' && live.facts.usedUp];
  }

  function drawerKey(
    state: BenchDomains,
    t: Date,
    position: DrawerPosition,
    today: ReturnType<typeof todayView> | undefined,
  ): string {
    if (position === 'lip') return 'lip';
    if (position === 'half') {
      const list = dayList(state, t, { keep: ticked, ...exclusion(today) });
      return JSON.stringify(['half', list]);
    }
    if (position === 'open') {
      // The next row's "in N min" and the spoken names follow the clock and are
      // moved in place; which row carries the "in" line is part of the key.
      const list = dayList(state, t, { keep: ticked, inLine: true });
      const later = list.later.map((row) => ({
        ...row,
        inLine: row.inLine !== undefined,
        label: undefined,
      }));
      return JSON.stringify(['open', { ...list, later }]);
    }
    // "in N min" follows the clock and is moved in place; whether it is there is not.
    const held = lineUndo();
    const next = nextLine(state, t, held?.undo.lines);
    return JSON.stringify(['folded', lineShape(next), held?.undo.name]);
  }

  /** A Next line or foot as built: whether "in N min" is there, not its figure. */
  function lineShape(next: ReturnType<typeof nextLine>): unknown {
    return next.kind === 'line' ? { ...next, inMinutes: next.inMinutes !== undefined } : next;
  }

  /** The Undo the Next line carries: none while Focus is over it, whose foot has it. */
  function lineUndo(): UndoSlot | undefined {
    return focusShown ? undefined : undo;
  }

  /**
   * The Undo the open drawer's Hide band carries: Save's only. The open
   * drawer has no Next line; a tick there has its row's disc to take it back,
   * and Save has nothing else.
   */
  function bandUndo(): UndoSlot | undefined {
    return undo?.undo.reopen ? lineUndo() : undefined;
  }

  function exclusion(today: ReturnType<typeof todayView> | undefined): { exclude?: string } {
    const id = today ? idleLitId(today) : undefined;
    return id === undefined ? {} : { exclude: id };
  }

  function drawer(
    state: BenchDomains,
    t: Date,
    position: DrawerPosition,
    today: ReturnType<typeof todayView> | undefined,
  ): Built {
    if (position === 'lip') return { nodes: [] };
    const rows = {
      onRow: openTask,
      onTick: (id: string) => {
        ticked.add(id);
        run(act.tick, id);
      },
      onUntick: (id: string) => run(act.untick, id),
    };
    if (position === 'half') {
      return {
        nodes: halfDrawer({
          list: dayList(state, t, { keep: ticked, ...exclusion(today) }),
          onOpen: openDrawer,
          ...rows,
        }),
      };
    }
    if (position === 'open') {
      // The whole of today: the idle lantern is under the drawer, so the item
      // it lights is listed here too.
      const opened = openDrawerNodes({
        list: dayList(state, t, { keep: ticked, inLine: true }),
        onMe: () =>
          together(() => {
            foldDrawer(false);
            openMe();
          }),
        ...rows,
      });
      return {
        nodes: opened.nodes,
        patch() {
          opened.set(dayList(read(), now(), { keep: ticked, inLine: true }));
        },
      };
    }
    const held = lineUndo();
    const lines = held?.undo.lines;
    const next = nextLine(state, t, lines);
    if (next.kind === 'lip') return { nodes: [] };
    const folded = foldedDrawer({
      ...handleWords(next),
      onOpen: openDrawer,
      ...(held ? { undo: { name: held.undo.name, onUndo: takeBack } } : {}),
    });
    return {
      nodes: folded.nodes,
      // The ticker's minute: "in 25 min" becomes "in 24 min" where it stands.
      patch() {
        const again = nextLine(read(), now(), lines);
        if (again.kind === 'line') folded.set(handleWords(again));
      },
    };
  }

  function handleWords(next: NextLine) {
    const lines = handleLines(next);
    const [section, ...rest] = lines.line1.split(' · ');
    return {
      section: section ?? '',
      when: rest.length > 0 ? rest.join(' · ') : undefined,
      time: lines.time,
      title: lines.title,
      label: handleLabel(next),
    };
  }

  // ---------------------------------------------------------------- Focus

  /** Step done, Pause and Resume on the dock line: Today's, and Focus's the same. */
  function presentButtons(view: PresentView): NonNullable<DockProps['present']> {
    const id = view.task.id;
    return {
      taskId: id,
      paused: view.kind === 'paused',
      step: view.step,
      isLast: view.steps.isLast,
      onStepDone: () => guarded() || run(act.stepDone, id),
      onPause: () => guarded() || run(act.pause, id),
      onResume: () => guarded() || run(act.resume, id),
    };
  }

  function focusActions(view: PresentView): FocusActions {
    const id = view.task.id;
    return {
      onBack: closeFocus,
      // Me is pushed on the current tab, under Focus, which folds away: help
      // stays two taps from anywhere, and the capsule is one tap back.
      onMe: () =>
        together(() => {
          closeFocus();
          openMe();
        }),
      onReopenStep: (stepId) => {
        // The disc takes back the Step done the foot offers to: one way back.
        const before = read();
        if (undo?.undo.step === stepId) dropUndo();
        run(act.reopenStep, stepId);
        if (read() === before) render();
      },
      onAddFive: () => run(act.addFive, id),
      onSetAside: () => run(act.setAside, id),
    };
  }

  function footKey(state: BenchDomains, t: Date): string {
    const next = nextLine(state, t, undo?.undo.lines);
    return JSON.stringify(['foot', lineShape(next), undo?.undo.name]);
  }

  /** Focus's foot: the Next line's rows on one line, and its six-second Undo. */
  function footOf(state: BenchDomains, t: Date): Built {
    const lines = undo?.undo.lines;
    const next = nextLine(state, t, lines);
    if (next.kind === 'lip') return { nodes: [] };
    const built = focusFoot({
      next,
      ...(undo ? { undo: { name: undo.undo.name, onUndo: takeBack } } : {}),
    });
    return {
      nodes: built.nodes,
      patch() {
        const again = nextLine(read(), now(), lines);
        if (again.kind === 'line') built.set(again);
      },
    };
  }

  /**
   * Focus opens over the current tab and whatever is pushed on it, from the
   * lit block on Today or from the capsule anywhere; from the open drawer, the
   * drawer folds and its history entry becomes Focus's. Focus lands on the
   * step (SPEC 11). Grown out of the capsule, Step done and Pause wait out the
   * morph and a second before they take a tap (SPEC 5.1).
   */
  function openFocus(from: 'lantern' | 'capsule'): void {
    if (focusOpen || !presentView(read(), now())) return;
    together(() => {
      if (isOpen()) foldDrawer(false);
      focusOpen = true;
      // Set after the fold, whose render used up the arrival.
      if (from === 'capsule') arrival = 'morph';
      render();
    });
    container.querySelector<HTMLElement>('#f-step')?.focus({ preventScroll: true });
  }

  /** "⌄ Today", or back: Focus folds into the screen it was opened from. The clock keeps running. */
  function closeFocus(): void {
    if (!focusOpen) return;
    focusOpen = false;
    arrival = 'morph';
    render();
  }

  /**
   * Focus fades out over 200 ms, taking no taps and read by nothing meanwhile.
   * What fades is only a picture: its ids go, so the Next line's Undo is the
   * one #b-undo, and Focus opened again within the fade is built afresh.
   */
  function startLeaving(): void {
    for (const part of [layer.focus, layer.focusFoot]) {
      part.setAttribute('inert', '');
      part.dataset['leaving'] = '';
      keys.delete(part);
      patches.delete(part);
      for (const node of part.querySelectorAll('[id]')) node.removeAttribute('id');
    }
    if (leaving !== undefined) clearTimeout(leaving);
    leaving = setTimeout(() => {
      leaving = undefined;
      if (focusShown || destroyed) return;
      for (const part of [layer.focus, layer.focusFoot]) {
        paint(part, '', () => ({ nodes: [] }));
        delete part.dataset['leaving'];
        part.hidden = true;
      }
    }, FOCUS_FADE_MS);
  }

  function stopLeaving(): void {
    if (leaving !== undefined) clearTimeout(leaving);
    leaving = undefined;
    for (const part of [layer.focus, layer.focusFoot]) {
      part.removeAttribute('inert');
      delete part.dataset['leaving'];
      part.hidden = false;
    }
  }

  function focusIn(...parts: HTMLElement[]): boolean {
    const active = document.activeElement;
    return active !== null && parts.some((part) => part.contains(active));
  }

  // ---------------------------------------------------------------- the screen stays awake

  /**
   * While Focus is on screen, the screen stays awake: a Screen Wake Lock,
   * where the browser has one (Safari since 16.4; in a home-screen copy since
   * iOS 18.4). The browser lets go of it when the page is hidden, so it is
   * asked for again on the way back. Where there is none, nothing is said.
   */
  let lock: WakeLockLike | undefined;
  let lockAsked = false;
  let lockWanted = false;
  /** Between hide and wake: nothing is asked for while the page is going. */
  let away = false;

  function holdAwake(want: boolean): void {
    lockWanted = want && !destroyed;
    if (!lockWanted) {
      const held = lock;
      lock = undefined;
      if (held) void held.release().catch(() => undefined);
      return;
    }
    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (lock || lockAsked || away || !api || document.visibilityState !== 'visible') return;
    lockAsked = true;
    let asked: Promise<WakeLockLike>;
    try {
      asked = api.request('screen');
    } catch {
      lockAsked = false;
      return;
    }
    asked.then(
      (sentinel) => {
        lockAsked = false;
        if (!lockWanted || away || destroyed) {
          void sentinel.release().catch(() => undefined);
          return;
        }
        lock = sentinel;
        // The browser can let go while the page stays visible (low power, a
        // system setting): asked for again at once, rather than at the next
        // render, which on a still Focus can be a minute away. On the way to
        // the background the page is no longer visible, so nothing is asked.
        sentinel.addEventListener?.('release', () => {
          if (lock !== sentinel) return;
          lock = undefined;
          if (lockWanted) holdAwake(true);
        });
      },
      () => {
        lockAsked = false;
      },
    );
  }

  // ---------------------------------------------------------------- measuring

  /**
   * The half drawer's top follows what is lit above it: Start's foot plus 16,
   * or the unlit block's under rule 3, and never above y 366 on the board. At
   * rest, a list with more below is cut to the last whole row above the tabs'
   * cover, so that row is the covered one (plan section 10, "Rows"). A list
   * that fits is left whole, with no covered row and no cover: SPEC 9.7 draws
   * one only where a list stops at an edge with more below it.
   */
  function layout(position: DrawerPosition): void {
    const box = container.getBoundingClientRect();
    if (box.height === 0) return; // not laid out: a test, or a hidden page
    if (position === 'half') {
      const header = layer.screen.querySelector('.hdr');
      const saTop = header ? header.getBoundingClientRect().top - box.top - 4 : 20;
      const least = saTop + 312;
      const anchor = layer.screen.querySelector('[data-half-anchor]');
      const foot = anchor ? anchor.getBoundingClientRect().bottom - box.top + 16 : least;
      container.style.setProperty('--half-t', `${Math.max(foot, least)}px`);
    }
    const viewport = layer.drawer.querySelector<HTMLElement>('.viewport');
    const list = viewport?.querySelector<HTMLElement>('.list');
    let more = false;
    if (viewport && list) {
      viewport.style.removeProperty('height');
      const room = viewport.clientHeight;
      let cut = 0;
      for (const row of list.querySelectorAll<HTMLElement>('[data-row]')) {
        const bottom = row.offsetTop + row.offsetHeight;
        if (bottom <= room) cut = Math.max(cut, bottom);
        else more = true;
      }
      if (more && cut > 0) viewport.style.height = `${cut}px`;
    }
    // Read by the covered row and by the tabs' cover above the list.
    if (more) container.dataset['more'] = '';
    else delete container.dataset['more'];
  }

  // ---------------------------------------------------------------- actions

  function run(
    change: (state: BenchDomains, id: string, at: Date) => act.Changed,
    id: string,
  ): void {
    const result = change(read(), id, now());
    if (result.undo) offerUndo(result.undo);
    commit(result.state);
    if (result.announce) announce(result.announce);
  }

  // ---------------------------------------------------------------- the tap guard

  /**
   * When Step done and Pause come into the slot because Today or Focus was
   * reached, not because something changed on it: grown out of the capsule
   * (by a tab, back, a fold, or the capsule itself), a morph and a second;
   * otherwise, launch and between Today and Focus included, half a second.
   */
  function guardArrival(props: DockProps, view: View, open: boolean, focus: boolean): void {
    const slot = props.present ? 'present' : props.capsule ? 'capsule' : 'none';
    const scene = focus ? 'focus' : `${JSON.stringify(view)} ${nav.tab} ${open ? 'open' : ''}`;
    // Today and Focus hold the buttons in the same places, so going from one
    // to the other is an arrival though the slot never empties.
    const across = scene !== lastScene && (scene === 'focus' || lastScene === 'focus');
    if (
      slot === 'present' &&
      (lastSlot === undefined || (scene !== lastScene && (lastSlot !== 'present' || across)))
    ) {
      const grew = lastSlot === 'capsule' && arrival === 'morph';
      const length = grew ? TAP_GUARD.morph + TAP_GUARD.afterCapsule : TAP_GUARD.other;
      guardUntil = Math.max(guardUntil, monotonic() + length);
    }
    lastSlot = slot;
    lastScene = scene;
    arrival = 'other';
  }

  /** True while a tap on Step done, Pause or Resume is ignored, with no feedback. */
  function guarded(): boolean {
    return monotonic() < guardUntil;
  }

  // ---------------------------------------------------------------- undo

  /**
   * One live Undo (plan section 12): six seconds after an undoable tap, shown
   * on the folded Next line. Only a newer undoable tap replaces it; other
   * touches leave it. While the pill has focus it stays, standing in for
   * "while VoiceOver is on it" (SPEC 9.8), and goes once focus leaves. Going
   * to the background ends it. Where no Next line is on screen, a ticked
   * row's disc is the way back.
   */
  function offerUndo(next: act.Undo, foldHalf = false): void {
    dropUndo();
    const slot: UndoSlot = {
      undo: next,
      // A drawer folded at the tap holds its Next line for the six seconds.
      // Save's Undo has no other way back, so Save asks a half drawer to fold
      // and hold it too (undrawn: a proposal; a list's tick has its disc
      // instead). The open drawer keeps it on its Hide band.
      hold:
        shown?.position === 'folded' ||
        shown?.position === 'lip' ||
        (foldHalf && shown?.position === 'half'),
      timer: undefined,
      expired: false,
    };
    slot.timer = setTimeout(() => {
      slot.timer = undefined;
      if (undo !== slot) return;
      if (undoHasFocus()) slot.expired = true;
      else {
        undo = undefined;
        render();
      }
    }, UNDO_MS);
    undo = slot;
  }

  function dropUndo(): void {
    if (undo?.timer !== undefined) clearTimeout(undo.timer);
    undo = undefined;
  }

  /**
   * Undo: the change taken back, said, and focus on the handle where the pill
   * was. Whether or not the pill had focus: Safari does not focus a button on
   * a tap, nor reliably on VoiceOver's activation, and the pill is gone.
   */
  function takeBack(): void {
    const slot = undo;
    if (!slot) return;
    dropUndo();
    const t = now();
    const before = read();
    const reopen = slot.undo.reopen;
    const after = slot.undo.inverse(before, t);
    commit(reopen ? withDraft(after, reopen) : after);
    if (read() === before) render();
    const view = presentView(read(), t);
    announce(ANNOUNCE.undoneThen(view ? `${view.lead}: ${view.step}` : T.nothingRunning));
    // After Save: the item is gone and the sheet is back, the text in it.
    if (reopen) return openCapture();
    // Where the pill was: Focus's foot, or the handle.
    const spot = focusShown
      ? layer.focusFoot.querySelector<HTMLElement>('#f-foot')
      : container.querySelector<HTMLElement>('#b-handle');
    if (spot) spot.focus({ preventScroll: true });
    else landFocus();
  }

  /**
   * The text Save filed, back as the draft the sheet opens with. A draft kept
   * since is not lost: it follows the text.
   */
  function withDraft(state: BenchDomains, reopen: NonNullable<act.Undo['reopen']>): BenchDomains {
    const kept = state.bench.drafts.capture?.text.trim();
    const text = kept && kept !== reopen.text ? `${reopen.text} ${kept}` : reopen.text;
    return {
      ...state,
      bench: {
        ...state.bench,
        drafts: { ...state.bench.drafts, capture: { text, to: reopen.to } },
      },
    };
  }

  /**
   * The live pill has focus: the one #b-undo, on the page and in a layer that
   * is read. The fading Focus keeps a pill with its id stripped, in an inert
   * layer, and that one does not count.
   */
  function undoHasFocus(): boolean {
    const active = document.activeElement;
    return (
      active instanceof HTMLElement &&
      active.id === 'b-undo' &&
      active.isConnected &&
      active.closest('[inert]') === null
    );
  }

  /**
   * An Undo kept for its focus goes when focus leaves it. Judged once the
   * move has landed, so focus going from one pill to the pill rebuilt in its
   * place keeps it.
   */
  function onFocusOut(): void {
    if (!undo?.expired) return;
    queueMicrotask(() => {
      if (!undo?.expired || undoHasFocus()) return;
      undo = undefined;
      render();
    });
  }

  /**
   * Says `text` through the live region. The region is emptied first and
   * filled a moment later, so the same words twice in a row (Pause, Resume,
   * Pause) are a change a screen reader reads again, not text left as it was.
   */
  function announce(text: string): void {
    if (announcing !== undefined) clearTimeout(announcing);
    layer.live.textContent = '';
    announcing = setTimeout(() => {
      announcing = undefined;
      if (!destroyed) layer.live.textContent = text;
    }, ANNOUNCE_AFTER);
  }

  function go(next: Nav): void {
    nav = next;
    render();
  }

  function push(page: Page): void {
    go({ ...nav, stack: [...nav.stack, page] });
  }

  function back(): void {
    arrival = 'morph';
    go({ ...nav, stack: nav.stack.slice(0, -1) });
  }

  /** Me is pushed on the current tab, which stays current. */
  function openMe(): void {
    const at = nav.stack.findIndex((page) => page.kind === 'me');
    if (at === nav.stack.length - 1 && at !== -1) return;
    if (at !== -1) go({ ...nav, stack: nav.stack.slice(0, at + 1) });
    else push({ kind: 'me' });
  }

  /**
   * A tab clears the pages pushed on the current one. With the drawer open,
   * the current tab folds it and leaves the person exactly where they were
   * (SPEC 5.2); another tab folds it and goes there.
   */
  function chooseTab(tab: Tab): void {
    together(() => {
      arrival = 'morph';
      if (isOpen()) {
        foldDrawer(false);
        if (tab === nav.tab) return;
      }
      if (tab === nav.tab && nav.stack.length === 0) return;
      // The fold rendered the place it folded over, which used the arrival up;
      // Today, if that is where this goes, still grows out of the capsule.
      arrival = 'morph';
      go({ tab, stack: [], list: nav.list });
    });
  }

  /** A row in the day's list opens its task; from the open drawer, folding it. */
  function openTask(id: string): void {
    together(() => {
      if (isOpen()) foldDrawer(false);
      push({ kind: 'task', id });
    });
  }

  // ---------------------------------------------------------------- the drawer

  function isOpen(): boolean {
    return shown?.position === 'open';
  }

  /** Which of the day's two remembered positions applies now: running or idle. */
  function drawerKeyNow(state: BenchDomains): 'running' | 'idle' | undefined {
    const rule = drawerPositions(state, now(), { view: viewOf(), largeText: compact() });
    if (rule.mode === 'lip') return undefined;
    return rule.mode === 'present' ? 'running' : 'idle';
  }

  function writeDrawer(state: BenchDomains, key: 'running' | 'idle', position: DrawerPosition) {
    commit({
      ...state,
      bench: { ...state.bench, drawer: { ...state.bench.drawer, [key]: position } },
    });
  }

  /**
   * The handle, folded or half: the whole of today pulls up over the current
   * tab, which stays current, and focus lands on its heading (SPEC 11).
   */
  function openDrawer(): void {
    if (isOpen()) return;
    const state = read();
    const key = drawerKeyNow(state);
    if (!key) return;
    const was = shown?.position;
    beforeOpen = { key, position: was === 'half' ? 'half' : 'folded' };
    writeDrawer(state, key, 'open');
    container.querySelector<HTMLElement>('#h-rest')?.focus({ preventScroll: true });
  }

  /**
   * Back to where the drawer rested before it opened: half on idle Today,
   * folded elsewhere. From Hide or back, focus goes to the handle, in the
   * same spot; when a row, Me or a tab folds it, the place it leads to has it.
   */
  function foldDrawer(toHandle: boolean): void {
    if (!isOpen()) return;
    const state = read();
    const key = drawerKeyNow(state);
    if (!key) return;
    const back =
      beforeOpen?.key === key ? beforeOpen.position : key === 'running' ? 'folded' : 'half';
    beforeOpen = undefined;
    arrival = 'morph';
    writeDrawer(state, key, back);
    const handle = toHandle ? container.querySelector<HTMLElement>('#b-handle') : null;
    if (handle) handle.focus({ preventScroll: true });
    else if (focusLost()) landFocus();
  }

  function hideDrawer(): void {
    foldDrawer(true);
  }

  function settingsView(state: BenchDomains): SettingsView {
    return {
      ...state.bench.settings,
      doneList: rewardOptions(state.rewards, { kind: 'day' }).doneList,
    };
  }

  /** The owner's switches take effect at once; "List what got done today" is the real option. */
  function changeSettings(change: Partial<SettingsView>): void {
    const state = read();
    const { doneList, ...bench } = change;
    commit({
      ...state,
      rewards:
        doneList === undefined
          ? state.rewards
          : setOption(state.rewards, { kind: 'day' }, 'doneList', doneList),
      bench: { ...state.bench, settings: { ...state.bench.settings, ...bench } },
    });
  }

  function scenario(id: ScenarioId): void {
    dropSheet();
    dropUndo();
    focusOpen = false;
    commit(loadScenario(read(), id, now()));
    ticked.clear();
    go({ ...TODAY });
  }

  function deleteAll(): void {
    if (!confirm(ABOUT.deleteConfirm)) return;
    dropSheet();
    dropUndo();
    focusOpen = false;
    const t = now();
    commit(migrateBench(emptyDomains(), t));
    ticked.clear();
    go({ ...TODAY });
  }

  // ---------------------------------------------------------------- capture

  /** The field of the sheet now open, if one is. */
  let sheetField: HTMLInputElement | undefined;

  /**
   * The capture disc: the sheet over whatever is open, its field focused in
   * the same call as the tap, which is the only time iOS raises the keyboard.
   * The sheet is lifted to where the keyboard will be first, so the page
   * never pans to show the field. A kept draft is back in the field, with
   * its Inbox or Today (SPEC 5.5).
   */
  function openCapture(): void {
    if (sheet || destroyed) return;
    const kept = read().bench.drafts.capture;
    sheet = { to: kept?.to ?? 'inbox', serial: ++sheetSerial };
    sheetField = undefined;
    raisedFits = true;
    // Opened again as the last one closed: what it raises fades in from here.
    if (lowering !== undefined) clearTimeout(lowering);
    lowering = undefined;
    delete container.dataset['lowering'];
    keyboard.expect();
    together(() => render());
    const field = layer.sheet.querySelector<HTMLInputElement>('#c-field');
    if (!field) return;
    field.focus({ preventScroll: true });
    const end = field.value.length;
    try {
      field.setSelectionRange(end, end);
    } catch {
      // A field that cannot place its caret still takes the typing.
    }
  }

  function sheetOf(
    ride: { view: PresentView; live: PresentLive; look: 'lifted' | 'plain' } | undefined,
    me: boolean,
  ): Built {
    const open = sheet;
    const built = captureSheet({
      text: sheetField?.value ?? read().bench.drafts.capture?.text ?? '',
      to: open?.to ?? 'inbox',
      ...(ride ? { ride } : {}),
      me,
      onInput: draftLater,
      onTo: chooseTo,
      onSave: saveCapture,
      onClose: () => closeCapture(),
      onMe: meFromSheet,
    });
    sheetField = built.field;
    return built;
  }

  /**
   * Close, a swipe down, a tap above the sheet, or back: the sheet drops and
   * what was typed is kept as a draft, shown by the dot on the disc. Focus
   * goes back to the step, in Focus or on Today, or to the disc on a place
   * (SPEC 11). Nothing under the sheet moved, so the person is exactly where
   * they were.
   */
  function closeCapture(land = true): void {
    if (!sheet) return;
    const text = sheetField?.value;
    const to = sheet.to;
    sheet = undefined;
    keyboard.release();
    const before = read();
    if (text !== undefined) keepDraft(text, to);
    if (read() === before) render();
    if (land) landAfterSheet();
  }

  /** The sheet goes with nothing said and nowhere to land: a scenario, a long time away. */
  function dropSheet(): void {
    if (!sheet) return;
    if (sheetField) keepDraft(sheetField.value, sheet.to);
    sheet = undefined;
    keyboard.release();
  }

  /**
   * Save, or the return key: the item is filed, the sheet drops, "Saved to
   * inbox" is said, focus goes back to the step (or the disc on a place), and
   * the Next line, or Focus's foot, offers Undo for six seconds. An empty
   * field files nothing, and the sheet stays.
   */
  function saveCapture(): void {
    if (!sheet) return;
    const text = sheetField?.value ?? '';
    if (text.trim() === '') return;
    if (draftTimer !== undefined) clearTimeout(draftTimer);
    draftTimer = undefined;
    const result = act.save(read(), text, sheet.to, now());
    sheet = undefined;
    keyboard.release();
    if (result.undo) offerUndo(result.undo, /* foldHalf */ true);
    commit(result.state);
    if (result.announce) announce(result.announce);
    landAfterSheet();
  }

  /**
   * Me above the sheet: the sheet closes, keeping the draft, and Me opens as
   * it would from the screen under it, so help stays two taps away (SPEC 5.5).
   */
  function meFromSheet(): void {
    together(() => {
      closeCapture(false);
      if (focusOpen) closeFocus();
      else if (isOpen()) foldDrawer(false);
      openMe();
    });
    if (focusLost()) landFocus(true);
  }

  function chooseTo(to: CaptureTo): void {
    if (!sheet) return;
    sheet = { ...sheet, to };
    if (sheetField) keepDraft(sheetField.value, to);
  }

  /** Typing is kept a moment after it stops, so a reload or a lost tab keeps it. */
  function draftLater(): void {
    if (draftTimer !== undefined) clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      draftTimer = undefined;
      if (sheet && sheetField) keepDraft(sheetField.value, sheet.to);
    }, DRAFT_AFTER);
  }

  /** The draft as the field holds it: kept, or let go when the field is empty. */
  function keepDraft(text: string, to: CaptureTo): void {
    if (draftTimer !== undefined) clearTimeout(draftTimer);
    draftTimer = undefined;
    const state = read();
    const kept = state.bench.drafts.capture;
    if (text.trim() === '') {
      if (!kept) return;
      const { capture: _gone, ...drafts } = state.bench.drafts;
      commit({ ...state, bench: { ...state.bench, drafts } });
      return;
    }
    if (kept?.text === text && kept.to === to) return;
    commit({
      ...state,
      bench: { ...state.bench, drafts: { ...state.bench.drafts, capture: { text, to } } },
    });
  }

  /**
   * Where focus goes when the sheet drops: the step, or the disc on a place
   * (SPEC 11). Quietly: the field had focus to the end, and no ring is drawn.
   */
  function landAfterSheet(): void {
    const spot = focusShown
      ? layer.focus.querySelector<HTMLElement>('#f-step')
      : container.dataset['ground'] === 'present' && !isOpen()
        ? null
        : layer.dock.querySelector<HTMLElement>('#b-capture');
    // On Today, the screen's own block: the lit step, the unlit item, or 7b's heading.
    if (spot) focusOn(spot, true);
    else landFocus(true);
  }

  /**
   * Whether what stays lit above the sheet, the lantern on Today or the step
   * in Focus, clears the sheet's top. Where it does not (an SE's height, a
   * long step), it is put away and the capsule rides the sheet's edge as a
   * picture instead (plan section 11, "5. Capture"). Measured after each
   * render and each move of the keyboard; nothing is measured in a test.
   */
  function fitSheet(): void {
    const from = container.dataset['sheet'];
    if (from !== 'today' && from !== 'focus') return;
    if (container.getBoundingClientRect().height === 0) return;
    const panel = layer.sheet.querySelector('.c-panel');
    const raised =
      from === 'today'
        ? layer.screen.querySelector('.lantern')
        : layer.focus.querySelector('.frow');
    if (!panel || !raised) return;
    const fits =
      raised.getBoundingClientRect().bottom + RAISED_GAP <= panel.getBoundingClientRect().top;
    if (fits === raisedFits) return;
    raisedFits = fits;
    const ride = !fits && layer.sheet.querySelector('.c-ride') !== null;
    if (ride) container.dataset['ride'] = '';
    else delete container.dataset['ride'];
    if (ride && present(read(), now()).kind === 'running') {
      barRunning = true;
      ticker?.refresh();
    }
  }

  /** The sheet fades out as a picture: its ids go, so nothing finds it, and it takes no taps. */
  function startSheetLeaving(): void {
    const part = layer.sheet;
    // The field lets go of the keyboard; whoever closed the sheet says where focus goes.
    const active = document.activeElement;
    if (active instanceof HTMLElement && part.contains(active)) active.blur();
    part.setAttribute('inert', '');
    part.dataset['leaving'] = '';
    keys.delete(part);
    patches.delete(part);
    for (const node of part.querySelectorAll('[id]')) node.removeAttribute('id');
    sheetField = undefined;
    if (sheetLeaving !== undefined) clearTimeout(sheetLeaving);
    sheetLeaving = setTimeout(() => {
      sheetLeaving = undefined;
      if (sheet || destroyed) return;
      paint(part, '', () => ({ nodes: [] }));
      delete part.dataset['leaving'];
      part.hidden = true;
    }, SHEET_FADE_MS);
  }

  function stopSheetLeaving(): void {
    if (sheetLeaving !== undefined) clearTimeout(sheetLeaving);
    sheetLeaving = undefined;
    layer.sheet.removeAttribute('inert');
    delete layer.sheet.dataset['leaving'];
    layer.sheet.hidden = false;
  }

  /** What was raised above the sheet fades in again where it rests (SPEC 10, Reduce Motion). */
  function lower(): void {
    container.dataset['lowering'] = '';
    if (lowering !== undefined) clearTimeout(lowering);
    lowering = setTimeout(() => {
      lowering = undefined;
      delete container.dataset['lowering'];
    }, SHEET_FADE_MS);
  }

  // ---------------------------------------------------------------- history

  /**
   * One history entry for each level above the tab (plan section 8): every
   * page pushed on the current tab, then Focus or the open drawer on top
   * (Focus folds the drawer as it opens, so never both). So Safari's
   * edge swipe and the back button close the top level, as Android's back
   * does (SPEC 11). A level closed by a control here (a back pill, Hide, a
   * tab) takes its entries back with it, quietly. Entries are marked with
   * this mount's own mark, so one left by an earlier load is never mistaken
   * for a level of this one: back onto such an entry is back to the tab.
   */
  const mark = Math.random().toString(36).slice(2);
  const home = location.pathname;
  let entries = 0;
  /** History moves made here whose popstate is still to come. */
  let quiet = 0;
  /** Levels closing and opening as one move: history follows once, after. */
  let holding = false;

  function levels(): number {
    return nav.stack.length + (focusOpen ? 1 : 0) + (isOpen() ? 1 : 0) + (sheet ? 1 : 0);
  }

  function syncHistory(): void {
    if (holding || destroyed) return;
    const want = levels();
    if (want > entries) {
      for (let depth = entries + 1; depth <= want; depth++) {
        history.pushState({ bench: mark, depth }, '');
      }
    } else if (want < entries) {
      quiet++;
      history.go(want - entries);
    }
    entries = want;
  }

  function onPopState(event: PopStateEvent): void {
    if (destroyed || location.pathname !== home) return;
    const state = event.state as { bench?: unknown; depth?: unknown } | null;
    if (state?.bench !== mark || typeof state.depth !== 'number') {
      // An entry an earlier load left (after a reload, which iOS does to a
      // tab it discarded), or one nobody marked. The browser is on it now, so
      // it becomes this load's tab, with nothing above it: every level closes,
      // and the next level opened pushes its entry over this one, where back
      // will find it. Any move still to land is relative to here now.
      history.replaceState({ bench: mark, depth: 0 }, '');
      quiet = 0;
      entries = 0;
      closeLevels(levels());
      return;
    }
    if (quiet > 0) {
      // A move made here has landed; put things right if anything moved since.
      quiet--;
      entries = state.depth;
      syncHistory();
      return;
    }
    // The person went back: close as many levels as they went.
    const close = entries - state.depth;
    entries = state.depth;
    closeLevels(close);
  }

  /** Closes up to `count` levels from the top, with no history moves of their own. */
  function closeLevels(count: number): void {
    together(() => {
      while (count-- > 0 && levels() > 0) closeTop();
    });
  }

  /**
   * Runs `change` with history held, then brings history level with it once.
   * A row or Me in the open drawer folds it and pushes a page: the drawer's
   * entry becomes the page's. Going back for the fold, which lands later, and
   * pushing for the page, which does not wait, would leave their order to
   * the browser.
   */
  function together(change: () => void): void {
    if (holding) return change();
    holding = true;
    try {
      change();
    } finally {
      holding = false;
    }
    syncHistory();
  }

  /** The sheet closes, keeping its draft; otherwise Focus; then the open drawer; then the top page. */
  function closeTop(): void {
    if (sheet) closeCapture();
    else if (focusOpen) closeFocus();
    else if (isOpen()) foldDrawer(true);
    else if (nav.stack.length > 0) back();
  }

  // ---------------------------------------------------------------- the page

  function themeColor(colour: string): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.getAttribute('content') !== colour) meta.setAttribute('content', colour);
  }

  function uiRecord(at: Date): BenchUi {
    return {
      at: at.toISOString(),
      tab: nav.tab,
      stack: [...nav.stack],
      ...(focusOpen ? { focus: { returnTo: nav.tab } } : {}),
      list: nav.list,
      scroll: scrollOf(container),
    };
  }

  /** Going to the background: when, and where the person was (plan section 12). */
  function hide(): void {
    // What is in the field is kept, though the sheet stays open.
    if (sheet && sheetField) keepDraft(sheetField.value, sheet.to);
    dropUndo();
    away = true;
    holdAwake(false);
    const t = now();
    const state = read();
    commit({
      ...state,
      bench: { ...state.bench, away: { since: t.toISOString() }, ui: uiRecord(t) },
    });
    void store.flush().catch(() => undefined);
  }

  /** Coming back: a forgotten clock, the day, passed slots, then where to open. */
  function wakeUp(): void {
    away = false;
    const state = read();
    const woken = wake(state, now());
    if (woken.restore === 'today') {
      dropSheet();
      nav = { ...TODAY, list: nav.list };
      focusOpen = false;
      ticked.clear();
    }
    if (woken.state !== state) commit(woken.state);
    else render();
  }

  /**
   * Where a running task's own minute next turns: "18 min left" becomes
   * "17 min left", and under Reduce Motion the bar steps with it (SPEC 10).
   */
  function sessionMinute(): number | undefined {
    const t = now();
    const current = present(read(), t);
    if (current.kind !== 'running') return undefined;
    const worked = Math.round(timeFacts(current.task, t).worked * MINUTE_MS);
    return t.getTime() + (MINUTE_MS - (worked % MINUTE_MS));
  }

  /** A new minute in the hand: the day may turn at 04:00, and slots may pass. */
  function minute(): void {
    const state = read();
    const t = now();
    const next = passSlots(dayBoundary(state, t, { holding: true }), t);
    if (next !== state) commit(next);
    else render();
  }

  // ---------------------------------------------------------------- go

  history.replaceState({ bench: mark, depth: 0 }, '');
  window.addEventListener('popstate', onPopState);
  container.addEventListener('focusout', onFocusOut);
  container.addEventListener('keydown', onKeyDown);
  const unsubscribe = store.subscribe('domains', render);
  let ticker: Ticker | undefined;
  render();
  ticker = createTicker({
    onTick: ({ minute: turned }) => (turned ? minute() : patchLive()),
    onWake: wakeUp,
    onHide: hide,
    perSecond: () => barRunning && motion(read()) === 'full',
    nextChange: sessionMinute,
    now: () => now().getTime(),
  });
  // A resize can cross the compact height, which changes where the drawer may rest.
  const onResize = () => render();
  window.addEventListener('resize', onResize);
  void document.fonts?.ready.then(() => {
    if (!destroyed) onResize();
  });

  return {
    destroy() {
      destroyed = true;
      if (announcing !== undefined) clearTimeout(announcing);
      if (leaving !== undefined) clearTimeout(leaving);
      if (sheetLeaving !== undefined) clearTimeout(sheetLeaving);
      if (lowering !== undefined) clearTimeout(lowering);
      if (draftTimer !== undefined) clearTimeout(draftTimer);
      keyboard.destroy();
      holdAwake(false);
      dropUndo();
      container.removeEventListener('focusout', onFocusOut);
      container.removeEventListener('keydown', onKeyDown);
      ticker?.destroy();
      unsubscribe();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', onPopState);
      container.replaceChildren();
      container.classList.remove('app');
      for (const name of [
        'drawer',
        'ground',
        'places',
        'motion',
        'more',
        'focus',
        'sheet',
        'ride',
        'lowering',
      ]) {
        delete container.dataset[name];
      }
      container.style.removeProperty('--half-t');
    },
  };
}
