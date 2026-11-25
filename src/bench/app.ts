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
// the drawer at rest at its lip, folded and half, the capsule on the places,
// the tabs with bare places, Me with the crisis page, and About with the
// scenario buttons. Focus, capture, the open drawer and Undo come next; their
// controls are in place and do nothing yet.

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
  wake,
  type BenchDomains,
  type BenchUi,
  type DrawerPosition,
  type Page,
  type Tab,
  type TaskList,
  type View,
} from './state';
import { createTicker, type Ticker } from './clock';
import { dock, foldedDrawer, halfDrawer, hints, tabs, type Built, type DockProps } from './frame';
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
import { h, injectSprite } from './ui';
import {
  dayList,
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
const WHITE = '#FFFFFF';

const TODAY: Nav = { tab: 'today', stack: [], list: 'inbox' };

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
    tabs: h('div', { class: 'tabs' }),
    live: h('div', { class: 'live', 'aria-live': 'polite' }),
  };
  container.append(hints());

  const keys = new Map<HTMLElement, string>();
  const patches = new Map<HTMLElement, Built['patch']>();
  /** Rows ticked since the list was opened: they stay in place as discs. */
  const ticked = new Set<string>();
  let shown: { position: DrawerPosition; tab: Tab; page: string | undefined } | undefined;
  let order = '';
  let barRunning = false;
  let destroyed = false;

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
    }
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

    // The drawer. Its open position is built next (plan section 19); until
    // then it rests where it would fold to. Below 740 pt the half drawer would
    // bring timed rows under capture's lane, so it rests folded there, as it
    // does at large text sizes (SPEC 9.8); a proposal, since SPEC draws the
    // half drawer at 844 only.
    const rule = drawerPositions(state, t, { view, largeText: compact() });
    const position: DrawerPosition = rule.position === 'open' ? 'folded' : rule.position;
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

    // The dock line.
    const mode = capsuleMode(view, current, position, false);
    const capsule =
      today?.kind !== 'lit' && mode !== 'hidden' && presentNow && live
        ? {
            view: presentNow,
            live,
            look: capsuleLook(places, position),
            mode,
            onOpen: openFocus,
          }
        : undefined;
    const props: DockProps = {
      ...(today?.kind === 'lit'
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
        (ground === 'present' && position === 'half') || (ground === 'place' && places === 'white'),
      draftKept: state.bench.drafts.capture !== undefined && state.bench.drafts.capture.text !== '',
      onCapture: openCapture,
    };
    paint(layer.dock, dockKey(props), () => dock(props));
    layer.fade.hidden = !(ground === 'place' && capsule !== undefined);

    // The drawer at rest.
    if (position === 'lip') layer.drawer.setAttribute('inert', '');
    else layer.drawer.removeAttribute('inert');
    paint(layer.drawer, drawerKey(state, t, position, today), () =>
      drawer(state, t, position, today),
    );

    // The tabs.
    paint(layer.tabs, nav.tab, () => ({ nodes: tabs(nav.tab, chooseTab) }));

    // Reading order: top to bottom, then the dock line, then the drawer, except
    // on the half drawer, whose list is read before capture (SPEC 11, list 7).
    const wanted = position === 'half' ? 'half' : 'rest';
    if (order !== wanted) {
      order = wanted;
      const sequence =
        wanted === 'half'
          ? [layer.screen, layer.fade, layer.drawer, layer.dock, layer.tabs, layer.live]
          : [layer.screen, layer.fade, layer.dock, layer.drawer, layer.tabs, layer.live];
      container.append(...sequence);
    }

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
            ? today.idle
            : today.heading,
      ]);
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
      return todayScreen(today, live, {
        onMe: openMe,
        onFocus: openFocus,
        onSetAside: (id) => run(act.setAside, id),
        onOpenTask: (id) => push({ kind: 'task', id }),
        onStart: (id) => run(act.start, id),
        onOpenInbox: () => go({ tab: 'tasks', stack: [], list: 'inbox' }),
      });
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
    return JSON.stringify(['folded', nextLine(state, t)]);
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
    if (position === 'half') {
      return {
        nodes: halfDrawer({
          list: dayList(state, t, { keep: ticked, ...exclusion(today) }),
          onOpen: openDrawer,
          onRow: (id) => push({ kind: 'task', id }),
          onTick: (id) => {
            ticked.add(id);
            run(act.tick, id);
          },
          onUntick: (id) => run(act.untick, id),
        }),
      };
    }
    const next = nextLine(state, t);
    if (next.kind === 'lip') return { nodes: [] };
    const lines = handleLines(next);
    const [section, ...rest] = lines.line1.split(' · ');
    return {
      nodes: foldedDrawer({
        section: section ?? '',
        when: rest.length > 0 ? rest.join(' · ') : undefined,
        time: lines.time,
        title: lines.title,
        label: handleLabel(next),
        onOpen: openDrawer,
      }),
    };
  }

  // ---------------------------------------------------------------- measuring

  /**
   * The half drawer's top follows what is lit above it: Start's foot plus 16,
   * or the unlit block's under rule 3, and never above y 366 on the board. At
   * rest, the list is cut to the last whole row above the tabs' cover, so that
   * row is the covered one (plan section 10, "Rows").
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
    if (!viewport) return;
    viewport.style.removeProperty('height');
    const list = viewport.querySelector<HTMLElement>('.list');
    if (!list) return;
    const room = viewport.clientHeight;
    let cut = 0;
    for (const row of list.querySelectorAll<HTMLElement>('[data-row]')) {
      const bottom = row.offsetTop + row.offsetHeight;
      if (bottom <= room) cut = Math.max(cut, bottom);
    }
    if (cut > 0) viewport.style.height = `${cut}px`;
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

  function announce(text: string): void {
    layer.live.textContent = text;
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

  /** A tab clears the pages pushed on the current one. */
  function chooseTab(tab: Tab): void {
    if (tab === nav.tab && nav.stack.length === 0) return;
    go({ tab, stack: [], list: nav.list });
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

  // Built in the chunks that follow (plan section 19): Focus (3), capture (4)
  // and the open drawer (the rest of 2). Their controls are where they belong.
  function openFocus(): void {}
  function openCapture(): void {}
  function openDrawer(): void {}

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

  /** A new minute in the hand: the day may turn at 04:00, and slots may pass. */
  function minute(): void {
    const state = read();
    const t = now();
    const next = passSlots(dayBoundary(state, t, { holding: true }), t);
    if (next !== state) commit(next);
    else render();
  }

  // ---------------------------------------------------------------- go

  const unsubscribe = store.subscribe('domains', render);
  let ticker: Ticker | undefined;
  render();
  ticker = createTicker({
    onTick: ({ minute: turned }) => (turned ? minute() : patchLive()),
    onWake: wakeUp,
    onHide: hide,
    perSecond: () => barRunning && motion(read()) === 'full',
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
      ticker?.destroy();
      unsubscribe();
      window.removeEventListener('resize', onResize);
      container.replaceChildren();
      container.classList.remove('app');
      for (const name of ['drawer', 'ground', 'places', 'motion']) delete container.dataset[name];
      container.style.removeProperty('--half-t');
    },
  };
}
