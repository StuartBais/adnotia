import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRegistry,
  createRouter,
  createStore,
  memoryStorageAdapter,
  mountShell,
  renderTab,
  tierWording,
  TABS,
  type KernelStore,
  type ModuleManifest,
} from '../../src/kernel/index';

// See docs/05-architecture.md "Shell and spaces" and docs/03-scope.md
// "The home screen is not the medication log".

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const byText = (root: ParentNode, text: string): Element | undefined =>
  [...root.querySelectorAll('button, h1, h2, p')].find((node) => node.textContent?.trim() === text);

let container: HTMLElement;
let store: KernelStore;

beforeEach(async () => {
  document.body.replaceChildren();
  container = document.createElement('div');
  document.body.append(container);
  store = createStore({ adapter: memoryStorageAdapter(), debounceMs: 0 });
  await store.load();
});

function sampleModule(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'sleep',
    name: 'Sleep',
    version: 1,
    tier: 'B',
    audience: 'adult',
    summary: 'When you went to bed, when you woke, and how the night went.',
    contributes: {
      library: {
        tier: 'B',
        whatItIs: 'A short record of your nights.',
        whatTheEvidenceSays: 'Sleep problems in ADHD are well documented.',
        whatItWontDo: 'It will not diagnose a sleep disorder.',
        citations: [
          { title: 'x', authors: 'y', year: 2020, venue: 'z', doi_or_url: 'https://example' },
        ],
        reviewed: '2026-09',
        nextReview: '2027-03',
      },
    },
    fixtures: { empty: {}, threeDays: {}, thirtyDays: {} },
    ...overrides,
  };
}

describe('routing', () => {
  it('starts on Today', () => {
    expect(createRouter().tab()).toBe('today');
  });

  it('moves between tabs and tells subscribers', () => {
    const router = createRouter();
    const heard = vi.fn();
    router.subscribe(heard);
    router.goTab('records');
    expect(router.tab()).toBe('records');
    expect(heard).toHaveBeenCalled();
  });

  it('opens an off-tab page over the tab it came from', () => {
    const router = createRouter();
    router.goTab('library');
    router.openPage({ id: 'settings', title: 'Settings', render: () => undefined });
    expect(router.page()?.id).toBe('settings');
    expect(router.tab()).toBe('library');
  });

  it('returns to the originating tab on Back', () => {
    const router = createRouter();
    router.goTab('tools');
    router.openPage({ id: 'backup', title: 'Backups', render: () => undefined });
    router.back();
    expect(router.page()).toBeUndefined();
    expect(router.tab()).toBe('tools');
  });

  it('closes an off-tab page when a tab is chosen', () => {
    const router = createRouter();
    router.openPage({ id: 'settings', title: 'Settings', render: () => undefined });
    router.goTab('records');
    expect(router.page()).toBeUndefined();
  });
});

describe('first run', () => {
  it('asks one question, and it is whose this is', () => {
    mountShell({ store, container });
    expect(container.textContent).toContain('What would you like help with?');
    expect(byText(container, 'This is for me')).toBeDefined();
    expect(byText(container, 'This is for a child I care for')).toBeDefined();
  });

  it('shows no dose field, and no medication anything, before anything is chosen', () => {
    mountShell({ store, container });
    expect(container.textContent?.toLowerCase()).not.toContain('dose');
    expect(container.textContent?.toLowerCase()).not.toContain('medication');
  });

  it('records the Adult space and finishes', () => {
    mountShell({ store, container });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
    expect(store.document().space).toBe('adult');
    expect(store.document().kernel.settings.firstRunComplete).toBe(true);
  });

  it('records the Family space when the answer is a child', () => {
    mountShell({ store, container });
    click(byText(container, 'This is for a child I care for'));
    click(byText(container, 'Continue'));
    expect(store.document().space).toBe('family');
  });

  it('lets someone go back and change the answer', () => {
    mountShell({ store, container });
    click(byText(container, 'This is for a child I care for'));
    click(byText(container, 'Back'));
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
    expect(store.document().space).toBe('adult');
  });

  it('is not asked again next time', async () => {
    mountShell({ store, container });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));

    const second = document.createElement('div');
    mountShell({ store, container: second });
    expect(second.textContent).not.toContain('What would you like help with?');
  });

  it('is not asked again even when nothing was turned on', () => {
    // Choosing nothing is a valid answer, and must not loop someone back.
    mountShell({ store, container });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
    expect(store.document().kernel.enabledModules).toEqual([]);
    expect(store.document().kernel.settings.firstRunComplete).toBe(true);
  });

  it('offers the modules for the chosen space, with their tier wording', () => {
    mountShell({ store, container, modules: [sampleModule()] });
    click(byText(container, 'This is for me'));
    expect(container.textContent).toContain('Sleep');
    expect(container.textContent).toContain('Promising.');
  });

  it('turns on only what was chosen', () => {
    mountShell({ store, container, modules: [sampleModule()] });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Turn this on'));
    click(byText(container, 'Done'));
    expect(store.document().kernel.enabledModules).toEqual(['sleep']);
  });

  it('says plainly when there is nothing to offer yet', () => {
    mountShell({ store, container });
    click(byText(container, 'This is for me'));
    expect(container.textContent).toContain('Nothing to turn on yet');
  });
});

describe('tier wording', () => {
  it('is the rubric’s wording, never a bare letter', () => {
    expect(tierWording('A', 'adult')).toBe(
      'Established. This is based on treatments with repeated trial evidence in adults with ADHD.',
    );
    expect(tierWording('C', 'adult')).toContain('Plausible.');
    expect(tierWording('B', 'adult')).toContain('worth trying, not as proven');
  });

  it('names the right population in the Family space', () => {
    expect(tierWording('A', 'family')).toContain('children with ADHD and their parents');
  });

  it('never calls a Tier B or C tool evidence-based', () => {
    // docs/02-evidence-rubric.md says the phrase is reserved for Tier A, and
    // also mandates Tier C wording containing "evidence-based treatment". The
    // verbatim wording wins, and the two are reconcilable: the phrase describes
    // the protocol a technique came from, never the tool itself.
    expect(tierWording('B', 'adult').toLowerCase()).not.toContain('evidence-based');
    expect(tierWording('C', 'adult')).toContain('techniques used in evidence-based treatment');
    expect(tierWording('C', 'adult')).toContain('has not itself been tested in trials');
    expect(tierWording('B', 'adult').startsWith('Promising.')).toBe(true);
    expect(tierWording('C', 'adult').startsWith('Plausible.')).toBe(true);
  });
});

describe('navigation once first run is done', () => {
  beforeEach(() => {
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
  });

  it('shows the four tabs', () => {
    mountShell({ store, container });
    const tabs = [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
    expect(tabs).toEqual(['Today', 'Tools', 'Records', 'Library']);
  });

  it('marks the current tab with aria-selected', () => {
    const shell = mountShell({ store, container });
    shell.router.goTab('records');
    const selected = [...container.querySelectorAll('[role="tab"]')].find(
      (tab) => tab.getAttribute('aria-selected') === 'true',
    );
    expect(selected?.textContent).toBe('Records');
  });

  it('has no deep link to a module', () => {
    // Modules appear inside the four areas; the shell never routes to one.
    expect(TABS).toEqual(['today', 'tools', 'records', 'library']);
  });

  it('opens Settings as an off-tab page with a Back button', () => {
    const shell = mountShell({ store, container });
    click(byText(container, 'Settings'));
    expect(shell.router.page()?.id).toBe('settings');
    expect(byText(container, 'Back')).toBeDefined();
    expect(container.querySelector('.tabs')?.hasAttribute('hidden')).toBe(true);
  });

  it('returns to the tab it came from', () => {
    const shell = mountShell({ store, container });
    shell.router.goTab('library');
    click(byText(container, 'Settings'));
    click(byText(container, 'Back'));
    expect(shell.router.tab()).toBe('library');
    expect(container.querySelector('.tabs')?.hasAttribute('hidden')).toBe(false);
  });

  it('says what each empty tab is for, without blaming anyone', () => {
    const shell = mountShell({ store, container });
    for (const tab of TABS) {
      shell.router.goTab(tab);
      const text = container.textContent ?? '';
      expect(text.length).toBeGreaterThan(20);
      expect(text).not.toMatch(/you forgot|you missed|you have not|keep it up|streak/i);
    }
  });
});

describe('the tab views', () => {
  const context = { space: 'adult' as const, enabled: [], known: [] };

  it('show an empty state per tab', () => {
    expect(renderTab('today', context).textContent).toContain('Nothing to fill in');
    expect(renderTab('records', context).textContent).toContain('Nothing recorded yet');
  });

  it('list every known module in the Library, enabled or not', () => {
    const known = createRegistry([sampleModule()]).all();
    const view = renderTab('library', { space: 'adult', enabled: [], known });
    expect(view.textContent).toContain('Sleep');
    expect(view.textContent).toContain('It will not diagnose a sleep disorder.');
  });

  it('show only enabled modules on Today', () => {
    const enabled = createRegistry([sampleModule()]).all();
    expect(renderTab('today', { space: 'adult', enabled, known: enabled }).textContent).toContain(
      'Sleep',
    );
    expect(renderTab('today', context).textContent).not.toContain('Sleep');
  });
});

describe('settings', () => {
  beforeEach(() => {
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
  });

  it('states where the data is and that nothing is sent anywhere', () => {
    mountShell({ store, container });
    click(byText(container, 'Settings'));
    expect(container.textContent).toContain('stays in this browser');
    expect(container.textContent).toContain('nothing is ever sent anywhere');
  });

  it('leads to backups', () => {
    const shell = mountShell({ store, container });
    click(byText(container, 'Settings'));
    click([...container.querySelectorAll('.linkrow')].find((r) => r.textContent?.includes('Backups')));
    expect(shell.router.page()?.id).toBe('backup');
    expect(container.textContent).toContain('Restoring adds to what is here');
  });

  it('refuses a backup passphrase that is too short', () => {
    mountShell({ store, container });
    click(byText(container, 'Settings'));
    click([...container.querySelectorAll('.linkrow')].find((r) => r.textContent?.includes('Backups')));

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'short';
    input.dispatchEvent(new Event('input'));
    const button = [...container.querySelectorAll('button')].find(
      (node) => node.textContent === 'Download a backup',
    );
    click(button);
    expect(container.textContent).toContain('too short');
  });
});
