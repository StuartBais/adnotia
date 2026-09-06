// The Library entry.
//
// docs/08-roadmap.md's bar for this milestone: the evidence limits are clear in
// the first paragraph. Exercise is the thing people are told to do most often
// and most confidently, so the entry has to be careful in the other direction
// from usual — not to undersell it, but not to let a real, small, short-lived
// finding be read as a treatment.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'B',

  whatItIs:
    'Somewhere to note what you did and roughly how long. A walk to the shop counts and so ' +
    'does an hour of football; this does not rank them, add them up, or set a target.',

  whatTheEvidenceSays:
    'Less than the way it is usually talked about. What has been reported reasonably ' +
    'consistently is an acute effect: attention measures improve for a while after a bout of ' +
    'exercise, in adults with ADHD as in adults generally. The studies are small, they differ ' +
    'a great deal from each other in what was done and for how long, and the lasting effect ' +
    'on core symptoms is much less clear than the short-term one. That is why this is ' +
    'promising rather than established. It is worth knowing that the effect anyone has ' +
    'measured is closer to "the next hour goes better" than to "this treats the condition".',

  whatItWontDo:
    'It will not treat ADHD and it is not a substitute for anything that does. It sets no ' +
    'target: there is no weekly minimum here, no total, and no streak, because a target is a ' +
    'thing to fall short of and this app does not build those. It will not tell you what to ' +
    'do or how much — that is between you and anyone who knows your body, and if there is a ' +
    'reason to be careful about exertion, this log has no idea about it.',

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
      title: 'Non-pharmacological interventions for adult ADHD: a systematic review',
      authors: 'Nimmo-Smith V, et al.',
      year: 2020,
      venue: 'Psychological Medicine',
      doi_or_url: 'PMID 32036811',
    },
  ],

  reviewed: '2026-09',
  // Six months, as the rubric sets for Tier B.
  nextReview: '2027-03',
};
