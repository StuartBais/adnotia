// The adult screener.
//
// docs/03-scope.md allows exactly one, under rules it fixes: it lives in the
// Library, it uses the instrument's own wording and threshold unmodified, and
// the only thing it ever reports is whether the responses are or are not
// consistent with seeking a formal assessment. Never a probability, never a
// severity, never "you have ADHD".
//
// The reason it is here at all is also in that document: "Refusing to include
// any screener would push people toward the unvalidated quizzes that fill the
// space." A validated instrument presented honestly is the answer to those, and
// an instrument presented sloppily is one of them.
//
// Which is why nothing in this file is enabled yet. See
// docs/decisions/ADR-021-the-adult-screener-is-not-yet-verified.md.

export interface ScreenerItem {
  /** Stable, so an answer can be attributed without depending on order. */
  id: string;
  text: string;
}

export interface ScreenerResponse {
  label: string;
  value: number;
}

/**
 * Where these items came from, and how far that can be trusted. Every field is
 * here because a screener whose provenance is vague is the thing this one exists
 * to compete with.
 */
export interface ScreenerSource {
  /** The instrument, named precisely enough to tell two of them apart. */
  instrument: string;
  /** The paper the instrument was published in. */
  paper: string;
  /** Where this transcription came from, which is not the same thing. */
  transcribedFrom: string;
  /**
   * `YYYY-MM` when a person checked every item, every response option and the
   * threshold against the paper. Absent means nobody has.
   */
  verified?: string;
  /** Who holds the rights, and what would have to be obtained from them. */
  rights: string;
  /**
   * `YYYY-MM` when written permission to reproduce was obtained. Absent means it
   * has not been, and no amount of checking against the paper substitutes.
   */
  licensed?: string;
}

export const ASRS_RESPONSES: readonly ScreenerResponse[] = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Very often', value: 4 },
];

/**
 * Empty, on purpose.
 *
 * Both candidate instruments are copyrighted and neither is ours to reproduce.
 * The ASRS v1.1 form carries "© World Health Organization 2003 All rights
 * reserved … Requests for permission to reproduce or translate — whether for sale
 * or for noncommercial distribution — should be addressed to Professor Ronald
 * Kessler". The ASRS-5's scoring rules are licensed by New York University and
 * are not published at all. Adnotia is distributed publicly under AGPL-3.0,
 * which means anything here is republished by everyone who forks it.
 *
 * So the items live outside this repository until someone holds permission in
 * writing. Everything around them — the scoring, the threshold, the rules the
 * screener is presented under — is here and tested against a stand-in.
 * See docs/decisions/ADR-023-the-screeners-are-not-ours-to-reproduce.md.
 */
export const ASRS_ITEMS: readonly ScreenerItem[] = [];

/**
 * The order the items go in when there are items, so a licensed build can drop
 * them into place without inventing an order. These are our own labels for the
 * six, not the instrument's wording.
 */
export const ASRS_ITEM_ORDER: readonly string[] = [
  'concentrating',
  'seat',
  'unwinding',
  'finishing',
  'lastMinute',
  'others',
];

/** The window the instrument asks about. Changing it changes the instrument. */
export const ASRS_PERIOD = 'the past 6 months';

/** At or above this, the responses are consistent with seeking an assessment. */
export const ASRS_THRESHOLD = 14;

/**
 * The maximum the published instrument actually reaches: 0–25.
 *
 * It is 25 because the response categories are weighted differently per item —
 * never is 0 throughout, and the top response is worth 6 on question 3, 5 on
 * questions 1 and 2, 4 on question 5, 3 on question 6 and 2 on question 4. Six
 * items scored 0–4 uniformly reach 24, which is how a flattened copy gives
 * itself away, and the transcription we were handed did exactly that: the right
 * maximum printed over the wrong grid.
 *
 * The threshold of 14 belongs to the weighted score. Applied to a plain sum it
 * is a different test wearing the same number. See ADR-021.
 */
export const ASRS_DOCUMENTED_MAX = 25;

/** A plain 0–4 sum over six items. Not the instrument, and not what 14 means. */
export const UNWEIGHTED_MAX = 24;

export const ASRS_SOURCE: ScreenerSource = {
  instrument: 'ASRS-5, the Adult ADHD Self-Report Screening Scale for DSM-5',
  paper:
    'Ustün B, Adler LA, Rudin C, Faraone SV, Lane M, Kessler RC, et al. ' +
    'The World Health Organization Adult Attention-Deficit/Hyperactivity Disorder ' +
    'Self-Report Screening Scale for DSM-5. JAMA Psychiatry, 2017. PMC5470397',
  transcribedFrom: 'A third-party reproduction, not the paper and not a WHO form.',
  rights:
    'New York University licenses the adult ADHD scales; the ASRS-5 scoring rules are ' +
    'proprietary and are not published. NYU offers them free of charge for non-commercial ' +
    'academic and research use, under an agreement requiring an institutional signatory.',
};

/** The largest score a set of items can actually produce under a plain sum. */
export function maxScore(items: readonly ScreenerItem[] = ASRS_ITEMS): number {
  const top = Math.max(...ASRS_RESPONSES.map((response) => response.value));
  return items.length * top;
}

/** A plain sum, which is what the transcription describes. */
export function score(
  answers: Readonly<Record<string, number>>,
  items: readonly ScreenerItem[] = ASRS_ITEMS,
): number {
  let total = 0;
  for (const item of items) total += answers[item.id] ?? 0;
  return total;
}

export function isComplete(
  answers: Readonly<Record<string, number>>,
  items: readonly ScreenerItem[] = ASRS_ITEMS,
): boolean {
  return items.length > 0 && items.every((item) => answers[item.id] !== undefined);
}

/**
 * The only thing this instrument reports. Not a probability, not a severity, not
 * a diagnosis, and never the number it came from: docs/03-scope.md permits one
 * bit of information out of this and this is it.
 */
export type ScreenerOutcome = 'worth-seeking' | 'below-threshold';

export function outcome(
  answers: Readonly<Record<string, number>>,
  items: readonly ScreenerItem[] = ASRS_ITEMS,
): ScreenerOutcome {
  return score(answers, items) >= ASRS_THRESHOLD ? 'worth-seeking' : 'below-threshold';
}

/**
 * Whether the screener may be shown to anyone at all. Two conditions, and the
 * second is the one that cannot be satisfied by checking a paper: there have to
 * be items, and someone has to have confirmed them against the source.
 */
export function isUsable(
  source: ScreenerSource = ASRS_SOURCE,
  items: readonly ScreenerItem[] = ASRS_ITEMS,
): boolean {
  return items.length > 0 && source.verified !== undefined;
}
