// The practices.
//
// Written in plain words from techniques that are described in the published
// programmes rather than transcribed from any script: a technique is not
// copyrightable and a script is, and ADR-023 is a recent enough lesson about
// reproducing other people's material.
//
// No audio. docs/08-roadmap.md rules it out — audio files are either bundle
// weight the performance budget cannot carry or a network request, and this app
// makes none. Text and a timer instead.

export interface Practice {
  id: string;
  name: string;
  minutes: number;
  /** What it is for, in one line. */
  about: string;
  /** The steps, in order. Short enough to read while doing it. */
  steps: string[];
}

export const PRACTICES: readonly Practice[] = [
  {
    id: 'three-minutes',
    name: 'Three minutes',
    minutes: 3,
    about: 'The short one. Made to be done badly, in a corridor, when there is no time.',
    steps: [
      'Notice what is here. Not to fix it — what the thoughts are doing, what the mood is, ' +
        'where the body is tight.',
      'Narrow to the breath. Not deep breaths, just the ones already happening. Follow a few ' +
        'all the way in and all the way out.',
      'Widen again, to the whole body and the room around it, and carry on with the day.',
    ],
  },
  {
    id: 'body-scan',
    name: 'Body scan',
    minutes: 10,
    about: 'Longer, and easier lying down. Attention moving slowly, on purpose.',
    steps: [
      'Lie down or sit however you can stay for ten minutes.',
      'Put attention in the feet. Notice what is there, including nothing.',
      'Move up slowly — legs, hips, back, hands, arms, shoulders, neck, face — staying a ' +
        'little longer than is comfortable in each.',
      'When you find you have been somewhere else for a while, that is the practice, not a ' +
        'failure of it. Go back to wherever you had got to.',
    ],
  },
  {
    id: 'noting',
    name: 'Noting',
    minutes: 5,
    about: 'For a loud head. Naming what pulls, rather than arguing with it.',
    steps: [
      'Sit, and follow the breath.',
      'When something takes the attention, name it in one word — planning, remembering, ' +
        'itching, worrying — and let it be named rather than followed.',
      'Return to the breath. Expect to do this many times; that is what the five minutes are.',
    ],
  },
];

export const byId = (id: string): Practice | undefined =>
  PRACTICES.find((practice) => practice.id === id);
