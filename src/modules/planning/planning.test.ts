import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { tools } from './tools';
import { threeDays, thirtyDays } from './fixtures/index';
import { MIN_TIMED, nextStep, ordered, planFor, reality } from './state';
import { measure, TODAY_COST_BUDGET, type ToolContext } from '../../kernel/index';

smokeTest(manifest);

/** A tool mounted over an in-memory slice, as the Tools tab mounts one. */
function mount(index: number, initial: unknown = { version: 1 }) {
  let slice = initial;
  const host = document.createElement('div');
  tools[index]!.mount(host, {
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

const PLAN = 0;
const BREAK = 1;
const ESTIMATE = 2;
const INTENTION = 3;

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
  it('marks the two tools the rubric names as plausible rather than established', () => {
    // docs/02-evidence-rubric.md lists task-breaking templates and
    // implementation-intention prompts among its Tier C examples. ADR-025.
    const tiered = tools.filter((tool) => tool.tier !== undefined);
    expect(tiered.map((tool) => tool.title)).toEqual([
      'Break something down',
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
