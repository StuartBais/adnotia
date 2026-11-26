// Tasks (design/lantern/SPEC.md section 5.6): one place, four lists.
//
// From the top: "Tasks" and Me in the header row; the switcher, sized to its
// words, held still above the list so a long inbox never scrolls it away;
// then the chosen list under its helper line.
//
// - Inbox: anything with no date, in the order it came in. It opens at its
//   newest end (the app scrolls it there), and Save leaves it where it was.
// - Today: the drawer's own list, the present in it carrying its Now tag, and
//   what got done today under Done.
// - Coming up and Done, which the board does not draw (plan G11): Coming up
//   grouped by day under muted labels, Done newest first, each a disc that
//   un-ticks it.
//
// No count anywhere, no badge, nothing that says how long anything waited,
// and no swipe actions. A row opens its task; a ring marks it done, and the
// ticked row stays where it was, its disc the way back, until the list is
// next opened.

import { duration, durationSpoken } from '../format';
import { T, say } from '../strings';
import { dayListNodes, meButton, type Built } from '../frame';
import { durationTrack, h, icon, sep } from '../ui';
import type { TaskList } from '../state';
import type { TaskRow, TasksView } from '../view';

export interface TasksActions {
  onMe: () => void;
  onList: (list: TaskList) => void;
  onRow: (id: string) => void;
  onTick: (id: string) => void;
  onUntick: (id: string) => void;
}

/** The four lists, in the switcher's order. */
export const LISTS: readonly { list: TaskList; text: string }[] = [
  { list: 'inbox', text: T.inbox },
  { list: 'today', text: T.today },
  { list: 'coming', text: T.comingUp },
  { list: 'done', text: T.done },
];

/** The scroller of each list: a key of its own, so each keeps its own place. */
export const listScrollKey = (list: TaskList): string => `tasks-${list}`;

/**
 * `current` gives the list as it is at a tick: the next timed row's "in 25
 * min" in Today moves in place, rather than the list being rebuilt under a
 * screen reader's cursor.
 */
export function tasksScreen(
  view: TasksView,
  actions: TasksActions,
  current?: () => TasksView,
): Built {
  const header = h(
    'header',
    { class: 'hdr' },
    h('h1', { class: 'place-title t-place', text: T.tasks }),
    meButton(actions.onMe),
  );
  const body = h(
    'div',
    {
      class: 'body tasks',
      id: 'l-panel',
      role: 'tabpanel',
      'aria-labelledby': `l-${view.list}`,
      'data-scroll-key': listScrollKey(view.list),
    },
    ...listNodes(view, actions),
  );
  return {
    nodes: [header, switcher(view.list, actions.onList), body],
    patch() {
      const again = current?.();
      if (again?.list !== 'today') return;
      for (const row of again.day.later) {
        const button = body.querySelector<HTMLElement>(`[id="r-${row.id}"]`);
        if (!button) continue;
        const label = row.tag === undefined ? row.label : say.presentRow(row.tag, row.label);
        if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
        const small = button.querySelector('small');
        if (small && row.inLine !== undefined && small.textContent !== row.inLine) {
          small.textContent = row.inLine;
        }
      }
    },
  };
}

/**
 * The switcher (SPEC 9.6): a tab list, so it reads "Inbox, selected, 1 of 4".
 * Each part is its word at 700 with the same room either side, which the
 * stylesheet gives by sharing what is left of the track equally; the thumb
 * and the weight say which is chosen, never the fill alone. The arrow keys
 * move along it and choose as they go.
 */
function switcher(current: TaskList, onList: (list: TaskList) => void): HTMLElement {
  const group = h(
    'div',
    { class: 'tswitch', role: 'tablist', 'aria-label': T.tasks, 'data-geo': 'switcher' },
    ...LISTS.map(({ list, text }) =>
      h(
        'button',
        {
          class: 'tswitch-part',
          type: 'button',
          role: 'tab',
          id: `l-${list}`,
          'aria-selected': list === current ? 'true' : 'false',
          'aria-controls': 'l-panel',
          tabindex: list === current ? '0' : '-1',
          onclick: () => {
            if (list !== current) onList(list);
          },
        },
        h('span', { 'data-text': text, text }),
      ),
    ),
  );
  const STEP: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -99, End: 99 };
  group.addEventListener('keydown', (event) => {
    const step = STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const at = LISTS.findIndex((item) => item.list === current);
    const to =
      Math.abs(step) > 1
        ? step < 0
          ? 0
          : LISTS.length - 1
        : (at + step + LISTS.length) % LISTS.length;
    const next = LISTS[to];
    if (!next || next.list === current) return;
    onList(next.list);
    group.ownerDocument.getElementById(`l-${next.list}`)?.focus();
  });
  return group;
}

const HELP: Record<TaskList, string> = {
  inbox: T.inboxWaits,
  today: '',
  coming: T.comingUpHelp,
  done: T.doneHelp,
};

function listNodes(view: TasksView, actions: TasksActions): Node[] {
  const help = view.list === 'today' ? (view.empty ? `${T.nothingPlanned}.` : '') : HELP[view.list];
  const nodes: Node[] = help ? [h('p', { class: 'helper t-meta', text: help })] : [];
  const rows = (items: readonly TaskRow[]) =>
    h('ul', {}, ...items.map((row) => taskRow(row, actions)));
  switch (view.list) {
    case 'inbox':
    case 'done':
      if (view.rows.length > 0) {
        nodes.push(h('div', { class: 'tlist', 'data-list': true }, rows(view.rows)));
      }
      break;
    case 'coming':
      if (view.groups.length > 0) {
        nodes.push(
          h(
            'div',
            { class: 'tlist', 'data-list': true },
            ...view.groups.flatMap((group) => [
              h('h2', { class: 'lbl t-label', text: group.label }),
              rows(group.rows),
            ]),
          ),
        );
      }
      break;
    case 'today':
      if (!view.empty) {
        nodes.push(
          h(
            'div',
            { class: 'tlist', 'data-list': true },
            ...dayListNodes(
              {
                list: view.day,
                onRow: actions.onRow,
                onTick: actions.onTick,
                onUntick: actions.onUntick,
              },
              false,
              T.done,
            ),
          ),
        );
      }
      break;
  }
  return nodes;
}

/** "Look into swimming lessons, 3 steps, 30 minutes". */
function rowLabel(row: TaskRow): string {
  return [
    row.title,
    row.time,
    row.steps,
    row.minutes === undefined ? undefined : durationSpoken(row.minutes),
    row.note === undefined ? undefined : `${T.note}: ${row.note}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * A row (SPEC 9.7): 44 for one line, 62 for two, the ring centred on the
 * title line. The second line, in muted (ash on charcoal): the time in
 * Coming up, the steps still to do, the minutes with their track, or with
 * none of those the start of the note after its glyph. Never when it was
 * added, never how long it has waited.
 */
function taskRow(row: TaskRow, actions: TasksActions): HTMLElement {
  const parts: (Node | string)[] = [];
  // Word spaces either side of each "·" for whatever reads the text; the row
  // is a flex line, which draws none of them.
  const add = (node: Node | string) => {
    if (parts.length > 0) parts.push(' ', sep(), ' ');
    parts.push(node);
  };
  if (row.time !== undefined) add(row.time);
  if (row.steps !== undefined) add(row.steps);
  if (row.minutes !== undefined) add(durationTrack(row.minutes, duration(row.minutes)));
  if (row.note !== undefined) {
    parts.push(icon('note', 12), ' ', h('span', { class: 'nt', text: row.note }));
  }
  const second = parts.length > 0 ? h('small', { 'aria-hidden': 'true' }, ...parts) : null;
  return h(
    'li',
    { class: `row rrow${second ? ' two' : ''}${row.done ? ' done' : ''}`, 'data-row': true },
    row.done
      ? h(
          'button',
          {
            class: 'disc',
            type: 'button',
            id: `k-${row.id}`,
            'aria-label': say.undoDone(row.title),
            onclick: () => actions.onUntick(row.id),
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
            onclick: () => actions.onTick(row.id),
          },
          icon('ring', 24),
        ),
    h(
      'button',
      {
        class: 'rowbtn',
        type: 'button',
        id: `r-${row.id}`,
        'aria-label': rowLabel(row),
        onclick: () => actions.onRow(row.id),
      },
      h('span', { class: 'rt' }, h('span', { text: row.title }), second),
    ),
  );
}
