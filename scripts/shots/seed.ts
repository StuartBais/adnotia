// The record the screenshots are taken of.
//
// Built from the modules' own `thirtyDays` fixtures rather than from a JSON blob
// pasted in here. That is the whole point of this file: a hand-copied document
// goes stale the first time a field is renamed, and the failure is silent —
// the app renders an empty day, the screenshot still gets taken, and the
// welcome page shows a picture of an app with nothing in it. Importing the real
// fixtures means a rename breaks `npm run shots` at the type level instead.
//
// It is one person's app, not a demo of everything at once, but every adult
// module is on: the index is a picture of how tools are found, and an index
// with two cards in it does not show that.

import { createDocument, type AdnotiaDocument } from '../../src/kernel/store/document';
import { thirtyDays as medication } from '../../src/modules/medication/fixtures/index';
import { thirtyDays as sleep } from '../../src/modules/sleep/fixtures/index';
import { thirtyDays as planning } from '../../src/modules/planning/fixtures/index';
import { thirtyDays as mindfulness } from '../../src/modules/mindfulness/fixtures/index';
import { thirtyDays as exercise } from '../../src/modules/exercise/fixtures/index';
import { thirtyDays as preparation } from '../../src/modules/preparation/fixtures/index';

/**
 * The day the screenshots are taken on.
 *
 * The fixtures run 1 to 30 September 2026, and Today shows the logging day, so
 * an unpinned clock would photograph an empty check-in on every day but one.
 * `shots.mjs` freezes the page's clock here, which also makes the images
 * reproducible: regenerate them in a year and a difference means the interface
 * changed, not that time passed.
 *
 * Evening, so the logging day is the 30th rather than the 29th under the
 * before-04:00 rule.
 */
export const PINNED = '2026-09-30T20:15:00';

/** The last day in the fixtures, and so the one Today is showing. */
const TODAY = '2026-09-30';

export function seedDocument(): AdnotiaDocument {
  const doc = createDocument({ space: 'adult', now: new Date('2026-08-30T09:00:00Z') });

  doc.kernel.enabledModules = [
    'medication',
    'sleep',
    'planning',
    'mindfulness',
    'exercise',
    'preparation',
  ];
  /*
   * Not the order they were enabled in. A person orders their own check-in, and
   * medication first makes Today open on a dose field — which is the picture of
   * this app that Milestone 9 existed to stop being true. The check-in is
   * assembled from what somebody turned on, and a screenshot of it should look
   * assembled.
   */
  doc.kernel.moduleOrder = [
    'planning',
    'mindfulness',
    'medication',
    'sleep',
    'exercise',
    'preparation',
  ];
  doc.kernel.settings.firstRunComplete = true;
  doc.kernel.baseline = {
    focus: 2,
    mood: 2,
    sleep: '6',
    note: 'Before starting anything, on an ordinary week.',
  };
  doc.kernel.lastAppointment = '2026-09-01';
  doc.kernel.lastBackup = TODAY;
  doc.kernel.questions = [
    {
      id: 'q1',
      text: 'It wears off around four. Is that expected on this dose?',
      added: '2026-09-18',
    },
    {
      id: 'q2',
      text: 'Appetite is down at lunchtime. What do people do about that?',
      added: '2026-09-24',
    },
  ];

  // Wins and misses are the kernel's own daily fields, so they are not in any
  // module fixture. A handful, not thirty: most days nobody writes one, and a
  // column full of them would be a picture of an app nobody has.
  const kernelDays: Record<string, { win?: string; miss?: string }> = {
    '2026-09-12': { win: 'Got the tax thing filed with a day to spare.' },
    '2026-09-17': { miss: 'Meant to ring the surgery, did not ring the surgery.' },
    '2026-09-23': {
      win: 'Cleared the kitchen before it got bad.',
      miss: 'Late to the school run.',
    },
    '2026-09-29': { win: 'Sat down and read for half an hour.' },
    [TODAY]: { win: 'Finished the thing I had been avoiding since Tuesday.' },
  };
  for (const [date, day] of Object.entries(kernelDays)) {
    doc.kernel.days[date] = { createdAt: `${date}T21:30:00.000Z`, ...day };
  }

  doc.modules = { medication, sleep, planning, mindfulness, exercise, preparation };
  return doc;
}
