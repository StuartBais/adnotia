// Everything this module says.
//
// The hard part of writing an exercise tool for this app is not saying anything
// that reads as a prescription or a reprimand. It logs what happened. It has no
// target, no goal, no weekly minimum, and nothing to fall short of.

export const strings = {
  name: 'Moving',
  summary: 'A light log of what you did, and a short note about what the evidence actually shows.',
  eligibility: 'Would you like somewhere to note movement?',
  eligibilityNote: 'A log, not a programme. There is no target here and nothing to fall behind on.',
} as const;

/** Ordinary things that count. Not a menu to complete: examples, so the box is easier to fill. */
export const KINDS = [
  { v: 'walk', l: 'A walk' },
  { v: 'cycle', l: 'Cycling' },
  { v: 'run', l: 'Running' },
  { v: 'swim', l: 'Swimming' },
  { v: 'gym', l: 'Weights or the gym' },
  { v: 'sport', l: 'A sport' },
  { v: 'housework', l: 'Housework or the garden' },
  { v: 'other', l: 'Something else' },
] as const;

export const KIND_LABELS = new Map<string, string>(KINDS.map((option) => [option.v, option.l]));

export const TOOL_STRINGS = {
  title: 'Note some movement',
  sub:
    'What it was and roughly how long. Walking to the shop counts, and so does an hour of ' +
    'football; this does not rank them.',
  kind: 'What was it?',
  minutes: 'Roughly how long, in minutes?',
  note: 'Anything worth remembering (optional)',
  notePlaceholder: 'Head was quieter for the rest of the morning',
  add: 'Note it',
  added: 'Noted.',
  needMinutes: 'A number of minutes, and it will save.',
  history: 'What you have noted',
  empty: 'Nothing noted yet.',
  remove: 'Remove',
} as const;

export const LIMIT_NOTE =
  'The clearest finding is a short-lived lift in attention after moving, in small and ' +
  'mixed studies. Worth trying; not proven.';
