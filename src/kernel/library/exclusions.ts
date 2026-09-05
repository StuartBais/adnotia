// What Adnotia will not build, and why.
//
// docs/02-evidence-rubric.md: "Excluded things do not get a module. They get an
// entry in the Library explaining why they are absent, because people will ask."
//
// These are the hardest entries in the Library to write honestly, because every
// one of them is something a person has probably paid for. None of them calls
// anyone foolish for having tried it. Each says what the evidence found, and
// stops.
//
// The wording follows the rubric's own, which is the reviewed text.

import type { Citation } from '../registry/types';

export interface Exclusion {
  id: string;
  title: string;
  /** What the thing is, for someone who has only seen it advertised. */
  whatItIs: string;
  /** Why it is not here. */
  why: string;
  citations: Citation[];
  /** What would change this. An exclusion with no such answer is a prejudice. */
  whatWouldChangeIt: string;
}

const WESTWOOD: Citation = {
  title:
    'Computerized cognitive training in attention-deficit/hyperactivity disorder (ADHD): ' +
    'a meta-analysis of randomized controlled trials with blinded and objective outcomes',
  authors: 'Westwood SJ, et al.',
  year: 2023,
  venue: 'Molecular Psychiatry',
  doi_or_url: 'PMC10208955',
};

const RAPPORT: Citation = {
  title:
    'Do programs designed to train working memory, other executive functions, and attention ' +
    'benefit children with ADHD? A meta-analytic review',
  authors: 'Rapport MD, et al.',
  year: 2013,
  venue: 'Clinical Psychology Review',
  doi_or_url: 'doi:10.1016/j.cpr.2013.08.005',
};

const KESSLER: Citation = {
  title: 'The World Health Organization Adult ADHD Self-Report Scale (ASRS)',
  authors: 'Kessler RC, et al.',
  year: 2005,
  venue: 'Psychological Medicine',
  doi_or_url: 'doi:10.1017/S0033291704002892',
};

export const EXCLUSIONS: readonly Exclusion[] = [
  {
    id: 'cognitive-training',
    title: 'Brain training and working-memory games',
    whatItIs:
      'Apps and programmes that have you practise memory or attention tasks daily, on the ' +
      'promise that the skill will carry over into the rest of your life. It is the single ' +
      'most common thing paid ADHD apps sell.',
    why:
      'A meta-analysis of 36 randomised trials found that when the people rating the outcome ' +
      'did not know who had been trained, the training had no effect on total ADHD symptoms ' +
      'or on hyperactivity and impulsivity. What remained was small, short-term and specific ' +
      'to one setting. An earlier review found no carry-over into school or behaviour, and ' +
      'identified large rater effects: unblinded raters saw improvement that blinded raters ' +
      'did not. Training improves the trained task. It does not improve ADHD.',
    citations: [WESTWOOD, RAPPORT],
    whatWouldChangeIt:
      'Blinded trials with objective outcomes showing transfer to daily functioning, not to ' +
      'another version of the trained task.',
  },
  {
    id: 'neurofeedback',
    title: 'Neurofeedback',
    whatItIs:
      'Training that shows you a live signal from your own brain activity and rewards you ' +
      'for shifting it, usually over dozens of clinic sessions.',
    why:
      'Effects in blinded, sham-controlled trials have been small or absent, and the time and ' +
      'equipment cost is large. The same pattern as brain training: it looks better when the ' +
      'person rating it knows who was treated.',
    citations: [WESTWOOD],
    whatWouldChangeIt:
      'Well-controlled sham-comparison evidence. This is a live literature and the entry ' +
      'should be revisited rather than assumed settled.',
  },
  {
    id: 'diets-and-supplements',
    title: 'Elimination diets and supplements',
    whatItIs:
      'Removing foods or additives, or taking omega-3, zinc, iron or magnesium, as a treatment ' +
      'for ADHD rather than for a deficiency a clinician has found.',
    why:
      'Effects in adults are small or absent, the studies disagree with each other, and the ' +
      'market around them overclaims heavily. A modest effect of omega-3 has been reported and ' +
      'is worth knowing about; it is not a treatment, and this app will not sell it as one.',
    citations: [],
    whatWouldChangeIt:
      'Consistent effects at a size that matters, in adults, from trials that were not run by ' +
      'the people selling the supplement.',
  },
  {
    id: 'type-quizzes',
    title: '"Which ADHD type are you" quizzes',
    whatItIs:
      'Quizzes that sort people into named types — inattentive, ring of fire, limbic, and so ' +
      'on — usually as the entry point to a paid programme.',
    why:
      'The types are not validated and most are not falsifiable: there is no result that ' +
      'would show one to be wrong. They also compete for attention with the one instrument ' +
      'here that is validated, the ASRS, which is why they are named rather than ignored.',
    citations: [KESSLER],
    whatWouldChangeIt: 'A typology with published validation and a stated way of being wrong.',
  },
  {
    id: 'cure-claims',
    title: 'Anything that says it rewires, retrains or cures',
    whatItIs: 'Programmes promising to fix ADHD itself, usually in a fixed number of weeks.',
    why:
      'Unfalsifiable by construction. There is no result these claims would accept as failure, ' +
      'which is what separates them from a treatment that can be tested.',
    citations: [],
    whatWouldChangeIt:
      'A specific, measurable claim and a trial that could have failed to support it.',
  },
  {
    id: 'dose-tools',
    title: 'Anything that works out a dose',
    whatItIs:
      'Calculators, schedules and prompts that suggest how much to take, or when, or whether ' +
      'to take it today.',
    why:
      'This one is not about evidence. It is the first of the hard exclusions in the scope ' +
      'document, and it is what keeps this a record of what you reported rather than something ' +
      'that influences treatment. The medication log exists to bring your own record to the ' +
      'person who prescribes; it never stands in for them.',
    citations: [],
    whatWouldChangeIt:
      'Nothing. Removing this would need a change to the scope document and a very good ' +
      'reason, written down.',
  },
];
