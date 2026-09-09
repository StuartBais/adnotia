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

/**
 * The object URL outlives the click by a second.
 *
 * A download starts after the click handler returns, not inside it, so revoking
 * on the same tick is a race in principle: the URL can be gone before the
 * browser resolves it, and a cancelled download reports nothing to the page. A
 * backup that silently does not arrive is the failure this screen exists to
 * prevent, so the revoke moves off the click's own task.
 *
 * Measured rather than assumed, and the measurement did not reproduce the bug:
 * on Firefox 155 the same-tick revoke delivered a complete file, at 715 bytes
 * and again at 40 MB, as did every deferred variant and an unrevoked control.
 * This is kept as the cheaper side of a race that older Firefox did lose and
 * that nothing here can detect if it comes back.
 *
 * A second, not the minute the pattern is usually written with. The blob is a
 * plaintext copy of the whole document, there is no slow server to wait for,
 * and holding it any longer than the download needs buys nothing.
 */
const REVOKE_AFTER_MS = 1_000;

function defaultDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
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
      const body = el('div', {});
      page.render(body);
      // The chrome is screen furniture, and `noprint` says so. A named report
      // opens as one of these, and printing it used to put a Back button and a
      // second copy of the title above the sheet's own letterhead.
      view.replaceChildren(
        el('div', { class: 'btnrow noprint' }, [back]),
        el('h2', { text: page.title, class: 'page-title noprint' }),
        body,
      );
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
        onGoTab: (next: TabId) => router.goTab(next),
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
    const security = options.security;
    if (settings.firstRunComplete !== true) {
      container.replaceChildren(
        el('div', { class: 'wrap' }, [
          el('header', { class: 'mast' }, [brand()]),
          saveStatus,
          firstRun({
            available: (chosen) => registry.forAudience(chosen === 'family' ? 'parent' : 'adult'),
            /*
             * Absent when there is no security to work with — no storage, or a
             * browser without crypto — so first run offers the step only where
             * it can actually do it. `change` takes the current passcode, and
             * there is none, so the empty string is right: `verify` returns
             * immediately when encryption is off.
             */
            ...(security === undefined
              ? {}
              : { setPasscode: (code: string) => security.change('', code) }),
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
