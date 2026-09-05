// The backup reminder.
//
// Everything lives in this browser, and a browser clears site data without
// asking. This is the only thing in the app that asks a person to do something
// they have not asked to do, so it is bounded hard: at most once a fortnight, on
// one screen, with one action and a way to say not now.
//
// docs/03-scope.md: "nags about backups no more than once a fortnight, in plain
// language, without alarm". It is not a streak, it counts nothing about the
// person, and it never says they failed to do something.

import { daysBetween, today, type IsoDate } from '../dates/index';

/** The fortnight in docs/03-scope.md. */
export const NAG_INTERVAL_DAYS = 14;

/** Below this there is little to lose and the reminder is just noise. */
const MIN_ENTRIES = 5;

export interface BackupNag {
  message: string;
  actionLabel: string;
}

export interface BackupNagInput {
  /** Days the person has logged anything at all. */
  entries: number;
  lastBackup?: IsoDate;
  /** Set when the person dismissed the reminder; it waits a fortnight again. */
  lastDismissed?: IsoDate;
  now?: Date;
}

/**
 * What the reminder should say, or nothing at all. The caller draws it; this
 * decides whether there is anything to draw, which is the part that has to be
 * the same everywhere it appears.
 */
export function backupNag(input: BackupNagInput): BackupNag | undefined {
  if (input.entries < MIN_ENTRIES) return undefined;

  const now = today(input.now ?? new Date());
  const waited = (since: IsoDate | undefined): number | null =>
    since === undefined || since === '' ? null : daysBetween(since, now);

  const sinceDismissed = waited(input.lastDismissed);
  if (sinceDismissed !== null && sinceDismissed < NAG_INTERVAL_DAYS) return undefined;

  const sinceBackup = waited(input.lastBackup);
  if (sinceBackup !== null && sinceBackup < NAG_INTERVAL_DAYS) return undefined;

  return {
    message:
      sinceBackup === null
        ? `${input.entries} entries and no backup yet. Browsers clear site data without ` +
          'warning. One tap saves a file you can restore from.'
        : `Last backup was ${sinceBackup} days ago. Worth doing another before you lose anything.`,
    actionLabel: 'Download a backup',
  };
}
