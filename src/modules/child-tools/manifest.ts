// The handed-over screen.
//
// docs/04-family-space.md: a child module "may declare no `today` fields, no
// `reports`, no free-text inputs and no links. They may read their own slice and
// the parent-configured schedule and chart for that child, and write only tool-
// usage events. A `child` module that declares anything else fails to register."
//
// So this declares tools and a library and nothing else, and the registry
// enforces that rather than trusting it. The parent's configuration arrives as a
// declared dependency, read-only.

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { strings } from './strings';
import { PARENT_MODULE, tools } from './tools';

const manifest: ModuleManifest = {
  id: 'child-tools',
  name: strings.name,
  version: 1,
  tier: 'C',
  audience: 'child',
  summary: strings.summary,

  eligibility: {
    question: strings.eligibility,
    enableIf: 'yes',
    note: strings.eligibilityNote,
  },

  // The routine, the pair and the chart are the parent's. Read-only: a child
  // module is handed slices, never setters for someone else's.
  dependencies: [PARENT_MODULE],

  contributes: {
    tools,
    library,
  },

  fixtures,
};

export default manifest;
