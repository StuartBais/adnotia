import { isClockTime, isIsoDate, type ClockTime, type IsoDate } from '../../kernel/dates';
import type { Task } from '../tasks';

// Alerts are only the ones a person sets or starts (ADR-044, decision 2): a
// reminder they asked for, and a warning from a timer they started. This file
// decides when those are due. It does not raise anything; the platform layer
// does that with whatever `due` returns.
//
// The guarantee is structural: an Alert can only be made from a Reminder or a
// running Timer the caller passed in. A task on its own, however close its
// time, produces nothing.

export type AttachedTo =
  { kind: 'task'; id: string } | { kind: 'routine'; id: string } | { kind: 'text'; text: string };

export type ReminderWhen =
  | { kind: 'at'; date: IsoDate; time: ClockTime }
  /** Minutes before the start of the timed task it is attached to. */
  | { kind: 'before'; minutes: number };

export interface Reminder {
  [key: string]: unknown;
  id: string;
  attachedTo: AttachedTo;
  when: ReminderWhen;
  createdAt: string;
}

/** A timer the person started. The caller works out `endsAt`, including any pause. */
export interface Timer {
  id: string;
  endsAt: string;
  /** Minutes before the end at which to warn. Empty means no warning. */
  warnBefore: readonly number[];
}

export type Alert =
  | { source: 'reminder'; reminderId: string; fireAt: string }
  | { source: 'timer'; timerId: string; minutesBefore: number; fireAt: string };

function localTime(date: IsoDate, time: ClockTime): Date {
  return new Date(`${date}T${time}`);
}

function checkWhen(attachedTo: AttachedTo, when: ReminderWhen): void {
  if (when.kind === 'at' && (!isIsoDate(when.date) || !isClockTime(when.time)))
    throw new RangeError('Invalid date or time');
  if (when.kind === 'before') {
    if (attachedTo.kind !== 'task')
      throw new RangeError('Only a reminder attached to a task can be set before it');
    if (!Number.isFinite(when.minutes) || when.minutes < 0) throw new RangeError('Invalid minutes');
  }
  if (attachedTo.kind === 'text' && attachedTo.text.trim() === '')
    throw new RangeError('A reminder needs words');
}

export function addReminder(
  reminders: readonly Reminder[],
  attachedTo: AttachedTo,
  when: ReminderWhen,
  now: Date,
): Reminder[] {
  checkWhen(attachedTo, when);
  const ids = new Set(reminders.map((r) => r.id));
  const base = `reminder-${now.getTime()}`;
  let id = base;
  for (let suffix = 1; ids.has(id); suffix++) id = `${base}-${suffix}`;
  return [
    ...reminders,
    { id, attachedTo: { ...attachedTo }, when: { ...when }, createdAt: now.toISOString() },
  ];
}

export function removeReminder(reminders: readonly Reminder[], id: string): Reminder[] {
  if (!reminders.some((r) => r.id === id)) throw new RangeError(`Unknown reminder: ${id}`);
  return reminders.filter((r) => r.id !== id);
}

/**
 * When a reminder goes off, or undefined if it cannot: its task is done, gone
 * or no longer at a time.
 */
export function fireTime(reminder: Reminder, tasks: readonly Task[]): Date | undefined {
  const attached = reminder.attachedTo;
  const task = attached.kind === 'task' ? tasks.find((t) => t.id === attached.id) : undefined;
  if (attached.kind === 'task' && (task === undefined || task.doneAt !== undefined))
    return undefined;
  if (reminder.when.kind === 'at') return localTime(reminder.when.date, reminder.when.time);
  if (task?.when.kind !== 'timed') return undefined;
  const start = localTime(task.when.date, task.when.time);
  return new Date(start.getTime() - reminder.when.minutes * 60_000);
}

export interface AlertSources {
  reminders: readonly Reminder[];
  timers: readonly Timer[];
  /** Read only to place reminders attached to tasks. Never a source of alerts. */
  tasks: readonly Task[];
}

function allAlerts({ reminders, timers, tasks }: AlertSources): Alert[] {
  const alerts: Alert[] = [];
  for (const reminder of reminders) {
    const at = fireTime(reminder, tasks);
    if (at) alerts.push({ source: 'reminder', reminderId: reminder.id, fireAt: at.toISOString() });
  }
  for (const timer of timers) {
    const end = Date.parse(timer.endsAt);
    for (const minutesBefore of new Set(timer.warnBefore)) {
      if (!Number.isFinite(minutesBefore) || minutesBefore <= 0) continue;
      alerts.push({
        source: 'timer',
        timerId: timer.id,
        minutesBefore,
        fireAt: new Date(end - minutesBefore * 60_000).toISOString(),
      });
    }
  }
  return alerts.sort((a, b) => a.fireAt.localeCompare(b.fireAt));
}

/**
 * Everything that falls due after `since` and up to and including `now`. The
 * caller keeps `since` as the last time it asked, so nothing fires twice and
 * nothing is lost while the app was asleep.
 */
export function due(sources: AlertSources, since: Date, now: Date): Alert[] {
  const from = since.getTime();
  const to = now.getTime();
  return allAlerts(sources).filter((alert) => {
    const at = Date.parse(alert.fireAt);
    return at > from && at <= to;
  });
}

/** The next alert after `now`, so the platform layer can schedule one wake-up. */
export function nextDue(sources: AlertSources, now: Date): Alert | undefined {
  return allAlerts(sources).find((alert) => Date.parse(alert.fireAt) > now.getTime());
}
