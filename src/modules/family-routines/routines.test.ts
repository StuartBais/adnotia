import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { tools } from './tools';
import { award, ordered, reachedGoal, startAgain, type Chart } from './state';
import { threeDays } from './fixtures/index';
import type { ToolContext } from '../../kernel/index';

smokeTest(manifest);

const ROUTINES = 0;
const FIRST_THEN = 1;
const CHART = 2;
const PRAISE = 3;

function mount(
  index: number,
  initial: unknown = { version: 1 },
  confirm = () => true,
  nickname?: string,
) {
  let slice = initial;
  const host = document.createElement('div');
  tools({ confirm })[index]!.mount(host, {
    get slice() {
      return slice;
    },
    reads: {},
    save: (next) => {
      slice = next;
    },
    today: '2026-09-20',
    ...(nickname === undefined ? {} : { nickname }),
    refresh: () => {},
  } as ToolContext);
  return { host, read: () => slice as Record<string, unknown> };
}

const type = (host: HTMLElement, label: string, value: string): void => {
  const wrapper = [...host.querySelectorAll('.field')].find((node) =>
    (node.textContent ?? '').includes(label),
  );
  const input = wrapper?.querySelector('input, textarea') as HTMLInputElement | null;
  if (input === null || input === undefined) throw new Error(`no field for ${label}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const press = (host: HTMLElement, text: string): void => {
  const button = [...host.querySelectorAll('button')].find((b) => b.textContent === text);
  if (button === undefined) throw new Error(`no button "${text}"`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('routines', () => {
  it('builds one, in the order it happens', () => {
    const { host, read } = mount(ROUTINES);
    type(host, 'What is this routine for?', 'Morning');
    type(host, 'Next step', 'Shoes on');
    press(host, 'Make this routine');
    const routines = read()['routines'] as { name: string; steps: { text: string }[] }[];
    expect(routines[0]?.name).toBe('Morning');
    expect(routines[0]?.steps.map((s) => s.text)).toEqual(['Shoes on']);
  });

  it('keeps the step still being typed, rather than losing it', () => {
    const { host, read } = mount(ROUTINES);
    type(host, 'What is this routine for?', 'Morning');
    type(host, 'Next step', 'Teeth');
    press(host, 'Add step');
    type(host, 'Next step', 'Shoes');
    press(host, 'Make this routine');
    const routines = read()['routines'] as { steps: { text: string }[] }[];
    expect(routines[0]?.steps.map((s) => s.text)).toEqual(['Teeth', 'Shoes']);
  });

  it('needs a name', () => {
    const { host, read } = mount(ROUTINES);
    press(host, 'Make this routine');
    expect(read()['routines']).toBeUndefined();
    expect(host.textContent).toContain('Give it a name first');
  });

  it('puts timed steps in time order and the rest after them', () => {
    expect(
      ordered([
        { id: 'a', text: 'no time' },
        { id: 'b', text: 'later', at: '08:10' },
        { id: 'c', text: 'earlier', at: '07:30' },
      ]).map((s) => s.text),
    ).toEqual(['earlier', 'later', 'no time']);
  });
});

describe('first and then', () => {
  it('needs both halves', () => {
    const { host, read } = mount(FIRST_THEN);
    type(host, 'First', 'Shoes');
    press(host, 'Set it');
    expect(read()['firstThen']).toBeUndefined();
    expect(host.textContent).toContain('Both halves');
  });

  it('sets and clears', () => {
    const { host, read } = mount(FIRST_THEN);
    type(host, 'First', 'Shoes');
    type(host, 'Then', 'Tablet');
    press(host, 'Set it');
    expect(read()['firstThen']).toEqual({ first: 'Shoes', then: 'Tablet' });
    press(host, 'Clear it');
    expect(read()['firstThen']).toBeUndefined();
  });
});

describe('the star chart', () => {
  it('only ever adds', () => {
    // docs/04-family-space.md: "Points are earned, never lost."
    const chart: Chart = { earns: 'x', points: 3 };
    expect(award(chart).points).toBe(4);
    expect(Object.keys({ award, startAgain })).not.toContain('take');
  });

  it('offers no control that removes a star', () => {
    const { host } = mount(CHART, threeDays);
    const labels = [...host.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toContain('Give a star');
    expect(labels.join(' ')).not.toMatch(/take|remove a star|minus|-1/i);
    expect(host.textContent).toContain('no button here that removes a star');
  });

  it('awards only when a parent presses something', () => {
    const { host, read } = mount(CHART, threeDays);
    expect((read()['chart'] as Chart).points).toBe(2);
    press(host, 'Give a star');
    expect((read()['chart'] as Chart).points).toBe(3);
  });

  it('will not start again without asking', () => {
    const { host, read } = mount(CHART, threeDays, () => false);
    press(host, 'Start again at zero');
    expect((read()['chart'] as Chart).points).toBe(2);
  });

  it('says what starting again is for, so it is not read as a punishment', () => {
    const messages: string[] = [];
    const { host } = mount(CHART, threeDays, ((m: string) => {
      messages.push(m);
      return false;
    }) as unknown as () => boolean);
    press(host, 'Start again at zero');
    expect(messages[0]).toContain('not a way of taking stars back');
  });

  it('starts again at zero when the parent says so', () => {
    const { host, read } = mount(CHART, threeDays);
    press(host, 'Start again at zero');
    expect((read()['chart'] as Chart).points).toBe(0);
    expect((read()['chart'] as Chart).earns).toBe('Getting dressed before breakfast');
  });

  it('notices the goal without doing anything about it', () => {
    expect(reachedGoal({ earns: 'x', points: 5, goal: 5 })).toBe(true);
    expect(reachedGoal({ earns: 'x', points: 4, goal: 5 })).toBe(false);
    expect(reachedGoal({ earns: 'x', points: 99 })).toBe(false);
  });

  it('never nags', () => {
    const { host } = mount(CHART, threeDays);
    // Checked on the controls rather than the prose: the sub promises the app
    // does not send a reminder, and a regex over the whole card catches the
    // promise rather than the thing it is promising about.
    const controls = [...host.querySelectorAll('button')].map((b) => b.textContent).join(' ');
    expect(controls).not.toMatch(/remind|keep it up|streak|every day/i);

    // And nothing here can fire later: no scheduling of any kind.
    expect(host.innerHTML).not.toMatch(/setTimeout|setInterval|Notification/);
  });

  it('promises not to nag, which is a different thing from not nagging', () => {
    const { host } = mount(CHART, threeDays);
    expect(host.textContent).toContain('sends a reminder, or takes one back');
  });
});

describe('naming the child', () => {
  it('titles the chart with the child’s name when there is one', () => {
    const { host } = mount(CHART, threeDays, () => true, 'Sam');
    expect(host.textContent).toContain("Sam's chart");
  });

  it('says "The chart" rather than "\'s chart" when there is no name', () => {
    // A possessive with nothing in front of it is what a missing value looks
    // like on a page, and the manifest builds these tools before it knows a child.
    const { host } = mount(CHART, threeDays);
    expect(host.textContent).toContain('The chart');
    expect(host.textContent).not.toContain("'s chart");
  });
});

describe('saying what you noticed', () => {
  it('is examples rather than a form', () => {
    const { host } = mount(PRAISE);
    expect(host.querySelectorAll('input, textarea')).toHaveLength(0);
    expect(host.textContent).toContain('You put your shoes on the first time I asked');
  });

  it('names the thing rather than the child', () => {
    const { host } = mount(PRAISE);
    expect(host.textContent).toContain('Name the thing, not the child');
  });
});

describe('what the module claims', () => {
  it('carries the document’s own careful paragraph', () => {
    const says = manifest.contributes.library.whatTheEvidenceSays;
    expect(says).toContain('largely disappears when only blinded ratings are counted');
    expect(says).toContain('not a treatment for the attention and impulsivity themselves');
    expect(says).toContain('ADHD is not caused by parenting');
  });

  it('asks a parent nothing daily', () => {
    expect(manifest.contributes.today).toBeUndefined();
  });
});
