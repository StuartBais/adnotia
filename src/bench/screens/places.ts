// The places and the pages pushed on them (design/lantern/SPEC.md sections
// 5.6, 5.9 and 12). For now Tasks, Routines and Library are bare: a place
// title and Me, so the capsule can be seen riding on them. Me holds "If things
// are bad right now", two taps from anywhere, and About this prototype, where
// the scenario buttons are.

import { CRISIS_LINES, CRISIS_REVIEWED, CRISIS_STRINGS } from '../../kernel/shell/crisis';
import { SCENARIOS, type ScenarioId } from '../example';
import type { Page, Tab } from '../state';
import { T } from '../strings';
import { backPill, meButton, type Built } from '../frame';
import { h, icon } from '../ui';

export interface PlaceActions {
  onMe: () => void;
  onBack: () => void;
  onPush: (page: Page) => void;
  onScenario: (id: ScenarioId) => void;
  onDeleteAll: () => void;
}

const PLACE_TITLES: Record<Exclude<Tab, 'today'>, string> = {
  tasks: T.tasks,
  routines: T.routines,
  library: T.library,
};

/** A place in the header row: its title at the left in 28/34, Me at the right. */
export function placeScreen(tab: Exclude<Tab, 'today'>, actions: PlaceActions): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        h('h1', { class: 'place-title t-place', text: PLACE_TITLES[tab] }),
        meButton(actions.onMe),
      ),
      h('div', { class: 'body', 'data-scroll-key': tab }),
    ],
  };
}

/** What a back pill under a page names: the place it returns to. */
export const BACK_TO: Record<Tab, string> = {
  today: T.today,
  tasks: T.tasks,
  routines: T.routines,
  library: T.library,
};

function pageHeader(back: string, actions: PlaceActions, withMe = true): HTMLElement {
  return h(
    'header',
    { class: 'hdr' },
    backPill(back, actions.onBack),
    h('span', { class: 'grow' }),
    withMe ? meButton(actions.onMe) : null,
  );
}

function row(text: string, onOpen: () => void, id: string): HTMLElement {
  return h(
    'li',
    { class: 'row', 'data-row': true },
    h(
      'button',
      { class: 'rowbtn', type: 'button', id, onclick: onOpen },
      h('span', { text }),
      icon('right', 20),
    ),
  );
}

/**
 * Me: a place, pushed on the current tab, which stays current. Its first row
 * is the crisis page, so help is two taps from any screen. Settings is built
 * with the places (plan section 19, chunk 5).
 */
export function meScreen(actions: PlaceActions): Built {
  return {
    nodes: [
      h('header', { class: 'hdr' }, h('h1', { class: 'place-title t-place', text: T.me })),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'me' },
        h(
          'ul',
          { class: 'menu' },
          row(T.crisis, () => actions.onPush({ kind: 'crisis' }), 'm-crisis'),
          row(T.about, () => actions.onPush({ kind: 'about' }), 'm-about'),
        ),
      ),
    ],
  };
}

/**
 * "If things are bad right now", in the Lantern style. The same lines and
 * words as the app's page, which still wait on a person to confirm them. No
 * capsule and no timer of any kind; capture stays. The app's page also links
 * a directory of lines elsewhere; the prototype names no address, so that
 * paragraph is left out here.
 */
export function crisisScreen(actions: PlaceActions): Built {
  return {
    nodes: [
      pageHeader(T.me, actions),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'crisis' },
        h('h1', { class: 'page-title t-idle', text: CRISIS_STRINGS.title }),
        h(
          'div',
          { class: 'prose' },
          h('p', { class: 'lead', text: CRISIS_STRINGS.emergency }),
          h('p', { class: 't-meta', text: CRISIS_STRINGS.emergencyNote }),
          h('p', { class: 't-meta', text: CRISIS_STRINGS.cannotHelp }),
          h('h2', { class: 't-label', text: CRISIS_STRINGS.linesTitle }),
          h('p', { class: 't-meta', text: CRISIS_STRINGS.linesSub }),
          h(
            'ul',
            { class: 'lines' },
            ...CRISIS_LINES.map((line) =>
              h(
                'li',
                { class: 'line t-meta' },
                h('p', { class: 't-label', text: line.where }),
                h(
                  'p',
                  {},
                  `${line.who} · `,
                  line.dial === undefined
                    ? h('b', { text: line.contact })
                    : h('a', { href: `tel:${line.dial}` }, h('b', { text: line.contact })),
                ),
                line.note === undefined ? null : h('p', { text: line.note }),
              ),
            ),
          ),
          h('p', { class: 't-meta', text: CRISIS_STRINGS.reviewed(CRISIS_REVIEWED) }),
          h('p', { class: 't-meta', text: CRISIS_STRINGS.unchecked }),
        ),
      ),
    ],
  };
}

export const ABOUT = {
  what: 'A prototype of the phone app, made to be held and tried. It is not the app, and nothing links to it.',
  data: 'What you do here stays in this browser, unencrypted, under its own name. A copy added to the home screen keeps its data apart from Safari’s.',
  font: 'Set in Instrument Sans, by the Instrument Sans Project Authors, under the SIL Open Font License 1.1.',
  prototype: 'Prototype',
  deleteAll: 'Delete everything',
  deleteConfirm: 'Delete everything the prototype keeps in this browser?',
} as const;

/** About this prototype, with the scenario buttons under "Prototype". */
export function aboutScreen(actions: PlaceActions): Built {
  return {
    nodes: [
      pageHeader(T.me, actions),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'about' },
        h('h1', { class: 'page-title t-idle', text: T.about }),
        h(
          'div',
          { class: 'prose' },
          h('p', { class: 'lead', text: ABOUT.what }),
          h('p', { class: 't-meta', text: ABOUT.data }),
          h('p', { class: 't-meta', text: ABOUT.font }),
          h('h2', { class: 't-label', text: ABOUT.prototype }),
          h(
            'div',
            { class: 'scenarios' },
            ...SCENARIOS.map((scenario) =>
              h('button', {
                class: 'pill ash p44',
                type: 'button',
                text: scenario.label,
                onclick: () => actions.onScenario(scenario.id),
              }),
            ),
            h('button', {
              class: 'textbtn',
              type: 'button',
              text: ABOUT.deleteAll,
              onclick: actions.onDeleteAll,
            }),
          ),
        ),
      ),
    ],
  };
}

/**
 * A task's own page, bare for now: its title under a back pill. The when
 * pill, Start, the steps and the running task's own page are built with the
 * places (plan section 19, chunk 5).
 */
export function taskScreen(title: string, back: string, actions: PlaceActions): Built {
  return {
    nodes: [
      pageHeader(back, actions),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'task' },
        h('h1', { class: 'page-title t-idle', text: title }),
      ),
    ],
  };
}
