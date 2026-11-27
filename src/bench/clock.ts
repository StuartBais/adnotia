// The prototype's ticker (design/lantern/PROTOTYPE-PLAN.md section 12, "The
// ticker"). It renders nothing: it calls back so live text and bars can be
// patched in place.
//
// Ticks land on whole seconds while a bar is on screen and motion is full, and
// on whole minutes otherwise, each scheduled with one setTimeout at the next
// boundary rather than a setInterval that drifts. By the minute, a tick also
// lands where a running task's own minute turns, which is when its figure and
// its stepped bar change. A minute tick always runs
// while the page is visible, for "in N min", "free until", passed slots and the
// 04:00 boundary. Ticking stops while the page is hidden. Every value the app
// shows is worked out from the time and the stored timestamps, so a tick that
// never came costs nothing: the next one, or waking, puts everything right.

export interface TickerOptions {
  /**
   * Called on every tick. `minute` is true on the first tick of a new clock
   * minute, which is when anything measured in minutes can change.
   */
  onTick(tick: { minute: boolean }): void;
  /**
   * On becoming visible, on pageshow and on window focus, before ticking
   * resumes. Where the forgotten clock, the day boundary, passed slots and the
   * restore rule run, in that order, then one render. A burst of these events
   * on return wakes once.
   */
  onWake(): void;
  /** On becoming hidden or pagehide, once, after ticking has stopped. */
  onHide(): void;
  /** Whether a tick a second is worth it now: a bar on screen, motion full. */
  perSecond(): boolean;
  /**
   * When ticking by the minute: the next moment, in ms since the epoch, that
   * something shown changes other than on a clock minute. A running task's
   * "18 min left" turns on its own minute, which can fall anywhere in a clock
   * minute, so without this the figure could lag by up to 59 seconds.
   */
  nextChange?(): number | undefined;
  /** Milliseconds since the epoch. Injected so tests never read the real clock. */
  now?: () => number;
  doc?: Document;
  win?: Window;
}

export interface Ticker {
  /** Look at `perSecond` again, after the screen changed. */
  refresh(): void;
  /** Stop and remove every listener. Nothing is left running. */
  destroy(): void;
}

const SECOND = 1000;
const MINUTE = 60_000;

/** Events closer together than this are one return to the app. */
const BURST = 1000;

export function createTicker(options: TickerOptions): Ticker {
  const now = options.now ?? (() => Date.now());
  const doc = options.doc ?? document;
  const win = options.win ?? window;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastMinute = Math.floor(now() / MINUTE);
  let lastWake = Number.NEGATIVE_INFINITY;
  let asleep = doc.visibilityState === 'hidden';
  let destroyed = false;

  function stop(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function schedule(): void {
    stop();
    if (destroyed || doc.visibilityState === 'hidden') return;
    const at = now();
    const unit = options.perSecond() ? SECOND : MINUTE;
    let delay = unit - (at % unit);
    if (unit === MINUTE) {
      const change = options.nextChange?.();
      if (change !== undefined && change > at && change - at < delay) delay = change - at;
    }
    timer = setTimeout(tick, delay);
  }

  function tick(): void {
    timer = undefined;
    const minute = Math.floor(now() / MINUTE);
    const turned = minute !== lastMinute;
    lastMinute = minute;
    options.onTick({ minute: turned });
    schedule();
  }

  function hide(): void {
    stop();
    if (asleep) return;
    asleep = true;
    // A burst is the events of one return. Once the page has gone away again,
    // the next show is another return, however soon it comes: without this, a
    // second return within a second of the first was never woken from, which
    // left the away record standing and the wake lock let go.
    lastWake = Number.NEGATIVE_INFINITY;
    options.onHide();
  }

  function show(): void {
    if (destroyed || doc.visibilityState === 'hidden') return;
    asleep = false;
    const at = now();
    if (at - lastWake >= BURST) {
      lastWake = at;
      lastMinute = Math.floor(at / MINUTE);
      options.onWake();
    }
    schedule();
  }

  const onVisibility = () => (doc.visibilityState === 'hidden' ? hide() : show());
  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('pagehide', hide);
  win.addEventListener('pageshow', show);
  win.addEventListener('focus', show);

  schedule();

  return {
    refresh: schedule,
    destroy() {
      destroyed = true;
      stop();
      doc.removeEventListener('visibilitychange', onVisibility);
      win.removeEventListener('pagehide', hide);
      win.removeEventListener('pageshow', show);
      win.removeEventListener('focus', show);
    },
  };
}
