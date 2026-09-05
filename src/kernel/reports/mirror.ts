// The mirror: what the record looks like, shown to the person and to nobody else.
//
// docs/03-scope.md rejected hidden checks that would tell a clinician whether a
// person seemed to be seeking more than they needed, and named the replacement:
// "transparent record quality, shown to both parties, plus private reflection for
// the person. Both exist." The record-quality footer is the first half. This is
// the second, and it is the only place in the app that says something to the
// person that a clinician will not read.
//
// It is not a warning and never a reprimand. Every line states a fact about the
// record and says why it might matter, in the same voice as everything else: a
// gap is a fact to show, never a failure to punish.
//
// print.css hides `.mirror`, and a test asserts it.

import type { MirrorObservation, ModuleManifest } from '../registry/types';
import { formatShortDate } from '../dates/index';
import { recordQuality } from './quality';
import type { ReportContext } from './types';

/** More than this and it stops being a reflection and becomes a lecture. */
export const MAX_OBSERVATIONS = 4;

/** Below this there is not enough record to say anything honest about it. */
const MIN_DAYS = 7;

/** Under this share of days logged, the gaps change how the rest reads. */
const PATCHY_BELOW = 0.7;

export const MIRROR_TITLE = 'Before you go';
export const MIRROR_SUB =
  'Things worth knowing about your own record. This is for you only and is not part of what prints.';

/**
 * What the kernel notices without help. Both are about how the record was kept
 * rather than what it says, which is the half of this the kernel owns.
 */
export function kernelObservations(context: ReportContext): MirrorObservation[] {
  const out: MirrorObservation[] = [];
  const { coverage } = context;

  // Weight 5: what the report is for, before anything about how well it was kept.
  // This is where docs/decisions/ADR-017 said the person would be told what the
  // four rows are for, having decided the printed page must not tell a clinician.
  out.push({
    tag: 'What the report is for',
    text:
      'It puts efficacy, duration, tolerability and adherence side by side, because those ' +
      'are the four a prescriber weighs together. It does not weigh them, for you or for them.',
  });

  if (coverage.ofDays > 0 && coverage.logged / coverage.ofDays < PATCHY_BELOW) {
    out.push({
      tag: 'The record is patchy',
      text:
        `You logged ${coverage.logged} of ${coverage.ofDays} days. The report says so on its ` +
        'face, and thin stretches usually skew toward the days that stood out.',
    });
  }

  const quality = recordQuality(context.dates, context.kernelDays);
  if (quality.known > 0 && quality.biggest > 3 && quality.biggest / quality.known > 0.4) {
    out.push({
      tag: 'A lot of it was written at once',
      text:
        `${quality.biggest} entries were filled in on ${formatShortDate(quality.biggestDay)}. ` +
        'Ratings recalled in one sitting tend to flatten out and drift toward how you feel today.',
    });
  }
  return out;
}

/** The kernel's own weight, chosen to sit where the monolith's lines sat. */
const KERNEL_WEIGHT = 30;

export interface MirrorSource {
  weight: number;
  observations: MirrorObservation[];
}

/**
 * Every module's reflection and the kernel's own, in weight order, capped.
 * `contextFor` hands each module the same context its report sections get.
 */
export function buildMirror(
  base: ReportContext,
  modules: readonly ModuleManifest[],
  contextFor: (manifest: ModuleManifest) => ReportContext,
): MirrorObservation[] {
  // A week is the least that says anything about a pattern rather than a day.
  if (base.dates.length < MIN_DAYS) return [];

  const sources: MirrorSource[] = [
    { weight: KERNEL_WEIGHT, observations: kernelObservations(base) },
  ];

  for (const manifest of modules) {
    const contribution = manifest.contributes.mirror;
    if (contribution === undefined) continue;
    sources.push({
      weight: contribution.weight,
      observations: contribution.observations(contextFor(manifest)),
    });
  }

  return sources
    .sort((a, b) => a.weight - b.weight)
    .flatMap((source) => source.observations)
    .slice(0, MAX_OBSERVATIONS);
}
