// The surface a parent hands over.
//
// docs/04-family-space.md is specific and short about this, and every line of it
// is a constraint rather than a feature:
//
//   "A parent unlocks, taps 'hand to [child's name]', and the phone shows only:
//    a visual timer, today's visual schedule, the first / then board, the
//    child's own reward chart, view only. No text entry. No settings. No links.
//    No way to reach the parent's data, the Adult space, or anything outside the
//    app. Leaving child mode requires the parent code."
//
// So this host does almost nothing, on purpose. It replaces the whole app — not
// a tab inside it — mounts only `audience: "child"` modules, and puts a gate
// between the child and everything else. The registry has already refused any
// child module that declares a today field, a report, free text or a link; this
// is the other half of the same rule, at runtime.
//
// The tools themselves arrive in Milestone 7. What is here is the box they go in
// and the lock on it.

import type { ModuleManifest } from '../registry/types';
import type { KernelStore } from '../store/store';
import { card, el, parentGate } from '../ui/index';
import { getProfile } from './profiles';

export const CHILD_STRINGS = {
  handOver: (nickname: string) => `Hand to ${nickname}`,
  leave: 'Give it back',
  gateMessage: 'Enter your code to give the phone back.',
  nothing: 'There is nothing here yet.',
  nothingSub: 'The timer, the schedule and the chart arrive with the parent tools.',
  needCode:
    'Set a passcode first. Handing the phone over is only safe if getting back out needs ' +
    'a code, and there is no code yet.',
  needCodeAction: 'Set a passcode',
} as const;

export interface ChildSurfaceOptions {
  store: KernelStore;
  /** Every module in the build. Only `audience: "child"` ones are mounted. */
  modules: readonly ModuleManifest[];
  /** The child whose surface this is. */
  profileId: string;
  /** Resolves when the code is right, rejects when it is not. */
  verify: (code: string) => Promise<void>;
  /** Called once the parent is back. The caller redraws the app. */
  onLeave: () => void;
}

export interface ChildSurface {
  element: HTMLElement;
  destroy(): void;
}

/**
 * Mounts the handed-over surface. The returned element is meant to replace the
 * application container, not to sit inside it: there is no route from here to a
 * tab, the masthead, Settings or the Adult space, because none of them is on the
 * page while this is.
 */
export function mountChildSurface(options: ChildSurfaceOptions): ChildSurface {
  const { store } = options;
  const profile = getProfile(store.document(), options.profileId);
  const root = el('div', { class: 'child-surface', 'data-print': 'never' });

  // Only child modules. Nothing else is even asked to render.
  const forChild = options.modules.filter((manifest) => manifest.audience === 'child');

  const body = el('div', {});
  if (forChild.length === 0) {
    body.append(card({ title: CHILD_STRINGS.nothing, sub: CHILD_STRINGS.nothingSub }));
  } else {
    for (const manifest of forChild) {
      for (const tool of manifest.contributes.tools ?? []) {
        const host = el('div', {});
        tool.mount(host, {
          // A child module reads and writes its own slice under this child's
          // profile. The store is already scoped; it cannot see another child's.
          get slice() {
            return store.get(manifest.id);
          },
          // The parent's schedule and chart for this child, read-only. There is
          // no route from here to write them, and none to another child's.
          get reads() {
            return Object.fromEntries(
              (manifest.dependencies ?? []).map((id) => [id, store.get(id)]),
            );
          },
          save: (next: unknown) => store.set(manifest.id, next),
          today: '',
          ...(profile === undefined ? {} : { nickname: profile.nickname }),
          refresh: () => {},
        });
        body.append(card({ title: tool.title, children: [host] }));
      }
    }
  }

  const gate = el('div', {});
  const leave = el('button', {
    type: 'button',
    class: 'btn wide',
    text: CHILD_STRINGS.leave,
  });

  leave.addEventListener('click', () => {
    body.hidden = true;
    leave.hidden = true;
    gate.replaceChildren(
      parentGate({
        message: CHILD_STRINGS.gateMessage,
        verify: async (code: string) => {
          try {
            await options.verify(code);
            return true;
          } catch {
            return false;
          }
        },
        onOpen: () => options.onLeave(),
      }),
    );
  });

  root.append(el('p', { class: 'child-who', text: profile?.nickname ?? '' }), body, leave, gate);

  return {
    element: root,
    destroy() {
      root.replaceChildren();
    },
  };
}
