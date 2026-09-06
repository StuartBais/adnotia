// Routing.
//
// A small fixed set of tabs, and off-tab pages that open with a Back button and
// return to the tab they came from. There is no deep-link routing to individual
// modules: modules appear inside these areas. See docs/05-architecture.md
// "Shell and spaces".

/**
 * Tools first, and so the landing.
 *
 * Today used to be, and that is what made the app read as a medication log with
 * things bolted on: it is the day's record, medication contributes two thirds of
 * its fields, and three of the adult modules contribute nothing to it at all, so
 * the front door showed a dose form and could not show a third of the app
 * whatever you turned on. A person opening this at nine in the morning is not
 * there to write up a day that has not happened yet.
 *
 * So the landing is what you can do, and the day's record is a tab you go to
 * when there is a day to record. Four tabs either way.
 */
export const TABS = ['tools', 'today', 'records', 'library'] as const;
export type TabId = (typeof TABS)[number];

export const TAB_LABELS: Readonly<Record<TabId, string>> = {
  tools: 'Tools',
  today: 'Today',
  records: 'Records',
  library: 'Library',
};

export interface OffTabPage {
  id: string;
  title: string;
  render(container: HTMLElement): void;
}

export interface Router {
  tab(): TabId;
  goTab(id: TabId): void;
  /** The page currently covering the tabs, if any. */
  page(): OffTabPage | undefined;
  openPage(page: OffTabPage): void;
  /** Close the off-tab page and return to the tab it opened from. */
  back(): void;
  subscribe(listener: () => void): () => void;
}

export function createRouter(initial: TabId = TABS[0]): Router {
  let current: TabId = initial;
  let open: OffTabPage | undefined;
  const listeners = new Set<() => void>();

  const announce = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    tab: () => current,
    goTab(id) {
      // Changing tab closes an off-tab page: the page belonged to the old tab.
      open = undefined;
      current = id;
      announce();
    },
    page: () => open,
    openPage(page) {
      open = page;
      announce();
    },
    back() {
      open = undefined;
      announce();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
