// The frame every screen shares (design/lantern/SPEC.md section 3): the header
// row, the dock line, the drawer at rest and the tabs. Each builder returns its
// nodes and, where something on it changes by the second, a patch the ticker
// calls in place of a rebuild.

import type { Tab } from './state';
import { HINT, SAY, T, say } from './strings';
import { capsule } from './capsule';
import { durationTrack, h, icon } from './ui';
import type { DayList, PresentLive, PresentView } from './view';
import type { IconName } from './icons';

/** What a builder hands back: its nodes, and a patch for the live parts. */
export interface Built {
  nodes: Node[];
  patch?: (live: PresentLive | undefined) => void;
}

/** The hints, written once and pointed at by aria-describedby (SPEC 11). */
export const HINT_IDS = {
  opensFocus: 'hint-opens-focus',
  capture: 'hint-capture',
  rest: 'hint-rest',
  me: 'hint-me',
  inbox: 'hint-inbox',
} as const;

export function hints(): HTMLElement {
  return h(
    'div',
    { hidden: true },
    h('span', { id: HINT_IDS.opensFocus, text: HINT.opensFocus }),
    h('span', { id: HINT_IDS.capture, text: HINT.capture }),
    h('span', { id: HINT_IDS.rest, text: HINT.showsRestOfToday }),
    h('span', { id: HINT_IDS.me, text: HINT.me }),
    h('span', { id: HINT_IDS.inbox, text: HINT.opensNewest }),
  );
}

// ---------------------------------------------------------------- header

/** Me, at the right of the header row on every screen: two taps from help. */
export function meButton(onMe: () => void): HTMLElement {
  return h('button', {
    class: 'me',
    type: 'button',
    id: 'b-me',
    'data-geo': 'me',
    'aria-describedby': HINT_IDS.me,
    text: SAY.me,
    onclick: onMe,
  });
}

/** A back pill naming where it goes: "‹ Today". */
export function backPill(to: string, onBack: () => void): HTMLElement {
  return h(
    'button',
    {
      class: 'hpill',
      type: 'button',
      id: 'b-back',
      'aria-label': say.backTo(to),
      onclick: onBack,
    },
    icon('back', 20),
    to,
  );
}

// ---------------------------------------------------------------- the dock line

export interface DockProps {
  /** Today's own buttons while something runs or is paused. */
  present?: {
    /** Whose buttons these are: a rebuild follows a change of task. */
    taskId: string;
    paused: boolean;
    /** The step's name, or the task's when it has none to show. */
    step: string;
    /** Step done reads Done on the last step, and for a task with no steps. */
    isLast: boolean;
    onStepDone: () => void;
    onPause: () => void;
    onResume: () => void;
  };
  /** The capsule, on a place or a page. */
  capsule?: {
    view: PresentView;
    live: PresentLive;
    look: 'lifted' | 'plain';
    mode: 'button' | 'picture';
    onOpen: () => void;
  };
  /** Capture sits on light: the half drawer under it, or a white place. */
  captureOnLight: boolean;
  draftKept: boolean;
  onCapture: () => void;
}

export function dock(props: DockProps): Built {
  const nodes: Node[] = [];
  let patch: Built['patch'];

  if (props.present) {
    const { paused, step, isLast } = props.present;
    const word = isLast ? T.done : T.stepDone;
    nodes.push(
      h(
        'button',
        {
          class: `pill dock-pill stepdone ${paused ? 'ash' : 'white'}`,
          type: 'button',
          id: 'b-stepdone',
          'aria-label': isLast ? `${T.done}: ${step}` : say.stepDone(step),
          onclick: props.present.onStepDone,
        },
        icon('check', 20),
        word,
      ),
      paused
        ? h(
            'button',
            {
              class: 'pill dock-pill pause resume white',
              type: 'button',
              id: 'b-resume',
              onclick: props.present.onResume,
            },
            icon('play', 20),
            T.resume,
          )
        : h(
            'button',
            {
              class: 'pill dock-pill pause ash',
              type: 'button',
              id: 'b-pause',
              onclick: props.present.onPause,
            },
            icon('pause', 20),
            T.pause,
          ),
    );
  } else if (props.capsule) {
    const built = capsule({
      ...props.capsule,
      hintId: HINT_IDS.opensFocus,
    });
    nodes.push(built.el);
    patch = (live) => {
      if (live) built.patch(live);
    };
  }

  nodes.push(
    h(
      'button',
      {
        class: props.captureOnLight ? 'capture on-light' : 'capture',
        type: 'button',
        id: 'b-capture',
        'data-geo': 'capture',
        'aria-label': props.draftKept ? SAY.captureDraftKept : SAY.capture,
        'aria-describedby': HINT_IDS.capture,
        onclick: props.onCapture,
      },
      icon('plus', 28),
    ),
  );
  return { nodes, ...(patch ? { patch } : {}) };
}

// ---------------------------------------------------------------- the drawer at rest

/** The folded handle's two lines (SPEC 9.8), as handleLines and handleLabel give them. */
export interface FoldedProps {
  section: string;
  when: string | undefined;
  time: string | undefined;
  title: string;
  label: string;
  onOpen: () => void;
}

export function foldedDrawer(props: FoldedProps): Node[] {
  const line1 = h(
    'span',
    { class: 'h-l1 t-label' },
    h('span', { class: 'h-sec', text: props.section }),
    ...(props.when === undefined
      ? []
      : [
          ' ',
          h('span', { class: 'sep', text: '·' }),
          ' ',
          h('span', { class: 'h-when', text: props.when }),
        ]),
  );
  const line2 = h(
    'span',
    { class: 'h-l2' },
    props.time === undefined ? null : h('span', { class: 'h-time', text: props.time }),
    h('span', { class: 'h-title', text: props.title }),
  );
  const more = h(
    'span',
    { class: 'h-more t-label' },
    h('span', { class: 'h-more-words', text: T.restOfToday }),
    icon('up', 20),
  );
  const handle = h(
    'button',
    {
      class: 'handle folded',
      type: 'button',
      id: 'b-handle',
      'aria-label': props.label,
      'aria-describedby': HINT_IDS.rest,
      onclick: props.onOpen,
    },
    line1,
    line2,
    more,
  );
  for (const part of [line1, line2, more]) part.setAttribute('aria-hidden', 'true');
  return [h('span', { class: 'grab', 'aria-hidden': 'true' }), handle];
}

export interface HalfProps {
  list: DayList;
  onOpen: () => void;
  onRow: (id: string) => void;
  onTick: (id: string) => void;
  onUntick: (id: string) => void;
}

/**
 * The half drawer (SPEC 5.7): its handle names the drawer, then Later today and
 * Anytime today, ending on a covered row above the tabs. Titles beside capture
 * wrap to end by x 286, so none is cut or faded beside the disc.
 */
export function halfDrawer(props: HalfProps): Node[] {
  const handle = h(
    'button',
    {
      class: 'handle half',
      type: 'button',
      id: 'b-handle',
      'aria-label': SAY.handleHalf,
      'aria-describedby': HINT_IDS.rest,
      onclick: props.onOpen,
    },
    h(
      'span',
      { class: 'h-row t-control', 'aria-hidden': 'true' },
      h('span', { text: T.restOfToday }),
      icon('up', 20),
    ),
  );
  const list = h('div', { class: 'list', 'data-scroll-key': 'half' }, ...dayListNodes(props, true));
  return [
    h('span', { class: 'grab', 'aria-hidden': 'true' }),
    handle,
    h('div', { class: 'viewport' }, list, h('span', { class: 'covered', 'aria-hidden': 'true' })),
  ];
}

/** The day's list: Later today, Anytime today, and Done today when it is on. */
export function dayListNodes(
  props: Pick<HalfProps, 'list' | 'onRow' | 'onTick' | 'onUntick'>,
  lane: boolean,
): Node[] {
  const { list } = props;
  const nodes: Node[] = [];
  if (list.later.length > 0) {
    nodes.push(
      h('h2', { class: 'lbl t-label', text: T.laterToday }),
      h(
        'ul',
        {},
        ...list.later.map((row) =>
          h(
            'li',
            { class: 'row trow', 'data-row': true },
            h(
              'button',
              {
                class: 'rowbtn',
                type: 'button',
                id: `r-${row.id}`,
                onclick: () => props.onRow(row.id),
              },
              h('span', { class: 't', text: row.time }),
              h(
                'span',
                { class: 'ti' },
                row.title,
                row.inLine === undefined ? null : h('small', { text: row.inLine }),
              ),
              durationTrack(row.minutes, row.length, list.slot),
            ),
          ),
        ),
      ),
    );
  }
  if (list.anytime.length > 0) {
    nodes.push(
      h('h2', { class: 'lbl t-label', text: T.anytimeToday }),
      h(
        'ul',
        {},
        ...list.anytime.map((row) =>
          h(
            'li',
            {
              class: `row rrow${lane ? ' lane' : ''}${row.ticked ? ' done' : ''}`,
              'data-row': true,
            },
            row.ticked
              ? h(
                  'button',
                  {
                    class: 'disc',
                    type: 'button',
                    id: `d-${row.id}`,
                    'aria-label': say.undoDone(row.title),
                    onclick: () => props.onUntick(row.id),
                  },
                  h('span', {}, icon('check-s', 16)),
                )
              : h(
                  'button',
                  {
                    class: 'ring',
                    type: 'button',
                    id: `k-${row.id}`,
                    'aria-label': say.markDone(row.title),
                    onclick: () => props.onTick(row.id),
                  },
                  icon('ring', 24),
                ),
            h(
              'button',
              {
                class: 'rowbtn',
                type: 'button',
                id: `r-${row.id}`,
                onclick: () => props.onRow(row.id),
              },
              h('span', { class: 'rt', text: row.title }),
            ),
          ),
        ),
      ),
    );
  }
  if (list.done && list.done.length > 0) {
    nodes.push(
      h('h2', { class: 'lbl t-label', text: T.doneToday }),
      h(
        'ul',
        {},
        ...list.done.map((row) =>
          h(
            'li',
            { class: 'row donerow', 'data-row': true, 'aria-label': say.doneRow(row.title) },
            h('span', { class: 'disc-static', 'aria-hidden': 'true' }, icon('check-s', 16)),
            h('span', { 'aria-hidden': 'true', text: row.title }),
          ),
        ),
      ),
    );
  }
  return nodes;
}

// ---------------------------------------------------------------- the tabs

const TABS: readonly { tab: Tab; name: string; glyph: IconName }[] = [
  { tab: 'today', name: T.today, glyph: 'today' },
  { tab: 'tasks', name: T.tasks, glyph: 'tasks' },
  { tab: 'routines', name: T.routines, glyph: 'routines' },
  { tab: 'library', name: T.library, glyph: 'library' },
];

/** Four equal tabs on stone. The current one: a white lozenge, a filled glyph, 700. */
export function tabs(current: Tab, onTab: (tab: Tab) => void): Node[] {
  return [
    h('span', { class: 'hair', 'data-geo': 'hair', 'aria-hidden': 'true' }),
    h(
      'nav',
      { 'aria-label': 'Main', 'data-geo': 'tabs' },
      ...TABS.map(({ tab, name, glyph }) =>
        h(
          'button',
          {
            class: 'tab',
            type: 'button',
            id: `t-${tab}`,
            'aria-current': tab === current ? 'page' : undefined,
            onclick: () => onTab(tab),
          },
          icon(tab === current ? (`${glyph}-f` as IconName) : glyph, 24),
          name,
        ),
      ),
    ),
  ];
}
