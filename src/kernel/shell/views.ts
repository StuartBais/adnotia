// The four tabs.
//
// Each is assembled from whatever the person has enabled. With nothing enabled,
// each says so plainly rather than showing an encouraging blank page: a gap is a
// fact to show, never a failure to punish.

import { renderLibrary } from '../library/index';
import { AREA_STRINGS, renderAreaIndex } from './areaIndex';
import { ABOUT_STRINGS, aboutPage } from './about';
import { GUIDANCE } from '../family/index';
import { SCREENER_STRINGS, isUsable, screenerPage } from '../screeners/index';
import { parseIsoDate, type IsoDate } from '../dates/index';
import { backupNag, loggedDates, mountReport } from '../reports/index';
import type { KernelStore } from '../store/store';
import {
  BUDGET_STRINGS,
  KERNEL_RECORDS_TITLE,
  mountToday,
  renderKernelRecords,
} from '../today/index';
import { calendar, card, el, linkRow, nag } from '../ui/index';
import type { ModuleManifest, Space } from '../index';
import { TAB_LABELS, type OffTabPage, type TabId } from './router';

export interface ViewContext {
  space: Space;
  enabled: readonly ModuleManifest[];
  /** Every module in the build, enabled or not. The Library shows them all. */
  known: readonly ModuleManifest[];
  /** Absent only in tests that render a tab in isolation. */
  store?: KernelStore;
  date?: IsoDate;
  onDateChange?: (date: IsoDate) => void;
  /** Opens the backup page. Absent in tests that render a tab in isolation. */
  onBackup?: () => void;
  /** Opens an off-tab page, for the About link at the foot of the Library. */
  onOpenPage?: (page: OffTabPage) => void;
  /** Redraw the current tab, after a tool changes what belongs on it. */
  onRefresh?: () => void;
  /**
   * Switch tabs. An area page whose modules ask a daily question offers the way
   * back to the day's log, and that is a tab rather than a page.
   */
  onGoTab?: (tab: TabId) => void;
  onDismissBackupNag?: () => void;
}

/** Shown on every Family tab until a child exists to attach anything to. */
const GUIDANCE_TITLE = 'Before a form, or instead of one';
const GUIDANCE_SUB =
  'What an assessment actually involves, and what to do at the ages no validated form covers.';

const NO_CHILD = {
  title: 'Add a child first',
  sub: 'Everything in this space belongs to one child, so there is nowhere to put anything yet. Children is in the bar at the top.',
} as const;

const EMPTY: Readonly<Record<TabId, { title: string; sub: string }>> = {
  today: {
    title: 'Nothing to record yet',
    sub: 'This is where the day gets written down. Turning a tool on in Settings puts its questions here.',
  },
  tools: {
    title: AREA_STRINGS.empty.title,
    sub: AREA_STRINGS.empty.sub,
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
  const { store } = context;
  const section = el('div', {
    class: 'view',
    'aria-label': TAB_LABELS[tab],
    // Only the report sheet prints. Everything else on every tab is screen-only.
    ...(tab === 'records' ? {} : { 'data-print': 'never' }),
  });

  if (tab === 'library') {
    // Every module, enabled or not, so a person can read why a tool exists before
    // turning it on — and every exclusion, so they can read why the thing they
    // came looking for is absent. See docs/02-evidence-rubric.md.
    section.append(renderLibrary({ modules: context.known, space: context.space }));

    // Guidance a parent reads rather than fills in. Listed rather than routed to
    // by the child's age band: the bands are 4-11 and 12-17, these pages turn on
    // 6 and 13, and asking for a finer age would collect more about a child than
    // the tools need. See src/kernel/family/guidance.ts.
    if (context.space === 'family' && context.onOpenPage !== undefined) {
      section.append(card({ title: GUIDANCE_TITLE, sub: GUIDANCE_SUB }));
      for (const entry of GUIDANCE) {
        section.append(
          linkRow({
            label: entry.title,
            value: 'Read',
            onSelect: () => context.onOpenPage?.(entry.page()),
          }),
        );
      }
    }

    if (context.onOpenPage !== undefined) {
      // docs/03-scope.md: the screener lives in the Library, never in the daily
      // check-in and never on the home screen. This is the only route to it, and
      // it is the adult instrument, so it is not offered in the Family space.
      section.append(
        ...(context.space === 'adult'
          ? [
              linkRow({
                label: SCREENER_STRINGS.title,
                value: isUsable() ? 'Open' : 'Not yet',
                onSelect: () => context.onOpenPage?.(screenerPage()),
              }),
            ]
          : []),
        linkRow({
          label: ABOUT_STRINGS.title,
          value: 'Open',
          onSelect: () => context.onOpenPage?.(aboutPage()),
        }),
      );
    }
    return section;
  }

  // A Family-space tab has nothing to resolve against until there is a child,
  // and asking the store for a slice without one throws rather than returning
  // nothing. Say so instead.
  if (context.space === 'family' && store !== undefined && store.profile() === undefined) {
    section.append(
      card({
        title: NO_CHILD.title,
        sub: NO_CHILD.sub,
      }),
    );
    return section;
  }

  if (context.enabled.length === 0) {
    section.append(card(EMPTY[tab]));
    return section;
  }

  if (tab === 'today' && store !== undefined) {
    // Everything lives in this browser. At most once a fortnight, on this screen
    // only, with a way to say not now. See docs/decisions/ADR-019-the-mirror-and-
    // the-nag.md and src/kernel/reports/nag.ts.
    const document_ = store.document();
    const reminder = backupNag({
      entries: loggedDates(document_, context.enabled, store.profile()).length,
      ...(document_.kernel.lastBackup === undefined
        ? {}
        : { lastBackup: document_.kernel.lastBackup }),
      ...(document_.kernel.lastBackupNagDismissed === undefined
        ? {}
        : { lastDismissed: document_.kernel.lastBackupNagDismissed }),
    });
    if (reminder !== undefined && context.onBackup !== undefined) {
      section.append(
        nag({
          message: reminder.message,
          actionLabel: reminder.actionLabel,
          onAction: () => context.onBackup?.(),
          dismissLabel: 'Not now',
          onDismiss: () => context.onDismissBackupNag?.(),
        }),
      );
    }

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
          logged: loggedDates(store.document(), context.enabled, store.profile()),
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
    // The check-in budget. docs/01-module-contract.md caps the whole check-in at
    // about ninety seconds; above that the person is offered the option of
    // hiding what is optional. It is an offer, never a reprimand, and it says
    // nothing about how long they have actually taken.
    const budget = todayView.budget();
    if (budget.overBudget && budget.hidingWouldHelp) {
      let hidden = false;
      const shorten = el('button', {
        type: 'button',
        class: 'btn small',
        text: BUDGET_STRINGS.hide,
      });
      const note = el('p', { class: 'hint', text: BUDGET_STRINGS.long(budget.total) });
      shorten.addEventListener('click', () => {
        hidden = !hidden;
        todayView.setHideOptional(hidden);
        shorten.textContent = hidden ? BUDGET_STRINGS.show : BUDGET_STRINGS.hide;
        note.textContent = hidden
          ? BUDGET_STRINGS.shortened(budget.required)
          : BUDGET_STRINGS.long(budget.total);
      });
      section.append(
        el('div', { class: 'budget' }, [note, el('div', { class: 'btnrow' }, [shorten])]),
      );
    }

    section.append(el('div', { class: 'day-picker' }, [choose, panel]), todayView.element);
    return section;
  }

  if (tab === 'records' && store !== undefined) {
    // History first, then the sheet: a person comes here to look back before
    // they come here to print.
    const dates = [...loggedDates(store.document(), context.enabled, store.profile())].sort();
    let anything = false;

    for (const manifest of context.enabled) {
      const contribution = manifest.contributes.records;
      if (contribution === undefined) continue;

      const body = el('div', {});
      contribution.render(body, {
        dates,
        days: daysOf(store, manifest.id),
        // Some modules keep a list rather than one record per day.
        slice: store.get(manifest.id),
      });
      if (body.childElementCount === 0) continue;

      anything = true;
      section.append(card({ title: manifest.name, children: [body] }));
    }

    // The kernel's own fields last, after the modules that have their own cards.
    // No module can show them: they belong to no module.
    const kernelBody = el('div', {});
    renderKernelRecords(kernelBody, { dates, days: store.document().kernel.days });
    if (kernelBody.childElementCount > 0) {
      anything = true;
      section.append(card({ title: KERNEL_RECORDS_TITLE, children: [kernelBody] }));
    }

    if (!anything) section.append(card(EMPTY.records));

    // Adult-only for now: the clinical report is the only named report that
    // exists. docs/04-family-space.md gives the Family space its own two.
    if (context.space === 'adult') {
      section.append(mountReport({ store, modules: context.enabled }).element);
    }
    return section;
  }

  if (tab === 'tools' && store !== undefined) {
    // An index, not a pile. See src/kernel/shell/areaIndex.ts for why the tools
    // stopped mounting here and what an area page holds besides tools.
    if (context.onOpenPage === undefined) return section;

    const options = {
      space: context.space,
      enabled: context.enabled,
      store,
      openPage: context.onOpenPage,
      refresh: () => context.onRefresh?.(),
      ...(context.onGoTab === undefined
        ? {}
        : {
            goToday: () => context.onGoTab?.('today'),
            goRecords: () => context.onGoTab?.('records'),
          }),
    };

    section.append(card({ sub: AREA_STRINGS.sub }), renderAreaIndex(options));
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
