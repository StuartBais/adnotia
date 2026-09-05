// The report footer: how the record was kept, and what the person wants to ask.
//
// Both are kernel-owned. "About this record" is the honest replacement for the
// covert credibility scoring this project rejected: the same facts, stated
// openly, shown to the person in the same words. See ADR-005 and
// docs/03-scope.md "Why there is no covert assessment".
//
// The questions go last because that is where a conversation ends. They are the
// person's own words, printed unedited.

import { formatLongDate } from '../dates/index';
import type { Question } from '../store/document';
import { escapeHtml } from './html';
import { qualityLines, recordQuality } from './quality';
import type { ReportContext } from './types';

/** Ported verbatim from the monolith. Reviewed clinician-facing wording. */
export const RECORD_LEGEND =
  "Kept in Adnotia, a self-managed daily log on the patient's phone, unverified. " +
  'Ratings are self-reported and recalled at the end of each day. ' +
  'This section is shown to the patient too.';

export const ABOUT_HEADING = 'About this record';
export const QUESTIONS_HEADING = 'Questions for this appointment';

export function aboutParts(context: ReportContext, contributed: readonly string[]): string[] {
  return qualityLines(recordQuality(context.dates, context.kernelDays), contributed);
}

export function aboutHtml(lines: readonly string[]): string {
  return (
    `<h3>${ABOUT_HEADING}</h3>` +
    `<p class="meta">${escapeHtml(lines.join(' '))}</p>` +
    `<p class="legend">${escapeHtml(RECORD_LEGEND)}</p>`
  );
}

export function aboutText(lines: readonly string[]): string[] {
  return ['', ABOUT_HEADING, '-'.repeat(ABOUT_HEADING.length), lines.join(' '), RECORD_LEGEND];
}

export function questionsHtml(questions: readonly Question[]): string {
  if (questions.length === 0) return '';
  return (
    `<h3>${QUESTIONS_HEADING}</h3><ol class="ask">` +
    questions.map((question) => `<li>${escapeHtml(question.text)}</li>`).join('') +
    '</ol>'
  );
}

export function questionsText(questions: readonly Question[]): string[] {
  if (questions.length === 0) return [];
  return [
    '',
    QUESTIONS_HEADING,
    '-'.repeat(QUESTIONS_HEADING.length),
    ...questions.map((question, index) => `${index + 1}. ${question.text}`),
  ];
}

/** The last line of the text export. The printed version carries the same words. */
export function generatedLine(generatedOn: string): string {
  return `Generated ${formatLongDate(generatedOn)} from a self-kept daily log.`;
}
