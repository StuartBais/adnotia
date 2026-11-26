// The animated path's machinery (src/bench/motion.ts): the spring as an
// easing, the maps between boxes, pictures, the frame, and a runner that
// leaves nothing behind.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { spring } from '../../src/bench/drawer';
import {
  Motions,
  NONE,
  SPRING_FALLBACK,
  along,
  backwards,
  framePieces,
  freeze,
  linearEasing,
  mapTo,
  scrub,
  springAt,
  springCurve,
  springDuration,
  xfCss,
  type Animate,
} from '../../src/bench/motion';

describe('the spring as an easing (SPEC 10)', () => {
  it('is the drawer’s own spring from rest', () => {
    const from = spring(0, 624, 0);
    for (const t of [0.02, 0.05, 0.1, 0.2, 0.35]) {
      expect(springAt(t)).toBeCloseTo(from.at(t).y / 624, 6);
    }
  });

  it('comes to rest within a thousandth of the way in about half a second', () => {
    const ms = springDuration();
    expect(ms).toBeGreaterThan(480);
    expect(ms).toBeLessThan(540);
    expect(1 - springAt(ms / 1000)).toBeLessThan(0.001);
    // Never past its target: no overshoot.
    for (let t = 0; t < 1; t += 0.01) expect(springAt(t)).toBeLessThanOrEqual(1);
  });

  it('samples into linear(), rising only, and ending on 1', () => {
    const easing = linearEasing();
    expect(easing).toMatch(/^linear\(0, [0-9., ]+, 1\)$/);
    const values = easing.slice(7, -1).split(', ').map(Number);
    expect(values).toHaveLength(41);
    for (let i = 1; i < values.length; i++)
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]!);
  });

  it('falls back to a Bézier where linear() is not read', () => {
    expect(springCurve(undefined, true).easing).toBe(linearEasing());
    expect(springCurve(undefined, false).easing).toBe(SPRING_FALLBACK);
    expect(springCurve().at(10_000)).toBe(1);
  });
});

describe('boxes and transforms', () => {
  it('writes the same functions at every key', () => {
    expect(xfCss(NONE)).toBe('translate(0px, 0px) scale(1, 1)');
    expect(xfCss({ x: 1.234, y: -0.004, sx: 0.5, sy: 2 })).toBe(
      'translate(1.23px, 0px) scale(0.5, 2)',
    );
  });

  it('stretches one box over another, and keeps a box not laid out at its size', () => {
    const at = { x: 24, y: 460, w: 342, h: 10 };
    const over = { x: 40, y: 639, w: 238, h: 4 };
    expect(mapTo(at, over)).toEqual({ x: 16, y: 179, sx: 238 / 342, sy: 0.4 });
    expect(mapTo({ x: 0, y: 0, w: 0, h: 0 }, over)).toEqual({ x: 40, y: 639, sx: 1, sy: 1 });
  });

  it('scales a line to another, centred on it', () => {
    const xf = mapTo(
      { x: 24, y: 386, w: 342, h: 46 },
      { x: 94, y: 613, w: 184, h: 22 },
      {
        s: 17 / 40,
        line: 46,
        lineOver: 22,
      },
    );
    expect(xf.sx).toBeCloseTo(0.425);
    // The scaled line's middle lands on the other's.
    expect(386 + xf.y + (46 * xf.sx) / 2).toBeCloseTo(613 + 11);
  });

  it('draws a frame as two bands and four discs; a radius of nothing is square', () => {
    const square = framePieces({ box: { x: 0, y: 0, w: 390, h: 684 }, r: 0 });
    expect(square[0]).toEqual({ x: 0, y: 0, sx: 3.9, sy: 6.84 });
    expect(square.slice(2).every((disc) => disc.sx === 0)).toBe(true);
    const capsule = framePieces({ box: { x: 24, y: 606, w: 268, h: 64 }, r: 32 });
    // The bands meet the discs, and the discs are 64 across.
    expect(capsule[0]).toEqual({ x: 24, y: 638, sx: 2.68, sy: 0 });
    expect(capsule[2]).toEqual({ x: 24, y: 606, sx: 1, sy: 1 });
    expect(capsule[5]).toEqual({ x: 228, y: 606, sx: 1, sy: 1 });
  });

  it('reads opacity along stops, held flat at either end, and plays them backwards', () => {
    const stops = [
      [0, 1],
      [100, 0],
    ] as const;
    expect(along(stops, -5)).toBe(1);
    expect(along(stops, 50)).toBe(0.5);
    expect(along(stops, 500)).toBe(0);
    expect(backwards(stops, 500)).toEqual([
      [400, 0],
      [500, 1],
    ]);
  });
});

describe('pictures', () => {
  it('are found by nothing and reached by nothing', () => {
    const source = document.createElement('div');
    source.innerHTML =
      '<button id="b-x" tabindex="0" data-geo="x" aria-describedby="h">Go</button>';
    document.body.append(source);
    const copy = freeze(source);
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.hasAttribute('inert')).toBe(true);
    expect(copy.querySelector('[id], [data-geo], [tabindex], [aria-describedby]')).toBeNull();
    expect(copy.textContent).toBe('Go');
    source.remove();
  });
});

describe('the runner', () => {
  afterEach(() => vi.useRealTimers());

  const fake = () => {
    const calls: { el: Element; frames: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
    const cancelled: number[] = [];
    const animate: Animate = (el, frames, options) => {
      const n = calls.push({ el, frames, options });
      return { cancel: () => void cancelled.push(n) };
    };
    return { animate, calls, cancelled };
  };
  const timers = () => ({
    set: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    now: () => Date.now(),
  });

  it('plays moves on the motion’s easing and fades linearly, then puts everything back', () => {
    vi.useFakeTimers();
    const { animate, calls, cancelled } = fake();
    const motions = new Motions(animate, timers());
    const el = document.createElement('div');
    const picture = document.createElement('div');
    document.body.append(el, picture);
    const ended = vi.fn();
    motions.play({
      channel: 'c',
      duration: 300,
      easing: 'ease',
      tracks: [
        {
          el,
          move: [NONE, { x: 0, y: 10, sx: 1, sy: 1 }],
          fade: [
            [0, 0],
            [100, 1],
          ],
        },
      ],
      temp: [picture],
      hold: [{ el, style: { visibility: 'hidden' } }],
      onEnd: ended,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]!.options).toMatchObject({ duration: 300, easing: 'ease', fill: 'both' });
    expect(calls[0]!.frames).toEqual([
      { transform: 'translate(0px, 0px) scale(1, 1)' },
      { transform: 'translate(0px, 10px) scale(1, 1)' },
    ]);
    expect(calls[1]!.options.easing).toBe('linear');
    expect(calls[1]!.frames).toEqual([
      { opacity: 0, offset: 0 },
      { opacity: 1, offset: 1 / 3 },
      { opacity: 1, offset: 1 },
    ]);
    expect(el.style.visibility).toBe('hidden');
    expect(el.style.willChange).toBe('transform, opacity');
    expect(motions.get('c')).toBeDefined();
    vi.advanceTimersByTime(400);
    expect(cancelled).toEqual([1, 2]);
    expect(picture.isConnected).toBe(false);
    expect(el.hasAttribute('style')).toBe(false);
    expect(ended).toHaveBeenCalledOnce();
    expect(motions.get('c')).toBeUndefined();
    el.remove();
  });

  it('keeps one motion per channel: a new one ends the old at once', () => {
    vi.useFakeTimers();
    const { animate, cancelled } = fake();
    const motions = new Motions(animate, timers());
    const el = document.createElement('div');
    const first = motions.play({
      channel: 'c',
      duration: 300,
      easing: 'ease',
      tracks: [{ el, fade: [[0, 1]] }],
    });
    motions.play({ channel: 'c', duration: 300, easing: 'ease', tracks: [{ el, fade: [[0, 1]] }] });
    expect(first.ended).toBe(true);
    expect(cancelled).toEqual([1]);
  });

  it('scrubs the same tracks frame by frame and takes every style off after', () => {
    const el = document.createElement('div');
    const run = scrub({
      tracks: [
        {
          el,
          move: [NONE, { x: 100, y: 0, sx: 0.5, sy: 0.5 }],
          scrub: [
            [0, 1],
            [0.5, 0],
          ],
        },
      ],
    });
    run.set(0.5);
    expect(el.style.transform).toBe('translate(50px, 0px) scale(0.75, 0.75)');
    expect(el.style.opacity).toBe('0');
    run.set(0.25);
    expect(el.style.opacity).toBe('0.5');
    run.end();
    expect(el.hasAttribute('style')).toBe(false);
  });
});
