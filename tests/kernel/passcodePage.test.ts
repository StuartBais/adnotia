import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../../src/kernel/store/store';
import { passcodePage } from '../../src/kernel/shell/passcode';

describe('passcode settings', () => {
  it('requires an encrypted backup before setting a code and masks every secret', async () => {
    const store = createStore();
    const container = document.createElement('div');
    const actions = {
      change: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
      lock: vi.fn(),
    };
    const offerDownload = vi.fn();
    passcodePage({ store, actions, offerDownload }).render(container);
    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset.disabled).toBe(true);
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(4);
    const input = (label: string) =>
      container.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
    input('Backup passphrase').value = 'synthetic-backup-secret';
    (container.querySelector('button') as HTMLButtonElement).click();
    try {
      await vi.waitFor(() => expect(offerDownload).toHaveBeenCalled());
      expect(JSON.parse(offerDownload.mock.calls[0]![1]).enc).toBe(1);
      expect(fieldset.disabled).toBe(false);
      input('New passcode').value = '123456';
      input('Repeat new passcode').value = '123456';
      container.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await vi.waitFor(() => expect(actions.change).toHaveBeenCalledWith('', '123456'));
    } finally {
      store.dispose();
    }
  });
});
