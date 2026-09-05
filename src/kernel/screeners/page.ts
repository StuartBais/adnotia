// The screener, and the rules it is presented under.
//
// Every rule in docs/03-scope.md "Screening" is enforced here rather than
// remembered:
//
//   - It lives in the Library. It is never in the daily check-in and never on
//     the home screen, which is a fact about where this page is reachable from.
//   - The only outcome is whether the responses are or are not consistent with
//     seeking a formal assessment. No percentage, no severity, no "you have".
//   - The score itself is never shown. A number invites the reader to interpret
//     it, and interpreting it is the thing the rule forbids.
//   - It is followed by plain information on seeking an assessment, with the
//     note that routes differ by country and by public or private care.
//   - The result is not stored. This page is handed no store at all, so there is
//     no route by which it could be: it cannot become a diagnosis in the
//     document, cannot reach a clinical report, and cannot be read by a module.
//   - It is for adults and says so.

import { card, chips, el } from '../ui/index';
import type { OffTabPage } from '../shell/router';
import {
  ASRS_ITEMS,
  ASRS_PERIOD,
  ASRS_RESPONSES,
  ASRS_SOURCE,
  isComplete,
  isUsable,
  outcome,
  type ScreenerItem,
  type ScreenerOutcome,
  type ScreenerSource,
} from './asrs';

export const SCREENER_STRINGS = {
  title: 'Is a formal assessment worth seeking?',
  intro:
    'Six questions used by clinicians as a first step. It is not a diagnosis and it cannot ' +
    'be one: ADHD is diagnosed by a clinician, over time, from more than one source. This ' +
    'only tells you whether what you have described is the kind of thing worth taking to one.',
  adultsOnly:
    'These questions are for adults. If you are asking about a child, the Family space has a ' +
    'form made for that and this one would not mean anything.',
  period: `Answer for ${ASRS_PERIOD}.`,
  submit: 'See what this suggests',
  incomplete: 'Answer all six to see what they suggest.',
  again: 'Start again',

  worthSeeking:
    'What you have described is consistent with seeking a formal assessment. That is all this ' +
    'says: not that you have ADHD, and not how likely it is.',
  belowThreshold:
    'What you have described is not, on its own, consistent with seeking a formal assessment ' +
    'on the strength of this form. The threshold is a screening convention rather than a ' +
    'verdict, and it is drawn to miss as few people as possible rather than to be right about ' +
    'any one of them. If the concern persists, it is still worth raising.',

  nextTitle: 'What seeking an assessment involves',
  next: [
    'Routes differ by country, and differ again between public and private care. In most ' +
      'places the first step is a GP or family doctor, who refers on.',
    'A diagnosis is made over time and across settings, usually with information from ' +
      'someone who has known you a long while. One conversation is rarely the end of it.',
    'Waiting lists in public systems can be long. It is worth asking what the wait is when ' +
      'you ask for the referral, so you can decide knowing it.',
    'Taking a written account of specific examples — what happens, when, and what it costs ' +
      'you — makes the first appointment go further than trying to recall it in the room.',
  ],

  privacyNote:
    'Nothing you answer here is saved. Leave this page and it is gone, including from your ' +
    'own record: it is not part of anything you would show a clinician.',

  unavailableTitle: 'The screening questions are being checked',
  unavailable:
    'A screening instrument is only worth anything in its own published wording, with its ' +
    'own scoring. Both of the ones this app could use are copyrighted, and reproducing ' +
    'either needs written permission from the people who hold the rights. That has not been ' +
    'obtained, so there is nothing here yet. Something that looks official and is not would ' +
    'be worse than this page.',
} as const;

function outcomeText(result: ScreenerOutcome): string {
  return result === 'worth-seeking'
    ? SCREENER_STRINGS.worthSeeking
    : SCREENER_STRINGS.belowThreshold;
}

function bullets(items: readonly string[]): HTMLElement {
  const list = el('ul', { class: 'plain' });
  for (const item of items) list.append(el('li', { text: item }));
  return list;
}

export interface ScreenerPageOptions {
  source?: ScreenerSource;
  /** The instrument's items. Empty in this build; see ADR-023. */
  items?: readonly ScreenerItem[];
}

/**
 * The page takes no store. That is the mechanical form of "the result is not
 * stored as a diagnosis": there is nothing to store it in.
 */
export function screenerPage(options: ScreenerPageOptions = {}): OffTabPage {
  const source = options.source ?? ASRS_SOURCE;
  const items = options.items ?? ASRS_ITEMS;
  const answers: Record<string, number> = {};

  return {
    id: 'screener',
    title: SCREENER_STRINGS.title,
    render(container) {
      if (!isUsable(source, items)) {
        container.replaceChildren(
          card({
            title: SCREENER_STRINGS.unavailableTitle,
            sub: SCREENER_STRINGS.unavailable,
          }),
        );
        return;
      }

      const status = el('p', { class: 'bmsg', role: 'status' });
      const result = el('div', {});

      const questions = el('div', {});
      for (const [index, item] of items.entries()) {
        const control = chips({
          label: `${index + 1}. ${item.text}`,
          options: ASRS_RESPONSES.map((response) => ({
            v: String(response.value),
            l: response.label,
          })),
          value: answers[item.id] === undefined ? '' : String(answers[item.id]),
          optional: false,
          onChange: (value) => {
            if (value === '') delete answers[item.id];
            else answers[item.id] = Number(value);
            status.textContent = '';
          },
        });
        questions.append(control.element);
      }

      const submit = el('button', {
        type: 'button',
        class: 'btn primary',
        text: SCREENER_STRINGS.submit,
      });
      submit.addEventListener('click', () => {
        if (!isComplete(answers, items)) {
          status.textContent = SCREENER_STRINGS.incomplete;
          result.replaceChildren();
          return;
        }
        status.textContent = '';
        result.replaceChildren(
          card({
            // The outcome, and nothing that could be read as a degree of it.
            sub: outcomeText(outcome(answers, items)),
            children: [
              el('h3', { text: SCREENER_STRINGS.nextTitle }),
              bullets(SCREENER_STRINGS.next),
              el('p', { class: 'hint', text: SCREENER_STRINGS.privacyNote }),
            ],
          }),
        );
      });

      container.replaceChildren(
        card({
          sub: SCREENER_STRINGS.intro,
          children: [
            el('p', { class: 'hint', text: SCREENER_STRINGS.adultsOnly }),
            el('p', { class: 'hint', text: SCREENER_STRINGS.period }),
          ],
        }),
        card({ children: [questions, el('div', { class: 'btnrow' }, [submit]), status] }),
        result,
      );
    },
  };
}
