// The document.
//
// Everything a person has is one JSON document, persisted whole on every
// debounced write and exported whole in a backup. There are no partial writes
// and no secondary stores. See docs/06-data-model.md.

import type { IsoDate } from '../dates/index';

/** Bumped only by a kernel migration. See docs/06-data-model.md. */
export const SCHEMA_VERSION = 1;

/** Where the document lives. Changed from v0's `adhd-titration-log-v1`. */
export const DOCUMENT_KEY = 'adnotia-v1';

export type Space = 'adult' | 'family';

/**
 * A module's slice. Everything but `version` is the module's own business, so
 * the shape stays open: the kernel must never drop a key it does not recognise.
 */
export interface ModuleSlice {
  version: number;
  [key: string]: unknown;
}

/** Wins and misses are kernel-level, available to any module's report. */
export interface KernelDay {
  /** Set on first save and never changed. Distinguishes same-day from backfilled. */
  createdAt: string;
  win?: string;
  miss?: string;
  [key: string]: unknown;
}

export interface Baseline {
  focus: number | null;
  mood: number | null;
  sleep: string;
  note: string;
}

export interface Question {
  id: string;
  text: string;
  added: IsoDate;
}

export interface KernelState {
  enabledModules: string[];
  moduleOrder: string[];
  questions: Question[];
  days: Record<IsoDate, KernelDay>;
  settings: KernelSettings;
  baseline?: Baseline;
  overall?: string;
  lastBackup?: IsoDate;
  /** When the backup reminder was last dismissed. It waits a fortnight again. */
  lastBackupNagDismissed?: IsoDate;
  lastAppointment?: IsoDate;
}

export interface KernelSettings {
  passcodeEnabled: boolean;
  /**
   * Whether the person has been through first run. Kept explicitly rather than
   * inferred from "no modules enabled", because choosing nothing is a valid
   * answer and must not put someone back at the first question.
   */
  firstRunComplete?: boolean;
  /** Carried in from the monolith, where the baseline card could be hidden. */
  baseHidden?: boolean;
}

/**
 * One child in the Family space. Nothing is asked about a child beyond a
 * parent-chosen nickname and an age band. See docs/04-family-space.md.
 * Milestone 5 firms this up; the age band stays a string until then.
 */
export interface ChildProfile {
  nickname: string;
  ageBand: string;
  createdAt: string;
  modules: Record<string, ModuleSlice>;
}

export interface FamilyState {
  children: Record<string, ChildProfile>;
}

export interface AdnotiaDocument {
  schemaVersion: number;
  createdAt: string;
  space: Space;
  kernel: KernelState;
  modules: Record<string, ModuleSlice>;
  family: FamilyState;
}

export interface CreateDocumentOptions {
  space?: Space;
  now?: Date;
}

export function createDocument(options: CreateDocumentOptions = {}): AdnotiaDocument {
  const { space = 'adult', now = new Date() } = options;
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    space,
    kernel: {
      enabledModules: [],
      moduleOrder: [],
      questions: [],
      days: {},
      settings: { passcodeEnabled: false },
    },
    modules: {},
    family: { children: {} },
  };
}

/**
 * A cheap shape check for something read back from storage. It is deliberately
 * shallow: a document from a newer build may carry anything, and rejecting it
 * would lose data that a migration or a newer build could still read.
 */
export function isDocumentShaped(value: unknown): value is AdnotiaDocument {
  if (typeof value !== 'object' || value === null) return false;
  const doc = value as Partial<AdnotiaDocument>;
  return (
    typeof doc.schemaVersion === 'number' && typeof doc.kernel === 'object' && doc.kernel !== null
  );
}
