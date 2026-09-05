// Every user-facing string, in one place from the start, so the move to a
// string table is mechanical. See docs/05-architecture.md "Internationalisation".

export const strings = {
  name: 'Sleep',
  summary: 'When you went to bed, when you woke, and how the night went.',
  eligibility: 'Would you like to keep a note of how you sleep?',
  eligibilityNote: 'You can turn this on or off later.',

  bed: 'Lights out',
  wake: 'Awake for the day',
  hours: 'Hours actually asleep',
  hoursHint: 'Filled in from the times above. Change it if time in bed was not time asleep.',
  quality: 'How the night went',
  latency: 'Roughly how long to drop off, in minutes',
  note: 'Anything worth remembering about the night',
} as const;

/** The monolith's wording, which is how a person would actually say it. */
export const NIGHT_QUALITY = [
  { v: 'latency', l: 'Took ages to drop off' },
  { v: 'racing', l: "Couldn't switch my brain off" },
  { v: 'wired', l: 'Wired but exhausted' },
  { v: 'waking', l: 'Woke in the night' },
  { v: 'early', l: 'Woke too early' },
  { v: 'legs', l: 'Restless legs' },
  { v: 'dreams', l: 'Vivid or bad dreams' },
  { v: 'latebed', l: 'Lost track of time, went to bed late' },
  { v: 'long', l: 'Slept far longer than usual' },
  { v: 'groggy', l: 'Rough to wake up' },
  { v: 'aid', l: 'Took something to help me sleep' },
] as const;
