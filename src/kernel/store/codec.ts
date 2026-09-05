// How the document is turned into the string that is persisted.
//
// The seam exists so encryption can slot in without the store knowing: the
// kernel encrypts the whole document and modules see plain objects. See
// docs/06-data-model.md "Encryption envelope" and ADR-007. Until the crypto
// codec lands, the document is stored as plain JSON.

import type { AdnotiaDocument } from './document';

export interface DocumentCodec {
  encode(document: AdnotiaDocument): Promise<string>;
  decode(raw: string): Promise<unknown>;
}

export const plainJsonCodec: DocumentCodec = {
  async encode(document) {
    return JSON.stringify(document);
  },
  async decode(raw) {
    return JSON.parse(raw) as unknown;
  },
};
