// What a parent sets up.
//
// Four tools, one of which only reads: the praise prompts are worked examples
// rather than something to fill in.
//
// The chart is the one with a rule attached. docs/04-family-space.md permits it
// where engagement mechanics are banned everywhere else, and the permission is
// conditional: "The app never awards, removes or reminds about points on its own
// initiative." So a star moves only when a parent presses something, there is no
// button that removes one, and starting again at zero is behind a confirmation
// that says what it is for.

import {
  el,
  formatClockTime,
  numberInput,
  rewardChart,
  textInput,
  timeInput,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { CHART_STRINGS, FIRST_THEN_STRINGS, PRAISE_STRINGS, ROUTINE_STRINGS } from './strings';
import {
  award,
  newId,
  ordered,
  reachedGoal,
  startAgain,
  type Chart,
  type Routine,
  type RoutineStep,
  type RoutinesSlice,
} from './state';

function sliceOf(context: ToolContext): RoutinesSlice {
  return { version: 1, ...(context.slice as RoutinesSlice | undefined) };
}

const button = (text: string, className = 'btn small'): HTMLButtonElement =>
  el('button', { type: 'button', class: className, text });

function row(body: (Node | string)[], actions: HTMLElement[]): HTMLElement {
  return el('div', { class: 'plan-row' }, [
    el('div', { class: 'plan-body' }, body),
    el('div', { class: 'plan-acts' }, actions),
  ]);
}

// ------------------------------------------------------------------ routines

function mountRoutines(container: HTMLElement, context: ToolContext): void {
  let draftSteps: RoutineStep[] = [];
  const status = el('p', { class: 'bmsg', role: 'status' });
  const list = el('div', {});
  const pending = el('div', {});

  const name = textInput({
    label: ROUTINE_STRINGS.name,
    placeholder: ROUTINE_STRINGS.namePlaceholder,
  });
  const step = textInput({
    label: ROUTINE_STRINGS.step,
    placeholder: ROUTINE_STRINGS.stepPlaceholder,
  });
  const at = timeInput({ label: ROUTINE_STRINGS.at, optional: true });

  function paintPending(): void {
    pending.replaceChildren();
    for (const draft of ordered(draftSteps)) {
      const drop = button(ROUTINE_STRINGS.removeStep);
      drop.addEventListener('click', () => {
        draftSteps = draftSteps.filter((other) => other.id !== draft.id);
        paintPending();
      });
      pending.append(
        row(
          [
            ...((draft.at ?? '') === ''
              ? []
              : [el('span', { class: 'plan-at', text: formatClockTime(draft.at as string) })]),
            el('span', { text: draft.text }),
          ],
          [drop],
        ),
      );
    }
  }

  const addStep = button(ROUTINE_STRINGS.addStep);
  addStep.addEventListener('click', () => {
    const text = step.value().trim();
    if (text === '') return;
    const time = at.value();
    draftSteps = [...draftSteps, { id: newId(), text, ...(time === '' ? {} : { at: time }) }];
    step.set('');
    at.set('');
    paintPending();
  });

  function save(routines: Routine[]): void {
    context.save({ ...sliceOf(context), routines });
    paint();
  }

  function paint(): void {
    const routines = sliceOf(context).routines ?? [];
    list.replaceChildren();
    if (routines.length === 0) {
      list.append(el('p', { class: 'hint', text: ROUTINE_STRINGS.empty }));
      return;
    }
    for (const routine of routines) {
      const drop = button(ROUTINE_STRINGS.remove);
      drop.addEventListener('click', () =>
        save(routines.filter((other) => other.id !== routine.id)),
      );
      const steps = el('div', {});
      for (const item of ordered(routine.steps)) {
        steps.append(
          row(
            [
              ...((item.at ?? '') === ''
                ? []
                : [el('span', { class: 'plan-at', text: formatClockTime(item.at as string) })]),
              el('span', { text: item.text }),
            ],
            [],
          ),
        );
      }
      list.append(
        el('div', { class: 'plan-task' }, [
          el('div', { class: 'plan-head' }, [el('b', { text: routine.name }), drop]),
          steps,
        ]),
      );
    }
  }

  const create = el('button', {
    type: 'button',
    class: 'btn primary',
    text: ROUTINE_STRINGS.create,
  });
  create.addEventListener('click', () => {
    const label = name.value().trim();
    if (label === '') {
      status.textContent = ROUTINE_STRINGS.needName;
      return;
    }
    // Whatever is still in the step box counts: losing it because Add was not
    // pressed first is a small betrayal a tired parent does not need.
    const trailing = step.value().trim();
    const time = at.value();
    const steps =
      trailing === ''
        ? draftSteps
        : [...draftSteps, { id: newId(), text: trailing, ...(time === '' ? {} : { at: time }) }];

    save([...(sliceOf(context).routines ?? []), { id: newId(), name: label, steps }]);
    name.set('');
    step.set('');
    at.set('');
    draftSteps = [];
    paintPending();
    status.textContent = '';
  });

  container.append(
    el('p', { class: 'sub', text: ROUTINE_STRINGS.sub }),
    name.element,
    step.element,
    at.element,
    el('div', { class: 'btnrow' }, [addStep]),
    pending,
    el('div', { class: 'btnrow' }, [create]),
    status,
    list,
  );
  paint();
}

// --------------------------------------------------------------- first / then

function mountFirstThen(container: HTMLElement, context: ToolContext): void {
  const status = el('p', { class: 'bmsg', role: 'status' });
  const current = el('p', { class: 'hint' });

  const first = textInput({
    label: FIRST_THEN_STRINGS.first,
    placeholder: FIRST_THEN_STRINGS.firstPlaceholder,
  });
  const then = textInput({
    label: FIRST_THEN_STRINGS.then,
    placeholder: FIRST_THEN_STRINGS.thenPlaceholder,
  });

  function paint(): void {
    const pair = sliceOf(context).firstThen;
    current.textContent =
      pair === undefined
        ? FIRST_THEN_STRINGS.none
        : FIRST_THEN_STRINGS.current(pair.first, pair.then);
  }

  const save = el('button', {
    type: 'button',
    class: 'btn primary',
    text: FIRST_THEN_STRINGS.save,
  });
  save.addEventListener('click', () => {
    const a = first.value().trim();
    const b = then.value().trim();
    if (a === '' || b === '') {
      status.textContent = FIRST_THEN_STRINGS.needBoth;
      return;
    }
    context.save({ ...sliceOf(context), firstThen: { first: a, then: b } });
    status.textContent = '';
    paint();
  });

  const clear = button(FIRST_THEN_STRINGS.clear);
  clear.addEventListener('click', () => {
    const { firstThen: _gone, ...rest } = sliceOf(context);
    context.save(rest);
    first.set('');
    then.set('');
    paint();
  });

  container.append(
    el('p', { class: 'sub', text: FIRST_THEN_STRINGS.sub }),
    first.element,
    then.element,
    el('div', { class: 'btnrow' }, [save, clear]),
    status,
    current,
  );
  paint();
}

// --------------------------------------------------------------------- chart

export interface ChartToolOptions {
  /** Asked before starting the chart again. Injected so a test can answer it. */
  confirm?: (message: string) => boolean;
}

function mountChart(
  container: HTMLElement,
  context: ToolContext,
  options: ChartToolOptions = {},
): void {
  const ask = options.confirm ?? ((message: string) => globalThis.confirm(message));
  const status = el('p', { class: 'bmsg', role: 'status' });
  const board = el('div', {});

  const earns = textInput({
    label: CHART_STRINGS.earns,
    placeholder: CHART_STRINGS.earnsPlaceholder,
    value: sliceOf(context).chart?.earns ?? '',
  });
  const goal = numberInput({
    label: CHART_STRINGS.goal,
    optional: true,
    value: sliceOf(context).chart?.goal === undefined ? '' : String(sliceOf(context).chart?.goal),
  });
  const reward = textInput({
    label: CHART_STRINGS.reward,
    placeholder: CHART_STRINGS.rewardPlaceholder,
    optional: true,
    value: sliceOf(context).chart?.reward ?? '',
  });

  function write(chart: Chart): void {
    context.save({ ...sliceOf(context), chart });
    paint();
  }

  function paint(): void {
    const chart = sliceOf(context).chart;
    board.replaceChildren();
    if (chart === undefined) {
      board.append(el('p', { class: 'hint', text: CHART_STRINGS.none }));
      return;
    }

    const give = el('button', { type: 'button', class: 'btn primary', text: CHART_STRINGS.award });
    give.addEventListener('click', () => {
      write(award(sliceOf(context).chart));
      status.textContent = CHART_STRINGS.awarded;
    });

    const again = button(CHART_STRINGS.startAgain);
    again.addEventListener('click', () => {
      if (!ask(CHART_STRINGS.startAgainConfirm)) return;
      write(startAgain(sliceOf(context).chart));
      status.textContent = '';
    });

    board.append(
      rewardChart({
        nickname: context.nickname ?? '',
        points: chart.points,
        ...(chart.goal === undefined ? {} : { goal: chart.goal }),
      }),
      el('p', { class: 'hint', text: `A star for: ${chart.earns}` }),
      ...(reachedGoal(chart) ? [el('p', { class: 'hint', text: CHART_STRINGS.reached })] : []),
      el('div', { class: 'btnrow' }, [give, again]),
      el('p', { class: 'hint', text: CHART_STRINGS.neverTakes }),
    );
  }

  const save = el('button', { type: 'button', class: 'btn', text: CHART_STRINGS.save });
  save.addEventListener('click', () => {
    const what = earns.value().trim();
    if (what === '') {
      status.textContent = CHART_STRINGS.needEarns;
      return;
    }
    const target = Number.parseFloat(goal.value());
    const prize = reward.value().trim();
    write({
      earns: what,
      points: sliceOf(context).chart?.points ?? 0,
      ...(Number.isFinite(target) && target > 0 ? { goal: target } : {}),
      ...(prize === '' ? {} : { reward: prize }),
    });
    status.textContent = '';
  });

  container.append(
    el('p', { class: 'sub', text: CHART_STRINGS.sub }),
    earns.element,
    goal.element,
    reward.element,
    el('div', { class: 'btnrow' }, [save]),
    status,
    board,
  );
  paint();
}

// --------------------------------------------------------------------- praise

function mountPraise(container: HTMLElement): void {
  const how = el('ul', { class: 'plain' });
  for (const line of PRAISE_STRINGS.how) how.append(el('li', { text: line }));

  const examples = el('div', {});
  for (const [instead, tryThis] of PRAISE_STRINGS.examples) {
    examples.append(
      el('div', { class: 'plan-row' }, [
        el('div', { class: 'plan-body' }, [
          el('span', { class: 'praise-instead', text: instead }),
          el('span', { text: tryThis }),
        ]),
      ]),
    );
  }

  container.append(
    el('p', { class: 'sub', text: PRAISE_STRINGS.sub }),
    el('h3', { text: PRAISE_STRINGS.howTitle }),
    how,
    el('h3', { text: PRAISE_STRINGS.examplesTitle }),
    examples,
  );
}

export function tools(options: ChartToolOptions = {}): Tool[] {
  return [
    {
      title: ROUTINE_STRINGS.title,
      icon: 'list',
      mount: (container, kernel) => mountRoutines(container, kernel as ToolContext),
    },
    {
      title: FIRST_THEN_STRINGS.title,
      icon: 'arrow',
      mount: (container, kernel) => mountFirstThen(container, kernel as ToolContext),
    },
    {
      title: CHART_STRINGS.title,
      icon: 'star',
      mount: (container, kernel) => mountChart(container, kernel as ToolContext, options),
    },
    {
      title: PRAISE_STRINGS.title,
      icon: 'say',
      mount: (container) => mountPraise(container),
    },
  ];
}
