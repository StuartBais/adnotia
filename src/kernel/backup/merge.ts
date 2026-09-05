// Merging a backup into the live document.
//
// Restore merges, it does not replace. That is what makes "restore onto a second
// device" and "restore after a partial data loss" both safe: nothing already
// here is lost by restoring, and nothing in the file is lost by having something
// here already. See docs/06-data-model.md "Backup file".
//
// The rules, from that document:
//   - day records and entries from the backup overwrite same-key records;
//   - everything else is unioned;
//   - questions are deduplicated by text;
//   - lastBackup, lastAppointment and baseline take the more recent value.

import type { AdnotiaDocument, ChildProfile, ModuleSlice, Question } from '../store/document';

export interface RestoreCounts {
  /** Day records and entries the backup had and the live document did not. */
  entriesAdded: number;
  /** Day records and entries the backup overwrote. */
  entriesUpdated: number;
  profilesAdded: number;
  questionsAdded: number;
  modulesAdded: number;
}

function emptyCounts(): RestoreCounts {
  return {
    entriesAdded: 0,
    entriesUpdated: 0,
    profilesAdded: 0,
    questionsAdded: 0,
    modulesAdded: 0,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Merge two `days` maps. Same date: the backup wins. */
function mergeDays(
  current: Record<string, unknown> | undefined,
  backup: Record<string, unknown> | undefined,
  counts: RestoreCounts,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(current ?? {}) };
  for (const [date, record] of Object.entries(backup ?? {})) {
    if (date in merged) counts.entriesUpdated++;
    else counts.entriesAdded++;
    merged[date] = record;
  }
  return merged;
}

/**
 * Merge two `entries` arrays, as the Family observation log keeps. Deduplicated
 * by `id` where there is one, otherwise by value, because an entry restored
 * twice should not appear twice.
 */
function mergeEntries(current: unknown, backup: unknown, counts: RestoreCounts): unknown[] {
  const held = Array.isArray(current) ? [...current] : [];
  const incoming = Array.isArray(backup) ? backup : [];

  const identify = (entry: unknown): string =>
    isObject(entry) && typeof entry['id'] === 'string' ? `id:${entry['id']}` : JSON.stringify(entry);

  const seen = new Map<string, number>();
  held.forEach((entry, index) => seen.set(identify(entry), index));

  for (const entry of incoming) {
    const key = identify(entry);
    const at = seen.get(key);
    if (at === undefined) {
      seen.set(key, held.length);
      held.push(entry);
      counts.entriesAdded++;
    } else {
      held[at] = entry;
      counts.entriesUpdated++;
    }
  }
  return held;
}

/** Merge one slice. Keys in either survive; the backup wins a collision. */
function mergeSlice(
  current: ModuleSlice | undefined,
  backup: ModuleSlice,
  counts: RestoreCounts,
): ModuleSlice {
  if (current === undefined) {
    // A slice this document has never had. Its days are all new.
    const days = backup['days'];
    if (isObject(days)) counts.entriesAdded += Object.keys(days).length;
    else if (Array.isArray(backup['entries'])) counts.entriesAdded += backup['entries'].length;
    counts.modulesAdded++;
    return backup;
  }

  const merged: ModuleSlice = { ...current, ...backup };
  // The higher version wins; a migration will bring the slice up if needed.
  merged.version = Math.max(current.version ?? 1, backup.version ?? 1);

  if (isObject(current['days']) || isObject(backup['days'])) {
    merged['days'] = mergeDays(
      isObject(current['days']) ? current['days'] : {},
      isObject(backup['days']) ? backup['days'] : {},
      counts,
    );
  }
  if (Array.isArray(current['entries']) || Array.isArray(backup['entries'])) {
    merged['entries'] = mergeEntries(current['entries'], backup['entries'], counts);
  }
  return merged;
}

function mergeSlices(
  current: Record<string, ModuleSlice>,
  backup: Record<string, ModuleSlice>,
  counts: RestoreCounts,
): Record<string, ModuleSlice> {
  const merged: Record<string, ModuleSlice> = { ...current };
  for (const [id, slice] of Object.entries(backup)) {
    merged[id] = mergeSlice(current[id], slice, counts);
  }
  return merged;
}

function mergeProfiles(
  current: Record<string, ChildProfile>,
  backup: Record<string, ChildProfile>,
  counts: RestoreCounts,
): Record<string, ChildProfile> {
  const merged: Record<string, ChildProfile> = { ...current };
  for (const [id, profile] of Object.entries(backup)) {
    const held = current[id];
    if (held === undefined) {
      counts.profilesAdded++;
      merged[id] = profile;
      // Count the days inside a profile that arrived whole.
      for (const slice of Object.values(profile.modules ?? {})) {
        const days = (slice as ModuleSlice)['days'];
        if (isObject(days)) counts.entriesAdded += Object.keys(days).length;
        else if (Array.isArray((slice as ModuleSlice)['entries'])) {
          counts.entriesAdded += ((slice as ModuleSlice)['entries'] as unknown[]).length;
        }
      }
      continue;
    }
    merged[id] = {
      ...held,
      ...profile,
      modules: mergeSlices(held.modules ?? {}, profile.modules ?? {}, counts),
    };
  }
  return merged;
}

/** Questions are deduplicated by text, not by id: the same question typed twice is one. */
function mergeQuestions(
  current: Question[],
  backup: Question[],
  counts: RestoreCounts,
): Question[] {
  const merged = [...current];
  const seen = new Set(current.map((question) => question.text.trim().toLowerCase()));
  for (const question of backup) {
    const key = question.text.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
    counts.questionsAdded++;
  }
  return merged;
}

/** The later of two ISO dates, tolerating either being absent. */
function laterDate(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined || a === '') return b === '' ? undefined : b;
  if (b === undefined || b === '') return a;
  return a >= b ? a : b;
}

/**
 * Merge a migrated backup document into the live one.
 *
 * Pure: neither input is modified.
 */
export function mergeDocuments(
  current: AdnotiaDocument,
  backup: AdnotiaDocument,
): { document: AdnotiaDocument; counts: RestoreCounts } {
  const counts = emptyCounts();
  const live = structuredClone(current);
  const incoming = structuredClone(backup);

  const enabled = [...new Set([...live.kernel.enabledModules, ...incoming.kernel.enabledModules])];
  const order = [
    ...live.kernel.moduleOrder,
    ...incoming.kernel.moduleOrder.filter((id) => !live.kernel.moduleOrder.includes(id)),
  ];

  const merged: AdnotiaDocument = {
    ...live,
    ...incoming,
    // The document's origin is the earlier of the two.
    createdAt: live.createdAt <= incoming.createdAt ? live.createdAt : incoming.createdAt,
    // The space being used is a property of this device, not of the file.
    space: live.space,
    kernel: {
      ...live.kernel,
      ...incoming.kernel,
      enabledModules: enabled,
      moduleOrder: order,
      days: mergeDays(live.kernel.days, incoming.kernel.days, counts) as typeof live.kernel.days,
      questions: mergeQuestions(live.kernel.questions, incoming.kernel.questions, counts),
      // The passcode belongs to this device. A backup must never turn one on or
      // off here, or a restore could lock someone out of their own document.
      settings: live.kernel.settings,
    },
    modules: mergeSlices(live.modules, incoming.modules, counts),
    family: {
      ...live.family,
      ...incoming.family,
      children: mergeProfiles(
        live.family.children ?? {},
        incoming.family.children ?? {},
        counts,
      ),
    },
  };

  const lastBackup = laterDate(live.kernel.lastBackup, incoming.kernel.lastBackup);
  if (lastBackup !== undefined) merged.kernel.lastBackup = lastBackup;
  else delete merged.kernel.lastBackup;

  const lastAppointment = laterDate(live.kernel.lastAppointment, incoming.kernel.lastAppointment);
  if (lastAppointment !== undefined) merged.kernel.lastAppointment = lastAppointment;
  else delete merged.kernel.lastAppointment;

  // Baseline carries no timestamp, so "more recent" is not decidable. The one on
  // this device is treated as current; the backup's fills a gap.
  if (live.kernel.baseline !== undefined) merged.kernel.baseline = live.kernel.baseline;
  else if (incoming.kernel.baseline !== undefined) {
    merged.kernel.baseline = incoming.kernel.baseline;
  }

  return { document: merged, counts };
}
