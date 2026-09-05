// What was planned, and how the day went.
//
// Read-only, and side by side on purpose: a plan without the day is a wish, and
// a day without the plan is just a day. Nothing here scores either.

import {
  el,
  formatClockTime,
  formatShortDate,
  formatWeekday,
  type IsoDate,
} from '../../kernel/index';
import { HELD_LABELS, PLAN_STRINGS } from './strings';
import { ordered, planFor, type PlanningDay, type PlanningSlice } from './state';

export function renderRecords(
  container: HTMLElement,
  context: {
    dates: readonly IsoDate[];
    days: Readonly<Record<IsoDate, PlanningDay>>;
    slice?: PlanningSlice;
  },
): void {
  container.replaceChildren();
  const slice = context.slice;

  const dates = new Set<IsoDate>([
    ...Object.keys(slice?.plans ?? {}),
    ...Object.keys(context.days),
  ]);

  let anything = false;
  for (const date of [...dates].sort().reverse()) {
    const items = ordered(planFor(slice, date));
    const held = context.days[date]?.held;
    if (items.length === 0 && (held ?? '') === '') continue;

    anything = true;
    const lines = items.map(
      (item) =>
        ((item.at ?? '') === '' ? '' : `${formatClockTime(item.at as string)} `) + item.text,
    );
    if ((held ?? '') !== '') lines.push(HELD_LABELS.get(held as string) ?? (held as string));

    container.append(
      el('div', { class: 'entry' }, [
        el('b', { text: `${formatShortDate(date)}, ${formatWeekday(date)}` }),
        el('span', { text: lines.join(' · ') }),
      ]),
    );
  }

  if (!anything) container.append(el('p', { class: 'hint', text: PLAN_STRINGS.empty }));
}
