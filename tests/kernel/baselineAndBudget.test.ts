import { beforeEach, describe, expect, it } from 'vitest';
import {
  BASELINE_STRINGS,
  BUDGET_STRINGS,
  baselinePage,
  createStore,
  describeBaseline,
  hasBaseline,
  memoryStorageAdapter,
  renderTab,
  type KernelStore,
  type ModuleManifest,
  type TodayField,
} from '../../src/kernel/index';

// Two things the clinical report and the check-in budget both depended on and
// neither had: somewhere to enter the baseline, and the offer to shorten a long
// check-in. See docs/01-module-contract.md and docs/06-data-model.md.

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

function field(cost: number, optional = false): TodayField {
  return {
    id: `f${cost}${optional ? 'o' : ''}`,
    label: 'A question',
    type: 'text',
    cost,
    optional,
  };
}

function manifest(today: TodayField[], id = 'demo'): ModuleManifest {
  return {
    id,
    name: id,
    version: 1,
    tier: 'A',
    audience: 'adult',
    summary: 's',
    contributes: { library: libraryEntry(), today },
  };
}

describe('the baseline', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  function render(): HTMLElement {
    const host = document.createElement('div');
    baselinePage({ store }).render(host);
    return host;
  }

  const click = (element: Element | null | undefined): void => {
    (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  it('writes a rating the report can read back', () => {
    const host = render();
    const scales = host.querySelectorAll('.scale');
    click(scales[0]?.querySelectorAll('.chip')[1]);
    expect(store.document().kernel.baseline?.focus).toBe(2);
  });

  it('keeps the fields it was given and does not invent the others', () => {
    const host = render();
    click(host.querySelectorAll('.scale')[1]?.querySelectorAll('.chip')[3]);
    const baseline = store.document().kernel.baseline!;
    expect(baseline.mood).toBe(4);
    expect(baseline.focus).toBeNull();
    expect(baseline.sleep).toBe('');
  });

  it('can be cleared, so the report stops comparing against it', () => {
    const host = render();
    click(host.querySelectorAll('.scale')[0]?.querySelectorAll('.chip')[2]);
    expect(hasBaseline(store.document().kernel.baseline)).toBe(true);

    click(
      [...host.querySelectorAll('button')].find((b) => b.textContent === BASELINE_STRINGS.clear),
    );
    expect(store.document().kernel.baseline).toBeUndefined();
    expect(hasBaseline(store.document().kernel.baseline)).toBe(false);
  });

  it('says it is recalled rather than measured', () => {
    expect(render().textContent).toContain('rough marker rather than a measurement');
  });

  it('summarises itself for the row that opens it', () => {
    expect(describeBaseline(undefined)).toBe('Not set');
    expect(describeBaseline({ focus: 2, mood: 3, sleep: '6', note: '' })).toBe(
      'focus 2 · mood 3 · 6h',
    );
  });
});

describe('a check-in that has grown long', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  function today(modules: ModuleManifest[]): HTMLElement {
    return renderTab('today', { space: 'adult', enabled: modules, known: modules, store });
  }

  it('says nothing at all while the check-in is short', () => {
    const view = today([manifest([field(10), field(10, true)])]);
    expect(view.querySelector('.budget')).toBeNull();
  });

  it('offers to hide the optional questions once it runs long', () => {
    // Over ninety seconds, and hiding what is optional would bring it under.
    const view = today([manifest([field(80), field(30, true)])]);
    expect(view.querySelector('.budget')).not.toBeNull();
    expect(view.textContent).toContain(BUDGET_STRINGS.hide);
  });

  it('stays quiet when hiding them would not help', () => {
    const view = today([manifest([field(100), field(5, true)])]);
    expect(view.querySelector('.budget')).toBeNull();
  });

  it('actually hides them, and offers them back', () => {
    const view = today([manifest([field(80), field(30, true)])]);
    const before = view.querySelectorAll('.field').length;
    const button = [...view.querySelectorAll('button')].find(
      (candidate) => candidate.textContent === BUDGET_STRINGS.hide,
    ) as HTMLButtonElement;

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(view.querySelectorAll('.field').length).toBeLessThan(before);
    expect(button.textContent).toBe(BUDGET_STRINGS.show);
    expect(view.textContent).toContain('still there when you want them');

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(view.querySelectorAll('.field').length).toBe(before);
  });

  it('describes the form and never the person', () => {
    const view = today([manifest([field(80), field(30, true)])]);
    const text = view.querySelector('.budget')?.textContent ?? '';
    expect(text).not.toMatch(/\b(you (took|usually|are)|too long|slow|hurry|quick)\b/i);
    expect(text).toMatch(/about \d+(\.\d)? minutes/i);
  });

  it('rounds, because the seconds are an estimate a module declared', () => {
    expect(BUDGET_STRINGS.long(95)).toContain('1.5 minutes');
    expect(BUDGET_STRINGS.long(120)).toContain('2 minutes');
  });
});
