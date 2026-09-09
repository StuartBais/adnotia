// The encryption envelope.
//
// Ported from reference/adnotia-v0-monolith.html. The envelope format is
// unchanged between v0 and v1 (docs/06-data-model.md), so a document sealed by
// the monolith opens here and vice versa. reference/README.md lists the crypto
// envelope among the things not to reimplement from scratch.
//
// Parameters are ADR-007 as amended by ADR-041: PBKDF2-SHA256 to an AES-GCM-256
// key, a fresh IV per write, keys in memory for the page's life only.

/**
 * ADR-041 raised this from 500 000. Stored in the envelope, so old data opens at
 * the count it was sealed with and only new seals cost more.
 */
export const PBKDF2_ITERATIONS = 1_200_000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;

/** The version new envelopes are written at. Version 1 is read, never written. */
export const ENVELOPE_VERSION = 2;

/** Minimums from ADR-007 as amended by ADR-041. */
export const MIN_PASSCODE_DIGITS = 6;
export const MIN_BACKUP_PASSPHRASE_LENGTH = 12;

export interface Envelope {
  enc: 1;
  /** 1: no bound header. 2: the header is authenticated (ADR-041). */
  v: 1 | 2;
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
  const base = await subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * The header, as bytes, for AES-GCM to authenticate alongside the ciphertext.
 *
 * Without this the header is unprotected: `iter` could be edited down to 1 and
 * the file would still open, because the count used to derive the key is read
 * from the very field an attacker controls. Binding it means any edit to the
 * version, the KDF, the iteration count or the salt fails decryption instead.
 *
 * The field order here is the format. It is written out explicitly rather than
 * serialising the envelope object, so that adding a field to `Envelope` cannot
 * silently change what old files were sealed against.
 */
function boundHeader(envelope: Pick<Envelope, 'v' | 'kdf' | 'iter' | 'salt'>): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      enc: 1,
      v: envelope.v,
      kdf: envelope.kdf,
      iter: envelope.iter,
      salt: envelope.salt,
    }),
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
  const header = {
    v: ENVELOPE_VERSION,
    kdf: 'PBKDF2-SHA256',
    iter: iterations,
    salt: toBase64(salt),
  } as const;
  const ciphertext = await requireCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      additionalData: boundHeader(header) as BufferSource,
    },
    key,
    new TextEncoder().encode(plaintext),
  );
  const envelope: Envelope = {
    enc: 1,
    ...header,
    iv: toBase64(iv),
    ct: toBase64(ciphertext),
  };
  return JSON.stringify(envelope);
}

/** Decrypt an envelope. A wrong key changes nothing and throws WrongKeyError. */
export async function open(key: CryptoKey, envelope: Envelope): Promise<string> {
  try {
    const plaintext = await requireCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(envelope.iv) as BufferSource,
        // Version 1 sealed nothing alongside the ciphertext, so asking for a
        // bound header would fail every file written before ADR-041.
        ...(envelope.v === 2 ? { additionalData: boundHeader(envelope) as BufferSource } : {}),
      },
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

/**
 * What is wrong with a backup passphrase, in words a person can act on, or
 * undefined when nothing is.
 *
 * ADR-007 accepted that a six-digit passcode is weak against an offline attack
 * and said the backup passphrase "is the one that must be strong". The rule was
 * eight characters of anything, so the mitigation the ADR rested on was never
 * built: eight lowercase letters is a few hours of one GPU. ADR-041 makes the
 * rule match the reasoning.
 *
 * The checks stay few and explainable on purpose. A passphrase this refuses
 * should be one the person can see the problem with once it is named, because
 * the alternative — a meter that says "weak" and will not say why — teaches
 * nothing and gets worked around with an exclamation mark on the end.
 *
 * The backup is the artefact that leaves the device, so this is stricter than
 * the app passcode and costs less: it is chosen once per export, not typed on
 * every open.
 */
export function backupPassphraseProblem(passphrase: string): string | undefined {
  if (passphrase.length < MIN_BACKUP_PASSPHRASE_LENGTH) {
    return `Use at least ${MIN_BACKUP_PASSPHRASE_LENGTH} characters. Four or five ordinary words in a row is easier to remember than a short password, and much harder to break.`;
  }
  if (/^\d+$/.test(passphrase)) {
    return 'Digits alone are guessed quickly, however many there are. Use words as well.';
  }
  if (new Set(passphrase.toLowerCase()).size < 5) {
    return 'This repeats too few different characters to be hard to guess.';
  }

  const flat = passphrase.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (WALKS.some((walk) => flat.length > 0 && (walk.includes(flat) || flat.includes(walk)))) {
    return 'That is a run of keys off the keyboard, which is one of the first things a guessing program tries.';
  }
  if (COMMON.has(flat)) {
    return 'That is one of the most commonly used passwords, so it is already in every guessing list.';
  }
  return undefined;
}

/** True when `backupPassphraseProblem` finds nothing wrong. */
export function isValidBackupPassphrase(passphrase: string): boolean {
  return backupPassphraseProblem(passphrase) === undefined;
}

/**
 * Deliberately tiny. A full breach corpus is megabytes and would have to ship in
 * the bundle and in the single file, which the performance budget will not carry
 * and which would buy little: the length rule already removes the short
 * passwords that make up nearly all of such a list. This catches the handful a
 * person might still reach for after being told to make it longer.
 */
const WALKS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'abcdefghijklmnopqrstuvwxyz',
  '01234567890',
  '09876543210',
];

const COMMON = new Set([
  'password',
  'passphrase',
  'password123',
  'passw0rd',
  'letmein',
  'iloveyou',
  'welcome',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'superman',
  'trustno1',
  'changeme',
  'secret',
  'admin',
  'adnotia',
  'correcthorsebatterystaple',
]);
