// Chart primitives.
//
// The design system owns the chart vocabulary — the colours are named in
// docs/07-design-system.md and print.css maps every one of them to a grey — so
// the drawing lives here with the rest of the primitives rather than in whichever
// module drew one first. Modules say what to draw; none of them draws it.
//
// These build SVG as strings because a report section is a string: the same pass
// has to produce print HTML and a plain-text export, and there is not always a
// DOM to hang nodes on.
//
// Nothing here knows what a dose is. A band is a band.
//
// Ported from reference/adnotia-v0-monolith.html.

import { toMinutes, type ClockTime } from '../dates/index';
import type { TimelineRow } from '../registry/types';

const NS_TITLE_LIMIT = 200;

function escape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

/** SVG wants numbers, not `1.0000000000000002`. */
function n(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function svg(viewBox: string, title: string, body: string, height?: string): string {
  return (
    `<svg viewBox="${viewBox}" width="100%"${height === undefined ? '' : ` height="${height}"`}` +
    ` role="img" aria-label="${escape(title.slice(0, NS_TITLE_LIMIT))}">${body}</svg>`
  );
}

// ---------------------------------------------------------------- step chart

export interface StepColumn {
  /** The stair value, on the left scale. */
  step: number;
  /** A dot on the right scale. */
  point?: number | null;
  /** A dashed-line value on the right scale. */
  trend?: number | null;
  /** A bar below the axis. */
  flag?: boolean;
}

export interface StepChartOptions {
  columns: readonly StepColumn[];
  /** The right-hand scale the dots and the trend line are drawn against. */
  pointScale: { min: number; max: number; label: string };
  startLabel: string;
  endLabel: string;
  /** Read out by a screen reader in place of the picture. */
  title: string;
  legend: string;
}

/**
 * A stair line on a left scale with dots, a dashed trend and flag bars on a
 * right one. Two columns is the least that makes a line; below that the caller
 * gets an empty string and says something in words instead.
 */
export function stepChart(options: StepChartOptions): string {
  const { columns } = options;
  if (columns.length < 2) return '';

  const W = 640;
  const H = 130;
  const PL = 34;
  const PR = 30;
  const PT = 10;
  const PB = 20;

  const values = columns.map((column) => column.step);
  const top = Math.max(...values);
  const x = (index: number): number => PL + (index * (W - PL - PR)) / (columns.length - 1);
  const y = (value: number): number => PT + (H - PT - PB) * (1 - value / (top || 1));

  const { min, max } = options.pointScale;
  const yPoint = (value: number): number =>
    PT + (H - PT - PB) * (1 - (value - min) / (max - min || 1));

  // The stair: across at the old value, then up or down to the new one, so a
  // dose change reads as the step it was rather than a diagonal drift.
  let path = '';
  columns.forEach((column, index) => {
    if (index === 0) {
      path += `M${n(x(0))} ${n(y(column.step))}`;
      return;
    }
    const previous = columns[index - 1] as StepColumn;
    path += ` L${n(x(index))} ${n(y(previous.step))} L${n(x(index))} ${n(y(column.step))}`;
  });

  let marks = '';
  let trend = '';
  let segments = 0;
  columns.forEach((column, index) => {
    if (typeof column.point === 'number') {
      marks += `<circle class="dot" cx="${n(x(index))}" cy="${n(yPoint(column.point))}" r="2"/>`;
    }
    if (column.flag === true) {
      marks += `<rect class="rb" x="${n(x(index) - 1.5)}" y="${n(H - PB + 3)}" width="3" height="5"/>`;
    }
    if (typeof column.trend === 'number') {
      trend += `${segments === 0 ? 'M' : ' L'}${n(x(index))} ${n(yPoint(column.trend))}`;
      segments++;
    }
  });

  const body =
    `<line class="axis" x1="${PL}" y1="${H - PB}" x2="${W - PR}" y2="${H - PB}"/>` +
    `<text class="tick" x="0" y="${n(y(top) + 3)}">${escape(String(top))}</text>` +
    `<text class="tick" x="0" y="${H - PB + 3}">0</text>` +
    `<text class="tick" x="${W - PR + 5}" y="${n(yPoint(max) + 3)}">${escape(options.pointScale.label)}</text>` +
    `<text class="tick" x="${W - PR + 5}" y="${n(yPoint(min) + 3)}">${escape(String(min))}</text>` +
    `<path class="stair" d="${path}"/>` +
    // One point is not a trend. Two is the least that draws as a line.
    (segments >= 2 ? `<path class="trend" d="${trend}"/>` : '') +
    marks +
    `<text class="tick" x="${PL}" y="${H - 4}">${escape(options.startLabel)}</text>` +
    `<text class="tick" x="${W - PR}" y="${H - 4}" text-anchor="end">${escape(options.endLabel)}</text>`;

  return svg(`0 0 ${W} ${H}`, options.title, body, '120') + legend(options.legend);
}

/** Whether `stepChart` would draw anything for this many columns. */
export function stepChartNeeds(columns: number): boolean {
  return columns >= 2;
}

// ------------------------------------------------------------- day timeline

export interface DayTimelineOptions {
  rows: readonly TimelineRow[];
  /**
   * Where the row starts, in minutes past midnight. 18:00 by default, so a
   * night's sleep and the next day's cover read left to right in the order they
   * happened instead of being cut in half at midnight.
   */
  origin?: number;
  title: string;
  legend: string;
}

const DAY = 1440;
const DEFAULT_ORIGIN = 18 * 60;

/** The clock labels under the axis, at the origin and every six hours after it. */
function axisLabels(origin: number): string[] {
  const names = ['midnight', '6am', 'noon', '6pm'];
  return [0, 360, 720, 1080, 1440].map((offset) => {
    const minute = (origin + offset) % DAY;
    return names[minute / 360] ?? `${minute / 60}:00`;
  });
}

export function dayTimeline(options: DayTimelineOptions): string {
  const { rows } = options;
  if (rows.length === 0) return '';

  const origin = options.origin ?? DEFAULT_ORIGIN;
  const W = 640;
  const PL = 40;
  const PR = 8;
  const PT = 16;
  // Rows thin out as the range grows, but never below six pixels: under that a
  // band is a smudge rather than a shape.
  const RH = Math.max(6, Math.min(11, Math.round(300 / rows.length)));
  const GAP = 2;
  const H = PT + rows.length * (RH + GAP) + 22;

  const position = (time: ClockTime): number | null => {
    const minutes = toMinutes(time);
    return minutes === null ? null : (minutes - origin + DAY) % DAY;
  };
  const x = (offset: number): number => PL + (offset * (W - PL - PR)) / DAY;

  let body = '';
  let labels = '';

  rows.forEach((row, index) => {
    const y = PT + index * (RH + GAP);
    body += `<rect class="gapband" x="${PL}" y="${n(y)}" width="${n(W - PL - PR)}" height="${RH}"/>`;

    for (const band of row.bands) {
      const from = position(band.from);
      const to = position(band.to);
      // A band that wraps past the origin is not drawn rather than drawn wrong.
      if (from === null || to === null || to <= from) continue;
      body +=
        `<rect class="${escape(band.className)}" x="${n(x(from))}" y="${n(y)}"` +
        ` width="${n(x(to) - x(from))}" height="${RH}"/>`;
    }

    for (const tick of row.ticks) {
      const at = position(tick);
      if (at === null) continue;
      body +=
        `<line class="dosetick" x1="${n(x(at))}" y1="${n(y - 1)}"` +
        ` x2="${n(x(at))}" y2="${n(y + RH + 1)}"/>`;
    }

    for (const mark of row.marks) {
      const at = position(mark.at);
      if (at === null) continue;
      body +=
        `<circle class="${escape(mark.className)}" cx="${n(x(at))}"` +
        ` cy="${n(y + RH / 2)}" r="${n(mark.radius)}"/>`;
    }

    // Three labels: enough to place a row in time, few enough to stay legible.
    if (index === 0 || index === rows.length - 1 || index === Math.floor(rows.length / 2)) {
      labels += `<text class="tick" x="0" y="${n(y + RH)}">${escape(row.label)}</text>`;
    }
  });

  const names = axisLabels(origin);
  let ticks = '';
  [0, 360, 720, 1080, 1440].forEach((offset, index) => {
    const anchor = index === 0 ? 'start' : index === 4 ? 'end' : 'middle';
    ticks +=
      `<line class="grid" x1="${n(x(offset))}" y1="${PT - 4}" x2="${n(x(offset))}" y2="${H - 20}"/>` +
      `<text class="tick" x="${n(x(offset))}" y="${H - 8}" text-anchor="${anchor}">` +
      `${escape(names[index] ?? '')}</text>`;
  });

  return svg(`0 0 ${W} ${H}`, options.title, ticks + body + labels) + legend(options.legend);
}

// ------------------------------------------------------------ severity grid

export interface GridOptions {
  rowLabels: readonly string[];
  /** One row per label, one cell per column, each holding a class name. */
  cells: readonly (readonly string[])[];
  startLabel: string;
  endLabel: string;
  title: string;
  legend: string;
}

export function severityGrid(options: GridOptions): string {
  const rows = options.rowLabels.length;
  const columns = options.cells[0]?.length ?? 0;
  if (rows === 0 || columns === 0) return '';

  const W = 640;
  const PL = 120;
  const PR = 8;
  const PT = 6;
  const RH = 13;
  const GAP = 3;
  const H = PT + rows * (RH + GAP) + 16;
  const cw = (W - PL - PR) / columns;

  let cells = '';
  let labels = '';

  options.rowLabels.forEach((label, row) => {
    const y = PT + row * (RH + GAP);
    labels += `<text class="tick" x="0" y="${n(y + RH - 3)}">${escape(label)}</text>`;
    (options.cells[row] ?? []).forEach((className, column) => {
      cells +=
        `<rect class="${escape(className)}" x="${n(PL + column * cw)}" y="${n(y)}"` +
        ` width="${n(Math.max(1, cw - 0.8))}" height="${RH}"/>`;
    });
  });

  const body =
    cells +
    labels +
    `<text class="tick" x="${PL}" y="${H - 3}">${escape(options.startLabel)}</text>` +
    `<text class="tick" x="${W - PR}" y="${H - 3}" text-anchor="end">${escape(options.endLabel)}</text>`;

  return svg(`0 0 ${W} ${H}`, options.title, body) + legend(options.legend);
}

function legend(text: string): string {
  return text === '' ? '' : `<p class="legend">${escape(text)}</p>`;
}

/**
 * What the plain-text export says where a chart was. docs/07-design-system.md:
 * charts are replaced by a bracketed note, not by a table of coordinates.
 */
export function chartNote(what: string): string {
  return `[${what} — see the printed or PDF version]`;
}
