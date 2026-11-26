// Capture (design/lantern/SPEC.md section 5.5): the sheet the capture disc
// opens, with the keyboard already up.
//
// From the top of the sheet: the grabber; "Capture", the sheet's title, and
// Close, the quieter text button; the white field; the helper line; and the
// row riding the keyboard, Inbox or Today at the left and Save at the right,
// in capture's own column. Nothing else is asked: no date, no steps, no
// estimate. Those belong to the task's page.
//
// The sheet is modal, so the whole layer is the dialog: above the sheet, a
// tap anywhere closes it and keeps the draft, and Me stays a working button,
// a clear target over the Me drawn underneath, so help is still two taps
// away. On a place the capsule rides the sheet's top edge as a picture only.
//
// What it is made of is fixed when it is built. The field's words are the
// person's and are never rebuilt under them; Inbox or Today and its helper
// line change in place.

import { capsule } from '../capsule';
import { HINT_IDS, type Built } from '../frame';
import { SAY, T } from '../strings';
import { h, segmented } from '../ui';
import type { PresentLive, PresentView } from '../view';

export type CaptureTo = 'inbox' | 'today';

/**
 * How the sheet was closed: each keeps the draft (SPEC 5.5). Escape is a
 * hardware keyboard's, on an iPad or a desktop; the phone's has none.
 */
export type CloseWay = 'close' | 'above' | 'swipe' | 'escape';

export interface CaptureProps {
  text: string;
  to: CaptureTo;
  /** The capsule riding the sheet's top edge, as a picture, where there is one. */
  ride?: { view: PresentView; live: PresentLive; look: 'lifted' | 'plain' };
  /** Me above the sheet, where the screen under it has Me in its header row. */
  me: boolean;
  onInput: (text: string) => void;
  onTo: (to: CaptureTo) => void;
  onSave: () => void;
  onClose: (way: CloseWay) => void;
  onMe: () => void;
}

export interface CaptureSheet extends Built {
  field: HTMLInputElement;
}

/** A swipe down this far, or a flick this fast (pt per ms), closes the sheet. */
export const SWIPE = { distance: 64, speed: 0.5 } as const;

export function captureSheet(props: CaptureProps): CaptureSheet {
  let to = props.to;

  const field = h('input', {
    class: 'c-field t-field',
    id: 'c-field',
    type: 'text',
    'data-geo': 'c-field',
    'data-focus-home': true,
    'aria-labelledby': 'c-title',
    placeholder: T.placeholder,
    // The default return key, which files the item in this one-line field.
    // Not "Done": in this app Done means finishing a task (SPEC 5.5).
    enterkeyhint: 'enter',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    value: props.text,
  }) as HTMLInputElement;
  field.addEventListener('input', () => props.onInput(field.value));
  field.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    props.onSave();
  });

  const help = h('p', {
    class: 'c-help',
    id: 'c-help',
    text: to === 'inbox' ? T.helpInbox : T.helpToday,
  });

  // Inbox or Today: a switch of two equal parts. Choosing rebuilds only the
  // switch, and focus stays on the part it was on.
  const choose = (value: CaptureTo) => {
    if (value === to) return;
    to = value;
    const active = document.activeElement;
    const had = switcher.contains(active);
    const next = build();
    switcher.replaceWith(next);
    switcher = next;
    help.textContent = to === 'inbox' ? T.helpInbox : T.helpToday;
    if (had) document.getElementById(`c-to-${to}`)?.focus();
    // A tap, not the arrow keys: the typing goes on. Where the tap took focus
    // off the field after all (a browser that does not honour the mousedown's
    // preventDefault), it goes back in the same tap, so the keyboard stays.
    else if (active !== field) field.focus({ preventScroll: true });
    props.onTo(to);
  };
  const build = () => {
    const group = segmented<CaptureTo>({
      id: 'c-to',
      labelledBy: 'c-to-name',
      options: [
        { value: 'inbox', text: T.inbox },
        { value: 'today', text: T.today },
      ],
      value: to,
      onChoose: choose,
    });
    // A tap on the switch leaves the keyboard up: the field keeps focus.
    group.addEventListener('mousedown', (event) => event.preventDefault());
    return group;
  };
  let switcher = build();

  const save = h('button', {
    class: 'c-save',
    type: 'button',
    id: 'c-save',
    text: T.save,
    onclick: props.onSave,
  });
  save.addEventListener('mousedown', (event) => event.preventDefault());

  const close = h('button', {
    class: 'textbtn quiet c-close',
    type: 'button',
    id: 'c-close',
    text: T.close,
    onclick: () => props.onClose('close'),
  });

  const ride = props.ride
    ? capsule({
        view: props.ride.view,
        live: props.ride.live,
        look: props.ride.look,
        mode: 'picture',
      })
    : undefined;

  const head = h(
    'div',
    { class: 'c-head' },
    h('h2', { class: 't-sheet', id: 'c-title', text: T.capture }),
    close,
  );
  // The band above the title, with the grabber in it: where a thumb pulls the
  // sheet down. Its own element, so the browser leaves the pan to the sheet.
  const grip = h('span', { class: 'c-grip', 'aria-hidden': 'true' });
  const panel = h(
    'div',
    { class: 'c-panel', 'data-geo': 'sheet' },
    ride ? h('div', { class: 'c-ride', 'aria-hidden': 'true' }, ride.el) : null,
    grip,
    h('span', { class: 'grab', 'aria-hidden': 'true' }),
    head,
    field,
    help,
    h(
      'div',
      { class: 'c-row', 'data-geo': 'c-row' },
      // The switch's name, hidden so it is read once, as the group's name.
      h('span', { hidden: true, id: 'c-to-name', text: T.whereItGoes }),
      switcher,
      save,
    ),
  );
  swipeToClose(panel, [grip, head], () => props.onClose('swipe'));

  const dialog = h(
    'div',
    {
      class: 'csheet',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'c-title',
      onkeydown: (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.isComposing) return;
        event.preventDefault();
        props.onClose('escape');
      },
    },
    // Above the sheet: a tap closes it, keeping the draft. Not a control of
    // its own for a screen reader, which closes the sheet with Close or back.
    h('div', { class: 'c-above', 'aria-hidden': 'true', onclick: () => props.onClose('above') }),
    panel,
    props.me
      ? h('button', {
          class: 'c-me',
          type: 'button',
          id: 'c-me',
          'aria-label': SAY.me,
          'aria-describedby': HINT_IDS.meDraft,
          onclick: props.onMe,
        })
      : null,
  );

  return {
    nodes: [dialog],
    field,
    patch(live) {
      if (live && ride) ride.patch(live);
    },
  };
}

/**
 * A swipe down on the sheet's grabber and title band closes it (SPEC 9.9).
 * The sheet follows the finger down, and springs back if it was not far or
 * fast enough. A drag in the field, the switch or a button is theirs.
 */
export function swipeToClose(panel: HTMLElement, bands: HTMLElement[], onClose: () => void): void {
  let start: { y: number; at: number } | undefined;
  let last = { y: 0, at: 0 };
  const reset = () => {
    start = undefined;
    panel.style.removeProperty('transform');
  };
  panel.addEventListener('pointerdown', (event) => {
    const target = event.target as Element | null;
    if (target?.closest('button, input, .seg')) return;
    if (!(target === panel || bands.some((band) => band.contains(target)))) return;
    const id = (event as PointerEvent).pointerId;
    start = { y: event.clientY, at: event.timeStamp };
    last = { y: event.clientY, at: event.timeStamp };
    if (id !== undefined) {
      try {
        panel.setPointerCapture(id);
      } catch {
        // A pointer the browser no longer tracks: follow it without capture.
      }
    }
  });
  panel.addEventListener('pointermove', (event) => {
    if (!start) return;
    const dy = Math.max(0, event.clientY - start.y);
    last = { y: event.clientY, at: event.timeStamp };
    panel.style.transform = `translateY(${dy}px)`;
  });
  const end = (event: Event, cancelled: boolean) => {
    if (!start) return;
    const y = (event as MouseEvent).clientY ?? last.y;
    const dy = y - start.y;
    const time = Math.max(1, event.timeStamp - start.at);
    const fast = dy > 16 && dy / time > SWIPE.speed;
    reset();
    if (!cancelled && (dy > SWIPE.distance || fast)) onClose();
  };
  panel.addEventListener('pointerup', (event) => end(event, false));
  panel.addEventListener('pointercancel', (event) => end(event, true));
}
