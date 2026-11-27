import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTicker, type Ticker, type TickerOptions } from '../../src/bench/clock';

// The ticker (PROTOTYPE-PLAN.md section 12). The clock here is Vitest's fake
// one, injected: nothing reads the real time.

let visibility: DocumentVisibilityState = 'visible';
let ticker: Ticker | undefined;
let events: string[];
let ticksAt: number[];
let perSecond: boolean;

function setVisibility(next: DocumentVisibilityState): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

function start(overrides: Partial<TickerOptions> = {}): Ticker {
  ticker = createTicker({
    now: () => Date.now(),
    perSecond: () => perSecond,
    onTick: ({ minute }) => {
      ticksAt.push(Date.now());
      events.push(minute ? 'tick:minute' : 'tick');
    },
    onWake: () => events.push('wake'),
    onHide: () => events.push('hide'),
    ...overrides,
  });
  return ticker;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(new Date('2026-11-24T10:05:00.300'));
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  });
  visibility = 'visible';
  events = [];
  ticksAt = [];
  perSecond = true;
});

afterEach(() => {
  ticker?.destroy();
  ticker = undefined;
  // The own property shadowed jsdom's; removing it restores jsdom's.
  delete (document as { visibilityState?: unknown }).visibilityState;
  vi.useRealTimers();
});

describe('createTicker', () => {
  it('ticks on whole seconds while a bar is on screen and motion is full', () => {
    start();
    vi.advanceTimersByTime(3_000);
    expect(ticksAt.length).toBe(3);
    for (const at of ticksAt) expect(at % 1000).toBe(0);
    expect(ticksAt[0]).toBe(new Date('2026-11-24T10:05:01').getTime());
  });

  it('ticks on whole minutes otherwise', () => {
    perSecond = false;
    vi.setSystemTime(new Date('2026-11-24T10:05:20'));
    start();
    vi.advanceTimersByTime(125_000);
    expect(ticksAt).toEqual([
      new Date('2026-11-24T10:06:00').getTime(),
      new Date('2026-11-24T10:07:00').getTime(),
    ]);
    expect(events).toEqual(['tick:minute', 'tick:minute']);
  });

  it('by the minute, also ticks where a running task’s own minute turns', () => {
    perSecond = false;
    vi.setSystemTime(new Date('2026-11-24T10:05:20'));
    // The task's minute turns at 30 seconds past each clock minute.
    const turns = () => {
      const at = Date.now();
      return at - (at % 60_000) + (at % 60_000 < 30_000 ? 30_000 : 90_000);
    };
    start({ nextChange: turns });
    vi.advanceTimersByTime(100_000);
    expect(ticksAt).toEqual([
      new Date('2026-11-24T10:05:30').getTime(),
      new Date('2026-11-24T10:06:00').getTime(),
      new Date('2026-11-24T10:06:30').getTime(),
      new Date('2026-11-24T10:07:00').getTime(),
    ]);
    expect(events).toEqual(['tick', 'tick:minute', 'tick', 'tick:minute']);
  });

  it('ignores a next change already past, or one after the clock minute', () => {
    perSecond = false;
    vi.setSystemTime(new Date('2026-11-24T10:05:20'));
    start({ nextChange: () => Date.now() - 1 });
    vi.advanceTimersByTime(40_000);
    expect(ticksAt).toEqual([new Date('2026-11-24T10:06:00').getTime()]);
  });

  it('marks the first tick of each new minute, so minute work runs once a minute', () => {
    vi.setSystemTime(new Date('2026-11-24T10:05:58.500'));
    start();
    vi.advanceTimersByTime(3_000);
    // 10:05:59, 10:06:00 (a new minute), 10:06:01.
    expect(events).toEqual(['tick', 'tick:minute', 'tick']);
  });

  it('changes pace when asked to look again', () => {
    perSecond = false;
    const clock = start();
    perSecond = true;
    clock.refresh();
    vi.advanceTimersByTime(2_000);
    expect(ticksAt.length).toBe(2);
  });

  it('stops ticking while the page is hidden, and says so once', () => {
    start();
    setVisibility('hidden');
    window.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(5 * 60_000);
    expect(events).toEqual(['hide']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('wakes on return before it ticks again', () => {
    start();
    setVisibility('hidden');
    vi.advanceTimersByTime(45 * 60_000);
    setVisibility('visible');
    vi.advanceTimersByTime(1_000);
    expect(events).toEqual(['hide', 'wake', 'tick']);
  });

  it('wakes once for a burst of visibilitychange, pageshow and focus', () => {
    start();
    setVisibility('hidden');
    vi.advanceTimersByTime(20 * 60_000);
    setVisibility('visible');
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('focus'));
    expect(events.filter((e) => e === 'wake')).toHaveLength(1);
  });

  it('wakes again for a second return inside a second of the first', () => {
    start();
    setVisibility('hidden');
    vi.advanceTimersByTime(5_000);
    setVisibility('visible');
    vi.advanceTimersByTime(400);
    setVisibility('hidden');
    vi.advanceTimersByTime(400);
    setVisibility('visible');
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('focus'));
    expect(events).toEqual(['hide', 'wake', 'hide', 'wake']);
  });

  it('wakes on pageshow or focus alone, in case visibilitychange never came', () => {
    start();
    vi.advanceTimersByTime(5_000);
    events = [];
    window.dispatchEvent(new Event('pageshow'));
    vi.advanceTimersByTime(2_000);
    window.dispatchEvent(new Event('focus'));
    expect(events.filter((e) => e === 'wake')).toHaveLength(2);
  });

  it('does not tick or wake while it is hidden, whatever fires', () => {
    start();
    setVisibility('hidden');
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('pageshow'));
    vi.advanceTimersByTime(60_000);
    expect(events).toEqual(['hide']);
  });

  it('leaves nothing running after destroy', () => {
    const clock = start();
    clock.destroy();
    expect(vi.getTimerCount()).toBe(0);
    setVisibility('hidden');
    setVisibility('visible');
    window.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(5 * 60_000);
    expect(events).toEqual([]);
  });
});
