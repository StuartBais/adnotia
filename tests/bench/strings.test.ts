import { describe, expect, it } from 'vitest';
import * as format from '../../src/bench/format';
import * as strings from '../../src/bench/strings';
import {
  ANNOUNCE,
  HINT,
  SAY,
  capsuleLabel,
  focusContextLabel,
  idleItemLabel,
  keptAtStep,
  litLabel,
  nothingRunningLabel,
  resumedAt,
  say,
  startInsteadSentence,
  type SpokenNow,
} from '../../src/bench/strings';

// The words the prototype shows and says, held to design/lantern/SPEC.md.
// Format rules: PROTOTYPE-PLAN.md section 7. Spoken words: SPEC section 11,
// whose examples are copied here as they are written there.

const ten23 = new Date('2026-11-24T10:23:00');

describe('format.ts', () => {
  it('writes the long date the board writes, in British English', () => {
    expect(format.longDate('2026-11-24')).toBe('Tuesday 24 November');
    expect(format.longDate(new Date('2026-12-14T09:12:00'))).toBe('Monday 14 December');
  });

  it('writes the clock as drawn: 24-hour, no leading zero on the hour, no seconds', () => {
    expect(format.clock24('10:30')).toBe('10:30');
    expect(format.clock24('14:00')).toBe('14:00');
    expect(format.clock24('09:58')).toBe('9:58');
    expect(format.clock24('00:05')).toBe('0:05');
    expect(format.clock24(new Date('2026-11-24T10:23:59'))).toBe('10:23');
    expect(format.clock24(new Date('2026-11-24T09:58:00'))).toBe('9:58');
    expect(() => format.clock24('24:00')).toThrow(RangeError);
  });

  it('writes minutes under an hour as the board does', () => {
    expect(format.duration(25)).toBe('25 min');
    expect(format.inDuration(25)).toBe('in 25 min');
    expect(format.minutesLeft(18)).toBe('18 min left');
    expect(format.minutesSoFar(27)).toBe('27 min so far');
    expect(format.ofEstimate(25)).toBe('of 25');
    expect(format.estimateWords(25)).toBe('estimate 25');
  });

  it('writes an hour or more as hours and minutes (undrawn; a proposal)', () => {
    expect(format.duration(60)).toBe('1 h');
    expect(format.duration(80)).toBe('1 h 20 min');
    expect(format.inDuration(80)).toBe('in 1 h 20 min');
    expect(format.minutesLeft(125)).toBe('2 h 5 min left');
    expect(format.ofEstimate(90)).toBe('of 1 h 30 min');
    expect(format.estimateWords(90)).toBe('estimate 1 h 30 min');
  });

  it('speaks lengths in words, singular where it is one', () => {
    expect(format.durationSpoken(25)).toBe('25 minutes');
    expect(format.durationSpoken(1)).toBe('1 minute');
    expect(format.durationSpoken(60)).toBe('1 hour');
    expect(format.durationSpoken(121)).toBe('2 hours 1 minute');
  });

  it('never writes a negative or fractional length', () => {
    expect(format.duration(-3)).toBe('0 min');
    expect(format.duration(24.6)).toBe('25 min');
  });

  it('counts steps and joins parts with the middle dot', () => {
    expect(format.stepCount(3)).toBe('3 steps');
    expect(format.stepCount(1)).toBe('1 step');
    expect(format.dotted('3 steps', '25 min', undefined, 'would end about 10:23')).toBe(
      '3 steps · 25 min · would end about 10:23',
    );
  });
});

describe('strings.ts, against SPEC 11', () => {
  const running: SpokenNow = {
    paused: false,
    step: 'Write the question',
    position: { number: 2, count: 3 },
    title: 'Write the school email',
    minutes: { kind: 'left', left: 18, estimate: 25, endsAt: ten23 },
    note: 'When is the permission slip due?',
  };

  it('names the lit block on Today', () => {
    expect(litLabel(running)).toBe(
      'Now: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23. Note: When is the permission slip due?',
    );
  });

  it('names the lit block when paused, with no end time', () => {
    expect(
      litLabel({
        ...running,
        paused: true,
        minutes: { kind: 'left', left: 18, estimate: 25, endsAt: undefined },
      }),
    ).toBe(
      'Paused: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left. Note: When is the permission slip due?',
    );
  });

  it('says "Timer stopped" where the screen does, for a clock the app closed', () => {
    expect(
      litLabel({
        ...running,
        paused: true,
        lead: 'Timer stopped',
        minutes: { kind: 'over', soFar: 25, estimate: 25 },
      }),
    ).toBe(
      'Timer stopped: Write the question. Step 2 of 3 of Write the school email. 25 minutes so far, estimate 25. Note: When is the permission slip due?',
    );
  });

  it('names the capsule, and its paused and used-up forms', () => {
    expect(capsuleLabel(running)).toBe(
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
    );
    const over = capsuleLabel({
      ...running,
      paused: true,
      minutes: { kind: 'over', soFar: 27, estimate: 25 },
    });
    expect(over.startsWith('Paused:')).toBe(true);
    expect(over.endsWith('27 minutes so far, estimate 25.')).toBe(true);
  });

  it('says Paused on the capsule, as it draws, where Today says "Timer stopped"', () => {
    expect(
      capsuleLabel({
        ...running,
        paused: true,
        lead: 'Timer stopped',
        minutes: { kind: 'over', soFar: 25, estimate: 25 },
      }),
    ).toBe(
      'Paused: Write the question, step 2 of 3 of Write the school email. 25 minutes so far, estimate 25.',
    );
  });

  it('names a task with no steps by its title alone, and a clock with no estimate', () => {
    expect(
      capsuleLabel({
        ...running,
        step: 'Bins out',
        position: undefined,
        title: 'Bins out',
        minutes: { kind: 'countUp', soFar: 7 },
      }),
    ).toBe('Now: Bins out. 7 minutes so far.');
  });

  it('gives each control the name and hint SPEC 11 gives it', () => {
    expect(say.stepDone('Write the question')).toBe('Step done: Write the question');
    expect(SAY.pause).toBe('Pause');
    expect(SAY.resume).toBe('Resume');
    expect(say.setAside('Write the school email', 2)).toBe(
      'Set aside Write the school email. It keeps its place at step 2.',
    );
    expect(SAY.addFive).toBe('Add 5 minutes');
    expect(say.backTo('Today')).toBe('Back to Today');
    expect(HINT.timerKeepsRunning).toBe('The timer keeps running.');
    expect(HINT.showsRestOfToday).toBe('Shows the rest of today.');
    expect(SAY.handleHalf).toBe('Rest of today');
    expect(SAY.hide).toBe('Hide the rest of today');
    expect(say.undoStepDone('Find the school address')).toBe(
      'Undo step done: Find the school address',
    );
    expect(say.markDone('Renew the parking permit')).toBe('Mark done: Renew the parking permit');
    expect(say.undoDone('Renew the parking permit')).toBe('Undo done: Renew the parking permit');
    expect(SAY.openInbox).toBe('Open the inbox');
    expect(HINT.opensNewest).toBe('Opens at the newest items.');
    expect(SAY.startInstead).toBe('Start this instead');
    expect(say.startInsteadHint('Write the school email', 2)).toBe(
      'Stops the timer on Write the school email. It keeps its place at step 2.',
    );
    expect(say.doneRow('Bins out')).toBe('Bins out, done');
    expect(say.routineRow('Morning', 6, true)).toBe('Morning, 6 steps, ran today');
    expect(say.routineRow('Sunday reset', 7, false)).toBe('Sunday reset, 7 steps');
    expect(HINT.opensRoutine).toBe('Opens the routine.');
    expect(SAY.capture).toBe('Capture');
    expect(SAY.captureDraftKept).toBe('Capture, draft kept');
    expect(HINT.capture).toBe('Write something down. It goes to the inbox.');
    expect(HINT.me).toBe('Settings and help.');
    expect(HINT.meKeepsDraft).toBe('Keeps your draft.');
    expect(HINT.opensFocus).toBe('Opens focus.');
    expect(SAY.timeLeft).toBe('Time left');
    expect(say.meterValue(18, 25)).toBe('18 of 25 minutes left');
  });

  it('announces what SPEC 11 announces', () => {
    expect(ANNOUNCE.saved).toBe('Saved to inbox');
    expect(ANNOUNCE.stepDone('Read it once and send')).toBe(
      'Step done. Now: Read it once and send',
    );
    expect(ANNOUNCE.started('Call the dentist', 'Write the school email', 2)).toBe(
      'Started Call the dentist. Write the school email keeps its place at step 2.',
    );
    expect(ANNOUNCE.paused).toBe('Paused');
    expect(ANNOUNCE.done('Renew the parking permit')).toBe('Done: Renew the parking permit');
    expect(ANNOUNCE.undone).toBe('Undone');
    expect(ANNOUNCE.now('Write the question')).toBe('Now: Write the question');
  });

  it('reads the screens in the words SPEC 11 lists them in', () => {
    expect(focusContextLabel('Write the school email', { number: 2, count: 3 })).toBe(
      'Focus, Write the school email, step 2 of 3',
    );
    expect(focusContextLabel('Write the school email', { number: 2, count: 3 }, 'Paused')).toBe(
      'Focus, Paused, Write the school email, step 2 of 3',
    );
    expect(focusContextLabel('Renew the parking permit', undefined, 'Paused')).toBe(
      'Focus, Paused, Renew the parking permit',
    );
    expect(nothingRunningLabel(new Date('2026-11-24T10:30:00'))).toBe(
      'Nothing running, free until 10:30',
    );
    expect(
      idleItemLabel({
        title: 'Write the school email',
        firstStep: 'Find the school address',
        stepsLeft: 3,
        minutes: 25,
        endsAbout: ten23,
      }),
    ).toBe(
      "First on today's list: Write the school email. Starts with Find the school address. 3 steps, 25 minutes, would end about 10:23",
    );
  });

  it('writes the lines the board writes around Start this instead', () => {
    expect(startInsteadSentence('Write the school email', 2)).toBe(
      'Starting this stops the timer on Write the school email. It keeps its place at step 2.',
    );
    expect(keptAtStep('Write the school email', 2)).toBe('Write the school email at step 2');
    expect(resumedAt('Write the school email', 2)).toBe('Write the school email, step 2');
  });

  it('holds no word the design rules out, and no exclamation mark', () => {
    const { texts, silent } = everythingIn(strings);
    expect(silent, 'functions that said nothing for any sample').toEqual([]);
    expect(texts.size).toBeGreaterThan(200);
    const ruledOut = /!|overdue|\blate\b|missed|behind|streak|welcome back|great job|forg[eo]t/i;
    expect([...texts].filter((text) => ruledOut.test(text))).toEqual([]);
  });
});

/**
 * Every string strings.ts can produce: its constants, at any depth, and what
 * each of its functions returns for every combination of sample arguments, one
 * more than it declares so a defaulted parameter is reached too. The samples
 * reach both sides of each branch: a step and none, an end time and none, a
 * paused present and a running one, every kind of clock. A function that says
 * nothing for any of them is reported, so a new one cannot slip past unread.
 */
function everythingIn(module: Record<string, unknown>): { texts: Set<string>; silent: string[] } {
  const minutes = [
    { kind: 'left', left: 18, estimate: 25, endsAt: ten23 },
    { kind: 'left', left: 1, estimate: 1, endsAt: undefined },
    { kind: 'over', soFar: 27, estimate: 25 },
    { kind: 'countUp', soFar: 95 },
  ];
  const present = (paused: boolean, lead?: string) =>
    minutes.map((clock, index) => ({
      paused,
      ...(lead === undefined ? {} : { lead }),
      step: 'Write the question',
      position: index % 2 === 0 ? { number: 2, count: 3 } : undefined,
      title: 'Write the school email',
      minutes: clock,
      note: index % 2 === 0 ? 'When is the permission slip due?' : undefined,
    }));
  const samples: unknown[] = [
    'Write the school email',
    undefined,
    2,
    1,
    0,
    true,
    false,
    'today',
    ten23,
    ['Today', '10:30', '10 minutes'],
    { number: 2, count: 3 },
    ...minutes,
    ...present(false),
    ...present(true),
    ...present(true, 'Timer stopped'),
    {
      title: 'Write the school email',
      firstStep: 'Find the school address',
      stepsLeft: 3,
      minutes: 25,
      endsAbout: ten23,
    },
    {
      title: 'Bins out',
      firstStep: undefined,
      stepsLeft: 1,
      minutes: undefined,
      endsAbout: undefined,
    },
    {
      title: 'Bins out',
      firstStep: undefined,
      stepsLeft: 0,
      minutes: undefined,
      endsAbout: undefined,
    },
  ];
  const texts = new Set<string>();
  const silent: string[] = [];
  const calls = function* (arity: number): Generator<unknown[]> {
    if (arity === 0) {
      yield [];
      return;
    }
    for (const rest of calls(arity - 1)) for (const sample of samples) yield [...rest, sample];
  };
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') texts.add(value);
    else if (typeof value === 'function') {
      let spoke = false;
      for (const args of calls(Math.min(value.length + 1, 3))) {
        try {
          const said: unknown = value(...args);
          if (typeof said === 'string') {
            texts.add(said);
            spoke = true;
          }
        } catch {
          // An argument of the wrong shape: another combination reaches it.
        }
      }
      if (!spoke) silent.push(path);
    } else if (value !== null && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`);
    }
  };
  for (const [name, value] of Object.entries(module)) walk(value, name);
  return { texts, silent };
}
