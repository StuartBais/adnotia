import { describe, expect, it } from 'vitest';
import * as model from './index';
import { empty, smallDay, thirtyDays } from './fixtures';

const self = { kind: 'self' } as const;
const sam = { kind: 'child', profileId: 'sam' } as const;
const date = '2026-11-18';
const now = new Date(`${date}T08:00`);

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function one<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('Expected an item');
  return item;
}

describe('routines', () => {
  it('builds a routine step by step, keeping unknown fields and never mutating input', () => {
    const created = model.create(freeze([]), 'Leave the house', now);
    const routine = one(created);
    const withFuture = freeze([{ ...routine, future: { keep: true } }]);
    let routines = model.addStep(withFuture, routine.id, 'Keys', now);
    routines = model.addStep(freeze(routines), routine.id, 'Bag', now, 2);
    routines = model.addStep(freeze(routines), routine.id, 'Lights', now);
    const steps = one(routines).steps;
    expect(steps.map((s) => s.title)).toEqual(['Keys', 'Bag', 'Lights']);
    expect(new Set(steps.map((s) => s.id)).size).toBe(3);
    expect(steps[1]).toMatchObject({ minutes: 2 });
    expect(one(routines).future).toEqual({ keep: true });

    const ids = steps.map((s) => s.id);
    const reordered = model.reorderSteps(freeze(routines), routine.id, [ids[2]!, ids[0]!, ids[1]!]);
    expect(one(reordered).steps.map((s) => s.title)).toEqual(['Lights', 'Keys', 'Bag']);
    expect(() => model.reorderSteps(reordered, routine.id, [ids[0]!, ids[1]!])).toThrow();
    expect(() => model.reorderSteps(reordered, routine.id, [ids[0]!, ids[0]!, ids[1]!])).toThrow();

    const renamed = model.renameStep(reordered, routine.id, ids[0]!, 'Keys and wallet');
    const timed = model.setStepMinutes(freeze(renamed), routine.id, ids[0]!, 1);
    const untimed = model.setStepMinutes(freeze(timed), routine.id, ids[1]!, undefined);
    expect(one(untimed).steps.find((s) => s.id === ids[1])).not.toHaveProperty('minutes');
    expect(one(untimed).steps.find((s) => s.id === ids[0])).toMatchObject({
      title: 'Keys and wallet',
      minutes: 1,
    });

    const fewer = model.removeStep(untimed, routine.id, ids[2]!);
    expect(one(fewer).steps).toHaveLength(2);
    expect(model.rename(fewer, routine.id, 'Out the door')[0]?.title).toBe('Out the door');
    expect(model.remove(fewer, routine.id)).toEqual([]);
  });

  it('anchors a routine to a time or to an event, and can drop the anchor', () => {
    const routines = freeze(model.create([], 'Bedtime', now));
    const id = one(routines).id;
    const byTime = model.setAnchor(routines, id, { kind: 'time', time: '21:30' });
    expect(one(byTime).anchor).toEqual({ kind: 'time', time: '21:30' });
    const byEvent = model.setAnchor(freeze(byTime), id, { kind: 'event', text: 'after the bath' });
    expect(one(byEvent).anchor).toEqual({ kind: 'event', text: 'after the bath' });
    expect(one(model.setAnchor(byEvent, id, undefined))).not.toHaveProperty('anchor');
    expect(() => model.setAnchor(routines, id, { kind: 'time', time: '25:00' })).toThrow();
    expect(() => model.setAnchor(routines, id, { kind: 'event', text: '  ' })).toThrow();
  });

  it('rejects unknown routines, steps and invalid minutes', () => {
    const routines = freeze(model.create([], 'Bedtime', now));
    const id = one(routines).id;
    expect(() => model.rename(routines, 'nope', 'x')).toThrow(RangeError);
    expect(() => model.removeStep(routines, id, 'nope')).toThrow(RangeError);
    expect(() => model.addStep(routines, id, 'x', now, 0)).toThrow(RangeError);
    expect(() => model.addStep(routines, id, 'x', now, Number.NaN)).toThrow(RangeError);
  });
});

describe('runs', () => {
  const routine = one(model.routinesFor(smallDay, self));

  it('starts one run per routine per logging day, and returns the same one if asked again', () => {
    const runs = model.startRun(freeze([]), routine, now);
    expect(runs).toHaveLength(1);
    expect(one(runs)).toMatchObject({ routineId: routine.id, date, ticked: [] });
    expect(model.startRun(freeze(runs), routine, now)).toEqual(runs);

    // A run begun at 00:30 belongs to the evening before.
    const late = model.startRun([], routine, new Date(`${date}T00:30`));
    expect(one(late).date).toBe('2026-11-17');
  });

  it('ticks and unticks steps in any order and finds the next one in routine order', () => {
    let runs = model.startRun([], routine, now);
    const run = one(runs);
    expect(model.nextStep(routine, undefined)?.id).toBe('keys');
    runs = model.tickStep(freeze(runs), routine, run.id, 'bag', now);
    expect(model.nextStep(routine, one(runs))?.id).toBe('keys');
    runs = model.tickStep(freeze(runs), routine, run.id, 'keys', now);
    runs = model.tickStep(freeze(runs), routine, run.id, 'keys', now);
    expect(one(runs).ticked.map((t) => t.stepId)).toEqual(['bag', 'keys']);
    expect(model.nextStep(routine, one(runs))?.id).toBe('lights');
    runs = model.untickStep(freeze(runs), run.id, 'bag');
    expect(model.nextStep(routine, one(runs))?.id).toBe('bag');
    runs = model.tickStep(runs, routine, run.id, 'bag', now);
    runs = model.tickStep(runs, routine, run.id, 'lights', now);
    expect(model.nextStep(routine, one(runs))).toBeUndefined();
    expect(() => model.tickStep(runs, routine, run.id, 'nope', now)).toThrow(RangeError);
  });

  it('refuses to tick a step of one routine on another routine’s run', () => {
    const other = one(model.routinesFor(smallDay, sam));
    const runs = model.startRun([], routine, now);
    expect(() =>
      model.tickStep(runs, { ...other, steps: routine.steps }, one(runs).id, 'keys', now),
    ).toThrow(/another routine/);
  });

  it('finishing records when, keeps the first time, and lets a new run start', () => {
    let runs = model.startRun([], routine, now);
    const id = one(runs).id;
    runs = model.finishRun(freeze(runs), id, now);
    runs = model.finishRun(freeze(runs), id, new Date(`${date}T09:00`));
    expect(one(runs).finishedAt).toBe(now.toISOString());
    expect(model.currentRun(runs, routine.id, date)).toBeUndefined();
    expect(model.startRun(runs, routine, now)).toHaveLength(2);
  });

  it('abandoning leaves no trace, and removing a routine’s runs removes only those', () => {
    const runs = model.startRun([], routine, now);
    expect(model.abandonRun(freeze(runs), one(runs).id)).toEqual([]);
    const both = [...runs, ...model.runsFor(smallDay, sam)];
    expect(model.removeRunsOf(both, routine.id).map((r) => r.id)).toEqual(['run-sam']);
  });

  it('finds the runs of a day', () => {
    const evenings = model.runsFor(thirtyDays, self);
    expect(model.runsOn(evenings, '2026-10-25')).toHaveLength(1);
    expect(model.runsOn(evenings, '2026-10-28')).toEqual([]);
  });
});

describe('what a run can never say', () => {
  it('records only what was ticked: an unticked step appears nowhere in a finished run', () => {
    const routine = one(model.routinesFor(smallDay, self));
    let runs = model.startRun([], routine, now);
    const id = one(runs).id;
    runs = model.tickStep(runs, routine, id, 'keys', now);
    runs = model.finishRun(runs, id, now);
    const text = JSON.stringify(runs);
    expect(text).not.toContain('"bag"');
    expect(text).not.toContain('"lights"');
    expect(Object.keys(one(runs)).sort()).toEqual(
      ['date', 'finishedAt', 'id', 'routineId', 'startedAt', 'ticked'].sort(),
    );
  });

  it('exports nothing that counts days in a row or names a miss', () => {
    expect(
      Object.keys(model).filter((name) => /streak|miss|skip|overdue|late|lost/i.test(name)),
    ).toEqual([]);
  });
});

describe('the book', () => {
  it('lists a child’s routines without reading the adult shelf, and the reverse', () => {
    const guarded = (forbidden: string): model.RoutineBook =>
      new Proxy(smallDay, {
        get(target, key, receiver) {
          if (key === forbidden) throw new Error(`Read ${forbidden}`);
          return Reflect.get(target, key, receiver);
        },
        getOwnPropertyDescriptor(target, key) {
          if (key === forbidden) throw new Error(`Read ${forbidden}`);
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
    expect(model.routinesFor(guarded('self'), sam).map((r) => r.id)).toEqual(['sam-morning']);
    expect(model.runsFor(guarded('self'), sam).map((r) => r.id)).toEqual(['run-sam']);
    expect(model.routinesFor(guarded('child:sam'), self).map((r) => r.id)).toEqual(['morning']);
  });

  it('gives an empty shelf to an owner with nothing, and replaces one shelf at a time', () => {
    expect(model.routinesFor(empty, sam)).toEqual([]);
    expect(model.runsFor(empty, self)).toEqual([]);
    const book = model.putShelf(freeze({ ...smallDay }), sam, { routines: [] });
    expect(model.routinesFor(book, sam)).toEqual([]);
    expect(model.runsFor(book, sam)).toHaveLength(1);
    expect(book.self).toBe(smallDay.self);
  });

  it('keeps unknown keys on a shelf and on the book', () => {
    const book = freeze({
      ...smallDay,
      future: { routines: [], runs: [], extra: 1 },
      self: { ...smallDay.self!, extra: 'keep' },
    });
    const next = model.putShelf(book, self, { runs: [] });
    expect(next.self?.extra).toBe('keep');
    expect(next.future).toBe(book.future);
  });

  it('removes everything kept for one profile and nothing else', () => {
    const book = model.removeOwner(freeze({ ...smallDay }), sam);
    expect(Object.keys(book)).toEqual(['self']);
    expect(model.routinesFor(book, sam)).toEqual([]);
  });

  it('will not key a child without a profile id', () => {
    expect(() => model.ownerKey({ kind: 'child', profileId: '' })).toThrow(RangeError);
  });
});
