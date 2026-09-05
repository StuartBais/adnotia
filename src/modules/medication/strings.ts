// Every user-facing string, in one place. The option wording is the monolith's,
// which is how a person would actually say it.

export const strings = {
  name: 'Medication log',
  summary:
    'A daily record of dose, cover, side effects and sleep, summarised into one page for your prescriber.',
  eligibility: 'Are you currently taking medication for ADHD?',
  eligibilityNote: 'You can turn this on later if that changes.',

  med: 'What you take',
  dose: 'Dose',
  unit: 'Units',
  times: 'When you take it',
  addTime: 'Add another time',
  adherence: 'How today went with taking it',
  focus: 'Focus and follow-through',
  mood: 'Mood and temper',
  onset: 'When you felt it start working',
  woreOff: 'When you felt it wear off',
  rebound: 'Anything as it wore off',
  reboundTime: 'Roughly when',
  appetite: 'Eating',
  heart: 'Heart',
  side: 'Anything else you noticed',
  severity: 'How bad',
  detailTime: 'Roughly when',
  detailNote: 'Anything worth adding',
} as const;

export const ADHERENCE = [
  { v: 'ontime', l: 'All on time' },
  { v: 'late', l: 'Took it late' },
  { v: 'partial', l: 'Missed a dose' },
  { v: 'none', l: 'Skipped the day' },
] as const;

export const REBOUND = [
  { v: 'none', l: 'None' },
  { v: 'mild', l: 'Mild' },
  { v: 'rough', l: 'Rough' },
] as const;

export const APPETITE = [
  { v: 'normal', l: 'Ate normally' },
  { v: 'reduced', l: 'Ate less' },
  { v: 'barely', l: 'Barely ate' },
] as const;

export const HEART = [
  { v: 'fine', l: 'Fine' },
  { v: 'racy', l: 'Racing or fast' },
  { v: 'palps', l: 'Skipped beats' },
] as const;

export const SIDE = [
  { v: 'headache', l: 'Headache' },
  { v: 'dry', l: 'Dry mouth' },
  { v: 'jitters', l: 'Jittery' },
  { v: 'anxious', l: 'Anxious' },
  { v: 'flat', l: 'Emotionally flat' },
  { v: 'nausea', l: 'Nausea' },
  { v: 'tics', l: 'Tics or twitches' },
  { v: 'sweaty', l: 'Sweaty' },
] as const;

export const SEVERITY = [
  { v: 'mild', l: 'Mild' },
  { v: 'moderate', l: 'Moderate' },
  { v: 'severe', l: 'Severe' },
] as const;

/** Severity as a number, for the grid's shading only. Never shown as a score. */
export const SEVERITY_RANK: Readonly<Record<string, number>> = {
  mild: 1,
  moderate: 2,
  severe: 3,
};

export const UNITS = [
  { v: 'mg', l: 'mg' },
  { v: 'ml', l: 'ml' },
] as const;

export const ANCHORS = {
  focus: [
    '',
    'Scattered all day',
    'Patchy, a couple of good stretches',
    'Mixed, got the essentials done',
    'Mostly on task',
    'Locked in, followed things through',
  ],
  mood: [
    '',
    'Volatile, everything set me off',
    'Short-fused most of the day',
    'Up and down',
    'Mostly steady',
    'Steady, felt like myself',
  ],
} as const;

/** Every option label, for turning a stored value back into words. */
export const LABELS = new Map<string, string>(
  [...ADHERENCE, ...REBOUND, ...APPETITE, ...HEART, ...SIDE, ...SEVERITY].map((option) => [
    option.v,
    option.l,
  ]),
);
