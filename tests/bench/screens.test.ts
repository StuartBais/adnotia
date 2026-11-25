import { afterEach, describe, expect, it, vi } from 'vitest';
import * as model from '../../src/domains/tasks';
import { setOption } from '../../src/domains/options';
import { EMAIL } from '../../src/bench/example';
import type { BenchDomains } from '../../src/bench/state';
import { ABOUT } from '../../src/bench/screens/places';
import { dayList } from '../../src/bench/view';
import {
  advance,
  button,
  choices,
  goBack,
  hintOf,
  historyDepth,
  mount,
  nameOf,
  press,
  readingOrder,
  said,
  stateOf,
  unmount,
  visibleText,
  type Mounted,
} from './mount';

// The screens of design/lantern/SPEC.md section 5, as built so far (plan
// section 19, chunk 2): Today in every state, the drawer at rest, the capsule
// on the places, the tabs, and Me with its pages. Each is held to its exact
// words, its spoken names, its choice count and its reading order. Times are
// the board's scenes, in local time, and nothing reads the real clock.

const TUE_1005 = '2026-11-24T10:05:00';
const TUE_0958 = '2026-11-24T09:58:00';
const TUE_1320 = '2026-11-24T13:20:00';
const MON_0912 = '2026-12-14T09:12:00';

afterEach(unmount);

const TABS = ['Today', 'Tasks', 'Routines', 'Library'];
const id = (m: Mounted, key: string) => m.container.querySelector<HTMLElement>(`#${key}`);
const emailOf = (state: BenchDomains) =>
  state.tasks.find((task) => task.title === EMAIL && task.parentId === undefined)!;
const titled = (state: BenchDomains, title: string) =>
  state.tasks.find((task) => task.title === title && task.parentId === undefined)!;
const at = (local: string) => new Date(local);

/** Keeps only the names in `wanted`, in the order they were read. */
const inOrder = (names: string[], wanted: string[]) =>
  names.filter((name) => wanted.includes(name));

describe('1 · Today, running (SPEC 5.1)', () => {
  const LIT =
    'Now: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23. Note: When is the permission slip due?';
  const HANDLE = 'Next, in 25 minutes: 10:30, Call the dentist. Rest of today';

  it('lights the step, its bar and its minutes, with the date and Me above', async () => {
    const m = await mount(TUE_1005);
    const text = visibleText(m.container);
    for (const words of [
      'Tuesday 24 November',
      'Now',
      'step 2 of 3',
      'Focus',
      'Write the school email',
      'Write the question',
      '18 min left',
      'of 25',
      'ends 10:23',
      'Note',
      'When is the permission slip due?',
    ]) {
      expect(text).toContain(words);
    }
    expect(m.container.dataset['ground']).toBe('present');
    expect(id(m, 'b-lit')?.classList.contains('lit-block')).toBe(true);
    expect(m.container.querySelector('.screen')?.getAttribute('data-lamp')).toBe('lit');
    expect(m.container.querySelector('.lit-block .bar')?.className).toBe('bar bar-today is-burn');
  });

  it('is one button that opens focus, named in SPEC 11’s words', async () => {
    const m = await mount(TUE_1005);
    const block = button(m.container, LIT);
    expect(hintOf(block)).toBe('Opens focus.');
  });

  it('holds Step done, Pause and capture on the dock line, and no capsule', async () => {
    const m = await mount(TUE_1005);
    expect(nameOf(id(m, 'b-stepdone')!)).toBe('Step done: Write the question');
    expect(id(m, 'b-stepdone')?.textContent).toBe('Step done');
    expect(nameOf(id(m, 'b-pause')!)).toBe('Pause');
    expect(nameOf(id(m, 'b-capture')!)).toBe('Capture');
    expect(hintOf(id(m, 'b-capture')!)).toBe('Write something down. It goes to the inbox.');
    expect(m.container.querySelector('.capsule')).toBeNull();
  });

  it('folds the drawer to its Next line', async () => {
    const m = await mount(TUE_1005);
    expect(m.container.dataset['drawer']).toBe('folded');
    const handle = button(m.container, HANDLE);
    expect(hintOf(handle)).toBe('Shows the rest of today.');
    expect(handle.textContent).toContain('Next');
    expect(handle.textContent).toContain('in 25 min');
    expect(handle.textContent).toContain('10:30');
    expect(handle.textContent).toContain('Call the dentist');
    expect(handle.textContent).toContain('Rest of today');
    // No minutes on the Next line.
    expect(handle.textContent).not.toContain('10 min');
  });

  it('offers four choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(TUE_1005);
    expect(choices(m.container)).toBe(4);
    expect(readingOrder(m.container)).toEqual([
      'Tuesday 24 November',
      'Me',
      LIT,
      'Step done: Write the question',
      'Pause',
      'Capture',
      HANDLE,
      ...TABS,
    ]);
    expect(hintOf(id(m, 'b-me')!)).toBe('Settings and help.');
  });

  it('moves the minutes and the bar in place as time passes, without rebuilding', async () => {
    const m = await mount(TUE_1005);
    const block = id(m, 'b-lit');
    const fill = m.container.querySelector<HTMLElement>('.lit-block .bar')!;
    const before = fill.style.getPropertyValue('--p');
    advance(m, 1);
    expect(id(m, 'b-lit')).toBe(block);
    expect(visibleText(m.container)).toContain('17 min left');
    expect(block?.getAttribute('aria-label')).toContain('17 of 25 minutes left, ends 10:23.');
    expect(fill.style.getPropertyValue('--p')).not.toBe(before);
  });

  it('moves "in N min" on the Next line in place, without rebuilding the handle', async () => {
    const m = await mount(TUE_1005);
    const handle = id(m, 'b-handle');
    advance(m, 1);
    expect(id(m, 'b-handle')).toBe(handle);
    expect(handle?.textContent).toContain('in 24 min');
    expect(nameOf(handle!)).toBe('Next, in 24 minutes: 10:30, Call the dentist. Rest of today');
  });

  it('under Reduce Motion, turns "N min left" on the task’s own minute', async () => {
    // Started at 9:58:30, so its minutes turn at half past each clock minute.
    const m = await mount('2026-11-24T10:05:30', 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, motion: 'reduced' } },
    }));
    const step = (ms: number) => {
      m.clock.now = new Date(m.clock.now.getTime() + ms);
      vi.advanceTimersByTime(ms);
    };
    expect(visibleText(m.container)).toContain('18 min left');
    step(30_000); // 10:06:00, a clock minute: 7.5 worked
    expect(visibleText(m.container)).toContain('18 min left');
    step(30_000); // 10:06:30: 8 worked
    expect(visibleText(m.container)).toContain('17 min left');
    expect(nameOf(id(m, 'b-lit')!)).toContain('17 of 25 minutes left');
  });

  it('over the estimate: the outline, the minutes so far, and the estimate in words', async () => {
    const m = await mount(TUE_1005);
    advance(m, 20); // 27 minutes worked of 25
    const text = visibleText(m.container);
    expect(text).toContain('27 min so far');
    expect(text).toContain('estimate 25');
    expect(text).not.toContain('ends');
    expect(text).not.toMatch(/\b0 min left/);
    expect(m.container.querySelector('.lit-block .bar')?.className).toBe('bar bar-today is-over');
    expect(nameOf(id(m, 'b-lit')!)).toContain('27 minutes so far, estimate 25.');
  });

  it('with no estimate: a length that grows, and the minutes so far', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      tasks: model.setEstimate(state.tasks, emailOf(state).id, undefined),
    }));
    expect(visibleText(m.container)).toContain('7 min so far');
    const bar = m.container.querySelector<HTMLElement>('.lit-block .bar')!;
    expect(bar.className).toBe('bar bar-today is-countUp');
    expect(Number(bar.style.getPropertyValue('--p'))).toBeCloseTo(7 / 60, 2);
  });

  it('says Done on the last step, and for a task with no steps', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    expect(said(m)).toBe('Step done. Now: Read it once and send');
    expect(id(m, 'b-stepdone')?.textContent).toBe('Done');
    expect(visibleText(m.container)).toContain('step 3 of 3');
    press(m.container, /^Done: Read it once and send$/);
    expect(said(m)).toBe('Done: Write the school email');
    expect(emailOf(stateOf(m)).doneAt).toBeDefined();
    // Nothing runs now: the canvas is unlit.
    expect(visibleText(m.container)).toContain('Nothing running');
  });

  it('pauses and resumes on the spot, saying so', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Pause');
    expect(said(m)).toBe('Paused');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    expect(visibleText(m.container)).toContain('Paused');
    press(m.container, 'Resume');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(id(m, 'b-pause')?.textContent).toBe('Pause');
  });

  it('says Paused again on a second pause, emptying the live region first', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Pause');
    expect(said(m)).toBe('Paused');
    press(m.container, 'Resume');
    press(m.container, 'Pause');
    expect(m.container.querySelector('.live')?.textContent).toBe('');
    expect(said(m)).toBe('Paused');
  });

  it('lands focus on the unlit block when Done on the last step takes the buttons away', async () => {
    const m = await mount(TUE_1005);
    button(m.container, 'Step done: Write the question').focus();
    press(m.container, 'Step done: Write the question');
    expect(document.activeElement?.id).toBe('b-stepdone');
    press(m.container, 'Done: Read it once and send');
    expect(document.activeElement).toBe(id(m, 'b-idle'));
  });

  it('keeps focus on the spot through Pause and Resume', async () => {
    const m = await mount(TUE_1005);
    button(m.container, 'Pause').focus();
    press(m.container, 'Pause');
    expect(document.activeElement).toBe(button(m.container, 'Resume'));
    press(m.container, 'Resume');
    expect(document.activeElement).toBe(button(m.container, 'Pause'));
  });
});

describe('7c · Paused (SPEC 5.7c)', () => {
  const BLOCK =
    'Paused: Write the question. Step 2 of 3 of Write the school email. 18 of 25 minutes left. Note: When is the permission slip due?';
  const ASIDE = 'Set aside Write the school email. It keeps its place at step 2.';
  const HANDLE = 'Anytime today: Call the dentist. Rest of today';

  it('says Paused in words, the bar still in ash, the minutes in white with no end time', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    const text = visibleText(m.container);
    expect(text).toContain('Paused');
    expect(text).toContain('18 min left');
    expect(text).toContain('of 25');
    expect(text).not.toContain('ends');
    expect(text).not.toMatch(/welcome|while you were away|hours? ago/i);
    expect(m.container.querySelector('.lit-block .bar')?.className).toBe(
      'bar bar-today is-paused is-frozen',
    );
    expect(m.container.querySelector('.lit-block .mins strong')?.className).toContain('still');
    expect(m.container.querySelector('.lantern')?.classList.contains('paused')).toBe(true);
  });

  it('has Set aside beside the minutes, Resume in Pause’s place, and Step done kept', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    expect(nameOf(id(m, 'b-aside')!)).toBe(ASIDE);
    expect(id(m, 'b-aside')?.closest('.lit-block')).toBeNull();
    // Resume stands in Pause's spot: one control that changes its word.
    expect(id(m, 'b-pause')?.textContent).toBe('Resume');
    expect(nameOf(id(m, 'b-pause')!)).toBe('Resume');
    expect(id(m, 'b-stepdone')?.className).toContain('ash');
    expect(() => button(m.container, 'Pause')).toThrow();
  });

  it('names the passed call on the Next line, under Anytime today, unmarked', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    const handle = button(m.container, HANDLE);
    expect(handle.textContent).toContain('Anytime today');
    expect(handle.textContent).toContain('Call the dentist');
    expect(handle.querySelector('.h-time')).toBeNull();
    expect(handle.textContent).not.toMatch(/missed|late|overdue/i);
  });

  it('offers five choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    expect(choices(m.container)).toBe(5);
    expect(readingOrder(m.container)).toEqual([
      'Tuesday 24 November',
      'Me',
      BLOCK,
      ASIDE,
      'Step done: Write the question',
      'Resume',
      'Capture',
      HANDLE,
      ...TABS,
    ]);
  });

  it('after a clock left running: the outline and "estimate 25", never "0 min left"', async () => {
    const m = await mount(TUE_1005, 'clockLeftRunning');
    const text = visibleText(m.container);
    expect(text).toContain('Paused');
    expect(text).toContain('estimate 25');
    expect(text).not.toMatch(/\b0 min left/);
    expect(m.container.querySelector('.lit-block .bar')?.className).toBe(
      'bar bar-today is-over is-frozen',
    );
  });

  it('says "Timer stopped" there instead, when the owner’s setting says so', async () => {
    const m = await mount(TUE_1005, 'clockLeftRunning', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, closedLabel: 'stopped' } },
    }));
    expect(visibleText(m.container)).toContain('Timer stopped');
    expect(nameOf(id(m, 'b-lit')!).startsWith('Timer stopped: Write the question.')).toBe(true);
    // The capsule has no room for it, so it draws Paused, and says what it draws.
    press(m.container, 'Tasks');
    const capsule = id(m, 'b-capsule')!;
    expect(capsule.querySelector('.c1')?.textContent).toBe('PausedWrite the question');
    expect(nameOf(capsule).startsWith('Paused: Write the question, step 2 of 3')).toBe(true);
  });

  it('lands focus on the unlit block after Set aside', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    button(m.container, ASIDE).focus();
    press(m.container, ASIDE);
    expect(document.activeElement).toBe(id(m, 'b-idle'));
  });

  it('lets the task go with Set aside, at its step', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    press(m.container, ASIDE);
    expect(stateOf(m).bench.setAside?.taskId).toBe(emailOf(stateOf(m)).id);
    // The idle lantern lights the passed call, first in Anytime today.
    const text = visibleText(m.container);
    expect(text).toContain('Nothing running');
    expect(text).toContain('Call the dentist');
    expect(model.stepsOf(stateOf(m).tasks, emailOf(stateOf(m)).id)[1]?.doneAt).toBeUndefined();
  });
});

describe('7 · Nothing running (SPEC 5.7)', () => {
  const ITEM =
    "First on today's list: Write the school email. Starts with Find the school address. 3 steps, 25 minutes, would end about 10:23";

  it('says Nothing running first, and lights the first item a size smaller', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    const text = visibleText(m.container);
    expect(text).toContain('Nothing running');
    expect(text).toContain('free until 10:30');
    expect(text).toContain("First on today's list");
    expect(text).toContain('Starts with: Find the school address');
    expect(text).toContain('3 steps · 25 min · would end about 10:23');
    expect(m.container.querySelector('.screen')?.getAttribute('data-lamp')).toBe('idle');
    expect(m.container.querySelector('.idle-block .sentence')?.className).toContain('t-idle');
    expect(m.container.querySelector('.lit-block')).toBeNull();
  });

  it('rests the day half open, the lit email not repeated, with no "in" line', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    expect(m.container.dataset['drawer']).toBe('half');
    const list = m.container.querySelector('.list')!;
    expect(list.textContent).toContain('Later today');
    expect(list.textContent).toContain('Anytime today');
    expect(list.textContent).not.toContain(EMAIL);
    expect(list.textContent).not.toMatch(/\bin \d+ min/);
    const times = [...list.querySelectorAll('.trow')].map((row) => row.textContent);
    expect(times).toEqual([
      '10:30Call the dentist10 min',
      '11:00Walk to the park20 min',
      '14:00Ring the bank15 min',
    ]);
    // Every track sits in a 30 pt slot, the longest's, so the numbers end on one line.
    const tracks = [...list.querySelectorAll<HTMLElement>('.trow .dur .m')].map((m) => [
      m.style.width,
      m.style.marginRight,
    ]);
    expect(tracks).toEqual([
      ['15px', '15px'],
      ['30px', '0px'],
      ['22.5px', '7.5px'],
    ]);
    // Titles beside capture wrap in their lane rather than run under the disc.
    expect(list.querySelector('.rrow')?.classList.contains('lane')).toBe(true);
    // Each timed row is named with a pause between its parts.
    expect(readingOrder(m.container)).toContain('10:30, Call the dentist, 10 minutes');
  });

  it('names the next timed row with its "in" line where the list shows one', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    const list = dayList(stateOf(m), at(TUE_0958), { inLine: true });
    expect(list.later.map((row) => [row.inLine, row.label])).toEqual([
      ['in 32 min', '10:30, Call the dentist, in 32 minutes, 10 minutes'],
      [undefined, '11:00, Walk to the park, 20 minutes'],
      [undefined, '14:00, Ring the bank, 15 minutes'],
    ]);
  });

  it('has capture alone on the dock line, on the stone, and no capsule anywhere', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    expect(id(m, 'b-capture')?.classList.contains('on-light')).toBe(true);
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(id(m, 'b-stepdone')).toBeNull();
  });

  it('offers four choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    expect(choices(m.container)).toBe(4);
    const names = readingOrder(m.container);
    expect(
      inOrder(names, [
        'Tuesday 24 November',
        'Me',
        'Nothing running, free until 10:30',
        ITEM,
        'Start',
        'Rest of today',
        'Later today',
        'Anytime today',
        'Capture',
        ...TABS,
      ]),
    ).toEqual([
      'Tuesday 24 November',
      'Me',
      'Nothing running, free until 10:30',
      ITEM,
      'Start',
      'Rest of today',
      'Later today',
      'Anytime today',
      'Capture',
      ...TABS,
    ]);
    expect(hintOf(button(m.container, 'Rest of today'))).toBe('Shows the rest of today.');
  });

  it('lands focus on the lit block after Start', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    button(m.container, 'Start').focus();
    press(m.container, 'Start');
    expect(document.activeElement).toBe(id(m, 'b-lit'));
  });

  it('starts the lit item on the spot, and folds the drawer', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Start');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('ticks a ring in place, and the disc takes it back', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Mark done: Renew the parking permit');
    expect(said(m)).toBe('Done: Renew the parking permit');
    expect(titled(stateOf(m), 'Renew the parking permit').doneAt).toBeDefined();
    // Still in the list, where it was, as a disc that un-ticks it.
    const disc = button(m.container, 'Undo done: Renew the parking permit');
    expect(disc.closest('li')?.classList.contains('done')).toBe(true);
    disc.click();
    expect(titled(stateOf(m), 'Renew the parking permit').doneAt).toBeUndefined();
    expect(button(m.container, 'Mark done: Renew the parking permit')).toBeTruthy();
  });

  it('keeps focus on the spot as a ring is ticked and its disc un-ticks it', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    button(m.container, 'Mark done: Renew the parking permit').focus();
    press(m.container, 'Mark done: Renew the parking permit');
    expect(document.activeElement).toBe(button(m.container, 'Undo done: Renew the parking permit'));
    press(m.container, 'Undo done: Renew the parking permit');
    expect(document.activeElement).toBe(button(m.container, 'Mark done: Renew the parking permit'));
  });

  // jsdom lays nothing out, so the rows and the room are given here: each row
  // 44 tall, one under another, in a viewport 238 tall (the half drawer at 9:58).
  function laidOut(m: Mounted): () => void {
    const proto = HTMLElement.prototype;
    const saved = ['offsetTop', 'offsetHeight', 'clientHeight'].map(
      (name) => [name, Object.getOwnPropertyDescriptor(proto, name)] as const,
    );
    const rowsOf = (node: HTMLElement) => [
      ...(node.closest('.list')?.querySelectorAll('[data-row]') ?? []),
    ];
    Object.defineProperty(proto, 'offsetTop', {
      configurable: true,
      get(this: HTMLElement) {
        return this.matches('[data-row]') ? rowsOf(this).indexOf(this) * 44 : 0;
      },
    });
    Object.defineProperty(proto, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.matches('[data-row]') ? 44 : 0;
      },
    });
    Object.defineProperty(proto, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.matches('.viewport') ? 238 : 0;
      },
    });
    m.container.getBoundingClientRect = () => new DOMRect(0, 0, 390, 844);
    window.dispatchEvent(new Event('resize'));
    return () => {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(proto, name, descriptor);
      }
    };
  }

  it('cuts a long list at rest to its last whole row, under the cover', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    const restore = laidOut(m);
    try {
      expect(m.container.querySelectorAll('.list [data-row]').length).toBeGreaterThan(6);
      expect(m.container.dataset['more']).toBe('');
      expect(m.container.querySelector<HTMLElement>('.viewport')?.style.height).toBe('220px');
    } finally {
      restore();
    }
  });

  it('leaves a list that fits whole, with no covered row and no cover', async () => {
    const m = await mount(TUE_0958, 'notStarted', (state, now) => {
      let tasks = state.tasks;
      const anytime = state.tasks.filter(
        (task) => task.parentId === undefined && task.when.kind === 'anytime',
      );
      // All but the email (lit, so left out of the list) and one more.
      for (const task of anytime.filter((task) => task.title !== EMAIL).slice(1)) {
        tasks = model.complete(tasks, task.id, now);
      }
      return { ...state, tasks };
    });
    const restore = laidOut(m);
    try {
      expect(m.container.querySelectorAll('.list [data-row]').length).toBe(4);
      expect(m.container.dataset['more']).toBeUndefined();
      expect(m.container.querySelector<HTMLElement>('.viewport')?.style.height).toBe('');
    } finally {
      restore();
    }
  });

  it('lists what got done today only when that reward is on', async () => {
    const off = await mount(TUE_0958, 'notStarted');
    expect(visibleText(off.container)).not.toContain('Done today');
    unmount();
    const on = await mount(TUE_0958, 'notStarted', (state) => ({
      ...state,
      rewards: setOption(state.rewards, { kind: 'day' }, 'doneList', true),
    }));
    expect(visibleText(on.container)).toContain('Done today');
    expect(readingOrder(on.container)).toContain('Bins out, done');
    expect(visibleText(on.container)).not.toMatch(/\b\d+ done\b/);
  });

  it('rule 1: a booked item within 15 minutes is lit, with when it starts', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    advance(m, 22); // 10:20
    const text = visibleText(m.container);
    expect(text).toContain('starts at 10:30, in 10 min');
    expect(text).toContain('Next booked');
    expect(m.container.querySelector('.idle-block .sentence')?.textContent).toBe(
      'Call the dentist',
    );
    expect(readingOrder(m.container)).toContain('Nothing running, starts at 10:30, in 10 minutes');
    expect(id(m, 'b-start')).not.toBeNull();
  });

  it('moves the unlit lantern’s minutes in place, without rebuilding it', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    const block = id(m, 'b-idle');
    advance(m, 1); // 9:59, rule 2
    expect(id(m, 'b-idle')).toBe(block);
    expect(visibleText(m.container)).toContain('would end about 10:24');
    expect(nameOf(block!)).toContain('would end about 10:24');
    advance(m, 21); // 10:20, rule 1
    const booked = id(m, 'b-idle');
    expect(visibleText(m.container)).toContain('starts at 10:30, in 10 min');
    advance(m, 1);
    expect(id(m, 'b-idle')).toBe(booked);
    expect(visibleText(m.container)).toContain('starts at 10:30, in 9 min');
    expect(readingOrder(m.container)).toContain('Nothing running, starts at 10:30, in 9 minutes');
  });

  it('rule 1, its slot under way: booked now, until it ends (a proposal)', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    advance(m, 35); // 10:33
    const text = visibleText(m.container);
    expect(text).toContain('until 10:40');
    expect(text).toContain('Booked now');
  });

  it('rule 3: nothing anytime but booked items to come, and no Start', async () => {
    const m = await mount(TUE_0958, 'notStarted', (state, now) => {
      let tasks = state.tasks;
      for (const task of state.tasks) {
        if (task.parentId === undefined && task.when.kind === 'anytime') {
          tasks = model.complete(tasks, task.id, now);
        }
      }
      return { ...state, tasks };
    });
    const text = visibleText(m.container);
    expect(text).toContain('Free until 10:30');
    expect(text).toContain('Call the dentist at 10:30');
    expect(id(m, 'b-start')).toBeNull();
    expect(readingOrder(m.container)).toContain('Nothing running');
  });
});

describe('7b · Nothing planned (SPEC 5.7b)', () => {
  it('says only what is true now, and offers the inbox', async () => {
    const m = await mount(MON_0912, 'weeksAway');
    const text = visibleText(m.container);
    expect(text).toContain('Monday 14 December');
    expect(text).toContain('Nothing planned for today');
    expect(text).toContain('Anything without a date is in the inbox.');
    expect(text).not.toContain('Nothing running');
    expect(hintOf(button(m.container, 'Open the inbox'))).toBe('Opens at the newest items.');
    expect(m.container.querySelector('.screen')?.getAttribute('data-lamp')).toBe('planned');
  });

  it('rests the drawer at its lip: no grabber, no words, not read', async () => {
    const m = await mount(MON_0912, 'weeksAway');
    expect(m.container.dataset['drawer']).toBe('lip');
    const drawer = m.container.querySelector('.drawer')!;
    expect(drawer.hasAttribute('inert')).toBe(true);
    expect(drawer.children).toHaveLength(0);
    expect(id(m, 'b-handle')).toBeNull();
  });

  it('offers two choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(MON_0912, 'weeksAway');
    expect(choices(m.container)).toBe(2);
    expect(readingOrder(m.container)).toEqual([
      'Monday 14 December',
      'Me',
      'Nothing planned for today',
      'Anything without a date is in the inbox.',
      'Open the inbox',
      'Capture',
      ...TABS,
    ]);
  });

  it('opens the inbox on Tasks', async () => {
    const m = await mount(MON_0912, 'weeksAway');
    press(m.container, 'Open the inbox');
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    expect(m.container.querySelector('h1')?.textContent).toBe('Tasks');
  });

  it('is the same with nothing at all', async () => {
    const m = await mount(TUE_1005, 'empty');
    expect(visibleText(m.container)).toContain('Nothing planned for today');
    expect(m.container.dataset['drawer']).toBe('lip');
  });
});

describe('2 · The rest of today, the drawer open (SPEC 5.2)', () => {
  const HANDLE = 'Next, in 25 minutes: 10:30, Call the dentist. Rest of today';
  const CAPSULE =
    'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.';
  const LATER = [
    '10:30, Call the dentist, in 25 minutes, 10 minutes',
    '11:00, Walk to the park, 20 minutes',
    '14:00, Ring the bank, 15 minutes',
  ];
  const ANYTIME = [
    'Renew the parking permit',
    'Order printer ink',
    'Book the boiler service',
    'Pay the window cleaner',
    'Text Sam about Saturday',
    'Water the plants',
    'Find the passport',
    'Back up the photos',
    'Post the birthday card',
    'Sort the recycling',
  ];

  async function opened(atTime = TUE_1005, scenario: 'example' | 'notStarted' = 'example') {
    const m = await mount(atTime, scenario);
    press(m.container, scenario === 'example' ? HANDLE : 'Rest of today');
    return m;
  }

  it('opens from the handle over Today, which stays current, and lands focus on its heading', async () => {
    const m = await opened();
    expect(m.container.dataset['drawer']).toBe('open');
    expect(stateOf(m).bench.drawer.running).toBe('open');
    const heading = m.container.querySelector('.drawer h1')!;
    expect(heading.textContent).toBe('Rest of today');
    expect(document.activeElement).toBe(heading);
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    // What is under the drawer is neither read nor reached.
    expect(m.container.querySelector('.screen')?.hasAttribute('inert')).toBe(true);
  });

  it('carries the step in the capsule, plain on the stone, beside capture', async () => {
    const m = await opened();
    const capsule = button(m.container, CAPSULE);
    expect(capsule.classList.contains('lift')).toBe(false);
    expect(hintOf(capsule)).toBe('Opens focus.');
    expect(id(m, 'b-capture')?.classList.contains('on-light')).toBe(true);
    expect(id(m, 'b-stepdone')).toBeNull();
    expect(() => button(m.container, 'Pause')).toThrow();
  });

  it('holds only its title and Me in the header row, and Hide at the foot', async () => {
    const m = await opened();
    const header = m.container.querySelector('.drawer header')!;
    expect([...header.children].map((child) => child.textContent)).toEqual(['Rest of today', 'Me']);
    const hide = button(m.container, 'Hide the rest of today');
    expect(header.contains(hide)).toBe(false);
    expect(hide.closest('.foot')).not.toBeNull();
    expect(hide.textContent).toBe('Hide');
  });

  it('lists the whole of today, the next timed row alone with its "in" line', async () => {
    const m = await opened();
    const list = m.container.querySelector('.drawer .list')!;
    expect(list.textContent).not.toContain(EMAIL);
    const later = [...list.querySelectorAll('.trow')];
    expect(later.map((row) => row.querySelector('small')?.textContent)).toEqual([
      'in 25 min',
      undefined,
      undefined,
    ]);
    expect(later[0]?.classList.contains('two')).toBe(true);
    // The tracks share the 20 min track's slot, so every number ends on one line.
    expect(
      [...list.querySelectorAll<HTMLElement>('.trow .dur .m')].map((m) => [
        m.style.width,
        m.style.marginRight,
      ]),
    ).toEqual([
      ['15px', '15px'],
      ['30px', '0px'],
      ['22.5px', '7.5px'],
    ]);
    // Anytime titles run full width: capture sits on the cover, not over the list.
    expect(list.querySelector('.rrow.lane')).toBeNull();
    expect(list.querySelectorAll('.rrow')).toHaveLength(10);
  });

  it('offers three choices, and reads them in SPEC 11’s order', async () => {
    const m = await opened();
    expect(choices(m.container)).toBe(3);
    expect(readingOrder(m.container)).toEqual([
      'Rest of today',
      'Me',
      'Later today',
      ...LATER,
      'Anytime today',
      ...ANYTIME.flatMap((title) => [`Mark done: ${title}`, title]),
      CAPSULE,
      'Capture',
      'Hide the rest of today',
      ...TABS,
    ]);
  });

  it('folds with Hide, where it opened, and puts focus on the handle', async () => {
    const m = await opened();
    press(m.container, 'Hide the rest of today');
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(stateOf(m).bench.drawer.running).toBe('folded');
    expect(document.activeElement).toBe(id(m, 'b-handle'));
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(m.container.querySelector('.screen')?.hasAttribute('inert')).toBe(false);
    expect(id(m, 'b-hide')).toBeNull();
  });

  it('returns to the half drawer when it was opened from there', async () => {
    const m = await opened(TUE_0958, 'notStarted');
    expect(m.container.dataset['drawer']).toBe('open');
    // The idle lantern is under the drawer, so the item it lights is listed too.
    expect(m.container.querySelector('.drawer .list')?.textContent).toContain(EMAIL);
    press(m.container, 'Hide the rest of today');
    expect(m.container.dataset['drawer']).toBe('half');
  });

  it('folds when the current tab is tapped, and goes when another is', async () => {
    const m = await opened();
    press(m.container, 'Today');
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(id(m, 'b-lit')).not.toBeNull();
    press(m.container, HANDLE);
    press(m.container, 'Tasks');
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
  });

  it('opens over a place, which stays current', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, HANDLE);
    expect(m.container.dataset['drawer']).toBe('open');
    expect(id(m, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(m.container.querySelector('.fade')?.hasAttribute('hidden')).toBe(true);
    press(m.container, 'Hide the rest of today');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
  });

  it('opens a row’s task, folding the drawer', async () => {
    const m = await opened();
    press(m.container, LATER[0]!);
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Call the dentist');
  });

  it('ticks a ring in place, its disc the way back', async () => {
    const m = await opened();
    press(m.container, 'Mark done: Order printer ink');
    expect(said(m)).toBe('Done: Order printer ink');
    expect(titled(stateOf(m), 'Order printer ink').doneAt).toBeDefined();
    press(m.container, 'Undo done: Order printer ink');
    expect(titled(stateOf(m), 'Order printer ink').doneAt).toBeUndefined();
  });

  it('opens Me from its header, folding the drawer', async () => {
    const m = await opened();
    press(m.container, 'Me');
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Me');
  });

  it('moves the next row’s "in N min" in place, without rebuilding the list', async () => {
    const m = await opened();
    const row = button(m.container, LATER[0]!);
    advance(m, 1);
    expect(button(m.container, '10:30, Call the dentist, in 24 minutes, 10 minutes')).toBe(row);
    expect(row.querySelector('small')?.textContent).toBe('in 24 min');
  });

  it('stays open for the rest of the day, through a reload', async () => {
    const m = await opened();
    const stored = stateOf(m);
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, drawer: stored.bench.drawer },
    }));
    expect(again.container.dataset['drawer']).toBe('open');
  });

  it('lists what got done today only when that reward is on', async () => {
    const m = await opened();
    expect(visibleText(m.container)).not.toContain('Done today');
    unmount();
    const on = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      rewards: setOption(state.rewards, { kind: 'day' }, 'doneList', true),
    }));
    press(on.container, HANDLE);
    expect(on.container.querySelector('.drawer')?.textContent).toContain('Done today');
    expect(readingOrder(on.container)).toContain('Bins out, done');
  });
});

describe('Me, and Settings under it (SPEC 12; plan sections 4 and 11)', () => {
  async function settings(atTime = TUE_1005, scenario: 'example' | 'clockLeftRunning' = 'example') {
    const m = await mount(atTime, scenario);
    press(m.container, 'Me');
    press(m.container, 'Settings');
    return m;
  }
  const radios = (m: Mounted, label: string) => {
    const group = [...m.container.querySelectorAll('[role="radiogroup"]')].find(
      (node) => nameOfGroup(m, node) === label,
    )!;
    return [...group.querySelectorAll<HTMLElement>('[role="radio"]')].map((radio) => [
      radio.textContent,
      radio.getAttribute('aria-checked'),
    ]);
  };
  const nameOfGroup = (m: Mounted, group: Element) =>
    m.container.querySelector(`#${group.getAttribute('aria-labelledby')}`)?.textContent;

  it('has three rows: help first, then Settings and About', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    const names = readingOrder(m.container);
    expect(
      inOrder(names, ['Me', 'If things are bad right now', 'Settings', 'About this prototype']),
    ).toEqual(['Me', 'If things are bad right now', 'Settings', 'About this prototype']);
    expect(visibleText(m.container)).not.toMatch(/Medication|Family/);
  });

  it('offers the owner’s four switches, each a radio group of two', async () => {
    const m = await settings();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Settings');
    expect(radios(m, 'Places')).toEqual([
      ['Charcoal', 'true'],
      ['White', 'false'],
    ]);
    expect(radios(m, 'List what got done today')).toEqual([
      ['Off', 'true'],
      ['On', 'false'],
    ]);
    expect(radios(m, 'A session the app closed reads')).toEqual([
      ['Paused', 'true'],
      ['Timer stopped', 'false'],
    ]);
    expect(radios(m, 'Motion')).toEqual([
      ['As the phone', 'true'],
      ['Reduced', 'false'],
    ]);
    // Back to Me, and Me itself, in the header row.
    expect(button(m.container, 'Back to Me')).toBeTruthy();
    expect(id(m, 'b-me')).not.toBeNull();
  });

  it('reads each switch’s helper line after its name', async () => {
    const m = await settings();
    const hints = [...m.container.querySelectorAll('[role="radiogroup"]')].map((group) => [
      nameOfGroup(m, group),
      hintOf(group),
    ]);
    expect(hints).toEqual([
      ['Places', 'Tasks, Routines, Library and Me. Today and Focus stay charcoal.'],
      ['List what got done today', 'Adds Done today to the rest of today, after Anytime today.'],
      [
        'A session the app closed reads',
        'The word on Today after the app closes a clock left running.',
      ],
      ['Motion', 'Reduced moves the bar once a minute, whatever the phone is set to.'],
    ]);
  });

  it('flips the places to white at once, keeping focus on the switch', async () => {
    const m = await settings();
    expect(m.container.dataset['places']).toBe('charcoal');
    const white = button(m.container, 'White');
    white.focus();
    white.click();
    expect(m.container.dataset['places']).toBe('white');
    expect(stateOf(m).bench.settings.places).toBe('white');
    expect(radios(m, 'Places')).toEqual([
      ['Charcoal', 'false'],
      ['White', 'true'],
    ]);
    expect(document.activeElement?.id).toBe('s-places-white');
    // Today stays charcoal.
    press(m.container, 'Today');
    expect(m.container.dataset['ground']).toBe('present');
  });

  it('moves along a switch with the arrow keys', async () => {
    const m = await settings();
    const charcoal = button(m.container, 'Charcoal');
    charcoal.focus();
    charcoal.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(stateOf(m).bench.settings.places).toBe('white');
    expect(document.activeElement?.id).toBe('s-places-white');
  });

  it('turns on the real "List what got done today", and the open drawer lists it', async () => {
    const m = await settings();
    press(m.container, 'On');
    press(m.container, /^Next, in 25 minutes/);
    expect(m.container.querySelector('.drawer')?.textContent).toContain('Done today');
    expect(readingOrder(m.container)).toContain('Bins out, done');
  });

  it('says "Timer stopped" on Today for a clock the app closed, when chosen', async () => {
    const m = await settings(TUE_1005, 'clockLeftRunning');
    press(m.container, 'Timer stopped');
    press(m.container, 'Today');
    expect(visibleText(m.container)).toContain('Timer stopped');
  });

  it('says in About how to keep it, what to try, and what is left out', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    const text = visibleText(m.container);
    for (const words of [
      ABOUT.what,
      ABOUT.data,
      ABOUT.home,
      ABOUT.statusBar,
      ABOUT.leftOut,
      ABOUT.font,
      ...ABOUT.tries,
    ]) {
      expect(text).toContain(words);
    }
    // Every scenario, "Start empty" among them, then Delete everything, last.
    const names = readingOrder(m.container);
    expect(
      inOrder(names, [
        'Prototype',
        'Load the example day',
        'Load: not started yet',
        'Load: a pause left',
        'Load: a clock left running',
        'Load: weeks away',
        'Start empty',
        ABOUT.deleteAll,
      ]),
    ).toEqual([
      'Prototype',
      'Load the example day',
      'Load: not started yet',
      'Load: a pause left',
      'Load: a clock left running',
      'Load: weeks away',
      'Start empty',
      ABOUT.deleteAll,
    ]);
  });

  it('starts empty from About, on nothing planned', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    press(m.container, 'Start empty');
    expect(stateOf(m).tasks).toEqual([]);
    expect(visibleText(m.container)).toContain('Nothing planned for today');
    expect(m.container.dataset['drawer']).toBe('lip');
  });

  it('reduces motion whatever the phone says', async () => {
    const m = await settings();
    expect(m.container.dataset['motion']).toBe('full');
    press(m.container, 'Reduced');
    expect(m.container.dataset['motion']).toBe('reduced');
    expect(stateOf(m).bench.settings.motion).toBe('reduced');
  });
});

describe('back, by Safari’s edge swipe or the back button (plan section 8)', () => {
  const HANDLE = /^Next, in 25 minutes: 10:30, Call the dentist/;
  const screenTitle = (m: Mounted) => m.container.querySelector('.screen h1')?.textContent;

  it('closes the top level each time: the open drawer, then the pages under Me', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    press(m.container, HANDLE);
    expect(historyDepth()).toBe(3);

    goBack();
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(document.activeElement).toBe(id(m, 'b-handle'));
    expect(screenTitle(m)).toBe('About this prototype');
    goBack();
    expect(screenTitle(m)).toBe('Me');
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(0);
  });

  it('takes back the entry of a level closed here, so back never lands on nothing', async () => {
    const m = await mount(TUE_1005);
    press(m.container, HANDLE);
    expect(historyDepth()).toBe(1);
    press(m.container, 'Hide the rest of today');
    vi.advanceTimersByTime(1);
    expect(historyDepth()).toBe(0);

    press(m.container, 'Me');
    press(m.container, 'If things are bad right now');
    expect(historyDepth()).toBe(2);
    press(m.container, 'Back to Me');
    vi.advanceTimersByTime(1);
    expect(historyDepth()).toBe(1);
    // A tab clears the pages on the current one, and their entries with them.
    press(m.container, 'Tasks');
    vi.advanceTimersByTime(1);
    expect(historyDepth()).toBe(0);
    expect(screenTitle(m)).toBe('Tasks');
  });

  it('gives a page restored from before a reload its entry again', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    window.dispatchEvent(new Event('pagehide'));
    const stored = stateOf(m).bench.ui!;
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, ui: stored, away: { since: at(TUE_1005).toISOString() } },
    }));
    expect(screenTitle(again)).toBe('Me');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(id(again, 'b-lit')).not.toBeNull();
  });

  it('takes back past a reload as back to the tab, and closes the drawer after', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    window.dispatchEvent(new Event('pagehide'));
    const stored = stateOf(m).bench.ui!;
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, ui: stored, away: { since: at(TUE_1005).toISOString() } },
    }));
    expect(screenTitle(again)).toBe('Me');
    goBack();
    expect(id(again, 'b-lit')).not.toBeNull();
    // Back once more lands on the earlier load's own entry for Today.
    goBack();
    expect(historyDepth()).toBe(0);
    expect(id(again, 'b-lit')).not.toBeNull();

    press(again.container, HANDLE);
    expect(again.container.dataset['drawer']).toBe('open');
    goBack();
    expect(again.container.dataset['drawer']).toBe('folded');
    expect(document.activeElement).toBe(id(again, 'b-handle'));
  });

  it('hands the open drawer’s entry to the page a row or Me opens from it', async () => {
    const m = await mount(TUE_1005);
    press(m.container, HANDLE);
    expect(historyDepth()).toBe(1);
    const moves = [vi.spyOn(history, 'go'), vi.spyOn(history, 'pushState')];
    press(m.container, 'Me');
    expect(screenTitle(m)).toBe('Me');
    press(m.container, HANDLE);
    press(m.container, '10:30, Call the dentist, in 25 minutes, 10 minutes');
    expect(screenTitle(m)).toBe('Call the dentist');
    expect(historyDepth()).toBe(2);
    // Opening the drawer over Me pushed once; nothing went back to be pushed again.
    expect(moves[0]).not.toHaveBeenCalled();
    expect(moves[1]).toHaveBeenCalledTimes(1);
    for (const move of moves) move.mockRestore();

    goBack();
    expect(screenTitle(m)).toBe('Me');
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('closes every level when a jump back lands past the reload', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'Settings');
    window.dispatchEvent(new Event('pagehide'));
    const stored = stateOf(m).bench.ui!;
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, ui: stored, away: { since: at(TUE_1005).toISOString() } },
    }));
    expect(screenTitle(again)).toBe('Settings');
    expect(historyDepth()).toBe(2);
    // Three back at once, as from Safari's long-press list: past this load's
    // Today onto the earlier load's entry for Me.
    history.go(-3);
    vi.advanceTimersByTime(1);
    expect(id(again, 'b-lit')).not.toBeNull();
    expect(historyDepth()).toBe(0);
    press(again.container, 'Me');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(id(again, 'b-lit')).not.toBeNull();
  });
});

describe('the Now capsule (SPEC 4)', () => {
  const capsuleOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.capsule');

  it('rides the places, lifted on charcoal, and opens focus', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    const capsule = capsuleOf(m)!;
    expect(capsule.tagName).toBe('BUTTON');
    expect(capsule.classList.contains('lift')).toBe(true);
    expect(nameOf(capsule)).toBe(
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
    );
    expect(hintOf(capsule)).toBe('Opens focus.');
    expect(capsule.querySelector('.c1')?.textContent).toBe('NowWrite the question');
    expect(capsule.querySelector('.c2')?.textContent).toBe('18 min left·Write the school email');
    expect(capsule.querySelector('.bar')?.className).toBe('bar bar-capsule is-burn');
    expect(m.container.querySelector('.fade')?.hasAttribute('hidden')).toBe(false);
    // Not in the capsule: the step count, the note, "of 25" and the end time.
    expect(capsule.textContent).not.toMatch(/step 2 of 3|of 25|ends|permission/);
  });

  it('is plain charcoal on white places', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    press(m.container, 'Routines');
    expect(capsuleOf(m)?.classList.contains('lift')).toBe(false);
    expect(m.container.dataset['places']).toBe('white');
  });

  it('counts up once the estimate is used up, and the name gives way', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    advance(m, 20);
    const capsule = capsuleOf(m)!;
    expect(capsule.querySelector('.c2 b')?.textContent).toBe('27 min so far');
    expect(capsule.querySelector('.bar')?.className).toBe('bar bar-capsule is-over');
    expect(nameOf(capsule).endsWith('27 minutes so far, estimate 25.')).toBe(true);
  });

  it('with no estimate, grows as one length', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      tasks: model.setEstimate(state.tasks, emailOf(state).id, undefined),
    }));
    press(m.container, 'Library');
    const capsule = capsuleOf(m)!;
    expect(capsule.querySelector('.c2 b')?.textContent).toBe('7 min so far');
    expect(capsule.querySelector('.bar')?.className).toBe('bar bar-capsule is-countUp');
  });

  it('paused: the word where Now was, the minutes in white', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    press(m.container, 'Tasks');
    const capsule = capsuleOf(m)!;
    expect(capsule.querySelector('.ptag')?.textContent).toBe('Paused');
    expect(capsule.querySelector('.nowtag')).toBeNull();
    expect(capsule.querySelector('.c2 b')?.className).toBe('still');
    expect(capsule.querySelector('.c2 b')?.textContent).toBe('18 min left');
    expect(capsule.querySelector('.bar')?.className).toBe('bar bar-capsule is-paused is-frozen');
    expect(nameOf(capsule).startsWith('Paused: Write the question')).toBe(true);
  });

  it('paused with the estimate used up: "estimate 25" alone', async () => {
    const m = await mount(TUE_1005, 'clockLeftRunning');
    press(m.container, 'Tasks');
    const capsule = capsuleOf(m)!;
    expect(capsule.querySelector('.c2')?.textContent).toBe('estimate 25');
    expect(capsule.querySelector('.tn')).toBeNull();
    expect(capsule.querySelector('.bar')?.className).toBe('bar bar-capsule is-over is-frozen');
  });

  it('a task with no steps: its title on line 1 and the minutes alone', async () => {
    const m = await mount(TUE_1005, 'example', (state, now) => {
      const bins = titled(state, 'Book the boiler service');
      let tasks = model.setEstimate(state.tasks, bins.id, 25);
      tasks = model.startWork(tasks, bins.id, new Date(now.getTime() - 7 * 60_000));
      return { ...state, tasks };
    });
    press(m.container, 'Tasks');
    const capsule = capsuleOf(m)!;
    expect(capsule.querySelector('.cstep')?.textContent).toBe('Book the boiler service');
    expect(capsule.querySelector('.c2')?.textContent).toBe('18 min left');
    expect(nameOf(capsule)).toBe(
      'Now: Book the boiler service. 18 of 25 minutes left, ends 10:23.',
    );
  });

  it('is hidden on Today, with nothing running, and on the crisis page', async () => {
    const m = await mount(TUE_1005);
    expect(capsuleOf(m)).toBeNull();
    press(m.container, 'Me');
    expect(capsuleOf(m)).not.toBeNull();
    press(m.container, 'If things are bad right now');
    expect(capsuleOf(m)).toBeNull();
    expect(id(m, 'b-capture')).not.toBeNull();
    unmount();
    const idle = await mount(TUE_0958, 'notStarted');
    press(idle.container, 'Tasks');
    expect(capsuleOf(idle)).toBeNull();
    expect(idle.container.querySelector('.fade')?.hasAttribute('hidden')).toBe(true);
  });
});

describe('the frame (SPEC 3)', () => {
  it('has four tabs, the current one marked, and never a count', async () => {
    const m = await mount(TUE_1005);
    const tabs = [...m.container.querySelectorAll('nav button')];
    expect(tabs.map((tab) => tab.textContent)).toEqual(TABS);
    expect(tabs.map((tab) => tab.getAttribute('aria-current'))).toEqual(['page', null, null, null]);
    press(m.container, 'Routines');
    expect(id(m, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(m.container.dataset['ground']).toBe('place');
    expect(m.container.querySelector('h1')?.textContent).toBe('Routines');
    // The drawer rests folded on a place, with the same Next line.
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(button(m.container, /^Next, in 25 minutes/)).toBeTruthy();
  });

  it('pushes Me on the current tab, which stays current', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(m.container.querySelector('h1')?.textContent).toBe('Me');
    press(m.container, 'Today');
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('keeps "If things are bad right now" two taps from anywhere', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Me');
    press(m.container, 'If things are bad right now');
    const text = visibleText(m.container);
    expect(text).toContain('If you are in immediate danger, call your local emergency number.');
    expect(text).toContain('Samaritans');
    expect(m.container.querySelector('a[href^="tel:"]')).not.toBeNull();
    press(m.container, 'Back to Me');
    expect(m.container.querySelector('h1')?.textContent).toBe('Me');
  });

  it('loads a scenario from About and opens on Today', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    press(m.container, 'Load: weeks away');
    expect(visibleText(m.container)).toContain('Nothing planned for today');
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
  });

  it('deletes everything, after a confirm', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    press(m.container, ABOUT.deleteAll);
    expect(stateOf(m).tasks).toEqual([]);
    expect(visibleText(m.container)).toContain('Nothing planned for today');
  });

  it('opens on the example day the first time, with nothing stored', async () => {
    const m = await mount(TUE_1005, 'nothing');
    expect(button(m.container, /^Now: Write the question\./)).toBeTruthy();
  });

  it('writes when it went away and where the person was, on hide', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    window.dispatchEvent(new Event('pagehide'));
    const bench = stateOf(m).bench;
    expect(bench.away).toEqual({ since: at(TUE_1005).toISOString() });
    expect(bench.ui).toMatchObject({ tab: 'tasks', stack: [], at: at(TUE_1005).toISOString() });
  });

  it('comes back exactly where it was after a short time, and to Today after longer', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 5 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    expect(stateOf(m).bench.away).toBeUndefined();

    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 40 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('closes a clock forgotten in the background, and opens on paused Today', async () => {
    const m = await mount(TUE_1005);
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 45 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    const text = visibleText(m.container);
    expect(text).toContain('Paused');
    expect(text).toContain('estimate 25');
    expect(text).not.toMatch(/45|away|ago/);
  });

  it('turns the day at 04:00 in the hand, and leaves a watched clock running', async () => {
    const m = await mount('2026-11-25T03:58:00', 'example');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    advance(m, 3); // 04:01
    expect(stateOf(m).bench.day).toBe('2026-11-25');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(id(m, 'b-lit')).not.toBeNull();
  });
});
