import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TODAY_STRINGS,
  carriedValue,
  createStore,
  measure,
  memoryStorageAdapter,
  mountToday,
  type KernelStore,
  type ModuleManifest,
  type TodayField,
} from '../../src/kernel/index';

// See docs/05-architecture.md "Today assembler" and docs/01-module-contract.md.

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

function libraryEntry() {
  return {
    tier: 'A' as const,
    whatItIs: 'x',
    whatTheEvidenceSays: 'y',
    whatItWontDo: 'z',
    citations: [{ title: 't', authors: 'a', year: 2020, venue: 'v', doi_or_url: 'u' }],
    reviewed: '2026-09',
    nextReview: '2027-09',
  };
}

function manifest(fields: TodayField[], overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'medication',
    name: 'Medication log',
    version: 1,
    tier: 'A',
    audience: 'adult',
    area: 'focus',
    summary: 's',
    contributes: { today: fields, library: libraryEntry() },
    fixtures: { empty: {}, threeDays: {}, thirtyDays: {} },
    ...overrides,
  };
}

describe('carry', () => {
  const field = (carry: TodayField['carry']): TodayField => ({
    id: 'dose',
    label: 'Dose',
    type: 'number',
    cost: 3,
    ...(carry === undefined ? {} : { carry }),
  });

  const days = {
    '2026-09-01': { dose: '30' },
    '2026-09-03': { dose: '' },
    '2026-09-06': { dose: '50' },
  };

  it('lets a value already recorded that day win', () => {
    expect(carriedValue(field('nearestPrior'), '2026-09-06', days)?.value).toBe('50');
    expect(carriedValue(field('nearestPrior'), '2026-09-06', days)?.from).toBeUndefined();
  });

  it('carries nothing when carry is none', () => {
    expect(carriedValue(field('none'), '2026-09-05', days)).toBeUndefined();
    expect(carriedValue(field(undefined), '2026-09-05', days)).toBeUndefined();
  });

  it('falls through blank days for nearestPrior', () => {
    // The 3rd is logged but records no dose, so the 1st is the source.
    const carried = carriedValue(field('nearestPrior'), '2026-09-05', days);
    expect(carried?.value).toBe('30');
    expect(carried?.from).toBe('2026-09-01');
  });

  it('takes only the immediately previous logged day for previous', () => {
    // Unlike nearestPrior, this does not fall through: the 3rd is the previous
    // logged day and it has no dose, so nothing is carried.
    expect(carriedValue(field('previous'), '2026-09-05', days)).toBeUndefined();
  });

  it('says when a value had to be carried backwards', () => {
    const carried = carriedValue(field('nearestPrior'), '2026-08-30', days);
    expect(carried?.value).toBe('30');
    expect(carried?.backwards).toBe(true);
  });

  it('treats an empty array as no value', () => {
    const side: TodayField = {
      id: 'side',
      label: 'Side effects',
      type: 'chipsMulti',
      cost: 3,
      carry: 'nearestPrior',
    };
    const withEmpty = { '2026-09-01': { side: ['dry'] }, '2026-09-02': { side: [] } };
    expect(carriedValue(side, '2026-09-03', withEmpty)?.from).toBe('2026-09-01');
  });
});

describe('the check-in budget', () => {
  const field = (cost: number, optional = false): TodayField => ({
    id: `f${cost}${optional ? 'o' : ''}`,
    label: 'F',
    type: 'number',
    cost,
    ...(optional ? { optional: true } : {}),
  });

  it('sums declared cost across enabled modules', () => {
    const budget = measure([
      manifest([field(10), field(15)]),
      manifest([field(20)], { id: 'sleep' }),
    ]);
    expect(budget.total).toBe(45);
    expect(budget.overBudget).toBe(false);
  });

  it('warns above ninety seconds', () => {
    const budget = measure([manifest([field(40), field(40), field(30)])]);
    expect(budget.total).toBe(110);
    expect(budget.overBudget).toBe(true);
  });

  it('says whether hiding optional fields would actually help', () => {
    const helps = measure([manifest([field(60), field(50, true)])]);
    expect(helps.overBudget).toBe(true);
    expect(helps.required).toBe(60);
    expect(helps.hidingWouldHelp).toBe(true);

    const doesNot = measure([manifest([field(100), field(5, true)])]);
    expect(doesNot.hidingWouldHelp).toBe(false);
  });
});

describe('the Today assembler', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter(), debounceMs: 0 });
    await store.load();
  });

  const focus: TodayField = {
    id: 'focus',
    label: 'Focus and follow-through',
    type: 'scale5',
    anchors: ['', 'Scattered', 'Patchy', 'Mixed', 'Mostly there', 'Locked in'],
    cost: 3,
  };

  it('groups fields under the module that declared them', () => {
    const view = mountToday({
      store,
      modules: [manifest([focus]), manifest([focus], { id: 'sleep', name: 'Sleep' })],
      date: '2026-09-04',
    });
    const headings = [...view.element.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings.slice(0, 2)).toEqual(['Medication log', 'Sleep']);
  });

  it('keeps the person’s chosen order', () => {
    const view = mountToday({
      store,
      modules: [manifest([focus], { id: 'sleep', name: 'Sleep' }), manifest([focus])],
      date: '2026-09-04',
    });
    expect([...view.element.querySelectorAll('h2')].map((h) => h.textContent).slice(0, 2)).toEqual([
      'Sleep',
      'Medication log',
    ]);
  });

  it('puts the kernel’s own fields last, after every module', () => {
    const view = mountToday({ store, modules: [manifest([focus])], date: '2026-09-04' });
    const headings = [...view.element.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings).toEqual(['Medication log', 'What actually happened', 'Notes']);
  });

  it('writes a win to kernel.days, not to any module slice', () => {
    const view = mountToday({ store, modules: [manifest([focus])], date: '2026-09-04' });
    const box = [...view.element.querySelectorAll('input[type="text"]')][0] as HTMLInputElement;
    box.value = 'Started the tax forms';
    box.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(store.document().kernel.days['2026-09-04']?.win).toBe('Started the tax forms');
    expect(
      store.get<{ days: Record<string, unknown> }>('medication')?.days['2026-09-04'],
    ).toBeUndefined();
  });

  it('shows nothing of the kernel’s own when no module is enabled', () => {
    const view = mountToday({ store, modules: [], date: '2026-09-04' });
    const headings = [...view.element.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings).toEqual([TODAY_STRINGS.empty]);
  });

  it('writes a value under modules.<id>.days[date].<fieldId>', () => {
    const view = mountToday({ store, modules: [manifest([focus])], date: '2026-09-04' });
    click(view.element.querySelectorAll('.scale .chip')[3]);

    const slice = store.get<{ days: Record<string, Record<string, unknown>> }>('medication');
    expect(slice?.days['2026-09-04']?.['focus']).toBe(4);
  });

  it('stamps createdAt once and never changes it', () => {
    let clock = new Date('2026-09-04T21:00:00.000Z');
    const view = mountToday({
      store,
      modules: [manifest([focus])],
      date: '2026-09-04',
      now: () => clock,
    });

    click(view.element.querySelectorAll('.scale .chip')[0]);
    expect(store.document().kernel.days['2026-09-04']?.createdAt).toBe('2026-09-04T21:00:00.000Z');

    clock = new Date('2026-09-05T09:00:00.000Z');
    click(view.element.querySelectorAll('.scale .chip')[2]);
    expect(store.document().kernel.days['2026-09-04']?.createdAt).toBe('2026-09-04T21:00:00.000Z');
  });

  it('keeps one module out of another module’s slice', () => {
    const view = mountToday({
      store,
      modules: [manifest([focus]), manifest([focus], { id: 'sleep', name: 'Sleep' })],
      date: '2026-09-04',
    });
    click(view.element.querySelectorAll('.scale .chip')[0]);
    expect(store.get('medication')).toBeDefined();
    expect(store.get('sleep')).toBeUndefined();
  });

  it('reports a save', () => {
    const onSaved = vi.fn();
    const view = mountToday({ store, modules: [manifest([focus])], date: '2026-09-04', onSaved });
    click(view.element.querySelectorAll('.scale .chip')[0]);
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows a follow-up only once its parent has a value', () => {
    const rebound: TodayField = {
      id: 'rebound',
      label: 'Rebound',
      type: 'chips',
      options: [
        { v: 'none', l: 'None' },
        { v: 'mild', l: 'Mild' },
      ],
      cost: 2,
      followUp: (value) =>
        value === 'mild'
          ? [{ id: 'reboundTime', label: 'When', type: 'time' as const, cost: 2 }]
          : [],
    };

    const view = mountToday({ store, modules: [manifest([rebound])], date: '2026-09-04' });
    const detail = view.element.querySelector('.detail') as HTMLElement;
    expect(detail.hidden).toBe(true);

    click(view.element.querySelectorAll('.chip')[1]);
    expect((view.element.querySelector('.detail') as HTMLElement).hidden).toBe(false);
    expect(view.element.querySelector('input[type="time"]')).not.toBeNull();
  });

  it('hides the follow-up again when the parent is cleared', () => {
    const rebound: TodayField = {
      id: 'rebound',
      label: 'Rebound',
      type: 'chips',
      options: [{ v: 'mild', l: 'Mild' }],
      cost: 2,
      followUp: (value) =>
        value === 'mild'
          ? [{ id: 'reboundTime', label: 'When', type: 'time' as const, cost: 2 }]
          : [],
    };
    const view = mountToday({ store, modules: [manifest([rebound])], date: '2026-09-04' });
    click(view.element.querySelectorAll('.chip')[0]);
    click(view.element.querySelectorAll('.chip')[0]);
    expect((view.element.querySelector('.detail') as HTMLElement).hidden).toBe(true);
  });

  it('prefills from the nearest earlier day and says where it came from', () => {
    store.set('medication', { version: 1, days: { '2026-09-01': { dose: '30' } } });
    const dose: TodayField = {
      id: 'dose',
      label: 'Dose',
      type: 'number',
      cost: 3,
      carry: 'nearestPrior',
    };

    const view = mountToday({ store, modules: [manifest([dose])], date: '2026-09-04' });
    expect((view.element.querySelector('input[type="number"]') as HTMLInputElement).value).toBe(
      '30',
    );
    expect(view.element.textContent).toContain('Carried from 2026-09-01');
  });

  it('hides optional fields when asked', () => {
    const optional: TodayField = {
      id: 'note',
      label: 'A note',
      type: 'text',
      cost: 5,
      optional: true,
    };
    const view = mountToday({ store, modules: [manifest([focus, optional])], date: '2026-09-04' });
    expect(view.element.textContent).toContain('A note');

    view.setHideOptional(true);
    expect(view.element.textContent).not.toContain('A note');
    expect(view.element.textContent).toContain('Focus and follow-through');
  });

  it('redraws for another day', () => {
    store.set('medication', { version: 1, days: { '2026-09-01': { focus: 5 } } });
    const view = mountToday({ store, modules: [manifest([focus])], date: '2026-09-04' });
    expect(view.element.querySelector('.anchor')?.textContent).toBe('');

    view.setDate('2026-09-01');
    expect(view.date()).toBe('2026-09-01');
    expect(view.element.querySelector('.anchor')?.textContent).toBe('Locked in');
  });

  it('defaults to the logging day, so at 1am it is yesterday', () => {
    const view = mountToday({
      store,
      modules: [manifest([focus])],
      now: () => new Date(2026, 8, 5, 1, 30),
    });
    expect(view.date()).toBe('2026-09-04');
  });

  it('says so when there is nothing to record', () => {
    const view = mountToday({ store, modules: [], date: '2026-09-04' });
    expect(view.element.textContent).toContain(TODAY_STRINGS.empty);
    expect(view.element.textContent).not.toMatch(/you forgot|you missed|streak/i);
  });
});

describe('what a card opens at', () => {
  // The medication log declares thirteen fields, six of them optional, and used
  // to render all thirteen at once — which is why the day's record read as a
  // dose form even once the other modules appeared above it. See ADR-032.

  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter(), debounceMs: 0 });
    await store.load();
  });

  const required = (id: string): TodayField => ({ id, label: id, type: 'text', cost: 1 });
  const spare = (id: string): TodayField => ({ ...required(id), optional: true });

  function view(fields: TodayField[], date = '2026-09-04'): HTMLElement {
    return mountToday({ store, modules: [manifest(fields)], date }).element;
  }

  /** This module's own card. The kernel appends its own groups after it. */
  function ours(element: HTMLElement): HTMLElement {
    const card = [...element.querySelectorAll('.card')].find(
      (node) => node.querySelector('h2')?.textContent === 'Medication log',
    );
    expect(card).toBeDefined();
    return card as HTMLElement;
  }

  /** The field's own label, without the "optional" marker rendered beside it. */
  const name = (label: Element): string =>
    [...label.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => (node.textContent ?? '').trim())
      .join('');

  const openLabels = (element: HTMLElement): string[] =>
    [...ours(element).querySelectorAll('.flabel')]
      .filter((label) => label.closest('.more') === null)
      .map(name);

  const foldedLabels = (element: HTMLElement): string[] =>
    [...ours(element).querySelectorAll('.more .flabel')].map(name);

  it('opens at what it needs and keeps the rest within reach', () => {
    const element = view([required('dose'), spare('onset'), spare('woreOff')]);
    expect(openLabels(element)).toEqual(['dose']);
    expect(foldedLabels(element)).toEqual(['onset', 'woreOff']);
  });

  it('says how many are behind the fold, and that they may not apply', () => {
    const two = view([required('dose'), spare('onset'), spare('woreOff')]);
    expect(ours(two).querySelector('.more summary')?.textContent).toBe(
      '2 more questions, if they apply',
    );
    const one = view([required('dose'), spare('onset')]);
    expect(ours(one).querySelector('.more summary')?.textContent).toBe(
      'One more question, if it applies',
    );
  });

  it('never puts away something already answered', () => {
    // Hiding a field a person filled in takes their own record off the screen
    // and leaves no way to correct it. Worse than a long form.
    store.set('medication', { version: 1, days: { '2026-09-04': { onset: '09:30' } } });
    const element = view([required('dose'), spare('onset'), spare('woreOff')]);
    expect(openLabels(element)).toEqual(['dose', 'onset']);
    expect(foldedLabels(element)).toEqual(['woreOff']);
  });

  it('shows a card that is entirely optional, rather than folding all of it', () => {
    // A card with nothing open has no opening to keep short. The kernel's own
    // "What actually happened" is two optional fields; folding it would hide a
    // two-question card behind a heading and cost a click for nothing.
    const element = view([spare('win'), spare('miss')]);
    expect(openLabels(element)).toEqual(['win', 'miss']);
    expect(ours(element).querySelector('.more')).toBeNull();
  });

  it('drops the fold when every optional field has been answered', () => {
    store.set('medication', {
      version: 1,
      days: { '2026-09-04': { onset: '09:30', woreOff: '16:30' } },
    });
    const element = view([required('dose'), spare('onset'), spare('woreOff')]);
    expect(ours(element).querySelector('.more')).toBeNull();
    expect(openLabels(element)).toEqual(['dose', 'onset', 'woreOff']);
  });

  it('uses a native disclosure, so it works from the keyboard with no script', () => {
    const element = view([required('dose'), spare('onset')]);
    const fold = ours(element).querySelector('.more');
    expect(fold?.tagName.toLowerCase()).toBe('details');
    expect(fold?.firstElementChild?.tagName.toLowerCase()).toBe('summary');
    // Closed on arrival: the point is what the card opens at.
    expect((fold as HTMLDetailsElement).open).toBe(false);
  });

  it('hides nothing that has a value, even when hiding the optional ones', () => {
    // The budget control hides optional questions across every card. It used to
    // hide them whether or not they held anything, which took a person's own
    // record off the screen.
    store.set('medication', { version: 1, days: { '2026-09-04': { onset: '09:30' } } });
    const built = mountToday({
      store,
      modules: [manifest([required('dose'), spare('onset'), spare('woreOff')])],
      date: '2026-09-04',
    });
    built.setHideOptional(true);
    const labels = [...ours(built.element).querySelectorAll('.flabel')].map(name);
    expect(labels).toContain('onset');
    expect(labels).not.toContain('woreOff');
  });
});

describe('dotted field ids', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter(), debounceMs: 0 });
    await store.load();
  });

  const severity: TodayField = {
    id: 'detail.dry.sev',
    label: 'Dry mouth: how bad',
    type: 'chips',
    options: [
      { v: 'mild', l: 'Mild' },
      { v: 'severe', l: 'Severe' },
    ],
    cost: 2,
  };

  it('write nested, as the data model stores side-effect detail', () => {
    const view = mountToday({ store, modules: [manifest([severity])], date: '2026-09-04' });
    click(view.element.querySelectorAll('.chip')[0]);

    const slice = store.get<{ days: Record<string, Record<string, unknown>> }>('medication');
    const day = slice?.days['2026-09-04'] as { detail?: { dry?: { sev?: string } } };
    expect(day.detail?.dry?.sev).toBe('mild');
    // And not as a flat key with a dot in its name.
    expect(Object.keys(day)).not.toContain('detail.dry.sev');
  });

  it('read back what they wrote', () => {
    store.set('medication', {
      version: 1,
      days: { '2026-09-04': { detail: { dry: { sev: 'severe' } } } },
    });
    const view = mountToday({ store, modules: [manifest([severity])], date: '2026-09-04' });
    const pressed = [...view.element.querySelectorAll('[aria-pressed]')].map((n) =>
      n.getAttribute('aria-pressed'),
    );
    expect(pressed).toEqual(['false', 'true']);
  });

  it('carry by path like any other field', () => {
    store.set('medication', {
      version: 1,
      days: { '2026-09-01': { detail: { dry: { sev: 'mild' } } } },
    });
    const carrying: TodayField = { ...severity, carry: 'nearestPrior' };
    const view = mountToday({ store, modules: [manifest([carrying])], date: '2026-09-04' });
    expect(view.element.textContent).toContain('Carried from 2026-09-01');
  });

  it('keep a sibling under the same parent', () => {
    store.set('medication', {
      version: 1,
      days: { '2026-09-04': { detail: { dry: { time: '11:00' } } } },
    });
    const view = mountToday({ store, modules: [manifest([severity])], date: '2026-09-04' });
    click(view.element.querySelectorAll('.chip')[0]);

    const slice = store.get<{ days: Record<string, Record<string, unknown>> }>('medication');
    const day = slice?.days['2026-09-04'] as { detail?: { dry?: { sev?: string; time?: string } } };
    expect(day.detail?.dry).toEqual({ time: '11:00', sev: 'mild' });
  });
});
