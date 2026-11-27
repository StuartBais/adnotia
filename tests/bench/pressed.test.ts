import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { controls, mount, press, pressTab, unmount, type Mounted } from './mount';

// Nothing a person taps is still under the finger (PROTOTYPE-PLAN.md section
// 13, "CSS for the hand"): the tap highlight is off, so every control has a
// plain :active fill of its own, with no scaling and nothing moved, and the
// listener WebKit needs before it applies :active on a touch. jsdom draws
// nothing and presses nothing, so each control is matched against the
// stylesheet's :active rules with the state taken off.

const css = readFileSync(resolve(process.cwd(), 'src/bench/bench.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Every rule as selectors and body, splitting selector lists outside brackets. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => {
  const selectors: string[] = [''];
  let depth = 0;
  for (const char of (match[1] ?? '').trim()) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) selectors.push('');
    else selectors[selectors.length - 1] += char;
  }
  return { selectors: selectors.map((part) => part.trim().replace(/\s+/g, ' ')), body: match[2]! };
});

const pressed = rules.flatMap((rule) =>
  rule.selectors
    .filter((selector) => selector.includes(':active'))
    .map((selector) => ({ selector, body: rule.body })),
);

/** What a pressed rule matches at rest: the same selector with the press taken off. */
const atRest = pressed.map(({ selector }) => selector.replace(/:active(::before)?/g, ''));

afterEach(unmount);

function unpressed(m: Mounted): string[] {
  return controls(m.container)
    .filter((node) => node.tagName === 'BUTTON' && !node.closest('[inert], [hidden]'))
    .filter((node) => !atRest.some((selector) => node.matches(selector)))
    .map((node) => `${node.id || node.className} "${node.textContent?.trim().slice(0, 30)}"`);
}

const SCENES: [string, (m: Mounted) => void][] = [
  ['Today, running', () => undefined],
  ['Focus', (m) => press(m.container, /^Now: Write the question\. Step 2 of 3/)],
  ['the open drawer', (m) => press(m.container, /^Next, in 25 minutes/)],
  ['capture', (m) => press(m.container, 'Capture')],
  ['Tasks', (m) => press(m.container, 'Tasks')],
  [
    'a task’s page and its When sheet',
    (m) => {
      press(m.container, /^Next, in 25 minutes/);
      press(m.container, /^10:30, Call the dentist/);
      press(m.container, /^When/);
    },
  ],
  [
    'the running task’s page',
    (m) => {
      press(m.container, 'Tasks');
      pressTab(m.container, 'Today');
      press(m.container, 'Now: Write the school email');
    },
  ],
  [
    'Settings',
    (m) => {
      press(m.container, 'Me');
      press(m.container, 'Settings');
    },
  ],
  [
    'About',
    (m) => {
      press(m.container, 'Me');
      press(m.container, 'About this prototype');
    },
  ],
  [
    'a routine',
    (m) => {
      press(m.container, 'Routines');
      press(m.container, 'Leaving the house, 4 steps');
    },
  ],
  ['the Library', (m) => press(m.container, 'Library')],
];

describe('every control shows it is pressed (plan section 13)', () => {
  it.each(SCENES)(
    'has a pressed fill for each control on %s, on charcoal places',
    async (_, go) => {
      const m = await mount('2026-11-24T10:05:00');
      go(m);
      expect(unpressed(m)).toEqual([]);
    },
  );

  it.each(SCENES)('and on white places, on %s', async (_, go) => {
    const m = await mount('2026-11-24T10:05:00', 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    go(m);
    expect(unpressed(m)).toEqual([]);
  });

  it('has one on idle Today, its drawer at half, and on nothing planned', async () => {
    const idle = await mount('2026-11-24T09:58:00', 'notStarted');
    expect(unpressed(idle)).toEqual([]);
    unmount();
    const empty = await mount('2026-12-14T09:12:00', 'weeksAway');
    expect(unpressed(empty)).toEqual([]);
  });

  it('changes a fill only: nothing scales, moves or eases', () => {
    expect(pressed.length).toBeGreaterThan(15);
    for (const { selector, body } of pressed) {
      expect(body, selector).not.toMatch(
        /\b(transform|scale|translate|transition|animation|width|height|margin|padding|top|left|zoom)\s*:/,
      );
    }
  });

  it('listens for touches on the app, passively, so WebKit applies :active under a finger', async () => {
    const listen = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const m = await mount('2026-11-24T10:05:00');
    const touch = listen.mock.calls.findIndex(([type]) => type === 'touchstart');
    expect(touch).toBeGreaterThanOrEqual(0);
    expect(listen.mock.contexts[touch]).toBe(m.container);
    expect(listen.mock.calls[touch]![2]).toEqual({ passive: true });
    listen.mockRestore();
  });
});
