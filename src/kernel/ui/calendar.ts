// The calendar.
//
// Ported from reference/adnotia-v0-monolith.html, which reference/README.md
// lists among the things not to reimplement: one tap selects and closes, dots
// mark days with something logged, future days are disabled, and "jump to
// today" respects the after-midnight rule.
//
// The first weekday follows the locale, so a Monday-first calendar looks right
// to someone who expects one.

import { el, type Control } from './dom';
import { loggingDay, parseIsoDate, toIsoDate, type IsoDate } from '../dates/index';

export interface CalendarOptions {
  /** The day shown as chosen. Defaults to the logging day. */
  value?: IsoDate;
  /** Days with something recorded, which get a dot. */
  logged?: Iterable<IsoDate>;
  /** Treated as "now" for the future cut-off and for jumping to today. */
  now?: () => Date;
  locale?: string;
  onSelect?: (date: IsoDate) => void;
}

/** Sunday-first index of the locale's first weekday. */
export function firstWeekday(locale?: string): number {
  const resolved = new Intl.Locale(locale ?? navigator.language ?? 'en');
  // getWeekInfo is not everywhere yet; Monday is the commoner default when it
  // is missing, but en-US expects Sunday, so fall back on the region.
  const info = (
    resolved as unknown as { getWeekInfo?: () => { firstDay: number } }
  ).getWeekInfo?.();
  if (info) return info.firstDay % 7; // ISO 1–7 (Mon–Sun) to 0–6 (Sun–Sat)
  return /^(?:en-US|en-CA|ja|he|pt-BR)/i.test(resolved.toString()) ? 0 : 1;
}

export function calendar(options: CalendarOptions = {}): Control<IsoDate> {
  const now = options.now ?? (() => new Date());
  const locale = options.locale;
  const logged = new Set(options.logged ?? []);

  let selected = options.value ?? loggingDay(now());
  let shown = parseIsoDate(selected);
  shown.setDate(1);

  const grid = el('div', { class: 'calgrid', role: 'grid' });
  const monthLabel = el('span', { 'aria-live': 'polite' });
  const previous = el('button', {
    type: 'button',
    class: 'calnav',
    'aria-label': 'Previous month',
    text: '‹',
  });
  const next = el('button', {
    type: 'button',
    class: 'calnav',
    'aria-label': 'Next month',
    text: '›',
  });

  const head = el('div', { class: 'calhead' }, [previous, monthLabel, next]);
  const jump = el('button', {
    type: 'button',
    class: 'btn small caltoday',
    text: 'Jump to today',
  });
  const root = el('div', { class: 'cal' }, [head, grid, jump]);

  function weekdayNames(): string[] {
    const format = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const start = firstWeekday(locale);
    // 2026-09-06 is a Sunday, so day 6 + n gives each weekday in turn.
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(2026, 8, 6 + ((start + index) % 7))),
    );
  }

  function paint(): void {
    const year = shown.getFullYear();
    const month = shown.getMonth();
    const today = toIsoDate(now());
    // The logging day may be yesterday, but a person can still not log tomorrow.
    const latest = today;

    monthLabel.textContent = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(shown);

    grid.replaceChildren();

    const names = el('div', { class: 'calgrid caldow' });
    for (const name of weekdayNames()) {
      names.append(el('span', { text: name, 'aria-hidden': 'true' }));
    }

    const start = firstWeekday(locale);
    const leading = (new Date(year, month, 1).getDay() - start + 7) % 7;
    for (let i = 0; i < leading; i++) grid.append(el('span', {}));

    const days = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const date = toIsoDate(new Date(year, month, day));
      const future = date > latest;

      const button = el('button', {
        type: 'button',
        class: 'calday' + (date === selected ? ' sel' : '') + (date === today ? ' today' : ''),
        text: String(day),
        disabled: future,
        'aria-pressed': date === selected ? 'true' : 'false',
        'aria-label': new Intl.DateTimeFormat(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(parseIsoDate(date)),
      });

      if (logged.has(date)) button.append(el('span', { class: 'pip' }));
      if (!future) {
        button.addEventListener('click', () => {
          selected = date;
          paint();
          options.onSelect?.(date);
        });
      }
      grid.append(button);
    }

    root.replaceChildren(head, names, grid, jump);

    // A month with no selectable days ahead of it has nothing to page to.
    const firstOfNext = new Date(year, month + 1, 1);
    next.toggleAttribute('disabled', toIsoDate(firstOfNext) > latest);
  }

  previous.addEventListener('click', () => {
    shown = new Date(shown.getFullYear(), shown.getMonth() - 1, 1);
    paint();
  });
  next.addEventListener('click', () => {
    shown = new Date(shown.getFullYear(), shown.getMonth() + 1, 1);
    paint();
  });
  jump.addEventListener('click', () => {
    // The logging day, not the calendar day: at 1am that is yesterday.
    selected = loggingDay(now());
    shown = parseIsoDate(selected);
    shown.setDate(1);
    paint();
    options.onSelect?.(selected);
  });

  paint();

  return {
    element: root,
    value: () => selected,
    set(date) {
      selected = date;
      shown = parseIsoDate(date);
      shown.setDate(1);
      paint();
    },
  };
}
