// Everything this module says.
//
// Written for someone who has begun to wonder whether the way their life goes is
// a thing with a name. That person is often embarrassed, often has been told they
// are lazy, and is usually trying to decide whether they are making a fuss.
// Nothing here tells them either way.

export const strings = {
  name: 'Preparing for an assessment',
  summary:
    'A place to write down specific examples, so a first appointment is spent on your ' +
    'life rather than on trying to remember it.',
  eligibility: 'Are you thinking about seeking an assessment, or waiting for one?',
  eligibilityNote:
    'This is a notebook, not a test. It cannot tell you whether you have ADHD, and it ' +
    'does not try.',
} as const;

/** Where something happened. Settings, because assessment asks about settings. */
export const WHERE = [
  { v: 'work', l: 'At work' },
  { v: 'home', l: 'At home' },
  { v: 'study', l: 'Studying' },
  { v: 'driving', l: 'Driving or travelling' },
  { v: 'social', l: 'With other people' },
  { v: 'admin', l: 'Paperwork and money' },
  { v: 'elsewhere', l: 'Somewhere else' },
] as const;

export const LABELS = new Map<string, string>(WHERE.map((option) => [option.v, option.l]));

export const TOOL_STRINGS = {
  title: 'Write down what happened',
  sub:
    'One thing at a time, while it is fresh. Short is fine. Specific is what a clinician ' +
    'can use; "I am disorganised" is not, and "I missed the deadline because I did not open ' +
    'the email for nine days" is.',
  when: 'When did it happen?',
  where: 'Where?',
  what: 'What happened?',
  whatHint: 'In your own words, the way you would tell a friend.',
  before: 'What was going on beforehand?',
  beforeHint: 'Tired, hungry, just switched from something else, or nothing in particular.',
  cost: 'What did it cost you?',
  costHint: 'Money, time, a relationship, sleep, or nothing much this time.',
  add: 'Save this one',
  added: 'Saved.',
  needWhat: 'Write what happened, and it will save.',
  remove: 'Remove this entry',
  listTitle: 'What you have written down',
  empty: 'Nothing yet. The first one is the hardest and they get quicker.',
} as const;

export const CHILDHOOD_STRINGS = {
  title: 'Before you were twelve',
  sub:
    'An assessment will ask whether this was there in childhood, and it is the question ' +
    'people find hardest to answer in the room. It is much easier to answer from notes.',
  wherePrompts: [
    'School reports, if anyone kept them. Teachers wrote plainly and the phrasing is often ' +
      'unmistakable years later.',
    'A parent, an older sibling, or anyone who knew you then. What they remember is evidence ' +
      'a clinician can use, and asking is allowed.',
    'Old appraisals, university feedback, or anything else written by someone assessing you.',
    'Your own memories, dated as well as you can. "Always in trouble for talking, every year ' +
      'of primary school" is worth writing down.',
  ],
  label: 'What you have found so far',
  hint: 'Add to it whenever something surfaces. There is no right length.',
  saved: 'Saved.',
} as const;

export const REPORT_STRINGS = {
  title: 'What happened, and when',
  childhoodHeading: 'Before I was twelve',
  emptyChildhood: 'Nothing recorded here yet.',
  coverage: (entries: number, weeks: number, settings: string) =>
    `${entries} ${entries === 1 ? 'entry' : 'entries'} across ${weeks} ` +
    `${weeks === 1 ? 'week' : 'weeks'}${settings === '' ? '' : `, from ${settings}`}.`,
  legend:
    'Written by the person these are about, at the time or shortly after. Nothing here is ' +
    'scored or rated.',
} as const;
