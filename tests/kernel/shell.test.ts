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
    area: 'focus',
    summary: 'When you went to bed, when you woke, and how the night went.',
    contributes: {
      library: {
        tier: 'B',
        whatItIs: 'A short record of your nights.',
        whatTheEvidenceSays: 'Sleep problems in ADHD are well documented.',
        whatItWontDo: 'It will not diagnose a sleep disorder.',
        citations: [
          {
            title: 'x',
            authors: 'y',
            year: 2020,
            venue: 'z',
            doi_or_url: 'https://example',
          },
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
  it('starts on the index of what you can do, not on the day’s record', () => {
    // Today was the landing, and that is what made the app read as a medication
    // log with things bolted on. See the note on TABS in shell/router.ts.
    expect(createRouter().tab()).toBe('tools');
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
    router.openPage({
      id: 'settings',
      title: 'Settings',
      render: () => undefined,
    });
    expect(router.page()?.id).toBe('settings');
    expect(router.tab()).toBe('library');
  });

  it('returns to the originating tab on Back', () => {
    const router = createRouter();
    router.goTab('tools');
    router.openPage({
      id: 'backup',
      title: 'Backups',
      render: () => undefined,
    });
    router.back();
    expect(router.page()).toBeUndefined();
    expect(router.tab()).toBe('tools');
  });

  it('closes an off-tab page when a tab is chosen', () => {
    const router = createRouter();
    router.openPage({
      id: 'settings',
      title: 'Settings',
      render: () => undefined,
    });
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
    expect(tabs).toEqual(['Tools', 'Today', 'Records', 'Library']);
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
    expect(TABS).toEqual(['tools', 'today', 'records', 'library']);
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
    expect(renderTab('today', context).textContent).toContain('Nothing to record yet');
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

  it('shows a failed save across navigation and lets the person retry', async () => {
    const adapter = memoryStorageAdapter();
    store.dispose();
    store = createStore({ adapter });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    await store.flush();
    vi.spyOn(adapter, 'write').mockRejectedValueOnce(new Error('QuotaExceededError'));
    const shell = mountShell({ store, container });
    store.set('sleep', { version: 1, days: { '2026-09-01': { hours: '8' } } });

    try {
      expect(container.textContent).toContain('Saving changes.');
      await expect(store.flush()).rejects.toThrow('QuotaExceededError');
      expect(container.textContent).toContain('Changes could not be saved.');
      shell.router.goTab('library');
      expect(container.textContent).toContain('Changes could not be saved.');
      click(byText(container, 'Retry save'));
      await vi.waitFor(() => {
        expect(container.textContent).toContain('Changes saved in this browser.');
      });
      const reopened = createStore({ adapter });
      await reopened.load();
      expect(reopened.get('sleep')).toEqual(store.get('sleep'));
      reopened.dispose();
    } finally {
      shell.destroy();
      store.dispose();
    }
  });

  it('keeps the unavailable-storage warning after first run and navigation', () => {
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { passcodeEnabled: false },
    }));
    const shell = mountShell({ store, container, storageAvailable: false });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
    shell.router.goTab('library');
    expect(container.textContent).toContain('not letting Adnotia save anything');
    expect(container.textContent).not.toContain('Changes saved in this browser.');
    shell.destroy();
  });

  it('does not claim a restore was saved when storage rejects it', async () => {
    const adapter = memoryStorageAdapter();
    store.dispose();
    store = createStore({ adapter, onPersistError: vi.fn() });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    await store.flush();
    const backup = structuredClone(store.document());
    backup.modules['sleep'] = {
      version: 1,
      days: { '2026-09-01': { hours: '8' } },
    };
    vi.spyOn(adapter, 'write').mockRejectedValueOnce(new Error('QuotaExceededError'));
    const shell = mountShell({ store, container });
    click(byText(container, 'Settings'));
    click(
      [...container.querySelectorAll('.linkrow')].find((row) =>
        row.textContent?.includes('Backups'),
      ),
    );
    Object.defineProperty(container.querySelector('input[type="file"]'), 'files', {
      value: [{ text: async () => JSON.stringify(backup) }],
    });
    click(byText(container, 'Restore'));

    try {
      await vi.waitFor(() => {
        expect(container.textContent).toContain('The backup was merged, but could not be saved.');
      });
      expect(container.textContent).not.toContain('1 added, 0 updated.');
      expect(store.get('sleep')).toEqual(backup.modules['sleep']);
      const reopened = createStore({ adapter });
      await reopened.load();
      expect(reopened.get('sleep')).toBeUndefined();
      reopened.dispose();
    } finally {
      shell.destroy();
      store.dispose();
    }
  });

  it('leads to backups', () => {
    const shell = mountShell({ store, container });
    click(byText(container, 'Settings'));
    click(
      [...container.querySelectorAll('.linkrow')].find((r) => r.textContent?.includes('Backups')),
    );
    expect(shell.router.page()?.id).toBe('backup');
    expect(container.textContent).toContain('Restoring adds to what is here');
  });

  it('refuses a backup passphrase that is too short', () => {
    mountShell({ store, container });
    click(byText(container, 'Settings'));
    click(
      [...container.querySelectorAll('.linkrow')].find((r) => r.textContent?.includes('Backups')),
    );

    const input = container.querySelector(
      '[aria-label="A passphrase for this backup"]',
    ) as HTMLInputElement;
    input.value = 'short';
    input.dispatchEvent(new Event('input'));
    const button = [...container.querySelectorAll('button')].find(
      (node) => node.textContent === 'Download a backup',
    );
    click(button);
    expect(container.textContent).toContain('too short');
  });

  it('persists a restored document and keeps the confirmation visible', async () => {
    const adapter = memoryStorageAdapter();
    store.dispose();
    store = createStore({ adapter });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    const backup = structuredClone(store.document());
    backup.kernel.enabledModules = ['sleep'];
    backup.modules['sleep'] = {
      version: 1,
      days: { '2026-09-01': { bed: '23:00', wake: '07:00', hours: '8' } },
    };

    const shell = mountShell({ store, container, modules: [sampleModule()] });
    click(byText(container, 'Settings'));
    click(
      [...container.querySelectorAll('.linkrow')].find((row) =>
        row.textContent?.includes('Backups'),
      ),
    );
    const file = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(file, 'files', {
      value: [{ text: async () => JSON.stringify(backup) }],
    });
    click(byText(container, 'Restore'));

    try {
      await vi.waitFor(() => {
        expect(container.textContent).toContain('1 added, 0 updated.');
      });
      expect(store.document().modules['sleep']).toEqual(backup.modules['sleep']);
      const reopened = createStore({ adapter });
      await reopened.load();
      expect(reopened.document().modules['sleep']).toEqual(backup.modules['sleep']);
      expect(reopened.document().kernel.enabledModules).toEqual(['sleep']);
      reopened.dispose();
    } finally {
      shell.destroy();
      store.dispose();
    }
  });
});

describe('first run: the passcode step', () => {
  /*
   * Offered at first run because that is the only moment forgetting it costs
   * nothing: there is no recovery path, and there is not yet anything to lose.
   *
   * The wording is unconditional rather than conditional, and ADR-039 is why: no
   * page can enumerate browser extensions, and the side channels that remain
   * find only the ones that visibly change a page — never the one that quietly
   * reads what is stored. A check would be silent exactly where the danger is.
   */

  const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  const fill = (label: string, value: string): void => {
    const field = [...container.querySelectorAll('.field')].find((node) =>
      (node.textContent ?? '').includes(label),
    );
    const input = field?.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  function security(change: (current: string, next: string) => Promise<void>) {
    return {
      change,
      remove: async () => undefined,
      lock: async () => undefined,
    };
  }

  /** Through the first two steps, standing on the third. */
  function reachIt(change: (current: string, next: string) => Promise<void>): void {
    mountShell({ store, container, security: security(change) });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
  }

  /** What the status line says, which is not the same as what is on the screen. */
  const said = (): string => container.querySelector('.bmsg')?.textContent ?? '';

  it('is offered, and says what a passcode is for', () => {
    reachIt(async () => undefined);
    expect(container.textContent).toContain('Lock this with a passcode?');
    expect(byText(container, 'Not now')).toBeDefined();
  });

  it('says no site can check which extensions you have, including this one', () => {
    // The load-bearing sentence. A conditional warning would teach people that
    // its absence means checked-and-clear, which would be most wrong exactly
    // where it mattered.
    reachIt(async () => undefined);
    expect(container.textContent).toContain('no site can tell you which extensions you have');
    expect(container.textContent).toContain('including this one');
  });

  it('says what it cannot do as well as what it can', () => {
    reachIt(async () => undefined);
    expect(container.textContent).toContain('cannot protect what is on the screen');
    expect(container.textContent).toContain('no way to recover it');
  });

  it('lets somebody say not now, and finishes', () => {
    let asked = false;
    reachIt(async () => {
      asked = true;
    });
    click(byText(container, 'Not now'));
    expect(store.document().kernel.settings.firstRunComplete).toBe(true);
    expect(asked).toBe(false);
  });

  it('sets the code it was given, and finishes', async () => {
    let given: string | undefined;
    reachIt(async (_current, next) => {
      given = next;
    });
    fill('Passcode', '123456');
    fill('Type it again', '123456');
    click(byText(container, 'Set a passcode'));
    await flush();

    expect(given).toBe('123456');
    expect(store.document().kernel.settings.firstRunComplete).toBe(true);
  });

  it('refuses fewer than six digits, and never hands it on', async () => {
    /*
     * Asserted against the status line and against the setter, not against the
     * whole screen. "Six digits or more" is also the field's permanent hint, so
     * a screen-wide search passes whether or not anything was refused — this
     * test did exactly that, and a mutation that accepted a three-digit code
     * survived it.
     */
    let given: string | undefined;
    reachIt(async (_current, next) => {
      given = next;
    });
    fill('Passcode', '123');
    fill('Type it again', '123');
    click(byText(container, 'Set a passcode'));
    await flush();

    expect(said()).toBe('Six digits or more, numbers only.');
    expect(given).toBeUndefined();
    expect(store.document().kernel.settings.firstRunComplete).not.toBe(true);
  });

  it('refuses two that do not match, and never hands it on', async () => {
    let given: string | undefined;
    reachIt(async (_current, next) => {
      given = next;
    });
    fill('Passcode', '123456');
    fill('Type it again', '123457');
    click(byText(container, 'Set a passcode'));
    await flush();

    expect(said()).toBe('The two do not match.');
    expect(given).toBeUndefined();
    expect(store.document().kernel.settings.firstRunComplete).not.toBe(true);
  });

  it('does not let anybody into an app they believe is encrypted and is not', async () => {
    // The one that matters. If setting the code fails and first run finishes
    // anyway, somebody has been told their record is locked when it is not.
    reachIt(async () => {
      throw new Error('no');
    });
    fill('Passcode', '123456');
    fill('Type it again', '123456');
    click(byText(container, 'Set a passcode'));
    await flush();

    expect(store.document().kernel.settings.firstRunComplete).not.toBe(true);
    expect(container.textContent).toContain('nothing has been encrypted');
  });

  it('is not offered where there is nothing to offer it with', () => {
    // No security means no storage or no crypto. Offering a step that cannot
    // work is worse than not offering it.
    mountShell({ store, container });
    click(byText(container, 'This is for me'));
    click(byText(container, 'Continue'));
    expect(container.textContent).not.toContain('Lock this with a passcode?');
    expect(store.document().kernel.settings.firstRunComplete).toBe(true);
  });
});

describe('the default download', () => {
  /**
   * The shell's own `offerDownload`, exercised through the real backup page
   * rather than injected, because half of what is being pinned is that the
   * default is what runs when nothing is passed in.
   *
   * See the note on `REVOKE_AFTER_MS` in shell.ts: the revoke must not happen
   * on the click's own task.
   */
  it('hands over the file and revokes the object URL later, not on the click', async () => {
    const created = 'blob:adnotia/one';
    const revoked: string[] = [];
    const clicked: { href: string; download: string }[] = [];

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => created);
    URL.revokeObjectURL = vi.fn((url: string) => void revoked.push(url));
    const click_ = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({
        href: this.getAttribute('href') ?? '',
        download: this.getAttribute('download') ?? '',
      });
    });

    try {
      store.updateKernel((kernel) => ({
        ...kernel,
        settings: { ...kernel.settings, firstRunComplete: true },
      }));
      // No offerDownload: this is the case the default exists for.
      mountShell({ store, container });

      click(byText(container, 'Settings'));
      const backups = [...container.querySelectorAll('button.linkrow')].find((row) =>
        row.textContent?.startsWith('Backups'),
      );
      click(backups);

      const passphrase = container.querySelector<HTMLInputElement>(
        'input[aria-label="A passphrase for this backup"]',
      );
      if (passphrase) passphrase.value = 'a-long-enough-passphrase';
      // The card above the button carries the same words, so byText would find
      // the heading first.
      const download = [...container.querySelectorAll('button')].find((node) =>
        node.textContent?.startsWith('Download a'),
      );
      click(download);

      await vi.waitFor(() => expect(clicked).toHaveLength(1));
      expect(clicked[0]!.href).toBe(created);
      expect(clicked[0]!.download).toMatch(/^adnotia-\d{4}-\d{2}-\d{2}\.json$/);

      // The point of the change: still alive when the click returns.
      expect(revoked).toEqual([]);

      await vi.waitFor(() => expect(revoked).toEqual([created]), { timeout: 3000 });
    } finally {
      click_.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
