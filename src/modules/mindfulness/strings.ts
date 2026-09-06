// Everything this module says.

export const strings = {
  name: 'Mindfulness practice',
  summary: 'Three short practices, as words and a timer. No audio, no voice, no subscription.',
  eligibility: 'Would you like a short mindfulness practice to hand?',
  eligibilityNote:
    'The evidence for this in adults with ADHD is real but thin, and the app says so on the ' +
    'practice itself rather than only in the Library.',
} as const;

export const TOOL_STRINGS = {
  title: 'Sit for a few minutes',
  sub: 'Pick one, read the steps, start the timer. Doing it badly still counts as doing it.',
  choose: 'Which one?',
  start: 'The timer is below. Nothing is recorded until you say it happened.',
  log: 'I did this one',
  logged: 'Noted.',
  history: 'When you have practised',
  empty: 'Nothing noted yet.',
  remove: 'Remove',
  /** Deliberately flat. A count that grows is a streak, and there are none here. */
  entry: (name: string, minutes: number) => `${name}, ${minutes} minutes`,
} as const;

export const LIMIT_NOTE =
  'Trials of this in adults with ADHD are small and most were rated low or very low ' +
  'confidence. Worth trying; not proven.';
