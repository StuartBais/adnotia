import { describe, expect, it, vi } from 'vitest';
import { mountShell } from '../../src/kernel/shell/shell';
import { createStore } from '../../src/kernel/store/store';
import sleep from '../../src/modules/sleep/manifest';

describe('choosing a logging day', () => {
  it('edits the chosen past day, disables future days, and retains the date across tabs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 5, 12));
    const store = createStore();
    store.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: ['sleep'],
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    const root = document.createElement('div');
    const shell = mountShell({ store, container: root, modules: [sleep] });
    try {
      (root.querySelector('.datebtn') as HTMLButtonElement).click();
      const days = [...root.querySelectorAll<HTMLButtonElement>('.calday')];
      expect(days.find((day) => day.textContent === '6')?.disabled).toBe(true);
      days.find((day) => day.textContent === '4')!.click();
      const bed = root.querySelector('[aria-label="Lights out"]') as HTMLInputElement;
      bed.value = '22:00';
      bed.dispatchEvent(new Event('input'));
      const slice = store.get<{ days: Record<string, { bed: string }> }>('sleep')!;
      expect(slice.days['2026-09-04']?.bed).toBe('22:00');
      expect(slice.days['2026-09-05']).toBeUndefined();
      shell.router.goTab('records');
      shell.router.goTab('today');
      expect((root.querySelector('[aria-label="Lights out"]') as HTMLInputElement).value).toBe(
        '22:00',
      );
    } finally {
      shell.destroy();
      store.dispose();
      vi.useRealTimers();
    }
  });
});
