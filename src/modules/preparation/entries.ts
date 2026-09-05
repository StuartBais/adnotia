// The entries, and how they are read back.
//
// Day-keyed like every other module's daily data (docs/06-data-model.md), with
// an array inside, because more than one thing can happen in a day and each is
// its own example.
//
// Nothing in this file counts anything toward anything. The coverage figures
// describe the record — how many entries, over how long, from where — in the same
// way the report header already describes the clinical record. They are never
// followed by an interpretation. See ADR-024.

import { daysBetween, formatShortDate, formatWeekday, el, type IsoDate } from '../../kernel/index';
import { LABELS, TOOL_STRINGS } from './strings';

export interface PreparationEntry {
  /** Stable, so an entry can be removed without depending on its position. */
  id: string;
  where: string;
  what: string;
  before?: string;
  cost?: string;
}

export interface PreparationDay {
  entries?: PreparationEntry[];
}

export interface PreparationSlice {
  version: number;
  days?: Record<IsoDate, PreparationDay>;
  /** What the person has gathered about their own childhood. Free text, never rated. */
  childhood?: string;
}

export interface DatedEntry extends PreparationEntry {
  date: IsoDate;
}

/** Every entry, newest first, with the day it belongs to attached. */
export function allEntries(slice: PreparationSlice | undefined): DatedEntry[] {
  const days = slice?.days ?? {};
  const out: DatedEntry[] = [];
  for (const date of Object.keys(days).sort().reverse()) {
    for (const entry of days[date]?.entries ?? []) out.push({ ...entry, date });
  }
  return out;
}

export interface Coverage {
  entries: number;
  weeks: number;
  /** The settings written about, as the person would name them. */
  settings: string[];
}

/**
 * A description of the record, not a measurement of the person. It says how much
 * there is and where it came from, and stops. Whether that is a lot is not
 * something this module has an opinion about.
 */
export function coverage(entries: readonly DatedEntry[]): Coverage {
  if (entries.length === 0) return { entries: 0, weeks: 0, settings: [] };

  const dates = entries.map((entry) => entry.date).sort();
  const span = daysBetween(dates[0] as IsoDate, dates[dates.length - 1] as IsoDate) + 1;

  const settings: string[] = [];
  for (const entry of entries) {
    const label = LABELS.get(entry.where);
    if (label !== undefined && !settings.includes(label)) settings.push(label);
  }

  return { entries: entries.length, weeks: Math.max(1, Math.round(span / 7)), settings };
}

/** "at work and at home", lower-cased so it reads inside a sentence. */
export function settingsPhrase(settings: readonly string[]): string {
  const words = settings.map((setting) => setting.toLowerCase());
  if (words.length === 0) return '';
  if (words.length === 1) return words[0] as string;
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** One entry as a person reads it back: what happened, then the detail. */
export function describe(entry: DatedEntry): string[] {
  const lines = [entry.what];
  if ((entry.before ?? '') !== '') lines.push(`Beforehand: ${entry.before}`);
  if ((entry.cost ?? '') !== '') lines.push(`It cost: ${entry.cost}`);
  return lines;
}

export function renderRecords(container: HTMLElement, context: { slice?: PreparationSlice }): void {
  container.replaceChildren();
  const entries = allEntries(context.slice);
  if (entries.length === 0) {
    container.append(el('p', { class: 'hint', text: TOOL_STRINGS.empty }));
    return;
  }

  for (const entry of entries) {
    container.append(
      el('div', { class: 'entry' }, [
        el('b', {
          text:
            `${formatShortDate(entry.date)}, ${formatWeekday(entry.date)} · ` +
            `${LABELS.get(entry.where) ?? entry.where}`,
        }),
        el('span', { text: describe(entry).join(' · ') }),
      ]),
    );
  }
}
