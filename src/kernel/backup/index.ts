// Backup export and restore.
//
// A backup is the whole document, every slice, enabled or not, encrypted with a
// passphrase the person chooses for that export — separate from the app
// passcode. See docs/06-data-model.md "Backup file" and ADR-007.

import {
  deriveKey,
  envelopeOf,
  isCryptoAvailable,
  isValidBackupPassphrase,
  randomSalt,
  seal,
  unseal,
  MIN_BACKUP_PASSPHRASE_LENGTH,
} from '../crypto/index';
import { toIsoDate } from '../dates/index';
import { migrateDocument } from '../store/migrations/index';
import type { AdnotiaDocument } from '../store/document';
import { mergeDocuments, type RestoreCounts } from './merge';

export { mergeDocuments, type RestoreCounts } from './merge';

export interface BackupFile {
  filename: string;
  content: string;
  /**
   * False only when the browser cannot encrypt. The UI says so rather than
   * letting a plain file leave the device silently.
   */
  encrypted: boolean;
}

export function backupFilename(now: Date = new Date()): string {
  return `adnotia-${toIsoDate(now)}.json`;
}

export interface ExportOptions {
  /** Omit only when encryption is unavailable, and say so to the person. */
  passphrase?: string;
  now?: Date;
  /** Lowered in tests only. */
  iterations?: number;
}

/**
 * Produce a backup file. The passphrase is chosen per export and is not the app
 * passcode: a backup leaves the device and is the likeliest leak (ADR-007).
 */
export async function exportBackup(
  document: AdnotiaDocument,
  options: ExportOptions = {},
): Promise<BackupFile> {
  const now = options.now ?? new Date();
  const filename = backupFilename(now);
  const json = JSON.stringify(document);

  if (options.passphrase === undefined) {
    if (isCryptoAvailable()) {
      throw new Error(
        'A backup needs a passphrase. Export without one only when this browser cannot encrypt.',
      );
    }
    return { filename, content: json, encrypted: false };
  }

  if (!isValidBackupPassphrase(options.passphrase)) {
    throw new Error(
      `A backup passphrase needs at least ${MIN_BACKUP_PASSPHRASE_LENGTH} characters.`,
    );
  }

  // A salt of its own, so the backup key and the passcode key are unrelated.
  const salt = randomSalt();
  const key = await deriveKey(options.passphrase, salt, options.iterations);
  return {
    filename,
    content: await seal(key, salt, json, options.iterations),
    encrypted: true,
  };
}

export interface RestoreOptions {
  passphrase?: string;
  now?: Date;
}

export interface RestoreResult {
  document: AdnotiaDocument;
  counts: RestoreCounts;
}

/**
 * Read a backup file and merge it into the live document.
 *
 * Order is fixed by docs/06-data-model.md: decrypt, migrate the restored
 * document to the current schema version, then merge — never replace.
 *
 * A wrong passphrase changes nothing: this returns a new document and touches
 * neither storage nor its inputs.
 */
export async function restoreBackup(
  current: AdnotiaDocument,
  raw: string,
  options: RestoreOptions = {},
): Promise<RestoreResult> {
  const envelope = envelopeOf(raw);

  let json: string;
  if (envelope === null) {
    json = raw;
  } else {
    if (options.passphrase === undefined) {
      throw new Error('This backup is encrypted. It needs the passphrase it was made with.');
    }
    json = await unseal(options.passphrase, envelope);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error('That file is not an Adnotia backup.');
  }

  const migrated = migrateDocument(parsed, { now: options.now ?? new Date() });
  return mergeDocuments(current, migrated);
}

/** True for a file that will need a passphrase before it can be restored. */
export function backupIsEncrypted(raw: string): boolean {
  return envelopeOf(raw) !== null;
}
