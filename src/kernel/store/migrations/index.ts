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
import { emptyDomains } from '../domains';

export interface MigrationContext {
  now?: Date;
}

/** One step up. Keyed by the version being migrated *from*. */
export type SchemaMigration = (document: unknown, context: MigrationContext) => unknown;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 1 to 2: add the shared domains (ADR-046). Nothing that was there moves or
 * changes. A `domains` object already present is kept, with any of its own keys,
 * and only the parts it lacks are filled in, so running this twice changes
 * nothing.
 */
export function migrateOneToTwo(document: unknown): unknown {
  if (!isObject(document)) throw new Error('That is not an Adnotia document.');
  const held = isObject(document['domains']) ? document['domains'] : {};
  return { ...document, schemaVersion: 2, domains: { ...emptyDomains(), ...held } };
}

/**
 * Version 1 is the first shape anybody's data is in: ADR-042 removed the v0
 * import before release, when there was no v0 data anywhere to import. The
 * first real migration is 1 to 2.
 */
export const schemaMigrations: Readonly<Record<number, SchemaMigration>> = {
  1: migrateOneToTwo,
};

/** The version of a document read back from storage. */
export function detectSchemaVersion(document: unknown): number {
  if (typeof document === 'object' && document !== null) {
    const version = (document as { schemaVersion?: unknown }).schemaVersion;
    if (typeof version === 'number') return version;
  }
  throw new Error('That is not an Adnotia document: it has no schemaVersion.');
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
