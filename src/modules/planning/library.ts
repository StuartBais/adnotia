// The Library entry.
//
// The honest difficulty here is that the module's tier and its contents do not
// carry the same weight. The protocols have trial evidence; a particular
// template inside a particular app does not, and the rubric names three of these
// five among its Tier C examples. docs/08-roadmap.md asks for that to be said in
// this entry, and ADR-025 puts it on the tools themselves as well.

import type { LibraryEntry } from '../../kernel/index';

export const library: LibraryEntry = {
  tier: 'A',

  whatItIs:
    'Five small tools, four of them taken from the cognitive-behavioural programmes written ' +
    'for adults with ADHD: a plan for the day, a way of breaking something down so the first ' +
    'step is small enough to start, a note of how long you thought a job would take against ' +
    'how long it did, and if–then prompts that decide in advance what will set something ' +
    'off. The fifth is a timer that runs a stretch on one thing, then a break, then another, ' +
    'and it does not come from those programmes.',

  whatTheEvidenceSays:
    'Cognitive-behavioural therapy adapted for adult ADHD has repeated randomised support, ' +
    'and a 2025 network meta-analysis of 37 trials found it the most effective ' +
    'non-pharmacological approach on core symptoms, in the short term and at follow-up. ' +
    'Planning, task breakdown and time estimation are components of those programmes rather ' +
    'than additions to them. What the trials tested, though, was the programme: a course of ' +
    'sessions with a therapist, over weeks. They did not test four screens in an app. Two of ' +
    'these tools — breaking a task down, and if–then prompts — are named in this project’s ' +
    'own evidence rubric as examples of plausible-but-untested, and they say so on ' +
    'themselves. The estimation tool has the strongest claim of the four, because the ' +
    'correction it offers comes from your own recorded numbers rather than from the app ' +
    'having an opinion. The timer has the weakest claim of the five and is marked as such ' +
    'where it sits: timers of this kind have no trials behind them in adults with ADHD, and ' +
    'the familiar lengths — twenty-five minutes of work, five of break, a longer one after ' +
    'four — are a method somebody published in the nineteen-nineties rather than anything ' +
    'that was measured. They are offered as settings you can change, because that is what ' +
    'they are. What is reasonable about it is the mechanism rather than the numbers: putting ' +
    'time somewhere you can see it, and making starting a smaller decision than finishing.',

  whatItWontDo:
    'It will not make you do any of it. Nothing here counts what you finished, keeps a run ' +
    'going, or compares this week with last: there is no score to lose and nothing to be ' +
    'behind on. The timer will not interrupt you and cannot — there is no sound and no ' +
    'notification anywhere in this app — so if a stretch ends while you are finally going, ' +
    'nothing stops you, and nothing counts the stretch you did not take. It is not a therapy course, and using it is not the same as doing one — if ' +
    'the trials are what you are after, what they tested was a therapist. It cannot tell ' +
    'you which things matter, and it will not decide anything for you.',

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
        'Cognitive behavioral therapy vs relaxation with educational support for ' +
        'medication-treated adults with ADHD and persistent symptoms',
      authors: 'Safren SA, et al.',
      year: 2010,
      venue: 'JAMA',
      doi_or_url: 'doi:10.1001/jama.2010.1192',
    },
    {
      title: 'Efficacy of meta-cognitive therapy for adult ADHD',
      authors: 'Solanto MV, et al.',
      year: 2010,
      venue: 'American Journal of Psychiatry',
      doi_or_url: 'doi:10.1176/appi.ajp.2009.09081123',
    },
  ],

  reviewed: '2026-09',
  nextReview: '2027-09',
};
