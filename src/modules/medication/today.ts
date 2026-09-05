// The daily fields.
//
// The prescription carries from the nearest earlier day that recorded one, so
// backfilling last Tuesday shows last Monday's dose rather than today's. Detail
// is asked for only through followUp, never unconditionally.
//
// Declared cost totals 36 seconds, inside the forty-second budget, which leaves
// room for sleep and the kernel's own fields inside the ninety-second check-in.

import type { TodayField } from '../../kernel/index';
import {
  ADHERENCE,
  ANCHORS,
  APPETITE,
  HEART,
  REBOUND,
  SEVERITY,
  SIDE,
  UNITS,
  strings,
} from './strings';

/** The detail asked about one side effect, once it has been ticked. */
function sideDetail(value: unknown): TodayField[] {
  if (!Array.isArray(value) || value.length === 0) return [];
  const fields: TodayField[] = [];
  for (const key of value as string[]) {
    const label = SIDE.find((option) => option.v === key)?.l ?? key;
    fields.push(
      {
        id: `detail.${key}.sev`,
        label: `${label}: ${strings.severity}`,
        type: 'chips',
        options: [...SEVERITY],
        cost: 2,
        optional: true,
      },
      {
        id: `detail.${key}.time`,
        label: `${label}: ${strings.detailTime}`,
        type: 'time',
        cost: 2,
        optional: true,
      },
      {
        id: `detail.${key}.note`,
        label: `${label}: ${strings.detailNote}`,
        type: 'text',
        cost: 0,
        optional: true,
      },
    );
  }
  return fields;
}

export const today: TodayField[] = [
  {
    id: 'med',
    label: strings.med,
    type: 'text',
    cost: 2,
    carry: 'nearestPrior',
  },
  {
    id: 'dose',
    label: strings.dose,
    type: 'number',
    cost: 2,
    carry: 'nearestPrior',
  },
  {
    id: 'unit',
    label: strings.unit,
    type: 'chips',
    options: [...UNITS],
    cost: 1,
    carry: 'nearestPrior',
  },
  {
    id: 'times',
    label: strings.times,
    type: 'timeList',
    cost: 3,
    carry: 'nearestPrior',
  },
  {
    id: 'adherence',
    label: strings.adherence,
    type: 'chips',
    options: [...ADHERENCE],
    cost: 3,
  },
  {
    id: 'focus',
    label: strings.focus,
    type: 'scale5',
    anchors: [...ANCHORS.focus],
    cost: 4,
  },
  {
    id: 'mood',
    label: strings.mood,
    type: 'scale5',
    anchors: [...ANCHORS.mood],
    cost: 4,
  },
  {
    id: 'onset',
    label: strings.onset,
    type: 'time',
    cost: 3,
    optional: true,
  },
  {
    id: 'woreOff',
    label: strings.woreOff,
    type: 'time',
    cost: 3,
    optional: true,
  },
  {
    id: 'rebound',
    label: strings.rebound,
    type: 'chips',
    options: [...REBOUND],
    cost: 2,
    optional: true,
    // Asked only of someone who reported something, and only then.
    followUp: (value) =>
      value === 'mild' || value === 'rough'
        ? [
            {
              id: 'reboundTime',
              label: strings.reboundTime,
              type: 'time',
              cost: 2,
              optional: true,
            },
          ]
        : [],
  },
  {
    id: 'appetite',
    label: strings.appetite,
    type: 'chips',
    options: [...APPETITE],
    cost: 2,
    optional: true,
  },
  {
    id: 'heart',
    label: strings.heart,
    type: 'chips',
    options: [...HEART],
    cost: 2,
    optional: true,
  },
  {
    id: 'side',
    label: strings.side,
    type: 'chipsMulti',
    options: [...SIDE],
    cost: 5,
    optional: true,
    followUp: sideDetail,
  },
];
