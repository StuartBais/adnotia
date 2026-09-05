import { describe, expect, it } from 'vitest';
import {
  createPasscodeCodec,
  createStore,
  deriveKey,
  envelopeOf,
  fromBase64,
  isCryptoAvailable,
  isValidBackupPassphrase,
  isValidPasscode,
  memoryStorageAdapter,
  open,
  randomSalt,
  seal,
  sealParameters,
  toBase64,
  unseal,
  DOCUMENT_KEY,
  IV_BYTES,
  MIN_BACKUP_PASSPHRASE_LENGTH,
  MIN_PASSCODE_DIGITS,
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  WrongKeyError,
} from '../../src/kernel/index';

// See ADR-007 and docs/06-data-model.md "Encryption envelope".
//
// Most tests derive at a low iteration count for speed. The ones that assert the
// shipped parameters use the real ones.

const FAST = 1000;

describe('the parameters ADR-007 fixes', () => {
  it('are what the ADR says', () => {
    expect(PBKDF2_ITERATIONS).toBe(500_000);
    expect(SALT_BYTES).toBe(16);
    expect(IV_BYTES).toBe(12);
    expect(MIN_PASSCODE_DIGITS).toBe(6);
    expect(MIN_BACKUP_PASSPHRASE_LENGTH).toBe(8);
  });

  it('are available in this environment', () => {
    expect(isCryptoAvailable()).toBe(true);
  });
});

describe('sealing and opening', () => {
  it('round-trips a document at the shipped parameters', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt);
    const sealed = await seal(key, salt, '{"hello":"world"}');
    expect(await open(key, envelopeOf(sealed)!)).toBe('{"hello":"world"}');
  });

  it('writes the envelope shape from the data model', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const envelope = envelopeOf(await seal(key, salt, 'plaintext', FAST))!;

    expect(envelope.enc).toBe(1);
    expect(envelope.v).toBe(1);
    expect(envelope.kdf).toBe('PBKDF2-SHA256');
    expect(envelope.iter).toBe(FAST);
    expect(fromBase64(envelope.salt)).toHaveLength(SALT_BYTES);
    expect(fromBase64(envelope.iv)).toHaveLength(IV_BYTES);
    expect(envelope.ct.length).toBeGreaterThan(0);
  });

  it('uses a fresh IV on every write', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const first = envelopeOf(await seal(key, salt, 'same text', FAST))!;
    const second = envelopeOf(await seal(key, salt, 'same text', FAST))!;

    expect(first.iv).not.toBe(second.iv);
    // Same plaintext, same key, different ciphertext. That is the point of the IV.
    expect(first.ct).not.toBe(second.ct);
  });

  it('keeps the salt across writes, so the key stays derivable', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const first = envelopeOf(await seal(key, salt, 'a', FAST))!;
    const second = envelopeOf(await seal(key, salt, 'b', FAST))!;
    expect(first.salt).toBe(second.salt);
  });

  it('leaves no plaintext in the envelope', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const sealed = await seal(key, salt, 'Elvanse 50mg every morning', FAST);
    expect(sealed).not.toContain('Elvanse');
    expect(sealed).not.toContain('50mg');
  });

  it('opens with the secret alone, deriving from the envelope’s own salt', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const sealed = await seal(key, salt, 'the text', FAST);
    expect(await unseal('123456', envelopeOf(sealed)!)).toBe('the text');
  });
});

describe('a wrong key', () => {
  it('throws rather than returning rubbish', async () => {
    const salt = randomSalt();
    const sealed = await seal(await deriveKey('123456', salt, FAST), salt, 'secret', FAST);
    await expect(unseal('654321', envelopeOf(sealed)!)).rejects.toThrow(WrongKeyError);
  });

  it('changes nothing', async () => {
    const salt = randomSalt();
    const sealed = await seal(await deriveKey('123456', salt, FAST), salt, 'secret', FAST);
    const before = String(sealed);
    await unseal('000000', envelopeOf(sealed)!).catch(() => undefined);
    expect(sealed).toBe(before);
    // And the right passcode still opens it.
    expect(await unseal('123456', envelopeOf(sealed)!)).toBe('secret');
  });

  it('is not confused with tampering', async () => {
    const salt = randomSalt();
    const key = await deriveKey('123456', salt, FAST);
    const envelope = envelopeOf(await seal(key, salt, 'secret', FAST))!;
    // AES-GCM is authenticated: a flipped byte fails the tag, not the padding.
    const bytes = fromBase64(envelope.ct);
    bytes[0] = (bytes[0]! ^ 0xff) & 0xff;
    await expect(open(key, { ...envelope, ct: toBase64(bytes) })).rejects.toThrow(WrongKeyError);
  });
});

describe('recognising stored ciphertext', () => {
  it('spots an envelope', async () => {
    const salt = randomSalt();
    const sealed = await seal(await deriveKey('123456', salt, FAST), salt, 'x', FAST);
    expect(envelopeOf(sealed)).not.toBeNull();
  });

  it('says a plain document is plain', () => {
    expect(envelopeOf('{"schemaVersion":1}')).toBeNull();
    expect(envelopeOf('not json at all')).toBeNull();
    expect(envelopeOf('')).toBeNull();
  });

  it('reads back the parameters needed to unlock', async () => {
    const salt = randomSalt();
    const sealed = await seal(await deriveKey('123456', salt, FAST), salt, 'x', FAST);
    const parameters = sealParameters(sealed)!;
    expect(toBase64(parameters.salt)).toBe(toBase64(salt));
    expect(parameters.iterations).toBe(FAST);
  });

  it('has no parameters for a plain document', () => {
    expect(sealParameters('{"schemaVersion":1}')).toBeUndefined();
  });
});

describe('what counts as a usable secret', () => {
  it('accepts a six-digit passcode', () => {
    expect(isValidPasscode('123456')).toBe(true);
    expect(isValidPasscode('12345678')).toBe(true);
  });

  it('refuses a short or non-numeric one', () => {
    expect(isValidPasscode('12345')).toBe(false);
    expect(isValidPasscode('')).toBe(false);
    expect(isValidPasscode('12345a')).toBe(false);
    expect(isValidPasscode('abcdef')).toBe(false);
  });

  it('accepts a backup passphrase of eight characters or more', () => {
    expect(isValidBackupPassphrase('a passphrase')).toBe(true);
    expect(isValidBackupPassphrase('12345678')).toBe(true);
    expect(isValidBackupPassphrase('1234567')).toBe(false);
  });
});

describe('encryption through the store', () => {
  it('writes an envelope to storage, not a readable document', async () => {
    const adapter = memoryStorageAdapter();
    const codec = await createPasscodeCodec('123456', { iterations: FAST });
    const store = createStore({ adapter, codec, debounceMs: 0 });

    store.set('medication', { version: 3, days: { '2026-09-04': { med: 'Elvanse' } } });
    await store.flush();
    store.dispose();

    const stored = (await adapter.read(DOCUMENT_KEY)) as string;
    expect(stored).not.toContain('Elvanse');
    expect(stored).not.toContain('medication');
    expect(envelopeOf(stored)).not.toBeNull();
  });

  it('reads it back with the same passcode', async () => {
    const adapter = memoryStorageAdapter();
    const salt = randomSalt();

    const first = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', { salt, iterations: FAST }),
      debounceMs: 0,
    });
    first.set('medication', { version: 3, days: { '2026-09-04': { med: 'Elvanse' } } });
    await first.flush();
    first.dispose();

    const stored = (await adapter.read(DOCUMENT_KEY)) as string;
    const parameters = sealParameters(stored)!;
    const second = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', parameters),
      debounceMs: 0,
    });
    await second.load();
    expect(second.get('medication')).toEqual({
      version: 3,
      days: { '2026-09-04': { med: 'Elvanse' } },
    });
    second.dispose();
  });

  it('refuses the wrong passcode', async () => {
    const adapter = memoryStorageAdapter();
    const salt = randomSalt();

    const first = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', { salt, iterations: FAST }),
      debounceMs: 0,
    });
    first.set('medication', { version: 3 });
    await first.flush();
    first.dispose();

    const second = createStore({
      adapter,
      codec: await createPasscodeCodec('999999', { salt, iterations: FAST }),
      debounceMs: 0,
    });
    await expect(second.load()).rejects.toThrow(WrongKeyError);
    second.dispose();
  });

  it('reads a plain document, so turning encryption on does not lose it', async () => {
    const adapter = memoryStorageAdapter();
    const plain = createStore({ adapter, debounceMs: 0 });
    plain.set('sleep', { version: 1, days: { '2026-09-04': { bed: '23:40' } } });
    await plain.flush();
    plain.dispose();

    const sealed = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', { iterations: FAST }),
      debounceMs: 0,
    });
    await sealed.load();
    expect(sealed.get('sleep')).toEqual({ version: 1, days: { '2026-09-04': { bed: '23:40' } } });

    // And the next write seals it.
    sealed.set('sleep', { version: 1, days: {} });
    await sealed.flush();
    expect(envelopeOf((await adapter.read(DOCUMENT_KEY)) as string)).not.toBeNull();
    sealed.dispose();
  });

  it('says plainly when a document was sealed under a different passcode', async () => {
    const adapter = memoryStorageAdapter();
    const first = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', { iterations: FAST }),
      debounceMs: 0,
    });
    first.set('medication', { version: 3 });
    await first.flush();
    first.dispose();

    // A codec built with a fresh salt: the passcode may be right, the key is not.
    const second = createStore({
      adapter,
      codec: await createPasscodeCodec('123456', { iterations: FAST }),
      debounceMs: 0,
    });
    await expect(second.load()).rejects.toThrow(/sealed with a different passcode/);
    second.dispose();
  });
});
