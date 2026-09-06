// The Library entry.
//
// docs/04-family-space.md writes the evidence paragraph for this one almost
// verbatim, and it is unusually careful because the temptation here is large:
// parent training has good evidence for the things it has good evidence for, and
// is routinely sold as a treatment for the things it does not.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'A',

  whatItIs:
    'Routines you build for a part of the day, a first/then pair for a difficult moment, a ' +
    'star chart you run yourself, and worked examples of saying what you noticed. The ' +
    'routines, the pair and the chart all appear on the screen you hand to your child.',

  whatTheEvidenceSays:
    'Parent training reliably improves parenting and reduces children’s conduct problems, ' +
    'including when the people rating the outcome do not know which families had the ' +
    'training. Its effect on core ADHD symptoms is smaller, and in the short term largely ' +
    'disappears when only blinded ratings are counted, though modest effects appear at longer ' +
    'follow-up. In plain terms: these tools help the household, and they help behaviour. They ' +
    'are not a treatment for the attention and impulsivity themselves. ADHD is not caused by ' +
    'parenting, and parenting approaches still measurably help. The two components most ' +
    'associated with things improving are the ones here: arranging what comes before a ' +
    'difficult moment, and noticing out loud what you want more of.',

  whatItWontDo:
    'It will not treat ADHD and it will not make a child concentrate. It does not run itself: ' +
    'no star is ever awarded by the app, nothing reminds you, and there is deliberately no ' +
    'button that takes a star back — charts that remove points work less well and feel worse. ' +
    'It keeps no streak and compares nothing between weeks. It cannot tell you whether a ' +
    'routine is working; you can see that at the door in the morning better than an app can.',

  citations: [
    {
      title:
        'Behavioral interventions in attention-deficit/hyperactivity disorder: a meta-analysis ' +
        'of randomized controlled trials across multiple outcome domains',
      authors: 'Daley D, et al.',
      year: 2014,
      venue: 'Journal of the American Academy of Child and Adolescent Psychiatry',
      doi_or_url: 'doi:10.1016/j.jaac.2014.05.013',
    },
    {
      title:
        'Meta-analysis: which components of parent training work for children with ' +
        'attention-deficit/hyperactivity disorder?',
      authors: 'Dekkers TJ, et al.',
      year: 2022,
      venue: 'Journal of the American Academy of Child and Adolescent Psychiatry',
      doi_or_url: 'PMID 34224837',
    },
    {
      title:
        'Sustained improvements by behavioural parent training for children with ' +
        'attention-deficit/hyperactivity disorder: a meta-analytic review of longer-term ' +
        'child and parental outcomes',
      authors: 'Doffer DPA, et al.',
      year: 2023,
      venue: 'JCPP Advances',
      doi_or_url: 'PMC10501699',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
