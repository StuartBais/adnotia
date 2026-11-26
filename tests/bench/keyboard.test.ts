import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FIELD_ABOVE_FOOT,
  KEYBOARD_GUESS,
  keyboardInset,
  trackKeyboard,
  type ViewportLike,
} from '../../src/bench/keyboard';

// The keyboard (design/lantern/PROTOTYPE-PLAN.md section 13): the capture
// sheet rides it by `--kb`, worked out from the visual viewport, and is lifted
// to where the keyboard will be before its field is focused, so iOS never
// pans the page to show the field. The visual viewport is a fake here, moved
// the way iOS moves it: the keyboard shrinks its height, a pan moves its top.

const HEIGHT = 844;

class FakeViewport implements ViewportLike {
  height = HEIGHT;
  offsetTop = 0;
  scale = 1;
  private listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, listener: () => void): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  count(): number {
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }
  /** The keyboard rises or falls: the visual viewport's height changes, then it says so. */
  keyboard(height: number): void {
    this.height = HEIGHT - height;
    for (const listener of this.listeners.get('resize') ?? []) listener();
  }
  pan(top: number): void {
    this.offsetTop = top;
    for (const listener of this.listeners.get('scroll') ?? []) listener();
  }
}

const root = document.documentElement;
const kb = () => root.style.getPropertyValue('--kb');

let tracker: ReturnType<typeof trackKeyboard> | undefined;
afterEach(() => {
  tracker?.destroy();
  tracker = undefined;
});

function track(viewport?: FakeViewport, onChange?: (inset: number) => void) {
  tracker = trackKeyboard({
    root,
    viewport,
    layoutHeight: () => HEIGHT,
    ...(onChange ? { onChange } : {}),
  });
  return tracker;
}

describe('keyboardInset', () => {
  it('is the part of the layout viewport under the visual viewport’s foot', () => {
    expect(keyboardInset(HEIGHT, { height: 508, offsetTop: 0 })).toBe(336);
    // Panned by iOS: the keyboard covers less of the layout viewport.
    expect(keyboardInset(HEIGHT, { height: 508, offsetTop: 150 })).toBe(186);
  });

  it('is nothing with no keyboard, no visual viewport, or a sub-pixel of rounding', () => {
    expect(keyboardInset(HEIGHT, { height: HEIGHT, offsetTop: 0 })).toBe(0);
    expect(keyboardInset(HEIGHT, undefined)).toBe(0);
    expect(keyboardInset(HEIGHT, { height: 843.4, offsetTop: 0 })).toBe(0);
  });

  it('says nothing while the page is pinch-zoomed, which shrinks the visual viewport too', () => {
    expect(keyboardInset(HEIGHT, { height: 422, offsetTop: 100, scale: 2 })).toBeNull();
  });
});

describe('trackKeyboard', () => {
  it('sets --kb on the root as the keyboard rises and falls', () => {
    const viewport = new FakeViewport();
    const changes: number[] = [];
    track(viewport, (inset) => changes.push(inset));
    viewport.keyboard(336);
    expect(kb()).toBe('336px');
    viewport.keyboard(0);
    expect(kb()).toBe('');
    expect(changes).toEqual([336, 0]);
  });

  it('follows a pan, so the sheet’s foot stays on the keyboard', () => {
    const viewport = new FakeViewport();
    track(viewport);
    viewport.keyboard(336);
    viewport.pan(40);
    expect(kb()).toBe('296px');
  });

  it('lifts the sheet to a guess before the field is focused, and holds it until the keyboard comes', () => {
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    keyboard.expect();
    const guess = Math.round(HEIGHT * KEYBOARD_GUESS);
    // Near enough the 336 pt keyboard of a 6.1 in iPhone that the field is
    // above it: iOS pans only to show the field.
    expect(guess + FIELD_ABOVE_FOOT).toBeGreaterThan(336);
    expect(Math.abs(guess - 336)).toBeLessThan(12);
    expect(kb()).toBe(`${guess}px`);
    expect(keyboard.inset()).toBe(guess);
    // Scrolling the visual viewport before the keyboard is up changes nothing.
    viewport.pan(0);
    expect(kb()).toBe(`${guess}px`);
    viewport.keyboard(336);
    expect(kb()).toBe('336px');
  });

  it('guesses the keyboard it last measured, the next time', () => {
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    viewport.keyboard(291);
    viewport.keyboard(0);
    keyboard.expect();
    expect(kb()).toBe('291px');
  });

  it('keeps an open sheet where the keyboard was when the keyboard goes without it', () => {
    // Safari's Done above the keys puts the keyboard away and leaves the
    // sheet open. Were the sheet to drop to the foot, the next tap on its
    // field would bring the keyboard up over the field, and iOS would pan.
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    keyboard.expect();
    viewport.keyboard(336);
    viewport.keyboard(0);
    expect(kb()).toBe('336px');
    expect(keyboard.inset()).toBe(336);
    // The tap on the field: the keyboard comes back up under the field.
    viewport.keyboard(336);
    expect(kb()).toBe('336px');
    // The sheet goes: the keyboard alone again, and it is down.
    viewport.keyboard(0);
    keyboard.release();
    expect(kb()).toBe('');
  });

  it('keeps the guess for an open sheet whose keyboard never came', () => {
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    keyboard.expect();
    viewport.keyboard(0);
    expect(kb()).toBe(`${Math.round(HEIGHT * KEYBOARD_GUESS)}px`);
  });

  it('takes the keyboard as it is when it is already up', () => {
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    viewport.keyboard(300);
    keyboard.expect();
    expect(kb()).toBe('300px');
  });

  it('lets the guess go when the sheet does', () => {
    const viewport = new FakeViewport();
    const keyboard = track(viewport);
    keyboard.expect();
    keyboard.release();
    expect(kb()).toBe('');
  });

  it('keeps the guess where there is no visual viewport, as a stand-in for the keyboard', () => {
    const keyboard = track(undefined);
    keyboard.expect();
    expect(kb()).toBe(`${Math.round(HEIGHT * KEYBOARD_GUESS)}px`);
    keyboard.release();
    expect(kb()).toBe('');
  });

  it('leaves the last value while the page is zoomed', () => {
    const viewport = new FakeViewport();
    track(viewport);
    viewport.keyboard(336);
    viewport.scale = 2;
    viewport.keyboard(500);
    expect(kb()).toBe('336px');
  });

  it('stops listening and clears --kb when it is taken down', () => {
    const viewport = new FakeViewport();
    const onChange = vi.fn();
    const keyboard = track(viewport, onChange);
    expect(viewport.count()).toBe(2);
    viewport.keyboard(336);
    keyboard.destroy();
    tracker = undefined;
    expect(viewport.count()).toBe(0);
    expect(kb()).toBe('');
    viewport.keyboard(200);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
