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
