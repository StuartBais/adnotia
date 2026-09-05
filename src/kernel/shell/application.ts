import {
  createPasscodeCodec,
  envelopeOf,
  isCryptoAvailable,
  isValidPasscode,
  sealParameters,
  unseal,
  WrongKeyError,
} from "../crypto/index";
import { createStore, type KernelStore } from "../store/store";
import { plainJsonCodec, type DocumentCodec } from "../store/codec";
import { DOCUMENT_KEY } from "../store/document";
import type { StorageAdapter } from "../store/adapters";
import { migrateDocument, V0_KEY } from "../store/migrations/index";
import type { ModuleManifest } from "../registry/types";
import { card, el, passwordInput } from "../ui/index";
import { mountShell, type Shell } from "./shell";
import type { PasscodeActions } from "./passcode";

import { guardedStorageAdapter } from "../store/adapters";

export interface ApplicationOptions {
  container: HTMLElement;
  adapter: StorageAdapter;
  modules?: readonly ModuleManifest[];
  storageAvailable?: boolean;
  offerDownload?: (filename: string, content: string) => void;
  iterations?: number;
}

export async function mountApplication(
  options: ApplicationOptions,
): Promise<{ destroy(): void }> {
  const { container, adapter } = options;
  let store: KernelStore | undefined;
  let shell: Shell | undefined;
  let destroyed = false;
  let busy = false;

  function failure(message: string): void {
    const retry = el("button", {
      type: "button",
      class: "btn",
      text: "Try again",
    });
    retry.addEventListener("click", () => {
      void start();
    });
    container.replaceChildren(
      el("main", { class: "wrap" }, [
        el("h1", { text: "Adnotia" }),
        card({
          title: "Your data could not be opened",
          sub: message,
          children: [retry],
        }),
      ]),
    );
  }

  function unlock(message = ""): void {
    const secret = passwordInput({ label: "Passcode", numeric: true });
    const status = el("p", { role: "status", class: "hint", text: message });
    const submit = el("button", {
      type: "submit",
      class: "btn primary",
      text: "Unlock",
    });
    const form = el("form", {}, [secret.element, submit, status]);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (busy || secret.value() === "") return;
      submit.disabled = true;
      status.textContent = "Opening your data.";
      const passcode = secret.value();
      secret.set("");
      void start(passcode);
    });
    container.replaceChildren(
      el("main", { class: "wrap" }, [
        el("h1", { text: "Adnotia" }),
        card({
          title: "Unlock your data",
          sub: "Your passcode cannot be recovered. Nothing is sent anywhere.",
          children: [form],
        }),
      ]),
    );
    secret.element.querySelector("input")?.focus();
  }

  async function start(passcode?: string): Promise<void> {
    if (busy || destroyed) return;
    busy = true;
    let candidate: KernelStore | undefined;
    try {
      const current = await adapter.read(DOCUMENT_KEY);
      const legacy = current === null ? await adapter.read(V0_KEY) : null;
      const source = current ?? legacy;
      const encrypted = source !== null && envelopeOf(source) !== null;
      if (encrypted && !isCryptoAvailable()) {
        failure(
          "This browser cannot unlock encrypted data here. Open Adnotia over HTTPS or in a browser that supports encryption. The stored data is unchanged.",
        );
        return;
      }
      if (encrypted && passcode === undefined) {
        unlock();
        return;
      }
      const codec: DocumentCodec = encrypted
        ? await createPasscodeCodec(passcode!, sealParameters(source!))
        : plainJsonCodec;
      candidate = createStore({
        adapter: guardedStorageAdapter(adapter, DOCUMENT_KEY, current),
        codec: {
          encode: (document) => codec.encode(document),
          decode: async (raw) => migrateDocument(await codec.decode(raw)),
        },
      });
      await candidate.load();
      if (legacy !== null) {
        const imported = migrateDocument(await codec.decode(legacy));
        imported.kernel.settings = {
          ...imported.kernel.settings,
          firstRunComplete: true,
          passcodeEnabled: encrypted,
        };
        candidate.replaceDocument(imported);
        await candidate.flush();
      } else if (
        candidate.document().kernel.settings.passcodeEnabled !== encrypted
      ) {
        candidate.updateKernel((kernel) => ({
          ...kernel,
          settings: { ...kernel.settings, passcodeEnabled: encrypted },
        }));
        await candidate.flush();
      }
      if (destroyed) {
        candidate.dispose();
        return;
      }
      store = candidate;
      const active = candidate;
      async function verify(currentPasscode: string): Promise<void> {
        if (!active.document().kernel.settings.passcodeEnabled) return;
        const raw = await adapter.read(DOCUMENT_KEY);
        const envelope = raw === null ? null : envelopeOf(raw);
        if (envelope === null)
          throw new Error(
            "Stored data has changed. Reload before changing the passcode.",
          );
        await unseal(currentPasscode, envelope);
      }
      const security: PasscodeActions = {
        async change(currentPasscode, next) {
          if (!isValidPasscode(next))
            throw new Error("Use a passcode of six or more digits.");
          await verify(currentPasscode);
          const nextCodec = await createPasscodeCodec(
            next,
            options.iterations === undefined
              ? {}
              : { iterations: options.iterations },
          );
          await active.setCodec(nextCodec, true);
        },
        async remove(currentPasscode) {
          await verify(currentPasscode);
          await active.setCodec(plainJsonCodec, false);
        },
        async lock() {
          await active.flush();
          shell?.destroy();
          shell = undefined;
          active.dispose();
          store = undefined;
          await start();
        },
      };
      shell = mountShell({
        container,
        store: active,
        modules: options.modules ?? [],
        storageAvailable: options.storageAvailable ?? true,
        ...(options.offerDownload
          ? { offerDownload: options.offerDownload }
          : {}),
        ...(options.storageAvailable === false ? {} : { security }),
      });
    } catch (error) {
      candidate?.dispose();
      if (destroyed) return;
      if (error instanceof WrongKeyError)
        unlock("That passcode did not open this data. Nothing has changed.");
      else
        failure(
          "The stored data has been left in place. Try again, or open an encrypted backup in another copy of Adnotia.",
        );
    } finally {
      busy = false;
    }
  }

  await start();
  return {
    destroy() {
      destroyed = true;
      shell?.destroy();
      store?.dispose();
      container.replaceChildren();
    },
  };
}
