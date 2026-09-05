// The check-in budget.
//
// The whole daily check-in across every enabled module must be completable in
// about ninety seconds. Modules budget for it and the shell enforces it: above
// ninety, the person is offered the option of hiding what is optional.
// See docs/01-module-contract.md.

import { CHECK_IN_BUDGET, type ModuleManifest, type TodayField } from '../registry/types';
import { KERNEL_TODAY } from './kernelFields';

export interface Budget {
  /** Declared seconds across every enabled module. */
  total: number;
  /** What is left after hiding the optional fields. */
  required: number;
  overBudget: boolean;
  /** True when hiding optional fields would actually bring it under. */
  hidingWouldHelp: boolean;
}

function fieldsOf(manifest: ModuleManifest): readonly TodayField[] {
  return manifest.contributes.today ?? [];
}

export interface MeasureOptions {
  /**
   * Count the kernel's own daily fields too. The shell does, because the person
   * fills them in; the per-module contract check does not, because a module is
   * only answerable for its own forty seconds.
   */
  includeKernel?: boolean;
}

export function measure(modules: readonly ModuleManifest[], options: MeasureOptions = {}): Budget {
  let total = 0;
  let required = 0;
  const count = (field: TodayField): void => {
    total += field.cost;
    if (field.optional !== true) required += field.cost;
  };

  for (const manifest of modules) for (const field of fieldsOf(manifest)) count(field);

  // The kernel's own fields cost the person the same seconds as anyone else's,
  // and the check-in only shows them once there is something to check in about.
  if (options.includeKernel === true && modules.some((manifest) => fieldsOf(manifest).length > 0)) {
    for (const group of KERNEL_TODAY) for (const field of group.fields) count(field);
  }
  return {
    total,
    required,
    overBudget: total > CHECK_IN_BUDGET,
    hidingWouldHelp: total > CHECK_IN_BUDGET && required <= CHECK_IN_BUDGET,
  };
}

/**
 * What the shell says when the check-in has grown long.
 *
 * Rounded to the nearest half minute, because the number is an estimate the
 * modules declared and presenting it to the second would claim a precision it
 * does not have. It describes the form, never the person: there is nothing here
 * about how long they took, how long they usually take, or whether that is good.
 */
export const BUDGET_STRINGS = {
  long: (seconds: number) =>
    `This check-in is about ${Math.round(seconds / 30) / 2} minutes with everything showing.`,
  shortened: (seconds: number) =>
    `About ${Math.round(seconds / 30) / 2} minutes now. The hidden questions are still there ` +
    'when you want them.',
  hide: 'Hide the optional questions',
  show: 'Show them again',
} as const;
