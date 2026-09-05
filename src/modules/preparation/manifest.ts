// Preparing for an assessment.
//
// The answer to a hole ADR-023 left: neither adult screening instrument can be
// reproduced here without permission, and writing six questions of our own would
// be the exact thing the Library excludes. This does the job the screener was
// there for by the other route — a record instead of a score.
// See docs/decisions/ADR-024-preparing-for-an-assessment.md.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './entries';
import { childhoodSection, entriesSection } from './reports/preparation';
import { strings } from './strings';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'preparation',
  name: strings.name,
  version: 1,
  tier: 'A',
  audience: 'adult',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  dependencies: [],

  contributes: {
    // No `today` fields. This is not a thing to fill in every evening; it is a
    // thing to open when something has just happened.
    tools,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    reports: [entriesSection, childhoodSection],
    library,
  },

  fixtures,
};

export default manifest;
