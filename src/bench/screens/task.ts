// A task's own page (design/lantern/SPEC.md sections 5.3 and 5.8; plan G12).
//
// Four forms, one page:
//
// - Unlit (3a, 3b): its title, the when pill, Start (or Start this instead,
//   with the sentence that says what it does to the running task), then its
//   steps as plain text on the rail and "+ Add a step". The capsule is on the
//   dock line when something else runs or is paused.
// - The running task's own page (8): lit charcoal on either places, with the
//   meta line, the bar row, the steps on the rail with the current one marked
//   Now, and the note in a dark field. The dock line holds "⌃ Focus".
// - Paused: page 8 with the bar frozen in ash, the minutes in white and no
//   end time, and Paused where Now was.
// - Done: a sage Done line and "Not done after all".
//
// What it is made of is fixed when it is built. The bar, the minutes, "7 min
// so far" and the when pill's "in 25 min" follow the clock and move in place.

import { T, say, startInsteadSentence } from '../strings';
import { backPill, meButton, type Built } from '../frame';
import { bar, composing, h, icon, patchBar, sep, spoken } from '../ui';
import { inDuration, clock24, duration } from '../format';
import { meter } from './focus';
import {
  estimateOf,
  whenSpoken,
  type PresentLive,
  type RailStep,
  type TaskPageView,
  type WhenPill,
} from '../view';
import type { Task } from '../../domains/tasks';

export interface TaskPageActions {
  onBack: () => void;
  onMe: () => void;
  onMore: () => void;
  onWhen: () => void;
  onStart: () => void;
  /** The "Add a step" field took focus, so it has the keyboard. */
  onStepFocus: () => void;
  onStepInput: (text: string) => void;
  /** Return in the field: the words become a step, and the field stays open. */
  onStepEnter: (text: string) => void;
  /** The field lost focus: it closes, and what it held is kept as a draft. */
  onStepLeave: (text: string) => void;
  onReopenStep: (stepId: string) => void;
  onNote: () => void;
  onNotDone: () => void;
}

export interface TaskPageProps {
  view: TaskPageView;
  task: Task;
  live: PresentLive | undefined;
  /** Where the back pill goes: the tab the page was pushed on. */
  back: string;
  /** "Add a step" open as a field, and what it holds. */
  field: { open: boolean; text: string };
  /** The page as it is at a tick, for the when pill's "in 25 min". */
  current: () => TaskPageView | undefined;
  actions: TaskPageActions;
}

export function taskScreen(props: TaskPageProps): Built {
  const { view, actions } = props;
  const header = h(
    'header',
    { class: 'hdr' },
    backPill(props.back, actions.onBack),
    h('span', { class: 'grow' }),
    h(
      'button',
      {
        class: 'circ',
        type: 'button',
        id: 'b-more',
        'aria-label': T.more,
        onclick: actions.onMore,
      },
      icon('more', 24),
    ),
    meButton(actions.onMe),
  );
  const title = h('h1', {
    class: 'ptitle t-idle',
    id: 'p-title',
    tabindex: '-1',
    'data-focus-home': true,
    'data-geo': 'p-title',
    text: view.title,
  });
  const lit = view.kind === 'running' || view.kind === 'paused';
  const built = lit && props.live ? litBody(props, props.live) : unlitBody(props);
  const body = h(
    'div',
    { class: `body page${lit ? ' lit' : ''}`, 'data-scroll-key': `task:${view.id}` },
    title,
    ...built.nodes,
  );
  return { nodes: [header, body], ...(built.patch ? { patch: built.patch } : {}) };
}

// ---------------------------------------------------------------- unlit

function unlitBody(props: TaskPageProps): Built {
  const { view, actions } = props;
  const nodes: Node[] = [];
  let patch: Built['patch'];
  if (view.kind === 'done') {
    nodes.push(
      h(
        'p',
        { class: 'doneline t-control' },
        h('span', { class: 'disc-static', 'aria-hidden': 'true' }, icon('check-s', 16)),
        T.done,
      ),
      h('button', {
        class: 'pill quiet p44 notdone',
        type: 'button',
        id: 'p-notdone',
        text: T.notDoneAfterAll,
        onclick: actions.onNotDone,
      }),
    );
  } else {
    const pill = whenButton(view.when, props.task, actions.onWhen);
    nodes.push(pill.el);
    patch = () => {
      const again = props.current();
      if (again) pill.set(again.when);
    };
    const instead = view.instead;
    nodes.push(
      h(
        'button',
        {
          class: instead ? 'pill pad start instead' : 'pill pad start first',
          type: 'button',
          id: 'p-start',
          'data-geo': 'p-start',
          'aria-describedby': instead ? 'p-instead' : undefined,
          onclick: actions.onStart,
        },
        icon('play', 20),
        instead ? T.startInstead : T.start,
      ),
    );
    if (instead) {
      // Its hint, in SPEC 11's words, then the sentence under it, which is
      // read in its place too (SPEC 11, list 3). The hint is hidden, so it is
      // read only as the button's hint, not again as text where it stands.
      nodes.push(
        h('span', {
          hidden: true,
          id: 'p-instead',
          text: say.startInsteadHint(instead.title, instead.step),
        }),
        h('p', {
          class: 'sentence t-meta',
          text: startInsteadSentence(instead.title, instead.step),
        }),
      );
    }
  }
  // Steps heads what is under it: the steps, or Add a step. A done task
  // with none has nothing to head, so it has no heading.
  const offer = view.kind !== 'done';
  if (view.steps.length > 0 || offer) {
    nodes.push(h('h2', { class: 'lbl t-label steps-lbl', text: T.steps }));
  }
  if (view.steps.length > 0) nodes.push(plainRail(view.steps));
  if (offer) nodes.push(addStep(props));
  return { nodes, ...(patch ? { patch } : {}) };
}

/**
 * The when pill (SPEC 5.3), drawn as a field: the day and time, then how long
 * and how soon in the quieter ink, as one object. A tap opens the when sheet.
 */
function whenButton(
  pill: WhenPill,
  task: Task,
  onWhen: () => void,
): { el: HTMLElement; set(pill: WhenPill): void } {
  const soon = h('span', {
    class: 'wsoon',
    text: pill.soon === undefined ? '' : inDuration(pill.soon),
  });
  const el = h(
    'button',
    {
      class: 'when',
      type: 'button',
      id: 'p-when',
      'data-geo': 'p-when',
      'aria-label': whenSpoken(task, pill),
      onclick: onWhen,
    },
    // Word spaces between the parts for whatever reads the text: the pill is
    // a flex row with its own 8 pt gaps, which draws none of them.
    icon('cal', 18),
    h('span', { class: 'wday', text: pill.day }),
    ...(pill.length === undefined
      ? []
      : [
          ' ',
          h('span', { class: 'wdot', text: '·' }),
          ' ',
          h('span', { class: 'wlen', text: pill.length }),
        ]),
    ...(pill.soon === undefined ? [] : [' ', h('span', { class: 'wdot', text: '·' }), ' ', soon]),
  );
  return {
    el,
    set(next) {
      if (next.soon !== undefined && soon.textContent !== inDuration(next.soon)) {
        soon.textContent = inDuration(next.soon);
      }
      const label = whenSpoken(task, next);
      if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
    },
  };
}

/**
 * The steps as plain text on the rail, on a page that is not lit (plan
 * G12): no Now, and nothing to tap, so the page keeps to its five choices.
 * Done ones carry their check.
 */
function plainRail(steps: readonly RailStep[]): HTMLElement {
  return h(
    'ol',
    { class: 'rail plain' },
    ...steps.map((step) =>
      h(
        'li',
        { class: step.done ? 'done' : '' },
        h(
          'span',
          { class: step.done ? 'mk done' : 'mk next', 'aria-hidden': 'true' },
          step.done ? icon('check-s', 16) : String(step.number),
        ),
        h('span', { class: 's', 'aria-hidden': 'true', text: step.title }),
        h('p', {
          class: 'vh',
          text: step.done
            ? say.railDone(step.number, step.title)
            : say.railStep(step.number, step.title),
        }),
      ),
    ),
  );
}

/**
 * "+ Add a step" (SPEC 5.3), which turns in place into a one-line field: in
 * the same tap, so iOS raises the keyboard. Return adds the step and keeps
 * the field open; leaving it closes it, and what it held is kept as a draft,
 * shown in the field until it is used. The keyboard takes it without moving
 * the frame: the dock line, the drawer and the tabs stay behind the keys,
 * and only the content scrolls (SPEC 3). The swap is made here, not by a
 * rebuild, so a tap that ends the field is never lost to one.
 */
function addStep(props: TaskPageProps): HTMLElement {
  const { actions } = props;
  const open = props.field.open;
  const field = h('input', {
    class: 'stepfield',
    id: 'p-stepfield',
    type: 'text',
    'data-field': true,
    'aria-label': T.addStep,
    placeholder: T.addStep,
    enterkeyhint: 'enter',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    value: props.field.text,
  }) as HTMLInputElement;
  const row = h('div', { class: 'addstep field', hidden: !open }, icon('plus', 20), field);
  const button = h(
    'button',
    {
      class: 'addstep',
      type: 'button',
      id: 'p-addstep',
      'data-geo': 'p-addstep',
      hidden: open,
      onclick: () => {
        button.hidden = true;
        row.hidden = false;
        field.focus({ preventScroll: true });
      },
    },
    icon('plus', 20),
    T.addStep,
  );
  field.addEventListener('focus', () => actions.onStepFocus());
  field.addEventListener('input', () => actions.onStepInput(field.value));
  field.addEventListener('keydown', (event) => {
    if (composing(event)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      actions.onStepEnter(field.value);
    } else if (event.key === 'Escape') {
      // The field lets go of the key, and focus goes somewhere the person can
      // carry on from, never to the page: Add a step, when the field is
      // empty and closes, otherwise the page's title, the words kept below it.
      event.preventDefault();
      if (field.value.trim() === '') {
        button.hidden = false;
        button.focus({ preventScroll: true });
      } else {
        const home = field.closest('.screen')?.querySelector<HTMLElement>('[data-focus-home]');
        if (home) home.focus({ preventScroll: true });
        else field.blur();
      }
    }
  });
  field.addEventListener('blur', () => {
    const text = field.value;
    if (text.trim() === '') {
      row.hidden = true;
      button.hidden = false;
    }
    actions.onStepLeave(text);
  });
  return h('div', { class: 'addstep-wrap' }, button, row);
}

// ---------------------------------------------------------------- lit

/**
 * The running task's own page (SPEC 5.8), and paused, the same with the bar
 * still (plan G12). Its meta line, its bar row, the steps on the rail with the
 * current one marked, and the note in a dark field that opens the note sheet.
 */
function litBody(props: TaskPageProps, live: PresentLive): Built {
  const { view, actions } = props;
  const paused = view.kind === 'paused';
  const estimate = estimateOf(props.task);

  // "Today · 25 min estimate · 7 min so far", read as SPEC 11 writes it.
  const soFar = h('span', { text: `${duration(live.facts.soFar)} ${T.soFar}` });
  const dayPart = view.when.day;
  const metaShown = h(
    'span',
    { 'aria-hidden': 'true' },
    h('b', { text: dayPart }),
    ...(estimate === undefined ? [] : [' ', sep(), ' ', `${duration(estimate)} ${T.estimate}`]),
    ' ',
    sep(),
    ' ',
    soFar,
  );
  const metaSaid = spoken(say.pageMeta(dayPart, estimate, live.facts.soFar));
  const meta = h('p', { class: 'tmeta', 'data-geo': 'p-meta' }, metaShown, metaSaid);

  const theBar = bar('page', live.bar);
  theBar.removeAttribute('aria-hidden');
  meter(theBar, live.spoken.minutes);
  const main = h('strong', {});
  const ends = h('span', { class: 'e' });
  const setMinutes = (next: PresentLive) => {
    if (main.textContent !== next.words.main) main.textContent = next.words.main;
    const tone = next.words.tone === 'still' ? 'still' : '';
    if (main.className !== tone) main.className = tone;
    const end = !paused && next.facts.endsAt ? `ends ${clock24(next.facts.endsAt)}` : '';
    if (ends.textContent !== end) ends.textContent = end;
    ends.hidden = end === '';
  };
  setMinutes(live);
  const timeRow = h(
    'div',
    { class: 'timerow', 'data-geo': 'p-timerow' },
    theBar,
    h('span', { class: 'tmins', 'aria-hidden': 'true' }, main, ' ', ends),
  );

  const rail = litRail(view, paused, actions);
  const note = view.note
    ? h(
        'button',
        {
          class: 'notecard',
          type: 'button',
          id: 'p-note',
          'data-geo': 'p-note',
          'aria-label': say.noteField(view.note),
          onclick: actions.onNote,
        },
        h('span', { class: 'nl t-label', 'aria-hidden': 'true' }, icon('note', 16), T.note),
        ' ',
        h('span', { class: 'nt', 'aria-hidden': 'true', text: view.note }),
      )
    : null;

  return {
    nodes: [meta, timeRow, ...(rail ? [rail] : []), ...(note ? [note] : [])],
    patch(next) {
      if (!next) return;
      patchBar(theBar, 'page', next.bar);
      meter(theBar, next.spoken.minutes);
      setMinutes(next);
      const words = `${duration(next.facts.soFar)} ${T.soFar}`;
      if (soFar.textContent !== words) soFar.textContent = words;
      const said = say.pageMeta(dayPart, estimate, next.facts.soFar);
      if (metaSaid.textContent !== said) metaSaid.textContent = said;
    },
  };
}

/**
 * The steps on an even rail (SPEC 5.8): every row 58 tall, a 2 pt line
 * through the discs. A done step's disc is a button that un-ticks it; the
 * current step is a white disc with its number and the step in white, then
 * Now; steps to come are charcoal discs. Paused, the current step says
 * Paused where Now was, with no dot (undrawn: a proposal).
 */
function litRail(
  view: TaskPageView,
  paused: boolean,
  actions: TaskPageActions,
): HTMLElement | null {
  if (view.steps.length === 0) return null;
  const lead = paused ? T.paused : T.now;
  return h(
    'ol',
    { class: 'rail', 'data-list': true, 'data-geo': 'p-rail' },
    ...view.steps.map((step) => {
      if (step.done) {
        return h(
          'li',
          { class: 'done' },
          h(
            'button',
            {
              class: 'hit',
              type: 'button',
              id: `p-step-${step.id}`,
              'aria-label': say.undoStepDone(step.title),
              onclick: () => actions.onReopenStep(step.id),
            },
            h('span', { class: 'mk done' }, icon('check-s', 16)),
          ),
          h('span', { class: 's', 'aria-hidden': 'true', text: step.title }),
        );
      }
      if (step.current) {
        return h(
          'li',
          { class: 'current', 'aria-current': 'step' },
          h('span', { class: 'mk cur', 'aria-hidden': 'true', text: String(step.number) }),
          h(
            'span',
            { class: 's', 'aria-hidden': 'true' },
            h('span', { class: 'st', text: step.title }),
            ' ',
            h('span', { class: paused ? 'ptag' : 'nowtag', text: lead }),
          ),
          h('p', { class: 'vh', text: say.railStep(step.number, step.title, lead) }),
        );
      }
      return h(
        'li',
        {},
        h('span', { class: 'mk next', 'aria-hidden': 'true', text: String(step.number) }),
        h('span', { class: 's', 'aria-hidden': 'true', text: step.title }),
        h('p', { class: 'vh', text: say.railStep(step.number, step.title) }),
      );
    }),
  );
}
