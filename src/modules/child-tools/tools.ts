// The handed-over screen.
//
// docs/04-family-space.md lists exactly four things and this is those four: a
// visual timer, today's schedule, the first/then board, and the reward chart
// view only.
//
// Everything here reads. The schedule, the pair and the chart come from the
// parent's `family-routines` slice through `reads`, which is read-only by
// construction — a child module has no setter for another module's data and no
// way to reach one. The chart is rendered with `readOnly`, so the award control
// is not on the page a child is holding.
//
// The registry refuses a child module that declares a today field, a report,
// free text or a link. Nothing here declares any, and nothing here creates an
// input or an anchor either.

import {
  chips,
  el,
  formatClockTime,
  rewardChart,
  timer,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import {
  CHART_STRINGS,
  DURATIONS,
  FIRST_THEN_STRINGS,
  SCHEDULE_STRINGS,
  TIMER_STRINGS,
} from './strings';

/** The module a parent sets up. Declared as a dependency, read through `reads`. */
export const PARENT_MODULE = 'family-routines';

interface Step {
  id: string;
  text: string;
  at?: string;
}

interface ParentConfig {
  routines?: { id: string; name: string; steps: Step[] }[];
  firstThen?: { first: string; then: string };
  chart?: { earns: string; goal?: number; points: number };
}

function parentConfig(context: ToolContext): ParentConfig {
  return (context.reads[PARENT_MODULE] as ParentConfig | undefined) ?? {};
}

function ordered(steps: readonly Step[]): Step[] {
  const timed = steps.filter((step) => (step.at ?? '') !== '');
  const untimed = steps.filter((step) => (step.at ?? '') === '');
  return [...timed.sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')), ...untimed];
}

function mountTimer(container: HTMLElement): void {
  let clock: ReturnType<typeof timer> | undefined;
  const host = el('div', {});

  function show(minutes: number): void {
    clock?.destroy();
    clock = timer({ seconds: minutes * 60, doneText: TIMER_STRINGS.done });
    host.replaceChildren(clock.element);
  }

  const choose = chips({
    label: TIMER_STRINGS.choose,
    options: DURATIONS.map((minutes) => ({
      v: String(minutes),
      l: TIMER_STRINGS.minutes(minutes),
    })),
    value: String(DURATIONS[2]),
    optional: false,
    onChange: (value) => {
      if (value !== '') show(Number(value));
    },
  });

  container.append(choose.element, host);
  show(DURATIONS[2]);
}

function mountSchedule(container: HTMLElement, context: ToolContext): void {
  const routines = parentConfig(context).routines ?? [];
  if (routines.length === 0) {
    container.append(el('p', { class: 'child-none', text: SCHEDULE_STRINGS.none }));
    return;
  }

  for (const routine of routines) {
    const list = el('ol', { class: 'child-steps' });
    for (const step of ordered(routine.steps)) {
      list.append(
        el('li', {}, [
          ...((step.at ?? '') === ''
            ? []
            : [el('span', { class: 'plan-at', text: formatClockTime(step.at as string) })]),
          el('span', { text: step.text }),
        ]),
      );
    }
    container.append(el('h3', { text: routine.name }), list);
  }
}

function mountFirstThen(container: HTMLElement, context: ToolContext): void {
  const pair = parentConfig(context).firstThen;
  if (pair === undefined) {
    container.append(el('p', { class: 'child-none', text: FIRST_THEN_STRINGS.none }));
    return;
  }
  container.append(
    el('div', { class: 'firstthen' }, [
      el('div', {}, [
        el('span', { class: 'firstthen-label', text: FIRST_THEN_STRINGS.first }),
        el('span', { class: 'firstthen-what', text: pair.first }),
      ]),
      el('div', {}, [
        el('span', { class: 'firstthen-label', text: FIRST_THEN_STRINGS.then }),
        el('span', { class: 'firstthen-what', text: pair.then }),
      ]),
    ]),
  );
}

function mountChart(container: HTMLElement, context: ToolContext): void {
  const chart = parentConfig(context).chart;
  if (chart === undefined) {
    container.append(el('p', { class: 'child-none', text: CHART_STRINGS.none }));
    return;
  }
  // View only: no onAward, so there is no control here that changes anything.
  container.append(
    rewardChart({
      nickname: context.nickname ?? '',
      points: chart.points,
      ...(chart.goal === undefined ? {} : { goal: chart.goal }),
      readOnly: true,
      // The card is already titled "Your stars", in the words a child reads.
      heading: false,
    }),
  );
}

export const tools: Tool[] = [
  {
    title: TIMER_STRINGS.title,
    icon: 'timer',
    mount: (container) => mountTimer(container),
  },
  {
    title: SCHEDULE_STRINGS.title,
    icon: 'list',
    mount: (container, kernel) => mountSchedule(container, kernel as ToolContext),
  },
  {
    title: FIRST_THEN_STRINGS.title,
    icon: 'arrow',
    mount: (container, kernel) => mountFirstThen(container, kernel as ToolContext),
  },
  {
    title: CHART_STRINGS.title,
    icon: 'star',
    mount: (container, kernel) => mountChart(container, kernel as ToolContext),
  },
];
