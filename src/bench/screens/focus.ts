// Focus (design/lantern/SPEC.md section 5.4): the capsule opened all the way.
//
// A layer over everything but the dock line: no tabs and no drawer. From the
// top: "⌄ Today" (or the tab it was opened on) and Me; the context line that
// names it; the done step's disc; the step, the one white heading, at eye
// height; "After this"; the bar run edge to edge; the minutes stacked, with
// +5 min beside them, or Set aside when paused; and the note. The dock line
// is Today's, in Today's places, so it is not drawn here. Below the hairline
// at 754 the foot says what is later, in the Next line's rows, and for six
// seconds after a quick tap carries that tap's words and Undo.
//
// Like Today, what it is made of is fixed when it is built, and the ticker
// moves the bar, the minutes and the spoken figures in place.

import { focusFootParts, type NextLine } from '../state';
import { SAY, T, focusContextLabel, minutesSpoken, say, type SpokenMinutes } from '../strings';
import { HINT_IDS, meButton, type Built } from '../frame';
import { bar, dottedNodes, h, icon, patchBar, spoken } from '../ui';
import type { PresentLive, PresentView } from '../view';

export interface FocusActions {
  onBack: () => void;
  onMe: () => void;
  /** The done step's disc: not done after all. */
  onReopenStep: (stepId: string) => void;
  onAddFive: () => void;
  onSetAside: () => void;
}

/**
 * A separator with its word spaces inside it, for the context line and the
 * foot: each is a row whose title gives way, and a row drops the spaces
 * between its parts.
 */
const rowSep = (): HTMLElement =>
  h('span', { class: 'sep', 'aria-hidden': 'true' }, '\u00a0·\u00a0');

/** The static form of Focus, for a key: what it is made of, not its figures. */
export const focusKey = (view: PresentView, back: string): unknown[] => [
  view.kind,
  view.lead,
  view.task.id,
  view.task.title,
  view.step,
  view.position?.number,
  view.position?.count,
  view.note,
  view.steps.previousDone?.id,
  view.steps.previousDone?.title,
  view.steps.after?.title,
  back,
];

/**
 * The bar read alone (SPEC 11): a meter named "Time left", its value in the
 * minutes' own words. Used up, it is empty and says so; with no estimate it
 * counts up against an hour, as it is drawn.
 */
function meter(node: HTMLElement, minutes: SpokenMinutes): void {
  const set = (name: string, value: string) => {
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  };
  set('role', 'meter');
  set('aria-label', SAY.timeLeft);
  set('aria-valuemin', '0');
  switch (minutes.kind) {
    case 'left':
      set('aria-valuemax', String(minutes.estimate));
      set('aria-valuenow', String(minutes.left));
      set('aria-valuetext', say.meterValue(minutes.left, minutes.estimate));
      break;
    case 'over':
      set('aria-valuemax', String(minutes.estimate));
      set('aria-valuenow', '0');
      set('aria-valuetext', minutesSpoken(minutes));
      break;
    case 'countUp':
      set('aria-valuemax', '60');
      set('aria-valuenow', String(Math.min(minutes.soFar, 60)));
      set('aria-valuetext', minutesSpoken(minutes));
      break;
  }
}

/** The minutes, stacked as on the Lock Screen card: the figure over the rest. */
function minutesBlock(live: PresentLive): { el: HTMLElement; set(live: PresentLive): void } {
  const main = h('strong', { class: 't-min-focus' });
  const rest = h('span', { class: 'rest t-meta' });
  const said = spoken('');
  const shown = h('span', { class: 'fmins-shown', 'aria-hidden': 'true' }, main, rest);
  const el = h('p', { class: 'fmins', 'data-geo': 'f-mins' }, shown, said);
  const set = (next: PresentLive) => {
    if (main.textContent !== next.words.main) main.textContent = next.words.main;
    const tone = next.words.tone === 'still' ? 't-min-focus still' : 't-min-focus';
    if (main.className !== tone) main.className = tone;
    const words = next.words.rest ?? '';
    if (rest.dataset['words'] !== words) {
      rest.dataset['words'] = words;
      rest.replaceChildren(...dottedNodes(words));
      rest.hidden = words === '';
    }
    const text = minutesSpoken(next.spoken.minutes);
    if (said.textContent !== text) said.textContent = text;
  };
  set(live);
  return { el, set };
}

export function focusScreen(
  view: PresentView,
  live: PresentLive,
  back: string,
  actions: FocusActions,
): Built {
  const paused = view.kind === 'paused';
  const { previousDone, after } = view.steps;

  const header = h(
    'header',
    { class: 'hdr' },
    h(
      'button',
      {
        class: 'hpill',
        type: 'button',
        id: 'f-back',
        'data-geo': 'f-back',
        'aria-label': say.backTo(back),
        // Only true while the clock runs; paused, nothing is said after it.
        'aria-describedby': paused ? undefined : HINT_IDS.timer,
        onclick: actions.onBack,
      },
      icon('down', 20),
      back,
    ),
    h('span', { class: 'grow' }),
    meButton(actions.onMe, 'f-me'),
  );

  // The context line, a heading: "Focus · Write the school email · step 2 of 3".
  // A row whose title gives way: a long one is cut, and "step 2 of 3" keeps
  // its place, as the foot keeps its "in" part.
  const context = h(
    'h1',
    { class: 'fctx t-meta', 'data-geo': 'f-ctx' },
    h(
      'span',
      { class: 'fctx-shown', 'aria-hidden': 'true' },
      h('b', { text: T.focus }),
      rowSep(),
      h('span', { class: 'fctx-title', text: view.task.title }),
      ...(view.position
        ? [rowSep(), h('span', { text: `step ${view.position.number} of ${view.position.count}` })]
        : []),
    ),
    spoken(focusContextLabel(view.task.title, view.position)),
  );

  // The step before, done: its disc un-ticks it. Without one the line is
  // kept empty, so the step stays at eye height from one step to the next.
  const done = previousDone
    ? h(
        'p',
        { class: 'fdone' },
        h(
          'button',
          {
            class: 'fdisc',
            type: 'button',
            id: 'f-disc',
            'aria-label': say.undoStepDone(previousDone.title),
            onclick: () => actions.onReopenStep(previousDone.id),
          },
          h('span', {}, icon('check-s', 16)),
        ),
        h('span', { class: 'fdone-t', 'aria-hidden': 'true', text: previousDone.title }),
      )
    : h('div', { class: 'fdone', 'aria-hidden': 'true' });

  const step = h(
    'h2',
    {
      class: 'fstep t-step-focus',
      id: 'f-step',
      tabindex: '-1',
      // SPEC 11: opening Focus lands here.
      'data-focus-home': true,
      'data-geo': 'f-step',
    },
    spoken(`${view.lead}:`),
    ' ',
    view.step,
  );

  const next = after
    ? h('p', { class: 'fafter t-row' }, h('b', { text: T.afterThis }), ' ', after.title)
    : h('div', { class: 'fafter', 'aria-hidden': 'true' });

  const theBar = bar('focus', live.bar);
  theBar.removeAttribute('aria-hidden');
  theBar.setAttribute('data-geo', 'f-bar');
  meter(theBar, live.spoken.minutes);

  const minutes = minutesBlock(live);
  const side = paused
    ? h('button', {
        class: 'pill ash p44',
        type: 'button',
        id: 'f-aside',
        'data-geo': 'f-side',
        'aria-label': say.setAside(view.task.title, view.position?.number),
        text: T.setAside,
        onclick: actions.onSetAside,
      })
    : h('button', {
        class: 'pill ash p44',
        type: 'button',
        id: 'f-five',
        'data-geo': 'f-side',
        'aria-label': SAY.addFive,
        text: T.addFive,
        onclick: actions.onAddFive,
      });

  const note = view.note
    ? h(
        'p',
        { class: 'note t-meta fnote' },
        h(
          'span',
          { class: 'note-shown', 'aria-hidden': 'true' },
          icon('note', 18),
          h('span', {}, h('b', { text: T.note }), ' ', view.note),
        ),
        spoken(`${T.note}: ${view.note}`),
      )
    : null;

  const body = h(
    'div',
    { class: 'fbody', 'data-scroll-key': 'focus' },
    context,
    done,
    step,
    next,
    theBar,
    h('div', { class: 'frow' }, minutes.el, side),
    note,
  );

  return {
    nodes: [header, body],
    patch(nextLive) {
      if (!nextLive) return;
      patchBar(theBar, 'focus', nextLive.bar);
      meter(theBar, nextLive.spoken.minutes);
      minutes.set(nextLive);
    },
  };
}

// ---------------------------------------------------------------- the foot

export interface FootProps {
  next: NextLine;
  /** For six seconds after an undoable tap: the same Undo as the Next line's. */
  undo?: { name: string; onUndo: () => void };
}

/** The foot, and a way to move its "in N min" and its label in place. */
export interface Foot {
  nodes: Node[];
  set(next: NextLine): void;
}

/**
 * Focus's foot (SPEC 5.4): the hairline at 754, then one line of text that
 * cannot be tapped, "Later today · 10:30 Call the dentist · in 25 min",
 * following the Next line's rows. A long title is cut, and its "in" part
 * keeps its place. For six seconds after a tap the line carries that tap's
 * words, and the Undo pill stands at its right, 764–808.
 */
export function focusFoot(props: FootProps): Foot {
  const parts = focusFootParts(props.next);
  const when = h('span', { class: 'ff-when', text: parts.when });
  const said = spoken(parts.label);
  const line = h(
    'p',
    {
      class: props.undo ? 'ff-line t-meta with-undo' : 'ff-line t-meta',
      id: 'f-foot',
      tabindex: '-1',
      'data-geo': 'f-foot',
    },
    h(
      'span',
      { class: 'ff-shown', 'aria-hidden': 'true' },
      h('span', { class: 'ff-head', text: parts.head }),
      rowSep(),
      h('span', { class: 'ff-item', text: parts.item }),
      ...(parts.when === undefined ? [] : [rowSep(), when]),
    ),
    said,
  );
  const undo = props.undo
    ? h('button', {
        class: 'undo',
        type: 'button',
        id: 'b-undo',
        'data-geo': 'f-undo',
        'aria-label': props.undo.name,
        text: T.undo,
        onclick: props.undo.onUndo,
      })
    : null;
  return {
    nodes: [
      h('span', { class: 'hair', 'data-geo': 'f-hair', 'aria-hidden': 'true' }),
      line,
      ...(undo ? [undo] : []),
    ],
    set(next) {
      const again = focusFootParts(next);
      if (again.when !== undefined && when.textContent !== again.when) {
        when.textContent = again.when;
      }
      if (said.textContent !== again.label) said.textContent = again.label;
    },
  };
}
