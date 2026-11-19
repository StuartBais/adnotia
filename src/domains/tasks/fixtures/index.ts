import { addDays } from '../../../kernel/dates';
import type { Task } from '..';

export const empty: readonly Task[] = [];

const date = '2026-11-18';
const createdAt = new Date(`${date}T08:00`).toISOString();
export const smallDay: readonly Task[] = [
  {
    id: 'list',
    title: 'Make a shopping list',
    createdAt,
    order: 0,
    sessions: [],
    when: { kind: 'anytime', date },
  },
  {
    id: 'post',
    title: 'Post the letter',
    createdAt,
    order: 1,
    sessions: [],
    when: { kind: 'none' },
  },
  ...['Check the fridge', 'Check the cupboard', 'Write the list'].map((title, order): Task => ({
    id: `step-${order}`,
    title,
    createdAt,
    parentId: 'list',
    order,
    sessions: order === 0 ? [{ start: createdAt }] : [],
    when: { kind: 'none' },
  })),
];

export const thirtyDays: readonly Task[] = Array.from({ length: 30 }, (_, order): Task => {
  const date = addDays('2026-10-25', order);
  const start = new Date(`${date}T09:00`).toISOString();
  const stop = new Date(`${date}T09:15`).toISOString();
  return {
    id: `morning-${date}`,
    title: 'Plan the morning',
    order,
    createdAt: start,
    doneAt: stop,
    when: { kind: 'timed', date, time: '09:00', durationMinutes: 15 },
    sessions: [{ start, stop }],
  };
});
