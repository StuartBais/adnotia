// Everything this module says.
//
// To a parent, plainly. The child never reads any of this — the handed-over
// surface has its own words, and they are shorter.

export const strings = {
  name: 'Routines and the chart',
  summary:
    'Set up what happens in a morning, what comes first and next, and a star chart you run ' +
    'yourself.',
  eligibility: 'Would you like the routine and reward tools?',
  eligibilityNote:
    'These come from parent-training programmes with good evidence for behaviour and for ' +
    'family life. They are not a treatment for attention or impulsivity, and the Library ' +
    'says so in as many words.',
} as const;

export const ROUTINE_STRINGS = {
  title: 'Routines',
  sub:
    'A short list for a part of the day, in order. Three or four steps is usually better ' +
    'than eight — the point is that it is the same every time, not that it is complete.',
  name: 'What is this routine for?',
  namePlaceholder: 'Getting out in the morning',
  step: 'Next step',
  stepPlaceholder: 'Shoes on',
  at: 'At (optional)',
  addStep: 'Add step',
  create: 'Make this routine',
  needName: 'Give it a name first.',
  empty: 'No routines yet.',
  remove: 'Remove',
  removeStep: 'Remove step',
} as const;

export const FIRST_THEN_STRINGS = {
  title: 'First and then',
  sub:
    'The simplest one, and often the only one needed in a difficult moment. Set it here and ' +
    'it shows on the handed-over screen.',
  first: 'First',
  firstPlaceholder: 'Shoes',
  then: 'Then',
  thenPlaceholder: 'Tablet',
  save: 'Set it',
  clear: 'Clear it',
  needBoth: 'Both halves, and it will save.',
  current: (first: string, then: string) => `Showing: first ${first}, then ${then}.`,
  none: 'Nothing set.',
} as const;

export const CHART_STRINGS = {
  title: 'Star chart',
  sub:
    'You run this, not the app. Nothing here awards a star on its own, sends a reminder, or ' +
    'takes one back.',
  earns: 'What earns a star?',
  earnsPlaceholder: 'Getting dressed before breakfast',
  goal: 'How many for the reward? (optional)',
  reward: 'What is the reward? (optional)',
  rewardPlaceholder: 'Choosing Friday’s film',
  save: 'Save the chart',
  needEarns: 'Say what earns a star first.',
  award: 'Give a star',
  awarded: 'Star given.',
  startAgain: 'Start again at zero',
  startAgainConfirm:
    'Start the chart again at zero? Do this when a reward has been earned and you are ' +
    'setting the next one. It is not a way of taking stars back.',
  reached: 'The goal has been reached.',
  none: 'No chart set up yet.',
  neverTakes:
    'There is no button here that removes a star, on purpose. Charts that take points away ' +
    'work less well and feel worse, so this one only ever adds.',
} as const;

export const PRAISE_STRINGS = {
  title: 'Saying what you noticed',
  sub:
    'The other half of a chart, and the half that does the work. Reinforcing what you want ' +
    'more of is one of the two components most strongly associated with things improving.',
  howTitle: 'What makes it land',
  how: [
    'Name the thing, not the child. "You put your shoes on the first time I asked" does more ' +
      'than "good boy".',
    'Say it while it is happening or straight after. Later in the day it has stopped being ' +
      'about anything.',
    'Small and often beats big and rare. The ordinary moments are the ones there are enough ' +
      'of to matter.',
    'It does not have to be warm or performed. Noticing out loud is the whole mechanism.',
  ],
  examplesTitle: 'Instead of, try',
  examples: [
    ['Good girl.', 'You got your bag by yourself. That is the bit we always forget.'],
    ['Well done for being good in the shop.', 'You stayed with the trolley the whole way round.'],
    ['At last.', 'That was hard to start and you started it.'],
    ['Why can you not always be like this?', 'You sat through the whole story. Thank you.'],
  ],
} as const;
