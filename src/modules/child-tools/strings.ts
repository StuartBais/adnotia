// Everything a child reads.
//
// docs/07-design-system.md: "Anything a child reads is concrete and
// present-tense." Short sentences, no instructions to a parent, no explanation
// of what the app is. A child who can read "First shoes, then tablet" can use
// this; a child who cannot can be shown it.
//
// There is no free text anywhere here and nothing to press that leaves.

export const strings = {
  name: 'For your child',
  summary: 'The screen you hand over: a timer, today’s list, first and then, and their stars.',
  eligibility: 'Would you like the screen you can hand to your child?',
  eligibilityNote:
    'It shows only what you set up. There is nothing to type, nothing to buy and nowhere to ' +
    'go from it.',
} as const;

export const TIMER_STRINGS = {
  title: 'Timer',
  choose: 'How long?',
  minutes: (n: number) => `${n} min`,
  done: 'Time is up.',
} as const;

/** Short, round, and picked by tapping rather than typing. */
export const DURATIONS = [1, 2, 5, 10, 20] as const;

export const SCHEDULE_STRINGS = {
  title: 'What is happening',
  none: 'Nothing on the list.',
} as const;

export const FIRST_THEN_STRINGS = {
  title: 'First and then',
  first: 'First',
  then: 'Then',
  none: 'Nothing set.',
} as const;

export const CHART_STRINGS = {
  title: 'Your stars',
  none: 'No stars yet.',
} as const;
