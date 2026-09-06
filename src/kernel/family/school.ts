// Talking to the school, and the daily report card.
//
// docs/04-family-space.md asks for exactly this and draws the line in the same
// sentence: "Plain guidance on talking to the school, what a daily report card
// is and why it has evidence, and how to ask for one. The app does not manage
// the report card; the school does."
//
// So there is no card in here to fill in, and no field for a teacher's ratings.
// That is not an omission waiting on a later milestone. The ratings are the
// teacher's, made at school, and the intervention is the teacher making them
// daily and the reward following at home the same day. A parent typing
// yesterday's ratings into a private notebook is a copy of the intervention
// rather than the intervention, and it would make this app a place a child's
// school record lives, which docs/03-scope.md excludes.
//
// Like the rest of the guidance, it reads nothing. It takes no store, it is the
// same page for every family, and nothing in the log changes a word of it.

import { card } from '../ui/index';
import { evidenceNote, section } from './prose';
import type { GuidanceEvidence } from './guidance';
import type { OffTabPage } from '../shell/router';

/**
 * Tier A. docs/04-family-space.md proposes it — "Classroom behavioural
 * interventions have consistent support; the app only explains and helps the
 * parent ask" — and the two meta-analyses below are what that rests on. Both
 * pool single-case designs rather than randomised trials, which is why the page
 * says what the evidence shows and what it does not.
 */
export const SCHOOL_EVIDENCE: GuidanceEvidence = {
  tier: 'A',
  citations: [
    {
      title:
        'Daily report card intervention and attention deficit hyperactivity disorder: a ' +
        'meta-analysis of single-case studies',
      authors: 'Pyle K, Fabiano GA',
      year: 2017,
      venue: 'Exceptional Children',
      doi_or_url: 'doi:10.1177/0014402917706370',
    },
    {
      title:
        'Effective intervention for behavior with a daily behavior report card: a meta-analysis',
      authors: 'Vannest KJ, Davis JL, Davis CR, Mason BA, Burke MD',
      year: 2010,
      venue: 'School Psychology Review',
      doi_or_url: 'doi:10.1080/02796015.2010.12087748',
    },
  ],
};

export const SCHOOL_STRINGS = {
  title: 'Talking to the school',
  sub:
    'What to ask for, in the words schools use for it, and the one classroom tool with a ' +
    'decent amount of evidence behind it.',

  beforeTitle: 'Before you ask for anything',
  before: [
    'Ask for the class teacher first. Systems differ by country — a SENCO in England, a ' +
      'school counsellor or 504 coordinator in the United States, a learning support ' +
      'coordinator elsewhere — but the person who sees your child all day is the one who has ' +
      'to run whatever you agree, so they are the useful first conversation either way.',
    'Take specific, dated examples rather than a summary. "He has not settled all term" is ' +
      'hard for a teacher to act on; "he has come home without the reading book eleven times ' +
      'since September, and I have the dates" is something two people can work on together.',
    'Ask what the school is already seeing before you say what you are seeing. It is worth ' +
      'knowing whether the difficulty shows up there at all, and a teacher who has been ' +
      'listened to first tends to be a better ally afterwards.',
    'None of this needs a diagnosis first. A school can put support in place without one, ' +
      'and waiting for an assessment before asking usually costs a year.',
  ],

  whatTitle: 'What a daily report card is',
  what:
    'A short list of things the child is aiming for, written down, rated by the teacher every ' +
    'day, and sent home the same day so that something small and good happens at home that ' +
    'evening. Three to five targets is usual. It is not a punishment record and it is not a ' +
    'behaviour report in the ordinary sense: nothing is taken away for a bad day, and the ' +
    'next day starts again.',

  evidenceTitle: 'Why it is worth asking for',
  evidence:
    'The daily report card is one of the better-supported classroom tools for ADHD. Two ' +
    'meta-analyses of single-case studies find consistent improvement on the behaviours the ' +
    'card targets, across a good many children and classrooms. What that evidence does not ' +
    'show is a change in the attention and impulsivity themselves; it shows the targeted ' +
    'behaviour improving while the card is running. That is still worth having, and it is ' +
    'worth knowing which one you are being offered.',
  mattersTitle: 'What makes the difference',
  matters:
    'Two findings are directly useful when you ask. Effects are larger when the card runs ' +
    'across the whole day rather than in one lesson, and larger when home is involved rather ' +
    'than the card staying inside the school. Both are things you can ask for by name.',

  askTitle: 'What to ask for, specifically',
  ask: [
    'Three to five targets, no more. A card with twelve things on it gets abandoned in a ' +
      'fortnight, by everyone.',
    'Each target written as the thing to do rather than the thing to stop. "Starts work ' +
      'within two minutes of being asked" rather than "does not disrupt".',
    'Each target defined so that two different adults would rate the same day the same way. ' +
      'If a supply teacher could not fill it in, it is not specific enough yet.',
    'A rating every day, not a summary at the end of the week. The daily part is the part ' +
      'that does the work.',
    'The whole day covered, or at least the parts that are hardest, rather than a single ' +
      'lesson.',
    'The card coming home the same day, and something small and certain happening at home ' +
      'that evening. Small and certain beats large and occasional.',
    'A date to review it. Targets that have been met for a few weeks should be replaced, and ' +
      'a card nobody has looked at since October should be either fixed or stopped.',
  ],

  homeTitle: 'Your half of it',
  home:
    'The reward at home is not a bribe and it is not optional decoration — it is the half of ' +
    'the intervention that you run, and the evidence is stronger when it is there. It does ' +
    'not have to cost anything: choosing the story, twenty minutes of your undivided ' +
    'attention, staying up fifteen minutes later. A day that misses a target still ends with ' +
    'the day being over. Nothing is taken back, and tomorrow starts at nothing to nothing.',

  notUsTitle: 'This app does not run the card',
  notUs:
    'There is nowhere here to enter a teacher’s ratings, and there will not be. The ' +
    'ratings are the school’s record, made by the person who was there, and a private ' +
    'copy of them in a notebook is not the thing that works — the teacher rating it daily and ' +
    'the reward following that evening is. Keeping a school record in here would also make ' +
    'this app somewhere a child’s school file lives, which it is deliberately not. Ask ' +
    'the school for its own form; most that run cards already have one.',

  refusedTitle: 'If the school says no, or nothing changes',
  refused: [
    'Ask what they would do instead. A school that will not run a card often has something ' +
      'else it already runs, and knowing what it is beats a stalemate.',
    'Ask for it in writing, briefly and without heat, so there is a record of what was asked ' +
      'and what was answered. That record matters later, whatever happens.',
    'A card that is not working is usually a card with too many targets, targets nobody can ' +
      'rate consistently, or nothing happening at home. Those are fixable, and worth fixing ' +
      'before concluding the approach has failed.',
    'A classroom tool is not the same thing as a formal support plan, and neither is the ' +
      'same thing as a clinical assessment. Which of the three you want, and how you get it, ' +
      'differs by country and often by district.',
  ],
} as const;

export function schoolPage(): OffTabPage {
  return {
    id: 'school',
    title: SCHOOL_STRINGS.title,
    render(container) {
      container.replaceChildren(
        card({
          sub: SCHOOL_STRINGS.sub,
          children: [section(SCHOOL_STRINGS.beforeTitle, SCHOOL_STRINGS.before)],
        }),
        card({
          children: [
            section(SCHOOL_STRINGS.whatTitle, SCHOOL_STRINGS.what),
            section(SCHOOL_STRINGS.evidenceTitle, SCHOOL_STRINGS.evidence),
          ],
        }),
        card({
          children: [
            section(SCHOOL_STRINGS.mattersTitle, SCHOOL_STRINGS.matters),
            section(SCHOOL_STRINGS.askTitle, SCHOOL_STRINGS.ask),
            section(SCHOOL_STRINGS.homeTitle, SCHOOL_STRINGS.home),
          ],
        }),
        card({
          children: [
            section(SCHOOL_STRINGS.notUsTitle, SCHOOL_STRINGS.notUs),
            section(SCHOOL_STRINGS.refusedTitle, SCHOOL_STRINGS.refused),
          ],
        }),
        evidenceNote(SCHOOL_EVIDENCE),
      );
    },
  };
}
