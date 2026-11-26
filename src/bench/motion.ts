// The animated path's machinery (design/lantern/PROTOTYPE-PLAN.md section 14,
// phase B; SPEC 10): the drawer's spring as a CSS easing, transforms that map
// one box onto another, frozen pictures of what is about to go, a frame that
// can change its corner radius by transforms alone, and a runner that plays a
// set of tracks and puts everything back when they end.
//
// Everything here moves by transform and opacity only, and nothing is laid
// out for a motion's sake. A motion never changes what the page is made of:
// the page is already in its new state when a motion starts, and the motion
// only draws the way there, with pictures of what went and with the new
// elements carried from where the old ones stood. When it ends, every
// animation is cancelled, every picture removed and every inline style the
// motion set taken off, so what is left is exactly the Reduce Motion path's
// page.
//
// A motion is played on the spring, or, under a finger, scrubbed: its tracks
// are set frame by frame from a progress the drawer's position gives.

import { SPRING_RESPONSE } from './drawer';

// ---------------------------------------------------------------- the spring

/** A spring has come to rest when it is this close to its target, as a share of the way. */
export const SETTLE = 0.001;

/**
 * Where a critically damped spring released at rest is, `seconds` after it
 * set off, as a share of the way: 1 − (1 + ωt)·e^(−ωt), with ω = 2π / response.
 * The same curve the drawer's own spring follows from rest (drawer.ts).
 */
export function springAt(seconds: number, response = SPRING_RESPONSE): number {
  if (seconds <= 0) return 0;
  const x = ((2 * Math.PI) / response) * seconds;
  return 1 - (1 + x) * Math.exp(-x);
}

/** How long that spring takes to come within SETTLE of its target, in ms. */
export function springDuration(response = SPRING_RESPONSE): number {
  let x = 1;
  while ((1 + x) * Math.exp(-x) > SETTLE) x += 0.001;
  return Math.ceil((x / ((2 * Math.PI) / response)) * 1000);
}

/**
 * The spring sampled into a CSS linear() easing: evenly spaced outputs over
 * the duration, ending on 1 exactly. WebKit since Safari 17.2 and Chromium
 * since 113 read it.
 */
export function linearEasing(response = SPRING_RESPONSE, points = 40): string {
  const duration = springDuration(response) / 1000;
  const values: string[] = [];
  for (let i = 0; i <= points; i++) {
    const v = i === points ? 1 : springAt((duration * i) / points, response);
    values.push(String(Math.round(v * 10000) / 10000));
  }
  return `linear(${values.join(', ')})`;
}

/**
 * Where linear() is not read: the cubic Bézier nearest the drawer spring
 * from rest over its duration, fitted by least squares on 40 points (within
 * 0.03 of it everywhere).
 */
export const SPRING_FALLBACK = 'cubic-bezier(0.32, 0.65, 0.1, 1)';

/** A spring as a CSS easing for its whole duration, and the curve in code. */
export interface Curve {
  /** linear(…) where the browser reads it, otherwise the Bézier. */
  easing: string;
  duration: number;
  /** Its progress `ms` after it set off. */
  at(ms: number): number;
}

let linearRead: boolean | undefined;

/** Whether the browser reads linear(): asked once. */
export function readsLinear(): boolean {
  if (linearRead === undefined) {
    const css = (globalThis as { CSS?: { supports?: (p: string, v: string) => boolean } }).CSS;
    try {
      linearRead = css?.supports?.('animation-timing-function', 'linear(0, 0.5, 1)') ?? false;
    } catch {
      linearRead = false;
    }
  }
  return linearRead;
}

export function springCurve(response = SPRING_RESPONSE, linear = readsLinear()): Curve {
  const duration = springDuration(response);
  return {
    easing: linear ? linearEasing(response) : SPRING_FALLBACK,
    duration,
    at: (ms) => (ms >= duration ? 1 : springAt(ms / 1000, response)),
  };
}

// ---------------------------------------------------------------- boxes and transforms

/** A box, relative to the app's own. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A transform from the top left: translate, then scale. */
export interface Xf {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

export const NONE: Xf = { x: 0, y: 0, sx: 1, sy: 1 };

const round = (value: number, places: number) => {
  const f = 10 ** places;
  const out = Math.round(value * f) / f;
  return Object.is(out, -0) ? 0 : out;
};

/** The same list of functions at every key, so a browser interpolates them one by one. */
export function xfCss(xf: Xf): string {
  return `translate(${round(xf.x, 2)}px, ${round(xf.y, 2)}px) scale(${round(xf.sx, 4)}, ${round(xf.sy, 4)})`;
}

export function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

export function lerpXf(a: Xf, b: Xf, p: number): Xf {
  return {
    x: lerp(a.x, b.x, p),
    y: lerp(a.y, b.y, p),
    sx: lerp(a.sx, b.sx, p),
    sy: lerp(a.sy, b.sy, p),
  };
}

export function lerpBox(a: Box, b: Box, p: number): Box {
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) };
}

/** A ratio that is never a division by nothing: a box not laid out keeps its size. */
const ratio = (to: number, from: number) => (from > 0 && to > 0 ? to / from : 1);

/**
 * The transform that draws an element laid out at `at` over the box `over`,
 * from its top left: stretched to it, or, with `scale`, at that one scale
 * with its first line centred where the box's is (`line` is the element's
 * own line height and `lineOver` the box's).
 */
export function mapTo(
  at: Box,
  over: Box,
  scale?: { s: number; line: number; lineOver: number },
): Xf {
  if (!scale) {
    return { x: over.x - at.x, y: over.y - at.y, sx: ratio(over.w, at.w), sy: ratio(over.h, at.h) };
  }
  const { s, line, lineOver } = scale;
  return { x: over.x - at.x, y: over.y + lineOver / 2 - at.y - (line * s) / 2, sx: s, sy: s };
}

// ---------------------------------------------------------------- pictures

/** What a picture keeps of each element's look, read from where it stood. */
const KEPT = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'box-shadow',
  'opacity',
  'visibility',
  'display',
  'font-size',
  'line-height',
  'font-weight',
  'font-stretch',
  'letter-spacing',
  'white-space',
  'text-overflow',
  'text-wrap',
  'fill',
  'stroke',
] as const;

/** Attributes a picture never carries: it is found by nothing, and reached by nothing. */
const DROPPED = [
  'id',
  'data-geo',
  'data-scroll-key',
  'data-focus-home',
  'data-row',
  'data-half-anchor',
  'data-probe',
  'tabindex',
  'aria-describedby',
  'aria-labelledby',
];

/**
 * A copy of `source` that looks as it does where it stands now, wherever it
 * is put: each element's colours, type and visibility are read from the page
 * and written onto the copy, since the copy will not sit under the same
 * ancestors, nor under the same state of the app. It is drawn only: hidden
 * from screen readers, out of the tab order, and not to be tapped.
 */
export function freeze(source: Element): HTMLElement {
  const copy = source.cloneNode(true) as HTMLElement;
  const view = source.ownerDocument.defaultView;
  const walk = (from: Element, to: Element) => {
    const style = (to as HTMLElement).style as CSSStyleDeclaration | undefined;
    if (style && view) {
      const computed = view.getComputedStyle(from);
      for (const name of KEPT) {
        const value = computed.getPropertyValue(name);
        if (value) style.setProperty(name, value);
      }
    }
    for (const name of DROPPED) to.removeAttribute(name);
    const a = from.children;
    const b = to.children;
    for (let i = 0; i < a.length && i < b.length; i++) walk(a[i]!, b[i]!);
  };
  walk(source, copy);
  copy.setAttribute('aria-hidden', 'true');
  copy.setAttribute('inert', '');
  copy.style.setProperty('pointer-events', 'none');
  return copy;
}

/** A picture placed over `box` in a layer covering the app, its transforms from its top left. */
export function placeAt(node: HTMLElement, box: Box): HTMLElement {
  const style = node.style;
  style.setProperty('position', 'absolute');
  style.setProperty('left', `${round(box.x, 2)}px`);
  style.setProperty('top', `${round(box.y, 2)}px`);
  // A hair wider than measured, so a line that fitted does not wrap.
  style.setProperty('width', `${round(box.w + 0.5, 2)}px`);
  style.setProperty('height', `${round(box.h, 2)}px`);
  style.setProperty('margin', '0');
  style.setProperty('box-sizing', 'border-box');
  style.setProperty('transform-origin', '0 0');
  style.setProperty('pointer-events', 'none');
  return node;
}

/** Where `node` is drawn, relative to the box of `root` (the app). */
export function boxOf(node: Element, root: Element): Box {
  const r = node.getBoundingClientRect();
  const o = root.getBoundingClientRect();
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
}

// ---------------------------------------------------------------- the frame

/** A frame's box and its corner radius. */
export interface FrameAt {
  box: Box;
  r: number;
}

/**
 * A filled frame whose box and corner radius change by transforms alone: two
 * bands crossing, and a disc in each corner. A disc at nothing is a square
 * corner; at the radius it is a rounded one. Opaque pieces of one colour
 * overlap without a seam, and the frame's own opacity is the group's.
 */
export function frameNode(colour: string, kind = ''): HTMLElement {
  const piece = (cls: string) => h('i', { class: `mf ${cls}` });
  const node = document.createElement('div');
  node.className = `mframe ${kind}`.trim();
  // Drawn only, like a picture: wherever it is put, a tap goes through it to
  // what it is drawn over.
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('inert', '');
  node.style.setProperty('pointer-events', 'none');
  node.style.setProperty('--mf', colour);
  node.append(
    piece('band'),
    piece('band'),
    piece('disc'),
    piece('disc'),
    piece('disc'),
    piece('disc'),
  );
  return node;
}

function h(tag: string, attrs: Record<string, string>): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** The bands are 100 × 100 and the discs 64 across, before their transforms. */
const BAND = 100;
const DISC = 64;

/** Each piece's transform for a frame at `at`, in the order frameNode made them. */
export function framePieces(at: FrameAt): Xf[] {
  const { x, y, w, h: height } = at.box;
  const r = Math.max(0, Math.min(at.r, w / 2, height / 2));
  const d = r / (DISC / 2);
  return [
    { x, y: y + r, sx: w / BAND, sy: Math.max(0, height - 2 * r) / BAND },
    { x: x + r, y, sx: Math.max(0, w - 2 * r) / BAND, sy: height / BAND },
    { x, y, sx: d, sy: d },
    { x: x + w - 2 * r, y, sx: d, sy: d },
    { x, y: y + height - 2 * r, sx: d, sy: d },
    { x: x + w - 2 * r, y: y + height - 2 * r, sx: d, sy: d },
  ];
}

/** The frame's tracks: each piece from `from` to `to`. */
export function frameTracks(frame: HTMLElement, from: FrameAt, to: FrameAt): Track[] {
  const a = framePieces(from);
  const b = framePieces(to);
  return [...frame.children].map((el, i) => ({
    el: el as HTMLElement,
    move: [a[i] ?? NONE, b[i] ?? NONE] as const,
  }));
}

// ---------------------------------------------------------------- tracks

/** (moment, value): a moment in ms when played, or a progress from 0 to 1 when scrubbed. */
export type Stop = readonly [number, number];

export interface Track {
  el: HTMLElement;
  /** Its transform at the start and at the end, on the motion's easing. */
  move?: readonly [Xf, Xf];
  /** Its opacity through a played motion: (ms from the start, value), in order. */
  fade?: readonly Stop[];
  /** Its opacity through a scrubbed one: (progress, value), in order. */
  scrub?: readonly Stop[];
  /** Its own easing for `move`, in place of the motion's. */
  easing?: string;
  /** Its own length for `move`, in place of the motion's (ms). */
  duration?: number;
}

/** A value along stops, held flat before the first and after the last. */
export function along(stops: readonly Stop[], at: number): number {
  const first = stops[0];
  if (!first) return 1;
  if (at <= first[0]) return first[1];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (at <= b[0]) return b[0] === a[0] ? b[1] : lerp(a[1], b[1], (at - a[0]) / (b[0] - a[0]));
  }
  return stops[stops.length - 1]![1];
}

/** Stops in ms played backwards over `duration`: what faded out at the start fades in at the end. */
export function backwards(stops: readonly Stop[], duration: number): Stop[] {
  return [...stops].reverse().map(([t, v]) => [duration - t, v] as const);
}

// ---------------------------------------------------------------- playing

/** What an element.animate gives back, as far as this file needs it. */
export interface Playing {
  cancel(): void;
}

export type Animate = (
  el: Element,
  frames: Keyframe[],
  options: KeyframeAnimationOptions,
) => Playing | undefined;

/** The browser's own, where it has one (Web Animations); none in jsdom unless a test gives one. */
export const animateNative: Animate = (el, frames, options) => {
  const target = el as Element & {
    animate?: (f: Keyframe[], o: KeyframeAnimationOptions) => Playing;
  };
  if (typeof target.animate !== 'function') return undefined;
  try {
    return target.animate(frames, options);
  } catch {
    // An easing the browser does not read after all: the Bézier, once more.
    if (typeof options.easing === 'string' && options.easing.startsWith('linear(')) {
      try {
        return target.animate(frames, { ...options, easing: SPRING_FALLBACK });
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
};

/** Whether this browser can play a motion at all. */
export function canAnimate(): boolean {
  return (
    typeof (globalThis as { Element?: { prototype: { animate?: unknown } } }).Element?.prototype
      .animate === 'function'
  );
}

export interface Plan {
  /** What it moves: one motion per channel at a time. */
  channel: string;
  tracks: Track[];
  /** Pictures and frames drawn for the motion only. */
  temp?: Element[];
  /** Real elements kept out of sight (or otherwise styled) for as long as it runs. */
  hold?: { el: HTMLElement; style: Record<string, string> }[];
  duration: number;
  /** The easing for `move` tracks: the spring, as a rule. */
  easing: string;
  /** The way it was going, for a motion that can be sent back: 0 to 1, or 1 to 0. */
  from?: number;
  to?: number;
  /** Where it is, as a progress, `ms` after it set off. */
  progress?: (ms: number) => number;
  onEnd?: () => void;
}

export interface Running {
  readonly plan: Plan;
  /** Where it is now, from 0 to 1 along `from` to `to`. */
  progress(): number;
  /** Ends it at once, everything put back. */
  end(): void;
  readonly ended: boolean;
}

export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
  now(): number;
}

/** Styles a motion sets on real elements, taken off again so nothing is left. */
function unset(el: HTMLElement, names: readonly string[]): void {
  for (const name of names) el.style.removeProperty(name);
  if (el.getAttribute('style') === '') el.removeAttribute('style');
}

const WILL = 'will-change';

/**
 * Plays plans and keeps one running per channel. A plan ends a moment after
 * its last frame, by a timer rather than by the browser's own events, so it
 * ends the same way in a hidden tab, in a test, and wherever a browser's
 * events would come late.
 */
export class Motions {
  private readonly running = new Map<string, Running>();

  constructor(
    private readonly animate: Animate,
    private readonly timers: Timers,
  ) {}

  get(channel: string): Running | undefined {
    const run = this.running.get(channel);
    return run && !run.ended ? run : undefined;
  }

  /** Whether anything runs on a channel other than these. */
  busy(except: readonly string[] = []): boolean {
    for (const [name, run] of this.running) if (!run.ended && !except.includes(name)) return true;
    return false;
  }

  /** Ends whatever runs on these channels, or on all of them. */
  end(...channels: string[]): void {
    const names = channels.length > 0 ? channels : [...this.running.keys()];
    for (const name of names) this.running.get(name)?.end();
  }

  play(plan: Plan): Running {
    this.running.get(plan.channel)?.end();
    const started = this.timers.now();
    const animations: Playing[] = [];
    const willOn: HTMLElement[] = [];
    for (const { el, style } of plan.hold ?? []) {
      for (const [name, value] of Object.entries(style)) el.style.setProperty(name, value);
    }
    for (const track of plan.tracks) {
      if (!track.el.style.getPropertyValue(WILL)) {
        track.el.style.setProperty(WILL, 'transform, opacity');
        willOn.push(track.el);
      }
      if (track.move) {
        const [a, b] = track.move;
        const played = this.animate(track.el, [{ transform: xfCss(a) }, { transform: xfCss(b) }], {
          duration: track.duration ?? plan.duration,
          easing: track.easing ?? plan.easing,
          fill: 'both',
        });
        if (played) animations.push(played);
      }
      if (track.fade && track.fade.length > 0) {
        const played = this.animate(track.el, keyframes(track.fade, plan.duration), {
          duration: plan.duration,
          easing: 'linear',
          fill: 'both',
        });
        if (played) animations.push(played);
      }
    }
    let ended = false;
    const timer = this.timers.set(() => run.end(), plan.duration + 50);
    const run: Running = {
      plan,
      get ended() {
        return ended;
      },
      progress: () => {
        const ms = this.timers.now() - started;
        const done = plan.progress ? plan.progress(ms) : Math.min(1, ms / plan.duration);
        return lerp(plan.from ?? 0, plan.to ?? 1, done);
      },
      end: () => {
        if (ended) return;
        ended = true;
        this.timers.clear(timer);
        for (const played of animations) {
          try {
            played.cancel();
          } catch {
            // Gone with its element.
          }
        }
        for (const node of plan.temp ?? []) node.remove();
        for (const { el, style } of plan.hold ?? []) unset(el, Object.keys(style));
        for (const el of willOn) unset(el, [WILL]);
        if (this.running.get(plan.channel) === run) this.running.delete(plan.channel);
        plan.onEnd?.();
      },
    };
    this.running.set(plan.channel, run);
    return run;
  }
}

/** Opacity stops in ms as keyframes over a motion of `duration`. */
function keyframes(stops: readonly Stop[], duration: number): Keyframe[] {
  const span = Math.max(1, duration);
  const frames: Keyframe[] = [];
  const first = stops[0];
  if (first && first[0] > 0) frames.push({ opacity: first[1], offset: 0 });
  for (const [t, v] of stops) {
    frames.push({ opacity: v, offset: Math.min(1, Math.max(0, t / span)) });
  }
  const last = stops[stops.length - 1];
  if (last && last[0] < span) frames.push({ opacity: last[1], offset: 1 });
  // Offsets must not go backwards.
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1]!.offset as number;
    if ((frames[i]!.offset as number) < prev) frames[i]!.offset = prev;
  }
  return frames;
}

// ---------------------------------------------------------------- scrubbing

export interface Scrubbed {
  /** Sets every track where it is at `progress`, from 0 to 1. */
  set(progress: number): void;
  /** Puts everything back. */
  end(): void;
  readonly progress: number;
}

/**
 * The same tracks set frame by frame from a progress, for a motion under a
 * finger: inline transforms and opacities, all taken off at the end.
 */
export function scrub(plan: Omit<Plan, 'channel' | 'duration' | 'easing'>): Scrubbed {
  for (const { el, style } of plan.hold ?? []) {
    for (const [name, value] of Object.entries(style)) el.style.setProperty(name, value);
  }
  for (const track of plan.tracks) track.el.style.setProperty(WILL, 'transform, opacity');
  let at = -1;
  let ended = false;
  return {
    get progress() {
      return at;
    },
    set(progress) {
      if (ended) return;
      const p = Math.min(1, Math.max(0, progress));
      if (p === at) return;
      at = p;
      for (const track of plan.tracks) {
        if (track.move)
          track.el.style.setProperty('transform', xfCss(lerpXf(track.move[0], track.move[1], p)));
        if (track.scrub)
          track.el.style.setProperty('opacity', String(round(along(track.scrub, p), 3)));
      }
    },
    end() {
      if (ended) return;
      ended = true;
      for (const track of plan.tracks) unset(track.el, ['transform', 'opacity', WILL]);
      for (const node of plan.temp ?? []) node.remove();
      for (const { el, style } of plan.hold ?? []) unset(el, Object.keys(style));
      plan.onEnd?.();
    },
  };
}
