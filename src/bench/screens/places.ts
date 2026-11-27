// Me and the pages pushed under it (design/lantern/SPEC.md section 12). Me
// holds "If things are bad right now", two taps from anywhere, Settings, and
// About this prototype, where the scenario buttons are. Tasks, Routines and
// Library have screens of their own.

import { CRISIS_LINES, CRISIS_REVIEWED, CRISIS_STRINGS } from '../../kernel/shell/crisis';
import { SCENARIOS, type ScenarioId } from '../example';
import type { Page, Tab } from '../state';
import { T } from '../strings';
import { TITLE, backPill, meButton, type Built } from '../frame';
import { h, icon } from '../ui';

export interface PlaceActions {
  onMe: () => void;
  onBack: () => void;
  onPush: (page: Page) => void;
  onScenario: (id: ScenarioId) => void;
  onDeleteAll: () => void;
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
 * is the crisis page, so help is two taps from any screen; then Settings and
 * About this prototype. Medication and Family, which SPEC 12 puts here, are
 * left out of the prototype, and About says so.
 */
export function meScreen(actions: PlaceActions): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        h('h1', { class: 'place-title t-place', ...TITLE, text: T.me }),
      ),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'me' },
        h(
          'ul',
          { class: 'menu' },
          row(T.crisis, () => actions.onPush({ kind: 'crisis' }), 'm-crisis'),
          row(T.settings, () => actions.onPush({ kind: 'settings' }), 'm-settings'),
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
        h('h1', { class: 'page-title t-idle', ...TITLE, text: CRISIS_STRINGS.title }),
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
  data: 'What you do here stays in this browser, unencrypted, under its own name. A copy added to the home screen keeps its data apart from Safari’s. In a Private Browsing tab, it lasts only until the tab is closed.',
  keepsNothing:
    'This browser is not letting the prototype keep anything, so it starts again on every reload. Blocking all cookies does this.',
  homeTitle: 'On the home screen',
  home: 'In Safari, tap Share, then Add to Home Screen. The copy there opens without Safari around it, which is the fairer test of an app.',
  statusBar:
    'From the home screen, the phone sets the colour of its clock and battery when the prototype opens, so with white places they can be hard to see. Judge white places in a Safari tab.',
  tryTitle: 'What to try',
  tryNote: 'Try each in a Safari tab and from the home screen.',
  tries: [
    {
      title: 'Today and Focus',
      items: [
        'Whether Today and Focus can be told apart at a glance.',
        'The bar burning down, and the minutes straight after the phone has been locked for 5 minutes.',
        'A clock left running: start, lock the phone for 45 minutes, and come back.',
        'Step done, Resume or a tick, then Undo on the Next line.',
        'Focus, from the capsule or the step: the screen stays on while it is open.',
      ],
    },
    {
      title: 'In the hand',
      items: [
        'The rest of today: pull its handle up and let go, slowly or with a flick, over each tab. Close it with Hide or by pulling it down.',
        'Taps that land between the capsule and capture, and between the capsule and Step done.',
        'Tasks: flick a list and tap to stop it. That tap only stops the list; the capsule does not open.',
        'Double-tap a line of text, in the rest of today or on this page. The page should not zoom.',
        'Back: swipe in from the left edge on a task’s page, a sheet, the open drawer and Focus, and watch whether the page slides in twice. From the home screen, see whether the swipe works at all.',
      ],
    },
    {
      title: 'Typing',
      items: [
        'Capture: the keyboard comes up with the sheet riding on it, the page never slides, and what you typed is still there after a reload.',
        'With the keyboard up, drag on the lantern above the sheet and on the line under the field. The page should stay still.',
        'Capture, then Done above the keys, then the field again: the keyboard comes back up under the field.',
        'Add a step on a task’s page: the keyboard comes up under the field, and only the page moves.',
        'With a Japanese keyboard, in capture or Add a step: the return that picks a word should not save it.',
        'When, on a task’s page, then a time or a day: the field looks like the others, and clearing it in the picker does not leave it blank.',
      ],
    },
    {
      title: 'The look',
      items: [
        'Charcoal against white places, in daylight and at night. From the home screen, whether the clock and battery show over white places.',
        'The capsule over Tasks: its second line shows “Write the school email” whole, and “Paused” sits clear of the words beside it.',
        'The type is Instrument Sans in a tab and from the home screen, not the phone’s own.',
        'The light around the step on an OLED screen.',
      ],
    },
    {
      title: 'With the phone’s own settings',
      items: [
        'Motion: with the phone’s Reduce Motion off, compare Settings › Motion at As the phone and at Reduced. With Reduce Motion on, only Reduced shows. Watch for stutter while the drawer is pulled.',
        'Increase Contrast, on and off. Reduce Transparency: the fade under the capsule over Tasks should turn solid.',
        'VoiceOver across Today, Focus, capture and the rest of today: where it lands after each tap, what it says as it moves, done rows, the bar and the tabs.',
      ],
    },
  ],
  leftOutTitle: 'Left out',
  leftOut:
    'Medication and Family are not in the prototype. Nor is anything a web page cannot draw: the Lock Screen, the Dynamic Island, widgets and haptics. It does not follow the phone’s larger text sizes, and it needs a connection to open, even from the home screen.',
  limits:
    'Some things a web page does less well than an app, and they count in deciding how the app gets built: the sheet follows the keyboard rather than moving with it, tapping the status bar does not scroll a list to the top, a drag that starts on the capsule does not scroll the list under it, VoiceOver has no custom actions, and the screen turns when the phone does.',
  font: 'Set in Instrument Sans, by the Instrument Sans Project Authors, under the SIL Open Font License 1.1.',
  prototype: 'Prototype',
  deleteAll: 'Delete everything',
  deleteConfirm: 'Delete everything the prototype keeps in this browser?',
} as const;

/**
 * About this prototype (plan section 11): what it is, where its data is, how
 * to put it on the home screen, what to try on the phone, what is left out,
 * the face and its licence, and, under "Prototype", the scenario buttons.
 */
export function aboutScreen(actions: PlaceActions, keepsNothing = false): Built {
  return {
    nodes: [
      pageHeader(T.me, actions),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'about' },
        h('h1', { class: 'page-title t-idle', ...TITLE, text: T.about }),
        h(
          'div',
          { class: 'prose' },
          h('p', { class: 'lead', text: ABOUT.what }),
          h('p', { class: 't-meta', text: keepsNothing ? ABOUT.keepsNothing : ABOUT.data }),
          h('h2', { class: 't-label', text: ABOUT.homeTitle }),
          h('p', { class: 't-meta', text: ABOUT.home }),
          h('p', { class: 't-meta', text: ABOUT.statusBar }),
          h('h2', { class: 't-label', text: ABOUT.tryTitle }),
          h('p', { class: 't-meta', text: ABOUT.tryNote }),
          ...ABOUT.tries.flatMap((group) => [
            h('h3', { class: 't-meta', text: group.title }),
            h(
              'ul',
              { class: 'tries' },
              ...group.items.map((text) => h('li', { class: 't-meta', text })),
            ),
          ]),
          h('h2', { class: 't-label', text: ABOUT.leftOutTitle }),
          h('p', { class: 't-meta', text: ABOUT.leftOut }),
          h('p', { class: 't-meta', text: ABOUT.limits }),
          h('p', { class: 't-meta', text: ABOUT.font }),
          h('h2', { class: 't-label', text: ABOUT.prototype }),
          h(
            'div',
            { class: 'scenarios' },
            // One list of like buttons, which SPEC 3 counts as one choice.
            h(
              'ul',
              { 'data-list': true },
              ...SCENARIOS.map((scenario) =>
                h(
                  'li',
                  {},
                  h('button', {
                    class: 'pill ash p44',
                    type: 'button',
                    text: scenario.label,
                    onclick: () => actions.onScenario(scenario.id),
                  }),
                ),
              ),
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
