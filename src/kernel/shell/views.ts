// The four tabs.
//
// Each is assembled from whatever the person has enabled. With nothing enabled,
// each says so plainly rather than showing an encouraging blank page: a gap is a
// fact to show, never a failure to punish.

import { parseIsoDate, type IsoDate } from '../dates/index';
import { loggedDates, mountReport } from '../reports/index';
import type { KernelStore } from '../store/store';
import { mountToday } from '../today/index';
import { calendar, card, el } from '../ui/index';
import type { ModuleManifest, Space } from '../index';
import { TAB_LABELS, type TabId } from './router';

export interface ViewContext {
  space: Space;
  enabled: readonly ModuleManifest[];
  /** Every module in the build, enabled or not. The Library shows them all. */
  known: readonly ModuleManifest[];
  /** Absent only in tests that render a tab in isolation. */
  store?: KernelStore;
  date?: IsoDate;
  onDateChange?: (date: IsoDate) => void;
}

const EMPTY: Readonly<Record<TabId, { title: string; sub: string }>> = {
  today: {
    title: 'Nothing to fill in',
    sub: 'When you turn a tool on, its questions appear here as one short check-in.',
  },
  tools: {
    title: 'No tools yet',
    sub: 'Tools are things you open when you need them: a timer, a plan for the next hour.',
  },
  records: {
    title: 'Nothing recorded yet',
    sub: 'What you fill in on Today shows up here, day by day.',
  },
  library: {
    title: 'The Library is being written',
    sub: 'It will explain what each tool is for, what the evidence says, and what it will not do.',
  },
};

export function renderTab(tab: TabId, context: ViewContext): HTMLElement {
  const section = el('div', {
    class: 'view',
    'aria-label': TAB_LABELS[tab],
    // Only the report sheet prints. Everything else on every tab is screen-only.
    ...(tab === 'records' ? {} : { 'data-print': 'never' }),
  });

  if (tab === 'library') {
    // The Library shows every module, enabled or not, so a person can read why a
    // tool exists before turning it on.
    if (context.known.length === 0) {
      section.append(card(EMPTY.library));
      return section;
    }
    for (const manifest of context.known) {
      section.append(
        card({
          title: manifest.name,
          sub: manifest.contributes.library.whatItIs,
          children: [
            el('p', {
              class: 'hint',
              text: manifest.contributes.library.whatItWontDo,
            }),
          ],
        }),
      );
    }
    return section;
  }

  if (context.enabled.length === 0) {
    section.append(card(EMPTY[tab]));
    return section;
  }

  const { store } = context;

  if (tab === 'today' && store !== undefined) {
    const todayView = mountToday({
      store,
      modules: context.enabled,
      ...(context.date ? { date: context.date } : {}),
    });
    const label = () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parseIsoDate(todayView.date()));
    const choose = el('button', {
      type: 'button',
      class: 'datebtn',
      text: label(),
      'aria-label': 'Choose logging day',
      'aria-expanded': 'false',
      'aria-controls': 'logging-calendar',
    });
    const panel = el('div', { id: 'logging-calendar' });
    choose.addEventListener('click', () => {
      const open = choose.getAttribute('aria-expanded') !== 'true';
      choose.setAttribute('aria-expanded', String(open));
      panel.replaceChildren();
      if (!open) return;
      panel.append(
        calendar({
          value: todayView.date(),
          logged: loggedDates(store.document(), context.enabled),
          onSelect: (date) => {
            todayView.setDate(date);
            context.onDateChange?.(date);
            choose.textContent = label();
            choose.setAttribute('aria-expanded', 'false');
            panel.replaceChildren();
            choose.focus();
          },
        }).element,
      );
    });
    section.append(el('div', { class: 'day-picker' }, [choose, panel]), todayView.element);
    return section;
  }

  if (tab === 'records' && store !== undefined) {
    // History first, then the sheet: a person comes here to look back before
    // they come here to print.
    const dates = [...loggedDates(store.document(), context.enabled)].sort();
    let anything = false;

    for (const manifest of context.enabled) {
      const contribution = manifest.contributes.records;
      if (contribution === undefined) continue;

      const body = el('div', {});
      contribution.render(body, { dates, days: daysOf(store, manifest.id) });
      if (body.childElementCount === 0) continue;

      anything = true;
      section.append(card({ title: manifest.name, children: [body] }));
    }

    if (!anything) section.append(card(EMPTY.records));

    // Adult-only for now: the clinical report is the only named report that
    // exists. docs/04-family-space.md gives the Family space its own two.
    if (context.space === 'adult') {
      section.append(mountReport({ store, modules: context.enabled }).element);
    }
    return section;
  }

  for (const manifest of context.enabled) {
    section.append(card({ title: manifest.name, sub: manifest.summary }));
  }
  return section;
}

function daysOf(
  store: KernelStore,
  moduleId: string,
): Readonly<Record<IsoDate, Record<string, unknown>>> {
  const slice = store.get<{ days?: Record<IsoDate, Record<string, unknown>> }>(moduleId);
  return slice?.days ?? {};
}
