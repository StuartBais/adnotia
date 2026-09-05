import { exportBackup } from '../backup/index';
import { isCryptoAvailable, isValidPasscode } from '../crypto/index';
import { toIsoDate } from '../dates/index';
import type { KernelStore } from '../store/store';
import { card, el, passwordInput } from '../ui/index';
import type { OffTabPage } from './router';

export interface PasscodeActions {
  change(current: string, next: string): Promise<void>;
  remove(current: string): Promise<void>;
  lock(): Promise<void>;
}

export function passcodePage(options: {
  store: KernelStore;
  actions: PasscodeActions;
  offerDownload(filename: string, content: string): void;
}): OffTabPage {
  let message = '';
  const page: OffTabPage = {
    id: 'passcode',
    title: 'Passcode',
    render(container) {
      if (!isCryptoAvailable()) {
        container.replaceChildren(
          card({
            title: 'Encryption is unavailable here',
            sub: 'Open Adnotia over HTTPS or in a browser that supports encryption. Nothing has changed.',
          }),
        );
        return;
      }
      const enabled = options.store.document().kernel.settings.passcodeEnabled;
      const status = el('p', { role: 'status', class: 'hint', text: message });
      const backupSecret = passwordInput({
        label: 'Backup passphrase',
        autocomplete: 'new-password',
        hint: 'At least eight characters. Keep this separately from your passcode.',
      });
      const download = el('button', {
        type: 'button',
        class: 'btn',
        text: 'Download an encrypted backup',
      });
      const current = passwordInput({
        label: 'Current passcode',
        numeric: true,
      });
      current.element.hidden = !enabled;
      const next = passwordInput({
        label: 'New passcode',
        numeric: true,
        autocomplete: 'new-password',
        hint: 'Six or more digits.',
      });
      const confirm = passwordInput({
        label: 'Repeat new passcode',
        numeric: true,
        autocomplete: 'new-password',
      });
      const save = el('button', {
        type: 'submit',
        class: 'btn primary',
        text: enabled ? 'Change passcode' : 'Set passcode',
      });
      const remove = el('button', {
        type: 'button',
        class: 'btn',
        text: 'Remove passcode',
      });
      remove.hidden = !enabled;
      const fields = el('fieldset', {}, [
        current.element,
        next.element,
        confirm.element,
        el('div', { class: 'btnrow' }, [save, remove]),
      ]);
      fields.disabled = true;
      const form = el('form', {}, [fields]);
      let backedUp = false;
      let busy = false;

      download.addEventListener('click', () => {
        if (busy) return;
        busy = true;
        download.disabled = true;
        status.textContent = 'Preparing the encrypted backup.';
        void exportBackup(options.store.document(), {
          passphrase: backupSecret.value(),
        })
          .then((backup) => {
            options.offerDownload(backup.filename, backup.content);
            options.store.updateKernel((kernel) => ({
              ...kernel,
              lastBackup: toIsoDate(new Date()),
            }));
            backupSecret.set('');
            backedUp = true;
            fields.disabled = false;
            status.textContent = 'Backup downloaded. Your passcode has not changed.';
          })
          .catch(() => {
            status.textContent =
              'The backup could not be made. Use a passphrase of at least eight characters.';
          })
          .finally(() => {
            busy = false;
            download.disabled = false;
          });
      });

      async function change(removing: boolean): Promise<void> {
        if (!backedUp || busy) return;
        if (!removing && (!isValidPasscode(next.value()) || next.value() !== confirm.value())) {
          status.textContent = 'Enter the same passcode twice, using six or more digits.';
          return;
        }
        busy = true;
        fields.disabled = true;
        download.disabled = true;
        status.textContent = 'Saving the passcode change.';
        try {
          if (removing) await options.actions.remove(current.value());
          else await options.actions.change(current.value(), next.value());
          message = removing
            ? 'Passcode removed. Data in this browser is no longer encrypted.'
            : 'Passcode saved. Data in this browser is encrypted.';
          page.render(container);
        } catch (error) {
          status.textContent =
            error instanceof Error
              ? error.message
              : 'The passcode could not be changed. Nothing has changed.';
          fields.disabled = false;
        } finally {
          current.set('');
          next.set('');
          confirm.set('');
          busy = false;
          download.disabled = false;
        }
      }
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        void change(false);
      });
      remove.addEventListener('click', () => {
        void change(true);
      });
      const lock = el('button', {
        type: 'button',
        class: 'btn',
        text: 'Lock now',
      });
      lock.hidden = !enabled;
      lock.addEventListener('click', () => {
        if (busy) return;
        busy = true;
        lock.disabled = true;
        void options.actions.lock().catch(() => {
          status.textContent =
            'Changes could not be saved. Keep this page open and retry before locking.';
          busy = false;
          lock.disabled = false;
        });
      });
      container.replaceChildren(
        card({
          title: 'Keep a backup first',
          sub: 'Your passcode cannot be recovered. Keep an encrypted backup and its passphrase before changing it. Encryption does not protect data while this page is unlocked or against a compromised host.',
          children: [backupSecret.element, download],
        }),
        card({
          title: enabled ? 'Change or remove passcode' : 'Set a passcode',
          children: [form, lock, status],
        }),
      );
    },
  };
  return page;
}
