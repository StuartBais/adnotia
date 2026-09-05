// The check-in budget.
//
// The whole daily check-in across every enabled module must be completable in
// about ninety seconds. Modules budget for it and the shell enforces it: above
// ninety, the person is offered the option of hiding what is optional.
// See docs/01-module-contract.md.

import { CHECK_IN_BUDGET, type ModuleManifest, type TodayField } from '../registry/types';

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

export function measure(modules: readonly ModuleManifest[]): Budget {
  let total = 0;
  let required = 0;
  for (const manifest of modules) {
    for (const field of fieldsOf(manifest)) {
      total += field.cost;
      if (field.optional !== true) required += field.cost;
    }
  }
  return {
    total,
    required,
    overBudget: total > CHECK_IN_BUDGET,
    hidingWouldHelp: total > CHECK_IN_BUDGET && required <= CHECK_IN_BUDGET,
  };
}
