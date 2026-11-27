import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMAIL, SCENARIOS, type ScenarioId } from '../../src/bench/example';
import { setOption } from '../../src/domains/options';
import {
  controls,
  mount,
  nameOf,
  outlastUndo,
  press,
  pressTab,
  said,
  settle,
  type,
  unmount,
  type Mounted,
} from './mount';

// What the prototype never says (design/lantern/SPEC.md section 13, "Anything
// that shames", and docs/03-scope.md "Tone"), across every screen built so far
// (Today, Focus, the rest of today, the places, Tasks and its four lists, a
// task's page in each of its forms and the sheets it raises, Routines and
// each routine's page, the Library and its pages, Me, Settings,
// About, the crisis page and capture), every scenario, and every six-second line and
// Undo: nothing overdue, late, missed or behind; no streak, no greeting and
// no cheering; no exclamation mark; never "0 min left" and never seconds; no
// count on a tab, and no count of what was not done; and no figure for time
// away. Each tap's announcement is heard before the screen is read.

afterEach(unmount);

/**
 * Everything a person can see or hear: the text, the live region's words,
 * every label, every value a meter or a slider speaks, and every placeholder.
 */
function everything(m: Mounted): string {
  const parts = [m.container.textContent ?? ''];
  for (const name of ['aria-label', 'aria-valuetext', 'placeholder']) {
    for (const node of m.container.querySelectorAll(`[${name}]`)) {
      parts.push(node.getAttribute(name) ?? '');
    }
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
  [/\bforg[eo]t/i, 'blame'],
  [/!/, 'an exclamation mark'],
  [/\b0 min left|\b0 minutes left/i, '"0 min left"'],
  [/\b\d+\s?(?:s|sec|secs|seconds?)\b|\d:\d\d:\d\d/i, 'seconds'],
  [/\bago\b|while you were away|since you|you were away/i, 'time away'],
  [/\b\d+\s*(?:days?|weeks?)\b/i, 'a count of days or weeks'],
  [/\blast (?:opened|used|seen|ran)\b/i, 'time away'],
  [
    /\b(?:away|gone|back after)\s+(?:for\s+)?\d|\bpaused\s+(?:for\s+)?\d+\s*(?:h\b|hours?)/i,
    'time away',
  ],
  [
    /\b\d+\s+(?:\w+\s+)?(?:more|left to do|to go|not done|undone|still to do)\b/i,
    'a count of what was not done',
  ],
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
      const lit = controls(m.container).find((node) => node.id === 'b-lit');
      if (lit) {
        lit.click();
        holdsNothing(m, 'Focus');
        press(m.container, 'Back to Today');
      }
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
    // Each tap's announcement is heard before the screen is read.
    press(m.container, 'Pause');
    said(m);
    holdsNothing(m, 'Today, paused');
    press(m.container, /^Set aside /);
    said(m);
    holdsNothing(m, 'Today, set aside, its Undo showing');
    outlastUndo();
    holdsNothing(m, 'Today, set aside');
    press(m.container, /^Mark done: /);
    said(m);
    holdsNothing(m, 'Today, a ring ticked');
    press(m.container, 'Start');
    said(m);
    holdsNothing(m, 'Today, started');
    press(m.container, /^Step done: /);
    said(m);
    holdsNothing(m, 'Today, a step done');
  });

  it('says none of it in Focus, after its taps, its six seconds and its Undo', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, /^Now: /);
    settle(m);
    press(m.container, 'Add 5 minutes');
    said(m);
    holdsNothing(m, 'Focus, five minutes added');
    press(m.container, /^Step done: /);
    said(m);
    holdsNothing(m, 'Focus, a step done, its Undo on the foot');
    press(m.container, /^Undo step done: /);
    said(m);
    holdsNothing(m, 'Focus, after Undo');
    press(m.container, 'Pause');
    said(m);
    holdsNothing(m, 'Focus, paused');
    m.clock.now = new Date('2026-11-24T13:20:00');
    vi.advanceTimersByTime(60_000);
    holdsNothing(m, 'Focus, paused, hours later');
    press(m.container, 'Resume');
    holdsNothing(m, 'Focus, resumed, its Undo on the foot');
    press(m.container, 'Pause');
    press(m.container, /^Set aside /);
    holdsNothing(m, 'Today, after Set aside in Focus');
  });

  it('says none of it in any six seconds after a tap, or after Undo', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example', (state) => ({
      ...state,
      rewards: setOption(state.rewards, { kind: 'day' }, 'doneList', true),
    }));
    const undo = (where: string) => {
      said(m);
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

  it('says none of it in capture, its six seconds, its Undo and its kept draft', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, 'Capture');
    holdsNothing(m, 'capture over Today');
    type(m, 'Ask Ana about Friday');
    press(m.container, 'Today');
    holdsNothing(m, 'capture, Today chosen');
    press(m.container, 'Save');
    said(m);
    holdsNothing(m, 'the Next line after Save');
    press(m.container, /^Undo: remove /);
    said(m);
    holdsNothing(m, 'capture opened again by Undo');
    press(m.container, 'Close');
    holdsNothing(m, 'Today with a draft kept');
    press(m.container, /^Now: /);
    settle(m);
    press(m.container, 'Capture, draft kept');
    holdsNothing(m, 'capture over Focus');
    press(m.container, 'Save');
    said(m);
    holdsNothing(m, 'Focus’s foot after Save');
    press(m.container, 'Back to Today');
    press(m.container, 'Tasks');
    press(m.container, 'Capture');
    holdsNothing(m, 'capture over a place, the capsule riding');
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

  for (const { at, scenario } of SCENES) {
    it(`says none of it in "${scenario}", in Tasks and on every task's page`, async () => {
      const m = await mount(at, scenario);
      press(m.container, 'Tasks');
      for (const list of ['Inbox', 'Today', 'Coming up', 'Done']) {
        pressTab(m.container, list);
        holdsNothing(m, `Tasks › ${list}`);
        const rows = controls(m.container).filter(
          (node) => node.classList.contains('rowbtn') && node.closest('.screen'),
        );
        for (const index of [0, rows.length - 1]) {
          const row = controls(m.container).filter(
            (node) => node.classList.contains('rowbtn') && node.closest('.screen'),
          )[index];
          if (!row) continue;
          const name = nameOf(row);
          row.click();
          holdsNothing(m, `the page of ${name}`);
          press(m.container, 'Back to Tasks');
        }
      }
    });
  }

  for (const { at, scenario } of SCENES) {
    it(`says none of it in "${scenario}", on every routine's page, New routine and the Library's pages`, async () => {
      const m = await mount(at, scenario);
      for (const [tab, opens] of [
        ['Routines', 'Back to Routines'],
        ['Library', 'Back to Library'],
      ] as const) {
        press(m.container, tab);
        holdsNothing(m, tab);
        const names = controls(m.container)
          .filter((node) => node.closest('.screen') && node.closest('[data-list]'))
          .map(nameOf);
        if (tab === 'Routines') names.push('New routine');
        for (const name of names) {
          press(m.container, name);
          holdsNothing(m, `the page of ${name}`);
          press(m.container, opens);
        }
      }
      // A day later "Ran today" has gone, and nothing says when it last ran.
      m.clock.now = new Date(new Date(at).getTime() + 24 * 60 * 60_000);
      vi.advanceTimersByTime(60_000);
      press(m.container, 'Routines');
      holdsNothing(m, 'Routines, the next day');
    });
  }

  it('says none of it on a task’s page, after Start this instead, its six seconds and its Undo', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, /^Next/);
    press(m.container, /^10:30, Call the dentist/);
    holdsNothing(m, 'a task opened while another runs');
    press(m.container, 'Start this instead');
    said(m);
    holdsNothing(m, 'the page lit, its Undo showing');
    press(m.container, /^Undo: go back to /);
    said(m);
    holdsNothing(m, 'the page after Undo');
    m.clock.now = new Date('2026-11-24T10:40:00');
    vi.advanceTimersByTime(60_000);
    holdsNothing(m, 'the page once its slot has begun');
  });

  it('says none of it in the sheets a page raises', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, 'Tasks');
    press(m.container, 'Cancel the gym trial, 2 steps');
    press(m.container, /^When: /);
    holdsNothing(m, 'the when sheet');
    press(m.container, 'Today at a time');
    press(m.container, 'Add 5 minutes');
    said(m);
    holdsNothing(m, 'the when sheet, a time chosen');
    press(m.container, 'Done');
    press(m.container, 'More');
    holdsNothing(m, 'the ⋯ sheet');
    press(m.container, 'Add a note');
    holdsNothing(m, 'the note sheet');
    press(m.container, 'Close');
    press(m.container, 'More');
    press(m.container, 'Rename');
    holdsNothing(m, 'the rename sheet');
    press(m.container, 'Close');
    press(m.container, 'More');
    press(m.container, 'Delete');
    holdsNothing(m, 'the confirm before Delete');
    press(m.container, 'Delete');
    holdsNothing(m, 'Tasks, after Delete');
  });

  it('says none of it on the running task’s page, paused, and done', async () => {
    const m = await mount('2026-11-24T10:05:00', 'example');
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    press(m.container, 'Now: Write the school email');
    holdsNothing(m, 'the running task’s own page');
    m.clock.now = new Date('2026-11-24T10:40:00');
    vi.advanceTimersByTime(60_000);
    holdsNothing(m, 'the running task’s own page, its estimate used up');
    press(m.container, 'Focus');
    press(m.container, 'Pause');
    press(m.container, 'Back to Tasks');
    holdsNothing(m, 'the paused task’s own page');
    press(m.container, 'Back to Tasks');
    press(m.container, 'Mark done: Write the school email');
    pressTab(m.container, 'Done');
    press(m.container, `${EMAIL}, done`);
    expect(m.container.querySelector('.doneline')).not.toBeNull();
    holdsNothing(m, 'a done task’s page');
  });
});
