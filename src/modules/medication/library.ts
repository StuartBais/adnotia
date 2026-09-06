// The Library entry.
//
// Tier A (supporting) as proposed in docs/02-evidence-rubric.md: the module
// records, and the treatment is the evidence base. The tier is assigned by
// someone other than the author, so this carries the rubric's proposal and is
// not itself the assignment. The citations are the rubric's own and are marked
// "verify before publication" there; none has been checked against the original.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'A',

  whatItIs:
    'A daily record of what you take, how the day went, when the medication started and ' +
    'stopped working, and anything you noticed in your body. It turns a fortnight of days ' +
    'into one page you can hand to your prescriber. It records what you tell it and nothing ' +
    'else: there is no measurement here, and no scoring.',

  whatTheEvidenceSays:
    'Medication has the strongest evidence base of any treatment for ADHD, across a large ' +
    'number of randomised trials in adults. That evidence is for the treatment, not for this ' +
    'log. What the log does is make your own report of it clearer: decisions about starting, ' +
    'adjusting or stopping a medication rest on what a prescriber can learn in a short ' +
    'appointment, and a written record of fourteen days is a better account of those days ' +
    'than anyone can give from memory. That is the whole claim, and it is the reason this is ' +
    'marked as supporting an established treatment rather than being one.',

  whatItWontDo:
    'It will not tell you or your prescriber what dose to take, when to take it, or whether ' +
    'to change anything. It does not calculate doses, check interactions, or say whether to ' +
    'take one today. It cannot tell you whether a bad week was the medication, the sleep, or ' +
    'the week. It is not a diagnosis and not a medical device, and the page it produces is a ' +
    'record of what you reported, not a measurement of you. Nothing in it is hidden from you: ' +
    'everything your prescriber sees, you see first, in the same words.',

  citations: [
    {
      title:
        'Comparative efficacy and tolerability of medications for attention-deficit hyperactivity disorder in children, adolescents, and adults: a systematic review and network meta-analysis',
      authors: 'Cortese S, et al.',
      year: 2018,
      venue: 'Lancet Psychiatry',
      doi_or_url: '10.1016/S2215-0366(18)30269-4',
    },
    {
      title: 'Attention deficit hyperactivity disorder: diagnosis and management (NG87)',
      authors: 'National Institute for Health and Care Excellence',
      year: 2019,
      venue: 'NICE guideline',
      doi_or_url: 'https://www.nice.org.uk/guidance/ng87',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
