// What a parent reads before, or instead of, a form.
//
// docs/04-family-space.md asks for three things this file provides: a plain
// statement of what an assessment actually involves, guidance for under-sixes
// where no validated free screener exists, and guidance for thirteen and over
// where the usual parent form stops being validated.
//
// None of it scores anything, and none of it is applied to what the parent has
// written down. That document is explicit: "No module attempts to detect risk,
// abuse, neglect or mood disorder from anything recorded. Guidance may list
// circumstances guidelines say warrant urgent advice; the app never applies that
// list to the data." This is guidance sitting in the Library. It does not know
// what is in the log and never reads it.
//
// It is also deliberately not organised by the child's age band. The bands a
// profile carries are 4-11 and 12-17; the ages these pages turn on are 6 and 13.
// Asking for a finer age to route on would mean collecting more about a child
// than the tools need, which that document rules out. A parent picks the page
// that applies to them, which they can do better than the app can.

import { card, el } from '../ui/index';
import type { OffTabPage } from '../shell/router';

export const ASSESSMENT_STRINGS = {
  title: 'What an assessment involves',
  sub:
    'Worth knowing before you start, because it is slower and less like a test than most ' +
    'people expect.',
  points: [
    'It is made by a clinician, over time, and not in one appointment. The picture is built ' +
      'from several conversations rather than settled in the first.',
    'It needs evidence from more than one setting. Home and school is the usual pair, which ' +
      'is why a teacher is often asked for a view and why an appointment can wait on one.',
    'It needs information from more than one adult who knows the child. What you have ' +
      'noticed matters, and so does what somebody else has noticed independently.',
    'It asks about difficulty rather than behaviour on its own. The question is not whether ' +
      'a child is lively, it is whether something is getting in the way for them.',
    'A screening form is the start of that, never the end of it. Filling one in is not being ' +
      'assessed, and a form is not a diagnosis in either direction.',
  ],
  thresholdTitle: 'If a form comes out below its threshold',
  threshold:
    'A threshold is a screening convention, not a verdict. It is set to catch as many ' +
    'children as possible who should be looked at, which means it also lets some through. ' +
    'If the concern has persisted, it is worth raising whatever a form said — and saying that ' +
    'the form came out low is itself useful information for the person you raise it with.',
  routesTitle: 'How you get there',
  routes: [
    'Routes differ by country, and differ again between public and private care. In most ' +
      'places the first step is a GP, family doctor or paediatrician, who refers on.',
    'Some school systems can start their own process in parallel. That is a different ' +
      'assessment from a clinical one and it answers a different question — what support the ' +
      'school will put in — but the two often inform each other.',
    'Waiting lists in public systems can be long, sometimes years. It is worth asking what ' +
      'the wait is when you ask for the referral, so that whatever you decide next, you are ' +
      'deciding it knowing.',
    'Taking a written record of specific, dated examples makes the first appointment go ' +
      'further than trying to recall a year of them in twenty minutes.',
  ],
} as const;

export const UNDER_SIX_STRINGS = {
  title: 'If they are under six',
  sub:
    'There is no free, validated screening form for this age, so this app does not offer one. ' +
    'Here is what is worth knowing instead.',
  ordinaryTitle: 'What is ordinary at this age',
  ordinary:
    'Short attention, a great deal of movement, and very little impulse control are ordinary ' +
    'in three, four and five-year-olds. That is not a hedge — it is the actual reason no ' +
    'screening form is validated here. The behaviours a form would ask about are close to ' +
    'universal at this age, so a form cannot separate the children it is meant to find.',
  raiseTitle: 'What guidelines say is worth raising',
  raise: [
    'Difficulty that shows up in more than one place — at home and at nursery or preschool, ' +
      'not only in one of them.',
    'Difficulty that is out of step with other children of the same age, as judged by someone ' +
      'who sees a lot of them, such as a nursery keyworker.',
    'Difficulty that is getting in the way: of learning, of friendships, of family life, or ' +
      'of the child themselves being able to do what they want to do.',
    'Difficulty that has lasted, rather than arrived with a new baby, a house move, a ' +
      'bereavement or a change of setting.',
  ],
  describeTitle: 'How to describe it',
  describe:
    'Specifics travel and impressions do not. "Cannot sit still" is hard to act on; "gets up ' +
    'eleven times during a fifteen-minute story session, every session, while the others ' +
    'stay" is something a health visitor or GP can do something with. The log in this space ' +
    'is for collecting exactly that.',
  whoTitle: 'Who to talk to',
  who:
    'A health visitor, a GP or family doctor, or the nursery or preschool SENCO where there ' +
    'is one. Guidelines for this age generally start with support for parents rather than ' +
    'with an assessment of the child, and that is not a brush-off: it is what has the ' +
    'evidence behind it at this age.',
} as const;

export const THIRTEEN_PLUS_STRINGS = {
  title: 'If they are thirteen or older',
  sub: 'The usual parent form stops being validated here, and this app will not pretend otherwise.',
  whyTitle: 'Why there is no form here',
  why:
    'The parent rating scale most clinicians use is validated for ages six to twelve. Past ' +
    'that, a score from it does not mean what the score is supposed to mean, and an app that ' +
    'handed you one anyway would be giving you a number instead of an answer. The free ' +
    'self-report scales for adolescents are proprietary, and this app does not collect ' +
    'self-report from a child in any case.',
  insteadTitle: 'What to do instead',
  instead: [
    'The observation log in this space is the preparation tool for this age. Dated, specific ' +
      'examples from more than one setting are what an assessment asks for, and they do not ' +
      'stop being useful because a form has run out.',
    'School is a stronger source at this age, not a weaker one. Subject teachers see a ' +
      'narrow slice each, and several narrow slices that agree carry weight.',
    'An older child has a view of their own about what is hard, and it is worth hearing ' +
      'first-hand rather than only through you. That conversation belongs to you and them ' +
      'rather than to this app, which is why there is nothing here that asks them.',
    'The route is the same as at any age: a GP or family doctor, who refers on.',
  ],
  laterTitle: 'A first diagnosis this late is normal',
  later:
    'Plenty of people are assessed for the first time as teenagers or as adults, often when ' +
    'demands rise and what used to be manageable stops being. It is not too late and it is ' +
    'not evidence that nothing is there.',
} as const;

function bullets(items: readonly string[]): HTMLElement {
  const list = el('ul', { class: 'plain' });
  for (const item of items) list.append(el('li', { text: item }));
  return list;
}

function section(heading: string, body: string | readonly string[]): HTMLElement {
  return el('div', { class: 'lib-part' }, [
    el('h3', { text: heading }),
    typeof body === 'string' ? el('p', { text: body }) : bullets(body),
  ]);
}

/**
 * All three take no store. Guidance never reads what a parent has written: it is
 * the same page for everyone, which is the mechanical form of "the app never
 * applies that list to the data".
 */
export function assessmentPage(): OffTabPage {
  return {
    id: 'what-assessment-involves',
    title: ASSESSMENT_STRINGS.title,
    render(container) {
      container.replaceChildren(
        card({ sub: ASSESSMENT_STRINGS.sub, children: [bullets(ASSESSMENT_STRINGS.points)] }),
        card({
          children: [
            section(ASSESSMENT_STRINGS.thresholdTitle, ASSESSMENT_STRINGS.threshold),
            section(ASSESSMENT_STRINGS.routesTitle, ASSESSMENT_STRINGS.routes),
          ],
        }),
      );
    },
  };
}

export function underSixPage(): OffTabPage {
  return {
    id: 'under-six',
    title: UNDER_SIX_STRINGS.title,
    render(container) {
      container.replaceChildren(
        card({
          sub: UNDER_SIX_STRINGS.sub,
          children: [section(UNDER_SIX_STRINGS.ordinaryTitle, UNDER_SIX_STRINGS.ordinary)],
        }),
        card({
          children: [
            section(UNDER_SIX_STRINGS.raiseTitle, UNDER_SIX_STRINGS.raise),
            section(UNDER_SIX_STRINGS.describeTitle, UNDER_SIX_STRINGS.describe),
            section(UNDER_SIX_STRINGS.whoTitle, UNDER_SIX_STRINGS.who),
          ],
        }),
      );
    },
  };
}

export function thirteenPlusPage(): OffTabPage {
  return {
    id: 'thirteen-plus',
    title: THIRTEEN_PLUS_STRINGS.title,
    render(container) {
      container.replaceChildren(
        card({
          sub: THIRTEEN_PLUS_STRINGS.sub,
          children: [section(THIRTEEN_PLUS_STRINGS.whyTitle, THIRTEEN_PLUS_STRINGS.why)],
        }),
        card({
          children: [
            section(THIRTEEN_PLUS_STRINGS.insteadTitle, THIRTEEN_PLUS_STRINGS.instead),
            section(THIRTEEN_PLUS_STRINGS.laterTitle, THIRTEEN_PLUS_STRINGS.later),
          ],
        }),
      );
    },
  };
}

/** Every guidance page, for the Library to list. */
export const GUIDANCE: readonly { title: string; page: () => OffTabPage }[] = [
  { title: ASSESSMENT_STRINGS.title, page: assessmentPage },
  { title: UNDER_SIX_STRINGS.title, page: underSixPage },
  { title: THIRTEEN_PLUS_STRINGS.title, page: thirteenPlusPage },
];
