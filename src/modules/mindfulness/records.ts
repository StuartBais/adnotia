// The practice log, day by day. Read-only, and it counts nothing.

import { el, formatShortDate, formatWeekday, type IsoDate } from '../../kernel/index';
import { byId } from './practices';
import { TOOL_STRINGS } from './strings';
import type { MindfulnessDay } from './state';

export function renderRecords(
  container: HTMLElement,
  context: { dates: readonly IsoDate[]; days: Readonly<Record<IsoDate, MindfulnessDay>> },
): void {
  container.replaceChildren();
  let anything = false;

  for (const date of [...context.dates].reverse()) {
    const done = context.days[date]?.sessions ?? [];
    if (done.length === 0) continue;
    anything = true;
    container.append(
      el('div', { class: 'entry' }, [
        el('b', { text: `${formatShortDate(date)}, ${formatWeekday(date)}` }),
        el('span', {
          text: done
            .map((session) =>
              TOOL_STRINGS.entry(byId(session.practice)?.name ?? session.practice, session.minutes),
            )
            .join(' · '),
        }),
      ]),
    );
  }

  if (!anything) container.append(el('p', { class: 'hint', text: TOOL_STRINGS.empty }));
}
