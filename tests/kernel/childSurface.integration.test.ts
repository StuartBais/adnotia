import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MODULES,
  addProfile,
  createStore,
  memoryStorageAdapter,
  mountChildSurface,
  type KernelStore,
} from '../../src/kernel/index';
import { threeDays as parentSetup } from '../../src/modules/family-routines/fixtures/index';

// The milestone's own bar: "a child can use the surface without help, and a
// parent cannot accidentally leave it open." Mounted with the real manifests
// rather than stand-ins, because what is being tested is what actually ships.

describe('the surface a child is handed', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.useSpace('family');
    store.updateFamily(() =>
      addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' }),
    );
    store.useProfile('c_1');
    store.set('family-routines', parentSetup);
    // Something private, belonging to the parent, in the same child's profile.
    store.set('family-observations', {
      version: 1,
      days: { '2026-09-02': { entries: [{ id: 'o1', where: 'home', what: 'A private note' }] } },
    });
  });

  function surface(onLeave = vi.fn()) {
    const built = mountChildSurface({
      store,
      modules: MODULES,
      profileId: 'c_1',
      verify: async (code) => {
        if (code !== '123456') throw new Error('wrong');
      },
      onLeave,
    });
    return { ...built, onLeave, text: (built.element.textContent ?? '').replace(/\s+/g, ' ') };
  }

  it('shows the four things docs/04-family-space.md lists, and only those', () => {
    const { element, text } = surface();
    expect([...element.querySelectorAll('.card > h2')].map((h) => h.textContent)).toEqual([
      'Timer',
      'What is happening',
      'First and then',
      'Your stars',
    ]);
    expect(text).toContain('Getting out in the morning');
    expect(text).toContain('Breakfast');
    expect(text).toContain('Shoes');
    expect(text).toContain('Tablet');
    // The chart is titled once, in the child's own words.
    expect(text).toContain('Your stars');
    expect(text).not.toContain("Sam's chart");
  });

  it('does not carry the parent’s own record onto it', () => {
    // The observation log is in the same child's profile and is not a declared
    // dependency of the child module, so it is not reachable.
    expect(surface().text).not.toContain('A private note');
  });

  it('has no adult module on it at all', () => {
    const text = surface().text;
    for (const name of ['Medication log', 'Sleep', 'Planning and getting started']) {
      expect(text).not.toContain(name);
    }
  });

  it('offers nothing to type and nowhere to go', () => {
    const { element } = surface();
    expect(element.querySelectorAll('input[type="text"], textarea')).toHaveLength(0);
    expect(element.querySelectorAll('a')).toHaveLength(0);
  });

  it('gives a child a timer they can start without reading much', () => {
    const { element } = surface();
    expect(element.querySelector('.timer-face')?.textContent).toBe('5:00');
    const start = [...element.querySelectorAll('button')].find((b) => b.textContent === 'Start');
    expect(start).toBeDefined();
  });

  it('will not let a child change the chart', () => {
    const { element } = surface();
    // Asserted on the controls, not on a phrase: the parent's tool says "Give a
    // star" and the primitive's own button says "Add a star", and checking for
    // one of those two misses the other.
    const labels = [...element.querySelectorAll('button')].map((b) => b.textContent ?? '');
    // \b matters: the timer's button is "Start".
    expect(labels.filter((label) => /\bstars?\b/i.test(label))).toEqual([]);
    const before = JSON.stringify(store.document());
    for (const button of element.querySelectorAll('button')) {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    // The only button that changes anything is the one that asks for the code.
    expect(store.get<{ chart?: { points: number } }>('family-routines')?.chart?.points).toBe(2);
    expect(JSON.parse(before).family.children.c_1.modules['family-routines']).toEqual(
      store.document().family.children.c_1?.modules['family-routines'],
    );
  });

  it('cannot be left by pressing the only thing that leaves', async () => {
    const { element, onLeave } = surface();
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Give it back')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(element.querySelector('.pin')).not.toBeNull();
    expect(onLeave).not.toHaveBeenCalled();

    const code = element.querySelector('.pin') as HTMLInputElement;
    code.value = '000000';
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Continue')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(element.textContent).toContain('did not match'));
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('gives the phone back to the parent code, and only to it', async () => {
    const { element, onLeave } = surface();
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Give it back')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const code = element.querySelector('.pin') as HTMLInputElement;
    code.value = '123456';
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Continue')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(onLeave).toHaveBeenCalledOnce());
  });

  it('never prints, whatever is on it', () => {
    expect(surface().element.getAttribute('data-print')).toBe('never');
  });
});
