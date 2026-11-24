import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStore, memoryStorageAdapter, type KernelStore } from '../../src/kernel/store';
import { mountBench } from '../../src/bench/app';
import type { Task } from '../../src/domains/tasks';

// The benchmark prototype (docs/09-product-brief.md, order of work item 3).
// These hold the brief's rules it is built to test: one task record, capture
// in one tap that returns to the same place, nothing overdue, and the step
// before the clock.

let clock = new Date('2026-11-24T09:00:00');
let store: KernelStore;
let container: HTMLElement;
let bench: { destroy(): void };

const click = (name: string | RegExp) => {
  const button = [...container.querySelectorAll('button')].find((b) =>
    typeof name === 'string' ? b.textContent?.trim() === name : name.test(b.textContent ?? ''),
  );
  if (!button) throw new Error(`No button ${String(name)} on: ${container.textContent}`);
  button.click();
};

const type = (selector: string, text: string) => {
  const input = container.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`No input ${selector}`);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input;
};

const submit = (selector: string) =>
  container
    .querySelector<HTMLFormElement>(selector)!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

const text = () => container.textContent ?? '';
const tasks = () => store.document().domains.tasks as readonly Task[];

async function mount(seed: readonly Task[] = []) {
  store = createStore({ adapter: memoryStorageAdapter(), key: 'bench', now: () => clock });
  await store.load();
  if (seed.length > 0) store.updateDomains((d) => ({ ...d, tasks: seed }));
  container = document.createElement('div');
  document.body.append(container);
  bench = mountBench({ store, container, now: () => clock, confirm: () => true });
}

beforeEach(() => {
  clock = new Date('2026-11-24T09:00:00');
});

afterEach(() => {
  bench.destroy();
  container.remove();
  store.dispose();
});

describe('Today', () => {
  it('starts empty with a way to try an example day, and shows it once filled', async () => {
    await mount();
    expect(text()).toContain('Nothing here yet');
    click('Fill with an example day');
    expect(text()).toContain('Later today');
    expect(text()).toContain('Call the dentist');
    expect(text()).toContain('Anytime');
    expect(text()).not.toContain('Order printer ink'); // in the inbox, not today
  });

  it('quietly returns a past day’s unfinished task to the inbox, and says nothing about it', async () => {
    await mount([
      {
        id: 'old',
        title: 'Book the car in',
        createdAt: '2026-11-20T09:00:00.000Z',
        order: 0,
        sessions: [],
        when: { kind: 'anytime', date: '2026-11-20' },
      },
    ]);
    expect(tasks()[0]?.when).toEqual({ kind: 'none' });
    click('Tasks');
    expect(text()).toContain('Book the car in');
  });
});

describe('capture', () => {
  it('saves to the inbox from Today and returns with a receipt', async () => {
    await mount();
    click(/Capture a task/);
    expect(document.activeElement?.id).toBe('capture-input');
    type('#capture-input', 'Ring the bank');
    submit('form');
    expect(tasks().map((t) => [t.title, t.when.kind])).toEqual([['Ring the bank', 'none']]);
    expect(text()).toContain('Saved to Tasks: Ring the bank');
    expect(container.querySelector('h1')?.textContent).toBe('Today');
  });

  it('keeps the draft when the person leaves without saving', async () => {
    await mount();
    click(/Capture a task/);
    type('#capture-input', 'Half a thought');
    click('← Today');
    click(/Capture a task/);
    expect(container.querySelector<HTMLInputElement>('#capture-input')?.value).toBe(
      'Half a thought',
    );
    expect(tasks()).toEqual([]);
  });
});

describe('a task and its focus', () => {
  beforeEach(async () => {
    await mount();
    click('Fill with an example day');
    click(/Write the school email/);
  });

  it('acts on the one task record: steps, estimate and focus all change the same task', async () => {
    expect(text()).toContain('Find the school address');
    click('+');
    const email = tasks().find((t) => t.title === 'Write the school email')!;
    expect(email.estimateMinutes).toBe(30);
    click(/Start focus/);
    expect(tasks().find((t) => t.id === email.id)?.sessions).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toBe('Find the school address');
  });

  it('puts the current step above the clock, and moves on when a step is ticked', async () => {
    click(/Start focus/);
    const all = text();
    expect(all.indexOf('Find the school address')).toBeLessThan(all.indexOf('min left'));
    click(/This step is done/);
    expect(container.querySelector('h1')?.textContent).toBe('Write the question');
  });

  it('returns from capture to the same step, with the thought saved and a receipt', async () => {
    click(/Start focus/);
    click(/This step is done/);
    click(/Capture a thought/);
    expect(text()).toContain('Your place');
    expect(text()).toContain('Write the question');
    type('#capture-input', 'Order more stamps');
    submit('form');
    expect(container.querySelector('h1')?.textContent).toBe('Write the question');
    expect(text()).toContain('Saved to Tasks: Order more stamps');
    expect(tasks().some((t) => t.title === 'Order more stamps' && t.when.kind === 'none')).toBe(
      true,
    );
  });

  it('counts down as marks and a number, pauses, and offers more time without judgement', async () => {
    click(/Start focus/);
    expect(text()).toContain('25 of 25 min left');
    clock = new Date('2026-11-24T09:10:00');
    click('Pause');
    expect(text()).toContain('15 of 25 min left');
    expect(text()).toContain('Paused');
    clock = new Date('2026-11-24T09:30:00');
    click('Resume');
    clock = new Date('2026-11-24T09:46:00');
    click('Pause');
    expect(text()).toContain('Your 25 minutes are up.');
    click('Ten more minutes');
    expect(text()).toContain('9 of 35 min left');
  });

  it('shows the running task on Today with its step, and finishing it clears focus', async () => {
    click(/Start focus/);
    click('← Today');
    expect(text()).toContain('Now running');
    expect(text()).toContain('Find the school address');
    click('Open focus →');
    click('Task done');
    expect(text()).not.toContain('Now running');
    expect(tasks().find((t) => t.title === 'Write the school email')?.doneAt).toBeDefined();
  });
});

describe('what it never says', () => {
  it('has no overdue, missed or streak wording on any screen', async () => {
    await mount();
    click('Fill with an example day');
    const seen: string[] = [text()];
    click(/Write the school email/);
    seen.push(text());
    click(/Start focus/);
    seen.push(text());
    click(/Capture a thought/);
    seen.push(text());
    click('← Focus');
    click('← Today');
    click('Tasks');
    seen.push(text());
    for (const page of seen) expect(page).not.toMatch(/\b(overdue|missed|streak|late|behind)\b/i);
  });
});
