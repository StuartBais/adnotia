// The medication log.
//
// The first module and the test of the contract: if the contract cannot express
// something this already does, the contract is wrong, not the log.
// See docs/01-module-contract.md "Worked example".

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './records';
import { sideEffectsSection } from './reports/sideEffects';
import { standingSection } from './reports/standing';
import { strings } from './strings';
import { today } from './today';

const manifest: ModuleManifest = {
  id: 'medication',
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

  // Sleep is read for the waking-day figure in "where things stand". It is
  // optional: without it the section says less rather than guessing.
  dependencies: ['sleep'],

  contributes: {
    today,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    reports: [standingSection, sideEffectsSection],
    library,
  },

  fixtures,
};

export default manifest;
