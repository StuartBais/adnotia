import { describe, expect, it } from "vitest";
import {
  guardedStorageAdapter,
  memoryStorageAdapter,
  StorageChangedError,
} from "../../src/kernel/store/adapters";
import { createStore } from "../../src/kernel/store/store";
import { createDocument, DOCUMENT_KEY } from "../../src/kernel/store/document";
import { createPasscodeCodec } from "../../src/kernel/crypto/codec";

describe("stale-tab protection", () => {
  it("does not let an older plaintext tab overwrite newly encrypted data", async () => {
    const initial = JSON.stringify(createDocument());
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: initial });
    const first = createStore({
      adapter: guardedStorageAdapter(adapter, DOCUMENT_KEY, initial),
    });
    const stale = createStore({
      adapter: guardedStorageAdapter(adapter, DOCUMENT_KEY, initial),
    });
    await first.load();
    await stale.load();
    try {
      await first.setCodec(
        await createPasscodeCodec("123456", { iterations: 1000 }),
        true,
      );
      const encrypted = await adapter.read(DOCUMENT_KEY);
      stale.set("sleep", { version: 1, note: "Unsaved local changes" });
      await expect(stale.flush()).rejects.toBeInstanceOf(StorageChangedError);
      expect(await adapter.read(DOCUMENT_KEY)).toBe(encrypted);
      expect(stale.get("sleep")).toEqual({
        version: 1,
        note: "Unsaved local changes",
      });
    } finally {
      first.dispose();
      stale.dispose();
    }
  });
});
