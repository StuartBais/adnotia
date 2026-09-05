// The kernel's own daily fields.
//
// Wins, misses and the day's note belong to nobody's module. A person logging
// only sleep still has days that went better than usual and days that fell
// apart, and any report may read them, so they live in `kernel.days` rather than
// in whichever module happened to ask first. See docs/01-module-contract.md
// "What moved to the kernel" and docs/06-data-model.md.
//
// Wording ported from the monolith.

import type { TodayField } from '../registry/types';

export interface KernelTodayGroup {
  /** Only ever used as a DOM hint; kernel fields are not a module slice. */
  id: string;
  name: string;
  sub: string;
  fields: readonly TodayField[];
}

export const KERNEL_TODAY: readonly KernelTodayGroup[] = [
  {
    id: 'kernel.life',
    name: 'What actually happened',
    sub: 'One concrete thing each way. This is what your prescriber will remember from the whole sheet.',
    fields: [
      {
        id: 'win',
        label: 'Went better than it usually does',
        type: 'text',
        optional: true,
        cost: 8,
      },
      {
        id: 'miss',
        label: 'Still fell apart',
        type: 'text',
        optional: true,
        cost: 8,
      },
    ],
  },
  {
    id: 'kernel.notes',
    name: 'Notes',
    sub: 'One line is plenty. Specifics beat adjectives — what you got done, what fell apart.',
    fields: [
      {
        id: 'notes',
        label: 'Anything else about today',
        type: 'text',
        optional: true,
        cost: 10,
      },
    ],
  },
];

/** Seconds the kernel's own fields add to the check-in. */
export function kernelTodayCost(): number {
  let total = 0;
  for (const group of KERNEL_TODAY) {
    for (const field of group.fields) total += field.cost;
  }
  return total;
}
