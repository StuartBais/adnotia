// The Library entry.
//
// Tier B as proposed in docs/02-evidence-rubric.md. The tier is assigned by
// someone other than the author, so this carries the rubric's proposal and is
// not itself the assignment. Citations are the rubric's and are marked "verify
// before publication" there; none has been checked against the original.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'B',

  whatItIs:
    'A short record of when you went to bed, when you got up, and what the night was like. ' +
    'It is a record, not a sleep tracker: nothing is measured, and everything here is what ' +
    'you noticed yourself.',

  whatTheEvidenceSays:
    'Sleep problems are common in adults with ADHD and are well documented. Cognitive ' +
    'behavioural therapy for insomnia has strong evidence in the general adult population, ' +
    'and the techniques it uses start from exactly this kind of record. Direct trials in ' +
    'adults with ADHD are fewer and smaller, which is why this is marked promising rather ' +
    'than established. Keeping the record is a first step that the evidenced approaches ' +
    'begin with; it is not itself the treatment.',

  whatItWontDo:
    'It will not diagnose insomnia, sleep apnoea or any other sleep disorder, and it cannot ' +
    'tell you whether your sleep is caused by ADHD, by medication, or by something else. It ' +
    'measures nothing while you sleep. It will not tell you when to go to bed. If you snore ' +
    'heavily, stop breathing in the night, or fall asleep during the day without meaning to, ' +
    'those are worth raising with a doctor rather than logging here.',

  citations: [
    {
      title:
        'Short-term and long-term effect of non-pharmacotherapy for adults with ADHD: a systematic review and network meta-analysis',
      authors: 'Yang X, Zhang L, Yu J, Wang M',
      year: 2025,
      venue: 'Frontiers in Psychiatry',
      doi_or_url: '10.3389/fpsyt.2025.1516878',
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
  // Six months for Tier B, where the literature is moving.
  nextReview: '2027-03',
};
