import { describe, expect, it } from 'vitest';
import {
  createDocument,
  detectSchemaVersion,
  migrateDocument,
  SCHEMA_VERSION,
} from '../../src/kernel/store/index';

// See docs/06-data-model.md "Migration rules".
//
// What is under test here is the machinery: version detection, the loop, and
// the refusals that stop a bad migration corrupting a document rather than
// failing loudly. The one migration there is, 1 to 2, is tested in
// domains-document.test.ts (ADR-046).

describe('recognising a document', () => {
  it('reads the schema version of a current document', () => {
    expect(detectSchemaVersion(createDocument())).toBe(SCHEMA_VERSION);
  });

  it('refuses something that is not a document at all', () => {
    expect(() => detectSchemaVersion({ hello: 'world' })).toThrow(/not an Adnotia document/);
    expect(() => detectSchemaVersion(null)).toThrow();
    expect(() => detectSchemaVersion('a string')).toThrow();
  });

  it('refuses a document whose version is not a number', () => {
    expect(() => detectSchemaVersion({ schemaVersion: '1' })).toThrow(/not an Adnotia document/);
  });
});

describe('migrating a document', () => {
  it('leaves a document already at the current version alone', () => {
    const doc = createDocument();
    expect(migrateDocument(doc)).toEqual(doc);
  });

  it('is safe to run twice', () => {
    const once = migrateDocument(createDocument());
    expect(migrateDocument(once)).toEqual(once);
  });

  it('hands back a document from a newer build untouched', () => {
    // Unknown fields are preserved everywhere, so an older build must return a
    // newer document intact rather than mangling it down to a shape it knows.
    const fromFuture = { ...createDocument(), schemaVersion: 99, somethingNew: true };
    expect(migrateDocument(fromFuture)).toEqual(fromFuture);
  });

  it('says so when there is no path from a version', () => {
    // The failure that matters once migrations exist: a document from a version
    // this build has no step for must stop, not be silently treated as current.
    expect(() => migrateDocument({ ...createDocument(), schemaVersion: -1 })).toThrow(
      /No migration from schema version -1/,
    );
  });
});
