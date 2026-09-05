// What the medication log notices about a person's own record.
//
// Shown to them and to nobody else: never printed, never exported. This is the
// half of the trade in docs/03-scope.md that the app owes the person in exchange
// for refusing to assess them for a clinician.
//
// None of these is a warning and none is a reprimand. Each states something the
// person can check for themselves against the same report, and says why it might
// matter in the room. Ported from the monolith's mirrorNotes.

import type { IsoDate, MirrorContribution, MirrorObservation } from '../../../kernel/index';
import { SEVERITY_RANK } from '../strings';
import type { MedicationDay } from '../records';
import { doseLabel, groupByDose } from './doses';

export interface MirrorContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, MedicationDay>>;
  kernelDays?: Readonly<Record<IsoDate, { win?: string }>>;
}

/** Enough days at one dose to compare its first half with its second. */
const MIN_FOR_HALVES = 8;
/** Below this difference the two halves are the same number to a reader. */
const FLAT_WITHIN = 0.35;
/** Above this share of days carrying something moderate or worse. */
const HEAVY_ABOVE = 0.4;

function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

function oneDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function focusOf(days: readonly MedicationDay[]): number | null {
  return mean(days.map((day) => day.focus).filter((v): v is number => typeof v === 'number'));
}

/** Whether the day carried anything the person rated moderate or worse. */
function heavy(day: MedicationDay): boolean {
  for (const key of day.side ?? []) {
    if ((SEVERITY_RANK[day.detail?.[key]?.sev ?? ''] ?? 0) >= 2) return true;
  }
  if (day.appetite === 'barely') return true;
  if (
    (day.heart ?? '') !== '' &&
    day.heart !== 'fine' &&
    (SEVERITY_RANK[day.detail?.['heart']?.sev ?? ''] ?? 0) >= 2
  ) {
    return true;
  }
  return false;
}

export function observations(context: MirrorContext): MirrorObservation[] {
  const groups = groupByDose(context.dates, context.days);
  const current = groups[groups.length - 1];
  if (current === undefined) return [];

  const days = current.days;
  const label = doseLabel(current);
  const out: MirrorObservation[] = [];

  // Flat ratings are the single most common way a record ends up saying less than
  // the person meant it to, and they cannot see it from one day at a time.
  if (days.length >= MIN_FOR_HALVES) {
    const half = Math.floor(days.length / 2);
    const early = focusOf(days.slice(0, half));
    const late = focusOf(days.slice(days.length - half));
    if (early !== null && late !== null && Math.abs(late - early) < FLAT_WITHIN) {
      out.push({
        tag: 'Your focus rating has been flat',
        text:
          `It averaged ${oneDecimal(early)} over the first half of your time on ${label} and ` +
          `${oneDecimal(late)} over the second. If it feels like more has changed than that, ` +
          'it is worth deciding whether what you want adjusted is the dose or the timing.',
      });
    }
  }

  const load = days.filter(heavy).length;
  if (days.length > 0 && load / days.length > HEAVY_ABOVE) {
    out.push({
      tag: 'Side effects are already sitting high',
      text:
        `You have rated something moderate or worse on ${load} of ${days.length} days at ` +
        `${label}. A prescriber weighs tolerability against benefit, so expect that to come ` +
        'up alongside anything you ask for.',
    });
  }

  // The record disagreeing with itself is worth seeing before the appointment,
  // not after. Neither half is treated as the true one.
  const wins = context.dates.filter(
    (date) => (context.kernelDays?.[date]?.win ?? '') !== '' && context.days[date] !== undefined,
  ).length;
  const logged = context.dates.filter((date) => context.days[date] !== undefined).length;
  const focus = focusOf(days);

  if (logged > 0 && focus !== null) {
    if (wins / logged > 0.5 && focus <= 3) {
      out.push({
        tag: 'Your ratings and your notes disagree',
        text:
          `You listed something that went better on ${wins} of ${logged} days, but focus ` +
          `averages ${oneDecimal(focus)}. One of the two is closer to the truth. Worth a ` +
          're-read before you rate today.',
      });
    }
    if (wins / logged < 0.2 && focus >= 4) {
      out.push({
        tag: 'Your ratings and your notes disagree',
        text:
          `Focus averages ${oneDecimal(focus)}, but only ${wins} of ${logged} days have ` +
          'anything in the went-better column. Concrete examples carry more weight in the ' +
          'room than the numbers do.',
      });
    }
  }

  return out;
}

/** Weight 10 so the flat-ratings line comes before the kernel's own. */
export const medicationMirror: MirrorContribution = {
  weight: 10,
  observations: (context) => observations(context as MirrorContext),
};
