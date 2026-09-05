import { describe, expect, it, vi } from 'vitest';
import { mountApplication } from '../../src/kernel/shell/application';
import { createDocument, DOCUMENT_KEY } from '../../src/kernel/store/document';
import { memoryStorageAdapter } from '../../src/kernel/store/adapters';
import { envelopeOf, unseal } from '../../src/kernel/crypto/envelope';

describe('the passcode workflow', () => {
  it('sets, locks, unlocks and removes a code through Settings while retaining the document', async () => {
    const data = createDocument();
    data.kernel.settings.firstRunComplete = true;
    data.modules['future'] = { version: 9, note: 'Synthetic private data' };
    const adapter = memoryStorageAdapter({
      [DOCUMENT_KEY]: JSON.stringify(data),
    });
    const root = document.createElement('div');
    const application = await mountApplication({
      container: root,
      adapter,
      offerDownload: vi.fn(),
      iterations: 1000,
    });
    const click = (text: string) =>
      [...root.querySelectorAll('button')].find((node) => node.textContent === text)!.click();
    const input = (label: string, value: string) => {
      (root.querySelector(`[aria-label="${label}"]`) as HTMLInputElement).value = value;
    };
    function settings(): void {
      click('Settings');
      (
        [...root.querySelectorAll('.linkrow')].find((node) =>
          node.textContent?.startsWith('Passcode'),
        ) as HTMLButtonElement
      ).click();
    }
    async function backup(): Promise<void> {
      input('Backup passphrase', 'synthetic-backup-secret');
      click('Download an encrypted backup');
      await vi.waitFor(() => expect(root.textContent).toContain('Backup downloaded.'));
    }
    try {
      settings();
      await backup();
      input('New passcode', '123456');
      input('Repeat new passcode', '123456');
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await vi.waitFor(() => expect(root.textContent).toContain('Passcode saved.'));
      expect(envelopeOf((await adapter.read(DOCUMENT_KEY))!)).not.toBeNull();
      click('Lock now');
      await vi.waitFor(() => expect(root.textContent).toContain('Unlock your data'));
      expect(root.querySelector('[role="tab"]')).toBeNull();
      input('Passcode', '123456');
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await vi.waitFor(() => expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4));
      settings();
      await backup();
      input('Current passcode', '000000');
      click('Remove passcode');
      await vi.waitFor(() =>
        expect(root.textContent).toContain('That does not open this document.'),
      );
      const encrypted = envelopeOf((await adapter.read(DOCUMENT_KEY))!);
      expect(JSON.parse(await unseal('123456', encrypted!)).modules.future.note).toBe(
        'Synthetic private data',
      );
      input('Current passcode', '123456');
      click('Remove passcode');
      await vi.waitFor(() => expect(root.textContent).toContain('Passcode removed.'));
      const restored = JSON.parse((await adapter.read(DOCUMENT_KEY))!);
      expect(restored.kernel.settings.passcodeEnabled).toBe(false);
      expect(restored.modules.future).toEqual(data.modules['future']);
    } finally {
      application.destroy();
    }
  });
});
