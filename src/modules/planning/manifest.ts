// Planning and getting started.
//
// The first module that is not about medication, and the one docs/03-scope.md
// has in mind when it says "most adults with ADHD are not on medication at any
// given time, and many never will be".
//
// Tools first, with a daily footprint of one optional question. Two of the four
// tools carry their own Tier C, because the rubric names them; see ADR-025.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './records';
import { strings } from './strings';
import { today } from './today';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'planning',
  name: strings.name,
  version: 1,
  // The rubric's proposal for planning and organisation, unconfirmed like every
  // other tier in this build.
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
    today,
    tools,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    library,
  },

  fixtures,
};

export default manifest;
