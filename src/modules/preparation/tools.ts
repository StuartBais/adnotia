// The log itself.
//
// One form, one list. Nothing here scores, counts toward anything, or reacts to
// what has been written: adding a fifth entry looks exactly like adding a first.
// See docs/decisions/ADR-024-preparing-for-an-assessment.md.

import {
  chips,
  el,
  textInput,
  type IsoDate,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { CHILDHOOD_STRINGS, TOOL_STRINGS, WHERE } from './strings';
import { allEntries, renderRecords, type PreparationEntry, type PreparationSlice } from './entries';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sliceOf(context: ToolContext): PreparationSlice {
  const slice = context.slice as PreparationSlice | undefined;
  return { version: 1, days: {}, ...slice };
}

function mountLog(container: HTMLElement, context: ToolContext): void {
  const draft: { where: string; what: string; before: string; cost: string; date: IsoDate } = {
    where: 'work',
    what: '',
    before: '',
    cost: '',
    date: context.today,
  };

  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});

  function paintList(): void {
    renderRecords(list, { slice: sliceOf(context) });
  }

  // A date rather than a time, and the kernel has no date-input primitive yet:
  // the calendar is a picker for choosing which day to view, not a field. This
  // defaults to today and lets the person say it happened earlier.
  const dateField = el('div', { class: 'field' }, [
    el('label', { for: 'prep-date', text: TOOL_STRINGS.when }),
    el('input', { type: 'date', id: 'prep-date', value: context.today, max: context.today }),
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
      draft.where = value;
    },
  });

  const what = textInput({
    label: TOOL_STRINGS.what,
    hint: TOOL_STRINGS.whatHint,
    multiline: true,
    onChange: (value) => {
      draft.what = value;
    },
  });
  const before = textInput({
    label: TOOL_STRINGS.before,
    hint: TOOL_STRINGS.beforeHint,
    optional: true,
    onChange: (value) => {
      draft.before = value;
    },
  });
  const cost = textInput({
    label: TOOL_STRINGS.cost,
    hint: TOOL_STRINGS.costHint,
    optional: true,
    onChange: (value) => {
      draft.cost = value;
    },
  });

  const add = el('button', { type: 'button', class: 'btn primary', text: TOOL_STRINGS.add });
  add.addEventListener('click', () => {
    if (draft.what.trim() === '') {
      status.textContent = TOOL_STRINGS.needWhat;
      return;
    }
    const slice = sliceOf(context);
    const days = { ...(slice.days ?? {}) };
    const entry: PreparationEntry = {
      id: newId(),
      where: draft.where,
      what: draft.what.trim(),
      ...(draft.before.trim() === '' ? {} : { before: draft.before.trim() }),
      ...(draft.cost.trim() === '' ? {} : { cost: draft.cost.trim() }),
    };
    days[draft.date] = { entries: [...(days[draft.date]?.entries ?? []), entry] };
    context.save({ ...slice, days });

    draft.what = '';
    draft.before = '';
    draft.cost = '';
    what.set('');
    before.set('');
    cost.set('');
    // The same words every time. A count here would be a score in disguise.
    status.textContent = TOOL_STRINGS.added;
    paintList();
  });

  container.append(
    el('p', { class: 'sub', text: TOOL_STRINGS.sub }),
    dateField,
    where.element,
    what.element,
    before.element,
    cost.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    el('h3', { text: TOOL_STRINGS.listTitle }),
    list,
  );
  paintList();
}

function mountChildhood(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const prompts = el('ul', { class: 'plain' });
  for (const prompt of CHILDHOOD_STRINGS.wherePrompts) prompts.append(el('li', { text: prompt }));

  const note = textInput({
    label: CHILDHOOD_STRINGS.label,
    hint: CHILDHOOD_STRINGS.hint,
    multiline: true,
    value: sliceOf(context).childhood ?? '',
    optional: true,
    onChange: (value) => {
      context.save({ ...sliceOf(context), childhood: value });
      status.textContent = CHILDHOOD_STRINGS.saved;
    },
  });

  container.append(
    el('p', { class: 'sub', text: CHILDHOOD_STRINGS.sub }),
    prompts,
    note.element,
    status,
  );
}

export const tools: Tool[] = [
  {
    title: TOOL_STRINGS.title,
    icon: 'note',
    mount: (container, kernel) => mountLog(container, kernel as ToolContext),
  },
  {
    title: CHILDHOOD_STRINGS.title,
    icon: 'past',
    mount: (container, kernel) => mountChildhood(container, kernel as ToolContext),
  },
];

/** Exported for the smoke test, which needs to know what a fresh slice holds. */
export { allEntries };
