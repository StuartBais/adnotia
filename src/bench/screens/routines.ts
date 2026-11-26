// Routines (design/lantern/SPEC.md section 5.9) and a routine's own page
// (section 12), without running routines: owner default 10 leaves them out
// of this round (plan section 19, chunk 8).
//
// The place: "Routines" and Me in the header row; the helper line; one row
// per routine, 62 tall from 142, its title over how many steps it has, and
// "Ran today" with an ash check before the chevron, only for a run finished
// on today's logging day; then "+ New routine". No ring, because a routine is
// not ticked from the list. Nothing is said about days a routine did not run,
// or how often it runs.
//
// A routine's page: its name as a page title, then where Start would stand
// the plain fact that running one is not in this prototype, and what SPEC
// says starting one does in the app, then its steps with their minutes where
// a step is timed. "+ New routine" opens a page that says making one is not
// in this prototype either.

import { duration, stepCount } from '../format';
import { HINT_IDS, backPill, meButton, type Built } from '../frame';
import { T, routineInApp, say } from '../strings';
import { h, icon } from '../ui';
import type { RoutinePageView, RoutineRow } from '../view';

export interface RoutinesActions {
  onMe: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}

export function routinesScreen(rows: readonly RoutineRow[], actions: RoutinesActions): Built {
  return {
    nodes: [
      h(
        'header',
        { class: 'hdr' },
        h('h1', { class: 'place-title t-place', text: T.routines }),
        meButton(actions.onMe),
      ),
      h(
        'div',
        { class: 'body routines', 'data-scroll-key': 'routines' },
        h('p', { class: 'helper t-meta', 'data-geo': 'r-helper', text: T.openRoutine }),
        rows.length > 0
          ? h(
              'ul',
              { class: 'rlist', 'data-list': true },
              ...rows.map((row, index) => routineRow(row, index, actions.onOpen)),
            )
          : null,
        h(
          'button',
          {
            class: 'addstep newroutine',
            type: 'button',
            id: 'r-new',
            'data-geo': 'r-new',
            onclick: actions.onNew,
          },
          icon('plus', 20),
          T.newRoutine,
        ),
      ),
    ],
  };
}

/**
 * A row (SPEC 9.7 and 5.9): the title over its steps, then "Ran today" with
 * its check where that is so, then a chevron that says the row opens the
 * routine's page. One button, named "Morning, 6 steps, ran today".
 */
function routineRow(row: RoutineRow, index: number, onOpen: (id: string) => void): HTMLElement {
  return h(
    'li',
    {
      class: 'row rrow routine',
      'data-row': true,
      ...(index === 0 ? { 'data-geo': 'r-row' } : {}),
    },
    h(
      'button',
      {
        class: 'rowbtn',
        type: 'button',
        id: `rt-${row.id}`,
        'aria-label': say.routineRow(row.title, row.steps, row.ranToday),
        'aria-describedby': HINT_IDS.routine,
        onclick: () => onOpen(row.id),
      },
      h(
        'span',
        { class: 'rt' },
        h('span', { text: row.title }),
        h('small', { 'aria-hidden': 'true', text: stepCount(row.steps) }),
      ),
      row.ranToday ? h('span', { class: 'ran' }, icon('check-s', 18), T.ranToday) : null,
      icon('right', 20),
    ),
  );
}

export interface PageActions {
  onBack: () => void;
  onMe: () => void;
}

function pageHeader(back: string, actions: PageActions): HTMLElement {
  return h(
    'header',
    { class: 'hdr' },
    backPill(back, actions.onBack),
    h('span', { class: 'grow' }),
    meButton(actions.onMe),
  );
}

function pageTitle(text: string): HTMLElement {
  return h('h1', {
    class: 'ptitle t-idle',
    id: 'p-title',
    tabindex: '-1',
    'data-focus-home': true,
    'data-geo': 'p-title',
    text,
  });
}

/** A routine's own page, as a task's page is laid out, with no Start to offer yet. */
export function routineScreen(view: RoutinePageView, back: string, actions: PageActions): Built {
  return {
    nodes: [
      pageHeader(back, actions),
      h(
        'div',
        { class: 'body page routine', 'data-scroll-key': `routine:${view.id}` },
        pageTitle(view.title),
        h('p', { class: 'sentence t-meta', id: 'p-notyet', text: T.routineNotInPrototype }),
        h('p', { class: 'sentence t-meta', text: routineInApp(view.instead) }),
        view.steps.length > 0 ? h('h2', { class: 'lbl t-label steps-lbl', text: T.steps }) : null,
        view.steps.length > 0
          ? h(
              'ol',
              { class: 'rail plain timed', 'data-geo': 'p-rail' },
              ...view.steps.map((step) =>
                h(
                  'li',
                  {},
                  h('span', { class: 'mk next', 'aria-hidden': 'true' }, String(step.number)),
                  h('span', { class: 's', 'aria-hidden': 'true', text: step.title }),
                  step.minutes === undefined
                    ? null
                    : h('span', {
                        class: 'sm',
                        'aria-hidden': 'true',
                        text: duration(step.minutes),
                      }),
                  h('p', {
                    class: 'vh',
                    text: say.routineStep(step.number, step.title, step.minutes),
                  }),
                ),
              ),
            )
          : null,
      ),
    ],
  };
}

/** What "+ New routine" opens while making a routine is out of the prototype. */
export function newRoutineScreen(back: string, actions: PageActions): Built {
  return {
    nodes: [
      pageHeader(back, actions),
      h(
        'div',
        { class: 'body page', 'data-scroll-key': 'new-routine' },
        pageTitle(T.newRoutine),
        h('p', { class: 'sentence t-meta', text: T.newRoutineNotInPrototype }),
      ),
    ],
  };
}
