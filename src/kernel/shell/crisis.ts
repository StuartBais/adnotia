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
import type { Space } from '../store/document';
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

/**
 * The extra lines the Family space adds. docs/04-family-space.md: "A
 * parent-facing 'if things are bad right now' page carries child- and
 * parent-specific resources alongside the general ones, reviewed each release
 * with the review date printed."
 *
 * Alongside, so this is the same page with more on it rather than a second page
 * a parent has to find. The general lines above still come first, because the
 * commonest reason a parent opens this is that they are the one who is not all
 * right, and CRISIS_REVIEWED covers everything on the page at once.
 *
 * NOT YET CHECKED BY A HUMAN, exactly as above.
 */
export interface FamilyCrisisLine extends CrisisLine {
  group: 'worried' | 'child' | 'parent';
}

export const FAMILY_CRISIS_LINES: readonly FamilyCrisisLine[] = [
  {
    group: 'worried',
    where: 'United Kingdom',
    who: 'NSPCC helpline',
    contact: '0808 800 5000',
    dial: '08088005000',
    note: 'For an adult worried about a child. You do not have to be sure before you ring.',
  },
  {
    group: 'worried',
    where: 'United States',
    who: 'Childhelp National Child Abuse Hotline',
    contact: '1-800-422-4453',
    dial: '18004224453',
    note: 'Call or text.',
  },
  {
    group: 'worried',
    where: 'Anywhere else',
    who: 'Your local child protection or social services line',
    contact: 'Varies',
    note:
      'The number is usually held by the local council, county or state rather than nationally. ' +
      'If you cannot find it and a child is in danger, use the emergency number.',
  },
  {
    group: 'child',
    where: 'United Kingdom',
    who: 'Childline',
    contact: '0800 1111',
    dial: '08001111',
    note: 'Free, for under-19s, and it does not appear on a phone bill.',
  },
  {
    group: 'child',
    where: 'Australia',
    who: 'Kids Helpline',
    contact: '1800 55 1800',
    dial: '1800551800',
    note: 'Five to twenty-five.',
  },
  {
    group: 'parent',
    where: 'United Kingdom',
    who: 'Family Lives',
    contact: '0808 800 2222',
    dial: '08088002222',
    note: 'For parents, about parenting, including when it has stopped being bearable.',
  },
  {
    group: 'parent',
    where: 'United States',
    who: 'National Parent Helpline',
    contact: '1-855-427-2736',
    dial: '18554272736',
  },
];

export const FAMILY_CRISIS_STRINGS = {
  neverReads:
    'Nothing in this app reads what you have written and decides whether a child is at risk. ' +
    'No entry sets anything off, and this page is the same page for every family whatever is ' +
    'in the log. It is here because it is always here.',
  worriedTitle: 'If you are worried about a child’s safety',
  worriedSub:
    'If a child is being hurt, or you think they might be, that is for the people whose job ' +
    'it is rather than for a notebook. Being unsure is the ordinary reason people ring; you ' +
    'are not expected to have worked it out first.',
  childTitle: 'Lines a child can ring themselves',
  childSub:
    'These are here rather than on the screen you hand over. Whether and when to tell your ' +
    'child about them is yours to judge, and it is not something an app should decide by ' +
    'putting a helpline in front of a six-year-old.',
  parentTitle: 'Lines for you',
  parentSub:
    'Parenting a child with ADHD is harder, and that is a finding rather than a feeling. ' +
    'Needing somewhere to put it is not a failure and it is not a safeguarding matter.',
} as const;

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

/** A group of the family lines, as its own card. */
function familyGroup(group: FamilyCrisisLine['group'], title: string, sub: string): HTMLElement {
  const lines = el('div', {});
  for (const entry of FAMILY_CRISIS_LINES) {
    if (entry.group === group) lines.append(line(entry));
  }
  return card({ title, sub, children: [lines] });
}

export interface CrisisPageOptions {
  /** Whether the numbers have been confirmed by a person. Absent means no. */
  checked?: boolean;
  /**
   * Where the page was opened from. The Family space adds the child- and
   * parent-specific lines; the Adult space does not, because a person with no
   * children in the app has no use for a child protection number and a page
   * that lists everything is a page nobody reads to the bottom.
   */
  space?: Space;
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
          children: [lines],
        }),
        ...(options.space === 'family'
          ? [
              familyGroup(
                'parent',
                FAMILY_CRISIS_STRINGS.parentTitle,
                FAMILY_CRISIS_STRINGS.parentSub,
              ),
              familyGroup(
                'worried',
                FAMILY_CRISIS_STRINGS.worriedTitle,
                FAMILY_CRISIS_STRINGS.worriedSub,
              ),
              familyGroup(
                'child',
                FAMILY_CRISIS_STRINGS.childTitle,
                FAMILY_CRISIS_STRINGS.childSub,
              ),
            ]
          : []),
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
        // Last, and one of them, because it governs everything above it. When
        // this note sat under the general lines, the family ones read as though
        // nobody had thought about how old they were.
        card({
          children: [
            ...(options.space === 'family'
              ? [el('p', { class: 'hint', text: FAMILY_CRISIS_STRINGS.neverReads })]
              : []),
            el('p', { class: 'hint', text: CRISIS_STRINGS.reviewed(CRISIS_REVIEWED) }),
            ...(options.checked === true
              ? []
              : [el('p', { class: 'sub warn', text: CRISIS_STRINGS.unchecked })]),
          ],
        }),
      );
    },
  };
}
