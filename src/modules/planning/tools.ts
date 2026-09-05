// The four tools.
//
// Each is small on purpose. docs/08-roadmap.md sets the bar as planning a morning
// in under a minute, and a planner that takes longer to run than the morning it
// plans is a way of avoiding the morning.
//
// Two of them carry their own tier: docs/02-evidence-rubric.md lists task-breaking
// templates and implementation-intention prompts among its Tier C examples while
// rating the toolkit Tier A. See ADR-025.

import {
  el,
  formatClockTime,
  numberInput,
  textInput,
  timeInput,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { BREAK_STRINGS, ESTIMATE_STRINGS, INTENTION_STRINGS, PLAN_STRINGS } from './strings';
import {
  MIN_TIMED,
  newId,
  nextStep,
  ordered,
  planFor,
  reality,
  type Estimate,
  type Intention,
  type PlanItem,
  type PlanningSlice,
  type Task,
} from './state';

function sliceOf(context: ToolContext): PlanningSlice {
  return { version: 1, ...(context.slice as PlanningSlice | undefined) };
}

const button = (text: string, className = 'btn small'): HTMLButtonElement =>
  el('button', { type: 'button', class: className, text });

/** A row with a body and a control on the right. Used by every list here. */
function row(children: (Node | string)[], actions: HTMLElement[]): HTMLElement {
  return el('div', { class: 'plan-row' }, [
    el('div', { class: 'plan-body' }, children),
    el('div', { class: 'plan-acts' }, actions),
  ]);
}

// ------------------------------------------------------------ break it down

function mountBreak(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});
  let draftSteps: string[] = [];

  const title = textInput({
    label: BREAK_STRINGS.what,
    placeholder: BREAK_STRINGS.whatPlaceholder,
  });
  const step = textInput({ label: BREAK_STRINGS.step, placeholder: BREAK_STRINGS.stepPlaceholder });
  const pending = el('ul', { class: 'plain' });

  function paintPending(): void {
    pending.replaceChildren();
    for (const text of draftSteps) pending.append(el('li', { text }));
  }

  const addStep = button(BREAK_STRINGS.addStep);
  addStep.addEventListener('click', () => {
    const text = step.value().trim();
    if (text === '') return;
    draftSteps = [...draftSteps, text];
    step.set('');
    paintPending();
  });

  function save(tasks: Task[]): void {
    context.save({ ...sliceOf(context), tasks });
    paint();
  }

  function paint(): void {
    const tasks = sliceOf(context).tasks ?? [];
    list.replaceChildren();
    if (tasks.length === 0) {
      list.append(el('p', { class: 'hint', text: BREAK_STRINGS.nothing }));
      return;
    }

    for (const task of tasks) {
      const next = nextStep(task);
      const steps = el('div', {});
      for (const item of task.steps) {
        const mark = button(item.done === true ? BREAK_STRINGS.undo : BREAK_STRINGS.done);
        mark.addEventListener('click', () => {
          save(
            tasks.map((other) =>
              other.id !== task.id
                ? other
                : {
                    ...other,
                    steps: other.steps.map((s) =>
                      s.id === item.id ? { ...s, done: item.done !== true } : s,
                    ),
                  },
            ),
          );
        });
        const body: (Node | string)[] = [el('span', { text: item.text })];
        // The one piece of emphasis in the tool, and it is on the next action
        // rather than on progress.
        if (next?.id === item.id) {
          body.unshift(el('span', { class: 'tag', text: BREAK_STRINGS.startHere }));
        }
        steps.append(row(body, [mark]));
      }

      const remove = button(BREAK_STRINGS.remove);
      remove.addEventListener('click', () => save(tasks.filter((other) => other.id !== task.id)));

      list.append(
        el('div', { class: 'plan-task' }, [
          el('div', { class: 'plan-head' }, [el('b', { text: task.title }), remove]),
          steps,
          ...(next === undefined && task.steps.length > 0
            ? [el('p', { class: 'hint', text: BREAK_STRINGS.finished })]
            : []),
        ]),
      );
    }
  }

  const add = el('button', { type: 'button', class: 'btn primary', text: BREAK_STRINGS.addTask });
  add.addEventListener('click', () => {
    const name = title.value().trim();
    if (name === '') {
      status.textContent = BREAK_STRINGS.needTitle;
      return;
    }
    const pendingText = step.value().trim();
    const texts = pendingText === '' ? draftSteps : [...draftSteps, pendingText];
    const task: Task = {
      id: newId(),
      title: name,
      created: context.today,
      steps: texts.map((text) => ({ id: newId(), text })),
    };
    context.save({ ...sliceOf(context), tasks: [task, ...(sliceOf(context).tasks ?? [])] });
    title.set('');
    step.set('');
    draftSteps = [];
    paintPending();
    status.textContent = '';
    paint();
  });

  container.append(
    el('p', { class: 'sub', text: BREAK_STRINGS.sub }),
    title.element,
    step.element,
    el('div', { class: 'btnrow' }, [addStep]),
    pending,
    el('div', { class: 'btnrow' }, [add]),
    status,
    list,
  );
  paint();
}

// ------------------------------------------------------------- how long

function mountEstimate(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});
  const realityLine = el('p', { class: 'hint' });

  const title = textInput({
    label: ESTIMATE_STRINGS.what,
    placeholder: ESTIMATE_STRINGS.whatPlaceholder,
  });
  const minutes = numberInput({ label: ESTIMATE_STRINGS.minutes });

  function save(estimates: Estimate[]): void {
    context.save({ ...sliceOf(context), estimates });
    paint();
  }

  function paint(): void {
    const estimates = sliceOf(context).estimates ?? [];
    const check = reality(estimates);

    if (check === undefined) {
      const timed = estimates.filter((estimate) => typeof estimate.actual === 'number').length;
      realityLine.textContent = ESTIMATE_STRINGS.tooFew(Math.max(1, MIN_TIMED - timed));
      realityLine.className = 'hint';
    } else {
      realityLine.textContent = `${ESTIMATE_STRINGS.reality(check)} ${ESTIMATE_STRINGS.realityHint}`;
      realityLine.className = 'hint';
    }

    list.replaceChildren();
    if (estimates.length === 0) {
      list.append(el('p', { class: 'hint', text: ESTIMATE_STRINGS.nothing }));
      return;
    }

    for (const estimate of estimates) {
      const body: (Node | string)[] = [
        el('span', { text: `${estimate.title} — guessed ${estimate.minutes} min` }),
      ];
      const actions: HTMLElement[] = [];

      if (typeof estimate.actual === 'number') {
        body.push(el('span', { class: 'plan-actual', text: `took ${estimate.actual} min` }));
      } else {
        const actual = numberInput({ label: ESTIMATE_STRINGS.actual });
        const record = button(ESTIMATE_STRINGS.record);
        record.addEventListener('click', () => {
          const value = Number.parseFloat(actual.value());
          if (!Number.isFinite(value) || value <= 0) return;
          save(
            estimates.map((other) =>
              other.id === estimate.id ? { ...other, actual: value } : other,
            ),
          );
        });
        body.push(actual.element);
        actions.push(record);
      }

      const remove = button(PLAN_STRINGS.remove);
      remove.addEventListener('click', () =>
        save(estimates.filter((other) => other.id !== estimate.id)),
      );
      actions.push(remove);
      list.append(row(body, actions));
    }
  }

  const add = el('button', { type: 'button', class: 'btn primary', text: ESTIMATE_STRINGS.add });
  add.addEventListener('click', () => {
    const name = title.value().trim();
    const guess = Number.parseFloat(minutes.value());
    if (name === '' || !Number.isFinite(guess) || guess <= 0) {
      status.textContent = ESTIMATE_STRINGS.needBoth;
      return;
    }
    const estimate: Estimate = { id: newId(), title: name, minutes: guess, date: context.today };
    context.save({
      ...sliceOf(context),
      estimates: [estimate, ...(sliceOf(context).estimates ?? [])],
    });
    title.set('');
    minutes.set('');
    status.textContent = '';
    paint();
  });

  container.append(
    el('p', { class: 'sub', text: ESTIMATE_STRINGS.sub }),
    realityLine,
    title.element,
    minutes.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    list,
  );
  paint();
}

// ------------------------------------------------------------ today's plan

function mountPlan(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});

  const item = textInput({ label: PLAN_STRINGS.item, placeholder: PLAN_STRINGS.itemPlaceholder });
  const at = timeInput({ label: PLAN_STRINGS.at, optional: true });

  function save(items: PlanItem[]): void {
    const slice = sliceOf(context);
    context.save({
      ...slice,
      plans: { ...(slice.plans ?? {}), [context.today]: { items } },
    });
    paint();
  }

  function paint(): void {
    const items = ordered(planFor(sliceOf(context), context.today));
    list.replaceChildren();
    if (items.length === 0) {
      list.append(el('p', { class: 'hint', text: PLAN_STRINGS.empty }));
      return;
    }
    for (const entry of items) {
      const remove = button(PLAN_STRINGS.remove);
      remove.addEventListener('click', () =>
        save(planFor(sliceOf(context), context.today).filter((other) => other.id !== entry.id)),
      );
      const body: (Node | string)[] = [];
      if ((entry.at ?? '') !== '') {
        body.push(el('span', { class: 'plan-at', text: formatClockTime(entry.at as string) }));
      }
      body.push(el('span', { text: entry.text }));
      list.append(row(body, [remove]));
    }
  }

  const add = el('button', { type: 'button', class: 'btn primary', text: PLAN_STRINGS.add });
  add.addEventListener('click', () => {
    const text = item.value().trim();
    if (text === '') {
      status.textContent = PLAN_STRINGS.needItem;
      return;
    }
    const time = at.value();
    save([
      ...planFor(sliceOf(context), context.today),
      { id: newId(), text, ...(time === '' ? {} : { at: time }) },
    ]);
    item.set('');
    at.set('');
    status.textContent = '';
  });

  container.append(
    el('p', { class: 'sub', text: PLAN_STRINGS.sub }),
    item.element,
    at.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    list,
  );
  paint();
}

// ------------------------------------------------------------- if / then

function mountIntentions(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});

  const cue = textInput({
    label: INTENTION_STRINGS.cue,
    placeholder: INTENTION_STRINGS.cuePlaceholder,
  });
  const action = textInput({
    label: INTENTION_STRINGS.action,
    placeholder: INTENTION_STRINGS.actionPlaceholder,
  });

  function save(intentions: Intention[]): void {
    context.save({ ...sliceOf(context), intentions });
    paint();
  }

  function paint(): void {
    const intentions = sliceOf(context).intentions ?? [];
    list.replaceChildren();
    if (intentions.length === 0) {
      list.append(el('p', { class: 'hint', text: INTENTION_STRINGS.empty }));
      return;
    }
    for (const intention of intentions) {
      const remove = button(INTENTION_STRINGS.remove);
      remove.addEventListener('click', () =>
        save(intentions.filter((other) => other.id !== intention.id)),
      );
      list.append(
        row([el('span', { text: `If ${intention.cue}, then ${intention.action}.` })], [remove]),
      );
    }
  }

  const add = el('button', { type: 'button', class: 'btn primary', text: INTENTION_STRINGS.add });
  add.addEventListener('click', () => {
    const ifPart = cue.value().trim();
    const thenPart = action.value().trim();
    if (ifPart === '' || thenPart === '') {
      status.textContent = INTENTION_STRINGS.needBoth;
      return;
    }
    save([{ id: newId(), cue: ifPart, action: thenPart }, ...(sliceOf(context).intentions ?? [])]);
    cue.set('');
    action.set('');
    status.textContent = '';
  });

  container.append(
    el('p', { class: 'sub', text: INTENTION_STRINGS.sub }),
    cue.element,
    action.element,
    el('div', { class: 'btnrow' }, [add]),
    status,
    list,
  );
  paint();
}

export const tools: Tool[] = [
  {
    title: PLAN_STRINGS.title,
    icon: 'list',
    mount: (container, kernel) => mountPlan(container, kernel as ToolContext),
  },
  {
    title: BREAK_STRINGS.title,
    icon: 'steps',
    // docs/02-evidence-rubric.md names task-breaking templates as a Tier C example.
    tier: 'C',
    mount: (container, kernel) => mountBreak(container, kernel as ToolContext),
  },
  {
    title: ESTIMATE_STRINGS.title,
    icon: 'clock',
    mount: (container, kernel) => mountEstimate(container, kernel as ToolContext),
  },
  {
    title: INTENTION_STRINGS.title,
    icon: 'ifthen',
    // Named in the same list, with this exact example.
    tier: 'C',
    mount: (container, kernel) => mountIntentions(container, kernel as ToolContext),
  },
];
