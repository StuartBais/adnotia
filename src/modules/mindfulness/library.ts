// The Library entry.
//
// docs/08-roadmap.md's bar for this milestone is that the entry "makes its
// evidence limits clear in the first paragraph". The limits are the first
// sentence, not the last, because a paragraph that ends on a caveat is a
// paragraph most people stop reading before the caveat.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'B',

  whatItIs:
    'Three short practices — three minutes, five, or ten — written out as steps, with a ' +
    'timer. No audio, no voice and no subscription: what is here is text, because audio ' +
    'files would either weigh down the download or have to be fetched, and this app fetches ' +
    'nothing.',

  whatTheEvidenceSays:
    'The honest position is that this is thinner than it is usually sold as. Mindfulness-' +
    'based cognitive therapy came second among non-drug approaches in a 2025 network ' +
    'meta-analysis of 37 randomised trials in adults — but the same review rated confidence ' +
    'in most of that evidence low or very low, with around half the trials at high risk of ' +
    'bias, and a 2025 meta-analysis of mindfulness interventions in adults reached much the ' +
    'same conclusion. What was trialled was also a taught course, usually eight weeks with a ' +
    'teacher, not three screens of instructions. Treat it as worth trying rather than as ' +
    'established, which is what "promising" means here.',

  whatItWontDo:
    'It will not treat ADHD, and nobody should stop anything on the strength of it. It does ' +
    'not count how many days in a row you have practised, because there is no such number ' +
    'here and a practice you can fall behind on is one more thing to fail at. It will not ' +
    'tell you whether you did it right — the moment you notice you stopped paying attention ' +
    'is the practice working, not you doing it badly. And it is not a substitute for the ' +
    'taught course the trials actually tested.',

  citations: [
    {
      title:
        'Short-term and long-term effect of non-pharmacotherapy for adults with ADHD: ' +
        'a systematic review and network meta-analysis',
      authors: 'Yang X, Zhang L, Yu J, Wang M',
      year: 2025,
      venue: 'Frontiers in Psychiatry',
      doi_or_url: 'doi:10.3389/fpsyt.2025.1516878',
    },
    {
      title:
        'Mindfulness-based interventions for adults with ADHD: a systematic review and ' +
        'meta-analysis',
      authors: 'Kim HH, Jung NH',
      year: 2025,
      venue: 'Medicine',
      doi_or_url: 'doi:10.1097/MD.0000000000044308',
    },
  ],

  reviewed: '2026-09',
  // Six months rather than twelve: docs/02-evidence-rubric.md shortens the
  // interval for Tier B, where the literature is moving.
  nextReview: '2027-03',
};
