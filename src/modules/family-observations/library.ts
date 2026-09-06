// The Library entry.
//
// Tier A (supporting) is the rubric's proposal in docs/04-family-space.md, on
// the same reasoning as the medication log: it does not deliver an intervention,
// it supports the evidenced pathway by recording what a clinician uses.
//
// The entry has to carry the thing that document calls "the pipeline concern":
// a screener and a medication log in one app look like a route to a
// prescription. This module is on the other side of that — it records and it
// scores nothing — and the entry says so plainly rather than hoping nobody asks.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'A',

  whatItIs:
    'Somewhere to write down specific things as they happen, with when, where, what was ' +
    'going on beforehand and whether anything helped. It prints as a dated list to take to ' +
    'an appointment, with a line saying how many entries there are and which settings they ' +
    'came from.',

  whatTheEvidenceSays:
    'The evidence is for assessment, not for this. A diagnosis in a child rests on evidence ' +
    'of difficulty in more than one setting, over months, with information from more than ' +
    'one adult — which is why clinicians ask for examples and why guidelines describe the ' +
    'process as taking time rather than an appointment. Parents arrive with impressions ' +
    'because impressions are what a month leaves behind. A dated record of specific things ' +
    'is what turns that into something a clinician can work with, and it is the same idea as ' +
    'the daily log this app offers adults. Writing one down has not been trialled as an ' +
    'intervention and is not claimed as one.',

  whatItWontDo:
    'It cannot tell you whether your child has ADHD, whether to seek an assessment, or ' +
    'whether what you have written down is a lot. There is no score here and no total that ' +
    'means anything — fifteen entries does not indicate more than three, and the app has no ' +
    'view on which you should have. It does not label anything: nothing you write becomes a ' +
    'category, a subscale or a suspected condition. It will not shorten a waiting list, and ' +
    'it is not a screening questionnaire — those exist, they are filled in with a clinician, ' +
    'and the Library says which one is usually used.',

  citations: [
    {
      title: 'Attention deficit hyperactivity disorder: diagnosis and management (NG87)',
      authors: 'National Institute for Health and Care Excellence',
      year: 2019,
      venue: 'NICE guideline',
      doi_or_url: 'https://www.nice.org.uk/guidance/ng87',
    },
    {
      title:
        'Psychometric properties of the Vanderbilt ADHD Diagnostic Parent Rating Scale in a ' +
        'referred population',
      authors: 'Wolraich ML, et al.',
      year: 2003,
      venue: 'Journal of Pediatric Psychology',
      doi_or_url: 'doi:10.1093/jpepsy/jsg046',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
