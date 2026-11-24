// The shared domains in the stored document (schema version 2).
//
// The adult's own records live under `domains`. A child's routines live inside
// that child's profile, at `family.children[<id>].routines`, so that deleting a
// profile still removes everything about the child by construction, as
// docs/04-family-space.md requires. See ADR-046.

import type { Completion, Reminder, RewardSettings } from '../../domains/options';
import type { RoutineBook, Shelf } from '../../domains/routines';
import type { Task } from '../../domains/tasks';
import type { AdnotiaDocument } from './document';

export interface DomainsState {
  [key: string]: unknown;
  tasks: readonly Task[];
  /** The adult's own routines and runs. */
  routines: Shelf;
  rewards: RewardSettings;
  completions: readonly Completion[];
  reminders: readonly Reminder[];
}

export function emptyDomains(): DomainsState {
  return {
    tasks: [],
    routines: { routines: [], runs: [] },
    rewards: { default: {}, scopes: {} },
    completions: [],
    reminders: [],
  };
}

/** Every owner's routines, keyed as the routine model expects. */
export function routineBookOf(document: Readonly<AdnotiaDocument>): RoutineBook {
  const book: Record<string, Shelf> = { self: document.domains.routines };
  for (const [id, profile] of Object.entries(document.family.children ?? {})) {
    if (profile.routines !== undefined) book[`child:${id}`] = profile.routines;
  }
  return book;
}
