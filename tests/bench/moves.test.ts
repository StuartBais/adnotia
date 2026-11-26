// The animated path (src/bench/moves.ts; plan section 14, phase B): gated on
// data-motion=full, the Reduce Motion path left as it was, and every motion
// ending on exactly the page the Reduce Motion path leaves.
//
// jsdom has no Web Animations, so a stub stands in for element.animate: it
// records what it is asked to play and finishes when the motion's own timer
// says so. jsdom lays nothing out either, so these hold the page, not its
// geometry; the comparison harness holds the geometry, within 1 pt.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOCUS_FADE_MS } from '../../src/bench/app';
import { springDuration } from '../../src/bench/motion';
import { DROP_MS } from '../../src/bench/moves';
import type { BenchDomains } from '../../src/bench/state';
import {
  BOARD_STOPS,
  button,
  fly,
  historyDepth,
  layOut,
  mount,
  press,
  pull,
  settle,
  stateOf,
  type Mounted,
  unmount,
} from './mount';

const TUE_1005 = '2026-11-24T10:05:00';
const TUE_0958 = '2026-11-24T09:58:00';
const HANDLE = 'Next, in 25 minutes: 10:30, Call the dentist. Rest of today';

interface Played {
  el: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  /** Cancelled: the motion it belongs to has ended. */
  cancelled: boolean;
}

let played: Played[] = [];
const original = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');

beforeEach(() => {
  played = [];
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
      const one: Played = { el: this, frames, options, cancelled: false };
      played.push(one);
      return {
        cancel() {
          one.cancelled = true;
        },
      };
    },
  });
});

afterEach(() => {
  unmount();
  vi.restoreAllMocks();
  if (original) Object.defineProperty(Element.prototype, 'animate', original);
  else delete (Element.prototype as { animate?: unknown }).animate;
});

/**
 * The board's layout, as layOut gives it, and the drawer drawn where it
 * rests, or at `drawn` while a test says a motion has it elsewhere.
 */
function layDrawer(m: () => Mounted | undefined): { drawn: number | undefined } {
  layOut();
  const at = { drawn: undefined as number | undefined };
  const laid = vi.mocked(Element.prototype.getBoundingClientRect);
  const board = laid.getMockImplementation()!;
  laid.mockImplementation(function (this: Element) {
    const mounted = m();
    if (mounted && this.classList.contains('drawer') && this.parentElement === mounted.container) {
      const top = at.drawn ?? BOARD_STOPS[mounted.container.dataset['drawer'] ?? 'folded'] ?? 0;
      return {
        top,
        bottom: top + 844,
        left: 0,
        right: 390,
        width: 390,
        height: 844,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return board.call(this);
  });
  return at;
}

const reduced = (state: BenchDomains): BenchDomains => ({
  ...state,
  bench: { ...state.bench, settings: { ...state.bench.settings, motion: 'reduced' } },
});

/** A motion starts in the same task as the tap that changed the page, before it is drawn. */
const drawn = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** Every motion and every Reduce Motion fade over, and the hand still a while. */
function over(m: Mounted): void {
  settle(m, 2000);
  vi.advanceTimersByTime(Math.max(1000, DROP_MS + 100));
}

/**
 * The page as it is: every layer as built, where focus is, history, and
 * the record. The app's own two attributes for the path it is on, and
 * nothing else, differ.
 */
function page(m: Mounted): string {
  const active = document.activeElement;
  return JSON.stringify({
    html: m.container.innerHTML,
    focus: active instanceof HTMLElement ? active.id || active.className : null,
    depth: historyDepth(),
    // The record, but for the setting that chose the path.
    state: { ...stateOf(m), bench: { ...stateOf(m).bench, settings: undefined } },
    attrs: [...m.container.attributes]
      .filter((a) => !['data-motion', 'data-anim'].includes(a.name))
      .map((a) => `${a.name}=${a.value}`),
  });
}

/** Nothing a motion drew or set is left. */
function nothingLeft(m: Mounted): void {
  expect(m.container.querySelector('.morph')?.childElementCount).toBe(0);
  expect(m.container.querySelector('.ghostscreen')?.childElementCount).toBe(0);
  expect(m.container.querySelector('.mframe, .mdrawer, .mghost, .mtick')).toBeNull();
  expect(m.container.querySelector('[style*="will-change"]')).toBeNull();
  expect(m.container.dataset['flight']).toBeUndefined();
}

type Step = (m: Mounted) => void | Promise<void>;

/**
 * The same steps on both paths. After each, once everything is over, the
 * page on the animated path is the page on the Reduce Motion path.
 */
async function bothWays(at: string, scenario: Parameters<typeof mount>[1], steps: Step[]) {
  const pages: { reduced: string[]; full: string[]; calls: number[] } = {
    reduced: [],
    full: [],
    calls: [],
  };
  for (const way of ['reduced', 'full'] as const) {
    const m = await mount(at, scenario, way === 'reduced' ? reduced : undefined);
    expect(m.container.dataset['motion']).toBe(way);
    settle(m);
    for (const step of steps) {
      const before = played.length;
      await step(m);
      await drawn();
      if (way === 'full') pages.calls.push(played.length - before);
      over(m);
      if (way === 'full') nothingLeft(m);
      pages[way].push(page(m));
    }
    unmount();
  }
  pages.full.forEach((full, i) => {
    const want = pages.reduced[i] ?? '';
    if (full === want) return;
    let at = 0;
    while (at < full.length && full[at] === want[at]) at++;
    throw new Error(
      `step ${i}: differs at ${at}:\n full:    ${full.slice(at - 120, at + 200)}\n reduced: ${want.slice(at - 120, at + 200)}`,
    );
  });
  return pages;
}

describe('the animated path is gated on data-motion=full', () => {
  it('plays nothing, and marks nothing, under Reduce Motion, whatever the browser can do', async () => {
    const m = await mount(TUE_1005, 'example', reduced);
    expect(m.container.hasAttribute('data-anim')).toBe(false);
    press(m.container, HANDLE);
    await drawn();
    press(m.container, 'Hide the rest of today');
    await drawn();
    settle(m);
    press(m.container, /^Now: Write the question/);
    await drawn();
    press(m.container, 'Back to Today');
    await drawn();
    press(m.container, 'Capture');
    await drawn();
    expect(played).toEqual([]);
    expect(m.container.querySelector('.morph')?.childElementCount).toBe(0);
  });

  it('with motion on, the app says so, and a tap plays its way', async () => {
    let mounted: Mounted | undefined;
    layDrawer(() => mounted);
    const m = await mount(TUE_1005);
    mounted = m;
    expect(m.container.hasAttribute('data-anim')).toBe(true);
    press(m.container, HANDLE);
    await drawn();
    expect(played.length).toBeGreaterThan(0);
    // The drawer on the drawer spring, from where it was drawn.
    const drawer = played.find((p) => p.el === m.container.querySelector('.drawer'));
    expect(drawer?.options.easing).toMatch(/^(linear\(|cubic-bezier\()/);
    expect(drawer?.frames).toEqual([
      { transform: 'translate(0px, 684px) scale(1, 1)' },
      { transform: 'translate(0px, 60px) scale(1, 1)' },
    ]);
    // And the lantern and the capsule as one layer: pictures, and a frame.
    expect(m.container.querySelector('.morph .mframe')).not.toBeNull();
    for (const node of m.container.querySelectorAll('.morph > *')) {
      expect(
        node.getAttribute('aria-hidden') === 'true' || node.closest('[aria-hidden="true"]'),
      ).toBeTruthy();
    }
    over(m);
    nothingLeft(m);
  });

  it('leaves the Reduce Motion path’s own fades as they were, and draws its own in their place', async () => {
    for (const way of ['reduced', 'full'] as const) {
      const m = await mount(TUE_0958, 'notStarted', way === 'reduced' ? reduced : undefined);
      settle(m);
      press(m.container, 'Start');
      const lantern = m.container.querySelector('.screen .lantern')!;
      // Lighting on Start: a 150 ms colour change, or the sentence growing into the step.
      expect(lantern.classList.contains('lighting')).toBe(way === 'reduced');
      over(m);
      await drawn();
      press(m.container, 'Tasks');
      await drawn();
      // A tab switch fades either way.
      expect(m.container.querySelector('.screen > .enter')).not.toBeNull();
      over(m);
      m.container.querySelector<HTMLElement>('.body.tasks .rowbtn')!.click();
      // A page pushed on the tab fades, or slides.
      expect(m.container.querySelector('.screen > .enter') !== null).toBe(way === 'reduced');
      await drawn();
      expect(m.container.querySelector('.ghostscreen')!.childElementCount).toBe(
        way === 'reduced' ? 0 : 1,
      );
      over(m);
      unmount();
    }
  });

  it('without Web Animations, motion on is the Reduce Motion page', async () => {
    delete (Element.prototype as { animate?: unknown }).animate;
    const m = await mount(TUE_1005);
    expect(m.container.dataset['motion']).toBe('full');
    expect(m.container.hasAttribute('data-anim')).toBe(false);
    press(m.container, HANDLE);
    await drawn();
    expect(m.container.querySelector('.morph')?.childElementCount).toBe(0);
  });
});

describe('every motion ends on the Reduce Motion path’s page', () => {
  it('the drawer opened and folded by a tap, with the lantern and the capsule', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, HANDLE),
      (m) => press(m.container, 'Hide the rest of today'),
    ]);
    expect(calls.every((n) => n > 0)).toBe(true);
  });

  it('Today left by a tab and reached again', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, 'Tasks'),
      (m) => press(m.container, 'Today'),
    ]);
    expect(calls.every((n) => n > 0)).toBe(true);
  });

  it('the capsule grown into Focus and back, and the lantern into Focus and back', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, 'Routines'),
      (m) => press(m.container, /^Now: Write the question/),
      (m) => press(m.container, 'Back to Routines'),
      (m) => press(m.container, 'Today'),
      (m) => press(m.container, /^Now: Write the question/),
      (m) => press(m.container, 'Back to Today'),
    ]);
    expect(calls.every((n) => n > 0)).toBe(true);
  });

  it('capture opened from Today, saved, and the Next line’s words changed in place', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, 'Capture'),
      (m) => {
        const field = m.container.querySelector<HTMLInputElement>('#c-field')!;
        field.value = 'Ask Ana about Friday';
        field.dispatchEvent(new Event('input', { bubbles: true }));
      },
      (m) => press(m.container, 'Save'),
    ]);
    expect(calls[0]).toBeGreaterThan(0);
    expect(calls[2]).toBeGreaterThan(0);
  });

  it('capture opened over a place and closed', async () => {
    await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, 'Tasks'),
      (m) => press(m.container, 'Capture'),
      (m) => press(m.container, 'Close'),
    ]);
  });

  it('Start, Step done, Pause and Resume on Today', async () => {
    const { calls } = await bothWays(TUE_0958, 'notStarted', [
      (m) => press(m.container, 'Start'),
      (m) => press(m.container, /^Step done/),
      (m) => press(m.container, 'Pause'),
      (m) => press(m.container, 'Resume'),
    ]);
    expect(calls.every((n) => n > 0)).toBe(true);
  });

  it('Step done in Focus', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, /^Now: Write the question/),
      (m) => press(m.container, /^Step done/),
    ]);
    expect(calls[1]).toBeGreaterThan(0);
  });

  it('a page pushed on a tab and popped', async () => {
    const { calls } = await bothWays(TUE_1005, 'example', [
      (m) => press(m.container, 'Tasks'),
      (m) => {
        m.container.querySelector<HTMLElement>('.body.tasks .rowbtn')!.click();
      },
      (m) => press(m.container, 'Back to Tasks'),
    ]);
    expect(calls[1]).toBeGreaterThan(0);
    expect(calls[2]).toBeGreaterThan(0);
  });

  it('the drawer pulled open and folded by a finger', async () => {
    layOut();
    await bothWays(TUE_1005, 'example', [
      (m) => {
        pull(m, button(m.container, HANDLE), [720, 600, 480, 300]);
        fly(m);
      },
      (m) => {
        pull(m, m.container.querySelector('#h-rest')!, [90, 400, 600, 700]);
        fly(m);
      },
    ]);
  });
});

describe('a motion runs to its own end', () => {
  /** What the last step played, from `before` on. */
  const since = (before: number) => played.slice(before);
  const SPRING_END = springDuration() + 50;

  it('“⌄ Today” is not cut short when Focus’s fading layers are emptied', async () => {
    for (const from of ['capsule', 'lantern'] as const) {
      const m = await mount(TUE_1005);
      settle(m);
      if (from === 'capsule') {
        press(m.container, 'Routines');
        await drawn();
        over(m);
      }
      press(m.container, /^Now: Write the question/);
      await drawn();
      over(m);
      const before = played.length;
      press(m.container, from === 'capsule' ? 'Back to Routines' : 'Back to Today');
      await drawn();
      const mine = since(before);
      expect(mine.length).toBeGreaterThan(0);
      // Focus's own layers are emptied once its Reduce Motion fade would be over…
      vi.advanceTimersByTime(FOCUS_FADE_MS + 20);
      expect(m.container.querySelector('.focus')!.childElementCount).toBe(0);
      // …and the way back into the capsule or the lantern goes on being drawn.
      expect(mine.filter((p) => p.cancelled)).toEqual([]);
      expect(m.container.querySelector('.app > .mframe, .morph > .mframe')).not.toBeNull();
      vi.advanceTimersByTime(SPRING_END - FOCUS_FADE_MS);
      expect(mine.every((p) => p.cancelled)).toBe(true);
      nothingLeft(m);
      unmount();
    }
  });
});

describe('motions are interruptible', () => {
  it('a second tap mid-way lands on the page it would at rest, and the tap guard holds', async () => {
    const pages: string[] = [];
    for (const way of ['reduced', 'full'] as const) {
      const m = await mount(TUE_1005, 'example', way === 'reduced' ? reduced : undefined);
      settle(m);
      press(m.container, HANDLE);
      await drawn();
      vi.advanceTimersByTime(60);
      press(m.container, 'Hide the rest of today');
      await drawn();
      // The lantern has just grown back out of the capsule: Step done takes no tap.
      const before = stateOf(m).tasks;
      press(m.container, /^Step done/);
      expect(stateOf(m).tasks).toBe(before);
      over(m);
      if (way === 'full') nothingLeft(m);
      pages.push(page(m));
      unmount();
    }
    expect(pages[1]).toEqual(pages[0]);
  });

  it('a finger on the drawer while a tap carries it takes it from where it is drawn', async () => {
    let mounted: Mounted | undefined;
    const drawn$ = layDrawer(() => mounted);
    const m = await mount(TUE_1005);
    mounted = m;
    settle(m);
    press(m.container, HANDLE);
    await drawn();
    // Mid-flight, on its way from 684 to 60, the drawer is drawn at 300.
    drawn$.drawn = 300;
    const drawer = m.container.querySelector<HTMLElement>('.drawer')!;
    pull(m, m.container.querySelector('#h-rest')!, [330, 345, 360], { up: false });
    // From 300, not from 60 where it rests: 30 pt down.
    expect(drawer.style.transform).toBe('translateY(330px)');
    // What the tap set going is over; the finger has it.
    expect(m.container.querySelector('.mdrawer')).toBeNull();
  });
});

describe('under a finger, the lantern and the capsule follow the drawer frame by frame', () => {
  it('draws the layer between them as the drawer moves, and leaves nothing when it rests', async () => {
    layOut();
    const m = await mount(TUE_1005);
    settle(m);
    pull(m, button(m.container, HANDLE), [720, 600, 480], { up: false });
    const morph = m.container.querySelector('.morph')!;
    expect(morph.querySelector('.mframe')).not.toBeNull();
    // Set by hand, frame by frame, not played.
    const step = [...morph.children].find(
      (node) => node.textContent === 'Write the question',
    ) as HTMLElement;
    expect(step.style.transform).toMatch(/^translate\(/);
    // The real lantern and Step done are out of sight while their pictures move.
    expect(m.container.querySelector<HTMLElement>('.screen .lantern')!.style.opacity).toBe('0');
    m.container
      .querySelector('.drawer')!
      .dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 480, pointerId: 7 }));
    fly(m);
    over(m);
    nothingLeft(m);
    expect(m.container.querySelector<HTMLElement>('.screen .lantern')!.hasAttribute('style')).toBe(
      false,
    );
  });
});
