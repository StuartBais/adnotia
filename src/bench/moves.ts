// The animated path (design/lantern/PROTOTYPE-PLAN.md section 14, phase B,
// items 2 to 8; SPEC 10), behind data-motion=full. Reduce Motion is the
// other path, and nothing here runs on it.
//
// The app never waits for a motion. Each tap changes the page at once,
// exactly as under Reduce Motion: the record, history, focus, the tap guard.
// Then, in the same task, before the browser draws, this file compares what
// was on screen with what is now, and draws the way between them: pictures of
// what went (motion.ts, `freeze`), the new elements carried from where the old
// ones stood, and the real page kept out of sight underneath while that
// happens. When a motion ends, its pictures go and the page shows itself as
// it already was. So a second tap in the middle lands on the page as it will
// be, the tap guard holding as it would, and an ended motion leaves nothing
// behind, which is what the Reduce Motion path is held to.
//
// What runs, and when:
//
// - The drawer, moved by a tap rather than a finger, travels on its spring.
// - The lantern and the capsule are one layer at two sizes: as the drawer
//   opens or folds on Today, or Today is left or reached, the step, the bar
//   and the minutes travel and scale between the lantern and the capsule,
//   inside a charcoal frame whose corners round from 0 to 32. Under a finger
//   the same layer follows the drawer frame by frame (`travel`).
// - The capsule grows into Focus, and "⌄ Today" shrinks it back, into the
//   capsule or the lantern.
// - The capture disc grows into its sheet, Today's lantern slides up above
//   it, and the sheet drops when it closes.
// - Start grows the sentence into the step and draws the bar in from empty.
// - Step done lifts the finished step away in ash and the next rises.
// - Pause and Resume, and the Next line's words, cross-fade in place.
// - A page pushed on a tab slides in, and slides back out.
//
// Motion only ever moves by transform and fades by opacity; nothing is laid
// out for its sake, will-change is set only while it runs, and nothing
// bounces, pulses or runs on its own.

import type { DrawerPosition, Tab } from './state';
import {
  Motions,
  NONE,
  along,
  backwards,
  boxOf,
  frameNode,
  frameTracks,
  freeze,
  lerpXf,
  mapTo,
  placeAt,
  scrub as scrubbed,
  springCurve,
  type Animate,
  type Box,
  type Curve,
  type FrameAt,
  type Plan,
  type Scrubbed,
  type Stop,
  type Timers,
  type Track,
  type Xf,
} from './motion';

// ---------------------------------------------------------------- what is on screen

/** What the screen shows, as far as motion cares: worked out by render(). */
export interface Scene {
  tab: Tab;
  /** The tab and the pages pushed on it. */
  place: string;
  depth: number;
  /** The task that is the present, if any, how it is, and its current step. */
  present: string | undefined;
  kind: 'running' | 'paused' | undefined;
  step: string | undefined;
  today: 'lit' | 'idle' | 'planned' | undefined;
  position: DrawerPosition;
  focus: boolean;
  /** What the dock line's slot holds. */
  slot: 'present' | 'capsule' | 'focus' | 'none';
  /** The lantern lit on Today, not under the open drawer, nor under Focus. */
  lit: boolean;
  /** The capture sheet, and what it was opened over. */
  sheet: 'today' | 'focus' | 'place' | undefined;
}

export interface MovesHost {
  container: HTMLElement;
  layers: {
    screen: HTMLElement;
    ghost: HTMLElement;
    morph: HTMLElement;
    dock: HTMLElement;
    drawer: HTMLElement;
    focus: HTMLElement;
    focusFoot: HTMLElement;
    sheet: HTMLElement;
  };
  animate: Animate;
  timers: Timers;
  /** Full motion, in a browser that can play it. */
  enabled(): boolean;
  /**
   * A way out has ended, at its end or cut short: what it was taking out
   * (Focus's layers, or the capture sheet) goes now rather than at its timer.
   */
  gone(what: 'focus' | 'sheet'): void;
  /** The dock line's slot as it would be built now: the capsule, or Today's own buttons. */
  dockNodes(kind: 'capsule' | 'present'): Node[];
}

// ---------------------------------------------------------------- the lengths

/** The drawer's spring (SPEC 10, response 0.35 s), and the lantern and Focus on it. */
const SPRING: Curve = springCurve();
/** Capture's: "about 300 ms, critically damped" (SPEC 10). */
export const CAPTURE_RESPONSE = 0.28;
const CAPTURE: Curve = springCurve(CAPTURE_RESPONSE);
/** How long the capture sheet takes to drop (ms): the drop's end takes the leaving sheet away. */
export const DROP_MS = CAPTURE.duration;
/** "Fade in the first 100 ms", and out in the last (SPEC 10). */
const FIRST = 100;
/**
 * How long each spring is felt to take, which its fades are timed against:
 * the lantern's "about 350 ms" and Focus's "about 400 ms" (SPEC 10). Each
 * comes within a thousandth of the way only by 514 ms, and its last 150 ms
 * move less than a point, so "the last 100 ms" is the last of what is seen.
 */
const LANTERN_MS = 350;
const FOCUS_MS = 400;
/**
 * The capsule itself is swapped in or out where the moving layer is already
 * on it: going, over the first 40 ms, before the layer has moved off it;
 * arriving, over the spring's last 150 ms, by which time the layer is within
 * about 1% of the way, so nothing is drawn twice side by side.
 */
const CUT_MS = 40;
const LAND_MS = 150;
/** Focus's context line, controls and foot fade in over the last 120 ms (SPEC 10). */
const FOCUS_LAST = 120;
/** Step done: the finished step rises and the next one rises into place (SPEC 10). */
export const STEP_MS = 250;
/** Pause and Resume, and the Next line's words: a cross-fade in place (SPEC 10). */
export const CROSS_MS = 150;
/** Start: the bar draws in from empty to full (SPEC 10). */
export const DRAW_MS = 250;
/** How far the finished step rises, and the next rises from (pt). */
const RISE = 24;
/** An ease-out for the moves that are not on a spring. */
const EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)';
/** A pushed page's ground slides this share of the width the other way. */
const BEHIND = 0.3;

const CHARCOAL = 'var(--charcoal)';
const STONE = 'var(--stone)';
const TERRA = 'var(--terra)';

/** What the lantern's parts are in the capsule and in Focus. */
const LANTERN = {
  whole: '.screen .lantern',
  nowline: '.screen .lit-block .nowline',
  now: '.screen .lit-block .nowline .nowtag, .screen .lit-block .nowline.paused > b',
  ttl: '.screen .lit-block .ttl',
  step: '.screen .lit-block .step',
  bar: '.screen .lit-block .bar',
  mins: '.screen .lit-block .mins strong',
  rest: '.screen .lit-block .mins .rest',
  note: '.screen .lit-block .note',
  aside: '.screen .lantern .aside',
  nowtitle: '.screen .lit-block .nowtitle',
  flabel: '.screen .lit-block .flabel',
} as const;

const CAPSULE = {
  whole: '.capsule',
  now: '.c1 .nowtag, .c1 .ptag',
  step: '.cstep',
  bar: '.bar',
  mins: '.c2 b',
} as const;

const FOCUS = {
  body: '.fbody',
  ctx: '.fctx',
  done: '.fdone',
  doneText: '.fdone-t',
  disc: '.fdisc',
  step: '.fstep',
  after: '.fafter',
  bar: '.fbody > .bar',
  frow: '.frow',
  mins: '.fmins strong',
  rest: '.fmins .rest',
  side: '.frow > .pill',
  note: '.fbody > .note',
} as const;

const IDLE = {
  whole: '.screen .idle',
  status: '.screen .idle-status',
  label: '.screen .idle-block .label',
  sentence: '.screen .idle-block .sentence',
  after: '.screen .idle-block .after',
  meta: '.screen .idle-block .meta',
  under: '.screen .idle-block .under',
  start: '.screen .idle .start',
} as const;

// ---------------------------------------------------------------- parts

/** An element as it stood: where, a picture of it, and its type. */
export interface Part {
  el: HTMLElement;
  box: Box;
  pic: HTMLElement;
  font: number;
  line: number;
  text: string;
}

type Parts<K extends string> = Partial<Record<K, Part>>;

function fontOf(el: Element): { font: number; line: number } {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  const font = Number.parseFloat(style?.fontSize ?? '') || 16;
  const line = Number.parseFloat(style?.lineHeight ?? '') || font * 1.2;
  return { font, line };
}

/** Whether the element is drawn at all: in the page, and not display: none. */
function drawn(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement) || !el.isConnected) return false;
  if (el.closest('[hidden]')) return false;
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  return style?.display !== 'none';
}

/** A colour with nothing in it. */
function transparent(colour: string): boolean {
  return colour === '' || colour === 'transparent' || /rgba\(.*,\s*0\)$/.test(colour);
}

function attrsOf(el: Element): [string, string][] {
  return [...el.attributes].map((a) => [a.name, a.value]);
}

/** Puts back exactly these attributes. */
function setAttrs(el: Element, attrs: readonly [string, string][]): void {
  const keep = new Set(attrs.map(([name]) => name));
  for (const a of [...el.attributes]) if (!keep.has(a.name)) el.removeAttribute(a.name);
  for (const [name, value] of attrs)
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/**
 * A picture's lists where the page's were: scroll positions read in document
 * order from the page, written onto the copy's elements in the same order
 * (the copy's own children, with `children`, or its descendants).
 */
function restoreScrolls(pic: HTMLElement, scrolls: readonly number[], children: boolean): void {
  const all = children
    ? [...pic.children].flatMap((child) => [child, ...child.querySelectorAll('*')])
    : [...pic.querySelectorAll('*')];
  scrolls.forEach((top, i) => {
    const el = all[i];
    if (top > 0 && el) el.scrollTop = top;
  });
}

// ---------------------------------------------------------------- the moves

interface Snapshot {
  scene: Scene;
  drawerY: number;
  lantern: Parts<keyof typeof LANTERN>;
  capsule: Parts<keyof typeof CAPSULE>;
  pills: Part[];
  focus: Parts<keyof typeof FOCUS>;
  foot: Part[];
  idle: Parts<keyof typeof IDLE>;
  handle: Part[];
  disc: Part | undefined;
  ride: Part | undefined;
  panel: Box | undefined;
  /** The drawer's content before it was rebuilt, as a picture. */
  drawer: { pic: HTMLElement; scrolls: number[] } | undefined;
  /** The page before it was replaced, for a slide. */
  ghost: { pic: HTMLElement; scrolls: number[] } | undefined;
  /** The app's and the page's own attributes as they were, which the look of what was on screen hangs on. */
  attrs: { app: [string, string][]; screen: [string, string][] };
}

export interface Moves {
  /** At the top of render(): what the screen is about to show. */
  begin(next: Scene): void;
  /** Just before a layer is rebuilt. */
  beforePaint(target: HTMLElement): void;
  /** Whether a page change in this render is drawn as a slide rather than a fade. */
  slides(prev: Scene | undefined, next: Scene): boolean;
  /** The scene the last render drew. */
  readonly last: Scene | undefined;
  /** Renders inside `change` land where the drawer was pulled to: nothing is drawn for them. */
  quietly(change: () => void): void;
  /** Where the drawer is drawn now, if a motion is carrying it. */
  drawerY(): number | undefined;
  /** A pull began on Today (or the present's own page), from where the drawer rests. */
  beginTravel(from: DrawerPosition): void;
  /** A frame of the pull: 0 folded, 1 open. */
  moveTravel(lift: number): void;
  /** Whether a pull is drawing the lantern and the capsule as one layer. */
  readonly travelling: boolean;
  endTravel(): void;
  /** Everything ends at once: going to the background, a scenario, the end. */
  endAll(): void;
  destroy(): void;
}

export function createMoves(host: MovesHost): Moves {
  const { container, layers } = host;
  const motions = new Motions(host.animate, host.timers);
  let last: Scene | undefined;
  let batch: Snapshot | undefined;
  let quiet = 0;
  let travel: Scrubbed | undefined;
  let destroyed = false;

  const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = container) =>
    root.querySelector<T & HTMLElement>(sel);
  const width = () => container.getBoundingClientRect().width;
  const height = () => container.getBoundingClientRect().height;

  function part(el: Element | null): Part | undefined {
    if (!drawn(el)) return undefined;
    return {
      el,
      box: boxOf(el, container),
      pic: freeze(el),
      ...fontOf(el),
      text: el.textContent ?? '',
    };
  }

  function parts<K extends string>(
    map: Record<K, string>,
    root: ParentNode = container,
    skip: readonly string[] = [],
  ): Parts<K> {
    const out: Parts<K> = {};
    for (const key of Object.keys(map) as K[]) {
      if (skip.includes(key)) continue;
      const sel = map[key];
      const found = part(
        root instanceof Element && root.matches(sel) ? root : root.querySelector(sel),
      );
      if (found) out[key] = found;
    }
    return out;
  }

  /**
   * What is on screen now, before anything in this render has changed it:
   * where each part stands, and a picture of it. Only what this change could
   * draw is pictured: a whole lantern or Focus only for Pause and Resume, the
   * idle lantern only for Start, the Next line only where it stays folded.
   */
  function snapshot(scene: Scene, next: Scene | undefined): Snapshot {
    const capsuleEl = q('.dock .capsule');
    const sheetPanel = q('.sheet-layer[data-capture]:not([data-leaving]) .c-panel');
    const all = (els: Iterable<Element>) =>
      [...els].map((el) => part(el)).filter((p): p is Part => p !== undefined);
    const crossfade = !next || next.kind !== scene.kind;
    const whole = crossfade ? [] : ['whole', 'body'];
    return {
      scene,
      drawerY: boxOf(layers.drawer, container).y,
      lantern: q(LANTERN.whole, layers.screen) ? parts(LANTERN, layers.screen, whole) : {},
      capsule: capsuleEl ? parts(CAPSULE, capsuleEl) : {},
      pills: all(layers.dock.querySelectorAll('.dock-pill')),
      focus:
        scene.focus && !layers.focus.hidden && !layers.focus.hasAttribute('data-leaving')
          ? parts(FOCUS, layers.focus, whole)
          : {},
      foot: scene.focus ? all(layers.focusFoot.querySelectorAll('.ff-line, .undo')) : [],
      idle:
        scene.today === 'idle' && q(IDLE.whole, layers.screen) ? parts(IDLE, layers.screen) : {},
      handle:
        scene.position === 'folded' && (!next || next.position === 'folded')
          ? all(layers.drawer.querySelectorAll(':scope > .handle.folded, :scope > .undo'))
          : [],
      disc: next && next.sheet !== scene.sheet ? part(q('#b-capture')) : undefined,
      ride: part(q('.sheet-layer[data-capture]:not([data-leaving]) .c-ride .capsule')),
      panel: sheetPanel ? boxOf(sheetPanel, container) : undefined,
      drawer: undefined,
      ghost: undefined,
      attrs: { app: attrsOf(container), screen: attrsOf(layers.screen) },
    };
  }

  /** Runs `read` with the app and the page as they were when the snapshot was taken. */
  function asItWas<T>(snap: Snapshot, read: () => T): T {
    const app = attrsOf(container);
    const screen = attrsOf(layers.screen);
    setAttrs(container, snap.attrs.app);
    setAttrs(layers.screen, snap.attrs.screen);
    try {
      return read();
    } finally {
      setAttrs(container, app);
      setAttrs(layers.screen, screen);
    }
  }

  function freezeScreen(): { pic: HTMLElement; scrolls: number[] } {
    const scrolls = [...layers.screen.querySelectorAll('*')].map((el) => el.scrollTop);
    return { pic: freeze(layers.screen), scrolls };
  }

  function freezeDrawer(): { pic: HTMLElement; scrolls: number[] } | undefined {
    const target = layers.drawer;
    if (target.childElementCount === 0) return undefined;
    // Only its content: the drawer's own stone and shadow stay with the drawer.
    const pic = document.createElement('div');
    pic.className = 'mdrawer';
    pic.setAttribute('aria-hidden', 'true');
    pic.setAttribute('inert', '');
    const scrolls: number[] = [];
    for (const child of target.children) {
      pic.append(freeze(child));
      scrolls.push(...[child, ...child.querySelectorAll('*')].map((el) => el.scrollTop));
    }
    return { pic, scrolls };
  }

  /** Changes that something here draws. */
  function changed(a: Scene, b: Scene): boolean {
    return (
      a.place !== b.place ||
      a.position !== b.position ||
      a.focus !== b.focus ||
      a.sheet !== b.sheet ||
      a.today !== b.today ||
      a.present !== b.present ||
      a.kind !== b.kind ||
      a.step !== b.step ||
      a.slot !== b.slot
    );
  }

  /** Opens a batch: what runs is ended (all of it, or only `ends`), and what is on screen pictured. */
  function open(prev: Scene, next?: Scene, ends?: readonly string[]): void {
    if (batch) return;
    // What runs now is ended first, so what is measured is the page at rest.
    const y = motions.get('drawer') ? boxOf(layers.drawer, container).y : undefined;
    const lantern = motions.get('present');
    const morphAt =
      lantern && (lantern.plan as LanternPlan).lantern
        ? { at: lantern.progress(), to: lantern.plan.to ?? 1 }
        : undefined;
    if (ends) motions.end(...ends);
    else motions.end();
    batch = snapshot(prev, next);
    if (next && slides(prev, next)) batch.ghost = freezeScreen();
    if (next && next.position !== prev.position) batch.drawer = freezeDrawer();
    if (y !== undefined) batch.drawerY = y;
    if (morphAt !== undefined) retarget = morphAt;
    queueMicrotask(flush);
  }

  /**
   * Where a lantern morph was, and where it was going, when another starts
   * before it ends (0 the lantern, 1 the capsule): sent back, the new one
   * sets off from there.
   */
  let retarget: { at: number; to: number } | undefined;

  function begin(next: Scene): void {
    const prev = last;
    last = next;
    if (destroyed || !host.enabled() || quiet > 0 || !prev) return;
    if (!batch && changed(prev, next)) open(prev, next);
  }

  function beforePaint(target: HTMLElement): void {
    if (destroyed || !host.enabled() || quiet > 0 || !last) return;
    if (!batch) {
      // The Next line or Focus's foot rebuilt in place: a cross-fade, with
      // nothing else changed. Focus's foot emptied as Focus goes is not one.
      if (target !== layers.drawer && target !== layers.focusFoot) return;
      if (target === layers.focusFoot && (!last.focus || target.hasAttribute('data-leaving')))
        return;
      // Only its own cross-fade gives way. Whatever else is moving goes on as
      // it was, and the words change at once under it rather than cross-fade
      // over something on its way.
      const channel = target === layers.drawer ? 'line' : 'foot';
      if (motions.busy(['line', 'foot'])) {
        motions.end(channel);
        return;
      }
      open(last, last, [channel]);
    }
    const snap = batch;
    if (!snap) return;
    // A change the first render of this task did not show: what was on
    // screen is read with the app's attributes put back as they were.
    if (target === layers.drawer && !snap.drawer && last.position !== snap.scene.position) {
      snap.drawer = asItWas(snap, freezeDrawer);
    }
    if (target === layers.screen && !snap.ghost && slides(snap.scene, last)) {
      snap.ghost = asItWas(snap, freezeScreen);
    }
  }

  function slides(prev: Scene | undefined, next: Scene): boolean {
    return (
      host.enabled() &&
      prev !== undefined &&
      prev.tab === next.tab &&
      prev.place !== next.place &&
      prev.depth !== next.depth
    );
  }

  /** The lantern and the capsule, between these scenes: forward is lantern to capsule. */
  function lanternMorph(prev: Scene, next: Scene): 1 | -1 | undefined {
    if (prev.present !== next.present || !next.present) return undefined;
    if (prev.lit && next.slot === 'capsule') return 1;
    if (prev.slot === 'capsule' && next.lit) return -1;
    return undefined;
  }

  // ---------------------------------------------------------------- planning

  function flush(): void {
    const snap = batch;
    batch = undefined;
    const sentBack = retarget;
    retarget = undefined;
    if (!snap || destroyed || !host.enabled() || !last) return;
    const built: Plan[] = [];
    try {
      plan(snap.scene, last, snap, sentBack, built);
    } catch {
      // A motion that cannot be drawn is not drawn: the page is already
      // right, and nothing drawn on the way to it is left behind.
      for (const p of built) for (const node of p.temp ?? []) node.remove();
      layers.morph.replaceChildren();
      layers.ghost.replaceChildren();
      for (const node of container.querySelectorAll('.mframe, .mdrawer')) node.remove();
      delete container.dataset['flight'];
      return;
    }
    for (const p of built) motions.play(p);
  }

  function plan(
    prev: Scene,
    next: Scene,
    snap: Snapshot,
    sentBack: { at: number; to: number } | undefined,
    plays: Plan[],
  ): void {
    if (prev.position !== next.position) {
      const flight = drawerFlight(snap);
      if (flight) plays.push(flight);
    }
    const samePresent = prev.present !== undefined && prev.present === next.present;
    const lanternDir = !prev.focus && !next.focus ? lanternMorph(prev, next) : undefined;
    let present: Plan | undefined;
    let focusMoved = false;
    if (samePresent && prev.focus !== next.focus) {
      present = focusMorph(prev, next, snap);
      focusMoved = present !== undefined;
    } else if (lanternDir !== undefined) {
      // Only a morph sent back the way it came sets off from where it was.
      const from = sentBack && sentBack.to !== (lanternDir === 1 ? 1 : 0) ? sentBack.at : undefined;
      present = lanternPlay(lanternDir, prev, next, snap, from);
    } else if (
      prev.today === 'idle' &&
      next.today === 'lit' &&
      next.lit &&
      !prev.focus &&
      prev.place === next.place
    ) {
      present = startPlay(snap);
    } else if (
      samePresent &&
      prev.kind === next.kind &&
      prev.step !== next.step &&
      prev.focus === next.focus &&
      prev.place === next.place &&
      (next.focus || (prev.lit && next.lit))
    ) {
      present = next.focus ? stepDoneFocus(snap) : stepDoneToday(snap);
    } else if (
      samePresent &&
      prev.kind !== next.kind &&
      prev.focus === next.focus &&
      prev.place === next.place
    ) {
      present = pauseCrossfade(prev, next, snap);
    }
    if (present) plays.push(present);
    // Focus with nothing to grow from or into (its own page's "⌃ Focus", Done
    // on the last step) fades in whole or out, as under Reduce Motion.
    if (prev.focus !== next.focus && !focusMoved) {
      const fade = fadeWhole('focus', [layers.focus, layers.focusFoot], next.focus);
      if (!next.focus) fade.onEnd = () => host.gone('focus');
      plays.push(fade);
    }
    if (prev.sheet !== next.sheet) {
      const sheet = next.sheet ? captureOpen(next, snap) : captureClose(prev, snap);
      const csheet = q(
        next.sheet
          ? '.sheet-layer[data-capture]:not([data-leaving]) .csheet'
          : '.sheet-layer[data-capture][data-leaving]',
      );
      // Gone, the leaving sheet goes with its way out, however that ends.
      const going = next.sheet === undefined ? { onEnd: () => host.gone('sheet') } : {};
      if (sheet) plays.push({ ...sheet, ...going });
      else if (csheet)
        plays.push({ ...fadeWhole('sheet', [csheet], next.sheet !== undefined), ...going });
    }
    if (prev.position === 'folded' && next.position === 'folded' && !next.focus) {
      const line = handleCrossfade(snap);
      if (line) plays.push(line);
    }
    if (prev.focus && next.focus) {
      const foot = footCrossfade(snap);
      if (foot) plays.push(foot);
    }
    if (slides(prev, next) && snap.ghost) {
      plays.push(slide(prev, next, snap, lanternDir !== undefined));
    }
  }

  // ---------------------------------------------------------------- helpers

  /** A picture of a part, placed where it stood, in the morph layer. */
  function placed(p: Part, root: HTMLElement = layers.morph): HTMLElement {
    const pic = placeAt(p.pic.cloneNode(true) as HTMLElement, p.box);
    root.append(pic);
    return pic;
  }

  /** Taken now from the page as it has become. */
  function fresh<K extends string>(map: Record<K, string>, root?: ParentNode): Parts<K> {
    return parts(map, root);
  }

  const hidden = (el: HTMLElement | null | undefined) =>
    el ? [{ el, style: { opacity: '0' } as Record<string, string> }] : [];

  /** Stops played the other way, when the motion runs from its end to its start. */
  const way = (stops: readonly Stop[], dir: 1 | -1, duration: number): Stop[] =>
    dir === 1 ? [...stops] : backwards(stops, duration);

  const swap = (move: readonly [Xf, Xf], dir: 1 | -1): readonly [Xf, Xf] =>
    dir === 1 ? move : [move[1], move[0]];

  /** One line scaled onto another: `from`'s first line over `to`'s. */
  const lineMap = (from: Part, to: Part): Xf =>
    mapTo(from.box, to.box, { s: to.font / from.font, line: from.line, lineOver: to.line });

  /** Whether a part runs over more than one line. */
  const wraps = (p: Part) => p.box.h > p.line * 1.5;

  /**
   * A picture of `from`'s first line alone, where `from` stood, cut where
   * `to` cuts it: on one line, ending in an ellipsis where `to` does, so
   * that scaled onto `to` it reads as `to` reads. A step that wraps at one
   * end and not at the other travels as this, never as two lines lying
   * across whatever is under it at the other end.
   */
  function firstLine(from: Part, to: Part): HTMLElement {
    const node = placed(from);
    const style = node.style;
    // `text-wrap`, read from the page, would wrap it again after `white-space`.
    style.removeProperty('text-wrap');
    style.setProperty('white-space', 'nowrap');
    style.setProperty('overflow', 'hidden');
    style.setProperty('text-overflow', 'ellipsis');
    style.setProperty('height', `${from.line}px`);
    const cut = to.el.scrollWidth > to.el.clientWidth + 1;
    style.setProperty('width', cut ? `${(to.box.w * from.font) / to.font}px` : 'max-content');
    return node;
  }

  /**
   * The transform that keeps `box` where it stands relative to `lead` while
   * `lead` moves by `xf` from its own top left.
   */
  const follow = (lead: Box, xf: Xf, box: Box): Xf => ({
    x: xf.x + (xf.sx - 1) * (box.x - lead.x),
    y: xf.y + (xf.sy - 1) * (box.y - lead.y),
    sx: xf.sx,
    sy: xf.sy,
  });

  const fullBox = (): Box => ({ x: 0, y: 0, w: width(), h: height() });

  // ---------------------------------------------------------------- 1. the drawer on its spring

  /**
   * A tap that moves the drawer: it travels from where it was drawn to where
   * it now rests, on the drawer spring. Going down, it carries a picture of
   * what it held, which fades into what it holds now at the end; going up,
   * the old words fade out in the first 50 ms over what it opened to.
   */
  function drawerFlight(snap: Snapshot): Plan | undefined {
    const to = boxOf(layers.drawer, container).y;
    const from = snap.drawerY;
    if (!Number.isFinite(from) || !Number.isFinite(to) || Math.abs(from - to) < 0.5)
      return undefined;
    const tracks: Track[] = [
      {
        el: layers.drawer,
        move: [
          { x: 0, y: from, sx: 1, sy: 1 },
          { x: 0, y: to, sx: 1, sy: 1 },
        ],
      },
    ];
    const temp: Element[] = [];
    if (snap.drawer) {
      const old = snap.drawer.pic;
      layers.drawer.append(old);
      restoreScrolls(old, snap.drawer.scrolls, true);
      temp.push(old);
      const down = to > from;
      tracks.push({
        el: old,
        fade: down
          ? [
              [SPRING.duration - FIRST, 1],
              [SPRING.duration, 0],
            ]
          : [
              [0, 1],
              [FIRST / 2, 0],
            ],
      });
    }
    // Over the open drawer the screen's header row is not drawn at rest; on
    // the way it is, cut by the drawer's edge, as under a finger.
    container.dataset['flight'] = '';
    return {
      channel: 'drawer',
      tracks,
      temp,
      duration: SPRING.duration,
      easing: SPRING.easing,
      progress: SPRING.at,
      onEnd: () => delete container.dataset['flight'],
    };
  }

  // ---------------------------------------------------------------- 2. the lantern and the capsule

  interface LanternPlan extends Plan {
    lantern: true;
  }

  /** A fade given by progress, played on a curve: when each stop is reached, going either way. */
  function progressFade(stops: readonly Stop[], dir: 1 | -1, curve: Curve): Stop[] {
    const when = (p: number) => {
      // The first moment the curve is past `p` of the way.
      let lo = 0;
      let hi = curve.duration;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (curve.at(mid) >= p) hi = mid;
        else lo = mid;
      }
      return Math.round(hi);
    };
    return stops
      .map(([p, v]) => [when(dir === 1 ? p : 1 - p), v] as const)
      .sort((a, b) => a[0] - b[0]);
  }

  interface Layer {
    tracks: Track[];
    temp: Element[];
    hold: { el: HTMLElement; style: Record<string, string> }[];
  }

  /**
   * The lantern and the capsule as one layer (SPEC 10): the step, the bar and
   * the minutes travel and scale from the lantern's places to the capsule's,
   * the frame closes from around the lantern (`card`) or from the canvas
   * (`canvas`) to the slot with its corners rounding from 0 to 32, the rest
   * fades in the first 100 ms, and the capsule itself takes over where the
   * layer lands on it (CUT_MS, LAND_MS). Pictures all; the real lantern,
   * capsule and dock buttons are kept out of sight until it ends. In forward
   * terms: 0 is the lantern and 1 the capsule.
   */
  function lanternLayer(o: {
    L: Parts<keyof typeof LANTERN>;
    C: Parts<keyof typeof CAPSULE>;
    pills: Part[];
    frame: 'card' | 'canvas';
    dir: 1 | -1;
    real: (HTMLElement | null | undefined)[];
    startAt?: number;
    /** The canvas, for `canvas`: from under the header row to the drawer's top. */
    top: number;
    bottom: number;
  }): Layer | undefined {
    const { L, C, dir } = o;
    const D = LANTERN_MS;
    if (!L.step || !C.whole) return undefined;
    // Built in forward terms (0 the lantern, 1 the capsule): a move from
    // its start to its end, fades in ms as played forward, and the same
    // fades as progress for a finger.
    const forward: (Track & {
      byProgress?: boolean;
      both?: { forward: Stop[]; back: Stop[] };
    })[] = [];
    const temp: Element[] = [];
    const out: Stop[] = [
      [0, 1],
      [FIRST, 0],
    ];
    const outScrub: Stop[] = [
      [0, 1],
      [0.25, 0],
    ];
    const pic = (p: Part) => {
      const node = placed(p);
      temp.push(node);
      return node;
    };

    // The frame: around the lantern, or the whole canvas between the header
    // row and the drawer, to the slot.
    const W = width();
    const around = L.whole ?? L.step;
    const start: FrameAt = {
      box:
        o.frame === 'canvas'
          ? { x: 0, y: o.top, w: W, h: Math.max(0, o.bottom - o.top) }
          : { x: 0, y: around.box.y - 24, w: W, h: around.box.h + 48 },
      r: 0,
    };
    const frame = frameNode(CHARCOAL);
    layers.morph.append(frame);
    temp.push(frame);
    forward.push(...frameTracks(frame, start, { box: C.whole.box, r: C.whole.box.h / 2 }));
    // A card is there only once the drawer is under the lantern's place: it
    // comes up between a tenth and a fifth of the way, whichever way it goes,
    // so over the lamp alone the lantern is never boxed. The canvas is
    // Today's ground at once when it leaves, and gives way to Today in the
    // last 100 ms when it comes back.
    const fadeIn: Stop[] = [
      [0, 0],
      [FIRST, 1],
    ];
    const card: Stop[] = [
      [0.1, 0],
      [0.2, 1],
    ];
    forward.push({
      el: frame,
      ...(o.frame === 'card' ? { byProgress: true } : { fade: dir === 1 ? [[0, 1]] : fadeIn }),
      scrub: o.frame === 'card' ? card : [[0, 1]],
    });

    // What fades as it leaves: the title, the note, Set aside, and the rest
    // of the Now line ("step 2 of 3", "Focus ›").
    for (const key of ['ttl', 'note', 'aside'] as const) {
      const p = L[key];
      if (p) forward.push({ el: pic(p), fade: out, scrub: outScrub });
    }
    if (L.nowline) {
      // Now travels on its own, so the line it leaves is pictured without it
      // (by opacity, as a picture's visibility is its own at every element).
      const line = pic(L.nowline);
      for (const now of line.querySelectorAll<HTMLElement>('.nowtag, :scope > b')) {
        now.style.setProperty('opacity', '0');
      }
      forward.push({ el: line, fade: out, scrub: outScrub });
    }

    // What travels and scales: Now, the step, the bar, the minutes.
    const travelling: [Part | undefined, Part | undefined][] = [
      [L.now, C.now],
      [L.step, C.step],
      [L.bar, C.bar],
      [L.mins, C.mins],
    ];
    for (const [from, to] of travelling) {
      if (!from || !to) continue;
      if (from === L.bar) {
        const bar = pic(from);
        forward.push({ el: bar, move: [NONE, mapTo(from.box, to.box)] });
        // Its tick fades in the first 100 ms; the end cap stays (SPEC 10).
        bar.classList.add('m-notick');
        const fill = bar.querySelector<HTMLElement>('.fill');
        if (fill && !/\bis-(paused|frozen|over|countUp)\b/.test(bar.className)) {
          const tick = document.createElement('i');
          tick.className = 'mtick';
          fill.append(tick);
          forward.push({
            el: tick,
            fade: out,
            scrub: [
              [0, 1],
              [0.15, 0],
            ],
          });
        }
        continue;
      }
      const move = lineMap(from, to);
      if (from === L.step && wraps(from)) {
        // A step that wraps on Today travels as its first line, cut where
        // the capsule cuts it, the whole of it fading on the way.
        forward.push({ el: pic(from), fade: out, scrub: outScrub });
        const first = firstLine(from, to);
        temp.push(first);
        forward.push({
          el: first,
          move: [NONE, move],
          fade: fadeIn,
          scrub: [
            [0, 0],
            [0.25, 1],
          ],
        });
        continue;
      }
      forward.push({ el: pic(from), move: [NONE, move] });
      if (from === L.mins && L.rest) {
        // "of 25 · ends 10:23" goes with the minutes as it fades.
        forward.push({
          el: pic(L.rest),
          move: [NONE, follow(from.box, move, L.rest.box)],
          fade: out,
          scrub: outScrub,
        });
      }
    }

    // Step done and Pause leave in the first 100 ms.
    for (const p of o.pills) {
      forward.push({
        el: pic(p),
        fade: out,
        scrub: [
          [0, 1],
          [0.08, 0],
        ],
      });
    }

    // The capsule itself, where the layer lands on it (see CUT_MS).
    forward.push({
      el: pic(C.whole),
      both: {
        forward: [
          [SPRING.duration - LAND_MS, 0],
          [SPRING.duration, 1],
        ],
        back: [
          [0, 1],
          [CUT_MS, 0],
        ],
      },
      scrub: [
        [0.97, 0],
        [1, 1],
      ],
    });

    const target = dir === 1 ? 1 : 0;
    const at = o.startAt;
    const tracks = forward.map((t): Track => {
      const played: Track = { el: t.el };
      if (t.scrub) played.scrub = t.scrub;
      if (t.move) {
        const [a, b] = t.move;
        played.move =
          at === undefined ? swap(t.move, dir) : [lerpXf(a, b, at), lerpXf(a, b, target)];
      }
      if (t.byProgress && t.scrub && at === undefined) {
        played.fade = progressFade(t.scrub, dir, SPRING);
      } else if (t.both && at === undefined) {
        played.fade = dir === 1 ? t.both.forward : t.both.back;
      } else if (t.fade || t.byProgress || t.both) {
        played.fade =
          at === undefined && t.fade
            ? way(t.fade, dir, D)
            : [
                [0, along(t.scrub ?? t.fade ?? [], at ?? target)],
                [CROSS_MS, along(t.scrub ?? t.fade ?? [], target)],
              ];
      }
      return played;
    });
    return { tracks, temp, hold: o.real.flatMap(hidden) };
  }

  function lanternPlay(
    dir: 1 | -1,
    prev: Scene,
    next: Scene,
    snap: Snapshot,
    startAt: number | undefined,
  ): Plan | undefined {
    const live = fresh(LANTERN, layers.screen);
    const capsuleEl = q('.dock .capsule');
    const L = dir === 1 ? (prev.place === next.place ? live : snap.lantern) : live;
    const C = dir === 1 ? (capsuleEl ? fresh(CAPSULE, capsuleEl) : {}) : snap.capsule;
    const pills =
      dir === 1
        ? snap.pills
        : [...layers.dock.querySelectorAll('.dock-pill')]
            .map((el) => part(el))
            .filter((p): p is Part => p !== undefined);
    const frame = prev.tab !== next.tab ? 'canvas' : 'card';
    const real = [
      q<HTMLElement>(LANTERN.whole, layers.screen),
      capsuleEl,
      ...layers.dock.querySelectorAll<HTMLElement>('.dock-pill'),
    ];
    const header = q(':scope > .hdr', layers.screen);
    const layer = lanternLayer({
      L,
      C,
      pills,
      frame,
      dir,
      real,
      ...(startAt === undefined ? {} : { startAt }),
      top: header ? boxOf(header, container).y + boxOf(header, container).h + 8 : 0,
      bottom: snap.drawerY,
    });
    if (!layer) return undefined;
    const plan: LanternPlan = {
      channel: 'present',
      lantern: true,
      ...layer,
      duration: SPRING.duration,
      easing: SPRING.easing,
      from: startAt ?? (dir === 1 ? 0 : 1),
      to: dir === 1 ? 1 : 0,
      progress: SPRING.at,
    };
    return plan;
  }

  // ---------------------------------------------------------------- under a finger

  function beginTravel(from: DrawerPosition): void {
    endTravel();
    if (destroyed || !host.enabled()) return;
    motions.end();
    const scene = last;
    if (!scene || scene.today !== 'lit' || scene.focus) return;
    // The capsule and Today's buttons as they would be, where they are not on screen now.
    const made = document.createElement('div');
    made.className = 'dock mdock';
    layers.morph.append(made);
    const capsuleEl = q('.dock .capsule');
    const pillEls = [...layers.dock.querySelectorAll<HTMLElement>('.dock-pill')];
    if (!capsuleEl) made.append(...host.dockNodes('capsule'));
    if (pillEls.length === 0) made.append(...host.dockNodes('present'));
    const C = capsuleEl
      ? fresh(CAPSULE, capsuleEl)
      : fresh(CAPSULE, made.querySelector('.capsule') ?? made);
    const pills = [
      ...(pillEls.length > 0 ? pillEls : made.querySelectorAll<HTMLElement>('.dock-pill')),
    ]
      .map((el) => part(el))
      .filter((p): p is Part => p !== undefined);
    made.remove();
    const layer = lanternLayer({
      L: fresh(LANTERN, layers.screen),
      C,
      pills,
      frame: 'card',
      dir: 1,
      real: [q<HTMLElement>(LANTERN.whole, layers.screen), capsuleEl, ...pillEls],
      top: 0,
      bottom: height(),
    });
    if (!layer) return;
    travel = scrubbed(layer);
    travel.set(from === 'open' ? 1 : 0);
  }

  function moveTravel(lift: number): void {
    travel?.set(lift);
  }

  function endTravel(): void {
    const run = travel;
    travel = undefined;
    run?.end();
  }

  // ---------------------------------------------------------------- 3. the capsule and Focus

  /**
   * Where, on the way from the capsule or the lantern to Focus, what is drawn
   * at Focus's size takes over from what is drawn at the other end's: near
   * Focus, as a share of the way. Focus's step may wrap where the other end's
   * is one line, and its second line lies across the bar anywhere else.
   */
  const NEAR_FOCUS: readonly [number, number] = [0.8, 0.95];

  /**
   * Focus is the capsule opened all the way (SPEC 10): the frame grows from
   * the capsule to the screen, the step, the bar and the minutes travel to
   * their places at full size, and the rest of Focus comes up over the last
   * 120 ms. From Today the lantern's own parts travel there, cross-fading
   * into Focus's as they come near it. "⌄ Today" is the same, played back:
   * what fades with the way travelled is placed by progress, so going back
   * it happens in the same places, not at the same times.
   */
  function focusMorph(prev: Scene, next: Scene, snap: Snapshot): Plan | undefined {
    const dir: 1 | -1 = next.focus ? 1 : -1;
    const D = FOCUS_MS;
    const F = dir === 1 ? fresh(FOCUS, layers.focus) : snap.focus;
    if (!F.step) return undefined;
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const hold: { el: HTMLElement; style: Record<string, string> }[] = [];
    // Built in forward terms, from the capsule or the lantern to Focus: a
    // move from its start to its end; a fade in ms as played forward (`fade`),
    // or as progress along the way (`by`).
    const add = (track: Track & { by?: readonly Stop[] }) => {
      const { by, ...rest } = track;
      tracks.push({
        ...rest,
        ...(rest.move ? { move: swap(rest.move, dir) } : {}),
        ...(by ? { fade: progressFade(by, dir, SPRING) } : {}),
        ...(rest.fade && !by ? { fade: way(rest.fade, dir, D) } : {}),
      });
    };
    const [near, there] = NEAR_FOCUS;
    const giveWay: Stop[] = [
      [near, 1],
      [there, 0],
    ];
    const takeOver: Stop[] = [
      [near, 0],
      [there, 1],
    ];
    const pic = (p: Part) => {
      const node = placed(p);
      temp.push(node);
      return node;
    };
    // The capsule end, or the lantern end.
    const atToday = dir === 1 ? prev.lit : next.lit;
    const capsuleEl = q('.dock .capsule');
    const C = dir === 1 ? snap.capsule : capsuleEl ? fresh(CAPSULE, capsuleEl) : {};
    const L = dir === 1 ? snap.lantern : fresh(LANTERN, layers.screen);
    const focusLayers = [layers.focus, layers.focusFoot];
    const late: Stop[] = [
      [D - FOCUS_LAST, 0],
      [D, 1],
    ];
    if (atToday && L.step) {
      // Lantern and Focus, both large: each part travels as the lantern's,
      // and Focus's takes over near Focus.
      const pairs: [Part | undefined, Part | undefined][] = [
        [L.step, F.step],
        [L.bar, F.bar],
        [L.mins, F.mins],
      ];
      for (const [a, b] of pairs) {
        if (!a || !b) continue;
        const map = a === L.bar ? mapTo(a.box, b.box) : lineMap(a, b);
        const back = a === L.bar ? mapTo(b.box, a.box) : lineMap(b, a);
        add({ el: pic(a), move: [NONE, map], by: giveWay });
        add({ el: pic(b), move: [back, NONE], by: takeOver });
      }
      for (const key of ['nowline', 'ttl', 'note', 'aside', 'rest'] as const) {
        const p = L[key];
        if (!p) continue;
        add({
          el: pic(p),
          fade: [
            [0, 1],
            [FIRST, 0],
          ],
        });
      }
      hold.push(...hidden(q<HTMLElement>(LANTERN.whole, layers.screen)));
      // Focus's ground: the canvas growing down over the drawer and the
      // tabs, under Focus, which comes up over it at the end.
      const frame = frameNode(CHARCOAL);
      container.insertBefore(frame, layers.focus);
      temp.push(frame);
      const top = dir === 1 ? snap.drawerY : boxOf(layers.drawer, container).y;
      const band: FrameAt = { box: { x: 0, y: top, w: width(), h: 0 }, r: 0 };
      for (const piece of frameTracks(frame, band, {
        box: { ...band.box, h: height() - top },
        r: 0,
      })) {
        add(piece);
      }
    } else if (C.whole) {
      // The capsule's frame growing to the whole screen, under Focus.
      const frame = frameNode(CHARCOAL);
      container.insertBefore(frame, layers.focus);
      temp.push(frame);
      const from: FrameAt = { box: C.whole.box, r: C.whole.box.h / 2 };
      for (const piece of frameTracks(frame, from, { box: fullBox(), r: 0 })) add(piece);
      // Focus's step, bar and minutes, at Focus's size, carried from the
      // capsule's places. A step that wraps in Focus travels as its first
      // line, cut where the capsule cuts it, and its whole takes over near
      // Focus.
      if (C.step) {
        const move = [lineMap(F.step, C.step), NONE] as const;
        const first = firstLine(F.step, C.step);
        temp.push(first);
        if (wraps(F.step)) {
          add({ el: first, move, by: giveWay });
          add({ el: pic(F.step), move, by: takeOver });
        } else {
          add({ el: first, move });
        }
      }
      for (const [f, c] of [
        [F.bar, C.bar],
        [F.mins, C.mins],
      ] as const) {
        if (!f || !c) continue;
        add({ el: pic(f), move: [f === F.bar ? mapTo(f.box, c.box) : lineMap(f, c), NONE] });
      }
      // The capsule itself, where the frame sets off from it (see CUT_MS);
      // going back, it comes up over the pictures where they land on it,
      // in the spring's last LAND_MS, as the lantern's way into it does.
      if (dir === 1) {
        tracks.push({
          el: pic(C.whole),
          fade: [
            [0, 1],
            [CUT_MS, 0],
          ],
        });
      } else if (capsuleEl) {
        tracks.push({
          el: capsuleEl,
          fade: [
            [SPRING.duration - LAND_MS, 0],
            [SPRING.duration, 1],
          ],
        });
      }
      // Today's buttons in the slot the capsule had, which come in with Focus's controls.
      const pills =
        dir === 1
          ? [...layers.dock.querySelectorAll<HTMLElement>('.dock-pill')]
          : snap.pills.map((p) => pic(p));
      for (const el of pills) add({ el, fade: late });
    } else {
      return undefined;
    }
    for (const el of focusLayers) add({ el, fade: late });
    // Focus's own step, bar and minutes are drawn by the pictures on the way,
    // so they are not drawn twice where Focus comes up or fades.
    // By opacity, not visibility: the step has focus as Focus opens (SPEC
    // 11), and an element out of sight by visibility cannot keep it.
    for (const p of [F.step, F.bar, F.mins]) {
      if (p) hold.push({ el: p.el, style: { opacity: '0' } });
    }
    return {
      channel: 'present',
      tracks,
      temp,
      hold,
      duration: SPRING.duration,
      easing: SPRING.easing,
      progress: SPRING.at,
      ...(dir === -1 ? { onEnd: () => host.gone('focus') } : {}),
    };
  }

  // ---------------------------------------------------------------- 5. Start

  /**
   * Start on Today (SPEC 10): the sentence grows from 32 to 40 into the step
   * (or, with steps, shrinks into the title as "Starts with" grows into the
   * step), the bar draws in from empty over 250 ms, and Now and the rest
   * fade in. The drawer folds from half on its own spring (the flight).
   */
  function startPlay(snap: Snapshot): Plan | undefined {
    const I = snap.idle;
    const L = fresh(LANTERN, layers.screen);
    if (!L.step || !I.sentence) return undefined;
    const D = Math.max(SPRING.duration, DRAW_MS);
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const used = new Set<Part>();
    const pair = (a: Part | undefined, b: Part | undefined) => {
      if (!a || !b) return;
      used.add(b);
      const pa = placed(a);
      const pb = placed(b);
      temp.push(pa, pb);
      tracks.push(
        {
          el: pa,
          move: [NONE, lineMap(a, b)],
          fade: [
            [0, 1],
            [CROSS_MS, 0],
          ],
        },
        {
          el: pb,
          move: [lineMap(b, a), NONE],
          fade: [
            [0, 0],
            [CROSS_MS, 1],
          ],
        },
      );
    };
    const startsWith = I.after?.text.replace(/^\s*Starts with:?\s*/, '').trim();
    if (I.sentence.text.trim() === L.step.text.trim()) pair(I.sentence, L.step);
    else {
      pair(I.sentence, L.ttl);
      if (I.after && startsWith === L.step.text.trim()) pair(I.after, L.step);
    }
    for (const key of ['status', 'label', 'sentence', 'after', 'meta', 'under', 'start'] as const) {
      const p = I[key];
      if (!p || (key === 'sentence' && used.size > 0) || (key === 'after' && used.has(L.step)))
        continue;
      const pic = placed(p);
      temp.push(pic);
      tracks.push({
        el: pic,
        fade: [
          [0, 1],
          [CROSS_MS, 0],
        ],
      });
    }
    for (const key of ['nowline', 'ttl', 'step', 'mins', 'rest', 'note'] as const) {
      const p = L[key];
      if (!p || used.has(p)) continue;
      const pic = placed(p);
      temp.push(pic);
      tracks.push({
        el: pic,
        fade: [
          [0, 0],
          [CROSS_MS, 1],
        ],
      });
    }
    if (L.bar) {
      const pic = placed(L.bar);
      temp.push(pic);
      tracks.push({
        el: pic,
        fade: [
          [0, 0],
          [FIRST, 1],
        ],
      });
      const fill = pic.querySelector<HTMLElement>('.fill');
      if (fill) {
        fill.style.setProperty('transform-origin', '0 50%');
        tracks.push({
          el: fill,
          move: [{ x: 0, y: 0, sx: 0, sy: 1 }, NONE],
          easing: EASE_OUT,
          duration: DRAW_MS,
        });
      }
    }
    const pills = [...layers.dock.querySelectorAll<HTMLElement>('.dock-pill')];
    for (const el of pills)
      tracks.push({
        el,
        fade: [
          [0, 0],
          [CROSS_MS, 1],
        ],
      });
    return {
      channel: 'present',
      tracks,
      temp,
      hold: hidden(q<HTMLElement>(LANTERN.whole, layers.screen)),
      duration: D,
      easing: SPRING.easing,
    };
  }

  // ---------------------------------------------------------------- 6. Step done

  /** On Today: the finished step rises and turns to ash, and the next rises into its place. */
  function stepDoneToday(snap: Snapshot): Plan | undefined {
    const old = snap.lantern.step;
    const L = fresh(LANTERN, layers.screen);
    if (!old || !L.step) return undefined;
    const temp: Element[] = [];
    const white = placed(old);
    const ash = placed(old);
    ash.style.setProperty('color', 'var(--ash)');
    const next = placed(L.step);
    temp.push(white, ash, next);
    const up: Xf = { x: 0, y: -RISE, sx: 1, sy: 1 };
    const below: Xf = { x: 0, y: RISE, sx: 1, sy: 1 };
    return {
      channel: 'present',
      tracks: [
        {
          el: white,
          move: [NONE, up],
          fade: [
            [0, 1],
            [STEP_MS / 2, 0],
          ],
        },
        {
          el: ash,
          move: [NONE, up],
          fade: [
            [0, 0],
            [STEP_MS / 2, 1],
            [STEP_MS, 0],
          ],
        },
        {
          el: next,
          move: [below, NONE],
          fade: [
            [0, 0],
            [STEP_MS, 1],
          ],
        },
      ],
      temp,
      hold: hidden(L.step.el),
      duration: STEP_MS,
      easing: EASE_OUT,
    };
  }

  /**
   * In Focus: the finished step moves up into the done line and turns to
   * ash, and "After this" rises into the step's place at full size.
   */
  function stepDoneFocus(snap: Snapshot): Plan | undefined {
    const O = snap.focus;
    const N = fresh(FOCUS, layers.focus);
    if (!O.step || !N.step) return undefined;
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const hold: { el: HTMLElement; style: Record<string, string> }[] = [];
    const pair = (a: Part | undefined, b: Part | undefined) => {
      if (!a || !b) return false;
      const pa = placed(a);
      const pb = placed(b);
      temp.push(pa, pb);
      tracks.push(
        {
          el: pa,
          move: [NONE, lineMap(a, b)],
          fade: [
            [0, 1],
            [STEP_MS, 0],
          ],
        },
        {
          el: pb,
          move: [lineMap(b, a), NONE],
          fade: [
            [0, 0],
            [STEP_MS, 1],
          ],
        },
      );
      hold.push(...hidden(b.el));
      return true;
    };
    pair(O.step, N.doneText);
    const after = O.after?.el.querySelector('b') ? O.after : undefined;
    const rose =
      after && after.text.replace(/^\s*After this:?\s*/, '').trim() === N.step.text.trim();
    if (!(rose && pair(O.after, N.step))) {
      const pic = placed(N.step);
      temp.push(pic);
      tracks.push({
        el: pic,
        move: [{ x: 0, y: RISE, sx: 1, sy: 1 }, NONE],
        fade: [
          [0, 0],
          [STEP_MS, 1],
        ],
      });
      hold.push(...hidden(N.step.el));
    }
    if (O.done) {
      const pic = placed(O.done);
      temp.push(pic);
      tracks.push({
        el: pic,
        move: [NONE, { x: 0, y: -RISE, sx: 1, sy: 1 }],
        fade: [
          [0, 1],
          [STEP_MS / 2, 0],
        ],
      });
    }
    for (const p of [N.disc, N.after]) {
      if (!p) continue;
      tracks.push({
        el: p.el,
        fade: [
          [0, 0],
          [STEP_MS, 1],
        ],
      });
    }
    return { channel: 'present', tracks, temp, hold, duration: STEP_MS, easing: EASE_OUT };
  }

  // ---------------------------------------------------------------- 7. cross-fades in place

  /**
   * Pause and Resume (SPEC 10): what changes cross-fades in place over 150 ms,
   * the bar turning ash or back, Now and Paused, the pills in their slot.
   * Nothing moves.
   */
  function pauseCrossfade(prev: Scene, next: Scene, snap: Snapshot): Plan | undefined {
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const cross = (old: Part | undefined, now: HTMLElement | null | undefined) => {
      if (old) {
        const pic = placed(old);
        temp.push(pic);
        tracks.push({
          el: pic,
          fade: [
            [0, 1],
            [CROSS_MS, 0],
          ],
        });
      }
      if (now)
        tracks.push({
          el: now,
          fade: [
            [0, 0],
            [CROSS_MS, 1],
          ],
        });
    };
    if (prev.lit && next.lit)
      cross(snap.lantern.whole, q<HTMLElement>(LANTERN.whole, layers.screen));
    if (prev.focus && next.focus) cross(snap.focus.body, q<HTMLElement>(FOCUS.body, layers.focus));
    for (const p of snap.pills) cross(p, undefined);
    for (const el of layers.dock.querySelectorAll<HTMLElement>('.dock-pill')) cross(undefined, el);
    if (snap.capsule.whole) cross(snap.capsule.whole, q<HTMLElement>('.dock .capsule'));
    if (tracks.length === 0) return undefined;
    return { channel: 'present', tracks, temp, duration: CROSS_MS, easing: 'linear' };
  }

  /** The Next line's words, changed where they stand: a 150 ms cross-fade (SPEC 10). */
  function handleCrossfade(snap: Snapshot): Plan | undefined {
    const now = [
      ...layers.drawer.querySelectorAll<HTMLElement>(':scope > .handle.folded, :scope > .undo'),
    ];
    const before = snap.handle.map((p) => p.text).join('|');
    const after = now.map((el) => el.textContent ?? '').join('|');
    if (before === after || snap.handle.length === 0) return undefined;
    return crossfade('line', snap.handle, now);
  }

  function footCrossfade(snap: Snapshot): Plan | undefined {
    const now = [...layers.focusFoot.querySelectorAll<HTMLElement>('.ff-line, .undo')];
    const before = snap.foot.map((p) => p.text).join('|');
    const after = now.map((el) => el.textContent ?? '').join('|');
    if (before === after || snap.foot.length === 0) return undefined;
    return crossfade('foot', snap.foot, now);
  }

  function crossfade(channel: string, old: Part[], now: HTMLElement[]): Plan {
    const tracks: Track[] = [];
    const temp: Element[] = [];
    for (const p of old) {
      const pic = placed(p);
      temp.push(pic);
      tracks.push({
        el: pic,
        fade: [
          [0, 1],
          [CROSS_MS, 0],
        ],
      });
    }
    for (const el of now)
      tracks.push({
        el,
        fade: [
          [0, 0],
          [CROSS_MS, 1],
        ],
      });
    return { channel, tracks, temp, duration: CROSS_MS, easing: 'linear' };
  }

  /** The Reduce Motion fade, where nothing travels: 200 ms, in or out. */
  function fadeWhole(channel: string, els: HTMLElement[], appear: boolean): Plan {
    const ms = 200;
    return {
      channel,
      tracks: els.map((el) => ({
        el,
        fade: appear
          ? [
              [0, 0],
              [ms, 1],
            ]
          : [
              [0, 1],
              [ms, 0],
            ],
      })),
      duration: ms,
      easing: 'linear',
    };
  }

  // ---------------------------------------------------------------- 4. capture

  /**
   * The disc grows into the sheet (SPEC 10): a frame from the disc's circle
   * to the sheet's box, terracotta turning to stone, the sheet's own content
   * coming up as it arrives. From Today the lantern slides up into the top
   * third with it, the title moving up into the Now line; from Focus its
   * step and bar go up the same way; over a place the capsule rides up to
   * the sheet's edge.
   */
  function captureOpen(next: Scene, snap: Snapshot): Plan | undefined {
    const panel = q('.sheet-layer[data-capture]:not([data-leaving]) .c-panel');
    if (!panel || !snap.disc) return undefined;
    const D = CAPTURE.duration;
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const hold: { el: HTMLElement; style: Record<string, string> }[] = [];
    const to: FrameAt = { box: boxOf(panel, container), r: 24 };
    const from: FrameAt = { box: snap.disc.box, r: snap.disc.box.h / 2 };
    // Stone underneath, the disc's terracotta over it giving way.
    for (const [colour, fade] of [
      [
        TERRA,
        [
          [0, 1],
          [FIRST + 20, 0],
        ],
      ],
      [STONE, [[0, 1]]],
    ] as const) {
      const frame = frameNode(colour);
      layers.sheet.prepend(frame);
      temp.push(frame);
      tracks.push(...frameTracks(frame, from, to), { el: frame, fade });
    }
    tracks.push({
      el: panel,
      fade: [
        [FIRST + 20, 0],
        [D * 0.65, 1],
      ],
    });
    // Over a place the capsule rides up from its slot to the sheet's edge:
    // its picture travels, and the one riding the sheet, which comes up with
    // the sheet's content, is kept out of sight until the picture is on it.
    const ride = q('.sheet-layer[data-capture]:not([data-leaving]) .c-ride .capsule');
    const capsuleEl = q('.dock .capsule');
    if (ride && snap.capsule.whole && drawn(ride)) {
      const pic = placed(snap.capsule.whole, layers.sheet);
      temp.push(pic);
      tracks.push({ el: pic, move: [NONE, mapTo(snap.capsule.whole.box, boxOf(ride, container))] });
      hold.push(...hidden(capsuleEl), ...hidden(ride.closest<HTMLElement>('.c-ride')));
    }
    if (next.sheet === 'today') raise(snap.lantern, fresh(LANTERN, layers.screen), tracks, temp, 1);
    if (next.sheet === 'focus') raise(snap.focus, fresh(FOCUS, layers.focus), tracks, temp, 1);
    return {
      channel: 'sheet',
      tracks,
      temp,
      hold,
      duration: D,
      easing: CAPTURE.easing,
      progress: CAPTURE.at,
    };
  }

  /**
   * The sheet drops (SPEC 10): it slides down off the screen on capture's
   * spring, the capsule riding its edge goes back down to its slot, and what
   * was raised above it comes back down to where it rests.
   */
  function captureClose(prev: Scene, snap: Snapshot): Plan | undefined {
    const leaving = q('.sheet-layer[data-capture][data-leaving] .c-panel');
    const D = CAPTURE.duration;
    const tracks: Track[] = [];
    const temp: Element[] = [];
    const hold: { el: HTMLElement; style: Record<string, string> }[] = [];
    if (leaving && snap.panel) {
      const drop = height() - snap.panel.y + 24;
      tracks.push({ el: leaving, move: [NONE, { x: 0, y: drop, sx: 1, sy: 1 }] });
      const above = q('.sheet-layer[data-capture][data-leaving] .c-ride');
      const capsuleEl = q('.dock .capsule');
      if (above && snap.ride && capsuleEl && drawn(capsuleEl)) {
        hold.push({ el: above, style: { visibility: 'hidden' } });
        const pic = placed(snap.ride, layers.sheet);
        temp.push(pic);
        tracks.push({ el: pic, move: [NONE, mapTo(snap.ride.box, boxOf(capsuleEl, container))] });
        hold.push(...hidden(capsuleEl));
      }
    }
    if (prev.sheet === 'today')
      raise(fresh(LANTERN, layers.screen), snap.lantern, tracks, temp, -1);
    if (prev.sheet === 'focus') raise(fresh(FOCUS, layers.focus), snap.focus, tracks, temp, -1);
    if (tracks.length === 0) return undefined;
    return {
      channel: 'sheet',
      tracks,
      temp,
      hold,
      duration: D,
      easing: CAPTURE.easing,
      progress: CAPTURE.at,
    };
  }

  /**
   * What stays lit above the sheet, moved from where it rested (`rest`) to
   * where it is raised (`up`), or back: the real parts carried by their
   * transforms, a part that only one end has fading in or out where it is,
   * and the title on Today travelling into the Now line.
   */
  function raise<K extends string>(
    rest: Parts<K>,
    up: Parts<K>,
    tracks: Track[],
    temp: Element[],
    dir: 1 | -1,
  ): void {
    const D = CAPTURE.duration;
    const now = dir === 1 ? up : rest;
    const was = dir === 1 ? rest : up;
    for (const key of Object.keys({ ...rest, ...up }) as K[]) {
      if (key === ('whole' as K) || key === ('body' as K) || key === ('frow' as K)) continue;
      const a = was[key];
      const b = now[key];
      if (a && b) {
        const s = b.font / a.font;
        const back =
          Math.abs(s - 1) > 0.01
            ? mapTo(b.box, a.box, { s: a.font / b.font, line: b.line, lineOver: a.line })
            : { x: a.box.x - b.box.x, y: a.box.y - b.box.y, sx: 1, sy: 1 };
        tracks.push({ el: b.el, move: [back, NONE] });
      } else if (a) {
        // Gone at this end: a picture fades where it stood. Today's title moves up into the Now line.
        const pic = placed(a);
        temp.push(pic);
        const title = key === ('ttl' as K) ? (now as Parts<string>)['nowtitle'] : undefined;
        tracks.push({
          el: pic,
          ...(title ? { move: [NONE, lineMap(a, title)] as const } : {}),
          fade: [
            [0, 1],
            [FIRST, 0],
          ],
        });
      } else if (b) {
        tracks.push({
          el: b.el,
          fade: [
            [D - FIRST - 50, 0],
            [D, 1],
          ],
        });
      }
    }
  }

  // ---------------------------------------------------------------- 8. pages slide

  /**
   * A page pushed on a tab slides in from the right over the one it was
   * pushed from, which slides a little the other way; back is the same,
   * played the other way (SPEC 10, plan section 14 item 8). The old page is
   * a picture, kept as it looked.
   */
  function slide(prev: Scene, next: Scene, snap: Snapshot, lanternMoving: boolean): Plan {
    const ghost = snap.ghost!;
    const W = width();
    const push = next.depth > prev.depth;
    const pic = ghost.pic;
    // Not a .screen any more: nothing that looks for the page finds it.
    pic.className = 'mghost';
    // A place on charcoal is drawn on the app's own ground; its picture needs one of its own.
    if (transparent(pic.style.getPropertyValue('background-color'))) {
      pic.style.setProperty('background-color', CHARCOAL);
    }
    // The lantern travels into the capsule on its own (lanternLayer), so the
    // page it leaves is pictured without it. By opacity: every element of a
    // picture carries its own visibility, read from the page, which would
    // show through a hidden parent.
    if (lanternMoving) {
      for (const node of pic.querySelectorAll<HTMLElement>('.lantern'))
        node.style.setProperty('opacity', '0');
    }
    layers.ghost.append(pic);
    layers.ghost.classList.toggle('over', !push);
    restoreScrolls(pic, ghost.scrolls, false);
    const away: Xf = { x: push ? -W * BEHIND : W, y: 0, sx: 1, sy: 1 };
    const enter: Xf = { x: push ? W : -W * BEHIND, y: 0, sx: 1, sy: 1 };
    const screen = layers.screen;
    // A task's page eases its colour as it lights (from Today's charcoal to a
    // place's white, say); sliding, it is its own colour at once. Read with
    // the easing off, that colour is the one it ends on.
    screen.style.setProperty('transition', 'none');
    const clear = transparent(
      screen.ownerDocument.defaultView?.getComputedStyle(screen).backgroundColor ?? '',
    );
    screen.style.removeProperty('transition');
    return {
      channel: 'page',
      tracks: [
        { el: pic, move: [NONE, away] },
        { el: screen, move: [enter, NONE] },
      ],
      temp: [pic],
      // A place on charcoal has no ground of its own: while it slides it needs one.
      hold: [
        {
          el: screen,
          style: clear
            ? { 'background-color': CHARCOAL, transition: 'none' }
            : { transition: 'none' },
        },
      ],
      duration: SPRING.duration,
      easing: SPRING.easing,
      progress: SPRING.at,
      onEnd: () => layers.ghost.classList.remove('over'),
    };
  }

  // ---------------------------------------------------------------- the rest

  return {
    begin,
    beforePaint,
    slides,
    get last() {
      return last;
    },
    quietly(change) {
      quiet++;
      try {
        change();
      } finally {
        quiet--;
      }
    },
    drawerY() {
      const run = motions.get('drawer');
      return run ? boxOf(layers.drawer, container).y : undefined;
    },
    beginTravel,
    moveTravel,
    endTravel,
    get travelling() {
      return travel !== undefined;
    },
    endAll() {
      batch = undefined;
      retarget = undefined;
      endTravel();
      motions.end();
    },
    destroy() {
      destroyed = true;
      batch = undefined;
      endTravel();
      motions.end();
    },
  };
}
