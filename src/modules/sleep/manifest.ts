// The sleep module.
//
// Split out from the medication log by the contract exercise: people who do not
// take medication have every reason to track sleep, and the medication log reads
// it as an optional dependency for the cover-across-the-day chart rather than
// owning it. See docs/01-module-contract.md "Worked example".

import type { ModuleManifest } from '../../kernel/index';
import { fixtures } from './fixtures/index';
import { library } from './library';
import { renderRecords } from './records';
import { clinicalSection } from './reports/clinical';
import { strings } from './strings';
import { derive, today } from './today';

const manifest: ModuleManifest = {
  id: 'sleep',
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
    today,
    records: { render: renderRecords as (container: HTMLElement, context: unknown) => void },
    reports: [clinicalSection],
    library,
  },

  derive,
  fixtures,
};

export default manifest;
