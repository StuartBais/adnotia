// Everything this module says.
//
// Written for someone who knows what they need to do and cannot start, which is
// a different problem from not knowing. Nothing here is a productivity system,
// nothing tracks completion rates, and nothing congratulates anybody.

export const strings = {
  name: 'Planning and getting started',
  summary:
    'Break something down, work out how long it will really take, set out a day one line at ' +
    'a time, and sit with one thing for a while.',
  eligibility: 'Would you like help with planning and getting started?',
  eligibilityNote:
    'Five small tools. Most come from the therapy protocols with the best evidence in ' +
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
  promote: 'Bigger than a step',
  promoted: 'Broken down separately',
  promoteHint:
    'Turns this step into a thing of its own, with its own steps, still listed under this one.',
  from: (title: string) => `Came out of: ${title}`,
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
  pick: 'Or one of the things you have broken down',
  picked: (label: string) => `For: ${label}`,
  clear: 'Something else',
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
  pick: 'Or one of the things you have broken down',
  clear: 'Something else',
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

export const FOCUS_STRINGS = {
  title: 'Focus for a while',
  sub:
    'A stretch on one thing, then a break, then another. Pick what you are working on, or ' +
    'just start.',
  /*
   * The intervals are stated as convention, in the tool, not only in the
   * Library. docs/02-evidence-rubric.md puts focus timers at Tier C — no direct
   * trials — and the familiar 25 and 5 are a method somebody wrote down in the
   * nineties, not a finding. Presenting them as settings you may change says
   * that more honestly than any sentence about it could.
   */
  convention:
    'The usual lengths are 25 minutes and 5, with a longer break after four. They are a ' +
    'convention rather than a finding, and they are yours to change.',
  what: 'What are you working on?',
  free: 'Something else',
  freePlaceholder: 'Clear the desk',
  focusLength: 'Focus for (minutes)',
  breakLength: 'Break for (minutes)',
  longLength: 'Longer break (minutes)',
  rounds: 'Longer break after (stretches)',
  lengths: 'Lengths',
  begin: 'Start',
  focusing: (label: string) => `Focusing on: ${label}`,
  focusingNothing: 'Focusing.',
  onBreak: 'On a break.',
  /*
   * What the round position may say, and it is the whole vocabulary for it.
   *
   * It names what comes next, never what has been earned: "a longer break after
   * this one", not "3 of 4". A position in a repeating pattern is not a score,
   * and the difference is that this sentence has no better and worse version.
   */
  nextIsLong: 'A longer break after this one.',
  nextIsShort: 'A short break after this one.',
  timeUp: 'Time is up. Carry on if you are in the middle of something.',
  breakOver: 'Break over.',
  takeBreak: 'Take the break',
  skipBreak: 'Straight on',
  stop: 'Stop',
  kept: (minutes: number, label: string) =>
    `Kept: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} on ${label}.`,
  keptNothing: (minutes: number) =>
    `Kept: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} of focus.`,
  nothing: 'Nothing yet today.',
  /*
   * No limit note of its own.
   *
   * The tool carries `tier: 'C'` and the kernel prints the rubric's Tier C
   * wording above it — "this specific tool has not itself been tested in
   * trials". A second paragraph underneath saying the same thing in different
   * words is how a page teaches somebody to skip both. The mindfulness practice
   * has one because its tool declares no tier; this one does.
   */
  noSound:
    'There is no sound and no notification — nothing here can interrupt you — so this only ' +
    'tells you the time is up when you look at it.',
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
