import { describe, expect, it, vi } from 'vitest';
import { formatCountdown, timer } from '../../src/kernel/index';

// The countdown, driven by an injected clock so a test does not wait for it.

function controlled(seconds: number, onFinish?: () => void) {
  let clock = 0;
  let tick: (() => void) | undefined;
  const control = timer({
    seconds,
    now: () => clock,
    schedule: (fn) => {
      tick = fn;
      return () => {
        tick = undefined;
      };
    },
    ...(onFinish === undefined ? {} : { onFinish }),
  });
  return {
    control,
    /** Move the clock on and let the timer notice. */
    advance(bySeconds: number) {
      clock += bySeconds * 1000;
      tick?.();
    },
    ticking: () => tick !== undefined,
  };
}

const press = (element: HTMLElement, text: string): void => {
  const button = [...element.querySelectorAll('button')].find((b) => b.textContent === text);
  if (button === undefined) throw new Error(`no button "${text}"`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('the countdown', () => {
  it('reads as minutes and seconds', () => {
    expect(formatCountdown(185)).toBe('3:05');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('counts down once started, and not before', () => {
    const { control, advance } = controlled(180);
    advance(10);
    expect(control.remaining()).toBe(180);

    control.start();
    advance(10);
    expect(control.remaining()).toBe(170);
  });

  it('works out where it is from the clock, not from how often it was told', () => {
    // A backgrounded tab stops getting ticks. Coming back to a timer that is
    // three minutes behind is worse than not having one.
    const { control, advance } = controlled(300);
    control.start();
    advance(120);
    expect(control.remaining()).toBe(180);
  });

  it('holds where it is when paused, and carries on from there', () => {
    const { control, advance } = controlled(120);
    control.start();
    advance(30);
    control.pause();
    expect(control.running()).toBe(false);

    advance(60);
    expect(control.remaining()).toBe(90);

    control.start();
    advance(10);
    expect(control.remaining()).toBe(80);
  });

  it('stops at zero and says so plainly', () => {
    const finished = vi.fn();
    const { control, advance, ticking } = controlled(60, finished);
    control.start();
    advance(60);

    expect(control.remaining()).toBe(0);
    expect(finished).toHaveBeenCalledOnce();
    expect(ticking()).toBe(false);
    const status = control.element.querySelector('.timer-status')?.textContent ?? '';
    expect(status).toBe('Time is up.');
    expect(status).not.toMatch(/well done|!|\bgreat\b/i);
  });

  it('never runs past zero', () => {
    const { control, advance } = controlled(30);
    control.start();
    advance(90);
    expect(control.remaining()).toBe(0);
  });

  it('goes back to the beginning when reset', () => {
    const { control, advance } = controlled(120);
    control.start();
    advance(45);
    control.reset();
    expect(control.remaining()).toBe(120);
    expect(control.running()).toBe(false);
  });

  it('offers start, then pause, then resume', () => {
    const { control } = controlled(60);
    const label = () => (control.element.querySelector('.btn.primary') as HTMLElement).textContent;
    expect(label()).toBe('Start');
    press(control.element, 'Start');
    expect(label()).toBe('Pause');
    press(control.element, 'Pause');
    expect(label()).toBe('Resume');

    // Still "Resume" after a reset undoes it, because nothing is part-done.
    press(control.element, 'Reset');
    expect(label()).toBe('Start');
  });

  it('makes no sound, because there is nothing to make one with', () => {
    // No audio files in this build: bundle weight the performance budget cannot
    // carry, and a chime is a notification.
    const { control } = controlled(60);
    expect(control.element.querySelector('audio')).toBeNull();
    expect(control.element.innerHTML).not.toMatch(/Audio|play\(/);
  });

  it('does not announce every second to a screen reader', () => {
    const { control } = controlled(60);
    const face = control.element.querySelector('.timer-face') as HTMLElement;
    expect(face.getAttribute('role')).toBe('timer');
    expect(face.getAttribute('aria-live')).toBeNull();
    expect(face.getAttribute('aria-label')).toContain('remaining');
  });

  it('stops ticking when it is thrown away', () => {
    const { control, advance, ticking } = controlled(600);
    control.start();
    advance(1);
    expect(ticking()).toBe(true);
    control.destroy();
    expect(ticking()).toBe(false);
  });
});
