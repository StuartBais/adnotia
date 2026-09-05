// "What changed in daily life" and "In their words".
//
// Wins, misses and the day's note are kernel fields, not medication fields: a
// person logging only sleep still has days that went better and days that fell
// apart, and any report may read them. See docs/01-module-contract.md, which
// moves these out of the medication module for exactly that reason.
//
// These are the sections a prescriber actually remembers from the sheet, so they
// are the person's own sentences, printed unedited and never summarised.
//
// Ported from the monolith's lifeBlock and notesBlock.

import { formatShortDate, type IsoDate } from '../../dates/index';
import type { ReportSection } from '../../registry/types';
import { escapeHtml } from '../html';
import type { ReportContext } from '../types';

/** Enough to show the texture of the range without becoming the whole report. */
const MAX_ENTRIES = 8;
const MAX_NOTES = 12;

export interface LifeLine {
  date: IsoDate;
  text: string;
}

/** Most recent first: the days nearest the appointment are the ones discussed. */
function collect(
  context: ReportContext,
  field: 'win' | 'miss' | 'notes',
  limit: number,
): LifeLine[] {
  const lines: LifeLine[] = [];
  for (let index = context.dates.length - 1; index >= 0 && lines.length < limit; index--) {
    const date = context.dates[index] as IsoDate;
    const value = context.kernelDays[date]?.[field];
    if (typeof value !== 'string' || value.trim() === '') continue;
    lines.push({ date, text: value.trim() });
  }
  return lines;
}

export function lifeLines(context: ReportContext): { wins: LifeLine[]; misses: LifeLine[] } {
  return {
    wins: collect(context, 'win', MAX_ENTRIES),
    misses: collect(context, 'miss', MAX_ENTRIES),
  };
}

export function noteLines(context: ReportContext): LifeLine[] {
  return collect(context, 'notes', MAX_NOTES);
}

const LIFE_HEADING = 'What changed in daily life';
const WINS_HEADING = 'Went better than usual';
const MISSES_HEADING = 'Still fell apart';
const NOTES_HEADING = 'In their words';

function column(heading: string, lines: readonly LifeLine[]): string {
  const body =
    lines.length > 0
      ? lines
          .map(
            (line) =>
              `<p class="noteline"><b>${escapeHtml(formatShortDate(line.date))}</b> ${escapeHtml(line.text)}</p>`,
          )
          .join('')
      : '<p class="meta">Nothing noted.</p>';
  return `<div class="col"><h4>${escapeHtml(heading)}</h4>${body}</div>`;
}

function columnText(heading: string, lines: readonly LifeLine[]): string[] {
  return [
    '',
    `${heading}:`,
    ...(lines.length > 0
      ? lines.map((line) => `${formatShortDate(line.date)} ${line.text}`)
      : ['Nothing noted.']),
  ];
}

export const lifeSection: ReportSection = {
  report: 'clinical',
  id: 'kernel.life',
  weight: 70,
  title: () => LIFE_HEADING,

  when: (context) => {
    const { wins, misses } = lifeLines(context as ReportContext);
    return wins.length > 0 || misses.length > 0;
  },

  render: (context) => {
    const { wins, misses } = lifeLines(context as ReportContext);
    return (
      `<h3>${LIFE_HEADING}</h3><div class="twocol">` +
      column(WINS_HEADING, wins) +
      column(MISSES_HEADING, misses) +
      '</div>'
    );
  },

  renderText: (context) => {
    const { wins, misses } = lifeLines(context as ReportContext);
    return [
      LIFE_HEADING,
      '-'.repeat(LIFE_HEADING.length),
      ...columnText(WINS_HEADING, wins),
      ...columnText(MISSES_HEADING, misses),
    ].join('\n');
  },
};

export const notesSection: ReportSection = {
  report: 'clinical',
  id: 'kernel.notes',
  weight: 80,
  title: () => NOTES_HEADING,
  when: (context) => noteLines(context as ReportContext).length > 0,

  render: (context) =>
    `<h3>${NOTES_HEADING}</h3>` +
    noteLines(context as ReportContext)
      .map(
        (line) =>
          `<p class="noteline"><b>${escapeHtml(formatShortDate(line.date))}</b> ${escapeHtml(line.text)}</p>`,
      )
      .join(''),

  renderText: (context) =>
    [
      NOTES_HEADING,
      '-'.repeat(NOTES_HEADING.length),
      ...noteLines(context as ReportContext).map(
        (line) => `${formatShortDate(line.date)} ${line.text}`,
      ),
    ].join('\n'),
};
