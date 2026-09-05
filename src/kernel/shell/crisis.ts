// "If things are bad right now".
//
// docs/03-scope.md: a static page reachable from every screen in two taps, which
// "lists a small number of international crisis lines and the instruction to
// search for the local emergency number, states plainly that the app cannot help
// in a crisis, and nothing else."
//
// The "and nothing else" is the hard part and it is deliberate. Nothing on this
// page asks a question, records anything, or reacts to what is in the document.
// No module detects crisis or risk from the data; that is a diagnostic act and
// docs/03-scope.md excludes it. This page is simply always there.
//
// The first instruction is the one that cannot be out of date: a local emergency
// number is right everywhere, and a list compiled in advance by an app with no
// network is not. Everything below it is a shortcut for people who would rather
// not phone an emergency line, in the order most likely to be useful.

import { card, el } from '../ui/index';
import type { OffTabPage } from './router';

/**
 * `YYYY-MM`. Printed on the page, because a list that cannot refresh itself must
 * say how old it is. docs/03-scope.md requires this list to be reviewed with each
 * release; the test in tests/kernel/crisis.test.ts fails when it goes stale, so
 * the review is a build step rather than an intention.
 *
 * NOT YET CHECKED BY A HUMAN. Every number below needs confirming against the
 * organisation's own site before this ships to anyone.
 */
export const CRISIS_REVIEWED = '2026-09';

/** How long a review lasts before the test starts failing. */
export const CRISIS_REVIEW_MONTHS = 6;

export interface CrisisLine {
  where: string;
  who: string;
  /** As a person would dial it. */
  contact: string;
  /** A `tel:` number where one exists, so a phone can dial it in one tap. */
  dial?: string;
  note?: string;
}

export const CRISIS_LINES: readonly CrisisLine[] = [
  {
    where: 'United Kingdom and Ireland',
    who: 'Samaritans',
    contact: '116 123',
    dial: '116123',
    note: 'Free, day or night. You do not have to be suicidal to call.',
  },
  {
    where: 'United States and Canada',
    who: 'Suicide and Crisis Lifeline',
    contact: '988',
    dial: '988',
    note: 'Call or text.',
  },
  {
    where: 'Australia',
    who: 'Lifeline',
    contact: '13 11 14',
    dial: '131114',
  },
  {
    where: 'New Zealand',
    who: 'Need to talk?',
    contact: '1737',
    dial: '1737',
    note: 'Call or text.',
  },
  {
    where: 'Much of Europe',
    who: 'Emotional support helplines',
    contact: '116 123',
    dial: '116123',
    note: 'A number set aside for this across the EU. Not every country has switched it on.',
  },
];

export const CRISIS_STRINGS = {
  title: 'If things are bad right now',
  cannotHelp:
    'Adnotia cannot help in a crisis. It is a notebook. It has no connection to anyone and ' +
    'nobody is reading what you write in it.',
  emergency: 'If you are in immediate danger, call your local emergency number.',
  emergencyNote:
    'If you do not know it, it is worth looking up now rather than later. In much of Europe ' +
    'it is 112, in the UK 999, in the US and Canada 911, in Australia 000.',
  linesTitle: 'Somewhere to talk',
  linesSub: 'A few lines that are free and answered by a person.',
  elsewhere: 'Somewhere else, or none of these fit',
  elsewhereBody:
    'findahelpline.com lists free lines by country. Opening it leaves Adnotia and uses the ' +
    'internet; nothing about you goes with you.',
  reviewed: (when: string) => `This list was last checked in ${when}.`,
  unchecked:
    'These numbers have not yet been confirmed against each organisation’s own site. Treat ' +
    'your local emergency number as the reliable one.',
} as const;

function line(entry: CrisisLine): HTMLElement {
  const contact =
    entry.dial === undefined
      ? el('b', { text: entry.contact })
      : el('a', { href: `tel:${entry.dial}`, rel: 'noreferrer', class: 'crisis-dial' }, [
          el('b', { text: entry.contact }),
        ]);

  const children: (Node | string)[] = [
    el('div', { class: 'crisis-where', text: entry.where }),
    el('div', {}, [el('span', { text: `${entry.who} · ` }), contact]),
  ];
  if (entry.note !== undefined) children.push(el('p', { class: 'hint', text: entry.note }));
  return el('div', { class: 'crisis-line' }, children);
}

export interface CrisisPageOptions {
  /** Whether the numbers have been confirmed by a person. Absent means no. */
  checked?: boolean;
}

export function crisisPage(options: CrisisPageOptions = {}): OffTabPage {
  return {
    id: 'crisis',
    title: CRISIS_STRINGS.title,
    render(container) {
      const lines = el('div', {});
      for (const entry of CRISIS_LINES) lines.append(line(entry));

      container.replaceChildren(
        card({
          sub: CRISIS_STRINGS.cannotHelp,
          children: [
            el('p', { class: 'crisis-first', text: CRISIS_STRINGS.emergency }),
            el('p', { class: 'hint', text: CRISIS_STRINGS.emergencyNote }),
          ],
        }),
        card({
          title: CRISIS_STRINGS.linesTitle,
          sub: CRISIS_STRINGS.linesSub,
          children: [
            lines,
            el('p', { class: 'hint', text: CRISIS_STRINGS.reviewed(CRISIS_REVIEWED) }),
            ...(options.checked === true
              ? []
              : [el('p', { class: 'sub warn', text: CRISIS_STRINGS.unchecked })]),
          ],
        }),
        card({
          title: CRISIS_STRINGS.elsewhere,
          children: [
            el('p', { text: CRISIS_STRINGS.elsewhereBody }),
            el('a', {
              class: 'btn',
              href: 'https://findahelpline.com',
              rel: 'noreferrer noopener',
              target: '_blank',
              text: 'Open findahelpline.com',
            }),
          ],
        }),
      );
    },
  };
}
