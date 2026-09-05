// The nightly fields.
//
// Four questions and a follow-up, budgeted at fourteen seconds so it leaves room
// for whatever else a person has turned on.

import { spanMinutes, type TodayField } from '../../kernel/index';
import { NIGHT_QUALITY, strings } from './strings';

export const today: TodayField[] = [
  {
    id: 'bed',
    label: strings.bed,
    type: 'time',
    cost: 3,
    // Bedtimes are habitual, so last night's is a reasonable starting point.
    carry: 'nearestPrior',
  },
  {
    id: 'wake',
    label: strings.wake,
    type: 'time',
    cost: 3,
    carry: 'nearestPrior',
  },
  {
    id: 'hours',
    label: strings.hours,
    type: 'number',
    cost: 2,
    optional: true,
  },
  {
    id: 'quality',
    label: strings.quality,
    type: 'chipsMulti',
    options: [...NIGHT_QUALITY],
    cost: 6,
    optional: true,
    // Asked only of someone who said it took ages to drop off.
    followUp: (value) =>
      Array.isArray(value) && value.includes('latency')
        ? [
            {
              id: 'latency',
              label: strings.latency,
              type: 'number',
              cost: 3,
              optional: true,
            },
          ]
        : [],
  },
  {
    id: 'note',
    label: strings.note,
    type: 'text',
    cost: 0,
    optional: true,
  },
];

/**
 * Hours follow from the two times, rounded to the nearest quarter hour and
 * crossing midnight correctly. A value the person typed always wins: time in
 * bed is not time asleep, and only they know the difference.
 * See docs/decisions/ADR-010-derived-fields.md.
 */
export function derive(day: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const bed = typeof day['bed'] === 'string' ? day['bed'] : '';
  const wake = typeof day['wake'] === 'string' ? day['wake'] : '';
  const minutes = spanMinutes(bed, wake);
  if (minutes === null) return {};
  return { hours: String(Math.round((minutes / 60) * 4) / 4) };
}
