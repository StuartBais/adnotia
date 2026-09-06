// Mindfulness practice.
//
// Tier B, and the module says so where the practice is rather than only in the
// Library: docs/08-roadmap.md asks that the evidence limits be clear in the
// first paragraph of the entry, and a person about to spend ten minutes on
// something should not have to go to the Library to find out what is behind it.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './records';
import { strings } from './strings';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'mindfulness',
  name: strings.name,
  version: 1,
  tier: 'B',
  audience: 'adult',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  dependencies: [],

  contributes: {
    // No daily question. A practice that asks whether you practised is a streak
    // with extra steps.
    tools,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    library,
  },

  fixtures,
};

export default manifest;
