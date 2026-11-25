// Today (design/lantern/SPEC.md sections 5.1, 5.7, 5.7b and 5.7c): the canvas
// above the dock line, in every state.
//
// - Running: the lantern, bottom-aligned at y 550, growing upward.
// - Paused: the same lantern with Paused in words, the bar frozen in ash, the
//   minutes in white with no end time, and Set aside beside the minutes.
// - Nothing running: "Nothing running" first, in white, then the first item
//   lit a size smaller, and Start; the rest of today rests half open beneath.
// - Nothing planned: one plain sentence, one line, and Open the inbox.
//
// The lantern's falloff sits behind every one of them (screen.today in
// bench.css); the screen tells it where the block stands.

import { T, litLabel, say } from '../strings';
import { HINT_IDS, meButton, type Built } from '../frame';
import { bar, dottedNodes, h, icon, patchBar, sep, spoken } from '../ui';
import type { IdleView, PresentLive, PresentView, TodayView } from '../view';

export interface TodayActions {
  onMe: () => void;
  onFocus: () => void;
  onSetAside: (id: string) => void;
  onOpenTask: (id: string) => void;
  onStart: (id: string) => void;
  onOpenInbox: () => void;
}

/** Where the falloff is centred: on the lit block, the unlit one, or the sentence. */
export const lampOf = (view: TodayView): 'lit' | 'idle' | 'planned' =>
  view.kind === 'lit' ? 'lit' : view.kind;

export function todayScreen(
  view: TodayView,
  live: PresentLive | undefined,
  actions: TodayActions,
): Built {
  const header = h(
    'header',
    { class: 'hdr' },
    h('p', { class: 'date t-meta', text: view.date }),
    meButton(actions.onMe),
  );
  switch (view.kind) {
    case 'lit': {
      const built = lantern(view.present, live!, actions);
      return { nodes: [header, ...built.nodes], ...(built.patch ? { patch: built.patch } : {}) };
    }
    case 'idle':
      return { nodes: [header, idleBlock(view.idle, actions)] };
    case 'planned':
      return { nodes: [header, planned(view.heading, actions)] };
  }
}

// ---------------------------------------------------------------- the lantern

function nowLine(view: PresentView): HTMLElement {
  const paused = view.kind === 'paused';
  const position = view.position
    ? [' ', sep(), ` step ${view.position.number} of ${view.position.count}`]
    : [];
  const label = h('span', { class: 'flabel' }, T.focus, icon('right', 20));
  return paused
    ? h(
        'span',
        { class: 'nowline paused' },
        icon('pause', 16),
        h('b', { text: view.lead }),
        ...position,
        label,
      )
    : h(
        'span',
        { class: 'nowline' },
        h('span', { class: 'nowtag', text: T.now }),
        ...position,
        label,
      );
}

function minutesRow(live: PresentLive): { row: HTMLElement; set(live: PresentLive): void } {
  const main = h('strong', { class: 't-min' });
  const rest = h('span', { class: 'rest t-meta' });
  const row = h('span', { class: 'mins' }, main, rest);
  const set = (next: PresentLive) => {
    if (main.textContent !== next.words.main) main.textContent = next.words.main;
    main.className = next.words.tone === 'still' ? 't-min still' : 't-min';
    const words = next.words.rest ?? '';
    if (rest.dataset['words'] !== words) {
      rest.dataset['words'] = words;
      rest.replaceChildren(...dottedNodes(words));
      rest.hidden = words === '';
    }
  };
  set(live);
  return { row, set };
}

function lantern(view: PresentView, live: PresentLive, actions: TodayActions): Built {
  const paused = view.kind === 'paused';
  const theBar = bar('today', live.bar);
  theBar.setAttribute('data-geo', 'bar');
  const minutes = minutesRow(live);
  const hasStep = view.steps.current !== undefined;

  const parts: (HTMLElement | null)[] = [
    nowLine(view),
    hasStep ? h('span', { class: 'ttl t-context', text: view.task.title }) : null,
    h('span', { class: 'step t-step', 'data-geo': 'step', text: view.step }),
    theBar,
    minutes.row,
    view.note
      ? h(
          'span',
          { class: 'note t-meta' },
          icon('note', 18),
          h('span', {}, h('b', { text: T.note }), '\u2002', view.note),
        )
      : null,
  ];
  // The block is one button; what it shows is read through its own label.
  const block = h(
    'button',
    {
      class: 'lit-block',
      type: 'button',
      id: 'b-lit',
      'aria-label': litLabel(live.spoken),
      'aria-describedby': HINT_IDS.opensFocus,
      onclick: actions.onFocus,
    },
    parts,
  );
  for (const child of block.children) child.setAttribute('aria-hidden', 'true');

  const wrapper = h(
    'div',
    { class: paused ? 'lantern paused' : 'lantern', 'data-geo': 'lit' },
    block,
  );
  if (paused) {
    // Set aside is centred on the minutes row: 34 above the block's foot when
    // the note is under it, 8 below when the minutes end the block.
    wrapper.style.setProperty('--aside-b', view.note ? '34px' : '-8px');
    wrapper.append(
      h('button', {
        class: 'pill ash p44 aside',
        type: 'button',
        id: 'b-aside',
        'data-geo': 'aside',
        'aria-label': say.setAside(view.task.title, view.position?.number),
        text: T.setAside,
        onclick: () => actions.onSetAside(view.task.id),
      }),
    );
  }

  return {
    nodes: [wrapper],
    patch(next) {
      if (!next) return;
      patchBar(theBar, 'today', next.bar);
      minutes.set(next);
      const label = litLabel(next.spoken);
      if (block.getAttribute('aria-label') !== label) block.setAttribute('aria-label', label);
    },
  };
}

// ---------------------------------------------------------------- nothing running

function idleBlock(idle: IdleView, actions: TodayActions): HTMLElement {
  const status = h(
    'p',
    { class: 'idle-status', 'data-geo': 'status' },
    h(
      'span',
      { 'aria-hidden': 'true' },
      h('b', { text: T.nothingRunning }),
      ...(idle.status === undefined ? [] : [' ', sep(), ' ', idle.status]),
    ),
    spoken(idle.statusSpoken),
  );
  const block = h(
    'button',
    {
      class: 'idle-block',
      type: 'button',
      id: 'b-idle',
      'data-geo': 'idle-block',
      'data-half-anchor': idle.start ? undefined : true,
      'aria-label': idle.blockLabel,
      onclick: () => actions.onOpenTask(idle.taskId),
    },
    idle.label === undefined ? null : h('span', { class: 'label t-meta', text: idle.label }),
    h('span', { class: 'sentence t-idle', text: idle.sentence }),
    idle.startsWith === undefined
      ? null
      : h('span', { class: 'after t-row' }, h('b', { text: T.startsWith }), ' ', idle.startsWith),
    idle.meta === undefined ? null : h('span', { class: 'meta t-meta' }, ...dottedNodes(idle.meta)),
    idle.under === undefined ? null : h('span', { class: 'under t-row', text: idle.under }),
  );
  for (const child of block.children) child.setAttribute('aria-hidden', 'true');

  return h(
    'div',
    { class: 'idle' },
    status,
    block,
    idle.start
      ? h(
          'button',
          {
            class: 'pill white start',
            type: 'button',
            id: 'b-start',
            'data-geo': 'start',
            'data-half-anchor': true,
            onclick: () => actions.onStart(idle.taskId),
          },
          icon('play', 20),
          T.start,
        )
      : null,
  );
}

// ---------------------------------------------------------------- nothing planned

function planned(heading: string, actions: TodayActions): HTMLElement {
  return h(
    'div',
    { class: 'planned', 'data-geo': 'planned' },
    h('h1', { class: 't-idle', 'data-geo': 'planned-heading', text: heading }),
    h('p', { class: 't-row', 'data-geo': 'planned-line', text: T.inboxHelp }),
    h('button', {
      class: 'pill white pad',
      type: 'button',
      id: 'b-open-inbox',
      'data-geo': 'open-inbox',
      'aria-describedby': HINT_IDS.inbox,
      text: T.openInbox,
      onclick: actions.onOpenInbox,
    }),
  );
}
