// Wording for the report view.
//
// Everything a clinician reads is reviewed text and changes go through review;
// see docs/05-architecture.md "Internationalisation". Everything here that a
// clinician reads is ported from the monolith unchanged.

import type { ChipOption } from '../registry/types';

/**
 * The Clinical Global Impression improvement wording, which is what prescribers
 * record at a titration visit. The person picks it themselves; nothing is
 * inferred from the data. See docs/03-scope.md "Hard exclusions".
 */
export const OVERALL: readonly ChipOption[] = [
  { v: 'vmi', l: 'Very much better' },
  { v: 'mi', l: 'Much better' },
  { v: 'min', l: 'A little better' },
  { v: 'nc', l: 'No change' },
  { v: 'mw', l: 'A little worse' },
  { v: 'mmw', l: 'Much worse' },
  { v: 'vmw', l: 'Very much worse' },
];

export const RANGE_OPTIONS: readonly { v: string; l: string }[] = [
  { v: 'since', l: 'since your last appointment' },
  { v: '14', l: 'the last 14 days' },
  { v: '30', l: 'the last 30 days' },
  { v: '90', l: 'the last 90 days' },
  { v: 'all', l: 'everything logged' },
];

export const EXPORT_STRINGS = {
  heading: 'Export',
  sub: 'A single page your prescriber can read in under a minute.',
  rangeLabel: 'Cover',
  overallLabel: 'Overall, compared with before you started',
  overallHint: 'Prescribers record this at every titration visit. Yours goes at the top of the report.',
  print: 'Print or save as PDF',
  copy: 'Copy as text',
  copied: 'Copied. Paste it into an email or your patient portal.',
  copyFailed: "Couldn't copy automatically — try Print instead.",
} as const;

export const QUESTION_STRINGS = {
  heading: 'Questions to ask',
  sub: 'Add them as they occur to you. They print at the end of the report.',
  placeholder: 'Could we try splitting the dose?',
  inputLabel: 'New question',
  add: 'Add',
  remove: 'Remove question',
  appointmentDone: 'I have had the appointment',
  confirm:
    'Mark today as your appointment? Your current questions will be cleared and the report will start covering the time since today.',
} as const;
