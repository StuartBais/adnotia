// Kernel migrations.
//
// Two levels exist. The kernel migrates the document shape (`schemaVersion`);
// each module migrates its own slice (`manifest.version`). This file is the
// first. See docs/06-data-model.md "Migration rules" and
// docs/05-architecture.md "Migrations".
//
// Rules that hold for every migration here:
//   - pure functions, `(doc) => doc`, applied in order;
//   - safe to run twice;
//   - a migration may rename or restructure but never drops a key it does not
//     recognise.

import { SCHEMA_VERSION, type AdnotiaDocument } from '../document';
import { importV0, isV0Document } from './v0';

export { importV0, isV0Document, V0_KEY, type V0ImportResult } from './v0';

export interface MigrationContext {
  now?: Date;
}

/** One step up. Keyed by the version being migrated *from*. */
export type SchemaMigration = (document: unknown, context: MigrationContext) => unknown;

export const schemaMigrations: Readonly<Record<number, SchemaMigration>> = {
  // v0 is the monolith's flat shape under its own key. See ./v0.ts.
  0: (document, context) => importV0(document, context).document,
};

/**
 * The version of a document read back from storage. A monolith document has no
 * `schemaVersion`; it is recognised by its `entries` map and treated as 0.
 */
export function detectSchemaVersion(document: unknown): number {
  if (typeof document === 'object' && document !== null) {
    const version = (document as { schemaVersion?: unknown }).schemaVersion;
    if (typeof version === 'number') return version;
    if (isV0Document(document)) return 0;
  }
  throw new Error('That is not an Adnotia document: it has no schemaVersion and no entries.');
}

/**
 * Bring a document up to the current schema version, one step at a time.
 *
 * A document from a *newer* build is returned untouched rather than mangled:
 * unknown fields are preserved everywhere, so an older build should hand it
 * back intact if the person opens the newer build again.
 */
export function migrateDocument(
  document: unknown,
  context: MigrationContext = {},
): AdnotiaDocument {
  let current = document;
  let version = detectSchemaVersion(current);

  while (version < SCHEMA_VERSION) {
    const step = schemaMigrations[version];
    if (step === undefined) {
      throw new Error(`No migration from schema version ${version} to ${version + 1}.`);
    }
    current = step(current, context);
    const next = detectSchemaVersion(current);
    if (next <= version) {
      throw new Error(`The migration from schema version ${version} did not raise it.`);
    }
    version = next;
  }

  return current as AdnotiaDocument;
}
