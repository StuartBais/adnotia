// The encryption envelope.
//
// Ported from reference/adnotia-v0-monolith.html. The envelope format is
// unchanged between v0 and v1 (docs/06-data-model.md), so a document sealed by
// the monolith opens here and vice versa. reference/README.md lists the crypto
// envelope among the things not to reimplement from scratch.
//
// Parameters are fixed by ADR-007: PBKDF2-SHA256 at 500 000 iterations to an
// AES-GCM-256 key, a fresh IV per write, keys in memory for the page's life only.

/** ADR-007. Stored in the envelope so it can be raised without breaking old data. */
export const PBKDF2_ITERATIONS = 500_000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;

/** Minimums from ADR-007 and docs/05-architecture.md "Crypto". */
export const MIN_PASSCODE_DIGITS = 6;
export const MIN_BACKUP_PASSPHRASE_LENGTH = 8;

export interface Envelope {
  enc: 1;
  v: 1;
  kdf: 'PBKDF2-SHA256';
  iter: number;
  /** base64, 16 bytes */
  salt: string;
  /** base64, 12 bytes, fresh on every write */
  iv: string;
  /** base64 */
  ct: string;
}

/** Thrown when a passcode or passphrase does not open an envelope. */
export class WrongKeyError extends Error {
  constructor(message = 'That does not open this document.') {
    super(message);
    this.name = 'WrongKeyError';
  }
}

/** Thrown when the browser cannot do the crypto at all. */
export class CryptoUnavailableError extends Error {
  constructor(
    message = 'This browser cannot encrypt here. Encryption needs a secure context (https).',
  ) {
    super(message);
    this.name = 'CryptoUnavailableError';
  }
}

/**
 * `crypto.subtle` exists only in a secure context. The single file opened as
 * file:// is the case that matters; the UI says so rather than failing silently.
 * See ADR-003 and ADR-007.
 */
export function isCryptoAvailable(): boolean {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

function requireCrypto(): Crypto {
  if (!isCryptoAvailable()) throw new CryptoUnavailableError();
  return globalThis.crypto;
}

export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomBytes(length: number): Uint8Array {
  return requireCrypto().getRandomValues(new Uint8Array(length));
}

export function randomSalt(): Uint8Array {
  return randomBytes(SALT_BYTES);
}

/**
 * Derive the AES-GCM key. Non-extractable, so it cannot be read back out of the
 * page, and never persisted anywhere.
 */
export async function deriveKey(
  secret: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const subtle = requireCrypto().subtle;
  const base = await subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt `plaintext` into an envelope. A fresh IV every time. */
export async function seal(
  key: CryptoKey,
  salt: Uint8Array,
  plaintext: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<string> {
  const iv = randomBytes(IV_BYTES);
  const ciphertext = await requireCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );
  const envelope: Envelope = {
    enc: 1,
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(ciphertext),
  };
  return JSON.stringify(envelope);
}

/** Decrypt an envelope. A wrong key changes nothing and throws WrongKeyError. */
export async function open(key: CryptoKey, envelope: Envelope): Promise<string> {
  try {
    const plaintext = await requireCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) as BufferSource },
      key,
      fromBase64(envelope.ct) as BufferSource,
    );
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    if (error instanceof CryptoUnavailableError) throw error;
    throw new WrongKeyError();
  }
}

/** Parse a stored string as an envelope, or null if it is plain. */
export function envelopeOf(raw: string): Envelope | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as Envelope).enc === 1 &&
      typeof (parsed as Envelope).ct === 'string'
    ) {
      return parsed as Envelope;
    }
    return null;
  } catch {
    return null;
  }
}

/** Open an envelope with a secret, deriving the key from the envelope's own salt. */
export async function unseal(secret: string, envelope: Envelope): Promise<string> {
  const key = await deriveKey(secret, fromBase64(envelope.salt), envelope.iter);
  return open(key, envelope);
}

// ---------- what counts as a usable secret ----------

/** ADR-007: a numeric passcode of at least six digits. */
export function isValidPasscode(passcode: string): boolean {
  return /^\d+$/.test(passcode) && passcode.length >= MIN_PASSCODE_DIGITS;
}

/** docs/05-architecture.md: a backup passphrase of at least eight characters. */
export function isValidBackupPassphrase(passphrase: string): boolean {
  return passphrase.length >= MIN_BACKUP_PASSPHRASE_LENGTH;
}
