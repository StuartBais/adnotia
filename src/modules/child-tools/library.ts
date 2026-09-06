// The Library entry.
//
// Read by the parent, never by the child. Every module needs one, "including
// Tier C" — and this is Tier C, because a visual timer and a first/then board
// are exactly the rubric's example of a plausible implementation of a technique
// used inside an evidenced protocol, untested as a tool in its own right.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'C',

  whatItIs:
    'The screen you hand over. It shows a timer your child can start, the routine you built, ' +
    'the first/then pair you set, and their star chart to look at. There is nothing to type ' +
    'and nowhere to go from it, and getting back out needs your code.',

  whatTheEvidenceSays:
    'These are ordinary implementations of two things the parent-training literature does ' +
    'support: making what is coming visible in advance, and making a next step concrete. ' +
    'Externalising time is a reasonable answer to a real difficulty with judging it, and a ' +
    'first/then board is the simplest form of arranging what comes before a difficult moment. ' +
    'None of that is the same as evidence for these four screens: no trial has tested this ' +
    'timer or this board, and this project rates that kind of thing plausible rather than ' +
    'established. Some families find them useful and some do not.',

  whatItWontDo:
    'It will not treat anything, and it is not a reward system that runs itself — the chart ' +
    'here only shows what you have already given. It collects nothing about your child: there ' +
    'is no text entry, nothing is recorded about what they pressed, and there is no way from ' +
    'this screen to your data, to the rest of the app, or to the internet. It does not ' +
    'replace being in the room.',

  citations: [
    {
      title:
        'Meta-analysis: which components of parent training work for children with ' +
        'attention-deficit/hyperactivity disorder?',
      authors: 'Dekkers TJ, et al.',
      year: 2022,
      venue: 'Journal of the American Academy of Child and Adolescent Psychiatry',
      doi_or_url: 'PMID 34224837',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
