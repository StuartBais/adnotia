// The report engine.
//
// It collects the sections for a named report, works out what the report covers,
// hands every section the same shape of context, orders them by weight, and wraps
// the result in the kernel's header and footer. Modules decide what their section
// says; they decide nothing about the document it lands in.
//
// Print HTML and the plain-text export are produced from the same pass over the
// same sections, so the two cannot drift: a section that forgets `renderText`
// still has to say so at compile time.
//
// See docs/05-architecture.md "Reports engine".

import { formatShortDate, today, type IsoDate } from '../dates/index';
import type { AdnotiaDocument } from '../store/document';
import type {
  FrameContribution,
  ModuleManifest,
  ReportSection,
  TimelineRow,
} from '../registry/types';
import { escapeHtml } from './html';
import { headerHtml, headerParts, headerText } from './header';
import {
  aboutHtml,
  aboutParts,
  aboutText,
  generatedLine,
  questionsHtml,
  questionsText,
} from './footer';
import { coverageOf, resolveRange } from './range';
import { KERNEL_SECTIONS } from './sections/index';
import {
  REPORTS,
  type RangeChoice,
  type ReportContext,
  type ReportDay,
  type ReportDefinition,
} from './types';

type Days = Record<IsoDate, ReportDay>;

export interface BuildReportOptions {
  /** Defaults to `clinical`. */
  report?: string;
  document: AdnotiaDocument;
  /** The person's enabled modules, in their chosen order. */
  modules: readonly ModuleManifest[];
  /** Defaults to the last 30 days, as the monolith did. */
  choice?: RangeChoice;
  now?: Date;
}

export interface Report {
  definition: ReportDefinition;
  /** The kernel's own view: no module bound to `days`. */
  context: ReportContext;
  /** True when nothing falls in the range. The caller shows the empty state. */
  empty: boolean;
  /** The sections that survived their own `when`, in print order. */
  included: readonly ReportSection[];
  html: string;
  text: string;
}

/** A day record counts as logged only if something is actually in it. */
function hasContent(record: ReportDay | undefined): boolean {
  if (record === undefined) return false;
  for (const value of Object.values(record)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) return true;
      continue;
    }
    if (typeof value === 'object') {
      if (Object.keys(value).length > 0) return true;
      continue;
    }
    return true;
  }
  return false;
}

function daysOf(document: AdnotiaDocument, moduleId: string): Days {
  return ((document.modules[moduleId] as { days?: Days } | undefined)?.days ?? {}) as Days;
}

/**
 * Every day the person put something on, across the modules that are on. A day
 * carrying only a win or a note still happened, so the kernel's own days count.
 */
export function loggedDates(
  document: AdnotiaDocument,
  modules: readonly ModuleManifest[],
): IsoDate[] {
  const dates = new Set<IsoDate>();

  for (const manifest of modules) {
    for (const [date, record] of Object.entries(daysOf(document, manifest.id))) {
      if (hasContent(record)) dates.add(date);
    }
  }
  for (const [date, record] of Object.entries(document.kernel.days)) {
    // `createdAt` alone is a timestamp on an empty day, not a record of one.
    const { createdAt: _ignored, ...rest } = record;
    if (hasContent(rest)) dates.add(date);
  }
  return [...dates];
}

/**
 * One row per day, built from every module that puts anything on the timeline.
 * A day with nothing on it is left out rather than drawn empty: a page of blank
 * rows says the person failed to log, which is not what the chart is for.
 */
export function buildTimeline(
  document: AdnotiaDocument,
  modules: readonly ModuleManifest[],
  dates: readonly IsoDate[],
): { rows: TimelineRow[]; legend: string } {
  const contributors = modules
    .filter((manifest) => manifest.contributes.timeline !== undefined)
    .sort((a, b) => a.contributes.timeline!.weight - b.contributes.timeline!.weight);
  if (contributors.length === 0) return { rows: [], legend: '' };

  const rows: TimelineRow[] = [];
  for (const date of dates) {
    const bands: TimelineRow['bands'][number][] = [];
    const ticks: string[] = [];
    const marks: TimelineRow['marks'][number][] = [];

    for (const manifest of contributors) {
      const day = daysOf(document, manifest.id)[date];
      if (day === undefined) continue;
      const parts = manifest.contributes.timeline!.parts(day);
      bands.push(...(parts.bands ?? []));
      ticks.push(...(parts.ticks ?? []));
      marks.push(...(parts.marks ?? []));
    }

    if (bands.length === 0 && ticks.length === 0 && marks.length === 0) continue;
    rows.push({ label: formatShortDate(date), bands, ticks, marks });
  }

  return {
    rows,
    legend: contributors.map((manifest) => manifest.contributes.timeline!.legend).join(' '),
  };
}

export function buildReport(options: BuildReportOptions): Report {
  const name = options.report ?? 'clinical';
  const definition = REPORTS[name];
  if (definition === undefined) throw new Error(`Unknown report: ${name}`);

  const { document } = options;
  const now = options.now ?? new Date();

  // A report only ever sees modules that may contribute to it. The clinical
  // report is adult-only; docs/04-family-space.md is explicit about that.
  const modules = options.modules.filter((manifest) => manifest.audience === definition.audience);

  const range = resolveRange({
    choice: options.choice ?? 30,
    logged: loggedDates(document, modules),
    now,
    ...(document.kernel.lastAppointment !== undefined
      ? { lastAppointment: document.kernel.lastAppointment }
      : {}),
  });

  const timeline = buildTimeline(document, modules, range.dates);

  const base: ReportContext = {
    report: name,
    range,
    dates: range.dates,
    coverage: coverageOf(range),
    days: {},
    moduleDays: {},
    kernelDays: document.kernel.days,
    questions: document.kernel.questions,
    generatedOn: today(now),
    timeline: timeline.rows,
    timelineLegend: timeline.legend,
    ...(document.kernel.baseline !== undefined ? { baseline: document.kernel.baseline } : {}),
    ...(document.kernel.overall !== undefined && document.kernel.overall !== ''
      ? { overall: document.kernel.overall }
      : {}),
  };

  const enabled = new Set(modules.map((manifest) => manifest.id));

  /** A module's sections see their own days, and their declared dependencies'. */
  function contextFor(manifest: ModuleManifest): ReportContext {
    const moduleDays: Record<string, Days> = {};
    for (const dependency of manifest.dependencies ?? []) {
      if (enabled.has(dependency)) moduleDays[dependency] = daysOf(document, dependency);
    }
    return { ...base, days: daysOf(document, manifest.id), moduleDays };
  }

  const bound: { section: ReportSection; context: ReportContext }[] = [];
  for (const manifest of modules) {
    const context = contextFor(manifest);
    for (const section of manifest.contributes.reports ?? []) {
      if (section.report === name) bound.push({ section, context });
    }
  }
  for (const section of KERNEL_SECTIONS) {
    if (section.report === name) bound.push({ section, context: base });
  }
  bound.sort((a, b) => a.section.weight - b.section.weight);

  // Frame contributions are gathered before `when` runs: the header still has to
  // name the record when the range is too thin for any section to draw.
  const frames: FrameContribution[] = [];
  for (const entry of bound) {
    if (typeof entry.section.frame !== 'function') continue;
    frames.push(entry.section.frame(entry.context));
  }
  const subject = frames
    .map((frame) => frame.subject)
    .find((value) => value !== undefined && value !== '');
  const headerExtras = frames
    .map((frame) => frame.header)
    .filter((value): value is string => value !== undefined && value !== '');
  const qualityExtras = frames
    .map((frame) => frame.quality)
    .filter((value): value is string => value !== undefined && value !== '');

  if (range.dates.length === 0) {
    return {
      definition,
      context: base,
      empty: true,
      included: [],
      html: `<h2>${escapeHtml(definition.emptyTitle)}</h2><p class="meta">${escapeHtml(definition.emptyBody)}</p>`,
      text: [
        definition.emptyTitle,
        '='.repeat(definition.emptyTitle.length),
        definition.emptyBody,
      ].join('\n'),
    };
  }

  const included = bound.filter(
    (entry) => typeof entry.section.when !== 'function' || entry.section.when(entry.context),
  );

  const parts = headerParts(base, definition, subject, headerExtras);
  const about = aboutParts(base, qualityExtras);

  const html =
    headerHtml(parts) +
    included.map((entry) => entry.section.render(entry.context)).join('') +
    aboutHtml(about) +
    questionsHtml(base.questions);

  const text = [
    ...headerText(parts),
    ...included.flatMap((entry) => ['', entry.section.renderText(entry.context)]),
    ...aboutText(about),
    ...questionsText(base.questions),
    '',
    generatedLine(base.generatedOn),
  ].join('\n');

  return {
    definition,
    context: base,
    empty: false,
    included: included.map((entry) => entry.section),
    html,
    text,
  };
}
