// The v0 import.
//
// The reference monolith stores everything under one key,
// `adhd-titration-log-v1`, in a flatter shape: one entry per day holding
// medication, sleep and daily-life fields together. The mapping to v1 is the
// table in docs/06-data-model.md "The v0 monolith mapping".
//
// Two rules govern this file. A migration never drops a key it does not
// recognise (docs/06-data-model.md "Migration rules"), and the old key is left
// untouched until the person confirms the import worked.

import { createDocument, type AdnotiaDocument, type Baseline, type ModuleSlice } from '../document';

/** Where the monolith keeps its document. Unchanged; we only ever read it. */
export const V0_KEY = 'adhd-titration-log-v1';

/** v0 entry fields belonging to the medication module. */
const MEDICATION_FIELDS = [
  'med',
  'dose',
  'unit',
  'times',
  'adherence',
  'focus',
  'mood',
  'onset',
  'woreOff',
  'rebound',
  'reboundTime',
  'appetite',
  'heart',
  'side',
  'detail',
  // Carry provenance. Not in the mapping table, and not recomputable after the
  // fact, so it travels with the prescription it describes rather than being
  // dropped. `carry: "nearestPrior"` recomputes carry itself at render time.
  'carriedFrom',
  'carriedBack',
] as const;

/** v0 entry fields belonging to the sleep module, and their v1 names. */
const SLEEP_FIELDS: Record<string, string> = {
  bed: 'bed',
  wake: 'wake',
  sleep: 'hours',
  sleepq: 'quality',
  sleepLatency: 'latency',
  sleepNote: 'note',
};

/**
 * v0 entry fields belonging to the kernel. Wins and misses are not
 * medication-specific, so the contract moves them to the kernel; `notes` is
 * the same kind of thing — a free-text note about the day — and goes with them.
 */
const KERNEL_DAY_FIELDS = ['win', 'miss', 'notes', 'createdAt'] as const;

/**
 * Dropped deliberately, because both are exactly recoverable:
 * `date` repeats the key it is stored under, and `last` is the carry-forward
 * cache that `carry: "nearestPrior"` recomputes. See docs/06-data-model.md.
 */
const DROPPED_ENTRY_FIELDS = new Set(['date']);

export interface V0ImportResult {
  document: AdnotiaDocument;
  /** What the import found, for the confirmation the person is shown. */
  counts: {
    days: number;
    medicationDays: number;
    sleepDays: number;
    kernelDays: number;
    questions: number;
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True for something that looks like a monolith document. */
export function isV0Document(value: unknown): boolean {
  return isObject(value) && isObject(value['entries']);
}

/** Whether a v1 day record ended up with anything in it. */
function hasAnything(record: Record<string, unknown>): boolean {
  return Object.keys(record).length > 0;
}

/**
 * Turn a monolith document into a v1 document. Pure: it reads `raw` and returns
 * a new document, touching no storage.
 */
export function importV0(raw: unknown, options: { now?: Date } = {}): V0ImportResult {
  if (!isV0Document(raw)) {
    throw new Error('That is not a v0 Adnotia document: it has no entries.');
  }

  const v0 = raw as Record<string, unknown>;
  const document = createDocument({ space: 'adult', now: options.now ?? new Date() });

  const medication: ModuleSlice = { version: 1, days: {} };
  const sleep: ModuleSlice = { version: 1, days: {} };
  const medicationDays = medication['days'] as Record<string, Record<string, unknown>>;
  const sleepDays = sleep['days'] as Record<string, Record<string, unknown>>;

  const entries = v0['entries'] as Record<string, unknown>;
  let dayCount = 0;

  for (const [date, value] of Object.entries(entries)) {
    if (!isObject(value)) continue;
    dayCount++;

    const med: Record<string, unknown> = {};
    const slp: Record<string, unknown> = {};
    const day: Record<string, unknown> = {};

    for (const [field, held] of Object.entries(value)) {
      if (DROPPED_ENTRY_FIELDS.has(field)) continue;

      if ((MEDICATION_FIELDS as readonly string[]).includes(field)) {
        med[field] = held;
      } else if (field in SLEEP_FIELDS) {
        slp[SLEEP_FIELDS[field] as string] = held;
      } else if ((KERNEL_DAY_FIELDS as readonly string[]).includes(field)) {
        day[field] = held;
      } else {
        // Something this build has never heard of. Keeping it beside the
        // medication record loses nothing; dropping it would.
        med[field] = held;
      }
    }

    if (hasAnything(med)) medicationDays[date] = med;
    if (hasAnything(slp)) sleepDays[date] = slp;
    if (hasAnything(day)) {
      // createdAt is what the record-quality footer uses to tell a same-day
      // entry from one filled in later, so it must survive even on a day that
      // recorded nothing else at kernel level.
      document.kernel.days[date] = day as (typeof document.kernel.days)[string];
    }
  }

  // Only mount what there is data for. A monolith user was, by definition,
  // taking medication, but a document with no sleep at all should not turn the
  // sleep module on.
  const enabled: string[] = [];
  if (Object.keys(medicationDays).length > 0) {
    document.modules['medication'] = medication;
    enabled.push('medication');
  }
  if (Object.keys(sleepDays).length > 0) {
    document.modules['sleep'] = sleep;
    enabled.push('sleep');
  }
  document.kernel.enabledModules = enabled;
  document.kernel.moduleOrder = [...enabled];

  if (Array.isArray(v0['questions'])) {
    document.kernel.questions = v0['questions'] as typeof document.kernel.questions;
  }
  if (isObject(v0['baseline'])) {
    document.kernel.baseline = v0['baseline'] as unknown as Baseline;
  }
  if (typeof v0['overall'] === 'string' && v0['overall'] !== '') {
    document.kernel.overall = v0['overall'];
  }
  if (typeof v0['lastAppt'] === 'string' && v0['lastAppt'] !== '') {
    document.kernel.lastAppointment = v0['lastAppt'];
  }
  if (typeof v0['lastBackup'] === 'string' && v0['lastBackup'] !== '') {
    document.kernel.lastBackup = v0['lastBackup'];
  }
  // A view preference, not data, but not ours to throw away either.
  if (typeof v0['baseHidden'] === 'boolean') {
    document.kernel.settings.baseHidden = v0['baseHidden'];
  }

  return {
    document,
    counts: {
      days: dayCount,
      medicationDays: Object.keys(medicationDays).length,
      sleepDays: Object.keys(sleepDays).length,
      kernelDays: Object.keys(document.kernel.days).length,
      questions: document.kernel.questions.length,
    },
  };
}
