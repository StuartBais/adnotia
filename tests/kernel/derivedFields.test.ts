import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createStore,
  memoryStorageAdapter,
  mountToday,
  type KernelStore,
} from '../../src/kernel/index';
import sleep from '../../src/modules/sleep/manifest';
import { buildReport, loggedDates, validateManifest } from '../../src/kernel/index';

describe('automatic sleep duration in Today', () => {
  const date = '2026-09-05';
  let adapter: ReturnType<typeof memoryStorageAdapter>;
  let store: KernelStore;
  let root: HTMLElement;

  function render(): void {
    root = mountToday({ store, modules: [sleep], date }).element;
    document.body.replaceChildren(root);
  }

  function input(label: string): HTMLInputElement {
    return root.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;
  }

  function enter(label: string, value: string): void {
    const control = input(label);
    control.value = value;
    control.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function hours(): unknown {
    return store.get<{ days: Record<string, Record<string, unknown>> }>('sleep')?.days[date]?.[
      'hours'
    ];
  }

  beforeEach(async () => {
    adapter = memoryStorageAdapter();
    store = createStore({ adapter });
    await store.load();
    render();
  });

  afterEach(() => {
    store.dispose();
    document.body.replaceChildren();
  });

  it('updates both the displayed and stored duration when a time changes', () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    expect(input('Hours actually asleep').value).toBe('8');
    expect(hours()).toBe('8');
    const wake = input('Awake for the day');
    wake.focus();
    enter('Awake for the day', '08:00');
    expect(input('Hours actually asleep').value).toBe('9');
    expect(hours()).toBe('9');
    expect(document.activeElement).toBe(wake);
  });

  it('continues recalculating after a storage reload', async () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    await store.flush();
    store.dispose();
    store = createStore({ adapter });
    await store.load();
    render();
    enter('Awake for the day', '08:00');
    expect(hours()).toBe('9');
    expect(input('Hours actually asleep').value).toBe('9');
  });

  it('preserves a manual answer equal to the calculation after reload', async () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    enter('Hours actually asleep', '8');
    await store.flush();
    store.dispose();
    store = createStore({ adapter });
    await store.load();
    render();
    enter('Awake for the day', '08:00');
    expect(hours()).toBe('8');
    expect(input('Hours actually asleep').value).toBe('8');
  });

  it('preserves legacy durations whose origin is unknown', () => {
    store.set('sleep', {
      version: 1,
      days: { [date]: { bed: '23:00', wake: '07:00', hours: '6' } },
    });
    render();
    enter('Awake for the day', '08:00');
    expect(hours()).toBe('6');
  });

  it('clears automatic hours when a required time is cleared', () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    enter('Lights out', '');
    expect(hours()).toBe('');
    expect(input('Hours actually asleep').value).toBe('');
  });

  it('does not count metadata as a logged day after all times are cleared', () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    enter('Lights out', '');
    enter('Awake for the day', '');
    expect(loggedDates(store.document(), [sleep])).toEqual([]);
  });

  it('keeps automatic-value metadata out of report output', () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    const report = buildReport({
      document: store.document(),
      modules: [sleep],
      now: new Date(`${date}T12:00:00`),
    });
    expect(report.empty).toBe(false);
    expect(report.text).not.toContain('_derived');
    expect(report.html).not.toContain('_derived');
  });

  it.each(['_derived', '_derived.hours'])('reserves %s against input-field collisions', (id) => {
    const field = {
      id,
      label: 'Conflicting field',
      type: 'text' as const,
      cost: 0,
    };
    const direct = {
      ...sleep,
      contributes: { ...sleep.contributes, today: [field] },
    };
    const followUp = {
      ...sleep,
      contributes: {
        ...sleep.contributes,
        today: [
          {
            id: 'extra',
            label: 'More',
            type: 'text' as const,
            cost: 0,
            followUp: () => [field],
          },
        ],
      },
    };
    expect(validateManifest(direct).some((issue) => issue.rule === 'reserved-field')).toBe(true);
    expect(validateManifest(followUp).some((issue) => issue.rule === 'reserved-field')).toBe(true);
  });

  it('resumes calculation when the manual duration is cleared', () => {
    enter('Lights out', '23:00');
    enter('Awake for the day', '07:00');
    enter('Hours actually asleep', '6');
    enter('Hours actually asleep', '');
    expect(hours()).toBe('8');
    expect(input('Hours actually asleep').value).toBe('8');
  });
});
