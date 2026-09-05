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
  type ModuleManifest,
} from "../index";
import { card, chips, el, linkRow, passwordInput } from "../ui/index";
import type { OffTabPage, Router } from "./router";

import { passcodePage, type PasscodeActions } from "./passcode";

import { modulesPage } from "./modules";

export interface SettingsOptions {
  store: KernelStore;
  router: Router;
  /** Hands the finished file to the person. The shell supplies this. */
  offerDownload: (filename: string, content: string) => void;
  onRestored?: () => void;
  security?: PasscodeActions;
  modules?: readonly ModuleManifest[];
  onChanged?: () => void;
}

/** The backup page: export, and restore by merging. */
function backupPage(options: SettingsOptions): OffTabPage {
  let restoreMessage = "";
  return {
    id: "backup",
    title: "Backups",
    render(container) {
      const status = el("p", { class: "sub", role: "status" });

      const encrypt = isCryptoAvailable();
      const passphrase = passwordInput({
        label: "A passphrase for this backup",
        hint: "At least eight characters. It is not your passcode, and there is no way to recover it.",
      });

      passphrase.element.hidden = !encrypt;
      const download = el("button", {
        type: "button",
        class: "btn primary wide",
        text: encrypt ? "Download a backup" : "Download an unencrypted backup",
      });
      download.addEventListener("click", () => {
        const secret = passphrase.value();
        if (encrypt && !isValidBackupPassphrase(secret)) {
          status.textContent =
            "That passphrase is too short. Eight characters or more.";
          return;
        }
        status.textContent = "Preparing the file.";
        void exportBackup(
          options.store.document() as AdnotiaDocument,
          encrypt ? { passphrase: secret } : {},
        )
          .then((file) => {
            options.offerDownload(file.filename, file.content);
            status.textContent = `Saved as ${file.filename}.`;
            passphrase.set("");
          })
          .catch(() => {
            status.textContent =
              "That backup could not be made. Nothing has changed.";
          });
      });

      const restoreStatus = el("p", {
        class: "sub",
        role: "status",
        text: restoreMessage,
      });
      const file = el("input", {
        type: "file",
        accept: ".json,application/json",
      });
      const restorePassphrase = passwordInput({
        label: "The passphrase that backup was made with",
      });

      const restore = el("button", {
        type: "button",
        class: "btn wide",
        text: "Restore",
      });
      restore.addEventListener("click", () => {
        if (restore.disabled) return;
        const chosen = (file as HTMLInputElement).files?.[0];
        if (!chosen) {
          restoreStatus.textContent = "Choose a backup file first.";
          return;
        }
        let applied = false;
        restore.disabled = true;
        restoreStatus.textContent = "Reading the file.";
        void chosen
          .text()
          .then((raw) =>
            restoreBackup(options.store.document() as AdnotiaDocument, raw, {
              passphrase: restorePassphrase.value(),
            }),
          )
          .then(async ({ document: restored, counts }) => {
            options.store.replaceDocument(restored);
            applied = true;
            await options.store.flush();
            restoreMessage =
              `${counts.entriesAdded} added, ${counts.entriesUpdated} updated` +
              (counts.profilesAdded > 0
                ? `, ${counts.profilesAdded} profiles added`
                : "") +
              ".";
            restoreStatus.textContent = restoreMessage;
            restorePassphrase.set("");
            options.onRestored?.();
          })
          .catch(() => {
            restoreMessage = applied
              ? "The backup was merged, but could not be saved. Keep this page open and try saving again."
              : "That file could not be opened. Nothing has changed. Check the passphrase.";
            restoreStatus.textContent = restoreMessage;
          })
          .finally(() => {
            restore.disabled = false;
          });
      });

      container.replaceChildren(
        card({
          title: "Download a backup",
          sub: encrypt
            ? `Everything you have, in one encrypted file called ${backupFilename()}. Keep it somewhere you will find it.`
            : "Encryption is unavailable here. This backup will contain readable data. Keep it somewhere private.",
          children: [passphrase.element, download, status],
        }),
        card({
          title: "Restore from a backup",
          sub: "Restoring adds to what is here rather than replacing it, so nothing you have already recorded is lost.",
          children: [file, restorePassphrase.element, restore, restoreStatus],
        }),
      );
    },
  };
}

/** The settings page itself. */
export function settingsPage(options: SettingsOptions): OffTabPage {
  return {
    id: "settings",
    title: "Settings",
    render(container) {
      const document_ = options.store.document();

      const rows = el("div", {}, [
        linkRow({
          label: "Backups",
          value: document_.kernel.lastBackup ?? "None yet",
          onSelect: () => options.router.openPage(backupPage(options)),
        }),
      ]);

      rows.append(
        linkRow({
          label: "Manage tools",
          onSelect: () =>
            options.router.openPage(
              modulesPage({
                store: options.store,
                modules: options.modules ?? [],
              }),
            ),
        }),
      );
      const space = chips({
        label: "Space",
        options: [
          { v: "adult", l: "Adult" },
          { v: "family", l: "Family" },
        ],
        value: options.store.space(),
        onChange: (value) => {
          if (value !== "adult" && value !== "family") {
            space.set(options.store.space());
            return;
          }
          options.store.useSpace(value);
          options.onChanged?.();
        },
      });

      if (options.security) {
        const actions = options.security;
        rows.append(
          linkRow({
            label: "Passcode",
            value: document_.kernel.settings.passcodeEnabled ? "On" : "Off",
            onSelect: () =>
              options.router.openPage(
                passcodePage({
                  store: options.store,
                  actions,
                  offerDownload: options.offerDownload,
                }),
              ),
          }),
        );
      }

      const privacy = card({
        title: "Where your data is",
        sub:
          "Everything you record stays in this browser. There is no account, no server and " +
          "no analytics, and nothing is ever sent anywhere. Clearing this browser’s data " +
          "deletes all of it, which is why backups matter.",
      });

      if (!isCryptoAvailable()) {
        privacy.append(
          el("p", {
            class: "hint",
            text:
              "This browser cannot encrypt here, so a passcode is unavailable and backups " +
              "would be saved unencrypted. Opening the app over https fixes it.",
          }),
        );
      }

      container.replaceChildren(space.element, rows, privacy);
    },
  };
}
