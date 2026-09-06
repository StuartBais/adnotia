// The observation log.
//
// docs/04-family-space.md calls this "the second job", after deciding whether to
// seek advice at all: "A dated, structured record of specific observations does
// for the parent what the medication log does for an adult: it replaces
// recollection with a record."
//
// It is also the half of Milestone 6 that is not waiting on anyone's permission.
// The Vanderbilt is copyright AAP, All Rights Reserved (ADR-023); a notebook is
// nobody's.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './entries';
import { observationsSection } from './reports/observations';
import { strings } from './strings';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'family-observations',
  name: strings.name,
  version: 1,
  tier: 'A',
  audience: 'parent',
  area: 'observations',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  dependencies: [],

  contributes: {
    // No daily question. A parent already has enough asked of them, and this is
    // a thing to open when something has just happened.
    tools,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    reports: [observationsSection],
    library,
  },

  fixtures,
};

export default manifest;
