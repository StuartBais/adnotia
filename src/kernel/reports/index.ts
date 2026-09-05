export {
  REPORTS,
  type Coverage,
  type Range,
  type RangeChoice,
  type ReportContext,
  type ReportDay,
  type ReportDefinition,
} from './types';
export { coverageOf, resolveRange, type RangeOptions } from './range';
export { escapeHtml } from './html';
export { qualityLines, recordQuality, type RecordQuality } from './quality';
export { headerHtml, headerParts, headerText, type HeaderParts } from './header';
export {
  ABOUT_HEADING,
  QUESTIONS_HEADING,
  RECORD_LEGEND,
  aboutHtml,
  aboutParts,
  aboutText,
  generatedLine,
  questionsHtml,
  questionsText,
} from './footer';
export {
  KERNEL_SECTIONS,
  lifeLines,
  lifeSection,
  noteLines,
  notesSection,
  timelineSection,
  type LifeLine,
} from './sections/index';
export {
  buildReport,
  buildTimeline,
  loggedDates,
  type BuildReportOptions,
  type Report,
} from './engine';
export { mountReport, type ReportView, type ReportViewOptions } from './view';
export { EXPORT_STRINGS, OVERALL, QUESTION_STRINGS, RANGE_OPTIONS, overallLabel } from './strings';
