// Everything this module says.
//
// Written for a parent who is not sure whether they are overreacting, which is
// the most common reason a first appointment is late. Nothing here tells them
// either way. docs/04-family-space.md: it is "the antidote to both
// over-referral driven by one terrible week and under-referral driven by a
// parent who has normalised a great deal".

export const strings = {
  name: 'What we have noticed',
  summary: 'A dated note of specific things, from home and from school, to take to an appointment.',
  eligibility: 'Would you like somewhere to write down what you notice?',
  eligibilityNote:
    'A notebook, not a test. Nothing here is scored and it cannot tell you whether to seek ' +
    'an assessment.',
} as const;

/** Where it happened. Settings, because assessment asks across settings. */
export const WHERE = [
  { v: 'home', l: 'At home' },
  { v: 'school', l: 'At school' },
  { v: 'out', l: 'Out and about' },
  { v: 'family', l: 'With family or friends' },
  { v: 'elsewhere', l: 'Somewhere else' },
] as const;

export const WHERE_LABELS = new Map<string, string>(WHERE.map((option) => [option.v, option.l]));

export const TOOL_STRINGS = {
  title: 'Write down what happened',
  sub:
    'One thing at a time, while it is fresh. Short is fine. What a clinician can use is ' +
    'specific: not "he never listens", but "asked three times to put shoes on, still ' +
    'barefoot twenty minutes later, then upset when we were late".',
  when: 'When did it happen?',
  where: 'Where?',
  what: 'What happened?',
  whatHint: 'In your own words, the way you would tell someone who was not there.',
  before: 'What was going on beforehand?',
  beforeHint: 'Tired, hungry, just come off a screen, a change of plan, or nothing in particular.',
  helped: 'Did anything help?',
  helpedHint: 'Including "nothing did". That is worth knowing too.',
  add: 'Save this one',
  added: 'Saved.',
  needWhat: 'Write what happened, and it will save.',
  listTitle: 'What you have written down',
  empty: 'Nothing yet. The first one is the hardest and they get quicker.',
  remove: 'Remove',
  noChild: 'Add a child first, and this will have somewhere to go.',
} as const;

export const REPORT_STRINGS = {
  title: 'What we have noticed',
  coverage: (entries: number, weeks: number, settings: string) =>
    `${entries} ${entries === 1 ? 'entry' : 'entries'} across ${weeks} ` +
    `${weeks === 1 ? 'week' : 'weeks'}${settings === '' ? '' : `, from ${settings}`}.`,
  legend:
    'Written by a parent at the time or shortly after. Nothing here is scored or rated, and ' +
    'the entries are chosen by the parent rather than prompted by the app.',
} as const;
