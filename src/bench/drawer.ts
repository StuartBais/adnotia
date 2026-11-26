// The drawer in the hand (design/lantern/PROTOTYPE-PLAN.md section 13, "The
// drawer"; SPEC 9.8 and 10).
//
// A press on the drawer's handle band or its grabber can pull it. Until the
// finger has moved a few points it is still a press, so a tap stays a tap on
// the handle's button. Past that it is a drag: the drawer follows the finger
// one to one, a frame at a time, and pulled past the last place it can rest
// it gives a little, with growing resistance. The list inside the drawer
// scrolls as a list and never pulls the drawer.
//
// On release the drawer goes to the resting place nearest to where it was
// heading: where the finger let go, plus the finger's speed times 0.2 s. It
// gets there on a critically damped spring (damping 1, response 0.35 s, as
// SwiftUI's `.spring(response: 0.35, dampingFraction: 1)`), which never
// passes its resting place. Under Reduce Motion the drawer still follows the
// finger, because that movement is the person's own, and then it is simply
// there, with no travel (SPEC 10).
//
// A press on the drawer while it springs catches it where it is, under the
// finger. If the finger then moves, it pulls the drawer on from there. If it
// lifts without moving, it was a tap: the drawer goes on to where it was
// going, and the tap keeps its click, so it acts on whatever it was on.
//
// The rules are pure functions, tested on their own. The controller takes its
// time and its frames from whoever mounts it, so a test can run it with a
// clock of its own and no real frames.

import type { DrawerPosition } from './state';

/** A place the drawer may rest, and the y of its top there. */
export interface Stop {
  position: DrawerPosition;
  y: number;
}

/** How far ahead a release is projected: velocity times this many seconds. */
export const PROJECT_S = 0.2;

/** The drawer spring's response, in seconds (SPEC 10). */
export const SPRING_RESPONSE = 0.35;

/** How far a finger moves before a press becomes a drag (px). */
export const SLOP = 8;

/** Only the finger's last this many ms count towards its speed. */
export const VELOCITY_WINDOW = 100;

/**
 * A finger that has not moved for this long before it lifts has stopped, and
 * lets go with no speed (ms). Android's VelocityTracker and Flutter take the
 * same 40 ms.
 */
export const STILL_MS = 40;

/** The spring is at rest when it is this close (px) and this slow (px/s). */
const REST_DISTANCE = 0.5;
const REST_SPEED = 20;

/** However a spring is going, it ends by this long (s). */
const LONGEST = 1.2;

/** Where a release is heading: where it let go, plus its speed for 0.2 s. */
export function project(y: number, velocity: number, ahead = PROJECT_S): number {
  return y + velocity * ahead;
}

/** The resting place closest to `y`. On a tie, the first given. */
export function nearest(y: number, stops: readonly Stop[]): Stop {
  let best = stops[0];
  if (!best) throw new Error('No place for the drawer to rest');
  for (const stop of stops) {
    if (Math.abs(stop.y - y) < Math.abs(best.y - y)) best = stop;
  }
  return best;
}

/**
 * Past either end, the drawer gives less the further it is pulled: UIKit's
 * rubber band, (1 − 1 / (d × 0.55 / dimension + 1)) × dimension.
 */
export function rubber(y: number, top: number, bottom: number, dimension: number): number {
  const give = (d: number) => (1 - 1 / ((d * 0.55) / dimension + 1)) * dimension;
  if (y < top) return top - give(top - y);
  if (y > bottom) return bottom + give(y - bottom);
  return y;
}

/**
 * The finger's speed in px/s, positive downward, as it lifts at `now`: how
 * far it went over the last VELOCITY_WINDOW ms, measured up to the release
 * rather than to its last move, so the time it has held still counts. A
 * finger that has not moved for STILL_MS has stopped and has no speed: a
 * pause before letting go lands where it is, however fast it went before.
 */
export function velocityOf(samples: readonly { y: number; at: number }[], now: number): number {
  const last = samples[samples.length - 1];
  if (!last || now - last.at > STILL_MS) return 0;
  const first = samples.find((sample) => now - sample.at <= VELOCITY_WINDOW);
  if (!first || now - first.at < 1) return 0;
  return ((last.y - first.y) / (now - first.at)) * 1000;
}

export interface SpringAt {
  y: number;
  velocity: number;
}

export interface Spring {
  /** Where the drawer is `t` seconds after release. */
  at(t: number): SpringAt;
  /** Whether it has come to rest by `t`. */
  done(t: number): boolean;
  to: number;
}

/**
 * A critically damped spring from `from` to `to`. Critical damping alone can
 * still carry a fast flick past its target, so the release speed is held to
 * what reaches the target without passing it (at most ω × distance, toward
 * it), and a speed away from the target is dropped. The settle is then
 * monotonic: the drawer only ever moves toward where it rests, and never
 * beyond (SPEC 10, "no overshoot").
 */
export function spring(
  from: number,
  to: number,
  velocity: number,
  response = SPRING_RESPONSE,
): Spring {
  const omega = (2 * Math.PI) / response;
  const d = from - to;
  // Toward the target is the sign opposite to d.
  const toward = -Math.sign(d);
  const speed = Math.sign(velocity) === toward ? Math.abs(velocity) : 0;
  const v0 = toward * Math.min(speed, omega * Math.abs(d));
  const b = v0 + omega * d;
  const at = (t: number): SpringAt => {
    const decay = Math.exp(-omega * t);
    return {
      y: to + (d + b * t) * decay,
      velocity: (v0 - omega * b * t) * decay,
    };
  };
  return {
    to,
    at,
    done(t) {
      if (t >= LONGEST) return true;
      const now = at(t);
      return Math.abs(now.y - to) < REST_DISTANCE && Math.abs(now.velocity) < REST_SPEED;
    },
  };
}

// ---------------------------------------------------------------- the controller

/** What the drawer asks of the app that mounts it. */
export interface DragHost {
  /**
   * Where the drawer may rest now and where it rests, or undefined when it
   * cannot be pulled: at its lip, under Focus or a sheet, or not laid out.
   */
  stops(): { stops: Stop[]; current: DrawerPosition } | undefined;
  /** Whether this press is on the handle band or the grabber. */
  grabs(event: PointerEvent): boolean;
  /** A press became a drag, from where the drawer rests. */
  begin(from: DrawerPosition): void;
  /** The drawer's top is at `y` this frame. */
  move(y: number): void;
  /** The drawer has come to rest at `to`, under the finger or on the spring. */
  settle(to: DrawerPosition, from: DrawerPosition): void;
  /** Reduce Motion: on release, no travel. */
  reduced(): boolean;
  /** Milliseconds on a clock that only goes forward. */
  now(): number;
  /** How far the drawer gives past its ends is measured against this (px). */
  dimension(): number;
}

export interface DragOptions {
  /** One frame later. requestAnimationFrame unless a test gives its own. */
  frame?: (callback: () => void) => number;
  cancelFrame?: (handle: number) => void;
  win?: Window;
}

export interface DrawerDrag {
  /** Whether the drawer is under a finger, caught or pulled, or on its spring. */
  moving(): boolean;
  /** Whether it is on its spring, with no finger on it. */
  flying(): boolean;
  /** Stops a spring where it is and settles there at once, as at rest. */
  finish(): void;
  destroy(): void;
}

interface Gesture {
  pointerId: number;
  surface: HTMLElement;
  startY: number;
  /** The drawer's top when the press began. */
  base: number;
  stops: Stop[];
  from: DrawerPosition;
  dragging: boolean;
  /**
   * The spring this press caught, held where it was until the finger moves
   * (a pull from there) or lifts (a tap, and the spring goes on).
   */
  caught: Flight | undefined;
  samples: { y: number; at: number }[];
  y: number;
}

interface Flight {
  spring: Spring;
  start: number;
  stop: Stop;
  from: DrawerPosition;
  stops: Stop[];
  y: number;
}

/**
 * Pointer events on `surfaces` (the drawer, and the open drawer's Hide band,
 * which sits in a layer of its own). Each is a layer that is never rebuilt,
 * so capturing the pointer on it survives the drawer's contents changing
 * under the finger.
 */
export function dragDrawer(
  surfaces: HTMLElement[],
  host: DragHost,
  options: DragOptions = {},
): DrawerDrag {
  const win = options.win ?? window;
  const frame =
    options.frame ??
    ((callback: () => void) =>
      typeof win.requestAnimationFrame === 'function'
        ? win.requestAnimationFrame(() => callback())
        : win.setTimeout(callback, 16));
  const cancelFrame =
    options.cancelFrame ??
    ((handle: number) => {
      if (typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(handle);
      else win.clearTimeout(handle);
    });

  let gesture: Gesture | undefined;
  let flight: Flight | undefined;
  let pending: number | undefined;
  let flying: number | undefined;
  let swallow: (() => void) | undefined;

  const range = (stops: readonly Stop[]) => {
    const ys = stops.map((stop) => stop.y);
    return { top: Math.min(...ys), bottom: Math.max(...ys) };
  };

  function onDown(event: PointerEvent): void {
    if (gesture) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const surface = event.currentTarget as HTMLElement;
    // A press on the drawer as it springs catches it where it is. It is not
    // captured until it moves, so a tap's click goes where it was pressed.
    const caught = flight;
    let from: { base: number; stops: Stop[]; position: DrawerPosition };
    if (caught) {
      stopFlight();
      from = { base: caught.y, stops: caught.stops, position: caught.from };
    } else {
      if (!host.grabs(event)) return;
      const rest = host.stops();
      if (!rest || rest.stops.length < 2) return;
      const base = rest.stops.find((stop) => stop.position === rest.current)?.y ?? NaN;
      if (!Number.isFinite(base)) return;
      from = { base, stops: rest.stops, position: rest.current };
    }
    gesture = {
      pointerId: event.pointerId,
      surface,
      startY: event.clientY,
      base: from.base,
      stops: from.stops,
      from: from.position,
      dragging: false,
      caught,
      samples: [{ y: event.clientY, at: host.now() }],
      y: from.base,
    };
    win.addEventListener('pointermove', onMove);
    win.addEventListener('pointerup', onUp);
    win.addEventListener('pointercancel', onCancel);
  }

  function capture(g: Gesture): void {
    const target = g.surface as HTMLElement & {
      setPointerCapture?: (id: number) => void;
    };
    try {
      target.setPointerCapture?.(g.pointerId);
    } catch {
      // A pointer the browser no longer tracks: follow it without capture.
    }
  }

  function onMove(event: PointerEvent): void {
    const g = gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    const dy = event.clientY - g.startY;
    if (!g.dragging) {
      if (Math.abs(dy) < SLOP) return;
      g.dragging = true;
      capture(g);
      // A caught spring is a journey already under way.
      if (!g.caught) host.begin(g.from);
    }
    g.samples.push({ y: event.clientY, at: host.now() });
    if (g.samples.length > 12) g.samples.shift();
    const { top, bottom } = range(g.stops);
    g.y = rubber(g.base + dy, top, bottom, host.dimension());
    if (pending === undefined) {
      pending = frame(() => {
        pending = undefined;
        if (gesture?.dragging) host.move(gesture.y);
      });
    }
  }

  function onUp(event: PointerEvent): void {
    const g = gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    release(g, velocityOf(g.samples, host.now()));
  }

  function onCancel(event: PointerEvent): void {
    const g = gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    // The system took the touch: rest where it is heading, at no speed.
    release(g, 0);
  }

  function release(g: Gesture, velocity: number): void {
    endGesture();
    if (!g.dragging) {
      // Caught and let go without moving: a tap. The drawer goes on, from
      // where it was held, to where it was going, and nothing eats the click.
      if (g.caught) resume(g.caught);
      return;
    }
    host.move(g.y);
    swallowClick();
    const stop = nearest(project(g.y, velocity), g.stops);
    if (host.reduced() || Math.abs(g.y - stop.y) < REST_DISTANCE) {
      host.settle(stop.position, g.from);
      return;
    }
    flight = {
      spring: spring(g.y, stop.y, velocity),
      start: host.now(),
      stop,
      from: g.from,
      stops: g.stops,
      y: g.y,
    };
    fly();
  }

  function resume(caught: Flight): void {
    flight = { ...caught, spring: spring(caught.y, caught.stop.y, 0), start: host.now() };
    fly();
  }

  function fly(): void {
    flying = frame(() => {
      flying = undefined;
      const f = flight;
      if (!f) return;
      const t = (host.now() - f.start) / 1000;
      if (f.spring.done(t)) {
        flight = undefined;
        host.move(f.stop.y);
        host.settle(f.stop.position, f.from);
        return;
      }
      f.y = f.spring.at(t).y;
      host.move(f.y);
      fly();
    });
  }

  function stopFlight(): void {
    if (flying !== undefined) cancelFrame(flying);
    flying = undefined;
    flight = undefined;
  }

  function endGesture(): void {
    if (pending !== undefined) cancelFrame(pending);
    pending = undefined;
    gesture = undefined;
    win.removeEventListener('pointermove', onMove);
    win.removeEventListener('pointerup', onUp);
    win.removeEventListener('pointercancel', onCancel);
  }

  /**
   * The click a browser may send after the finger lifts is not a tap on
   * whatever ended up under it: the handle that was pulled, most likely. It
   * comes at once, if at all (a touch that moved sends none), so a press
   * that starts afterwards is a tap of its own and keeps its click.
   */
  function swallowClick(): void {
    swallow?.();
    const eat = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
      done();
    };
    const timer = win.setTimeout(() => done(), 400);
    const done = () => {
      win.clearTimeout(timer);
      win.removeEventListener('click', eat, true);
      win.removeEventListener('pointerdown', done, true);
      swallow = undefined;
    };
    win.addEventListener('click', eat, true);
    win.addEventListener('pointerdown', done, true);
    swallow = done;
  }

  for (const surface of surfaces) surface.addEventListener('pointerdown', onDown);

  return {
    moving: () =>
      gesture?.dragging === true || gesture?.caught !== undefined || flight !== undefined,
    flying: () => flight !== undefined,
    finish() {
      const f = flight;
      if (!f) return;
      stopFlight();
      host.move(f.stop.y);
      host.settle(f.stop.position, f.from);
    },
    destroy() {
      endGesture();
      stopFlight();
      swallow?.();
      for (const surface of surfaces) surface.removeEventListener('pointerdown', onDown);
    },
  };
}
