// The drawer in the hand (src/bench/drawer.ts; PROTOTYPE-PLAN.md section 13,
// SPEC 9.8 and 10): where a release is heading, the place it rests, the spring
// that takes it there without passing it, and the controller driven by
// synthetic pointer events on a clock and frames of the test's own.

import { afterEach, describe, expect, it } from 'vitest';
import {
  PROJECT_S,
  SLOP,
  SPRING_RESPONSE,
  STILL_MS,
  dragDrawer,
  nearest,
  project,
  rubber,
  spring,
  velocityOf,
  type DragHost,
  type Stop,
} from '../../src/bench/drawer';
import type { DrawerPosition } from '../../src/bench/state';

// The board's resting places at 390 × 844 (SPEC 9.8).
const OPEN: Stop = { position: 'open', y: 60 };
const HALF: Stop = { position: 'half', y: 366 };
const FOLDED: Stop = { position: 'folded', y: 684 };
const IDLE = [HALF, FOLDED, OPEN];
const RUNNING = [FOLDED, OPEN];

describe('where a release is heading', () => {
  it('is where the finger let go plus its speed for 0.2 s', () => {
    expect(PROJECT_S).toBe(0.2);
    expect(project(400, 1000)).toBe(600);
    expect(project(400, -500)).toBe(300);
    expect(project(400, 0)).toBe(400);
  });

  it('rests at the nearest allowed place, so running never rests half', () => {
    expect(nearest(200, IDLE).position).toBe('open');
    expect(nearest(300, IDLE).position).toBe('half');
    expect(nearest(530, IDLE).position).toBe('folded');
    expect(nearest(420, RUNNING).position).toBe('folded');
    expect(nearest(300, RUNNING).position).toBe('open');
    // Far past either end, the end.
    expect(nearest(-400, IDLE).position).toBe('open');
    expect(nearest(2000, IDLE).position).toBe('folded');
  });

  it('a flick carries a short drag to the place it was flung toward', () => {
    // 40 pt up from folded, still nearest folded, but flung at 2400 pt/s.
    const y = 644;
    expect(nearest(y, RUNNING).position).toBe('folded');
    expect(nearest(project(y, -2400), RUNNING).position).toBe('open');
  });

  it('measures the finger over its last 100 ms only', () => {
    const samples = [
      { y: 700, at: 0 },
      { y: 690, at: 200 },
      { y: 650, at: 260 },
      { y: 600, at: 300 },
    ];
    // From 690 at 200 to 600 at 300: 90 pt in 0.1 s.
    expect(velocityOf(samples, 300)).toBeCloseTo(-900);
    // A finger held still for longer than that has no speed.
    expect(velocityOf(samples, 500)).toBe(0);
    expect(velocityOf([], 0)).toBe(0);
  });

  it('measures up to the release, so a pause before letting go slows it, and 40 ms still stops it', () => {
    expect(STILL_MS).toBe(40);
    // Pressed at 389 and pulled up 40 pt, the last 11 of them in 16 ms.
    const samples = [
      { y: 389, at: 0 },
      { y: 380, at: 18 },
      { y: 370, at: 51 },
      { y: 360, at: 85 },
      { y: 349, at: 101 },
    ];
    // Lifted at once: 31 pt over the 88 ms from 380 at 18 to the release.
    const atOnce = velocityOf(samples, 106);
    expect(atOnce).toBeCloseTo((-31 / 88) * 1000);
    // Held a moment: slower, measured to the lift, not from 360 to 349 alone.
    const held = velocityOf(samples, 131);
    expect(held).toBeLessThan(0);
    expect(Math.abs(held)).toBeLessThan(Math.abs(atOnce));
    // Held still past 40 ms: no speed at all, however fast it went before.
    expect(velocityOf(samples, 142)).toBe(0);
    expect(velocityOf(samples, 175)).toBe(0);
    expect(velocityOf(samples, 183)).toBe(0);
    // The speed only falls as the pause grows.
    const speeds = [106, 111, 116, 121, 126, 131, 136, 141, 146].map((now) =>
      Math.abs(velocityOf(samples, now)),
    );
    expect(speeds.every((speed, i) => i === 0 || speed <= (speeds[i - 1] ?? speed))).toBe(true);
  });

  it('gives less the further it is pulled past either end', () => {
    expect(rubber(400, 60, 684, 844)).toBe(400);
    const a = 60 - rubber(40, 60, 684, 844);
    const b = 60 - rubber(-40, 60, 684, 844);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(20);
    expect(b).toBeLessThan(100);
    expect(b - a).toBeLessThan(80 - a);
    expect(rubber(784, 60, 684, 844)).toBeLessThan(784);
    expect(rubber(784, 60, 684, 844)).toBeGreaterThan(684);
  });
});

describe('the spring', () => {
  const sample = (from: number, to: number, velocity: number) => {
    const s = spring(from, to, velocity);
    const ys: number[] = [];
    let t = 0;
    while (!s.done(t)) {
      ys.push(s.at(t).y);
      t += 1 / 120;
    }
    ys.push(s.at(t).y);
    return { ys, t };
  };

  const monotonic = (ys: number[], down: boolean) =>
    ys.every((y, i) => i === 0 || (down ? y >= (ys[i - 1] ?? y) : y <= (ys[i - 1] ?? y)));

  it('is critically damped with a response of 0.35 s, and settles in about that', () => {
    expect(SPRING_RESPONSE).toBe(0.35);
    const { ys, t } = sample(684, 60, 0);
    expect(ys[0]).toBe(684);
    expect(Math.abs((ys[ys.length - 1] ?? 0) - 60)).toBeLessThan(0.5);
    expect(t).toBeGreaterThan(0.3);
    expect(t).toBeLessThan(0.6);
  });

  it('only ever moves toward where it rests, and never passes it, whatever the flick', () => {
    for (const velocity of [0, -500, -3000, -20000]) {
      const { ys } = sample(500, 60, velocity);
      expect(monotonic(ys, false)).toBe(true);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(60);
    }
    for (const velocity of [0, 500, 3000, 20000]) {
      const { ys } = sample(200, 684, velocity);
      expect(monotonic(ys, true)).toBe(true);
      expect(Math.max(...ys)).toBeLessThanOrEqual(684);
    }
  });

  it('a speed away from where it rests is dropped, not carried on and brought back', () => {
    // Let go heading down, but nearer open: it turns for open at once.
    const { ys } = sample(150, 60, 1500);
    expect(monotonic(ys, false)).toBe(true);
    expect(Math.max(...ys)).toBe(150);
  });

  it('keeps the finger’s speed where that does not carry it past', () => {
    // Slower than ω × distance: the release speed is the spring's first speed.
    const s = spring(684, 60, -300);
    expect(s.at(0).velocity).toBeCloseTo(-300);
    // A flick faster than that is held to it.
    const omega = (2 * Math.PI) / SPRING_RESPONSE;
    expect(spring(684, 60, -50_000).at(0).velocity).toBeCloseTo(-omega * 624);
  });
});

// ---------------------------------------------------------------- the controller

interface Rig {
  drawer: HTMLElement;
  handle: HTMLElement;
  list: HTMLElement;
  log: string[];
  moves: number[];
  clock: { now: number };
  frames: Map<number, () => void>;
  flush(): void;
  /** Runs frames for `ms`, a frame every 16 ms, moving the clock with them. */
  run(ms: number): void;
  reduced: { value: boolean };
  current: { value: DrawerPosition };
  drag: ReturnType<typeof dragDrawer>;
}

let rigs: Rig[] = [];

function rig(stops: Stop[] = RUNNING, current: DrawerPosition = 'folded'): Rig {
  const drawer = document.createElement('div');
  const handle = document.createElement('button');
  handle.className = 'handle';
  const list = document.createElement('div');
  list.className = 'list';
  drawer.append(handle, list);
  document.body.append(drawer);
  const log: string[] = [];
  const moves: number[] = [];
  const clock = { now: 1000 };
  const frames = new Map<number, () => void>();
  let next = 0;
  const reduced = { value: false };
  const at = { value: current };
  const host: DragHost = {
    stops: () => ({ stops, current: at.value }),
    grabs: (event) => (event.target as Element).closest('.handle') !== null,
    begin: (from) => log.push(`begin ${from}`),
    move: (y) => moves.push(y),
    settle: (to, from) => {
      log.push(`settle ${to} from ${from}`);
      at.value = to;
    },
    reduced: () => reduced.value,
    now: () => clock.now,
    dimension: () => 844,
  };
  const drag = dragDrawer([drawer], host, {
    frame: (callback) => {
      frames.set(++next, callback);
      return next;
    },
    cancelFrame: (handle) => frames.delete(handle),
  });
  const flush = () => {
    const due = [...frames.values()];
    frames.clear();
    for (const callback of due) callback();
  };
  const made: Rig = {
    drawer,
    handle,
    list,
    log,
    moves,
    clock,
    frames,
    flush,
    run(ms) {
      for (let spent = 0; spent < ms; spent += 16) {
        clock.now += 16;
        flush();
      }
    },
    reduced,
    current: at,
    drag,
  };
  rigs.push(made);
  return made;
}

afterEach(() => {
  for (const made of rigs) {
    made.drag.destroy();
    made.drawer.remove();
  }
  rigs = [];
});

const pointer = (type: string, clientY: number, pointerId = 1) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientY, pointerId });

/** A finger: down on `from`, then moves to each y, a step every `every` ms, then up. */
function finger(r: Rig, from: Element, ys: number[], every = 16, up = true): void {
  const [first, ...rest] = ys;
  from.dispatchEvent(pointer('pointerdown', first ?? 0));
  for (const y of rest) {
    r.clock.now += every;
    from.dispatchEvent(pointer('pointermove', y));
    r.flush();
  }
  if (up) from.dispatchEvent(pointer('pointerup', ys[ys.length - 1] ?? 0));
}

describe('the drawer under a finger', () => {
  it('a press that does not move is a tap: the drawer is not pulled', () => {
    const r = rig();
    finger(r, r.handle, [720, 720 + SLOP - 1, 721]);
    expect(r.log).toEqual([]);
    expect(r.moves).toEqual([]);
    expect(r.drag.moving()).toBe(false);
  });

  it('follows the finger one to one, a frame at a time, from where it rests', () => {
    const r = rig();
    finger(r, r.handle, [720, 700, 600, 500], 40, false);
    expect(r.log).toEqual(['begin folded']);
    // The handle was pressed 36 below the drawer's top; the top moves with it.
    expect(r.moves).toEqual([664, 564, 464]);
    expect(r.drag.moving()).toBe(true);
  });

  it('coalesces moves within a frame into the latest', () => {
    const r = rig();
    r.handle.dispatchEvent(pointer('pointerdown', 720));
    for (const y of [700, 690, 680]) r.handle.dispatchEvent(pointer('pointermove', y));
    expect(r.frames.size).toBe(1);
    r.flush();
    expect(r.moves).toEqual([644]);
  });

  it('a slow drag rests at the place nearest where it was let go', () => {
    const r = rig();
    // Up 300, slowly, and held: nearer folded (684) than open (60) at 384.
    finger(r, r.handle, [720, 620, 520, 420], 200);
    expect(r.drag.moving()).toBe(true);
    r.run(1000);
    expect(r.log).toEqual(['begin folded', 'settle folded from folded']);
    expect(r.moves[r.moves.length - 1]).toBe(684);
  });

  it('a short flick upward opens it, carried by its speed', () => {
    const r = rig();
    // 60 pt up in 24 ms: 2500 pt/s, projected 500 pt further.
    finger(r, r.handle, [720, 708, 690, 660], 8);
    r.run(1000);
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
    expect(r.moves[r.moves.length - 1]).toBe(60);
  });

  it('a quick pull held still before letting go rests where it was let go, not where it was heading', () => {
    // From half, pressed 23 below its top, up 40 pt with the last 11 in
    // 16 ms; the drawer's top is at 326, nearer half than open either way.
    const lift = (hold: number) => {
      const r = rig(IDLE, 'half');
      r.handle.dispatchEvent(pointer('pointerdown', 389));
      for (const [y, at] of [
        [380, 18],
        [370, 51],
        [360, 85],
        [349, 101],
      ] as const) {
        r.clock.now = 1000 + at;
        r.handle.dispatchEvent(pointer('pointermove', y));
        r.flush();
      }
      r.clock.now = 1101 + hold;
      r.handle.dispatchEvent(pointer('pointerup', 349));
      r.run(1000);
      return r;
    };
    for (const hold of [5, 30, 70, 90, 130]) {
      const r = lift(hold);
      expect(r.log).toEqual(['begin half', 'settle half from half']);
      expect(r.moves[r.moves.length - 1]).toBe(366);
    }
  });

  it('settles on the spring: every frame nearer, none past, ending exactly there', () => {
    const r = rig();
    finger(r, r.handle, [720, 600, 480, 360], 16);
    const before = r.moves.length;
    r.run(1000);
    const flight = r.moves.slice(before);
    expect(flight.length).toBeGreaterThan(10);
    expect(flight.every((y, i) => i === 0 || y <= (flight[i - 1] ?? y))).toBe(true);
    expect(Math.min(...flight)).toBe(60);
    expect(flight[flight.length - 1]).toBe(60);
    expect(r.drag.moving()).toBe(false);
  });

  it('under Reduce Motion it follows the finger, then is simply there: no travel', () => {
    const r = rig();
    r.reduced.value = true;
    finger(r, r.handle, [720, 600, 480, 360], 16);
    // The last move is where the finger let go; settled at once, no frames after.
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
    expect(r.moves).toEqual([564, 444, 324, 324]);
    expect(r.frames.size).toBe(0);
    expect(r.drag.moving()).toBe(false);
  });

  it('rests at each allowed place when idle on Today, and never at one not allowed', () => {
    const cases: [number[], DrawerPosition][] = [
      [[400, 380, 360, 340], 'half'],
      [[400, 460, 520, 600], 'folded'],
      [[400, 300, 200, 100], 'open'],
    ];
    for (const [ys, want] of cases) {
      const r = rig(IDLE, 'half');
      r.reduced.value = true;
      finger(r, r.handle, ys, 200);
      expect(r.log).toEqual(['begin half', `settle ${want} from half`]);
    }
    // While something runs, a drag let go where idle would rest half (366)
    // rests open, which is nearer (306) than folded (318).
    const r = rig(RUNNING, 'folded');
    r.reduced.value = true;
    finger(r, r.handle, [720, 600, 500, 402], 200);
    expect(r.log[1]).toBe('settle open from folded');
  });

  it('pulled past an end, it gives less and less', () => {
    const r = rig(RUNNING, 'open');
    finger(r, r.handle, [80, 60, 20, -60], 16, false);
    const [a, b, c] = r.moves;
    expect(a).toBeLessThan(60);
    expect((a ?? 0) - (b ?? 0)).toBeLessThan(40);
    expect((b ?? 0) - (c ?? 0)).toBeLessThan(80);
  });

  it('a press on the list is the list’s: it scrolls, and never pulls the drawer', () => {
    const r = rig();
    finger(r, r.list, [720, 600, 480]);
    expect(r.log).toEqual([]);
    expect(r.moves).toEqual([]);
  });

  it('a press while it springs catches it where it is', () => {
    const r = rig();
    finger(r, r.handle, [720, 600, 480, 360], 16);
    r.run(64);
    const caught = r.moves[r.moves.length - 1] ?? 0;
    expect(caught).toBeGreaterThan(60);
    // Down on the drawer itself, where no press would pull it at rest: it
    // stops under the finger. Pulled down from there and held, it goes on
    // from where it was caught, not from where it began.
    r.drawer.dispatchEvent(pointer('pointerdown', 300));
    r.run(64);
    expect(r.moves[r.moves.length - 1]).toBe(caught);
    expect(r.drag.moving()).toBe(true);
    r.clock.now += 200;
    r.drawer.dispatchEvent(pointer('pointermove', 600));
    r.flush();
    expect(r.moves[r.moves.length - 1]).toBe(caught + 300);
    r.clock.now += 200;
    r.drawer.dispatchEvent(pointer('pointerup', 600));
    r.run(1000);
    // No second begin: it was one movement, caught.
    expect(r.log).toEqual(['begin folded', 'settle folded from folded']);
  });

  it('a tap while it springs holds it, then lets it go on to where it was going, and keeps its click', () => {
    const r = rig();
    let clicks = 0;
    r.handle.addEventListener('click', () => clicks++);
    // Flung toward open; a tap on the handle, which moved up with it.
    finger(r, r.handle, [720, 600, 480, 360], 16);
    r.run(64);
    const caught = r.moves[r.moves.length - 1] ?? 0;
    expect(caught).toBeGreaterThan(60);
    r.handle.dispatchEvent(pointer('pointerdown', 300));
    expect(r.drag.moving()).toBe(true);
    expect(r.drag.flying()).toBe(false);
    // Held under the finger, and a wobble short of a pull is still a tap.
    r.clock.now += 40;
    r.handle.dispatchEvent(pointer('pointermove', 300 + SLOP - 2));
    r.run(64);
    expect(r.moves[r.moves.length - 1]).toBe(caught);
    r.handle.dispatchEvent(pointer('pointerup', 300 + SLOP - 2));
    r.handle.click();
    expect(clicks).toBe(1);
    // On from where it was held, every frame nearer, to where it was going.
    expect(r.drag.flying()).toBe(true);
    const before = r.moves.length;
    r.run(1000);
    const rest = r.moves.slice(before);
    expect(rest.every((y, i) => y <= (i === 0 ? caught : (rest[i - 1] ?? y)))).toBe(true);
    expect(rest[rest.length - 1]).toBe(60);
    // One journey: one begin, one settle.
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
  });

  it('a cancelled touch rests where it was heading, at no speed', () => {
    const r = rig();
    r.reduced.value = true;
    finger(r, r.handle, [720, 600, 480, 300], 8, false);
    r.handle.dispatchEvent(pointer('pointercancel', 300));
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
  });

  it('a second finger is ignored while the first holds it', () => {
    const r = rig();
    r.reduced.value = true;
    r.handle.dispatchEvent(pointer('pointerdown', 720, 1));
    r.handle.dispatchEvent(pointer('pointermove', 600, 1));
    r.handle.dispatchEvent(pointer('pointerdown', 700, 2));
    r.handle.dispatchEvent(pointer('pointermove', 200, 2));
    r.flush();
    expect(r.moves).toEqual([564]);
    r.handle.dispatchEvent(pointer('pointerup', 600, 1));
    expect(r.log).toEqual(['begin folded', 'settle folded from folded']);
  });

  it('swallows the click a browser sends after the finger lifts, and only that one', () => {
    const r = rig();
    r.reduced.value = true;
    let clicks = 0;
    r.handle.addEventListener('click', () => clicks++);
    finger(r, r.handle, [720, 600, 480, 360], 16);
    r.handle.click();
    expect(clicks).toBe(0);
    r.handle.click();
    expect(clicks).toBe(1);
  });

  it('a press that starts after the drag is a tap of its own, and keeps its click', () => {
    const r = rig();
    r.reduced.value = true;
    let clicks = 0;
    r.list.addEventListener('click', () => clicks++);
    // A touch that moved sends no click of its own; the next tap is a tap.
    finger(r, r.handle, [720, 600, 480, 360], 16);
    r.list.dispatchEvent(pointer('pointerdown', 500, 2));
    r.list.click();
    expect(clicks).toBe(1);
  });

  it('finish lets a finger still on it go where it is, at no speed, and lands it', () => {
    const r = rig();
    // Up to 264 at speed, and the page goes before the finger lifts.
    finger(r, r.handle, [720, 600, 480, 300], 8, false);
    r.drag.finish();
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
    expect(r.moves[r.moves.length - 1]).toBe(60);
    expect(r.drag.moving()).toBe(false);
    expect(r.frames.size).toBe(0);
    // Its lift, should it come after all, changes nothing.
    r.handle.dispatchEvent(pointer('pointerup', 300));
    r.run(1000);
    expect(r.log).toHaveLength(2);
  });

  it('finish lands a spring held by a still finger where it was going', () => {
    const r = rig();
    finger(r, r.handle, [720, 600, 480, 360], 16);
    r.run(48);
    r.drawer.dispatchEvent(pointer('pointerdown', 300));
    r.drag.finish();
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
    expect(r.drag.moving()).toBe(false);
  });

  it('a capture lost with no lift lets it go where it is, a frame later, at no speed', () => {
    const r = rig();
    r.reduced.value = true;
    finger(r, r.handle, [720, 600, 480, 500], 8, false);
    // What the touch pressed loses its hold as the pull takes it for the
    // drawer: that is the pull beginning, not ending.
    r.handle.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }));
    r.flush();
    expect(r.log).toEqual(['begin folded']);
    expect(r.drag.moving()).toBe(true);
    r.drawer.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1 }));
    expect(r.log).toEqual(['begin folded']);
    r.flush();
    // Let go at 464 with no speed: nearer folded than open.
    expect(r.log).toEqual(['begin folded', 'settle folded from folded']);
    expect(r.drag.moving()).toBe(false);
    // A capture lost after a lift is the lift's, and is nothing more.
    finger(r, r.handle, [720, 600, 480, 300], 8);
    r.drawer.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1 }));
    r.flush();
    expect(r.log).toEqual([
      'begin folded',
      'settle folded from folded',
      'begin folded',
      'settle open from folded',
    ]);
  });

  it('a press whose lift never came does not hold up the next one', () => {
    const r = rig();
    r.reduced.value = true;
    // A touch on the handle that never moved and never lifted, then a pull.
    r.handle.dispatchEvent(pointer('pointerdown', 720, 3));
    finger(r, r.handle, [720, 600, 480, 300], 16);
    expect(r.log).toEqual(['begin folded', 'settle open from folded']);
    // A pull whose lift went missing ends where it is when the same
    // pointer comes down again, and the new press is a pull of its own.
    finger(r, r.handle, [80, 200, 400, 700], 16, false);
    finger(r, r.handle, [300, 200, 100], 16);
    expect(r.log).toEqual([
      'begin folded',
      'settle open from folded',
      'begin open',
      'settle folded from open',
      'begin folded',
      'settle open from folded',
    ]);
  });

  it('leaves nothing listening once destroyed', () => {
    const r = rig();
    r.drag.destroy();
    finger(r, r.handle, [720, 600, 480]);
    expect(r.log).toEqual([]);
  });
});
