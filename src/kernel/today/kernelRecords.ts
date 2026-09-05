// The kernel's own fields, shown back in History.
//
// Wins, misses and the day's note are kernel fields (docs/01-module-contract.md
// "What moved to the kernel"), so no module's `records` contribution can show
// them and History was silently dropping them. A person who wrote "started the
// tax forms" against a Tuesday should be able to find it again.
//
// Read-only, like every other History contribution: nothing here computes
// anything the person has not already seen on the day they wrote it.

import { formatShortDate, formatWeekday, type IsoDate } from '../dates/index';
import type { KernelDay } from '../store/document';
import { el } from '../ui/index';

/** The card this fills, in the person's History. */
export const KERNEL_RECORDS_TITLE = 'What actually happened';

/** The prefixes the monolith used, kept so a returning person recognises them. */
const LABELS: readonly { field: keyof KernelDay; prefix: string }[] = [
  { field: 'win', prefix: 'Better: ' },
  { field: 'miss', prefix: 'Fell apart: ' },
  { field: 'notes', prefix: '' },
];

export interface KernelRecordsContext {
  dates: readonly IsoDate[];
  days: Readonly<Record<IsoDate, KernelDay>>;
}

export function renderKernelRecords(container: HTMLElement, context: KernelRecordsContext): void {
  container.replaceChildren();

  for (const date of [...context.dates].reverse()) {
    const day = context.days[date];
    if (day === undefined) continue;

    const lines: string[] = [];
    for (const { field, prefix } of LABELS) {
      const value = day[field];
      if (typeof value !== 'string' || value.trim() === '') continue;
      lines.push(prefix + value.trim());
    }
    if (lines.length === 0) continue;

    container.append(
      el('div', { class: 'entry' }, [
        el('b', { text: `${formatShortDate(date)}, ${formatWeekday(date)}` }),
        el('span', { text: lines.join(' · ') }),
      ]),
    );
  }
}
