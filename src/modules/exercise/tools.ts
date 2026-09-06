// One tool: note what you did.

import {
  chips,
  el,
  formatShortDate,
  formatWeekday,
  numberInput,
  textInput,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { KINDS, KIND_LABELS, LIMIT_NOTE, TOOL_STRINGS } from './strings';
import { describe, movements, newId, record, remove, type ExerciseSlice } from './state';

function sliceOf(context: ToolContext): ExerciseSlice {
  return { version: 1, ...(context.slice as ExerciseSlice | undefined) };
}

function mount(container: HTMLElement, context: ToolContext): void {
  let kind = KINDS[0]!.v as string;
  const status = el('p', { class: 'bmsg', role: 'status' });
  const history = el('div', {});

  const minutes = numberInput({ label: TOOL_STRINGS.minutes });
  const note = textInput({
    label: TOOL_STRINGS.note,
    placeholder: TOOL_STRINGS.notePlaceholder,
    optional: true,
  });

  const choose = chips({
    label: TOOL_STRINGS.kind,
    options: KINDS.map((option) => ({ v: option.v, l: option.l })),
    value: kind,
    optional: false,
    onChange: (value) => {
      if (value !== '') kind = value;
    },
  });

  function paint(): void {
    const noted = movements(sliceOf(context));
    history.replaceChildren();
    if (noted.length === 0) {
      history.append(el('p', { class: 'hint', text: TOOL_STRINGS.empty }));
      return;
    }
    for (const movement of noted) {
      const drop = el('button', { type: 'button', class: 'btn small', text: TOOL_STRINGS.remove });
      drop.addEventListener('click', () => {
        context.save(remove(sliceOf(context), movement.date, movement.id));
        paint();
      });
      history.append(
        el('div', { class: 'plan-row' }, [
          el('div', { class: 'plan-body' }, [
            el('b', { text: `${formatShortDate(movement.date)}, ${formatWeekday(movement.date)}` }),
            el('span', {
              text: ` ${describe(movement, KIND_LABELS.get(movement.kind) ?? movement.kind)}`,
            }),
          ]),
          el('div', { class: 'plan-acts' }, [drop]),
        ]),
      );
    }
  }

  const add = el('button', { type: 'button', class: 'btn primary', text: TOOL_STRINGS.add });
  add.addEventListener('click', () => {
    const howLong = Number.parseFloat(minutes.value());
    if (!Number.isFinite(howLong) || howLong <= 0) {
      status.textContent = TOOL_STRINGS.needMinutes;
      return;
    }
    const text = note.value().trim();
    context.save(
      record(sliceOf(context), context.today, {
        id: newId(),
        kind,
        minutes: howLong,
        ...(text === '' ? {} : { note: text }),
      }),
    );
    minutes.set('');
    note.set('');
    // The same word every time, however many there are.
    status.textContent = TOOL_STRINGS.added;
    paint();
  });

  container.append(
    el('p', { class: 'sub', text: TOOL_STRINGS.sub }),
    el('p', { class: 'tier', text: LIMIT_NOTE }),
    choose.element,
    minutes.element,
    note.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    el('h3', { text: TOOL_STRINGS.history }),
    history,
  );
  paint();
}

export const tools: Tool[] = [
  {
    title: TOOL_STRINGS.title,
    icon: 'move',
    mount: (container, kernel) => mount(container, kernel as ToolContext),
  },
];
