import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/kernel/store/store';
import { mountShell } from '../../src/kernel/shell/shell';

describe('space settings', () => {
  it('keeps a selection when tapped again and preserves Adult data across space changes', () => {
    const store = createStore();
    store.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: ['sleep'],
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    store.set('sleep', { version: 1, note: 'Kept in Adult space' });
    const root = document.createElement('div');
    const shell = mountShell({ store, container: root });
    const click = (text: string) =>
      [...root.querySelectorAll('button')].find((node) => node.textContent === text)!.click();
    try {
      click('Settings');
      click('Adult');
      expect(root.querySelectorAll('[aria-label="Space"] [aria-pressed="true"]')).toHaveLength(1);
      click('Family');
      expect(store.space()).toBe('family');
      click('Adult');
      expect(store.space()).toBe('adult');
      expect(store.get('sleep')).toEqual({
        version: 1,
        note: 'Kept in Adult space',
      });
      expect(store.document().kernel.enabledModules).toEqual(['sleep']);
    } finally {
      shell.destroy();
      store.dispose();
    }
  });
});
