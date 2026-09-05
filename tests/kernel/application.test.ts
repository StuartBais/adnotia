import { describe, expect, it, vi } from "vitest";
import { mountApplication } from "../../src/kernel/shell/application";
import { createPasscodeCodec } from "../../src/kernel/crypto/codec";
import { envelopeOf, unseal } from "../../src/kernel/crypto/envelope";
import { createDocument, DOCUMENT_KEY } from "../../src/kernel/store/document";
import { memoryStorageAdapter } from "../../src/kernel/store/adapters";
import { V0_KEY } from "../../src/kernel/store/migrations/index";

function submit(root: HTMLElement, code: string): void {
  (
    root.querySelector('input[aria-label="Passcode"]') as HTMLInputElement
  ).value = code;
  root
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { cancelable: true }));
}

describe("encrypted application startup", () => {
  it("keeps the shell hidden until the right passcode is entered", async () => {
    const document = createDocument();
    document.kernel.settings = {
      firstRunComplete: true,
      passcodeEnabled: true,
    };
    const codec = await createPasscodeCodec("123456", { iterations: 1000 });
    const raw = await codec.encode(document);
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: raw });
    const root = globalThis.document.createElement("div");
    const application = await mountApplication({ container: root, adapter });
    try {
      expect(root.querySelector('[role="tab"]')).toBeNull();
      submit(root, "000000");
      await vi.waitFor(() =>
        expect(root.textContent).toContain("Nothing has changed."),
      );
      expect(await adapter.read(DOCUMENT_KEY)).toBe(raw);
      submit(root, "123456");
      await vi.waitFor(() =>
        expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4),
      );
    } finally {
      application.destroy();
    }
  });

  it("imports encrypted legacy data under encryption and leaves its original key intact", async () => {
    const codec = await createPasscodeCodec("123456", { iterations: 1000 });
    const raw = await codec.encode({
      entries: { "2026-09-01": { dose: "30", med: "Synthetic" } },
    } as never);
    const adapter = memoryStorageAdapter({ [V0_KEY]: raw });
    const root = document.createElement("div");
    const application = await mountApplication({ container: root, adapter });
    try {
      submit(root, "123456");
      await vi.waitFor(() =>
        expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4),
      );
      expect(await adapter.read(V0_KEY)).toBe(raw);
      const imported = envelopeOf((await adapter.read(DOCUMENT_KEY))!);
      expect(imported).not.toBeNull();
      const document = JSON.parse(await unseal("123456", imported!));
      expect(document.modules.medication.days["2026-09-01"].dose).toBe("30");
      expect(document.kernel.settings.passcodeEnabled).toBe(true);
    } finally {
      application.destroy();
    }
  });

  it("leaves unrecognisable data untouched and shows a recoverable error", async () => {
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: "invalid-data" });
    const root = document.createElement("div");
    const application = await mountApplication({ container: root, adapter });
    expect(root.textContent).toContain("Your data could not be opened");
    expect(await adapter.read(DOCUMENT_KEY)).toBe("invalid-data");
    application.destroy();
  });
});
