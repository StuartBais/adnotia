import { afterEach, describe, expect, it } from 'vitest';
import { SCENARIOS, type ScenarioId } from '../../src/bench/example';
import { mount, outlastUndo, press, unmount, type Mounted } from './mount';

// What the prototype never says (design/lantern/SPEC.md section 13, "Anything
// that shames", and docs/03-scope.md "Tone"), across every screen built so far
// and every scenario: nothing overdue, late, missed or behind; no streak, no
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
    it(`says none of it in "${scenario}", on Today, the places and Me`, async () => {
      const m = await mount(at, scenario);
      holdsNothing(m, 'Today');
      for (const tab of ['Tasks', 'Routines', 'Library']) {
        press(m.container, tab);
        holdsNothing(m, tab);
      }
      press(m.container, 'Me');
      holdsNothing(m, 'Me');
      press(m.container, 'If things are bad right now');
      holdsNothing(m, 'the crisis page');
      press(m.container, 'Back to Me');
      press(m.container, 'About this prototype');
      holdsNothing(m, 'About');
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

  it('says none of it after weeks away with a clock left running', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date('2026-12-14T09:12:00');
    window.dispatchEvent(new Event('pageshow'));
    holdsNothing(m, 'Today, after weeks');
  });
});
