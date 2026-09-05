// The encrypting codec.
//
// This is what makes encryption transparent to modules: the store persists
// through a DocumentCodec and does not know whether the string it hands to
// storage is JSON or an envelope. See docs/01-module-contract.md "State" and
// docs/06-data-model.md "Encryption envelope".

import type { DocumentCodec } from '../store/codec';
import type { AdnotiaDocument } from '../store/document';
import {
  deriveKey,
  envelopeOf,
  fromBase64,
  open,
  randomSalt,
  seal,
  toBase64,
  PBKDF2_ITERATIONS,
  WrongKeyError,
} from './envelope';

export interface PasscodeCodec extends DocumentCodec {
  /** The salt this codec seals with, so the kernel can tell if it has changed. */
  readonly salt: Uint8Array;
  readonly iterations: number;
}

export interface CreatePasscodeCodecOptions {
  /** Reuse an existing salt — from the stored envelope — or mint a new one. */
  salt?: Uint8Array;
  iterations?: number;
}

/**
 * A codec that seals the document under `passcode`.
 *
 * Deriving the key is deliberately slow (500 000 PBKDF2 iterations), so this is
 * done once at unlock and the key held for the page's life, never per write.
 */
export async function createPasscodeCodec(
  passcode: string,
  options: CreatePasscodeCodecOptions = {},
): Promise<PasscodeCodec> {
  const salt = options.salt ?? randomSalt();
  const iterations = options.iterations ?? PBKDF2_ITERATIONS;
  const key = await deriveKey(passcode, salt, iterations);

  return {
    salt,
    iterations,

    async encode(document: AdnotiaDocument) {
      return seal(key, salt, JSON.stringify(document), iterations);
    },

    async decode(raw: string) {
      const envelope = envelopeOf(raw);
      if (envelope === null) {
        // Storage holds a plain document. Reading it is right: the person may
        // have just turned encryption on, and the next write seals it.
        return JSON.parse(raw) as unknown;
      }
      if (envelope.salt !== toBase64(salt)) {
        // A different salt means a different key. Deriving from this passcode
        // would produce a key that cannot open it, and the error would look
        // like a wrong passcode rather than what it is.
        throw new WrongKeyError(
          'This document was sealed with a different passcode. Unlock it with that one.',
        );
      }
      return JSON.parse(await open(key, envelope)) as unknown;
    },
  };
}

/** Read the salt and iteration count out of stored ciphertext, for unlocking. */
export function sealParameters(raw: string): { salt: Uint8Array; iterations: number } | undefined {
  const envelope = envelopeOf(raw);
  if (envelope === null) return undefined;
  return { salt: fromBase64(envelope.salt), iterations: envelope.iter };
}
