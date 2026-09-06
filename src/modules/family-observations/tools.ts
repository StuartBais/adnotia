// The log.
//
// One form, one list, and nothing that reacts to how full it is. Adding a
// fifteenth entry looks exactly like adding a first — a count that grows is a
// score, and docs/04-family-space.md is explicit that nothing here is scored.

import {
  chips,
  el,
  textInput,
  type IsoDate,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { TOOL_STRINGS, WHERE } from './strings';
import { newId, record, renderRecords, type Observation, type ObservationsSlice } from './entries';

function sliceOf(context: ToolContext): ObservationsSlice {
  return { version: 1, days: {}, ...(context.slice as ObservationsSlice | undefined) };
}

function mount(container: HTMLElement, context: ToolContext): void {
  const draft: { where: string; date: IsoDate } = { where: 'home', date: context.today };
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});

  const paintList = (): void => renderRecords(list, { slice: sliceOf(context) });

  // A date rather than a time: the kernel has no date-input primitive, and the
  // calendar is a picker for which day to view rather than a field.
  const dateField = el('div', { class: 'field' }, [
    el('label', { for: 'obs-date', text: TOOL_STRINGS.when }),
    el('input', { type: 'date', id: 'obs-date', value: context.today, max: context.today }),
  ]);
  const dateInput = dateField.querySelector('input') as HTMLInputElement;
  dateInput.addEventListener('change', () => {
    draft.date = dateInput.value === '' ? context.today : dateInput.value;
  });

  const where = chips({
    label: TOOL_STRINGS.where,
    options: WHERE.map((option) => ({ v: option.v, l: option.l })),
    value: draft.where,
    optional: false,
    onChange: (value) => {
      if (value !== '') draft.where = value;
    },
  });

  const what = textInput({
    label: TOOL_STRINGS.what,
    hint: TOOL_STRINGS.whatHint,
    multiline: true,
  });
  const before = textInput({
    label: TOOL_STRINGS.before,
    hint: TOOL_STRINGS.beforeHint,
    optional: true,
  });
  const helped = textInput({
    label: TOOL_STRINGS.helped,
    hint: TOOL_STRINGS.helpedHint,
    optional: true,
  });

  const add = el('button', { type: 'button', class: 'btn primary', text: TOOL_STRINGS.add });
  add.addEventListener('click', () => {
    const text = what.value().trim();
    if (text === '') {
      status.textContent = TOOL_STRINGS.needWhat;
      return;
    }
    const entry: Observation = {
      id: newId(),
      where: draft.where,
      what: text,
      ...(before.value().trim() === '' ? {} : { before: before.value().trim() }),
      ...(helped.value().trim() === '' ? {} : { helped: helped.value().trim() }),
    };
    context.save(record(sliceOf(context), draft.date, entry));
    what.set('');
    before.set('');
    helped.set('');
    // The same word every time.
    status.textContent = TOOL_STRINGS.added;
    paintList();
  });

  container.append(
    el('p', { class: 'sub', text: TOOL_STRINGS.sub }),
    dateField,
    where.element,
    what.element,
    before.element,
    helped.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    el('h3', { text: TOOL_STRINGS.listTitle }),
    list,
  );
  paintList();
}

export const tools: Tool[] = [
  {
    title: TOOL_STRINGS.title,
    icon: 'note',
    mount: (container, kernel) => mount(container, kernel as ToolContext),
  },
];
