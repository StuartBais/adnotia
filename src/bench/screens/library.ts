// The Library (design/lantern/SPEC.md section 12), as a stub: "Library", Me,
// and five rows, each a name over one plain line. Each opens a page under a
// back pill that says it is not in this prototype (plan section 11). The
// capsule rides here as on every place. A tool's evidence tier would be
// written in words inside it, never as a letter or a badge; there is none to
// write yet.

import { backPill, meButton, type Built } from '../frame';
import { T } from '../strings';
import { h, icon } from '../ui';
import { LIBRARY } from '../view';

export interface LibraryActions {
  onMe: () => void;
  onOpen: (topic: string) => void;
}

export function libraryScreen(actions: LibraryActions): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        h('h1', { class: 'place-title t-place', text: T.library }),
        meButton(actions.onMe),
      ),
      h(
        'div',
        { class: 'body library', 'data-scroll-key': 'library' },
        h(
          'ul',
          { class: 'llist', 'data-list': true },
          ...LIBRARY.map((item, index) =>
            h(
              'li',
              {
                class: 'row lrow',
                'data-row': true,
                ...(index === 0 ? { 'data-geo': 'l-row' } : {}),
              },
              h(
                'button',
                {
                  class: 'rowbtn',
                  type: 'button',
                  id: `lib-${item.topic}`,
                  'aria-label': `${item.name}, ${item.line}`,
                  onclick: () => actions.onOpen(item.topic),
                },
                h(
                  'span',
                  { class: 'rt' },
                  h('span', { text: item.name }),
                  h('small', { 'aria-hidden': 'true', text: item.line }),
                ),
                icon('right', 20),
              ),
            ),
          ),
        ),
      ),
    ],
  };
}

/** A Library topic's page: its name under a back pill, and that it is not here yet. */
export function topicScreen(
  name: string,
  back: string,
  actions: { onBack: () => void; onMe: () => void },
): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        backPill(back, actions.onBack),
        h('span', { class: 'grow' }),
        meButton(actions.onMe),
      ),
      h(
        'div',
        { class: 'body page', 'data-scroll-key': 'library-topic' },
        h('h1', {
          class: 'ptitle t-idle',
          id: 'p-title',
          tabindex: '-1',
          'data-focus-home': true,
          'data-geo': 'p-title',
          text: name,
        }),
        h('p', { class: 'sentence t-meta', text: T.notInPrototype }),
      ),
    ],
  };
}
