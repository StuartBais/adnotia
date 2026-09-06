// Routines and the chart.
//
// The parent half of Milestone 7. What is set up here is what appears on the
// screen handed to the child, and `child-tools` reads it as a declared
// dependency rather than by reaching for it.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { strings } from './strings';
import { tools } from './tools';

const manifest: ModuleManifest = {
  id: 'family-routines',
  name: strings.name,
  version: 1,
  tier: 'A',
  audience: 'parent',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  dependencies: [],

  contributes: {
    // No daily question. A parent-training tool that asks a parent to report
    // nightly on how they parented is not one this app will build.
    tools: tools(),
    library,
  },

  fixtures,
};

export default manifest;
