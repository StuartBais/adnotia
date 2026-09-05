// Family-space primitives.
//
// The kernel provides these so no module reimplements them differently, which is
// the whole reason the reward chart is permitted at all. See
// docs/01-module-contract.md "Family space rules" and docs/04-family-space.md.

import { el } from './dom';

export interface RewardChartOptions {
  /** The child's nickname, chosen by the parent. Nothing else is asked. */
  nickname: string;
  points: number;
  /** What the parent set as the goal. */
  goal?: number;
  /**
   * Awarding is parent-initiated, every time. The app never awards on its own
   * and never removes: points are earned, never lost.
   */
  onAward?: () => void;
  /** True on the handed-over surface, where the chart is view-only. */
  readOnly?: boolean;
}

/**
 * The positive-only reward chart.
 *
 * This is the one place in Adnotia that shows points, and it is a behavioural
 * parent-training technique rather than an engagement mechanic. The distinction
 * is mechanical: the app never awards, removes or reminds on its own initiative.
 * There is no streak, no loss and no notification, and this function offers no
 * way to add one.
 */
export function rewardChart(options: RewardChartOptions): HTMLElement {
  const points = Math.max(0, Math.floor(options.points));

  const stars = el('p', {
    class: 'reward-stars',
    'aria-label': `${points} ${points === 1 ? 'star' : 'stars'}`,
    text: '★'.repeat(points),
  });

  const chart = el('div', { class: 'card reward' }, [
    el('h2', { text: `${options.nickname}'s chart` }),
    stars,
  ]);

  if (options.goal !== undefined) {
    chart.append(
      el('p', {
        class: 'sub',
        // Describes where things are. It does not urge, and it never counts down
        // in a way that reads as falling behind.
        text: `${points} of ${options.goal} so far.`,
      }),
    );
  }

  if (options.readOnly !== true && options.onAward) {
    const award = el('button', {
      type: 'button',
      class: 'btn primary',
      text: 'Add a star',
    });
    award.addEventListener('click', options.onAward);
    chart.append(el('div', { class: 'btnrow' }, [award]));
  }

  return chart;
}

export interface ParentGateOptions {
  /** Shown above the keypad. Plain, and never blaming the child. */
  message?: string;
  /** Resolves true when the code is right. The kernel owns the comparison. */
  verify: (code: string) => Promise<boolean> | boolean;
  onOpen: () => void;
  onWrong?: () => void;
}

/**
 * The parent gate: a passcode to enter child mode and a passcode to leave it.
 *
 * Large targets, because a parent uses it one-handed while holding a phone out
 * of a child's reach. See docs/05-architecture.md "Family".
 */
export function parentGate(options: ParentGateOptions): HTMLElement {
  const input = el('input', {
    type: 'password',
    inputmode: 'numeric',
    autocomplete: 'off',
    class: 'pin',
    'aria-label': 'Parent code',
  });

  const message = el('p', {
    class: 'sub',
    role: 'status',
    text: options.message ?? 'Enter your code to leave.',
  });

  const open = el('button', { type: 'button', class: 'btn primary wide', text: 'Continue' });

  const attempt = async (): Promise<void> => {
    const passed = await options.verify(input.value);
    input.value = '';
    if (passed) {
      options.onOpen();
      return;
    }
    message.textContent = 'That code did not match. Try again.';
    options.onWrong?.();
  };

  open.addEventListener('click', () => void attempt());
  input.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Enter') void attempt();
  });

  return el('div', { class: 'card parent-gate child-surface' }, [message, input, open]);
}
