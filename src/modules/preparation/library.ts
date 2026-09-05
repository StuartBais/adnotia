// The Library entry.
//
// The honest difficulty with this module is that the evidence is for the pathway
// it supports, not for the notebook. The entry says so in the first line of what
// the evidence says, because a person choosing whether to turn it on deserves to
// know they are turning on a notebook.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'A',

  whatItIs:
    'A place to write down specific examples of how things actually go — what happened, ' +
    'where, what was going on beforehand, and what it cost you — and a place to gather what ' +
    'you can find out about your own childhood. It prints as a dated page to take to a first ' +
    'appointment.',

  whatTheEvidenceSays:
    'The evidence here is for assessment, not for this. Diagnosis of ADHD in adults rests on ' +
    'a clinical interview that asks for specific examples, across more than one setting, and ' +
    'for evidence that the pattern was present in childhood — several symptoms before age ' +
    'twelve, under DSM-5. Clinicians ask for examples because impressions are hard to work ' +
    'with, and people arrive with impressions. What this does is the same thing the ' +
    'medication log does at the other end of treatment: it replaces recollection with a ' +
    'record. The record is what has the evidence behind it. Writing one down has not been ' +
    'tested as an intervention and is not claimed as one.',

  whatItWontDo:
    'It cannot tell you whether you have ADHD, and it does not try. There is no score, no ' +
    'threshold and no total that means anything: writing fifteen entries does not indicate ' +
    'more than writing three, and the app has no opinion about which you should have. It is ' +
    'not a screening questionnaire — validated ones exist, and the Library says which and ' +
    'where they are published. It will not shorten a waiting list, and it cannot make a ' +
    'clinician agree with you.',

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
        'The World Health Organization Adult Attention-Deficit/Hyperactivity Disorder ' +
        'Self-Report Screening Scale for DSM-5',
      authors: 'Ustün B, Adler LA, Rudin C, Faraone SV, Lane MJ, Kessler RC, et al.',
      year: 2017,
      venue: 'JAMA Psychiatry',
      doi_or_url: 'PMC5470397',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
