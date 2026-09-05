// Running the v0 monolith.
//
// The other parity tests lift single functions out of the file and call them.
// The report cannot be lifted that way: it is built from module-level state,
// reads the range straight off a `<select>`, and writes into the document. So
// this boots the whole thing in jsdom against a seeded `localStorage` and reads
// the finished sheet back out, which is also closer to what the milestone
// actually claims — that a person who used the monolith notices nothing missing.
//
// reference/README.md: do not edit the monolith. Nothing here writes to it.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const HTML = readFileSync(resolve(process.cwd(), 'reference/adnotia-v0-monolith.html'), 'utf8');

/** The v0 storage key. The monolith reads nothing else. */
export const V0_STORAGE_KEY = 'adhd-titration-log-v1';

/** One day in the v0 shape: medication, sleep and the kernel's fields together. */
export interface V0Entry {
  date: string;
  [field: string]: unknown;
}

export interface V0State {
  entries: Record<string, V0Entry>;
  questions?: { id: string; text: string; added: string }[];
  baseline?: { focus: number | null; mood: number | null; sleep: string; note: string };
  overall?: string;
  lastAppt?: string;
  lastBackup?: string;
  last?: { med: string; dose: string; unit: string; times: string[] };
}

/** Every field the monolith's blank() defines, so a seeded day is not half-made. */
function blankEntry(date: string): V0Entry {
  return {
    date,
    med: '',
    dose: '',
    unit: 'mg',
    times: ['08:00'],
    carriedFrom: '',
    carriedBack: true,
    adherence: 'ontime',
    focus: null,
    mood: null,
    onset: '',
    woreOff: '',
    rebound: '',
    reboundTime: '',
    appetite: '',
    heart: '',
    bed: '',
    wake: '',
    sleep: '',
    sleepq: [],
    sleepLatency: '',
    sleepNote: '',
    side: [],
    notes: '',
    detail: {},
    win: '',
    miss: '',
  };
}

export function v0Entry(date: string, fields: Record<string, unknown>): V0Entry {
  return { ...blankEntry(date), ...fields, date };
}

export interface MonolithRun {
  /** The report sheet, as a person reading the screen would see it. */
  sheetText: string;
  sheetHtml: string;
  /** What "Copy as text" produces. */
  exportText: string;
  /** The History tab, one line per day. */
  historyText: string;
  window: Window & typeof globalThis;
}

export interface RunOptions {
  /** The value of the range select: `since`, `all`, or a number of days. */
  range?: string;
  /** What the monolith should believe today is. */
  today?: Date;
}

function flatten(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Boot the monolith over a v0 document and read its output back.
 *
 * The monolith's ranges are relative to the current date, so `today` is pinned:
 * without it a thirty-day fixture would fall out of a thirty-day window the day
 * after the fixture was written, and the parity test would rot silently.
 */
export function runMonolith(state: V0State, options: RunOptions = {}): MonolithRun {
  const console_ = new VirtualConsole();
  const errors: string[] = [];
  console_.on('jsdomError', (error: Error) => errors.push(error.message));

  const dom = new JSDOM(HTML, {
    url: 'https://adnotia.test/',
    runScripts: 'dangerously',
    virtualConsole: console_,
    beforeParse(window) {
      // Pinned before any script runs, because the monolith reads the clock
      // during boot to work out the logging day.
      if (options.today !== undefined) {
        const fixed = options.today.getTime();
        const RealDate = window.Date;
        class PinnedDate extends RealDate {
          constructor(...args: unknown[]) {
            super(...((args.length === 0 ? [fixed] : args) as [number]));
          }
          static override now(): number {
            return fixed;
          }
        }
        window.Date = PinnedDate as unknown as DateConstructor;
      }
      window.localStorage.setItem(V0_STORAGE_KEY, JSON.stringify(state));
      // Nothing in the report path prints or copies, but a stray call must not
      // take the run down with it.
      window.print = () => {};
    },
  });

  const { window } = dom;
  if (errors.length > 0) throw new Error(`The monolith threw while booting: ${errors[0]}`);

  const $ = (id: string): HTMLElement => {
    const found = window.document.getElementById(id);
    if (found === null) throw new Error(`The monolith has no #${id}`);
    return found;
  };

  if (options.range !== undefined) {
    const select = $('f-range') as HTMLSelectElement;
    select.value = options.range;
    select.dispatchEvent(new window.Event('change'));
  }

  // The History tab renders lazily, so it has to be opened.
  $('tab-history').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const historyText = flatten($('historyList').textContent);

  $('tab-summary').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const sheet = $('sheet');

  // summaryText is module-private, so it is reached the way a person does.
  let exportText = '';
  const clipboard = { writeText: async (text: string) => void (exportText = text) };
  Object.defineProperty(window.navigator, 'clipboard', { value: clipboard, configurable: true });
  $('copyTextBtn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  return {
    sheetText: flatten(sheet.textContent),
    sheetHtml: sheet.innerHTML,
    exportText,
    historyText,
    window: window as unknown as Window & typeof globalThis,
  };
}

/**
 * Build a v0 document from the module fixtures, inverting the mapping in
 * docs/06-data-model.md "The v0 monolith mapping".
 *
 * Both sides of a parity test are then driven from one dataset: the monolith
 * reads this, and the module build reads what `importV0` makes of it. A fixture
 * transcribed twice would only prove the two transcriptions agreed.
 */
export function toV0(input: {
  medication?: Record<string, Record<string, unknown>>;
  sleep?: Record<string, Record<string, unknown>>;
  kernel?: Record<string, Record<string, unknown>>;
  questions?: V0State['questions'];
  baseline?: V0State['baseline'];
  overall?: string;
  lastAppt?: string;
}): V0State {
  const dates = new Set([
    ...Object.keys(input.medication ?? {}),
    ...Object.keys(input.sleep ?? {}),
    ...Object.keys(input.kernel ?? {}),
  ]);

  const entries: Record<string, V0Entry> = {};
  for (const date of [...dates].sort()) {
    const night = input.sleep?.[date] ?? {};
    entries[date] = v0Entry(date, {
      ...(input.medication?.[date] ?? {}),
      // v0 spells the sleep fields differently; this is the inverse of the
      // rename the migration performs.
      ...(night['bed'] === undefined ? {} : { bed: night['bed'] }),
      ...(night['wake'] === undefined ? {} : { wake: night['wake'] }),
      ...(night['hours'] === undefined ? {} : { sleep: night['hours'] }),
      ...(night['quality'] === undefined ? {} : { sleepq: night['quality'] }),
      ...(night['latency'] === undefined ? {} : { sleepLatency: night['latency'] }),
      ...(night['note'] === undefined ? {} : { sleepNote: night['note'] }),
      ...(input.kernel?.[date] ?? {}),
    });
  }

  const state: V0State = { entries };
  if (input.questions !== undefined) state.questions = input.questions;
  if (input.baseline !== undefined) state.baseline = input.baseline;
  if (input.overall !== undefined) state.overall = input.overall;
  if (input.lastAppt !== undefined) state.lastAppt = input.lastAppt;
  return state;
}

/** The `<h2>`, `<h3>` and `<h4>` of a sheet, in order, as plain text. */
export function headingsOf(html: string): string[] {
  return [...html.matchAll(/<h([234])[^>]*>([\s\S]*?)<\/h\1>/g)].map(
    (match) => `h${match[1]} ${(match[2] ?? '').replace(/<[^>]+>/g, '').trim()}`,
  );
}

/**
 * A sheet split into its `<h3>` sections, keyed by heading, each flattened to one
 * line. Comparing section by section says which one differs; comparing whole
 * sheets says only that they do.
 */
export function sectionsOf(html: string): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = html.split(/(?=<h3)/);
  for (const part of parts) {
    const heading = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(part);
    if (heading === null) continue;
    const title = (heading[1] ?? '').replace(/<[^>]+>/g, '').trim();
    // SVG is compared by its presence, not its path data: the pixels are the
    // chart tests' business, and a one-unit difference is not a parity failure.
    const body = part
      .replace(/<svg[\s\S]*?<\/svg>/g, '[chart]')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      // The monolith wraps its figures in <b>, so stripping tags leaves a space
      // in front of the punctuation that followed them. That is an artefact of
      // flattening, not a difference between the two builds.
      .replace(/\s+([,.;:%])/g, '$1')
      .trim();
    sections.set(title, body);
  }
  return sections;
}
