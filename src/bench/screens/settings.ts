// Settings, under Me (PROTOTYPE-PLAN.md section 4, "Four switches"): the
// owner's four choices for this round. SPEC 12 names a Settings page (lock,
// backup, rewards, reminders, text and display) but does not draw it; these
// are only the switches the prototype needs to be judged by, each a switch of
// two equal parts (SPEC 9.6). Each takes effect at once.

import { T } from '../strings';
import { TITLE, backPill, meButton, type Built } from '../frame';
import { h, segmented, type SegmentOption } from '../ui';
import type { BenchSettings } from '../state';

/** What the page shows: the bench's own settings, and the real doneList. */
export interface SettingsView extends BenchSettings {
  doneList: boolean;
}

export interface SettingsActions {
  onBack: () => void;
  onMe: () => void;
  onChange: (change: Partial<SettingsView>) => void;
}

export const SETTINGS = {
  places: 'Places',
  placesHelp: 'Tasks, Routines, Library and Me. Today and Focus stay charcoal.',
  charcoal: 'Charcoal',
  white: 'White',
  doneList: 'List what got done today',
  doneListHelp: 'Adds Done today to the rest of today, after Anytime today.',
  off: 'Off',
  on: 'On',
  closedLabel: 'A session the app closed reads',
  closedLabelHelp: 'The word on Today after the app closes a clock left running.',
  motion: 'Motion',
  motionHelp: 'Reduced moves the bar once a minute, whatever the phone is set to.',
  asPhone: 'As the phone',
  reduced: 'Reduced',
} as const;

function setting<V extends string>(
  key: string,
  label: string,
  help: string,
  options: readonly SegmentOption<V>[],
  value: V,
  onChoose: (value: V) => void,
): HTMLElement {
  const labelId = `s-${key}`;
  const helpId = `s-${key}-help`;
  return h(
    'div',
    { class: 'setting' },
    h('h2', { class: 't-control', id: labelId, text: label }),
    // Read once, as the switch's description: shown, and kept from being
    // read again on its own as the line before it.
    h('p', { class: 'helper t-meta', id: helpId, 'aria-hidden': 'true', text: help }),
    segmented({
      id: `s-${key}`,
      labelledBy: labelId,
      describedBy: helpId,
      options,
      value,
      onChoose,
    }),
  );
}

export function settingsScreen(view: SettingsView, actions: SettingsActions): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        backPill(T.me, actions.onBack),
        h('span', { class: 'grow' }),
        meButton(actions.onMe),
      ),
      h(
        'div',
        { class: 'body', 'data-scroll-key': 'settings' },
        h('h1', { class: 'page-title t-idle', ...TITLE, text: T.settings }),
        h(
          'div',
          { class: 'settings' },
          setting(
            'places',
            SETTINGS.places,
            SETTINGS.placesHelp,
            [
              { value: 'charcoal', text: SETTINGS.charcoal },
              { value: 'white', text: SETTINGS.white },
            ],
            view.places,
            (places) => actions.onChange({ places }),
          ),
          setting(
            'done',
            SETTINGS.doneList,
            SETTINGS.doneListHelp,
            [
              { value: 'off', text: SETTINGS.off },
              { value: 'on', text: SETTINGS.on },
            ],
            view.doneList ? 'on' : 'off',
            (value) => actions.onChange({ doneList: value === 'on' }),
          ),
          setting(
            'closed',
            SETTINGS.closedLabel,
            SETTINGS.closedLabelHelp,
            [
              { value: 'paused', text: T.paused },
              { value: 'stopped', text: T.timerStopped },
            ],
            view.closedLabel,
            (closedLabel) => actions.onChange({ closedLabel }),
          ),
          setting(
            'motion',
            SETTINGS.motion,
            SETTINGS.motionHelp,
            [
              { value: 'system', text: SETTINGS.asPhone },
              { value: 'reduced', text: SETTINGS.reduced },
            ],
            view.motion,
            (motion) => actions.onChange({ motion }),
          ),
        ),
      ),
    ],
  };
}
