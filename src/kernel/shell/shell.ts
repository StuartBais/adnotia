// The shell.
//
// Owns first run, the space, navigation and page routing. Modules appear inside
// the four tabs; the shell never routes to one directly.
// See docs/05-architecture.md "Shell and spaces".

import { createRegistry, type ModuleManifest, type KernelStore, type Space } from '../index';
import { el } from '../ui/index';
import { createRouter, TABS, TAB_LABELS, type Router, type TabId } from './router';
import { firstRun } from './firstRun';
import { settingsPage } from './settings';
import { renderTab } from './views';

export interface ShellOptions {
  store: KernelStore;
  container: HTMLElement;
  modules?: readonly ModuleManifest[];
  /** Hands a file to the person. Defaults to a download in a real browser. */
  offerDownload?: (filename: string, content: string) => void;
}

export interface Shell {
  router: Router;
  /** Redraw from the current document. */
  refresh(): void;
  destroy(): void;
}

function defaultDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

export function mountShell(options: ShellOptions): Shell {
  const { store, container } = options;
  const registry = createRegistry(options.modules ?? [], { strict: false });
  const router = createRouter();

  const masthead = el('header', { class: 'mast' });
  const tabStrip = el('nav', { class: 'tabs', role: 'tablist' });
  const view = el('main', { id: 'view' });
  const root = el('div', { class: 'wrap' }, [masthead, tabStrip, view]);

  const tabButtons = new Map<TabId, HTMLButtonElement>();

  function space(): Space {
    return store.document().space;
  }

  function enabledModules(): ModuleManifest[] {
    const enabled = store.document().kernel.enabledModules;
    return registry
      .forAudience(space() === 'family' ? 'parent' : 'adult')
      .filter((manifest) => enabled.includes(manifest.id));
  }

  function paintMasthead(): void {
    const title = el('h1', { text: 'Adnotia' });
    const settings = el('button', {
      type: 'button',
      class: 'btn small',
      text: 'Settings',
    });
    settings.addEventListener('click', () => {
      router.openPage(
        settingsPage({
          store,
          router,
          offerDownload: options.offerDownload ?? defaultDownload,
          onRestored: () => refresh(),
        }),
      );
    });

    masthead.replaceChildren(
      el('div', { class: 'brand' }, [title]),
      el('div', { class: 'btnrow', style: 'margin-top:10px' }, [settings]),
    );
  }

  function paintTabs(): void {
    tabStrip.replaceChildren();
    tabButtons.clear();
    for (const id of TABS) {
      const button = el('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': 'false',
        text: TAB_LABELS[id],
      });
      button.addEventListener('click', () => router.goTab(id));
      tabButtons.set(id, button);
      tabStrip.append(button);
    }
  }

  function paint(): void {
    const page = router.page();

    for (const [id, button] of tabButtons) {
      button.setAttribute(
        'aria-selected',
        page === undefined && router.tab() === id ? 'true' : 'false',
      );
    }
    // The tab strip is hidden, not removed, while an off-tab page is open, so
    // returning does not rebuild it.
    tabStrip.hidden = page !== undefined;

    if (page !== undefined) {
      // The off-tab pattern: a Back button that returns to the originating tab.
      const back = el('button', { type: 'button', class: 'btn small', text: 'Back' });
      back.addEventListener('click', () => router.back());
      const heading = el('h2', { text: page.title, class: 'page-title' });
      const body = el('div', {});
      page.render(body);
      view.replaceChildren(el('div', { class: 'btnrow' }, [back]), heading, body);
      return;
    }

    view.replaceChildren(
      renderTab(router.tab(), {
        space: space(),
        enabled: enabledModules(),
        known: registry.all(),
        store,
      }),
    );
  }

  function refresh(): void {
    const settings = store.document().kernel.settings;
    if (settings.firstRunComplete !== true) {
      container.replaceChildren(
        el('div', { class: 'wrap' }, [
          el('header', { class: 'mast' }, [el('h1', { text: 'Adnotia' })]),
          firstRun({
            available: (chosen) =>
              registry.forAudience(chosen === 'family' ? 'parent' : 'adult'),
            onDone: ({ space: chosen, enabled }) => {
              store.useSpace(chosen);
              store.updateKernel((kernel) => ({
                ...kernel,
                enabledModules: enabled,
                moduleOrder: [...enabled],
                settings: { ...kernel.settings, firstRunComplete: true },
              }));
              refresh();
            },
          }),
        ]),
      );
      return;
    }

    paintMasthead();
    paintTabs();
    paint();
    container.replaceChildren(root);
  }

  const unsubscribe = router.subscribe(paint);
  refresh();

  return {
    router,
    refresh,
    destroy() {
      unsubscribe();
      container.replaceChildren();
    },
  };
}
