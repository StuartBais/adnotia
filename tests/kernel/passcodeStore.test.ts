import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore, type KernelStore } from '../../src/kernel/store/store';
import { memoryStorageAdapter } from '../../src/kernel/store/adapters';
import { DOCUMENT_KEY } from '../../src/kernel/store/document';
import { plainJsonCodec } from '../../src/kernel/store/codec';
import { createPasscodeCodec, sealParameters } from '../../src/kernel/crypto/codec';
import { envelopeOf } from '../../src/kernel/crypto/envelope';

const stores: KernelStore[] = [];

afterEach(() => {
  for (const store of stores.splice(0)) store.dispose();
});

describe('changing encryption on a live store', () => {
  it('enables, changes, and removes encryption without losing pending changes', async () => {
    const adapter = memoryStorageAdapter();
    const store = createStore({ adapter });
    stores.push(store);
    await store.load();
    store.set('sleep', { version: 1, note: 'Synthetic private record' });
    const firstCodec = await createPasscodeCodec('123456', {
      iterations: 1000,
    });
    await store.setCodec(firstCodec, true);
    const encrypted = (await adapter.read(DOCUMENT_KEY))!;
    expect(envelopeOf(encrypted)).not.toBeNull();
    expect(encrypted).not.toContain('Synthetic private record');
    expect(store.document().kernel.settings.passcodeEnabled).toBe(true);

    const reopened = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', sealParameters(encrypted)),
    });
    stores.push(reopened);
    await reopened.load();
    expect(reopened.get('sleep')).toEqual(store.get('sleep'));
    const secondCodec = await createPasscodeCodec('654321', {
      iterations: 1000,
    });
    await store.setCodec(secondCodec, true);
    await expect(firstCodec.decode((await adapter.read(DOCUMENT_KEY))!)).rejects.toThrow();
    await store.setCodec(plainJsonCodec, false);
    expect(envelopeOf((await adapter.read(DOCUMENT_KEY))!)).toBeNull();
    expect(store.document().kernel.settings.passcodeEnabled).toBe(false);
    expect(JSON.parse((await adapter.read(DOCUMENT_KEY))!).modules.sleep.note).toBe(
      'Synthetic private record',
    );
  });

  it('keeps the previous codec and settings after a failed encryption write', async () => {
    const adapter = memoryStorageAdapter();
    const store = createStore({ adapter });
    stores.push(store);
    await store.load();
    store.set('sleep', { version: 1, note: 'Kept' });
    await store.flush();
    const original = await adapter.read(DOCUMENT_KEY);
    vi.spyOn(adapter, 'write').mockRejectedValueOnce(new Error('QuotaExceededError'));
    const codec = await createPasscodeCodec('123456', { iterations: 1000 });
    await expect(store.setCodec(codec, true)).rejects.toThrow('QuotaExceededError');
    expect(await adapter.read(DOCUMENT_KEY)).toBe(original);
    expect(store.document().kernel.settings.passcodeEnabled).toBe(false);
    await store.flush();
    expect(envelopeOf((await adapter.read(DOCUMENT_KEY))!)).toBeNull();
    expect(store.get('sleep')).toEqual({ version: 1, note: 'Kept' });
  });
});
