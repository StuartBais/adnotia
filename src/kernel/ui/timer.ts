// A countdown.
//
// In the kernel because three things need one: a mindfulness practice, a focus
// timer, and the visual timer on the child surface that docs/04-family-space.md
// specifies. Three modules building three timers is three sets of behaviour to
// get right, and the accessibility only holds if there is one of each.
//
// No sound. There are no audio files in this build — they are bundle weight the
// performance budget cannot carry and a network request if they are not — and a
// chime is a notification, which docs/03-scope.md is careful about. It says the
// time is up in words instead.
//
// The clock is injectable so a test can run one without waiting for it.

import { el, type Control } from './dom';

export interface TimerOptions {
  /** How long, in seconds. */
  seconds: number;
  label?: string;
  /** What it says when it reaches zero. Plain: it is not an achievement. */
  doneText?: string;
  onFinish?: () => void;
  /** Injected for tests. Defaults to the real ones. */
  now?: () => number;
  schedule?: (tick: () => void) => () => void;
}

export interface TimerControl extends Control<number> {
  start(): void;
  pause(): void;
  reset(): void;
  /** Seconds left. */
  remaining(): number;
  running(): boolean;
  destroy(): void;
}

const STRINGS = {
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  reset: 'Reset',
  done: 'Time is up.',
} as const;

/** `185` to `3:05`. Minutes and seconds, because that is how a timer is read. */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
}

/** A real one-second tick, cancellable. */
function realSchedule(tick: () => void): () => void {
  const handle = setInterval(tick, 1000);
  return () => clearInterval(handle);
}

export function timer(options: TimerOptions): TimerControl {
  const now = options.now ?? (() => Date.now());
  const schedule = options.schedule ?? realSchedule;
  const total = Math.max(1, Math.round(options.seconds));

  /** Seconds left when the clock was last stopped. Start counts down from this. */
  let banked = total;
  let left = total;
  let startedAt: number | undefined;
  let stop: (() => void) | undefined;
  let finished = false;
  /** Whether it has ever been started. Reset clears it. */
  let touched = false;

  const remainingAt = (at: number): number =>
    startedAt === undefined ? banked : Math.max(0, banked - Math.round((at - startedAt) / 1000));

  // Not aria-live on the countdown itself: a screen reader announcing every
  // second is unusable. The state changes are announced; the number is polled
  // by anyone who wants it.
  const display = el('div', { class: 'timer-face', text: formatCountdown(left), role: 'timer' });
  // Its own class as well as the shared one: a tool that puts a status line of
  // its own beside a timer needs to be able to tell them apart, and so does a test.
  const status = el('p', { class: 'bmsg timer-status', role: 'status' });
  const startButton = el('button', { type: 'button', class: 'btn primary', text: STRINGS.start });
  const resetButton = el('button', { type: 'button', class: 'btn small', text: STRINGS.reset });

  function paint(): void {
    display.textContent = formatCountdown(left);
    display.setAttribute('aria-label', `${formatCountdown(left)} remaining`);
    // "Resume" once it has been started at all, even if it was paused before a
    // second had passed: a button that goes Start, Pause, Start reads as though
    // the pause threw the time away.
    startButton.textContent =
      startedAt !== undefined ? STRINGS.pause : touched ? STRINGS.resume : STRINGS.start;
    startButton.disabled = finished;
  }

  function halt(): void {
    stop?.();
    stop = undefined;
    startedAt = undefined;
  }

  function tick(): void {
    if (startedAt === undefined) return;
    // Recomputed from the start time rather than decremented by one each tick,
    // so a tab that was backgrounded does not come back with the wrong number.
    left = remainingAt(now());
    if (left === 0) {
      halt();
      finished = true;
      status.textContent = options.doneText ?? STRINGS.done;
      paint();
      options.onFinish?.();
      return;
    }
    paint();
  }

  const control: TimerControl = {
    element: el('div', { class: 'timer' }, [
      ...(options.label === undefined ? [] : [el('p', { class: 'flabel', text: options.label })]),
      display,
      el('div', { class: 'btnrow' }, [startButton, resetButton]),
      status,
    ]),

    value: () => left,
    set: () => {},

    start() {
      if (finished || startedAt !== undefined) return;
      touched = true;
      startedAt = now();
      stop = schedule(tick);
      status.textContent = '';
      paint();
    },

    pause() {
      if (startedAt === undefined) return;
      banked = remainingAt(now());
      left = banked;
      halt();
      paint();
    },

    reset() {
      halt();
      banked = total;
      left = total;
      finished = false;
      touched = false;
      status.textContent = '';
      paint();
    },

    remaining: () => left,
    running: () => startedAt !== undefined,
    destroy: halt,
  };

  startButton.addEventListener('click', () => {
    if (control.running()) control.pause();
    else control.start();
  });
  resetButton.addEventListener('click', () => control.reset());

  paint();
  return control;
}
