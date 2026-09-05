// Everything this module says.
//
// Written for someone who knows what they need to do and cannot start, which is
// a different problem from not knowing. Nothing here is a productivity system,
// nothing tracks completion rates, and nothing congratulates anybody.

export const strings = {
  name: 'Planning and getting started',
  summary:
    'Break something down, work out how long it will really take, and set out a day one ' +
    'line at a time.',
  eligibility: 'Would you like help with planning and getting started?',
  eligibilityNote:
    'Four small tools. They come from the therapy protocols with the best evidence in ' +
    'adults; the tools themselves are ordinary and some have never been tested on their own.',
} as const;

export const BREAK_STRINGS = {
  title: 'Break something down',
  sub:
    'The step that matters is the first one, and it is usually smaller than you think. ' +
    '"Open the document" is a step. "Do the report" is not.',
  what: 'What is the thing?',
  whatPlaceholder: 'Do the tax return',
  step: 'Next step',
  stepPlaceholder: 'Find last year’s one in the drawer',
  addStep: 'Add step',
  addTask: 'Start it',
  startHere: 'Start here',
  needTitle: 'Give it a name first.',
  nothing: 'Nothing broken down yet.',
  done: 'Done',
  undo: 'Not done after all',
  remove: 'Remove',
  finished: 'All the steps are done.',
} as const;

export const ESTIMATE_STRINGS = {
  title: 'How long will this take?',
  sub:
    'Guess before you start, then say what it actually took. After a few, the difference ' +
    'is worth more than the guess.',
  what: 'What are you about to do?',
  whatPlaceholder: 'Reply to the email',
  minutes: 'How many minutes do you think?',
  add: 'Note it down',
  needBoth: 'A name and a number of minutes.',
  actual: 'How long did it take?',
  record: 'Save',
  waiting: 'Not timed yet',
  reality: (r: { timed: number; ratio: number }) =>
    `In the ${r.timed} you have timed, things took about ${r.ratio} times your estimate.`,
  realityHint:
    'That multiplier is your own arithmetic, from your own numbers, and nobody else sees ' +
    'it. Multiplying the next guess by it is the whole trick.',
  tooFew: (n: number) =>
    `Time ${n} more and this will show how your estimates have compared so far.`,
  nothing: 'Nothing estimated yet.',
} as const;

export const PLAN_STRINGS = {
  title: 'A plan for today',
  sub:
    'A few lines, in the order they will happen. A time is optional and often better left ' +
    'off — a list you can follow beats a timetable you cannot.',
  item: 'What is happening?',
  itemPlaceholder: 'Ring the surgery',
  at: 'At (optional)',
  add: 'Add to the plan',
  needItem: 'Write the line first.',
  empty: 'Nothing planned for today yet.',
  remove: 'Remove',
} as const;

export const INTENTION_STRINGS = {
  title: 'If this, then that',
  sub:
    'Deciding in advance what will trigger a thing, so the decision is not waiting for you ' +
    'in the moment. Attach it to something that already happens.',
  cue: 'If',
  cuePlaceholder: 'I put the kettle on',
  action: 'then',
  actionPlaceholder: 'I take the tablet out of the packet',
  add: 'Keep this one',
  needBoth: 'Both halves, and it will save.',
  empty: 'None yet.',
  remove: 'Remove',
} as const;

/** The one daily question. Nothing counts these and nothing adds them up. */
export const HELD = [
  { v: 'followed', l: 'Followed it' },
  { v: 'some', l: 'Some of it' },
  { v: 'other', l: 'The day went another way' },
] as const;

export const HELD_LABELS = new Map<string, string>(HELD.map((option) => [option.v, option.l]));

export const TODAY_STRINGS = {
  held: 'How did the plan go?',
  heldHint: 'Nothing counts these. It is here so the days are comparable to you, later.',
} as const;
