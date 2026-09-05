// Routing.
//
// A small fixed set of tabs, and off-tab pages that open with a Back button and
// return to the tab they came from. There is no deep-link routing to individual
// modules: modules appear inside these areas. See docs/05-architecture.md
// "Shell and spaces".

export const TABS = ['today', 'tools', 'records', 'library'] as const;
export type TabId = (typeof TABS)[number];

export const TAB_LABELS: Readonly<Record<TabId, string>> = {
  today: 'Today',
  tools: 'Tools',
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

export function createRouter(initial: TabId = 'today'): Router {
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
