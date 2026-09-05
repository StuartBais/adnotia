// How the record was kept, rather than what it says.
//
// A prescriber reading self-reported data needs to know how it was collected:
// filled in as the days happened, or reconstructed the night before the
// appointment. Both are legitimate; only one of them supports a claim about
// day-to-day variation, and the difference is invisible unless the log says so.
//
// It is stated plainly and without blame. Backfilling a fortnight is what an
// ADHD log looks like sometimes, and the person is shown this section too.
//
// Ported from the monolith's qualityStats and qualityBlock.

import { daysBetween, formatShortDate, type IsoDate } from '../dates/index';
import type { KernelDay } from '../store/document';

export interface RecordQuality {
  /** Entries whose writing date was recorded at all. */
  known: number;
  /** Written the same day or the next morning. */
  timely: number;
  /** Written later than that. */
  late: number;
  /** Days after the day itself, for the late ones. */
  medianLag: number | null;
  /** Distinct days on which entries were written. */
  sittings: number;
  /** Entries written on the busiest of those days. */
  biggest: number;
  biggestDay: IsoDate;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] as number;
  return Math.round(((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2);
}

export function recordQuality(
  dates: readonly IsoDate[],
  kernelDays: Readonly<Record<IsoDate, KernelDay>>,
): RecordQuality {
  const sittings = new Map<IsoDate, number>();
  const lags: number[] = [];
  let known = 0;
  let timely = 0;

  for (const date of dates) {
    const createdAt = kernelDays[date]?.createdAt;
    if (createdAt === undefined || createdAt === '') continue;
    known++;

    const made = createdAt.slice(0, 10);
    sittings.set(made, (sittings.get(made) ?? 0) + 1);

    // The next morning still counts as timely: an entry written at 1am about the
    // day that just ended is the same recall as one written at 11pm.
    const lag = daysBetween(date, made);
    if (lag <= 1) timely++;
    else lags.push(lag);
  }

  let biggest = 0;
  let biggestDay = '';
  for (const [day, count] of sittings) {
    if (count > biggest) {
      biggest = count;
      biggestDay = day;
    }
  }

  return {
    known,
    timely,
    late: lags.length,
    medianLag: median(lags),
    sittings: sittings.size,
    biggest,
    biggestDay,
  };
}

/**
 * The sentences, in order. Sections may add their own through `frame`, which is
 * how the focus-range sentence gets here without the kernel knowing what focus is.
 */
export function qualityLines(
  quality: RecordQuality,
  contributed: readonly string[] = [],
): string[] {
  const lines: string[] = [];

  if (quality.known === 0) {
    lines.push('These entries pre-date this version of the log, so their timing was not recorded.');
  } else {
    lines.push(
      `${quality.timely} of ${quality.known} entries were written the same day or the next morning` +
        (quality.late > 0
          ? `, ${quality.late} were filled in later (typically ${quality.medianLag} days after the day itself)`
          : '') +
        '.',
    );
    lines.push(
      `Entries were made across ${quality.sittings}` +
        (quality.sittings === 1 ? ' sitting' : ' separate sittings') +
        // Only worth naming a day when one sitting carried most of the record.
        (quality.biggest > 3 && quality.biggest / quality.known > 0.4
          ? `, ${quality.biggest} of them on ${formatShortDate(quality.biggestDay)}`
          : '') +
        '.',
    );
  }

  lines.push(...contributed);
  return lines;
}
