// The shell.
//
// Owns first run, the space, navigation and page routing. Modules appear inside
// the four tabs; the shell never routes to one directly.
// See docs/05-architecture.md "Shell and spaces".

import { createRegistry, type ModuleManifest, type KernelStore, type Space } from '../index';
import { brand, el, logoMark } from '../ui/index';
import { createRouter, TABS, TAB_LABELS, type Router, type TabId } from './router';
import { firstRun } from './firstRun';
import { backupPage, settingsPage } from './settings';
import { CRISIS_STRINGS, crisisPage } from './crisis';
import {
  CHILD_STRINGS,
  PROFILE_STRINGS,
  getProfile,
  listProfiles,
  mountChildSurface,
  profilesPage,
} from '../family/index';
import { renderTab } from './views';

import type { PasscodeActions } from './passcode';

import { loggingDay, today } from '../dates/index';

import { StorageChangedError } from '../store/adapters';

export interface ShellOptions {
  store: KernelStore;
  container: HTMLElement;
  modules?: readonly ModuleManifest[];
  /** Asked before an irreversible step. Injected so a test can answer it. */
  confirm?: (message: string) => boolean;
  storageAvailable?: boolean;
  security?: PasscodeActions;
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
  let selectedDate = loggingDay();

  const masthead = el('header', { class: 'mast' });
  const tabStrip = el('nav', { class: 'tabs', role: 'tablist' });
  const view = el('main', { id: 'view' });
  const root = el('div', { class: 'wrap' }, [masthead, tabStrip, view]);
  const saveMessage = el('p', {
    class: 'hint',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  const retrySave = el('button', {
    type: 'button',
    class: 'btn small',
    text: 'Retry save',
  });
  const saveStatus = el('div', { class: 'save-status', 'data-print': 'never' }, [
    saveMessage,
    retrySave,
  ]);

  retrySave.addEventListener('click', () => {
    void store.flush().catch(() => undefined);
  });

  function paintPersistence(): void {
    const state = store.persistence();
    const unavailable = options.storageAvailable === false;
    saveStatus.dataset['state'] = unavailable ? 'error' : state;
    saveMessage.textContent = unavailable
      ? 'This browser is not letting Adnotia save anything, so nothing will be here next time.'
      : state === 'error'
        ? store.persistenceError() instanceof StorageChangedError
          ? 'Data changed in another tab. Download a backup of changes here before reloading.'
          : 'Changes could not be saved. Keep this page open. Your changes are still here.'
        : state === 'pending'
          ? 'Saving changes.'
          : 'Changes saved in this browser.';
    retrySave.hidden = unavailable || state !== 'error';
  }

  const tabButtons = new Map<TabId, HTMLButtonElement>();

  function space(): Space {
    return store.document().space;
  }

  function enabledModules(): ModuleManifest[] {
    const enabled = store.document().kernel.enabledModules;
    return registry
      .forAudience(space() === 'family' ? 'parent' : 'adult')
      .filter((manifest) => enabled.includes(manifest.id))
      .sort((left, right) => {
        const order = store.document().kernel.moduleOrder;
        const rank = (id: string) =>
          order.includes(id) ? order.indexOf(id) : Number.MAX_SAFE_INTEGER;
        return rank(left.id) - rank(right.id);
      });
  }

  /**
   * Replace the whole application with the child's surface. Not a tab and not a
   * page inside the shell: while this is up, the tabs, the masthead, Settings
   * and the Adult space are not on the document at all, which is the strongest
   * form of docs/04-family-space.md's "no way to reach the parent's data".
   */
  function handToChild(profileId: string): void {
    const verify = options.security?.verify;
    if (verify === undefined || !store.document().kernel.settings.passcodeEnabled) {
      // Handing the phone over is only safe if getting back out needs a code.
      container.replaceChildren(
        el('div', { class: 'wrap' }, [
          el('div', { class: 'card' }, [
            el('p', { class: 'sub', text: CHILD_STRINGS.needCode }),
            (() => {
              const back = el('button', {
                type: 'button',
                class: 'btn primary',
                text: 'Back',
              });
              back.addEventListener('click', () => refresh());
              return back;
            })(),
          ]),
        ]),
      );
      return;
    }

    const surface = mountChildSurface({
      store,
      modules: registry.all(),
      profileId,
      verify,
      onLeave: () => {
        surface.destroy();
        refresh();
      },
    });
    container.replaceChildren(surface.element);
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
          onChanged: () => refresh(),
          modules: registry.all(),
          ...(options.security ? { security: options.security } : {}),
        }),
      );
    });

    // One tap from every screen, which docs/03-scope.md asks be at most two.
    // Quiet on purpose: always there, never alarming, and it never reacts to
    // anything in the document.
    const help = el('button', {
      type: 'button',
      class: 'crisis-link',
      text: CRISIS_STRINGS.title,
    });
    help.addEventListener('click', () => router.openPage(crisisPage({ space: space() })));

    const controls: HTMLElement[] = [settings, help];

    // The Family space adds the child switcher and the hand-over. Neither
    // exists in the Adult space, where there are no children to switch between.
    if (space() === 'family') {
      const children = el('button', {
        type: 'button',
        class: 'btn small',
        text: PROFILE_STRINGS.title,
      });
      children.addEventListener('click', () => {
        router.openPage(
          profilesPage({
            store,
            onChanged: () => refresh(),
            ...(options.confirm ? { confirm: options.confirm } : {}),
          }),
        );
      });
      controls.push(children);

      const current = getProfile(store.document(), store.profile());
      if (current !== undefined) {
        const handOver = el('button', {
          type: 'button',
          class: 'btn small',
          text: CHILD_STRINGS.handOver(current.nickname),
        });
        handOver.addEventListener('click', () => handToChild(current.id));
        controls.push(handOver);
      }
    }

    masthead.replaceChildren(
      el('div', { class: 'brand' }, [logoMark(), title]),
      el('div', { class: 'btnrow', style: 'margin-top:10px' }, controls),
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
      const back = el('button', {
        type: 'button',
        class: 'btn small',
        text: 'Back',
      });
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
        date: selectedDate,
        onDateChange: (date) => {
          selectedDate = date;
        },
        onBackup: () => {
          router.openPage(
            backupPage({
              store,
              router,
              offerDownload: options.offerDownload ?? defaultDownload,
              onRestored: () => refresh(),
              onChanged: () => refresh(),
              modules: registry.all(),
              ...(options.security ? { security: options.security } : {}),
            }),
          );
        },
        // Dismissing does not switch the reminder off; it waits a fortnight
        // again, the same as taking a backup does.
        onOpenPage: (page) => router.openPage(page),
        onRefresh: () => refresh(),
        onDismissBackupNag: () => {
          store.updateKernel((kernel) => ({
            ...kernel,
            lastBackupNagDismissed: today(),
          }));
          refresh();
        },
      }),
    );
  }

  function refresh(): void {
    // In the Family space every slice resolves against a child, and nothing
    // chooses one on load. Without this, reopening the app with children saved
    // throws on the first module read: "no child profile is selected".
    if (store.space() === 'family' && store.profile() === undefined) {
      const first = listProfiles(store.document())[0];
      if (first !== undefined) store.useProfile(first.id);
    }

    const settings = store.document().kernel.settings;
    if (settings.firstRunComplete !== true) {
      container.replaceChildren(
        el('div', { class: 'wrap' }, [
          el('header', { class: 'mast' }, [brand()]),
          saveStatus,
          firstRun({
            available: (chosen) => registry.forAudience(chosen === 'family' ? 'parent' : 'adult'),
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
    root.insertBefore(saveStatus, tabStrip);
    container.replaceChildren(root);
  }

  const unsubscribe = router.subscribe(paint);
  const unsubscribePersistence = store.subscribePersistence(paintPersistence);
  paintPersistence();
  refresh();

  return {
    router,
    refresh,
    destroy() {
      unsubscribe();
      unsubscribePersistence();
      container.replaceChildren();
    },
  };
}
