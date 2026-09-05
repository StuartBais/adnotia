// "Day by day": every day in the range, one row each.
//
// The section a prescriber scans when a figure above it surprises them, so its
// job is to be complete rather than clever. It computes nothing: every cell is a
// value the person entered, printed as they entered it.
//
// Like the cover chart, it reads from every module at once and so belongs to
// none of them. Modules declare columns; the kernel orders them, fills them and
// draws the table. See docs/decisions/ADR-018-shared-day-table.md.

import type { ReportSection } from '../../registry/types';
import { escapeHtml } from '../html';
import type { DayTable, ReportContext } from '../types';

const HEADING = 'Day by day';

/** The table's own way of saying a cell is empty. Columns return ''. */
const NOTHING = '—';

function cellText(text: string): string {
  return text === '' ? NOTHING : text;
}

export function render(table: DayTable): string {
  if (table.rows.length === 0) return '';

  const head =
    '<th>Day</th>' +
    table.columns
      .map(
        (column) =>
          `<th${column.numeric === true ? ' class="num"' : ''}>${escapeHtml(column.label)}</th>`,
      )
      .join('');

  const body = table.rows
    .map((row) => {
      const cells = row.cells
        .map((cell, index) => {
          const column = table.columns[index];
          const note =
            cell.note === '' ? '' : `<br><span class="sev">${escapeHtml(cell.note)}</span>`;
          return (
            `<td${column?.numeric === true ? ' class="num"' : ''}>` +
            `${escapeHtml(cellText(cell.text))}${note}</td>`
          );
        })
        .join('');
      return `<tr><td>${escapeHtml(row.label)}</td>${cells}</tr>`;
    })
    .join('');

  return (
    `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>` +
    (table.legend === '' ? '' : `<p class="legend">${escapeHtml(table.legend)}</p>`)
  );
}

export function renderText(table: DayTable): string[] {
  if (table.rows.length === 0) return [];

  const lines = [['Day', ...table.columns.map((column) => column.label)].join(' | ')];
  for (const row of table.rows) {
    lines.push(
      [
        row.label,
        ...row.cells.map((cell) =>
          cell.note === '' ? cellText(cell.text) : `${cellText(cell.text)} (${cell.note})`,
        ),
      ].join(' | '),
    );
  }
  if (table.legend !== '') lines.push(table.legend);
  return lines;
}

export const dayTableSection: ReportSection = {
  report: 'clinical',
  // Between what changed in daily life and the person's own notes, as the
  // monolith had it: the numbers, then the sentences about them.
  weight: 75,
  id: 'kernel.dayTable',
  title: () => HEADING,

  when: (context) => (context as ReportContext).table.rows.length > 0,

  render: (context) => {
    const table = render((context as ReportContext).table);
    return table === '' ? '' : `<h3>${HEADING}</h3>${table}`;
  },

  renderText: (context) =>
    [HEADING, '-'.repeat(HEADING.length), ...renderText((context as ReportContext).table)].join(
      '\n',
    ),
};
