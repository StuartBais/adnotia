import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, press, unmount } from './mount';

// The screen stays awake while Focus is on it (design/lantern/PROTOTYPE-PLAN.md
// section 11, "4. Focus"): a Screen Wake Lock, asked for when Focus shows,
// let go when Focus closes, when the page is hidden and when the prototype is
// taken down, and asked for again on the way back. Where the browser has none,
// or refuses, nothing is said and nothing breaks. The lock is a stub here:
// jsdom has no wakeLock, which is the "absent" case of the last tests.

const TUE_1005 = '2026-11-24T10:05:00';
const LIT = /^Now: Write the question\. Step 2 of 3/;

interface Sentinel {
  release: ReturnType<typeof vi.fn>;
  addEventListener: (type: string, listener: () => void) => void;
  /** The browser letting go of it by itself, as it does when the page is hidden. */
  lose(): void;
}

function sentinel(): Sentinel {
  let onRelease: (() => void) | undefined;
  return {
    release: vi.fn(() => Promise.resolve()),
    addEventListener: (_type, listener) => {
      onRelease = listener;
    },
    lose: () => onRelease?.(),
  };
}

let held: Sentinel[] = [];
let request: ReturnType<typeof vi.fn>;

function stubWakeLock(answer?: () => Promise<unknown>): void {
  held = [];
  request = vi.fn(
    answer ??
      (() => {
        const lock = sentinel();
        held.push(lock);
        return Promise.resolve(lock);
      }),
  );
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
}

/** Lets a resolved request land. */
const settled = () => Promise.resolve().then(() => undefined);

afterEach(() => {
  unmount();
  delete (navigator as { wakeLock?: unknown }).wakeLock;
});

describe('the screen stays awake in Focus', () => {
  it('asks for a screen lock when Focus opens, and lets it go when Focus closes', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    expect(request).not.toHaveBeenCalled();
    press(m.container, LIT);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('screen');
    await settled();
    press(m.container, 'Back to Today');
    expect(held[0]?.release).toHaveBeenCalledTimes(1);
    // Today does not hold it.
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('asks once, however often Focus is drawn while it holds', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    press(m.container, 'Add 5 minutes');
    press(m.container, 'Add 5 minutes');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('lets go on the way to the background, and asks again on the way back', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    window.dispatchEvent(new Event('pagehide'));
    expect(held[0]?.release).toHaveBeenCalledTimes(1);
    // Nothing is asked for while the page is going.
    await settled();
    expect(request).toHaveBeenCalledTimes(1);
    m.clock.now = new Date(new Date(TUE_1005).getTime() + 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(m.container.dataset['focus']).toBe('open');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('asks again for a second return inside a second of the first, and keeps no record of going', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    const at = (ms: number) => new Date(new Date(TUE_1005).getTime() + ms);
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = at(60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(request).toHaveBeenCalledTimes(2);
    await settled();
    // Away and back again at once: a swipe along the home bar and back.
    m.clock.now = at(60_400);
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = at(60_800);
    window.dispatchEvent(new Event('pageshow'));
    expect(request).toHaveBeenCalledTimes(3);
    const bench = (m.store.document().domains as { bench?: { away?: unknown } }).bench;
    expect(bench?.away).toBeUndefined();
    // A window focus long after, with no hide (Control Centre), finds nobody
    // away: Focus stays, and the session runs on.
    m.clock.now = at(17 * 60_000);
    window.dispatchEvent(new Event('focus'));
    expect(m.container.dataset['focus']).toBe('open');
  });

  it('asks again at once after the browser let go of it by itself, with nothing drawn', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    held[0]?.lose();
    expect(request).toHaveBeenCalledTimes(2);
    await settled();
    // Drawn again, it holds the new one and asks no more.
    press(m.container, 'Add 5 minutes');
    expect(request).toHaveBeenCalledTimes(2);
    // Let go of once Focus closes, and not asked for again.
    press(m.container, 'Back to Today');
    expect(held[1]?.release).toHaveBeenCalledTimes(1);
    held[1]?.lose();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not ask again when the browser lets go on the way to the background', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    held[0]?.lose();
    expect(request).toHaveBeenCalledTimes(1);
    visibility.mockRestore();
    expect(m.container.dataset['focus']).toBe('open');
  });

  it('lets go of a lock that arrives after Focus has closed', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    press(m.container, 'Back to Today');
    await settled();
    expect(held[0]?.release).toHaveBeenCalledTimes(1);
  });

  it('lets go when the prototype is taken down', async () => {
    stubWakeLock();
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    unmount();
    expect(held[0]?.release).toHaveBeenCalledTimes(1);
    expect(m.container.isConnected).toBe(false);
  });

  it('says nothing and breaks nothing when the browser refuses', async () => {
    stubWakeLock(() => Promise.reject(new DOMException('Not allowed', 'NotAllowedError')));
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    await settled();
    expect(m.container.dataset['focus']).toBe('open');
    expect(m.container.querySelector('.live')?.textContent).toBe('');
    press(m.container, 'Back to Today');
    expect(m.container.dataset['focus']).toBeUndefined();
  });

  it('says nothing and breaks nothing when asking throws', async () => {
    stubWakeLock(() => {
      throw new TypeError('no');
    });
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    expect(m.container.dataset['focus']).toBe('open');
  });

  it('opens and closes Focus as usual where there is no wake lock at all', async () => {
    const m = await mount(TUE_1005);
    expect('wakeLock' in navigator).toBe(false);
    press(m.container, LIT);
    expect(m.container.dataset['focus']).toBe('open');
    press(m.container, 'Back to Today');
    expect(m.container.dataset['focus']).toBeUndefined();
  });
});
