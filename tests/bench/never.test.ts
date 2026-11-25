import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCENARIOS, type ScenarioId } from '../../src/bench/example';
import { setOption } from '../../src/domains/options';
import {
  controls,
  mount,
  nameOf,
  outlastUndo,
  press,
  said,
  settle,
  unmount,
  type Mounted,
} from './mount';

// What the prototype never says (design/lantern/SPEC.md section 13, "Anything
// that shames", and docs/03-scope.md "Tone"), across every screen built so far
// (Today, the rest of today, the places, Me, Settings, About and the crisis
// page), every scenario, and every six-second line and Undo: nothing overdue, late, missed or behind; no streak, no
// greeting and no cheering; no exclamation mark; never "0 min left" and never
// seconds; no count on a tab; and no figure for time away.

afterEach(unmount);

/** Everything a person can see or hear: the text, every label and every hint. */
function everything(m: Mounted): string {
  const parts = [m.container.textContent ?? ''];
  for (const node of m.container.querySelectorAll('[aria-label]')) {
    parts.push(node.getAttribute('aria-label') ?? '');
  }
  return parts.join(' | ').replace(/\s+/g, ' ');
}

const NEVER: readonly [RegExp, string][] = [
  [/overdue/i, 'overdue'],
  [/\blate\b/i, 'late'],
  [/\bmissed\b|\byou missed\b/i, 'missed'],
  [/\bbehind\b/i, 'behind'],
  [/streak/i, 'a streak'],
  [/welcome back/i, 'a greeting'],
  [/great job|well done|nice work/i, 'cheering'],
  [/you forgot/i, 'blame'],
  [/!/, 'an exclamation mark'],
  [/\b0 min left|\b0 minutes left/i, '"0 min left"'],
  [/\b\d+\s?(?:s|sec|secs|seconds?)\b|\d:\d\d:\d\d/i, 'seconds'],
  [/\bago\b|while you were away|since you|you were away/i, 'time away'],
  [/\b\d+\s*(?:days?|weeks?)\b/i, 'a count of days or weeks'],
];

function holdsNothing(m: Mounted, where: string): void {
  const said = everything(m);
  // Something was read: a blank screen would pass every check below.
  expect(said.length, where).toBeGreaterThan(40);
  for (const [pattern, what] of NEVER) {
    expect(pattern.test(said), `${what} on ${where}: ${said.match(pattern)?.[0]}`).toBe(false);
  }
  for (const tab of m.container.querySelectorAll('nav button')) {
    expect(tab.textContent, `a count on the ${tab.textContent} tab`).not.toMatch(/\d/);
  }
}

/** The scenes the board draws, each at its own moment. */
const SCENES: readonly { at: string; scenario: ScenarioId }[] = [
  { at: '2026-11-24T10:05:00', scenario: 'example' },
  { at: '2026-11-24T09:58:00', scenario: 'notStarted' },
  { at: '2026-11-24T13:20:00', scenario: 'pauseLeft' },
  { at: '2026-11-24T10:05:00', scenario: 'clockLeftRunning' },
  { at: '2026-12-14T09:12:00', scenario: 'weeksAway' },
  { at: '2026-11-24T10:05:00', scenario: 'empty' },
];

describe('never', () => {
  it('covers every scenario button', () => {
    expect(new Set(SCENES.map((scene) => scene.scenario))).toEqual(
      new Set(SCENARIOS.map((scenario) => scenario.id)),
    );
  });

  for (const { at, scenario } of SCENES) {
    it(`says none of it in "${scenario}", on Today, the rest of today, the places and Me`, async () => {
      const m = await mount(at, scenario);
      holdsNothing(m, 'Today');
      const handle = controls(m.container).find((node) => node.id === 'b-handle');
      if (handle) {
        handle.click();
        holdsNothing(m, 'the rest of today');
        press(m.container, 'Hide the rest of today');
      }
      for (const tab of ['Tasks', 'Routines', 'Library']) {
        press(m.container, tab);
        holdsNothing(m, tab);
      }
      press(m.container, 'Me');
      holdsNothing(m, 'Me');
      press(m.container, 'If things are bad right now');
      holdsNothing(m, 'the crisis page');
      press(m.container, 'Back to Me');
      press(m.container, 'Settings');
      holdsNothing(m, 'Settings');
      press(m.container, 'White');
      press(m.container, 'Timer stopped');
      press(m.container, 'Reduced');
      press(m.container, 'On');
      holdsNothing(m, 'Settings, every switch turned');
      press(m.container, 'Back to Me');
      press(m.container, 'About this prototype');
      holdsNothing(m, 'About');
      press(m.container, 'Today');
      holdsNothing(m, 'Today, on white places with Done today on');
    });
  }

  it('says none of it after the taps that change Today', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, 'Pause');
    holdsNothing(m, 'Today, paused');
    press(m.container, /^Set aside /);
    holdsNothing(m, 'Today, set aside, its Undo showing');
    outlastUndo();
    holdsNothing(m, 'Today, set aside');
    press(m.container, /^Mark done: /);
    holdsNothing(m, 'Today, a ring ticked');
    press(m.container, 'Start');
    holdsNothing(m, 'Today, started');
    press(m.container, /^Step done: /);
    holdsNothing(m, 'Today, a step done');
  });

  it('says none of it in any six seconds after a tap, or after Undo', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example', (state) => ({
      ...state,
      rewards: setOption(state.rewards, { kind: 'day' }, 'doneList', true),
    }));
    const undo = (where: string) => {
      const pill = controls(m.container).find((node) => node.id === 'b-undo');
      expect(pill, `an Undo after ${where}`).toBeDefined();
      holdsNothing(m, `the Next line after ${where}`);
      expect(nameOf(pill!)).toMatch(/^Undo/);
      pill!.click();
      said(m);
      holdsNothing(m, `Undo after ${where}`);
    };
    press(m.container, /^Step done: /);
    undo('Step done');
    press(m.container, /^Step done: /);
    press(m.container, /^Done: /);
    undo('Done');
    press(m.container, 'Pause');
    press(m.container, 'Resume');
    undo('Resume');
    press(m.container, /^Set aside /);
    undo('Set aside');
    press(m.container, /^Next|^Anytime/);
    press(m.container, /^Mark done: /);
    holdsNothing(m, 'the rest of today, a ring ticked');
    press(m.container, 'Hide the rest of today');
    undo('a tick');
    press(m.container, /^Set aside /);
    outlastUndo();
    press(m.container, 'Start');
    undo('Start');
  });

  it('says none of it after going back by Safari’s edge swipe', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, 'Me');
    press(m.container, /^Next/);
    history.back();
    vi.advanceTimersByTime(1);
    holdsNothing(m, 'Me, after the drawer folded by back');
    history.back();
    vi.advanceTimersByTime(1);
    settle(m);
    holdsNothing(m, 'Today, after back');
  });

  it('says none of it after weeks away with a clock left running', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date('2026-12-14T09:12:00');
    window.dispatchEvent(new Event('pageshow'));
    holdsNothing(m, 'Today, after weeks');
  });
});
