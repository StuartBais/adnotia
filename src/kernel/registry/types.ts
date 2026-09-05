// The module manifest.
//
// Every module is a single ES module whose default export is a manifest. These
// types are the compile-time half of docs/01-module-contract.md; the runtime
// half is ./validate.ts, which the kernel runs at registration because types
// cannot check a manifest that arrives from a build this one did not compile.

export type Tier = 'A' | 'B' | 'C';

/** Which space a module mounts in. See docs/04-family-space.md. */
export type Audience = 'adult' | 'parent' | 'child';

export type FieldType =
  | 'scale5'
  | 'chips'
  | 'chipsMulti'
  | 'time'
  | 'number'
  | 'text'
  | 'toggle';

/** Prefill behaviour. `nearestPrior` is the closest *earlier* day that had a value. */
export type Carry = 'none' | 'previous' | 'nearestPrior';

export interface ChipOption {
  v: string;
  l: string;
}

export interface TodayField {
  id: string;
  label: string;
  type: FieldType;
  /** chips and chipsMulti only. */
  options?: ChipOption[];
  /** scale5 only: six strings, index 1–5 used. */
  anchors?: string[];
  optional?: boolean;
  /** Estimated seconds to answer. The shell sums these against the budget. */
  cost: number;
  /** The only way to ask for detail. Never show a detail field unconditionally. */
  followUp?: (value: unknown) => TodayField[];
  carry?: Carry;
}

export interface Citation {
  title: string;
  authors: string;
  year: number;
  venue: string;
  doi_or_url: string;
}

export interface LibraryEntry {
  tier: Tier;
  whatItIs: string;
  whatTheEvidenceSays: string;
  /** The honest limits. A Library entry without this fails review. */
  whatItWontDo: string;
  citations: Citation[];
  /** `YYYY-MM`. */
  reviewed: string;
  nextReview: string;
}

export interface Tool {
  title: string;
  icon: string;
  mount(container: HTMLElement, kernel: unknown): void;
}

export interface RecordsContribution {
  render(container: HTMLElement, context: unknown): void;
}

export interface ReportSection {
  /** The named report this belongs to: `clinical`, `screening`, `observations`. */
  report: string;
  id: string;
  title: (context: never) => string;
  /** Lower prints earlier. */
  weight: number;
  when?: (context: never) => boolean;
  render: (context: never) => string;
  renderText: (context: never) => string;
}

export interface SettingsItem {
  id: string;
  label: string;
  type: 'toggle' | 'text' | 'number';
}

export interface Eligibility {
  question: string;
  enableIf: string;
  note?: string;
}

export interface Contributions {
  today?: TodayField[];
  tools?: Tool[];
  records?: RecordsContribution;
  reports?: ReportSection[];
  /** Required for every module, including Tier C. */
  library: LibraryEntry;
  settings?: SettingsItem[];
}

export interface ModuleFixtures {
  empty: unknown;
  threeDays: unknown;
  thirtyDays: unknown;
}

export interface ModuleManifest {
  /** Stable, lowercase, never renamed once shipped. */
  id: string;
  name: string;
  /** Schema version of this module's own state. */
  version: number;
  tier: Tier;
  audience: Audience;
  summary: string;
  eligibility?: Eligibility;
  /** Other module ids this reads from. Almost always empty. */
  dependencies?: string[];
  contributes: Contributions;
  migrate?: (state: unknown, fromVersion: number) => unknown;
  fixtures?: ModuleFixtures;
}

/**
 * The mechanical form of "no medication in the Family space". The kernel rejects
 * these `today` field ids outside `audience: "adult"`. See
 * docs/06-data-model.md "Reserved field ids".
 */
export const RESERVED_FIELD_IDS: readonly string[] = [
  'dose',
  'med',
  'times',
  'onset',
  'woreOff',
  'rebound',
];

/** docs/01-module-contract.md: a module's today fields total ≤ 40 seconds. */
export const TODAY_COST_BUDGET = 40;

/** The whole check-in across every enabled module. The shell warns above this. */
export const CHECK_IN_BUDGET = 90;

/** What a `"child"` module may contribute, and nothing else. */
export const CHILD_ALLOWED_CONTRIBUTIONS: readonly string[] = ['tools', 'library'];
