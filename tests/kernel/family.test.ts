import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AGE_BANDS,
  CHILD_STRINGS,
  PROFILE_STRINGS,
  REPORTS,
  addProfile,
  createStore,
  getProfile,
  isValidNickname,
  listProfiles,
  memoryStorageAdapter,
  mountChildSurface,
  profilesPage,
  removeProfile,
  renameProfile,
  type KernelStore,
  type ModuleManifest,
} from '../../src/kernel/index';

// The Family space. See docs/04-family-space.md, which is the authority for
// every constraint asserted here.

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

function childModule(id = 'child-tools'): ModuleManifest {
  return {
    id,
    name: 'Child tools',
    version: 1,
    tier: 'C',
    audience: 'child',
    summary: 's',
    contributes: {
      library: libraryEntry(),
      tools: [
        {
          title: 'A timer',
          icon: 't',
          mount: (container) => {
            container.append(document.createElement('div'));
          },
        },
      ],
    },
  };
}

function adultModule(): ModuleManifest {
  return {
    id: 'medication',
    name: 'Medication log',
    version: 1,
    tier: 'A',
    audience: 'adult',
    summary: 's',
    contributes: {
      library: libraryEntry(),
      tools: [
        {
          title: 'Adult tool',
          icon: 'a',
          mount: (container) => {
            container.append(document.createElement('p'));
          },
        },
      ],
    },
  };
}

describe('child profiles', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.useSpace('family');
  });

  it('asks for a nickname and an age band, and nothing else', () => {
    const family = addProfile(
      { children: {} },
      { nickname: 'Sam', ageBand: '4-11', now: new Date('2026-09-05T00:00:00Z'), id: 'c_1' },
    );
    // docs/04-family-space.md: "nothing else about the child is asked for".
    expect(Object.keys(family.children['c_1']!).sort()).toEqual([
      'ageBand',
      'createdAt',
      'modules',
      'nickname',
    ]);
  });

  it('offers the two bands the document sets out', () => {
    expect(AGE_BANDS.map((band) => band.v)).toEqual(['4-11', '12-17']);
  });

  it('will not take an empty name', () => {
    expect(isValidNickname('  ')).toBe(false);
    expect(isValidNickname('Sam')).toBe(true);
  });

  it('keeps two children apart, slice by slice', () => {
    // docs/04-family-space.md: "two children's data never mix".
    let family = addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' });
    family = addProfile(family, { nickname: 'Alex', ageBand: '12-17', id: 'c_2' });
    store.updateFamily(() => family);

    store.useProfile('c_1');
    store.set('routines', { version: 1, note: 'for Sam' });
    store.useProfile('c_2');
    store.set('routines', { version: 1, note: 'for Alex' });

    expect(store.get<{ note: string }>('routines')?.note).toBe('for Alex');
    store.useProfile('c_1');
    expect(store.get<{ note: string }>('routines')?.note).toBe('for Sam');
  });

  it('takes everything about a child when the profile goes', () => {
    let family = addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' });
    store.updateFamily(() => family);
    store.useProfile('c_1');
    store.set('routines', { version: 1, note: 'for Sam' });

    family = removeProfile(store.document().family, 'c_1');
    store.updateFamily(() => family);

    expect(store.document().family.children['c_1']).toBeUndefined();
    expect(JSON.stringify(store.document())).not.toContain('for Sam');
  });

  it('stops pointing at a profile that has been removed', () => {
    store.updateFamily(() =>
      addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' }),
    );
    store.useProfile('c_1');
    store.updateFamily((family) => removeProfile(family, 'c_1'));
    expect(store.profile()).toBeUndefined();
  });

  it('actually writes the change out, not just into memory', async () => {
    // replace() swaps the in-memory document and nothing else; every writer has
    // to schedule the persist itself. updateFamily did not, so a parent could
    // add a child, see it on the page, and find it gone on the next load.
    const adapter = memoryStorageAdapter();
    const persisted = createStore({ adapter, debounceMs: 0 });
    await persisted.load();
    persisted.useSpace('family');
    // Let the write that useSpace started finish, so the one below has to start
    // its own: a persist already in flight would carry this change out with it
    // and the test would pass whether or not updateFamily scheduled anything.
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await adapter.read('adnotia-v1')).not.toContain('Sam');

    persisted.updateFamily(() =>
      addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' }),
    );

    // Deliberately not flush(): flush writes whether or not anything scheduled
    // one, so it would hide exactly the bug this is here for. Wait for the
    // debounce the write should have started.
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await adapter.read('adnotia-v1')).toContain('Sam');
  });

  it('renames without disturbing anything else', () => {
    const family = addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' });
    const renamed = renameProfile(family, 'c_1', 'Sammy');
    expect(renamed.children['c_1']?.nickname).toBe('Sammy');
    expect(renamed.children['c_1']?.ageBand).toBe('4-11');
  });

  it('lists them oldest first, so the order does not shuffle', () => {
    let family = addProfile(
      { children: {} },
      { nickname: 'Second', ageBand: '4-11', id: 'b', now: new Date('2026-09-02T00:00:00Z') },
    );
    family = addProfile(family, {
      nickname: 'First',
      ageBand: '4-11',
      id: 'a',
      now: new Date('2026-09-01T00:00:00Z'),
    });
    store.updateFamily(() => family);
    expect(listProfiles(store.document()).map((profile) => profile.nickname)).toEqual([
      'First',
      'Second',
    ]);
  });
});

describe('the profiles page', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.useSpace('family');
  });

  function render(confirm: (message: string) => boolean = () => true): HTMLElement {
    const host = document.createElement('div');
    profilesPage({ store, confirm, now: () => new Date('2026-09-05T00:00:00Z') }).render(host);
    return host;
  }

  const type = (host: HTMLElement, value: string): void => {
    const input = host.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const press = (host: HTMLElement, text: string): void => {
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent === text);
    if (button === undefined) throw new Error(`no button "${text}"`);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  it('adds one and starts showing it', () => {
    const host = render();
    type(host, 'Sam');
    press(host, PROFILE_STRINGS.add);
    expect(listProfiles(store.document())).toHaveLength(1);
    expect(getProfile(store.document(), store.profile())?.nickname).toBe('Sam');
  });

  it('will not add one without a name', () => {
    const host = render();
    press(host, PROFILE_STRINGS.add);
    expect(listProfiles(store.document())).toHaveLength(0);
    expect(host.textContent).toContain('A name first');
  });

  it('does not remove a child unless the parent says so', () => {
    const host = render(() => false);
    type(host, 'Sam');
    press(host, PROFILE_STRINGS.add);
    press(host, PROFILE_STRINGS.remove);
    expect(listProfiles(store.document())).toHaveLength(1);
  });

  it('says what removing takes with it', () => {
    const confirm = vi.fn((_message: string) => false);
    const host = render(confirm);
    type(host, 'Sam');
    press(host, PROFILE_STRINGS.add);
    press(host, PROFILE_STRINGS.remove);
    expect(confirm.mock.calls[0]?.[0]).toContain('Everything recorded about them goes too');
    expect(confirm.mock.calls[0]?.[0]).toContain('cannot be undone');
  });

  it('removes when the parent does say so', () => {
    const host = render(() => true);
    type(host, 'Sam');
    press(host, PROFILE_STRINGS.add);
    press(host, PROFILE_STRINGS.remove);
    expect(listProfiles(store.document())).toHaveLength(0);
  });
});

describe('the handed-over surface', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.useSpace('family');
    store.updateFamily(() =>
      addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' }),
    );
    store.useProfile('c_1');
  });

  function surface(modules: ModuleManifest[], onLeave = () => {}) {
    return mountChildSurface({
      store,
      modules,
      profileId: 'c_1',
      verify: async (code) => {
        if (code !== '123456') throw new Error('wrong');
      },
      onLeave,
    });
  }

  it('mounts only child modules, never an adult one', () => {
    // docs/04-family-space.md: no way to reach the parent's data or the Adult space.
    const { element } = surface([adultModule(), childModule()]);
    const titles = [...element.querySelectorAll('.card > h2')].map((h) => h.textContent);
    expect(titles).toContain('A timer');
    expect(titles).not.toContain('Adult tool');
    expect(element.textContent).not.toContain('Medication');
  });

  it('says so plainly when there is nothing to hand over yet', () => {
    expect(surface([adultModule()]).element.textContent).toContain(CHILD_STRINGS.nothing);
  });

  it('names the child and nothing else about them', () => {
    const { element } = surface([childModule()]);
    expect(element.querySelector('.child-who')?.textContent).toBe('Sam');
    expect(element.textContent).not.toContain('4-11');
  });

  it('lets a child enter no text and reach nothing outside', () => {
    const { element } = surface([childModule()]);
    expect(element.querySelectorAll('input[type="text"], textarea')).toHaveLength(0);
    expect(element.querySelectorAll('a')).toHaveLength(0);
  });

  it('will not give the phone back without the code', async () => {
    const onLeave = vi.fn();
    const { element } = surface([childModule()], onLeave);
    const back = [...element.querySelectorAll('button')].find(
      (b) => b.textContent === CHILD_STRINGS.leave,
    )!;
    back.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const code = element.querySelector('.pin') as HTMLInputElement;
    code.value = '000000';
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Continue')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => expect(element.textContent).toContain('did not match'));
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('gives it back when the code is right', async () => {
    const onLeave = vi.fn();
    const { element } = surface([childModule()], onLeave);
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === CHILD_STRINGS.leave)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const code = element.querySelector('.pin') as HTMLInputElement;
    code.value = '123456';
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Continue')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => expect(onLeave).toHaveBeenCalledOnce());
  });

  it('never prints', () => {
    expect(surface([childModule()]).element.getAttribute('data-print')).toBe('never');
  });
});

describe('the Family space’s own reports', () => {
  it('has the two docs/04-family-space.md names, both family-audience', () => {
    expect(REPORTS['screening']?.audience).toBe('family');
    expect(REPORTS['observations']?.audience).toBe('family');
  });

  it('keeps the clinical report adult-only', () => {
    // "The clinical report is adult-only."
    expect(REPORTS['clinical']?.audience).toBe('adult');
  });
});
