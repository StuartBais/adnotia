// Settings, and the off-tab pages it leads to.
//
// A module may add its own toggles but never a global setting, so this page is
// the kernel's alone. See docs/01-module-contract.md "settings".

import {
  backupFilename,
  exportBackup,
  isCryptoAvailable,
  isValidBackupPassphrase,
  restoreBackup,
  type AdnotiaDocument,
  type KernelStore,
} from '../index';
import { card, el, linkRow, textInput } from '../ui/index';
import type { OffTabPage, Router } from './router';

export interface SettingsOptions {
  store: KernelStore;
  router: Router;
  /** Hands the finished file to the person. The shell supplies this. */
  offerDownload: (filename: string, content: string) => void;
  onRestored?: () => void;
}

/** The backup page: export, and restore by merging. */
function backupPage(options: SettingsOptions): OffTabPage {
  return {
    id: 'backup',
    title: 'Backups',
    render(container) {
      const status = el('p', { class: 'sub', role: 'status' });

      const passphrase = textInput({
        label: 'A passphrase for this backup',
        hint: 'At least eight characters. It is not your passcode, and there is no way to recover it.',
      });

      const download = el('button', {
        type: 'button',
        class: 'btn primary wide',
        text: 'Download a backup',
      });
      download.addEventListener('click', () => {
        const secret = passphrase.value();
        if (!isValidBackupPassphrase(secret)) {
          status.textContent = 'That passphrase is too short. Eight characters or more.';
          return;
        }
        status.textContent = 'Preparing the file.';
        void exportBackup(options.store.document() as AdnotiaDocument, { passphrase: secret })
          .then((file) => {
            options.offerDownload(file.filename, file.content);
            status.textContent = `Saved as ${file.filename}.`;
            passphrase.set('');
          })
          .catch(() => {
            status.textContent = 'That backup could not be made. Nothing has changed.';
          });
      });

      const restoreStatus = el('p', { class: 'sub', role: 'status' });
      const file = el('input', { type: 'file', accept: '.json,application/json' });
      const restorePassphrase = textInput({
        label: 'The passphrase that backup was made with',
      });

      const restore = el('button', { type: 'button', class: 'btn wide', text: 'Restore' });
      restore.addEventListener('click', () => {
        const chosen = (file as HTMLInputElement).files?.[0];
        if (!chosen) {
          restoreStatus.textContent = 'Choose a backup file first.';
          return;
        }
        restoreStatus.textContent = 'Reading the file.';
        void chosen
          .text()
          .then((raw) =>
            restoreBackup(options.store.document() as AdnotiaDocument, raw, {
              passphrase: restorePassphrase.value(),
            }),
          )
          .then(({ counts }) => {
            // Restoring merges. Nothing already here is lost by restoring.
            restoreStatus.textContent =
              `${counts.entriesAdded} added, ${counts.entriesUpdated} updated` +
              (counts.profilesAdded > 0 ? `, ${counts.profilesAdded} profiles added` : '') +
              '.';
            options.onRestored?.();
          })
          .catch(() => {
            restoreStatus.textContent =
              'That file could not be opened. Nothing has changed. Check the passphrase.';
          });
      });

      container.replaceChildren(
        card({
          title: 'Download a backup',
          sub: `Everything you have, in one encrypted file called ${backupFilename()}. Keep it somewhere you will find it.`,
          children: [passphrase.element, download, status],
        }),
        card({
          title: 'Restore from a backup',
          sub: 'Restoring adds to what is here rather than replacing it, so nothing you have already recorded is lost.',
          children: [file, restorePassphrase.element, restore, restoreStatus],
        }),
      );
    },
  };
}

/** The settings page itself. */
export function settingsPage(options: SettingsOptions): OffTabPage {
  return {
    id: 'settings',
    title: 'Settings',
    render(container) {
      const document_ = options.store.document();

      const rows = el('div', {}, [
        linkRow({
          label: 'Backups',
          value: document_.kernel.lastBackup ?? 'None yet',
          onSelect: () => options.router.openPage(backupPage(options)),
        }),
      ]);

      const privacy = card({
        title: 'Where your data is',
        sub:
          'Everything you record stays in this browser. There is no account, no server and ' +
          'no analytics, and nothing is ever sent anywhere. Clearing this browser’s data ' +
          'deletes all of it, which is why backups matter.',
      });

      if (!isCryptoAvailable()) {
        privacy.append(
          el('p', {
            class: 'hint',
            text:
              'This browser cannot encrypt here, so a passcode is unavailable and backups ' +
              'would be saved unencrypted. Opening the app over https fixes it.',
          }),
        );
      }

      container.replaceChildren(rows, privacy);
    },
  };
}
