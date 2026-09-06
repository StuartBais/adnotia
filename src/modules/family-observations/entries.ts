// The entries.
//
// docs/04-family-space.md fixes the four fields: when and where, what happened
// in the parent's words, what was going on beforehand, and what helped if
// anything. Day-keyed like every other module's daily data.
//
// "Nothing is scored. Nothing is rated on a scale." The coverage figures
// describe the record — how many, over how long, from where — and are never
// followed by an interpretation of it.

import { daysBetween, el, formatShortDate, formatWeekday, type IsoDate } from '../../kernel/index';
import { TOOL_STRINGS, WHERE_LABELS } from './strings';

export interface Observation {
  id: string;
  where: string;
  what: string;
  before?: string;
  helped?: string;
}

export interface ObservationDay {
  entries?: Observation[];
}

export interface ObservationsSlice {
  version: number;
  days?: Record<IsoDate, ObservationDay>;
}

export interface DatedObservation extends Observation {
  date: IsoDate;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Every entry, newest first. */
export function allEntries(slice: ObservationsSlice | undefined): DatedObservation[] {
  const days = slice?.days ?? {};
  const out: DatedObservation[] = [];
  for (const date of Object.keys(days).sort().reverse()) {
    for (const entry of days[date]?.entries ?? []) out.push({ ...entry, date });
  }
  return out;
}

export function record(
  slice: ObservationsSlice | undefined,
  date: IsoDate,
  entry: Observation,
): ObservationsSlice {
  const base: ObservationsSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  days[date] = { entries: [...(days[date]?.entries ?? []), entry] };
  return { ...base, days };
}

export function remove(
  slice: ObservationsSlice | undefined,
  date: IsoDate,
  id: string,
): ObservationsSlice {
  const base: ObservationsSlice = { version: 1, ...slice };
  const days = { ...(base.days ?? {}) };
  const kept = (days[date]?.entries ?? []).filter((entry) => entry.id !== id);
  if (kept.length === 0) delete days[date];
  else days[date] = { entries: kept };
  return { ...base, days };
}

export interface Coverage {
  entries: number;
  weeks: number;
  settings: string[];
}

/**
 * A description of the record, not a measurement of the child. Whether fourteen
 * entries is a lot is not something this module has an opinion about.
 */
export function coverage(entries: readonly DatedObservation[]): Coverage {
  if (entries.length === 0) return { entries: 0, weeks: 0, settings: [] };

  const dates = entries.map((entry) => entry.date).sort();
  const span = daysBetween(dates[0] as IsoDate, dates[dates.length - 1] as IsoDate) + 1;

  const settings: string[] = [];
  for (const entry of entries) {
    const label = WHERE_LABELS.get(entry.where);
    if (label !== undefined && !settings.includes(label)) settings.push(label);
  }
  return { entries: entries.length, weeks: Math.max(1, Math.round(span / 7)), settings };
}

export function settingsPhrase(settings: readonly string[]): string {
  const words = settings.map((setting) => setting.toLowerCase());
  if (words.length === 0) return '';
  if (words.length === 1) return words[0] as string;
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** One entry as it reads back. */
export function describe(entry: DatedObservation): string[] {
  const lines = [entry.what];
  if ((entry.before ?? '') !== '') lines.push(`Beforehand: ${entry.before}`);
  if ((entry.helped ?? '') !== '') lines.push(`What helped: ${entry.helped}`);
  return lines;
}

export function renderRecords(
  container: HTMLElement,
  context: { slice?: ObservationsSlice },
): void {
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
            `${WHERE_LABELS.get(entry.where) ?? entry.where}`,
        }),
        el('span', { text: describe(entry).join(' · ') }),
      ]),
    );
  }
}
