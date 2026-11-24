// The benchmark prototype: Today, capture, a task opened, and focus, in the
// Bookmark Edition direction (ADR-045), running on the real task model.
//
// It exists to be held on a phone so the owner can decide how the phone apps are
// built (docs/09-product-brief.md, order of work, items 2 and 3). It is not the
// app: nothing links to it, Routines and Library are placeholders, and it keeps
// its data under its own storage key so it cannot touch the first build's.
//
// Rules from the brief that it holds: one task record that every screen acts on;
// capture reachable in one tap; a past item quietly goes back to the inbox with
// no "overdue"; time shown as marks beside a count; the current step larger than
// the clock; returning from capture lands on the same step, with the draft kept
// if the person left without saving. No rewards are on, because they are off
// until a person chooses them, and this prototype offers no way to choose yet.

import * as model from '../domains/tasks';
import type { Task, When } from '../domains/tasks';
import { formatClockTime, formatLongDate, formatShortDate, loggingDay } from '../kernel/dates';
import type { KernelStore } from '../kernel/store';
import { bookmark, h, tally, two } from './ui';

interface Focus {
  taskId: string;
  /** How long the person set out to work, in minutes. */
  minutes: number;
  /** Minutes already worked on the task when this focus began. */
  baseWorked: number;
}

type Tab = 'today' | 'tasks' | 'routines' | 'library';
type Screen =
  | { name: Tab }
  | { name: 'about' }
  | { name: 'task'; id: string; back: Screen }
  | { name: 'focus' }
  | { name: 'capture'; back: Screen };

export interface BenchOptions {
  store: KernelStore;
  container: HTMLElement;
  now?: () => Date;
  /** Asked before anything is deleted. Replaceable so tests need no dialog. */
  confirm?: (question: string) => boolean;
}

const DEFAULT_MINUTES = 25;

export function mountBench(options: BenchOptions): { destroy(): void } {
  const { store, container } = options;
  const now = options.now ?? (() => new Date());
  const confirm = options.confirm ?? ((q: string) => window.confirm(q));

  let screen: Screen = { name: 'today' };
  let shownScreen: Screen | undefined;
  let draft = '';
  let receipt: string | undefined;
  let wakeLock: { release(): Promise<void> } | undefined;

  // ---------------------------------------------------------------- state

  const tasks = (): readonly Task[] => store.document().domains.tasks;
  const today = () => loggingDay(now());
  const find = (id: string) => tasks().find((t) => t.id === id);

  function focus(): Focus | undefined {
    const held = store.document().domains['focus'] as Focus | undefined;
    if (held === undefined) return undefined;
    const task = find(held.taskId);
    return task === undefined || task.doneAt !== undefined ? undefined : held;
  }

  /** One write: the next task list, and the focus, kept, replaced or cleared. */
  function write(next: readonly Task[], nextFocus: Focus | undefined | 'keep' = 'keep'): void {
    store.updateDomains((domains) => {
      const { focus: held, ...rest } = domains;
      const kept = nextFocus === 'keep' ? held : nextFocus;
      return kept === undefined ? { ...rest, tasks: next } : { ...rest, tasks: next, focus: kept };
    });
  }

  /** A day gone by: whatever was planned for it and not done goes back to the inbox. */
  function returnPastToInbox(): void {
    const day = today();
    const past = tasks().filter(
      (t) => t.doneAt === undefined && t.when.kind !== 'none' && t.when.date < day,
    );
    if (past.length === 0) return;
    write(past.reduce((list, t) => model.unschedule(list, t.id), tasks() as Task[]));
  }

  const topLevel = (list: readonly Task[]) =>
    list.filter((t) => t.parentId === undefined && t.doneAt === undefined);

  function steps(id: string) {
    const all = model.stepsOf(tasks(), id);
    const index = all.findIndex((s) => s.doneAt === undefined);
    return { all, current: index === -1 ? undefined : all[index], number: index + 1 };
  }

  function isRunning(id: string): boolean {
    return model.running(tasks())?.id === id;
  }

  function minutesLeft(held: Focus): number {
    const task = find(held.taskId);
    if (!task) return 0;
    return held.minutes - (model.minutesWorked(task, now()) - held.baseWorked);
  }

  // -------------------------------------------------------------- actions

  function startFocus(id: string): void {
    const held = focus();
    if (held?.taskId === id) {
      if (!isRunning(id)) write(model.startWork(tasks(), id, now()));
      return go({ name: 'focus' });
    }
    const task = find(id);
    if (!task) return;
    const baseWorked = model.minutesWorked(task, now());
    write(model.startWork(tasks(), id, now()), {
      taskId: id,
      minutes: task.estimateMinutes ?? DEFAULT_MINUTES,
      baseWorked,
    });
    go({ name: 'focus' });
  }

  function pauseOrResume(): void {
    const held = focus();
    if (!held) return;
    write(
      isRunning(held.taskId)
        ? model.stopWork(tasks(), held.taskId, now())
        : model.startWork(tasks(), held.taskId, now()),
    );
  }

  function moreTime(): void {
    const held = focus();
    if (!held) return;
    write(tasks(), { ...held, minutes: held.minutes + 10 });
  }

  function stopFocus(): void {
    const held = focus();
    if (held) write(model.stopWork(tasks(), held.taskId, now()), undefined);
    go({ name: 'today' });
  }

  function toggleStep(step: Task): void {
    write(
      step.doneAt === undefined
        ? model.complete(tasks(), step.id, now())
        : model.reopen(tasks(), step.id),
    );
  }

  function finishTask(id: string): void {
    const held = focus();
    write(model.complete(tasks(), id, now()), held?.taskId === id ? undefined : 'keep');
  }

  function saveCapture(back: Screen): void {
    const title = draft.trim();
    if (title === '') return;
    write(model.capture(tasks(), title, now()));
    draft = '';
    go(back);
    receipt = `Saved to Tasks: ${title}`;
    render();
  }

  function fillExample(): void {
    let list = tasks() as Task[];
    let tick = now().getTime();
    const at = () => new Date(tick++);
    const add = (title: string): string => {
      list = model.capture(list, title, at());
      return list[list.length - 1]!.id;
    };
    const day = today();
    const email = add('Write the school email');
    list = model.setEstimate(list, email, 25);
    list = model.setNotes(list, email, 'When is the permission slip due?');
    list = model.schedule(list, email, { kind: 'anytime', date: day });
    for (const step of ['Find the school address', 'Write the question', 'Read it once and send'])
      list = model.addStep(list, email, step, at());
    const dentist = add('Call the dentist');
    list = model.setEstimate(list, dentist, 10);
    list = model.schedule(list, dentist, {
      kind: 'timed',
      date: day,
      time: '10:30',
      durationMinutes: 10,
    });
    const walk = add('Walk to the park');
    list = model.schedule(list, walk, {
      kind: 'timed',
      date: day,
      time: '11:00',
      durationMinutes: 20,
    });
    const permit = add('Renew the parking permit');
    list = model.schedule(list, permit, { kind: 'anytime', date: day });
    add('Order printer ink');
    write(list);
    go({ name: 'today' });
  }

  function clearEverything(): void {
    if (!confirm('Delete every task in this prototype? This cannot be undone.')) return;
    write([], undefined);
    go({ name: 'today' });
  }

  // ----------------------------------------------------------- navigation

  function go(next: Screen): void {
    screen = next;
    receipt = undefined;
    render();
  }

  const backLabel = (back: Screen): string =>
    back.name === 'focus'
      ? 'Focus'
      : back.name === 'tasks'
        ? 'Tasks'
        : back.name === 'task'
          ? 'Task'
          : 'Today';

  function topbar(left: HTMLElement, right?: HTMLElement): HTMLElement {
    return h('div', { class: 'topbar' }, left, right ?? h('span'));
  }

  function backLink(back: Screen): HTMLElement {
    return h(
      'button',
      { class: 'link', type: 'button', onclick: () => go(back) },
      `← ${backLabel(back)}`,
    );
  }

  function tabbar(current: Tab | undefined): HTMLElement {
    const tab = (name: Tab, label: string) =>
      h('button', {
        type: 'button',
        'aria-current': current === name ? 'page' : undefined,
        onclick: () => go({ name }),
        text: label,
      });
    return h(
      'nav',
      { class: 'tabbar', 'aria-label': 'Main' },
      tab('today', 'Today'),
      tab('tasks', 'Tasks'),
      tab('routines', 'Routines'),
      tab('library', 'Library'),
    );
  }

  function captureDock(back: Screen): HTMLElement {
    return h(
      'div',
      { class: 'capture-dock' },
      h(
        'button',
        { class: 'primary', type: 'button', onclick: () => go({ name: 'capture', back }) },
        h('span', { text: '+  Capture a task' }),
        h('span', { 'aria-hidden': 'true', text: '→' }),
      ),
    );
  }

  const live = () =>
    h('p', { class: receipt ? 'receipt' : 'sr-only', role: 'status' }, receipt ?? '');

  // --------------------------------------------------------------- screens

  function viewToday(): HTMLElement {
    const day = today();
    const { timed, anytime } = model.forDate(topLevel(tasks()), day);
    const held = focus();
    const running = held ? find(held.taskId) : undefined;
    const empty = topLevel(tasks()).length === 0;

    const nowBlock = running
      ? (() => {
          const s = steps(running.id);
          const left = minutesLeft(held!);
          const paused = !isRunning(running.id);
          return h(
            'section',
            { class: 'now', 'aria-labelledby': 'now-title' },
            s.current ? bookmark('Step', two(s.number)) : null,
            h('div', { class: 'kicker', text: paused ? 'Paused' : 'Now running' }),
            h(
              'button',
              { class: 'now-open', type: 'button', onclick: () => go({ name: 'focus' }) },
              h('h2', { class: 'headline', id: 'now-title', text: running.title }),
              s.current ? h('div', { class: 'now-step', text: s.current.title }) : null,
            ),
            h(
              'div',
              { class: 'now-foot' },
              h('span', {}, timeLeftText(left, held!.minutes)),
              h(
                'button',
                { class: 'link', type: 'button', onclick: () => go({ name: 'focus' }) },
                'Open focus →',
              ),
            ),
            h('div', { 'aria-hidden': 'true' }, tally(left, held!.minutes)),
          );
        })()
      : null;

    const rows = (list: readonly Task[], time: boolean) =>
      list.map((t) =>
        h(
          'button',
          {
            class: 'row',
            type: 'button',
            onclick: () => go({ name: 'task', id: t.id, back: { name: 'today' } }),
          },
          time && t.when.kind === 'timed'
            ? h('span', { class: 'time', text: formatClockTime(t.when.time) })
            : h('span', { class: 'dash', 'aria-hidden': 'true' }),
          h('span', { class: 'grow', text: t.title }),
        ),
      );

    const later = timed.filter((t) => t.id !== running?.id);
    const loose = anytime.filter((t) => t.id !== running?.id);

    return h(
      'main',
      { class: 'screen with-tabs' },
      topbar(
        h(
          'div',
          { class: 'brand' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
          'Adnotia',
        ),
        h(
          'button',
          { class: 'link', type: 'button', onclick: () => go({ name: 'about' }) },
          'About',
        ),
      ),
      h(
        'div',
        { class: 'title-row' },
        h('h1', { class: 'headline', tabindex: '-1', text: 'Today' }),
        h('div', { class: 'date', text: formatLongDate(day) }),
      ),
      nowBlock,
      live(),
      later.length > 0
        ? h('section', { class: 'section' }, h('h2', { text: 'Later today' }), rows(later, true))
        : null,
      loose.length > 0
        ? h('section', { class: 'section' }, h('h2', { text: 'Anytime' }), rows(loose, false))
        : null,
      !running && later.length === 0 && loose.length === 0
        ? h(
            'div',
            { class: 'section' },
            h('p', {
              class: 'quiet',
              text: empty
                ? 'Nothing here yet. Capture whatever is on your mind; it lands in Tasks.'
                : 'Nothing planned for today. Anything in Tasks can be moved here.',
            }),
            empty
              ? h(
                  'button',
                  { class: 'secondary', type: 'button', onclick: fillExample },
                  'Fill with an example day',
                )
              : null,
          )
        : null,
      captureDock({ name: 'today' }),
      tabbar('today'),
    );
  }

  function viewTasks(): HTMLElement {
    const day = today();
    const open = topLevel(tasks());
    const inbox = open.filter((t) => t.when.kind === 'none');
    const forToday = open.filter((t) => t.when.kind !== 'none' && t.when.date === day);
    const later = open
      .filter((t) => t.when.kind !== 'none' && t.when.date > day)
      .sort((a, b) => dateOf(a.when).localeCompare(dateOf(b.when)));

    const rows = (list: readonly Task[]) =>
      list.map((t) =>
        h(
          'button',
          {
            class: 'row',
            type: 'button',
            onclick: () => go({ name: 'task', id: t.id, back: { name: 'tasks' } }),
          },
          h('span', { class: 'dash', 'aria-hidden': 'true' }),
          h('span', { class: 'grow', text: t.title }),
          h('span', { class: 'meta', text: whenText(t.when, day) }),
        ),
      );
    const group = (title: string, list: readonly Task[]) =>
      list.length > 0
        ? h('section', { class: 'section' }, h('h2', { text: title }), rows(list))
        : null;

    return h(
      'main',
      { class: 'screen with-tabs' },
      topbar(
        h(
          'div',
          { class: 'brand' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
          'Adnotia',
        ),
        h(
          'button',
          { class: 'link', type: 'button', onclick: () => go({ name: 'about' }) },
          'About',
        ),
      ),
      h(
        'div',
        { class: 'title-row' },
        h('h1', { class: 'headline', tabindex: '-1', text: 'Tasks' }),
      ),
      live(),
      open.length === 0
        ? h('p', {
            class: 'quiet',
            text: 'Nothing here. Whatever you capture lands here first, with no date.',
          })
        : null,
      group('Inbox', inbox),
      group('Today', forToday),
      group('Later', later),
      captureDock({ name: 'tasks' }),
      tabbar('tasks'),
    );
  }

  function viewTask(id: string, back: Screen): HTMLElement {
    const task = find(id);
    if (!task) {
      screen = back;
      return view();
    }
    const day = today();
    const s = steps(id);
    const held = focus();
    const estimate = task.estimateMinutes;

    const setEstimate = (minutes: number | undefined) =>
      write(model.setEstimate(tasks(), id, minutes));
    const setWhen = (when: When) => write(model.schedule(tasks(), id, when));

    const nextHalfHour = (): string => {
      const d = now();
      const minutes = d.getHours() * 60 + d.getMinutes();
      const rounded = Math.min(23 * 60 + 30, Math.ceil((minutes + 1) / 30) * 30);
      return `${two(Math.floor(rounded / 60))}:${two(rounded % 60)}`;
    };
    const seg = (label: string, pressed: boolean, onclick: () => void) =>
      h('button', { type: 'button', 'aria-pressed': String(pressed), onclick, text: label });

    const stepItems = s.all.map((step, i) =>
      h(
        'li',
        { class: step.doneAt === undefined ? 'step' : 'step done' },
        h('span', { class: 'num', text: two(i + 1) }),
        h('span', { class: 'title grow', text: step.title }),
        h(
          'button',
          {
            class: 'tick',
            type: 'button',
            'aria-pressed': String(step.doneAt !== undefined),
            'aria-label': `Done: ${step.title}`,
            onclick: () => toggleStep(step),
          },
          h('span', { 'aria-hidden': 'true', text: step.doneAt === undefined ? '' : '✓' }),
        ),
      ),
    );

    const addStep = h(
      'form',
      {
        class: 'add-step',
        onsubmit: (event: Event) => {
          event.preventDefault();
          const input = (event.currentTarget as HTMLFormElement).elements.namedItem(
            'step',
          ) as HTMLInputElement;
          const title = input.value.trim();
          if (title === '') return;
          write(model.addStep(tasks(), id, title, now()));
          requestAnimationFrame(() =>
            (container.querySelector('input[name="step"]') as HTMLInputElement | null)?.focus(),
          );
        },
      },
      h('label', { class: 'sr-only', for: 'step-input', text: 'Add a step' }),
      h('input', {
        class: 'text',
        id: 'step-input',
        name: 'step',
        placeholder: 'Add a small step',
        autocomplete: 'off',
        enterkeyhint: 'done',
      }),
      h('button', { class: 'secondary', type: 'submit', style: 'width:auto' }, 'Add'),
    );

    const isFocused = held?.taskId === id;
    const done = task.doneAt !== undefined;

    return h(
      'main',
      { class: 'screen' },
      topbar(backLink(back), h('span', { class: 'kicker', text: done ? 'Done' : 'Task' })),
      h('h1', { class: 'sr-only', tabindex: '-1', text: task.title }),
      h('label', { class: 'sr-only', for: 'task-title', text: 'Task name' }),
      h(
        'textarea',
        {
          class: 'task-title',
          id: 'task-title',
          rows: '1',
          autocomplete: 'off',
          enterkeyhint: 'done',
          onchange: (event: Event) => {
            const title = (event.target as HTMLTextAreaElement).value.replace(/\s+/g, ' ').trim();
            if (title !== '' && title !== task.title) write(model.rename(tasks(), id, title));
          },
          oninput: (event: Event) => fitTitle(event.target as HTMLTextAreaElement),
          onkeydown: (event: KeyboardEvent) => {
            // A title is one line however long; Enter finishes it.
            if (event.key === 'Enter') {
              event.preventDefault();
              (event.target as HTMLTextAreaElement).blur();
            }
          },
        },
        task.title,
      ),
      h(
        'div',
        { class: 'section' },
        h(
          'div',
          { class: 'field-row' },
          h('span', { class: 'kicker', id: 'estimate-label', text: 'Estimate' }),
          h(
            'div',
            { class: 'stepper', role: 'group', 'aria-labelledby': 'estimate-label' },
            h('button', {
              type: 'button',
              'aria-label': 'Five minutes less',
              text: '−',
              onclick: () =>
                setEstimate(estimate === undefined || estimate <= 5 ? undefined : estimate - 5),
            }),
            h('output', {
              'aria-live': 'polite',
              text: estimate === undefined ? 'None' : `${estimate} min`,
            }),
            h('button', {
              type: 'button',
              'aria-label': 'Five minutes more',
              text: '+',
              onclick: () => setEstimate((estimate ?? 0) + 5),
            }),
          ),
        ),
        h(
          'div',
          { class: 'field-row' },
          h('span', { class: 'kicker', id: 'when-label', text: 'When' }),
          h(
            'div',
            { class: 'seg', role: 'group', 'aria-labelledby': 'when-label' },
            seg('No date', task.when.kind === 'none', () => write(model.unschedule(tasks(), id))),
            seg('Today', task.when.kind === 'anytime' && task.when.date === day, () =>
              setWhen({ kind: 'anytime', date: day }),
            ),
            seg('At a time', task.when.kind === 'timed', () =>
              setWhen({
                kind: 'timed',
                date: day,
                time: task.when.kind === 'timed' ? task.when.time : nextHalfHour(),
                durationMinutes: estimate ?? 15,
              }),
            ),
            task.when.kind === 'timed'
              ? h('input', {
                  class: 'time',
                  type: 'time',
                  'aria-label': 'Time',
                  value: task.when.time,
                  onchange: (event: Event) => {
                    const time = (event.target as HTMLInputElement).value;
                    if (task.when.kind === 'timed' && /^\d\d:\d\d$/.test(time))
                      setWhen({ ...task.when, time });
                  },
                })
              : null,
          ),
        ),
        h(
          'div',
          { class: 'field-row' },
          h('label', { class: 'kicker', for: 'task-note', text: 'Note' }),
          h('input', {
            class: 'text',
            id: 'task-note',
            style: 'flex:1;min-width:0',
            value: task.notes ?? '',
            placeholder: 'Anything to remember',
            autocomplete: 'off',
            onchange: (event: Event) => {
              const note = (event.target as HTMLInputElement).value.trim();
              write(model.setNotes(tasks(), id, note === '' ? undefined : note));
            },
          }),
        ),
      ),
      h(
        'section',
        { class: 'section' },
        h('h2', { text: 'Small steps' }),
        s.all.length > 0 ? h('ol', { class: 'steps' }, stepItems) : null,
        addStep,
      ),
      h(
        'div',
        { class: 'stack section' },
        done
          ? null
          : h(
              'button',
              { class: 'primary', type: 'button', onclick: () => startFocus(id) },
              h('span', { text: isFocused ? 'Back to focus' : 'Start focus' }),
              h('span', { text: isFocused ? '' : `${estimate ?? DEFAULT_MINUTES} min` }),
            ),
        h(
          'button',
          {
            class: 'secondary',
            type: 'button',
            onclick: () => (done ? write(model.reopen(tasks(), id)) : (finishTask(id), go(back))),
          },
          done ? 'Not done after all' : 'Mark done',
        ),
        h(
          'button',
          {
            class: 'link',
            type: 'button',
            onclick: () => {
              if (!confirm(`Delete "${task.title}" and its steps?`)) return;
              const held = focus();
              write(model.remove(tasks(), id), held?.taskId === id ? undefined : 'keep');
              go(back);
            },
          },
          'Delete this task',
        ),
      ),
    );
  }

  function viewFocus(): HTMLElement {
    const held = focus();
    const task = held ? find(held.taskId) : undefined;
    if (!held || !task) {
      screen = { name: 'today' };
      return view();
    }
    const s = steps(task.id);
    const left = minutesLeft(held);
    const paused = !isRunning(task.id);
    const over = left <= 0;

    return h(
      'main',
      { class: 'screen dark' },
      topbar(backLink({ name: 'today' }), h('span', { class: 'kicker', text: 'Focus' })),
      h(
        'div',
        { class: 'focus-head' },
        h('div', { class: 'kicker', text: 'Working on' }),
        h(
          'button',
          {
            class: 'link task-name',
            type: 'button',
            style: 'padding:0',
            onclick: () => go({ name: 'task', id: task.id, back: { name: 'focus' } }),
          },
          task.title,
        ),
      ),
      h(
        'div',
        { class: 'focus-body' },
        s.current
          ? h(
              'div',
              { class: 'focus-place' },
              bookmark('Step', two(s.number)),
              h('span', { class: 'of', text: `of ${s.all.length}` }),
            )
          : null,
        h('h1', {
          class: 'headline',
          tabindex: '-1',
          text: s.current ? s.current.title : task.title,
        }),
        task.notes
          ? h(
              'div',
              { class: 'note' },
              h('div', { class: 'kicker', text: 'Your note' }),
              `“${task.notes}”`,
            )
          : null,
        s.current
          ? h(
              'div',
              { class: 'section' },
              h(
                'button',
                { class: 'secondary', type: 'button', onclick: () => toggleStep(s.current!) },
                h('span', { text: 'This step is done' }),
                h('span', { 'aria-hidden': 'true', text: '✓' }),
              ),
            )
          : s.all.length > 0
            ? h('p', { class: 'now-step', text: 'Every step is ticked.' })
            : null,
        live(),
      ),
      h(
        'div',
        { class: 'timer' },
        h(
          'div',
          { class: 'timer-line' },
          h('div', { class: 'kicker', text: paused ? 'Paused' : 'Timer running' }),
          h(
            'button',
            { class: 'link', type: 'button', onclick: pauseOrResume },
            paused ? 'Resume' : 'Pause',
          ),
        ),
        over
          ? h('p', { class: 'left', text: `Your ${held.minutes} minutes are up.` })
          : h('p', { class: 'left' }, timeLeftText(left, held.minutes)),
        h('div', { 'aria-hidden': 'true' }, tally(left, held.minutes)),
      ),
      h(
        'div',
        { class: 'stack', style: 'margin-top:16px' },
        h(
          'button',
          {
            class: 'light',
            type: 'button',
            onclick: () => go({ name: 'capture', back: { name: 'focus' } }),
          },
          h('span', { text: '+  Capture a thought' }),
          h('span', { 'aria-hidden': 'true', text: '→' }),
        ),
        over
          ? h(
              'button',
              { class: 'secondary', type: 'button', onclick: moreTime },
              'Ten more minutes',
            )
          : null,
        h(
          'div',
          { style: 'display:flex;gap:10px' },
          h('button', { class: 'secondary', type: 'button', onclick: stopFocus }, 'Stop here'),
          h(
            'button',
            {
              class: 'secondary',
              type: 'button',
              onclick: () => {
                finishTask(task.id);
                go({ name: 'today' });
              },
            },
            'Task done',
          ),
        ),
      ),
    );
  }

  function viewCapture(back: Screen): HTMLElement {
    const fromFocus = back.name === 'focus';
    const held = focus();
    const placeTask = fromFocus && held ? find(held.taskId) : undefined;
    const place = placeTask ? steps(placeTask.id) : undefined;

    const form = h(
      'form',
      {
        onsubmit: (event: Event) => {
          event.preventDefault();
          saveCapture(back);
        },
      },
      h('label', { for: 'capture-input', text: 'Task name' }),
      h('input', {
        id: 'capture-input',
        value: draft,
        placeholder: 'e.g. Order printer ink',
        autocomplete: 'off',
        enterkeyhint: 'done',
        oninput: (event: Event) => {
          draft = (event.target as HTMLInputElement).value;
        },
      }),
      h('p', { class: 'hint', text: 'Goes to Tasks, without a date.' }),
      h(
        'button',
        { class: 'primary', type: 'submit' },
        h('span', { text: fromFocus ? 'Save and return to focus' : 'Save' }),
        h('span', { 'aria-hidden': 'true', text: '↵' }),
      ),
    );

    return h(
      'main',
      { class: 'screen stone' },
      topbar(backLink(back), h('span', { class: 'kicker', text: 'Quick entry' })),
      h('h1', { class: 'headline', style: 'font-size:52px;margin-top:18px', text: 'Capture' }),
      h('div', { class: 'slip' }, form),
      placeTask
        ? h(
            'div',
            { class: 'place' },
            bookmark('', place?.current ? two(place.number) : '·'),
            h(
              'div',
              {},
              h('div', { class: 'kicker', text: 'Your place' }),
              h('div', { text: place?.current?.title ?? placeTask.title }),
            ),
          )
        : null,
    );
  }

  function viewPlaceholder(name: 'routines' | 'library'): HTMLElement {
    const title = name === 'routines' ? 'Routines' : 'Library';
    return h(
      'main',
      { class: 'screen with-tabs' },
      topbar(
        h(
          'div',
          { class: 'brand' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }),
          'Adnotia',
        ),
        h(
          'button',
          { class: 'link', type: 'button', onclick: () => go({ name: 'about' }) },
          'About',
        ),
      ),
      h('div', { class: 'title-row' }, h('h1', { class: 'headline', tabindex: '-1', text: title })),
      h('p', {
        class: 'quiet',
        text: 'Not in this prototype. It tests four screens: Today, capture, a task opened, and focus.',
      }),
      tabbar(name),
    );
  }

  function viewAbout(): HTMLElement {
    return h(
      'main',
      { class: 'screen with-tabs prose' },
      topbar(backLink({ name: 'today' })),
      h('h1', {
        class: 'headline',
        tabindex: '-1',
        style: 'font-size:40px;margin:16px 0',
        text: 'About this prototype',
      }),
      h('p', {
        text:
          'This is a test of how the phone app could feel, built to help decide how the real ' +
          'one is made. It has four screens: Today, capture, a task, and focus.',
      }),
      h('p', {
        text:
          'What you enter stays on this phone, in this page only. It is kept apart from ' +
          'anything the older version of Adnotia stored, and it is not encrypted.',
      }),
      h('p', {
        text:
          'To use it like an app, open the Share menu and choose Add to Home Screen. It then ' +
          'opens full screen, without the browser around it.',
      }),
      h('h2', { text: 'Start again' }),
      h(
        'div',
        { class: 'stack' },
        topLevel(tasks()).length === 0
          ? h(
              'button',
              { class: 'secondary', type: 'button', onclick: fillExample },
              'Fill with an example day',
            )
          : null,
        h(
          'button',
          { class: 'secondary', type: 'button', onclick: clearEverything },
          'Delete everything',
        ),
      ),
      tabbar(undefined),
    );
  }

  function view(): HTMLElement {
    switch (screen.name) {
      case 'today':
        return viewToday();
      case 'tasks':
        return viewTasks();
      case 'task':
        return viewTask(screen.id, screen.back);
      case 'focus':
        return viewFocus();
      case 'capture':
        return viewCapture(screen.back);
      case 'about':
        return viewAbout();
      case 'routines':
      case 'library':
        return viewPlaceholder(screen.name);
    }
  }

  // -------------------------------------------------------------- render

  function render(): void {
    const arrived = shownScreen !== screen;
    const scroll = arrived ? 0 : window.scrollY;
    const active = document.activeElement?.id;
    container.replaceChildren(view());
    shownScreen = screen;
    window.scrollTo(0, scroll);
    const title = container.querySelector<HTMLTextAreaElement>('#task-title');
    if (title) fitTitle(title);

    if (arrived) {
      const input = container.querySelector<HTMLInputElement>('#capture-input');
      if (input) input.focus();
      else container.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    } else if (active) {
      // Ids here are the prototype's own, so they need no escaping.
      container.querySelector<HTMLElement>(`[id="${active}"]`)?.focus({ preventScroll: true });
    }
    holdScreenAwake(screen.name === 'focus' && !!focus() && isRunning(focus()!.taskId));
  }

  function holdScreenAwake(on: boolean): void {
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> };
    };
    if (on && !wakeLock && nav.wakeLock) {
      nav.wakeLock
        .request('screen')
        .then((lock) => {
          wakeLock = lock;
        })
        .catch(() => undefined);
    } else if (!on && wakeLock) {
      void wakeLock.release().catch(() => undefined);
      wakeLock = undefined;
    }
  }

  returnPastToInbox();
  const unsubscribe = store.subscribe('domains', render);
  // The clock moves while nothing else does. Only screens that show it redraw.
  const ticker = setInterval(() => {
    if ((screen.name === 'focus' || screen.name === 'today') && focus()) render();
  }, 15_000);
  render();

  return {
    destroy() {
      clearInterval(ticker);
      unsubscribe();
      holdScreenAwake(false);
      container.replaceChildren();
    },
  };
}

function timeLeftText(left: number, total: number): (Node | string)[] {
  return [h('b', { text: String(Math.max(0, Math.ceil(left))) }), ` of ${total} min left`];
}

function dateOf(when: When): string {
  return when.kind === 'none' ? '' : when.date;
}

function whenText(when: When, day: string): string {
  if (when.kind === 'none') return '';
  const time = when.kind === 'timed' ? formatClockTime(when.time) : '';
  if (when.date === day) return time;
  return [formatShortDate(when.date), time].filter(Boolean).join(' · ');
}

/** A wrapping title field as tall as its words. */
function fitTitle(field: HTMLTextAreaElement): void {
  field.style.height = 'auto';
  field.style.height = `${field.scrollHeight}px`;
}
