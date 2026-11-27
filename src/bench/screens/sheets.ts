// The sheets a task's page raises (design/lantern/SPEC.md sections 9.9 and
// 12; PROTOTYPE-PLAN.md section 11, "The when sheet and the ⋯ sheet").
//
// Every one is the same stone sheet: a 24 radius on its top corners, a
// grabber, and a header row with its title in charcoal at the left and Close,
// the quieter text button, at the right. It is modal. Close, a swipe down, a
// tap above it, Escape and back all close it, and anything typed is kept.
// Raised from a place, the capsule rides its top edge as a picture only.
//
// - When: five large rows, a time or a day where the row asks for one, How
//   long with −5 and +5 around the minutes, then Done.
// - ⋯: Add a note (or Edit the note), Rename, and Delete, a quiet text button.
// - Note and Rename: one field each, riding the keyboard as capture does.
// - Delete: the question, one plain line, and Delete.

import { capsule } from '../capsule';
import { type Built } from '../frame';
import { SAY, T, deleteLine } from '../strings';
import { composing, h, icon } from '../ui';
import { swipeToClose, type CloseWay } from './capture';
import type { PresentLive, PresentView } from '../view';

export type WhenChoice = 'none' | 'today' | 'at' | 'tomorrow' | 'pick';

export interface ShellProps {
  /** Its title, the dialog's name. */
  title: string;
  ride?: { view: PresentView; live: PresentLive; look: 'lifted' | 'plain' } | undefined;
  onClose: (way: CloseWay) => void;
}

/**
 * The sheet itself, holding `body`. Its title takes focus where nothing in
 * the sheet does, so the sheet is where a screen reader is when it opens.
 */
function shell(props: ShellProps, kind: string, body: Node[]): Built {
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
    h('h2', {
      class: 't-sheet',
      id: 'ts-title',
      tabindex: '-1',
      'data-sheet-home': true,
      text: props.title,
    }),
    h('button', {
      class: 'textbtn quiet c-close',
      type: 'button',
      id: 'ts-close',
      text: T.close,
      onclick: () => props.onClose('close'),
    }),
  );
  const grip = h('span', { class: 'c-grip', 'aria-hidden': 'true' });
  const panel = h(
    'div',
    { class: `c-panel ts-panel ts-${kind}`, 'data-geo': 'tsheet' },
    ride ? h('div', { class: 'ts-ride', 'aria-hidden': 'true' }, ride.el) : null,
    grip,
    h('span', { class: 'grab', 'aria-hidden': 'true' }),
    head,
    ...body,
  );
  swipeToClose(panel, [grip, head], () => props.onClose('swipe'));
  const dialog = h(
    'div',
    {
      class: 'csheet',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ts-title',
      onkeydown: (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.isComposing) return;
        event.preventDefault();
        props.onClose('escape');
      },
    },
    h('div', { class: 'c-above', 'aria-hidden': 'true', onclick: () => props.onClose('above') }),
    panel,
  );
  return {
    nodes: [dialog],
    patch(live) {
      if (live && ride) ride.patch(live);
    },
  };
}

// ---------------------------------------------------------------- when

export interface WhenProps extends ShellProps {
  choice: WhenChoice;
  /** The booked time, "10:30", for "Today at a time". */
  time: string | undefined;
  /** The day, for "Pick a day". */
  date: string | undefined;
  /** The earliest day "Pick a day" offers: today. */
  today: string;
  /** How long as it reads: "10 min", or "Not set". */
  length: string;
  /** Whether −5 has anything to take off. */
  canLess: boolean;
  onChoose: (choice: WhenChoice) => void;
  onTime: (time: string) => void;
  onDate: (date: string) => void;
  onLess: () => void;
  onMore: () => void;
  onDone: () => void;
}

const WHEN_ROWS: readonly { choice: WhenChoice; text: string }[] = [
  { choice: 'none', text: T.whenNone },
  { choice: 'today', text: T.whenToday },
  { choice: 'at', text: T.whenAt },
  { choice: 'tomorrow', text: T.whenTomorrow },
  { choice: 'pick', text: T.whenPick },
];

/**
 * The when sheet (SPEC 12). The rows are one radio group: the chosen one has
 * a check and its words at 700, never colour alone. Each choice takes effect
 * at once, so the page under the sheet is always what the sheet says; Done
 * closes it. "How long" sets a booked slot's length and the estimate
 * together (owner question 8), and an estimate for anything else.
 */
export function whenSheet(props: WhenProps): Built {
  const rows = WHEN_ROWS.map(({ choice, text }) => {
    const checked = choice === props.choice;
    const row = h(
      'button',
      {
        class: 'opt',
        type: 'button',
        role: 'radio',
        id: `w-${choice}`,
        'aria-checked': checked ? 'true' : 'false',
        tabindex: checked ? '0' : '-1',
        onclick: () => {
          if (!checked) props.onChoose(choice);
        },
      },
      h('span', { 'data-text': text, text }),
      checked ? icon('check', 20) : null,
    );
    return row;
  });
  const group = h(
    'div',
    { class: 'opts', role: 'radiogroup', 'aria-labelledby': 'ts-title' },
    ...rows,
  );
  const STEP: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
  group.addEventListener('keydown', (event) => {
    const step = STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const at = WHEN_ROWS.findIndex((row) => row.choice === props.choice);
    const next = WHEN_ROWS[(at + step + WHEN_ROWS.length) % WHEN_ROWS.length];
    if (!next) return;
    props.onChoose(next.choice);
    // The sheet is drawn again around the choice: focus goes with the check,
    // onto the row now chosen, as a radio group's arrow keys move both.
    group.ownerDocument.getElementById(`w-${next.choice}`)?.focus();
  });

  // The time or the day the chosen row asks for, as the phone's own pickers:
  // native inputs, which the keyboard does not take. Cleared in the picker,
  // a field takes back what is booked, so it never reads blank while the
  // pill and the chosen row still say a time or a day.
  const reveal =
    props.choice === 'at'
      ? h('input', {
          class: 'wpick',
          type: 'time',
          id: 'w-time',
          'aria-label': SAY.time,
          value: props.time ?? '',
          onchange: (event: Event) => {
            const input = event.target as HTMLInputElement;
            if (input.value) props.onTime(input.value);
            else input.value = props.time ?? '';
          },
        })
      : props.choice === 'pick'
        ? h('input', {
            class: 'wpick',
            type: 'date',
            id: 'w-date',
            'aria-label': SAY.day,
            min: props.today,
            value: props.date ?? '',
            onchange: (event: Event) => {
              const input = event.target as HTMLInputElement;
              if (input.value) props.onDate(input.value);
              else input.value = props.date ?? '';
            },
          })
        : null;

  const howLong = h(
    'div',
    { class: 'howlong' },
    h('h3', { class: 't-control', id: 'w-howlong', text: T.howLong }),
    h(
      'div',
      { class: 'stepper', role: 'group', 'aria-labelledby': 'w-howlong', 'data-list': true },
      // With nothing to take off, −5 is not there, rather than dimmed: a
      // dimmed label would be read at under 4.5:1, and shown by its colour
      // alone. Its place is kept, so the minutes and +5 stay where they are,
      // and focus it held lands on the minutes, which say why.
      props.canLess
        ? h('button', {
            class: 'pill quiet p44 step',
            type: 'button',
            id: 'w-less',
            'aria-label': SAY.less5,
            text: T.minus5,
            onclick: props.onLess,
          })
        : h('span', { class: 'step gap', 'aria-hidden': 'true' }),
      h('span', {
        class: 'wlength',
        id: 'w-length',
        tabindex: '-1',
        'data-focus-home': true,
        text: props.length,
      }),
      h('button', {
        class: 'pill quiet p44 step',
        type: 'button',
        id: 'w-more',
        'aria-label': SAY.more5,
        text: T.plus5,
        onclick: props.onMore,
      }),
    ),
  );
  // Done closes the sheet; it is not the present, so it is not charcoal
  // (SPEC 7): the stone sheet's quiet pill, as its Delete is.
  const done = h('button', {
    class: 'pill quiet pad wdone',
    type: 'button',
    id: 'w-done',
    text: T.done,
    onclick: props.onDone,
  });
  // The time or the day sits under the rows, not among them: a radio group
  // holds its radios and nothing else.
  return shell(props, 'when', [group, ...(reveal ? [reveal] : []), howLong, done]);
}

// ---------------------------------------------------------------- ⋯

export interface MoreProps extends ShellProps {
  hasNote: boolean;
  onNote: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/** The ⋯ sheet (plan section 11): the note, Rename, and Delete as a quiet text button. */
export function moreSheet(props: MoreProps): Built {
  return shell(props, 'more', [
    h(
      'div',
      { class: 'opts' },
      h(
        'button',
        { class: 'opt', type: 'button', id: 'm-note', onclick: props.onNote },
        h('span', { text: props.hasNote ? T.editNote : T.addNote }),
        icon('right', 20),
      ),
      h(
        'button',
        { class: 'opt', type: 'button', id: 'm-rename', onclick: props.onRename },
        h('span', { text: T.rename }),
        icon('right', 20),
      ),
    ),
    h('button', {
      class: 'textbtn quiet m-delete',
      type: 'button',
      id: 'm-delete',
      text: T.delete,
      onclick: props.onDelete,
    }),
  ]);
}

// ---------------------------------------------------------------- note and rename

export interface FieldProps extends ShellProps {
  kind: 'note' | 'rename';
  text: string;
  onInput: (text: string) => void;
}

export interface FieldSheet extends Built {
  field: HTMLInputElement | HTMLTextAreaElement;
}

/**
 * The note, or a rename: one field, riding the keyboard as capture's does
 * (SPEC 3). The words are the task's as they are typed; closing keeps them.
 * Return in the one-line rename closes the sheet; in the note it starts a
 * new line.
 */
export function fieldSheet(props: FieldProps): FieldSheet {
  const field =
    props.kind === 'note'
      ? (h('textarea', {
          class: 'ts-field note-field',
          id: 'ts-field',
          'aria-labelledby': 'ts-title',
          rows: '4',
          autocapitalize: 'sentences',
        }) as HTMLTextAreaElement)
      : (h('input', {
          class: 'ts-field c-field t-field',
          id: 'ts-field',
          type: 'text',
          'aria-labelledby': 'ts-title',
          enterkeyhint: 'enter',
          autocomplete: 'off',
          autocapitalize: 'sentences',
        }) as HTMLInputElement);
  field.value = props.text;
  field.addEventListener('input', () => props.onInput(field.value));
  if (props.kind === 'rename') {
    field.addEventListener('keydown', (event) => {
      const key = event as KeyboardEvent;
      if (key.key !== 'Enter' || composing(key)) return;
      key.preventDefault();
      props.onClose('close');
    });
  }
  const built = shell(props, props.kind, [field]);
  return { ...built, field };
}

// ---------------------------------------------------------------- delete

export interface DeleteProps extends ShellProps {
  hasSteps: boolean;
  onDelete: () => void;
}

/** The confirm before Delete: the question, what goes with it, and Delete. Never coloured. */
export function deleteSheet(props: DeleteProps): Built {
  return shell(props, 'delete', [
    h('p', { class: 'ts-line t-meta', text: deleteLine(props.hasSteps) }),
    h('button', {
      class: 'pill quiet pad',
      type: 'button',
      id: 'd-delete',
      text: T.delete,
      onclick: props.onDelete,
    }),
  ]);
}
