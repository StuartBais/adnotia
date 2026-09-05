// What a report is, and what every section is handed.
//
// The kernel owns reports: the header, the footer, the ordering, the print
// stylesheet and the plain-text export. Modules contribute sections and nothing
// else. See docs/01-module-contract.md "reports" and docs/05-architecture.md
// "Reports engine".

import type { IsoDate } from '../dates/index';
import type { Baseline, KernelDay, Question, Space } from '../store/document';

/**
 * How much of the log to cover. A number is that many days back from today,
 * `since` is everything after the last appointment, `all` is the whole log.
 */
export type RangeChoice = 'since' | 'all' | number;

export interface Range {
  choice: RangeChoice;
  /** The first logged day in the range. Empty string when nothing is logged. */
  from: IsoDate;
  /** The last logged day in the range. */
  to: IsoDate;
  /** Every date from `from` to `to`, ascending, logged or not. */
  dates: readonly IsoDate[];
  /** The days in `dates` that have anything recorded, ascending. */
  logged: readonly IsoDate[];
  /** Set only when the choice was `since` and there is an appointment to date from. */
  sinceAppointment?: IsoDate;
}

export interface Coverage {
  /** Days with anything recorded. */
  logged: number;
  /** Days between the first and last entry, inclusive. */
  ofDays: number;
  /** `logged / ofDays`, rounded, 0–100. */
  percent: number;
}

/** A day record as a report sees it: whatever the module wrote. */
export type ReportDay = Readonly<Record<string, unknown>>;

/**
 * Handed to every section of a report. `days` is bound per section to the days
 * of the module that contributed it, so a section reads its own data by the same
 * name whichever module it belongs to; a declared dependency's days arrive under
 * `moduleDays`, and only when that module is enabled.
 */
export interface ReportContext {
  report: string;
  range: Range;
  /** `range.dates`. Sections iterate this and skip the days they have nothing for. */
  dates: readonly IsoDate[];
  coverage: Coverage;
  days: Readonly<Record<IsoDate, ReportDay>>;
  moduleDays: Readonly<Record<string, Readonly<Record<IsoDate, ReportDay>>>>;
  /** Wins, misses and notes belong to the kernel and any section may read them. */
  kernelDays: Readonly<Record<IsoDate, KernelDay>>;
  questions: readonly Question[];
  baseline?: Baseline;
  overall?: string;
  /** The day the report was produced, for the generated line. */
  generatedOn: IsoDate;
}

export interface ReportDefinition {
  name: string;
  /**
   * The heading a clinician reads first. Kernel-owned, and deliberately says
   * nothing about medication: a build without the medication module still
   * produces this report.
   */
  title: string;
  audience: Space;
  /** The line on the export card, in the person's own space. */
  blurb: string;
  /** The heading when there is nothing in range, and the line under it. */
  emptyTitle: string;
  emptyBody: string;
}

export const REPORTS: Readonly<Record<string, ReportDefinition>> = {
  clinical: {
    name: 'clinical',
    title: 'Daily record',
    audience: 'adult',
    blurb: 'A single page your prescriber can read in under a minute.',
    emptyTitle: 'Nothing to summarise yet',
    emptyBody:
      'Log a few days first. Aim for at least a week at each dose before the appointment — ' +
      'that is usually the shortest stretch a prescriber can read a pattern from.',
  },
};
