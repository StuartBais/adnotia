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
// Built so far (plan section 19, chunk 2): the frame, Today in every state,
// the drawer at rest at its lip, folded and half and open by tap, the capsule
// on the places and the open drawer, the tabs with bare places, Me with the
// crisis page, and About with the scenario buttons. Focus and capture come
// next; their controls are in place and do nothing yet.

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

/** How long the live region stays empty before it says something (ms). */
export const ANNOUNCE_AFTER = 100;

export function mountBench(options: BenchOptions): { destroy(): void } {
  const { store, container } = options;
  const now = options.now ?? (() => new Date());
  const confirm = options.confirm ?? ((question: string) => window.confirm(question));

  const read = () => store.document().domains as BenchDomains;
  const commit = (next: BenchDomains) => {
    if (next !== read()) store.updateDomains(() => next);
  };

  // ---------------------------------------------------------------- boot

  let nav: Nav = { ...TODAY };
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
    live: h('div', { class: 'live', 'aria-live': 'polite' }),
  };
  container.append(hints());

  const keys = new Map<HTMLElement, string>();
  const patches = new Map<HTMLElement, Built['patch']>();
  /** Rows ticked since the list was opened: they stay in place as discs. */
  const ticked = new Set<string>();
  let shown: { position: DrawerPosition; tab: Tab; page: string | undefined } | undefined;
  /** Where the drawer rested before it was opened, so Hide returns there. */
  let beforeOpen: { key: 'running' | 'idle'; position: 'half' | 'folded' } | undefined;
  let order = '';
  let barRunning = false;
  let destroyed = false;
  let announcing: ReturnType<typeof setTimeout> | undefined;

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
      if (again && target.contains(again)) again.focus();
      else if (focusLost()) landFocus();
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
   * block, rather than falling to the page.
   */
  function landFocus(): void {
    const homes = container.querySelectorAll<HTMLElement>('[data-focus-home]');
    [...homes].find((home) => !home.closest('[inert]'))?.focus({ preventScroll: true });
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
    const byMinute = motion(state) === 'reduced';
    const places = state.bench.settings.places;

    // The drawer. Below 740 pt the half drawer would bring timed rows under
    // capture's lane, so it rests folded there, as it does at large text sizes
    // (SPEC 9.8); a proposal, since SPEC draws the half drawer at 844 only.
    const rule = drawerPositions(state, t, { view, largeText: compact() });
    const position = rule.position;
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
    themeColor(ground === 'place' && places === 'white' ? WHITE : CHARCOAL);

    // The present, as it is now.
    const presentNow = presentView(state, t);
    const live = presentNow && presentLive(presentNow, t, byMinute);

    // The page.
    const today = view.kind === 'today' ? todayView(state, t) : undefined;
    layer.screen.className = today ? 'screen today' : 'screen';
    if (today) layer.screen.dataset['lamp'] = lampOf(today);
    else delete layer.screen.dataset['lamp'];
    paint(layer.screen, screenKey(view, today), () => screen(view, today, live));
    // The open drawer covers the screen: what is under it is not read or reached.
    for (const under of [layer.screen, layer.fade]) {
      if (open) under.setAttribute('inert', '');
      else under.removeAttribute('inert');
    }

    // The dock line. On the open drawer the lantern has folded into the
    // capsule, which sits on the cover with capture (SPEC 5.2).
    const mode = capsuleMode(view, current, position, false);
    const lit = today?.kind === 'lit' && !open;
    const capsule =
      !lit && mode !== 'hidden' && presentNow && live
        ? {
            view: presentNow,
            live,
            look: capsuleLook(places, position),
            mode,
            onOpen: openFocus,
          }
        : undefined;
    const props: DockProps = {
      ...(lit && today?.kind === 'lit'
        ? {
            present: {
              taskId: today.present.task.id,
              paused: today.present.kind === 'paused',
              step: today.present.step,
              isLast: today.present.steps.isLast,
              onStepDone: () => run(act.stepDone, today.present.task.id),
              onPause: () => run(act.pause, today.present.task.id),
              onResume: () => run(act.start, today.present.task.id),
            },
          }
        : {}),
      ...(capsule ? { capsule } : {}),
      captureOnLight:
        open ||
        (ground === 'present' && position === 'half') ||
        (ground === 'place' && places === 'white'),
      draftKept: state.bench.drafts.capture !== undefined && state.bench.drafts.capture.text !== '',
      onCapture: openCapture,
    };
    paint(layer.dock, dockKey(props), () => dock(props));
    layer.fade.hidden = !(ground === 'place' && capsule !== undefined && !open);

    // The drawer, and Hide at its foot when it is open.
    if (position === 'lip') layer.drawer.setAttribute('inert', '');
    else layer.drawer.removeAttribute('inert');
    paint(layer.drawer, drawerKey(state, t, position, today), () =>
      drawer(state, t, position, today),
    );
    paint(layer.foot, open ? 'hide' : '', () => ({ nodes: open ? hideFoot(hideDrawer) : [] }));

    // The tabs.
    paint(layer.tabs, nav.tab, () => ({ nodes: tabs(nav.tab, chooseTab) }));

    // Reading order: top to bottom, then the dock line, then the drawer, except
    // where the drawer's list is read before capture: on the half drawer (SPEC
    // 11, list 7) and the open one, whose Hide is read after the dock line from
    // its own layer (list 2). Moving a node takes focus off anything inside it,
    // so only the drawer moves, and focus is put back where it was.
    const wanted = position === 'half' || open ? 'list-first' : 'dock-first';
    if (order === '') {
      container.append(
        ...(wanted === 'list-first'
          ? [layer.screen, layer.fade, layer.drawer, layer.dock, layer.foot, layer.tabs, layer.live]
          : [
              layer.screen,
              layer.fade,
              layer.dock,
              layer.drawer,
              layer.foot,
              layer.tabs,
              layer.live,
            ]),
      );
    } else if (order !== wanted) {
      const active = document.activeElement;
      container.insertBefore(layer.drawer, wanted === 'list-first' ? layer.dock : layer.foot);
      if (
        active instanceof HTMLElement &&
        active.isConnected &&
        document.activeElement !== active
      ) {
        active.focus({ preventScroll: true });
      }
    }
    order = wanted;

    barRunning = current.kind === 'running' && (today?.kind === 'lit' || capsule !== undefined);
    patchAll(live);
    layout(position);
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
          onFocus: openFocus,
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
    const next = nextLine(state, t);
    const shape =
      next.kind === 'line' ? { ...next, inMinutes: next.inMinutes !== undefined } : next;
    return JSON.stringify(['folded', shape]);
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
        onMe: () => {
          foldDrawer(false);
          openMe();
        },
        ...rows,
      });
      return {
        nodes: opened.nodes,
        patch() {
          opened.set(dayList(read(), now(), { keep: ticked, inLine: true }));
        },
      };
    }
    const next = nextLine(state, t);
    if (next.kind === 'lip') return { nodes: [] };
    const folded = foldedDrawer({ ...handleWords(next), onOpen: openDrawer });
    return {
      nodes: folded.nodes,
      // The ticker's minute: "in 25 min" becomes "in 24 min" where it stands.
      patch() {
        const again = nextLine(read(), now());
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
    commit(result.state);
    if (result.announce) announce(result.announce);
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
    if (isOpen()) {
      foldDrawer(false);
      if (tab === nav.tab) return;
    }
    if (tab === nav.tab && nav.stack.length === 0) return;
    go({ tab, stack: [], list: nav.list });
  }

  /** A row in the day's list opens its task; from the open drawer, folding it. */
  function openTask(id: string): void {
    if (isOpen()) foldDrawer(false);
    push({ kind: 'task', id });
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
    commit(loadScenario(read(), id, now()));
    ticked.clear();
    go({ ...TODAY });
  }

  function deleteAll(): void {
    if (!confirm(ABOUT.deleteConfirm)) return;
    const t = now();
    commit(migrateBench(emptyDomains(), t));
    ticked.clear();
    go({ ...TODAY });
  }

  // Built in the chunks that follow (plan section 19): Focus (3) and capture
  // (4). Their controls are where they belong.
  function openFocus(): void {}
  function openCapture(): void {}

  // ---------------------------------------------------------------- history

  /**
   * One history entry for each level above the tab (plan section 8): every
   * page pushed on the current tab, then the open drawer on top. So Safari's
   * edge swipe and the back button close the top level, as Android's back
   * does (SPEC 11). A level closed by a control here (a back pill, Hide, a
   * tab) takes its entries back with it, quietly. Entries are marked with
   * this mount's own mark, so one left by an earlier load is never mistaken
   * for a level of this one.
   */
  const mark = Math.random().toString(36).slice(2);
  let entries = 0;
  /** History moves made here whose popstate is still to come. */
  let quiet = 0;
  /** Closing levels for a popstate: one sync once they are all closed. */
  let popping = false;

  function levels(): number {
    return nav.stack.length + (isOpen() ? 1 : 0);
  }

  function syncHistory(): void {
    if (popping || destroyed) return;
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
    const state = event.state as { bench?: unknown; depth?: unknown } | null;
    if (destroyed || state?.bench !== mark || typeof state.depth !== 'number') return;
    if (quiet > 0) {
      // A move made here has landed; put things right if anything moved since.
      quiet--;
      entries = state.depth;
      syncHistory();
      return;
    }
    // The person went back: close as many levels as they went.
    let close = entries - state.depth;
    entries = state.depth;
    popping = true;
    try {
      while (close-- > 0 && levels() > 0) closeTop();
    } finally {
      popping = false;
    }
    syncHistory();
  }

  /** The open drawer folds; otherwise the top page goes. */
  function closeTop(): void {
    if (isOpen()) foldDrawer(true);
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
      list: nav.list,
      scroll: scrollOf(container),
    };
  }

  /** Going to the background: when, and where the person was (plan section 12). */
  function hide(): void {
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
    const state = read();
    const woken = wake(state, now());
    if (woken.restore === 'today') {
      nav = { ...TODAY, list: nav.list };
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
      ticker?.destroy();
      unsubscribe();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', onPopState);
      container.replaceChildren();
      container.classList.remove('app');
      for (const name of ['drawer', 'ground', 'places', 'motion', 'more']) {
        delete container.dataset[name];
      }
      container.style.removeProperty('--half-t');
    },
  };
}
