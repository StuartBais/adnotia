// Adding, switching and removing a child.
//
// Two fields to add one, and deleting takes everything about that child with it
// behind a confirmation that says so in as many words. docs/04-family-space.md
// asks for that to be available in one place, and this is the place.

import type { KernelStore } from '../store/store';
import type { OffTabPage } from '../shell/router';
import { card, chips, el, linkRow, textInput } from '../ui/index';
import {
  AGE_BANDS,
  AGE_BAND_LABELS,
  addProfile,
  isValidNickname,
  listProfiles,
  removeProfile,
} from './profiles';

export const PROFILE_STRINGS = {
  title: 'Children',
  sub:
    'A nickname and an age band, and nothing else. Nothing about a child is asked for here ' +
    'that the tools do not need.',
  nickname: 'What do you call them?',
  nicknamePlaceholder: 'Sam',
  nicknameHint: 'A nickname is fine. It is only used to label their tools.',
  ageBand: 'How old are they?',
  add: 'Add',
  needNickname: 'A name first, and it will save.',
  none: 'No children added yet.',
  switchedTo: (nickname: string) => `Now showing ${nickname}.`,
  inUse: 'Showing',
  use: 'Show',
  remove: 'Remove',
  confirm: (nickname: string) =>
    `Remove ${nickname}? Everything recorded about them goes too — the observation log, ` +
    'the routines, the chart. It cannot be undone from inside the app, only from a backup.',
  removed: (nickname: string) => `${nickname} removed.`,
} as const;

export interface ProfilesPageOptions {
  store: KernelStore;
  /** Asked before an irreversible step. Injected so a test can answer it. */
  confirm?: (message: string) => boolean;
  onChanged?: () => void;
  now?: () => Date;
}

export function profilesPage(options: ProfilesPageOptions): OffTabPage {
  const { store } = options;
  const ask = options.confirm ?? ((message: string) => globalThis.confirm(message));
  const now = options.now ?? (() => new Date());

  return {
    id: 'children',
    title: PROFILE_STRINGS.title,
    render(container) {
      const status = el('p', { class: 'bmsg', role: 'status' });
      const list = el('div', {});

      let band: string = AGE_BANDS[0].v;
      const nickname = textInput({
        label: PROFILE_STRINGS.nickname,
        placeholder: PROFILE_STRINGS.nicknamePlaceholder,
        hint: PROFILE_STRINGS.nicknameHint,
      });
      const ages = chips({
        label: PROFILE_STRINGS.ageBand,
        options: AGE_BANDS.map((option) => ({ v: option.v, l: option.l })),
        value: band,
        optional: false,
        onChange: (value) => {
          if (value !== '') band = value;
        },
      });

      const redraw = (): void => {
        this.render(container);
        options.onChanged?.();
      };

      function paintList(): void {
        const profiles = listProfiles(store.document());
        list.replaceChildren();
        if (profiles.length === 0) {
          list.append(el('p', { class: 'hint', text: PROFILE_STRINGS.none }));
          return;
        }

        for (const profile of profiles) {
          const current = store.profile() === profile.id;
          const use = linkRow({
            label: `${profile.nickname} · ${AGE_BAND_LABELS.get(profile.ageBand) ?? profile.ageBand}`,
            value: current ? PROFILE_STRINGS.inUse : PROFILE_STRINGS.use,
            onSelect: () => {
              store.useProfile(profile.id);
              redraw();
            },
          });

          const drop = el('button', {
            type: 'button',
            class: 'btn small',
            text: PROFILE_STRINGS.remove,
          });
          drop.addEventListener('click', () => {
            if (!ask(PROFILE_STRINGS.confirm(profile.nickname))) return;
            store.updateFamily((family) => removeProfile(family, profile.id));
            redraw();
          });

          list.append(el('div', { class: 'profile-row' }, [use, drop]));
        }
      }

      const add = el('button', { type: 'button', class: 'btn primary', text: PROFILE_STRINGS.add });
      add.addEventListener('click', () => {
        const name = nickname.value();
        if (!isValidNickname(name)) {
          status.textContent = PROFILE_STRINGS.needNickname;
          return;
        }
        store.updateFamily((family) =>
          addProfile(family, { nickname: name, ageBand: band, now: now() }),
        );
        // A parent who has just added their first child is looking at that
        // child's tools next, so it becomes the one in use.
        const added = listProfiles(store.document()).at(-1);
        if (added !== undefined && store.profile() === undefined) store.useProfile(added.id);
        redraw();
      });

      container.replaceChildren(
        card({
          sub: PROFILE_STRINGS.sub,
          children: [nickname.element, ages.element, el('div', { class: 'btnrow' }, [add]), status],
        }),
        list,
      );
      paintList();
    },
  };
}
