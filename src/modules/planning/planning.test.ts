import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { tools } from './tools';
import { threeDays, thirtyDays } from './fixtures/index';
import { MIN_TIMED, focusTargets, nextStep, ordered, planFor, reality } from './state';
import { measure, TODAY_COST_BUDGET, type ToolContext } from '../../kernel/index';

smokeTest(manifest);

/**
 * A tool mounted over an in-memory slice, as the Tools tab mounts one.
 *
 * By title, not by position. These were indexes, and adding a fifth tool in the
 * middle of the list silently pointed four tests at the wrong tool — they failed
 * loudly here, but only because the tools look nothing like each other.
 */
function mount(title: string, initial: unknown = { version: 1 }) {
  let slice = initial;
  const host = document.createElement('div');
  const tool = tools.find((other) => other.title === title);
  if (tool === undefined) throw new Error(`No tool called "${title}".`);
  tool.mount(host, {
    get slice() {
      return slice;
    },
    reads: {},
    save: (next) => {
      slice = next;
    },
    today: '2026-09-20',
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
  const button = [...host.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === text,
  );
  if (button === undefined) throw new Error(`no button "${text}"`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const PLAN = 'A plan for today';
const BREAK = 'Break something down';
const ESTIMATE = 'How long will this take?';
const INTENTION = 'If this, then that';
const FOCUS = 'Focus for a while';

describe('planning: the daily footprint', () => {
  it('asks one optional question, under ten seconds', () => {
    // docs/08-roadmap.md sets both of these as the milestone's bar.
    const fields = manifest.contributes.today ?? [];
    expect(fields).toHaveLength(1);
    expect(fields[0]?.optional).toBe(true);
    expect(measure([manifest]).total).toBeLessThan(10);
    expect(measure([manifest]).total).toBeLessThanOrEqual(TODAY_COST_BUDGET);
  });

  it('offers the day’s outcome as words, with no option that reads as a failure', () => {
    const options = manifest.contributes.today?.[0]?.options ?? [];
    expect(options.map((option) => option.l)).toEqual([
      'Followed it',
      'Some of it',
      'The day went another way',
    ]);
    expect(JSON.stringify(options)).not.toMatch(/fail|didn|missed|no\b/i);
  });
});

describe('planning: a plan for today', () => {
  it('takes a line and keeps it against today', () => {
    const { host, read } = mount(PLAN);
    type(host, 'What is happening?', 'Ring the surgery');
    press(host, 'Add to the plan');
    expect(planFor(read() as never, '2026-09-20').map((item) => item.text)).toEqual([
      'Ring the surgery',
    ]);
  });

  it('will not add an empty line', () => {
    const { host, read } = mount(PLAN);
    press(host, 'Add to the plan');
    expect(planFor(read() as never, '2026-09-20')).toEqual([]);
    expect(host.textContent).toContain('Write the line first');
  });

  it('puts timed items in time order and the rest after them', () => {
    const items = [
      { id: 'a', text: 'no time' },
      { id: 'b', text: 'later', at: '14:00' },
      { id: 'c', text: 'earlier', at: '09:00' },
    ];
    expect(ordered(items).map((item) => item.text)).toEqual(['earlier', 'later', 'no time']);
  });

  it('shows no progress of any kind', () => {
    // A plan with a bar on it is a plan you can be behind on.
    const { host } = mount(PLAN, threeDays);
    expect(host.querySelector('progress')).toBeNull();
    expect(host.textContent).not.toMatch(/\b\d+ of \d+\b|\d+%|complete|done \d/i);
  });
});

describe('planning: breaking something down', () => {
  it('marks the first unfinished step and nothing else', () => {
    const task = threeDays.tasks![0]!;
    expect(nextStep(task)?.text).toBe('Log in and see what it asks for');

    const { host } = mount(BREAK, threeDays);
    expect([...host.querySelectorAll('.tag')].map((tag) => tag.textContent)).toEqual([
      'Start here',
    ]);
  });

  it('needs a name before it will start one', () => {
    const { host, read } = mount(BREAK);
    press(host, 'Start it');
    expect(read()['tasks']).toBeUndefined();
    expect(host.textContent).toContain('Give it a name first');
  });

  it('keeps the step being typed when the task is started', () => {
    // Losing the step someone just typed because they did not press Add first
    // is the kind of small betrayal this app cannot afford.
    const { host, read } = mount(BREAK);
    type(host, 'What is the thing?', 'Do the tax return');
    type(host, 'Next step', 'Find the drawer');
    press(host, 'Start it');
    const tasks = read()['tasks'] as { steps: { text: string }[] }[];
    expect(tasks[0]?.steps.map((step) => step.text)).toEqual(['Find the drawer']);
  });

  it('says when there is nothing left rather than celebrating', () => {
    const finished = {
      version: 1,
      tasks: [
        {
          id: 't',
          title: 'A thing',
          created: '2026-09-20',
          steps: [{ id: 's', text: 'x', done: true }],
        },
      ],
    };
    const { host } = mount(BREAK, finished);
    expect(host.textContent).toContain('All the steps are done.');
    expect(host.textContent).not.toMatch(/well done|nice|great|congrat|🎉/i);
  });
});

describe('planning: how long will this take', () => {
  it('says nothing about a pattern until there is one', () => {
    expect(reality([])).toBeUndefined();
    expect(reality(threeDays.estimates!)).toBeUndefined();
    const { host } = mount(ESTIMATE, threeDays);
    expect(host.textContent).toMatch(/Time \d+ more/);
  });

  it('reports what their own estimates did, with the numbers behind it', () => {
    const check = reality(thirtyDays.estimates!)!;
    expect(check.timed).toBe(8);
    expect(check.ratio).toBe(1.6);
    // Checkable: the ratio is the totals divided, not an opinion.
    expect(Math.round((check.actual / check.estimated) * 10) / 10).toBe(check.ratio);
  });

  it('says the multiplier is theirs and private, and never that they are bad at this', () => {
    const { host } = mount(ESTIMATE, thirtyDays);
    const text = host.textContent ?? '';
    expect(text).toContain('1.6 times your estimate');
    expect(text).toContain('nobody else sees it');
    expect(text).not.toMatch(/\b(you always|you tend to|bad at|underestimate|optimis)/i);
  });

  it('needs a name and a number', () => {
    const { host, read } = mount(ESTIMATE);
    type(host, 'What are you about to do?', 'Reply to the email');
    press(host, 'Note it down');
    expect(read()['estimates']).toBeUndefined();
    expect(host.textContent).toContain('A name and a number');
  });

  it('needs three before it will compare', () => {
    expect(MIN_TIMED).toBe(3);
    const two = thirtyDays.estimates!.slice(0, 2);
    expect(reality(two)).toBeUndefined();
    expect(reality(thirtyDays.estimates!.slice(0, 3))).toBeDefined();
  });
});

describe('planning: if this, then that', () => {
  it('keeps both halves', () => {
    const { host, read } = mount(INTENTION);
    type(host, 'If', 'I put the kettle on');
    type(host, 'then', 'I take the tablet out');
    press(host, 'Keep this one');
    expect((read()['intentions'] as { cue: string }[])[0]?.cue).toBe('I put the kettle on');
  });

  it('will not keep half of one', () => {
    const { host, read } = mount(INTENTION);
    type(host, 'If', 'I put the kettle on');
    press(host, 'Keep this one');
    expect(read()['intentions']).toBeUndefined();
    expect(host.textContent).toContain('Both halves');
  });
});

describe('planning: what it claims', () => {
  it('marks the three tools the rubric names as plausible rather than established', () => {
    // docs/02-evidence-rubric.md lists task-breaking templates,
    // implementation-intention prompts and focus timers among its Tier C
    // examples. ADR-025, and ADR-038 for the timer.
    const tiered = tools.filter((tool) => tool.tier !== undefined);
    expect(tiered.map((tool) => tool.title)).toEqual([
      'Break something down',
      'Focus for a while',
      'If this, then that',
    ]);
    expect(tiered.every((tool) => tool.tier === 'C')).toBe(true);
  });

  it('never claims more for a tool than for the module', () => {
    for (const tool of tools) {
      if (tool.tier === undefined) continue;
      expect(tool.tier).not.toBe('A');
    }
  });

  it('says in the Library that the trials tested a course of therapy, not an app', () => {
    const entry = manifest.contributes.library;
    expect(entry.whatTheEvidenceSays).toContain('They did not test four screens in an app');
    expect(entry.whatItWontDo).toContain('using it is not the same as doing one');
  });

  it('keeps no score of any kind', () => {
    const prose = JSON.stringify(manifest.contributes.library);
    expect(prose).toContain('no score to lose');
    expect(prose).not.toMatch(/\b(streak|points|badge|progress bar)\b/i);
  });
});

describe('planning: focus for a while', () => {
  /*
   * The cycle, and the reason it needed an ADR before it was written.
   *
   * A longer break after every fourth stretch cannot work without knowing which
   * stretch it is on, and a count of finished stretches is points — which
   * docs/03-scope.md excludes outright and CLAUDE.md makes a hard rule. ADR-038
   * allows it on three conditions, and these are the tests for each of them:
   * the number never leaves the sitting, it cannot grow, and nothing phrases it
   * as attainment.
   */

  /** The face of whichever timer is on screen, as "25:00". */
  const face = (host: HTMLElement): string => host.querySelector('.timer-face')?.textContent ?? '';

  /** Run the clock forward, the way the timer's own setInterval would. */
  const advance = (minutes: number): void => {
    vi.advanceTimersByTime(minutes * 60 * 1000);
  };

  /**
   * Let one stretch and the break after it run out.
   *
   * Only the first press: after that the cycle advances by itself, so pressing
   * Start again looks for a button that is not there because the timer on
   * screen is running and says Pause.
   */
  const sitting = (host: HTMLElement, stretches: number): void => {
    press(host, 'Start');
    advance(25);
    for (let more = 1; more < stretches; more += 1) {
      advance(5);
      advance(25);
    }
  };

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-20T09:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the minutes that happened, against the thing they were on', () => {
    const { host, read } = mount(FOCUS, threeDays);
    press(host, 'Log in and see what it asks for');
    sitting(host, 1);

    const sessions = (read()['days'] as Record<string, { focus?: unknown[] }>)['2026-09-20']
      ?.focus as { minutes: number; label: string; taskId?: string; stepId?: string }[];
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.minutes).toBe(25);
    // The label as well as the ids: a task deleted later still leaves a line.
    expect(sessions[0]?.label).toBe('Log in and see what it asks for');
    expect(sessions[0]?.taskId).toBe('t1');
    expect(sessions[0]?.stepId).toBe('s2');
  });

  it('runs on into the break by itself', () => {
    const { host } = mount(FOCUS, threeDays);
    sitting(host, 1);
    // A cycle that needs pressing is not a cycle. Five minutes, not twenty-five.
    expect(face(host)).toBe('5:00');
    expect(host.textContent).toContain('On a break');
  });

  it('makes the fourth break the long one', () => {
    const { host } = mount(FOCUS, threeDays);
    sitting(host, 4);
    expect(face(host)).toBe('15:00');
  });

  it('forgets where it was in the cycle when the page goes', () => {
    // The load-bearing test. If the position were ever written to the slice, a
    // fresh mount over that same slice would carry on counting and the next
    // break would be the long one. It is a variable in a closure, so it is not.
    let slice: unknown = threeDays;
    const carry = () => {
      const host = document.createElement('div');
      tools
        .find((tool) => tool.title === FOCUS)!
        .mount(host, {
          get slice() {
            return slice;
          },
          reads: {},
          save: (next: unknown) => {
            slice = next;
          },
          today: '2026-09-20',
          refresh: () => {},
        } as ToolContext);
      return host;
    };

    const first = carry();
    sitting(first, 3);

    // Same slice, new page. The fourth stretch of the day is the first of a
    // sitting, so the break after it is short.
    const second = carry();
    sitting(second, 1);
    expect(face(second)).toBe('5:00');
  });

  it('writes no count of anything into the record', () => {
    const { host, read } = mount(FOCUS, threeDays);
    sitting(host, 4);

    // Exact keys rather than a search for suspicious words: the slice legitimately
    // contains `done` on a step, and a test that cannot tell those apart is a test
    // that gets deleted the first time it cries wolf.
    const day = (read()['days'] as Record<string, Record<string, unknown>>)['2026-09-20'];
    expect(Object.keys(day ?? {})).toEqual(['focus']);
    for (const session of (day?.['focus'] ?? []) as Record<string, unknown>[]) {
      expect(Object.keys(session).sort()).toEqual(['id', 'label', 'minutes']);
    }
  });

  it('says what comes next, never what has been earned', () => {
    const { host } = mount(FOCUS, threeDays);
    press(host, 'Start');
    expect(host.textContent).toContain('A short break after this one');
    // No fractions, no tallies, nothing of the form "3 of 4".
    expect(host.textContent).not.toMatch(/\b\d+\s*(?:of|\/)\s*\d+\b/);
  });

  it('keeps the minutes somebody actually sat for when they stop early', () => {
    const { host, read } = mount(FOCUS, threeDays);
    press(host, 'Start');
    advance(7);
    press(host, 'Stop');

    const sessions = (read()['days'] as Record<string, { focus?: { minutes: number }[] }>)[
      '2026-09-20'
    ]?.focus;
    // Not 25, and not nothing. A tool that only records finished stretches has
    // made finishing the thing that counts.
    expect(sessions?.[0]?.minutes).toBe(7);
  });

  it('keeps nothing at all for under a minute, and says nothing about it', () => {
    const { host, read } = mount(FOCUS, threeDays);
    press(host, 'Start');
    advance(0.5);
    press(host, 'Stop');
    // The fixture already has other days; the one being worked on gains nothing.
    expect((read()['days'] as Record<string, unknown>)['2026-09-20']).toBeUndefined();
    // And nothing is said about it. Half a minute is not a failure, and the
    // status line is where a remark about it would appear.
    expect(host.querySelector('.bmsg')?.textContent).toBe('');
  });

  it('starts at the lengths it was left set to', () => {
    const { host } = mount(FOCUS, {
      ...threeDays,
      focusLengths: { focus: 40, rest: 8, long: 20, every: 3 },
    });
    press(host, 'Start');
    expect(face(host)).toBe('40:00');
  });

  it('keeps a changed length, because a length is a setting and not a score', () => {
    const { host, read } = mount(FOCUS, threeDays);
    const field = [...host.querySelectorAll('.field')].find((node) =>
      (node.textContent ?? '').includes('Focus for (minutes)'),
    );
    const input = field?.querySelector('input') as HTMLInputElement;
    input.value = '40';
    // On change, not on input: committing halfway through typing "40" would
    // have saved a four-minute stretch.
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(read()['focusLengths']).toEqual({ focus: 40, rest: 5, long: 15, every: 4 });
  });

  it('refuses a length that would make the cycle run away', () => {
    // A zero-minute stretch is a timer that finishes instantly and starts the
    // next one, for ever. A slice can arrive from a backup somebody edited.
    const { host } = mount(FOCUS, {
      ...threeDays,
      focusLengths: { focus: 0, rest: -5, long: 9999, every: 0 },
    });
    press(host, 'Start');
    expect(face(host)).toBe('1:00');
  });

  it('uses the lengths it was left set to for the long break as well', () => {
    const { host } = mount(FOCUS, {
      ...threeDays,
      focusLengths: { focus: 25, rest: 5, long: 20, every: 2 },
    });
    // Every two, so the second break is the long one.
    press(host, 'Start');
    advance(25);
    advance(5);
    advance(25);
    expect(face(host)).toBe('20:00');
  });

  it('states that the lengths are a convention rather than a finding', () => {
    const { host } = mount(FOCUS, threeDays);
    expect(host.textContent).toContain('convention rather than a finding');
    // Visible, not folded into the disclosure it introduces.
    expect(host.querySelector('details')?.textContent).not.toContain('convention');
  });

  it('says plainly that it cannot interrupt anybody', () => {
    // There is no sound and no notification in this build, so a timer nobody is
    // looking at tells them nothing. Better said than discovered.
    const { host } = mount(FOCUS, threeDays);
    expect(host.textContent).toContain('no sound and no notification');
  });
});

describe('planning: one thing linked to another', () => {
  it('turns a step that is bigger than a step into its own task', () => {
    const { host, read } = mount(BREAK, threeDays);
    press(host, 'Bigger than a step');

    const tasks = read()['tasks'] as {
      id: string;
      title: string;
      parent?: string;
      steps: { taskId?: string }[];
    }[];
    expect(tasks).toHaveLength(2);
    // Directly after its parent, and pointing back at it.
    expect(tasks[1]?.title).toBe('Log in and see what it asks for');
    expect(tasks[1]?.parent).toBe('t1');
    // The step stays where it was: promoting is not deleting somebody's line.
    expect(tasks[0]?.steps).toHaveLength(3);
    expect(tasks[0]?.steps[1]?.taskId).toBe(tasks[1]?.id);
  });

  it('offers a step only once', () => {
    const { host } = mount(BREAK, threeDays);
    press(host, 'Bigger than a step');
    expect(host.textContent).toContain('Broken down separately');
  });

  it('lets a plan point at something already broken down', () => {
    const { host, read } = mount(PLAN, threeDays);
    press(host, 'Log in and see what it asks for');
    press(host, 'Add to the plan');

    const items = (read()['plans'] as Record<string, { items: Record<string, unknown>[] }>)[
      '2026-09-20'
    ]?.items;
    expect(items?.[0]?.['taskId']).toBe('t1');
    expect(items?.[0]?.['stepId']).toBe('s2');
    // The text as well, so a deleted task leaves a readable line behind.
    expect(items?.[0]?.['text']).toBe('Log in and see what it asks for');
  });

  it('drops the link when somebody types over it, and keeps their words', () => {
    const { host, read } = mount(PLAN, threeDays);
    press(host, 'Log in and see what it asks for');
    type(host, 'What is happening?', 'Actually ring them instead');
    press(host, 'Add to the plan');

    const items = (read()['plans'] as Record<string, { items: Record<string, unknown>[] }>)[
      '2026-09-20'
    ]?.items;
    expect(items?.[0]?.['text']).toBe('Actually ring them instead');
    expect(items?.[0]?.['taskId']).toBeUndefined();
  });

  it('attaches an estimate to the task it is for', () => {
    const { host, read } = mount(ESTIMATE, threeDays);
    press(host, 'Do the tax return');
    type(host, 'How many minutes', '90');
    press(host, 'Note it down');

    const estimates = read()['estimates'] as Record<string, unknown>[];
    expect(estimates[0]?.['taskId']).toBe('t1');
    expect(estimates[0]?.['title']).toBe('Do the tax return');
  });

  it('offers a promoted step once, as the task it became', () => {
    // It is both a step of its parent and a task in its own right, and the
    // picker was listing it as both: two chips with the same words pointing at
    // different things. Only a screenshot showed it, so this is the test.
    const targets = focusTargets(thirtyDays).map((target) => target.label);
    expect(targets.filter((label) => label === 'Deal with the paperwork')).toHaveLength(1);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('offers nothing to link to when nothing is broken down', () => {
    // The tools have to work with an empty slice: they did before linking, and
    // a picker of nothing is a control that does nothing.
    const { host } = mount(PLAN);
    expect(host.textContent).not.toContain('one of the things you have broken down');
  });
});
