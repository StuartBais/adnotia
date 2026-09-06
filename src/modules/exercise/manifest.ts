// Moving.
//
// A log, not a programme. Tier B, and the limit is stated on the tool as well as
// in the Library, for the same reason mindfulness does it: exercise is the thing
// people are told to do most confidently, and the confidence is not in the
// literature.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { log } from './log';
import { renderRecords } from './records';
import { strings } from './strings';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'exercise',
  name: strings.name,
  version: 1,
  tier: 'B',
  audience: 'adult',
  area: 'movement',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  dependencies: [],

  contributes: {
    // No daily question. "Did you move today?" answered "no" for the fourth day
    // running is a reprimand however it is worded.
    tools,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    log,
    library,
  },

  fixtures,
};

export default manifest;
