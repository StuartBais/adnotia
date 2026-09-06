// One tool: pick a practice, read it, sit.
//
// The timer is the kernel's. The log records what was done and when, and stops
// there — see state.ts for why there is no total and no run.

import {
  chips,
  el,
  formatShortDate,
  formatWeekday,
  timer,
  type Tool,
  type ToolContext,
} from '../../kernel/index';
import { LIMIT_NOTE, TOOL_STRINGS } from './strings';
import { PRACTICES, byId } from './practices';
import { newId, record, remove, sessions, type MindfulnessSlice } from './state';

function sliceOf(context: ToolContext): MindfulnessSlice {
  return { version: 1, ...(context.slice as MindfulnessSlice | undefined) };
}

function mount(container: HTMLElement, context: ToolContext): void {
  let chosen = PRACTICES[0]!.id;
  let clock: ReturnType<typeof timer> | undefined;

  const detail = el('div', {});
  const status = el('p', { class: 'bmsg', role: 'status' });
  const history = el('div', {});

  function paintHistory(): void {
    const done = sessions(sliceOf(context));
    history.replaceChildren();
    if (done.length === 0) {
      history.append(el('p', { class: 'hint', text: TOOL_STRINGS.empty }));
      return;
    }
    for (const session of done) {
      const drop = el('button', { type: 'button', class: 'btn small', text: TOOL_STRINGS.remove });
      drop.addEventListener('click', () => {
        context.save(remove(sliceOf(context), session.date, session.id));
        paintHistory();
      });
      history.append(
        el('div', { class: 'plan-row' }, [
          el('div', { class: 'plan-body' }, [
            el('b', { text: `${formatShortDate(session.date)}, ${formatWeekday(session.date)}` }),
            el('span', {
              text: ` ${TOOL_STRINGS.entry(
                byId(session.practice)?.name ?? session.practice,
                session.minutes,
              )}`,
            }),
          ]),
          el('div', { class: 'plan-acts' }, [drop]),
        ]),
      );
    }
  }

  function paintDetail(): void {
    // A timer left running behind a practice nobody is doing is a timer that
    // fires later for no reason.
    clock?.destroy();

    const practice = byId(chosen);
    if (practice === undefined) return;

    const steps = el('ol', { class: 'plain' });
    for (const step of practice.steps) steps.append(el('li', { text: step }));

    const log = el('button', { type: 'button', class: 'btn', text: TOOL_STRINGS.log });
    log.addEventListener('click', () => {
      context.save(
        record(sliceOf(context), context.today, {
          id: newId(),
          practice: practice.id,
          minutes: practice.minutes,
        }),
      );
      // The same word however many there are.
      status.textContent = TOOL_STRINGS.logged;
      paintHistory();
    });

    clock = timer({
      seconds: practice.minutes * 60,
      label: `${practice.name}, ${practice.minutes} minutes`,
    });

    detail.replaceChildren(
      el('p', { class: 'hint', text: practice.about }),
      steps,
      clock.element,
      el('p', { class: 'hint', text: TOOL_STRINGS.start }),
      el('div', { class: 'btnrow' }, [log]),
      status,
    );
  }

  const choose = chips({
    label: TOOL_STRINGS.choose,
    options: PRACTICES.map((practice) => ({
      v: practice.id,
      l: `${practice.name} · ${practice.minutes} min`,
    })),
    value: chosen,
    optional: false,
    onChange: (value) => {
      if (value === '') return;
      chosen = value;
      status.textContent = '';
      paintDetail();
    },
  });

  container.append(
    el('p', { class: 'sub', text: TOOL_STRINGS.sub }),
    // The limit where the practice is, not only in the Library. A person about
    // to spend ten minutes on something deserves to know what is behind it.
    el('p', { class: 'tier', text: LIMIT_NOTE }),
    choose.element,
    detail,
    el('h3', { text: TOOL_STRINGS.history }),
    history,
  );
  paintDetail();
  paintHistory();
}

export const tools: Tool[] = [
  {
    title: TOOL_STRINGS.title,
    icon: 'sit',
    mount: (container, kernel) => mount(container, kernel as ToolContext),
  },
];
