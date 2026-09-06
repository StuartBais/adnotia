// What was noted, day by day. Read-only, and it adds nothing up.

import { el, formatShortDate, formatWeekday, type IsoDate } from '../../kernel/index';
import { KIND_LABELS, TOOL_STRINGS } from './strings';
import { describe, type ExerciseDay } from './state';

export function renderRecords(
  container: HTMLElement,
  context: { dates: readonly IsoDate[]; days: Readonly<Record<IsoDate, ExerciseDay>> },
): void {
  container.replaceChildren();
  let anything = false;

  for (const date of [...context.dates].reverse()) {
    const noted = context.days[date]?.moved ?? [];
    if (noted.length === 0) continue;
    anything = true;
    container.append(
      el('div', { class: 'entry' }, [
        el('b', { text: `${formatShortDate(date)}, ${formatWeekday(date)}` }),
        el('span', {
          text: noted
            .map((movement) => describe(movement, KIND_LABELS.get(movement.kind) ?? movement.kind))
            .join(' · '),
        }),
      ]),
    );
  }

  if (!anything) container.append(el('p', { class: 'hint', text: TOOL_STRINGS.empty }));
}
