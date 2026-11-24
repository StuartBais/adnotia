import { describe, expect, it } from 'vitest';
import * as options from './index';
import * as tasksModel from '../tasks';
import { smallDay } from '../tasks/fixtures';
import type { Task } from '../tasks';

const date = '2026-11-18';
const at = (time: string) => new Date(`${date}T${time}`);

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

describe('rewards', () => {
  const list = { kind: 'list', id: 'home' } as const;
  const routine = { kind: 'routine', id: 'bedtime' } as const;
  const day = { kind: 'day' } as const;

  it('is all off until the person turns something on', () => {
    for (const scope of [day, list, routine, { kind: 'default' } as const])
      expect(options.resolve(options.NO_REWARDS, scope)).toEqual(options.ALL_OFF);
  });

  it('lets a default apply everywhere and a scope say otherwise for itself', () => {
    let settings = options.setOption(
      freeze(options.NO_REWARDS),
      { kind: 'default' },
      'doneList',
      true,
    );
    settings = options.setOption(freeze(settings), routine, 'doneList', false);
    settings = options.setOption(freeze(settings), routine, 'celebrate', true);
    expect(options.resolve(settings, day)).toEqual({
      doneList: true,
      tally: false,
      celebrate: false,
    });
    expect(options.resolve(settings, routine)).toEqual({
      doneList: false,
      tally: false,
      celebrate: true,
    });
    const cleared = options.clearScope(freeze(settings), routine);
    expect(options.resolve(cleared, routine)).toEqual(options.resolve(cleared, day));
    expect(options.resolve(options.clearScope(cleared, { kind: 'default' }), day)).toEqual(
      options.ALL_OFF,
    );
  });

  it('keeps unknown keys on the settings', () => {
    const settings = freeze({ ...options.NO_REWARDS, future: 'keep' });
    expect(options.setOption(settings, day, 'tally', true).future).toBe('keep');
  });

  it('rejects an option it does not offer and a scope with no id', () => {
    expect(() =>
      options.setOption(options.NO_REWARDS, day, 'streak' as options.RewardOption, true),
    ).toThrow(RangeError);
    expect(() => options.scopeKey({ kind: 'list', id: '' })).toThrow(RangeError);
  });

  it('counts completions in one scope or all, and the count only goes up', () => {
    let log = options.addCompletion(freeze([]), at('09:00'), list);
    log = options.addCompletion(freeze(log), at('09:10'), routine);
    log = options.addCompletion(freeze(log), at('09:20'));
    expect(options.tally(log)).toBe(3);
    expect(options.tally(log, list)).toBe(1);
    expect(options.tally(log, { kind: 'list', id: 'other' })).toBe(0);
    expect(Object.keys(options).filter((name) => /remove.*completion|reset/i.test(name))).toEqual(
      [],
    );
  });

  it('offers no option, and exports no name, that resets, removes or reports a gap', () => {
    const names = [...options.REWARD_OPTIONS, ...Object.keys(options)];
    expect(names.filter((name) => /streak|missed|overdue|lost/i.test(name))).toEqual([]);
  });
});

describe('reminders and timer warnings', () => {
  const timed: readonly Task[] = freeze(
    tasksModel.schedule(smallDay, 'post', {
      kind: 'timed',
      date,
      time: '10:30',
      durationMinutes: 10,
    }),
  );

  function sources(partial: Partial<options.AlertSources>): options.AlertSources {
    return { reminders: [], timers: [], tasks: timed, ...partial };
  }

  it('raises nothing on its own: tasks at a time produce no alert without a reminder', () => {
    expect(options.due(sources({}), at('00:00'), at('23:59'))).toEqual([]);
    expect(options.nextDue(sources({}), at('00:00'))).toBeUndefined();
  });

  it('fires a reminder at its time, once, inside the window asked about', () => {
    const reminders = options.addReminder(
      freeze([]),
      { kind: 'text', text: 'Bins out' },
      { kind: 'at', date, time: '19:00' },
      at('08:00'),
    );
    const id = reminders[0]!.id;
    expect(options.due(sources({ reminders }), at('18:00'), at('18:59'))).toEqual([]);
    expect(options.due(sources({ reminders }), at('18:00'), at('19:00'))).toEqual([
      { source: 'reminder', reminderId: id, fireAt: at('19:00').toISOString() },
    ]);
    expect(options.due(sources({ reminders }), at('19:00'), at('20:00'))).toEqual([]);
    expect(options.nextDue(sources({ reminders }), at('08:00'))?.fireAt).toBe(
      at('19:00').toISOString(),
    );
    expect(options.removeReminder(reminders, id)).toEqual([]);
  });

  it('places a reminder before a timed task, and drops it when the task is done or unscheduled', () => {
    const reminders = freeze(
      options.addReminder(
        [],
        { kind: 'task', id: 'post' },
        { kind: 'before', minutes: 15 },
        at('08:00'),
      ),
    );
    expect(options.nextDue(sources({ reminders }), at('08:00'))?.fireAt).toBe(
      at('10:15').toISOString(),
    );
    const done = tasksModel.complete(timed, 'post', at('09:00'));
    expect(options.due(sources({ reminders, tasks: done }), at('00:00'), at('23:59'))).toEqual([]);
    const loose = tasksModel.unschedule(timed, 'post');
    expect(options.due(sources({ reminders, tasks: loose }), at('00:00'), at('23:59'))).toEqual([]);
    expect(options.due(sources({ reminders, tasks: [] }), at('00:00'), at('23:59'))).toEqual([]);
  });

  it('warns before the end of a timer the person started', () => {
    const timers: options.Timer[] = [
      { id: 'focus', endsAt: at('10:25').toISOString(), warnBefore: [5, 5, 0, -1] },
    ];
    expect(options.due(sources({ timers }), at('10:00'), at('10:25'))).toEqual([
      {
        source: 'timer',
        timerId: 'focus',
        minutesBefore: 5,
        fireAt: at('10:20').toISOString(),
      },
    ]);
    expect(
      options.due(
        sources({ timers: [{ ...timers[0]!, warnBefore: [] }] }),
        at('10:00'),
        at('11:00'),
      ),
    ).toEqual([]);
  });

  it('can only return alerts made from a reminder or a timer it was given', () => {
    const reminders = options.addReminder(
      [],
      { kind: 'routine', id: 'bedtime' },
      { kind: 'at', date, time: '21:00' },
      at('08:00'),
    );
    const timers: options.Timer[] = [
      { id: 'focus', endsAt: at('10:25').toISOString(), warnBefore: [2] },
    ];
    const reminderIds = new Set(reminders.map((r) => r.id));
    const timerIds = new Set(timers.map((t) => t.id));
    const alerts = options.due(sources({ reminders, timers }), at('00:00'), at('23:59'));
    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      if (alert.source === 'reminder') expect(reminderIds.has(alert.reminderId)).toBe(true);
      else expect(timerIds.has(alert.timerId)).toBe(true);
    }
    expect(alerts.map((a) => a.fireAt)).toEqual(
      [...alerts.map((a) => a.fireAt)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('rejects a reminder it cannot place', () => {
    const when = { kind: 'before', minutes: 5 } as const;
    expect(() => options.addReminder([], { kind: 'text', text: 'x' }, when, at('08:00'))).toThrow(
      RangeError,
    );
    expect(() =>
      options.addReminder(
        [],
        { kind: 'task', id: 'post' },
        { kind: 'before', minutes: -1 },
        at('08:00'),
      ),
    ).toThrow(RangeError);
    expect(() =>
      options.addReminder(
        [],
        { kind: 'text', text: ' ' },
        { kind: 'at', date, time: '09:00' },
        at('08:00'),
      ),
    ).toThrow(RangeError);
    expect(() =>
      options.addReminder(
        [],
        { kind: 'text', text: 'x' },
        { kind: 'at', date, time: '9:00' },
        at('08:00'),
      ),
    ).toThrow(RangeError);
    expect(() => options.removeReminder([], 'nope')).toThrow(RangeError);
  });
});
