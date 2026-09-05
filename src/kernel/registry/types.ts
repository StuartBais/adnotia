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
  /** An ordered list of times. See docs/decisions/ADR-011-time-list-field.md. */
  | 'timeList'
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
  /**
   * `YYYY-MM`, set when someone checked every citation here against the original
   * paper rather than against a summary of it. Absent means nobody has, and the
   * Library says so on the entry.
   *
   * docs/02-evidence-rubric.md requires this before publication and
   * docs/08-roadmap.md Milestone 8 records it with dates. It is per entry
   * because that is how the checking is actually done.
   * See docs/decisions/ADR-020-unverified-citations-are-visible.md.
   */
  citationsVerified?: string;
  /** `YYYY-MM`. */
  reviewed: string;
  nextReview: string;
}

/**
 * What a tool is handed when it mounts. Deliberately small: a tool reads and
 * writes its own slice and nothing else, and has no route to another module's.
 */
export interface ToolContext {
  /** This module's slice, or undefined if it has never been written. */
  slice: unknown;
  /** Replace this module's slice. The kernel routes it to the right place. */
  save: (next: unknown) => void;
  /** Today, under the after-midnight rule. */
  today: string;
  /** Redraw, after a change that alters what else is on the page. */
  refresh: () => void;
}

export interface Tool {
  title: string;
  icon: string;
  mount(container: HTMLElement, kernel: unknown): void;
}

/**
 * One module's contribution to the shared day timeline. The kernel draws it —
 * the chart reads from every module at once, so no single module can own it, and
 * none of them needs to declare a dependency on another to appear on it.
 * See docs/decisions/ADR-013-shared-day-timeline.md.
 */
export interface TimelineBand {
  /** `HH:MM`. A band that would wrap past the row's origin is not drawn. */
  from: string;
  to: string;
  /** A design-system chart class: `sleepband`, `coverband`. */
  className: string;
}

export interface TimelineMark {
  at: string;
  className: string;
  radius: number;
}

/** What one module puts on one day's row. Every part is optional. */
export interface TimelineParts {
  bands?: TimelineBand[];
  /** Full-height vertical rules. */
  ticks?: string[];
  marks?: TimelineMark[];
}

export interface TimelineRow {
  label: string;
  bands: readonly TimelineBand[];
  ticks: readonly string[];
  marks: readonly TimelineMark[];
}

export interface TimelineContribution {
  /** Sees only this module's own day record, the same as `derive` does. */
  parts: (day: Readonly<Record<string, unknown>>) => TimelineParts;
  /** This module's half of the sentence under the chart. */
  legend: string;
  /** Lower draws first, so a wide band goes underneath a narrow one. */
  weight: number;
}

/**
 * One column of the shared day-by-day table. Like the timeline, the table reads
 * from every module at once, so no module owns it and none declares a dependency
 * to appear in it. See docs/decisions/ADR-018-shared-day-table.md.
 */
export interface DayColumn {
  /** The column heading. */
  label: string;
  /** Lower prints further left. */
  weight: number;
  /** Right-aligned with tabular numerals. */
  numeric?: boolean;
  /**
   * The cell for one day, from this module's own day record. An empty string
   * becomes an em dash: the table owns how it says "nothing here".
   */
  cell: (day: Readonly<Record<string, unknown>>) => string;
  /** A smaller second line under the cell, for a detail that qualifies it. */
  note?: (day: Readonly<Record<string, unknown>>) => string;
  /** This column's clause in the sentence under the table. */
  legend?: string;
}

/**
 * One line of the screen-only reflection. It is shown to the person and to nobody
 * else: never printed, never exported, never part of a report.
 *
 * This is the honest half of the trade docs/03-scope.md makes. The app refuses to
 * assess a person for a clinician, and in exchange it tells the person plainly
 * what their own record looks like. See ADR-005 and ADR-019.
 */
export interface MirrorObservation {
  /** A short word for what this is about. */
  tag: string;
  text: string;
}

export interface MirrorContribution {
  /** Lower is shown first. The kernel shows at most four. */
  weight: number;
  /** Given the same context a report section gets, over the same range. */
  observations: (context: unknown) => MirrorObservation[];
}

export interface RecordsContribution {
  render(container: HTMLElement, context: unknown): void;
}

/**
 * Short phrases the kernel-owned report frame cannot compute for itself.
 *
 * The header, the footer and the record-quality note belong to the kernel, but
 * some of what they say is only knowable inside a module: the kernel must not
 * learn that a prescription has a name. A section may offer these; the frame
 * decides whether and where to use them, and works without any of them.
 * See docs/decisions/ADR-012-report-frame-contributions.md.
 */
export interface FrameContribution {
  /** What the record is about, for the header. The first one offered wins. */
  subject?: string;
  /** A clause appended to the header's coverage line. */
  header?: string;
  /** A sentence for "About this record" in the footer. */
  quality?: string;
}

export interface ReportSection {
  /** The named report this belongs to: `clinical`, `screening`, `observations`. */
  report: string;
  id: string;
  /**
   * The report engine owns the context and hands the same one to every section.
   * It arrives as `unknown` so a section narrows it to the slice it actually
   * reads, rather than every section depending on the whole shape.
   */
  title: (context: unknown) => string;
  /** Lower prints earlier. */
  weight: number;
  when?: (context: unknown) => boolean;
  render: (context: unknown) => string;
  renderText: (context: unknown) => string;
  /**
   * Called whether or not `when` includes the section: the frame still has to
   * name the record on a range too thin to draw sections from.
   */
  frame?: (context: unknown) => FrameContribution;
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
  /** This module's marks on the kernel's shared day timeline. */
  timeline?: TimelineContribution;
  /** This module's columns in the kernel's shared day-by-day table. */
  columns?: DayColumn[];
  /** What this module notices about the person's own record, for their eyes only. */
  mirror?: MirrorContribution;
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
  /**
   * Values that follow from what was just entered, merged into the day before
   * it is saved. Sees only this module's own day record, runs once per save,
   * and never overwrites what the person typed.
   * See docs/decisions/ADR-010-derived-fields.md.
   */
  derive?: (day: Readonly<Record<string, unknown>>) => Record<string, unknown>;
  fixtures?: ModuleFixtures;
}

/**
 * Where the Today assembler records which values it calculated itself, so an
 * automatic answer can be told from one the person typed. Reserved: no module
 * may declare a field at this path.
 *
 * It is metadata about the record, never part of it. Nothing that reads a day
 * for its content — the report engine included — may count it.
 * See docs/decisions/ADR-014-derived-value-provenance.md.
 */
export const DERIVED_METADATA_KEY = '_derived';

/**
 * Keys inside a day record that describe the record rather than belong to it.
 * A day carrying only these is an empty day.
 */
export const DAY_METADATA_KEYS: readonly string[] = [DERIVED_METADATA_KEY, 'createdAt'];

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
