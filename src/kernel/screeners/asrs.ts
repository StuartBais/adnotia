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
   * threshold against the paper. Absent means nobody has, and the screener is
   * not offered to anyone.
   */
  verified?: string;
}

export const ASRS_RESPONSES: readonly ScreenerResponse[] = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Very often', value: 4 },
];

export const ASRS_ITEMS: readonly ScreenerItem[] = [
  {
    id: 'concentrating',
    text:
      'How often do you have difficulty concentrating on what people say to you, even when ' +
      'they are speaking to you directly?',
  },
  {
    id: 'seat',
    text:
      'How often do you leave your seat in meetings or other situations in which you are ' +
      'expected to remain seated?',
  },
  {
    id: 'unwinding',
    text: 'How often do you have difficulty unwinding and relaxing when you have time to yourself?',
  },
  {
    id: 'finishing',
    text:
      "When you're in a conversation, how often do you find yourself finishing the sentences " +
      'of the people you are talking to before they can finish them themselves?',
  },
  { id: 'lastMinute', text: 'How often do you put things off until the last minute?' },
  {
    id: 'others',
    text: 'How often do you depend on others to keep your life in order and attend to details?',
  },
];

/** The window the instrument asks about. Changing it changes the instrument. */
export const ASRS_PERIOD = 'the past 6 months';

/** At or above this, the responses are consistent with seeking an assessment. */
export const ASRS_THRESHOLD = 14;

/**
 * What the transcription we were given states as the maximum. Six items with a
 * top response of 4 sum to 24, so this cannot be right as a plain sum — which is
 * the concrete reason the source is treated as unverified rather than merely
 * unchecked. A test asserts the disagreement so it cannot be quietly forgotten.
 * See ADR-021.
 */
export const ASRS_DOCUMENTED_MAX = 25;

export const ASRS_SOURCE: ScreenerSource = {
  instrument: 'ASRS-5, the Adult ADHD Self-Report Screening Scale for DSM-5',
  paper:
    'Ustün B, Adler LA, Rudin C, Faraone SV, Lane M, Kessler RC, et al. ' +
    'The World Health Organization Adult Attention-Deficit/Hyperactivity Disorder ' +
    'Self-Report Screening Scale for DSM-5. JAMA Psychiatry, 2017. PMC5470397',
  transcribedFrom: 'A third-party reproduction, not the paper and not a WHO form.',
};

/** The largest score these items can actually produce. */
export function maxScore(): number {
  const top = Math.max(...ASRS_RESPONSES.map((response) => response.value));
  return ASRS_ITEMS.length * top;
}

/** A plain sum, which is what the transcription describes. */
export function score(answers: Readonly<Record<string, number>>): number {
  let total = 0;
  for (const item of ASRS_ITEMS) total += answers[item.id] ?? 0;
  return total;
}

export function isComplete(answers: Readonly<Record<string, number>>): boolean {
  return ASRS_ITEMS.every((item) => answers[item.id] !== undefined);
}

/**
 * The only thing this instrument reports. Not a probability, not a severity, not
 * a diagnosis, and never the number it came from: docs/03-scope.md permits one
 * bit of information out of this and this is it.
 */
export type ScreenerOutcome = 'worth-seeking' | 'below-threshold';

export function outcome(answers: Readonly<Record<string, number>>): ScreenerOutcome {
  return score(answers) >= ASRS_THRESHOLD ? 'worth-seeking' : 'below-threshold';
}

/** Whether the screener may be shown to anyone at all. */
export function isUsable(source: ScreenerSource = ASRS_SOURCE): boolean {
  return source.verified !== undefined;
}
