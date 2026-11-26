// Every word the prototype shows or says, in design/lantern/SPEC.md's own
// wording, so the tests can hold the screens to it (PROTOTYPE-PLAN.md section 5).
//
// Sentence case, no exclamation marks, and none of the words the design rules
// out: nothing is overdue, missed or late, nothing counts what was not done, and
// nothing says how long a person was away. tests/bench/strings.test.ts checks
// the spoken labels against SPEC 11's examples word for word.

import { clock24, durationSpoken } from './format';

/** Words on screen. */
export const T = {
  // The present.
  now: 'Now',
  paused: 'Paused',
  timerStopped: 'Timer stopped',
  focus: 'Focus',
  note: 'Note',
  afterThis: 'After this:',
  stepDone: 'Step done',
  done: 'Done',
  pause: 'Pause',
  resume: 'Resume',
  setAside: 'Set aside',
  addFive: '+5 min',
  start: 'Start',
  startInstead: 'Start this instead',

  // Nothing running.
  nothingRunning: 'Nothing running',
  firstOnList: "First on today's list",
  startsWith: 'Starts with:',
  nextBooked: 'Next booked',
  bookedNow: 'Booked now',
  nothingPlanned: 'Nothing planned for today',
  inboxHelp: 'Anything without a date is in the inbox.',
  openInbox: 'Open the inbox',

  // The drawer and the Next line.
  restOfToday: 'Rest of today',
  laterToday: 'Later today',
  anytimeToday: 'Anytime today',
  doneToday: 'Done today',
  next: 'Next',
  nothingElse: 'Nothing else planned',
  hide: 'Hide',
  undo: 'Undo',

  // The six-second lines after a tap (SPEC 9.8).
  started: 'Started',
  savedToInbox: 'Saved to the inbox',
  resumed: 'Resumed',

  // Capture.
  capture: 'Capture',
  close: 'Close',
  placeholder: "What's on your mind?",
  helpInbox: 'Goes to the inbox with no date. Plan it later if you like.',
  helpToday: "Goes on today's list, anytime.",
  inbox: 'Inbox',
  today: 'Today',
  save: 'Save',

  // Places.
  tasks: 'Tasks',
  comingUp: 'Coming up',
  inboxWaits: 'Anything with no date waits here.',
  routines: 'Routines',
  openRoutine: 'Open a routine to start it.',
  newRoutine: 'New routine',
  ranToday: 'Ran today',
  library: 'Library',
  me: 'Me',
  crisis: 'If things are bad right now',
  settings: 'Settings',
  about: 'About this prototype',
  notInPrototype: 'Not in this prototype.',
  routineNotInPrototype: 'Running a routine is not in this prototype.',

  // A task's page.
  steps: 'Steps',
  addStep: 'Add a step',
} as const;

/** Hints, read after a control's name (SPEC 11). */
export const HINT = {
  opensFocus: 'Opens focus.',
  capture: 'Write something down. It goes to the inbox.',
  timerKeepsRunning: 'The timer keeps running.',
  showsRestOfToday: 'Shows the rest of today.',
  opensNewest: 'Opens at the newest items.',
  opensRoutine: 'Opens the routine.',
  me: 'Settings and help.',
  meKeepsDraft: 'Keeps your draft.',
} as const;

/** Spoken names that are fixed words. */
export const SAY = {
  capture: 'Capture',
  captureDraftKept: 'Capture, draft kept',
  pause: 'Pause',
  resume: 'Resume',
  addFive: 'Add 5 minutes',
  hide: 'Hide the rest of today',
  handleHalf: 'Rest of today',
  openInbox: 'Open the inbox',
  startInstead: 'Start this instead',
  timeLeft: 'Time left',
  me: 'Me',
} as const;

/** Spoken names built from a title or a step. */
export const say = {
  stepDone: (step: string) => `Step done: ${step}`,
  undoStepDone: (step: string) => `Undo step done: ${step}`,
  markDone: (title: string) => `Mark done: ${title}`,
  undoDone: (title: string) => `Undo done: ${title}`,
  // Undo on the Next line names what it takes back (SPEC 11). The board
  // draws the four above and below; Start, Resume and Set aside follow them.
  undoStart: (title: string) => `Undo start: ${title}`,
  undoStartInstead: (kept: string) => `Undo: go back to ${kept}`,
  undoSave: (text: string) => `Undo: remove ${text} from the inbox`,
  undoResume: (title: string) => `Undo resume: ${title}`,
  undoSetAside: (title: string) => `Undo set aside: ${title}`,
  doneRow: (title: string) => `${title}, done`,
  backTo: (place: string) => `Back to ${place}`,
  setAside: (title: string, step: number | undefined) =>
    step === undefined
      ? `Set aside ${title}.`
      : `Set aside ${title}. It keeps its place at step ${step}.`,
  startInsteadHint: (title: string, step: number | undefined) =>
    step === undefined
      ? `Stops the timer on ${title}.`
      : `Stops the timer on ${title}. It keeps its place at step ${step}.`,
  routineRow: (title: string, steps: number, ranToday: boolean) =>
    `${title}, ${steps === 1 ? '1 step' : `${steps} steps`}${ranToday ? ', ran today' : ''}`,
  /** The bar read alone: the meter's value. */
  meterValue: (left: number, estimate: number) =>
    `${left} of ${estimate} ${estimate === 1 ? 'minute' : 'minutes'} left`,
} as const;

/** What the live region says, in order (SPEC 11 "Announcements"). */
export const ANNOUNCE = {
  saved: 'Saved to inbox',
  paused: 'Paused',
  undone: 'Undone',
  /** "Undone. Now: Write the question": what Undo took back, then what is now the case. */
  undoneThen: (now: string) => `Undone. ${now}`,
  stepDone: (next: string) => `Step done. Now: ${next}`,
  started: (title: string, kept: string, step: number | undefined) =>
    step === undefined
      ? `Started ${title}. ${kept} keeps its place.`
      : `Started ${title}. ${kept} keeps its place at step ${step}.`,
  done: (title: string) => `Done: ${title}`,
  now: (step: string) => `Now: ${step}`,
} as const;

/** The sentence under "Start this instead" (SPEC 5.3). */
export function startInsteadSentence(title: string, step: number | undefined): string {
  return step === undefined
    ? `Starting this stops the timer on ${title}.`
    : `Starting this stops the timer on ${title}. It keeps its place at step ${step}.`;
}

/** The six-second line after "Start this instead": "Write the school email at step 2". */
export function keptAtStep(title: string, step: number | undefined): string {
  return step === undefined ? title : `${title} at step ${step}`;
}

/** The six-second line after Resume: "Write the school email, step 2". */
export function resumedAt(title: string, step: number | undefined): string {
  return step === undefined ? title : `${title}, step ${step}`;
}

// ---------------------------------------------------------------- the present

/** What the clock says, for a spoken label. */
export type SpokenMinutes =
  | { kind: 'left'; left: number; estimate: number; endsAt: Date | undefined }
  | { kind: 'over'; soFar: number; estimate: number }
  | { kind: 'countUp'; soFar: number };

/** The present task, as the lantern and the capsule say it. */
export interface SpokenNow {
  paused: boolean;
  /**
   * The word that stands where "Now" does, when it is not "Now" or "Paused":
   * "Timer stopped" for a session the app closed itself, if the owner's
   * setting says so (SPEC 14). Labels use the same words as the screen.
   */
  lead?: string;
  /** The current step, or the task's title when it has no step to show. */
  step: string;
  /** Absent for a task with no steps. */
  position: { number: number; count: number } | undefined;
  title: string;
  minutes: SpokenMinutes;
  note: string | undefined;
}

const leadOf = (now: SpokenNow): string => now.lead ?? (now.paused ? T.paused : T.now);

/** The clock in words: "18 of 25 minutes left, ends 10:23", "27 minutes so far, estimate 25". */
export function minutesSpoken(minutes: SpokenMinutes): string {
  switch (minutes.kind) {
    case 'left': {
      const left = say.meterValue(minutes.left, minutes.estimate);
      return minutes.endsAt === undefined ? left : `${left}, ends ${clock24(minutes.endsAt)}`;
    }
    case 'over':
      return `${durationSpoken(minutes.soFar)} so far, estimate ${minutes.estimate}`;
    case 'countUp':
      return `${durationSpoken(minutes.soFar)} so far`;
  }
}

/**
 * The lit block on Today: "Now: Write the question. Step 2 of 3 of Write the
 * school email. 18 of 25 minutes left, ends 10:23. Note: When is the
 * permission slip due?"
 */
export function litLabel(now: SpokenNow): string {
  const lead = `${leadOf(now)}: ${now.step}.`;
  const where = now.position
    ? ` Step ${now.position.number} of ${now.position.count} of ${now.title}.`
    : '';
  const note = now.note ? ` Note: ${now.note}` : '';
  return `${lead}${where} ${minutesSpoken(now.minutes)}.${note}`;
}

/**
 * The capsule: "Now: Write the question, step 2 of 3 of Write the school
 * email. 18 of 25 minutes left, ends 10:23."
 *
 * It always says Now or Paused, because that is what it draws: "Timer
 * stopped" does not fit its 54 pt first column, so the capsule keeps
 * "Paused" there, and its label uses the same word as the capsule.
 */
export function capsuleLabel(now: SpokenNow): string {
  const where = now.position
    ? `, step ${now.position.number} of ${now.position.count} of ${now.title}`
    : '';
  const lead = now.paused ? T.paused : T.now;
  return `${lead}: ${now.step}${where}. ${minutesSpoken(now.minutes)}.`;
}

/** Focus's context line, a heading: "Focus, Write the school email, step 2 of 3". */
export function focusContextLabel(
  title: string,
  position: { number: number; count: number } | undefined,
  lead?: string,
) {
  const head = lead === undefined ? 'Focus' : `Focus, ${lead}`;
  return position
    ? `${head}, ${title}, step ${position.number} of ${position.count}`
    : `${head}, ${title}`;
}

// ---------------------------------------------------------------- nothing running

/** "Nothing running, free until 10:30". */
export function nothingRunningLabel(freeUntil: Date | undefined): string {
  return freeUntil === undefined
    ? T.nothingRunning
    : `${T.nothingRunning}, free until ${clock24(freeUntil)}`;
}

/**
 * The unlit item: "First on today's list: Write the school email. Starts with
 * Find the school address. 3 steps, 25 minutes, would end about 10:23".
 */
export function idleItemLabel(item: {
  title: string;
  firstStep: string | undefined;
  stepsLeft: number;
  minutes: number | undefined;
  endsAbout: Date | undefined;
}): string {
  const parts: string[] = [];
  if (item.stepsLeft > 0) parts.push(item.stepsLeft === 1 ? '1 step' : `${item.stepsLeft} steps`);
  if (item.minutes !== undefined) parts.push(durationSpoken(item.minutes));
  if (item.endsAbout !== undefined) parts.push(`would end about ${clock24(item.endsAbout)}`);
  const starts = item.firstStep ? ` Starts with ${item.firstStep}.` : '';
  const meta = parts.length > 0 ? ` ${parts.join(', ')}` : '';
  return `${T.firstOnList}: ${item.title}.${starts}${meta}`.trimEnd();
}
