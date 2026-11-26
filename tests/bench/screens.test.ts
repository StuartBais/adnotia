import { afterEach, describe, expect, it, vi } from 'vitest';
import * as model from '../../src/domains/tasks';
import * as routineModel from '../../src/domains/routines';
import { setOption } from '../../src/domains/options';
import { EMAIL } from '../../src/bench/example';
import type { BenchDomains } from '../../src/bench/state';
import { ABOUT } from '../../src/bench/screens/places';
import { ANNOUNCE_KEEP, MOVE_GIVE_UP } from '../../src/bench/app';
import { dayList } from '../../src/bench/view';
import {
  advance,
  button,
  choices,
  controls,
  drawnText,
  fly,
  goBack,
  hintOf,
  historyDepth,
  layOut,
  mount,
  nameOf,
  outlastFade,
  outlastSheet,
  outlastUndo,
  press,
  pressTab,
  pull,
  readText,
  readingOrder,
  reload,
  said,
  settle,
  stateOf,
  type,
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

/** The status bar's colour, as the page's theme-color meta says it. */
const themeColour = () =>
  document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

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

  it('empties the live region once it has spoken, so Paused is not left there to be read', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Pause');
    expect(said(m)).toBe('Paused');
    press(m.container, 'Resume');
    // Resume says nothing of its own (SPEC 11, "Announcements"), and the
    // region no longer says Paused once the clock runs and the words are old.
    vi.advanceTimersByTime(ANNOUNCE_KEEP);
    expect(m.container.querySelector('.live')?.textContent).toBe('');
    // Every announcement goes the same way.
    press(m.container, 'Step done: Write the question');
    expect(said(m)).toBe('Step done. Now: Read it once and send');
    vi.advanceTimersByTime(ANNOUNCE_KEEP - 1);
    expect(m.container.querySelector('.live')?.textContent).toBe(
      'Step done. Now: Read it once and send',
    );
    vi.advanceTimersByTime(1);
    expect(m.container.querySelector('.live')?.textContent).toBe('');
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

  it('keeps a row ticked on the open drawer as a disc on the half one, after Hide', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Rest of today');
    expect(m.container.dataset['drawer']).toBe('open');
    press(m.container, 'Mark done: Renew the parking permit');
    press(m.container, 'Hide the rest of today');
    expect(m.container.dataset['drawer']).toBe('half');
    // Inside the six seconds and after them: the disc is still the way back.
    const disc = button(m.container, 'Undo done: Renew the parking permit');
    expect(disc.closest('li')?.classList.contains('done')).toBe(true);
    outlastUndo();
    press(m.container, 'Undo done: Renew the parking permit');
    expect(titled(stateOf(m), 'Renew the parking permit').doneAt).toBeUndefined();
  });

  it('keeps a row ticked on the half drawer as a disc when the drawer opens', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Mark done: Renew the parking permit');
    press(m.container, 'Rest of today');
    expect(m.container.dataset['drawer']).toBe('open');
    press(m.container, 'Undo done: Renew the parking permit');
    expect(titled(stateOf(m), 'Renew the parking permit').doneAt).toBeUndefined();
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

  it('lands focus on the Tasks title, never on the page, when the inbox opens from the keyboard', async () => {
    const m = await mount(MON_0912, 'weeksAway');
    button(m.container, 'Open the inbox').focus();
    press(m.container, 'Open the inbox');
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(m.container.querySelector('.screen h1'));
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

  it('turns the status bar white on white places, and charcoal again in Focus and on Today', async () => {
    const m = await settings();
    expect(themeColour()).toBe('#222624');
    press(m.container, 'White');
    expect(themeColour()).toBe('#FFFFFF');
    press(m.container, 'Tasks');
    expect(themeColour()).toBe('#FFFFFF');
    press(m.container, /^Now: Write the question, step 2 of 3/);
    expect(m.container.dataset['focus']).toBe('open');
    expect(themeColour()).toBe('#222624');
    press(m.container, 'Back to Tasks');
    expect(themeColour()).toBe('#FFFFFF');
    press(m.container, 'Today');
    expect(themeColour()).toBe('#222624');
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

  it.each([ABOUT.deleteAll, 'Start empty', 'Load: weeks away'])(
    'takes history back once when About, over a task’s page, runs %s',
    async (name) => {
      const m = await mount(TUE_1005);
      press(m.container, 'Tasks');
      press(m.container, 'Fix the bike light');
      press(m.container, 'Me');
      press(m.container, 'About this prototype');
      expect(historyDepth()).toBe(3);
      const go = vi.spyOn(history, 'go');
      press(m.container, name);
      // The task's page went with the day, and Today came back: one move.
      expect(go.mock.calls).toEqual([[-3]]);
      go.mockRestore();
      vi.advanceTimersByTime(1);
      expect(historyDepth()).toBe(0);
      expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
      // Nothing is left owed, so the next back closes the next level.
      press(m.container, 'Me');
      expect(historyDepth()).toBe(1);
      goBack();
      expect(screenTitle(m)).not.toBe('Me');
      expect(historyDepth()).toBe(0);
    },
  );

  it('puts history right when the browser drops a move back made here', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'If things are bad right now');
    expect(historyDepth()).toBe(2);
    // The browser does nothing with the move back for Back to Me.
    const go = vi.spyOn(history, 'go').mockImplementationOnce(() => undefined);
    press(m.container, 'Back to Me');
    expect(screenTitle(m)).toBe('Me');
    expect(historyDepth()).toBe(2);
    // Given up on, the move is made again from where history really is.
    vi.advanceTimersByTime(MOVE_GIVE_UP);
    vi.advanceTimersByTime(5);
    expect(go.mock.calls).toEqual([[-1], [-1]]);
    go.mockRestore();
    expect(historyDepth()).toBe(1);
    // So the next back closes Me rather than being taken for that move.
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(historyDepth()).toBe(0);
  });

  it('moves history back one move at a time, landing each before the next', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'If things are bad right now');
    const go = vi.spyOn(history, 'go');
    press(m.container, 'Back to Me');
    // A second level closed before the first move lands waits for it.
    press(m.container, 'Today');
    expect(go.mock.calls).toEqual([[-1]]);
    // jsdom lands each traversal a few timer turns later.
    vi.advanceTimersByTime(5);
    expect(go.mock.calls).toEqual([[-1], [-1]]);
    go.mockRestore();
    expect(historyDepth()).toBe(0);
    expect(id(m, 'b-lit')).not.toBeNull();
    press(m.container, 'Me');
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
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

describe('where focus lands as a page comes and goes (SPEC 11, reading order)', () => {
  /** A control pressed as a keyboard or VoiceOver presses it: it had focus first. */
  const pressFocused = (m: Mounted, name: string | RegExp) => {
    button(m.container, name).focus();
    press(m.container, name);
  };
  const focused = () => document.activeElement as HTMLElement | null;
  const titleOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.screen h1')!;

  it('lands on the title of Me, and of each page under it, rather than the handle', async () => {
    const m = await mount(TUE_1005);
    pressFocused(m, 'Me');
    expect(focused()).toBe(titleOf(m));
    expect(focused()?.textContent).toBe('Me');
    for (const [row, title] of [
      ['If things are bad right now', 'If things are bad right now'],
      ['Settings', 'Settings'],
      ['About this prototype', 'About this prototype'],
    ] as const) {
      pressFocused(m, row);
      expect(focused()?.textContent, row).toBe(title);
      expect(focused()?.tagName).toBe('H1');
      // Back to Me lands on the row the page was opened from.
      pressFocused(m, 'Back to Me');
      expect(focused()?.textContent, `back from ${row}`).toBe(row);
    }
  });

  it('lands back on the row a page was opened from, in Tasks, Routines and the Library', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressFocused(m, 'Fix the bike light');
    expect(focused()?.id).toBe('p-title');
    pressFocused(m, 'Back to Tasks');
    expect(nameOf(focused()!)).toBe('Fix the bike light');

    press(m.container, 'Routines');
    pressFocused(m, 'Leaving the house, 4 steps');
    pressFocused(m, 'Back to Routines');
    expect(nameOf(focused()!)).toBe('Leaving the house, 4 steps');

    press(m.container, 'Library');
    pressFocused(m, 'Sleep, Bedtimes, waking and winding down');
    pressFocused(m, 'Back to Library');
    expect(nameOf(focused()!)).toBe('Sleep, Bedtimes, waking and winding down');
  });

  it('lands on the row after the edge swipe back too', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    pressFocused(m, 'Settings');
    goBack();
    expect(nameOf(focused()!)).toBe('Settings');
  });

  it('lands on Me’s title from Focus and from the open drawer', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Now: Write the question\. Step 2 of 3/);
    settle(m);
    pressFocused(m, 'Me');
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(focused()).toBe(titleOf(m));
    expect(focused()?.textContent).toBe('Me');

    press(m.container, 'Today');
    press(m.container, /^Next, in 25 minutes/);
    expect(m.container.dataset['drawer']).toBe('open');
    pressFocused(m, 'Me');
    expect(focused()).toBe(titleOf(m));
  });

  it('lands on the place’s title when a task opened from it is deleted', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Cancel the gym trial, 2 steps');
    press(m.container, 'More');
    press(m.container, 'Delete');
    pressFocused(m, 'Delete');
    expect(focused()).toBe(titleOf(m));
    expect(focused()?.textContent).toBe('Tasks');
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

  it('keeps the Tasks list chosen after a short time, and opens the inbox after longer, as a reload does', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Done');
    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 5 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(id(m, 'l-done')?.getAttribute('aria-selected')).toBe('true');

    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 40 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    press(m.container, 'Tasks');
    expect(id(m, 'l-inbox')?.getAttribute('aria-selected')).toBe('true');
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

describe('4 · Focus (SPEC 5.4)', () => {
  const LIT = /^Now: Write the question\. Step 2 of 3/;
  const CAPSULE = /^Now: Write the question, step 2 of 3/;
  const FOOT = 'Later today: 10:30, Call the dentist, in 25 minutes';
  const ASIDE = 'Set aside Write the school email. It keeps its place at step 2.';
  const layerOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.focus')!;
  const footOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.ffoot')!;
  const screenTitle = (m: Mounted) => m.container.querySelector('.screen h1')?.textContent;

  async function focused(local = TUE_1005, scenario: 'example' | 'pauseLeft' = 'example') {
    const m = await mount(local, scenario);
    press(m.container, scenario === 'example' ? LIT : /^Paused: Write the question\./);
    return m;
  }

  it('opens from the lit block over Today, with no tabs and no drawer, and lands on the step', async () => {
    const m = await focused();
    expect(m.container.dataset['focus']).toBe('open');
    expect(layerOf(m).hidden).toBe(false);
    const step = id(m, 'f-step')!;
    expect(document.activeElement).toBe(step);
    expect(step.getAttribute('tabindex')).toBe('-1');
    for (const under of ['.screen', '.drawer', '.tabs', '.fade']) {
      expect(m.container.querySelector(under)?.hasAttribute('inert'), under).toBe(true);
    }
    // Focus is the capsule opened all the way: it never shows the capsule.
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(themeColour()).toBe('#222624');
    // Today is not changed under it.
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
  });

  it('says what it is in ash above the step, the bar edge to edge, +5 min beside the minutes', async () => {
    const m = await focused();
    const layer = layerOf(m);
    expect(layer.querySelector('.fctx')?.textContent).toContain('Focus');
    expect(readText(layer.querySelector('.fctx')!)).toBe(
      'Focus, Write the school email, step 2 of 3',
    );
    expect(layer.querySelector('.fdone-t')?.textContent).toBe('Find the school address');
    expect(id(m, 'f-step')?.textContent).toContain('Write the question');
    expect(layer.querySelector('.fafter')?.textContent).toBe('After this: Read it once and send');
    const bar = layer.querySelector('.bar')!;
    expect(bar.className).toBe('bar bar-focus is-burn');
    expect(bar.getAttribute('role')).toBe('meter');
    expect(nameOf(bar)).toBe('Time left');
    expect(bar.getAttribute('aria-valuetext')).toBe('18 of 25 minutes left');
    expect(bar.getAttribute('aria-valuenow')).toBe('18');
    expect(bar.getAttribute('aria-valuemax')).toBe('25');
    const minutes = layer.querySelector('.fmins')!;
    expect(minutes.querySelector('strong')?.textContent).toBe('18 min left');
    expect(minutes.querySelector('.rest')?.textContent).toBe('of 25 · ends 10:23');
    expect(id(m, 'f-five')?.textContent).toBe('+5 min');
    expect(nameOf(id(m, 'f-five')!)).toBe('Add 5 minutes');
    expect(layer.querySelector('.fnote')?.textContent).toContain(
      'When is the permission slip due?',
    );
    // The step is the one white heading; the context line is not white.
    expect(layer.querySelectorAll('h1, h2')).toHaveLength(2);
  });

  it('cuts a long title on the context line, never "step 2 of 3", and says it whole', async () => {
    const LONG = 'Write the school email to Mrs Henderson about the trip on Friday';
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === emailOf(state).id ? { ...task, title: LONG } : task,
      ),
    }));
    press(m.container, LIT);
    const shown = layerOf(m).querySelector('.fctx-shown')!;
    // A row: the title is the part that gives way, and the count stands after it.
    const parts = [...shown.children].filter((part) => !part.classList.contains('sep'));
    expect(parts.map((part) => part.textContent)).toEqual(['Focus', LONG, 'step 2 of 3']);
    expect(parts[1]?.className).toBe('fctx-title');
    expect(readText(layerOf(m).querySelector('.fctx')!)).toBe(`Focus, ${LONG}, step 2 of 3`);
  });

  it('keeps Today’s three on the dock line, in Today’s places', async () => {
    const m = await focused();
    expect(nameOf(id(m, 'b-stepdone')!)).toBe('Step done: Write the question');
    expect(id(m, 'b-stepdone')?.className).toContain('white');
    expect(nameOf(id(m, 'b-pause')!)).toBe('Pause');
    expect(id(m, 'b-capture')?.classList.contains('on-light')).toBe(false);
  });

  it('sets the foot under the hairline in the Next line’s words, as text, with "Later today"', async () => {
    const m = await focused();
    const foot = footOf(m);
    expect(foot.querySelector('.hair')).not.toBeNull();
    const line = foot.querySelector('.ff-line')!;
    expect(line.tagName).toBe('P');
    expect(line.textContent).toContain('Later today');
    expect(line.textContent).toContain('10:30 Call the dentist');
    expect(line.textContent).toContain('in 25 min');
    expect(line.textContent).not.toContain('Next');
    expect(readText(line)).toBe(FOOT);
    expect(foot.querySelector('button')).toBeNull();
  });

  it('offers five choices, and reads them in SPEC 11’s order', async () => {
    const m = await focused();
    expect(choices(m.container)).toBe(5);
    expect(readingOrder(m.container)).toEqual([
      'Back to Today',
      'Me',
      'Focus, Write the school email, step 2 of 3',
      'Undo step done: Find the school address',
      'Now: Write the question',
      'After this: Read it once and send',
      'Time left',
      '18 of 25 minutes left, ends 10:23',
      'Add 5 minutes',
      'Note: When is the permission slip due?',
      'Step done: Write the question',
      'Pause',
      'Capture',
      FOOT,
    ]);
    expect(hintOf(button(m.container, 'Back to Today'))).toBe('The timer keeps running.');
  });

  it('moves the bar, the minutes and the foot in place as time passes', async () => {
    const m = await focused();
    const step = id(m, 'f-step');
    const fill = layerOf(m).querySelector<HTMLElement>('.bar')!;
    const before = fill.style.getPropertyValue('--p');
    advance(m, 1);
    expect(id(m, 'f-step')).toBe(step);
    expect(fill.style.getPropertyValue('--p')).not.toBe(before);
    expect(layerOf(m).querySelector('.fmins strong')?.textContent).toBe('17 min left');
    expect(fill.getAttribute('aria-valuetext')).toBe('17 of 25 minutes left');
    expect(readText(footOf(m).querySelector('.ff-line')!)).toBe(
      'Later today: 10:30, Call the dentist, in 24 minutes',
    );
  });

  it('turns into the used-up form in place: "27 min so far" over "estimate 25", the outline', async () => {
    const m = await focused();
    advance(m, 20);
    const layer = layerOf(m);
    expect(layer.querySelector('.fmins strong')?.textContent).toBe('27 min so far');
    expect(layer.querySelector('.fmins .rest')?.textContent).toBe('estimate 25');
    expect(layer.querySelector('.bar')?.className).toBe('bar bar-focus is-over');
    expect(layer.querySelector('.bar')?.getAttribute('aria-valuetext')).toBe(
      '27 minutes so far, estimate 25',
    );
    expect(visibleText(m.container)).not.toMatch(/\b0 min left/);
  });

  it('+5 min adds five to the estimate, and says what the bar now reads', async () => {
    const m = await focused();
    press(m.container, 'Add 5 minutes');
    expect(emailOf(stateOf(m)).estimateMinutes).toBe(30);
    expect(said(m)).toBe('23 of 30 minutes left, ends 10:28');
    expect(layerOf(m).querySelector('.fmins strong')?.textContent).toBe('23 min left');
    expect(layerOf(m).querySelector('.fmins .rest')?.textContent).toBe('of 30 · ends 10:28');
  });

  it('+5 min over a used-up estimate starts from the minutes so far, so five are left', async () => {
    const m = await focused();
    advance(m, 20); // 27 minutes worked of 25
    press(m.container, 'Add 5 minutes');
    expect(emailOf(stateOf(m)).estimateMinutes).toBe(32);
    expect(layerOf(m).querySelector('.fmins strong')?.textContent).toBe('5 min left');
    expect(layerOf(m).querySelector('.bar')?.className).toBe('bar bar-focus is-burn');
  });

  it('+5 min with no estimate sets one at the minutes so far plus five', async () => {
    const m = await mount(TUE_1005, 'example', (state) => {
      const email = emailOf(state);
      return { ...state, tasks: model.setEstimate(state.tasks, email.id, undefined) };
    });
    press(m.container, /^Now: Write the question\. Step 2 of 3/);
    expect(layerOf(m).querySelector('.fmins strong')?.textContent).toBe('7 min so far');
    expect(layerOf(m).querySelector('.bar')?.className).toBe('bar bar-focus is-countUp');
    press(m.container, 'Add 5 minutes');
    expect(emailOf(stateOf(m)).estimateMinutes).toBe(12);
    expect(layerOf(m).querySelector('.fmins strong')?.textContent).toBe('5 min left');
  });

  it('Step done moves to the next step, the done one above it, and the foot offers Undo', async () => {
    const m = await focused();
    settle(m);
    press(m.container, 'Step done: Write the question');
    expect(said(m)).toBe('Step done. Now: Read it once and send');
    expect(id(m, 'f-step')?.textContent).toContain('Read it once and send');
    expect(nameOf(id(m, 'f-disc')!)).toBe('Undo step done: Write the question');
    const line = footOf(m).querySelector('.ff-line')!;
    expect(line.textContent).toContain('Step done');
    expect(line.textContent).toContain('Write the question');
    // The pill and the disc name the same thing, and both take it back.
    const undo = id(m, 'b-undo')!;
    expect(nameOf(undo)).toBe('Undo step done: Write the question');
    expect(undo.textContent).toBe('Undo');
    expect(footOf(m).contains(undo)).toBe(true);
    // One Undo on screen: the Next line under Focus does not carry it too.
    expect(m.container.querySelectorAll('#b-undo')).toHaveLength(1);
    // Counted as frame, as on Today.
    expect(choices(m.container)).toBe(5);
    // On the last step, the white pill reads Done.
    expect(id(m, 'b-stepdone')?.textContent).toBe('Done');
  });

  it('the done step’s disc un-ticks it and makes it the current step again', async () => {
    const m = await focused();
    press(m.container, 'Undo step done: Find the school address');
    expect(said(m)).toBe('Undone. Now: Find the school address');
    expect(id(m, 'f-step')?.textContent).toContain('Find the school address');
    expect(id(m, 'f-disc')).toBeNull();
    // The line stays, empty, so the step keeps its height on the screen.
    expect(layerOf(m).querySelector('.fdone')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(id(m, 'f-step'));
    expect(choices(m.container)).toBe(4);
  });

  it('pauses in place: Paused in words, the bar still, Set aside beside the minutes', async () => {
    const m = await focused();
    settle(m);
    press(m.container, 'Pause');
    expect(said(m)).toBe('Paused');
    expect(m.container.dataset['focus']).toBe('open');
    const layer = layerOf(m);
    // On the screen, not only in the spoken words (SPEC 11): after Focus's
    // name on the context line, in white, as on paused Today's Now line.
    const context = layer.querySelector('.fctx')!;
    expect(drawnText(context)).toBe('Focus · Paused · Write the school email · step 2 of 3');
    expect(context.querySelector('.fctx-lead')?.textContent).toBe('Paused');
    expect(readText(context)).toBe('Focus, Paused, Write the school email, step 2 of 3');
    expect(readText(id(m, 'f-step')!)).toBe('Paused: Write the question');
    expect(layer.querySelector('.bar')?.className).toBe('bar bar-focus is-paused is-frozen');
    expect(layer.querySelector('.fmins strong')?.className).toContain('still');
    expect(layer.querySelector('.fmins .rest')?.textContent).toBe('of 25');
    expect(visibleText(layer)).not.toContain('ends');
    expect(id(m, 'f-five')).toBeNull();
    expect(nameOf(id(m, 'f-aside')!)).toBe(ASIDE);
    expect(id(m, 'b-pause')?.textContent).toBe('Resume');
    expect(id(m, 'b-pause')?.className).toContain('white');
    expect(id(m, 'b-stepdone')?.className).toContain('ash');
    // Paused, the clock is not running, so "⌄ Today" does not say it is.
    expect(hintOf(button(m.container, 'Back to Today'))).toBeUndefined();
  });

  it('offers five choices paused, and reads them in order', async () => {
    const m = await focused(TUE_1320, 'pauseLeft');
    expect(choices(m.container)).toBe(5);
    expect(readingOrder(m.container)).toEqual([
      'Back to Today',
      'Me',
      'Focus, Paused, Write the school email, step 2 of 3',
      'Undo step done: Find the school address',
      'Paused: Write the question',
      'After this: Read it once and send',
      'Time left',
      '18 of 25 minutes left',
      ASIDE,
      'Note: When is the permission slip due?',
      'Step done: Write the question',
      'Resume',
      'Capture',
      // The passed call, as paused Today's Next line names it (SPEC 9.8).
      'Anytime today: Call the dentist',
    ]);
  });

  it('says "Timer stopped" on the context line for a clock the app closed, when chosen', async () => {
    const m = await mount(TUE_1005, 'clockLeftRunning', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, closedLabel: 'stopped' } },
    }));
    press(m.container, /^Timer stopped: Write the question\./);
    const context = layerOf(m).querySelector('.fctx')!;
    expect(drawnText(context)).toBe('Focus · Timer stopped · Write the school email · step 2 of 3');
    expect(readText(context)).toBe('Focus, Timer stopped, Write the school email, step 2 of 3');
    expect(readText(id(m, 'f-step')!)).toBe('Timer stopped: Write the question');
  });

  it('opens paused with the estimate used up on the outline and "estimate 25"', async () => {
    const m = await mount(TUE_1005, 'clockLeftRunning');
    press(m.container, /^Paused: Write the question\./);
    const layer = layerOf(m);
    expect(layer.querySelector('.fmins strong')?.textContent).toBe('estimate 25');
    expect(layer.querySelector<HTMLElement>('.fmins .rest')?.hidden).toBe(true);
    expect(layer.querySelector('.bar')?.className).toBe('bar bar-focus is-over is-frozen');
    expect(visibleText(m.container)).not.toMatch(/\b0 min left/);
  });

  it('Resume runs it again and the foot offers Undo, which pauses it again', async () => {
    const m = await focused(TUE_1320, 'pauseLeft');
    settle(m);
    press(m.container, 'Resume');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(footOf(m).querySelector('.ff-line')?.textContent).toContain('Resumed');
    press(m.container, `Undo resume: ${EMAIL}`);
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    expect(m.container.dataset['focus']).toBe('open');
    expect(document.activeElement).toBe(id(m, 'f-foot'));
  });

  it('Set aside folds Focus back to Today, whose Next line offers Undo', async () => {
    const m = await focused(TUE_1320, 'pauseLeft');
    button(m.container, ASIDE).focus();
    press(m.container, ASIDE);
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(visibleText(m.container.querySelector('.screen')!)).toContain('Nothing running');
    const handle = id(m, 'b-handle')!;
    expect(handle.querySelector('.h-l1')?.textContent).toBe('Set aside');
    expect(button(m.container, `Undo set aside: ${EMAIL}`)).toBeTruthy();
    expect(document.activeElement).toBe(id(m, 'b-idle'));
  });

  it('Done on the last step folds Focus back to Today, whose Next line offers Undo', async () => {
    const m = await focused();
    settle(m);
    press(m.container, 'Step done: Write the question');
    press(m.container, 'Done: Read it once and send');
    expect(said(m)).toBe(`Done: ${EMAIL}`);
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(button(m.container, 'Undo step done: Read it once and send')).toBeTruthy();
    expect(m.container.dataset['drawer']).toBe('folded');
  });

  it.each([
    ['the step, as a tap in Safari leaves it', false],
    ['Done itself, as VoiceOver leaves it', true],
  ])('Done over a place folds Focus back and lands on the handle, from %s', async (_, onDone) => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, CAPSULE);
    settle(m);
    press(m.container, 'Step done: Write the question');
    if (onDone) id(m, 'b-stepdone')!.focus();
    else expect(document.activeElement).toBe(id(m, 'f-step'));
    press(m.container, 'Done: Read it once and send');
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(screenTitle(m)).toBe('Tasks');
    // No capsule now, and a place has no block of its own.
    expect(id(m, 'b-capsule')).toBeNull();
    const handle = id(m, 'b-handle')!;
    expect(document.activeElement).toBe(handle);
    expect(handle.querySelector('.h-l1')?.textContent).toBe('Step done');
    expect(button(m.container, 'Undo step done: Read it once and send')).toBeTruthy();
  });

  it('"⌄ Today" folds it back into the lantern; the clock keeps running', async () => {
    const m = await focused();
    press(m.container, 'Back to Today');
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(document.activeElement).toBe(id(m, 'b-lit'));
    // It fades out, read by nothing meanwhile, then goes.
    expect(layerOf(m).hasAttribute('inert')).toBe(true);
    expect(layerOf(m).hasAttribute('data-leaving')).toBe(true);
    outlastFade();
    expect(layerOf(m).hidden).toBe(true);
    expect(layerOf(m).childElementCount).toBe(0);
    expect(m.container.querySelector('.screen')?.hasAttribute('inert')).toBe(false);
    expect(m.container.querySelector('.tabs')?.hasAttribute('inert')).toBe(false);
  });

  it('opens from the capsule on a place as "⌄ Tasks", and goes back there', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, CAPSULE);
    expect(m.container.dataset['focus']).toBe('open');
    const back = button(m.container, 'Back to Tasks');
    expect(back.textContent).toBe('Tasks');
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    press(m.container, 'Back to Tasks');
    expect(screenTitle(m)).toBe('Tasks');
    expect(document.activeElement).toBe(id(m, 'b-capsule'));
  });

  it('opens from the capsule on a page pushed on a tab, and goes back to that page', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'Me');
    press(m.container, CAPSULE);
    press(m.container, 'Back to Routines');
    expect(screenTitle(m)).toBe('Me');
    expect(id(m, 't-routines')?.getAttribute('aria-current')).toBe('page');
  });

  it('opens from the capsule on the open drawer, folding it', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Next, in 25 minutes/);
    press(m.container, CAPSULE);
    expect(m.container.dataset['focus']).toBe('open');
    expect(m.container.dataset['drawer']).toBe('folded');
    press(m.container, 'Back to Today');
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(m.container.dataset['drawer']).toBe('folded');
  });

  it('keeps help two taps away: Me opens over the tab, and Focus folds away', async () => {
    const m = await focused();
    press(m.container, 'Me');
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(screenTitle(m)).toBe('Me');
    press(m.container, 'If things are bad right now');
    expect(visibleText(m.container)).toContain('Samaritans');
    // No timer of any kind there.
    expect(m.container.querySelector('.capsule')).toBeNull();
  });

  it('is built afresh when opened again while it is still fading out', async () => {
    const m = await focused();
    press(m.container, 'Back to Today');
    expect(layerOf(m).hasAttribute('data-leaving')).toBe(true);
    settle(m);
    press(m.container, LIT);
    expect(layerOf(m).hasAttribute('data-leaving')).toBe(false);
    expect(layerOf(m).hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(id(m, 'f-step'));
    outlastFade();
    expect(layerOf(m).hidden).toBe(false);
    expect(id(m, 'f-back')).not.toBeNull();
  });

  it('fades the capsule in, already in its slot, as the lantern or Focus folds into it', async () => {
    const m = await mount(TUE_1005);
    const stepDone = id(m, 'b-stepdone');
    press(m.container, LIT);
    // Today and Focus hold the same buttons in the same places: nothing redrawn.
    expect(id(m, 'b-stepdone')).toBe(stepDone);
    expect(stepDone?.classList.contains('enter')).toBe(false);
    press(m.container, 'Back to Today');
    press(m.container, 'Tasks');
    expect(id(m, 'b-capsule')?.classList.contains('enter')).toBe(true);
    press(m.container, CAPSULE);
    // Focus fades in whole, its buttons with it.
    expect(id(m, 'b-stepdone')?.classList.contains('enter')).toBe(true);
    expect(id(m, 'b-pause')?.classList.contains('enter')).toBe(true);
    press(m.container, 'Back to Tasks');
    expect(id(m, 'b-capsule')?.classList.contains('enter')).toBe(true);
    // A capsule that only changes its figures is not faded again.
    const capsule = id(m, 'b-capsule');
    advance(m, 1);
    expect(id(m, 'b-capsule')).toBe(capsule);
  });

  it('is a level of its own in history: back closes it, as "⌄ Today" does', async () => {
    const m = await mount(TUE_1005);
    press(m.container, LIT);
    expect(historyDepth()).toBe(1);
    goBack();
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(historyDepth()).toBe(0);

    settle(m);
    press(m.container, LIT);
    expect(historyDepth()).toBe(1);
    press(m.container, 'Back to Today');
    vi.advanceTimersByTime(1);
    expect(historyDepth()).toBe(0);
  });

  it('closes before the page under it, and takes the entry of the drawer it folded', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, /^Next, in 25 minutes/);
    expect(historyDepth()).toBe(2);
    const moves = [vi.spyOn(history, 'go'), vi.spyOn(history, 'pushState')];
    press(m.container, CAPSULE);
    expect(historyDepth()).toBe(2);
    expect(moves[0]).not.toHaveBeenCalled();
    expect(moves[1]).not.toHaveBeenCalled();
    for (const move of moves) move.mockRestore();
    goBack();
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(screenTitle(m)).toBe('Me');
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('hands its entry to Me, opened from it', async () => {
    const m = await focused();
    press(m.container, 'Me');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(historyDepth()).toBe(0);
  });

  it('comes back to Focus after a short time away, and to Today after longer', async () => {
    const m = await focused();
    window.dispatchEvent(new Event('pagehide'));
    expect(stateOf(m).bench.ui?.focus).toEqual({ returnTo: 'today' });
    m.clock.now = new Date(at(TUE_1005).getTime() + 5 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(m.container.dataset['focus']).toBe('open');

    window.dispatchEvent(new Event('pagehide'));
    m.clock.now = new Date(at(TUE_1005).getTime() + 30 * 60_000);
    window.dispatchEvent(new Event('pageshow'));
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(id(m, 'b-lit')).not.toBeNull();
  });

  it('opens again on a reload in Focus', async () => {
    const m = await focused();
    window.dispatchEvent(new Event('pagehide'));
    const stored = stateOf(m).bench.ui!;
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, ui: stored, away: { since: at(TUE_1005).toISOString() } },
    }));
    expect(again.container.dataset['focus']).toBe('open');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(again.container.dataset['focus']).toBeUndefined();
  });
});

describe('5 · Capture (SPEC 5.5)', () => {
  const LIT = /^Now: Write the question\. Step 2 of 3/;
  const ASK = 'Ask Ana about Friday';
  const sheetOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.sheet-layer')!;
  const field = (m: Mounted) => id(m, 'c-field') as HTMLInputElement;
  const disc = (m: Mounted) => id(m, 'b-capture')!;
  /** History as it stands once the moves made by a close have landed (jsdom moves on its timers). */
  const depth = () => {
    vi.advanceTimersByTime(1);
    return historyDepth();
  };
  const inboxTitles = (m: Mounted) =>
    model
      .inbox(stateOf(m).tasks)
      .filter((task) => task.parentId === undefined)
      .map((task) => task.title);

  async function captured(local = TUE_1005, scenario: 'example' | 'weeksAway' = 'example') {
    const m = await mount(local, scenario);
    press(m.container, 'Capture');
    return m;
  }

  it('opens from the disc with the field focused in the same tap, so the keyboard comes up', async () => {
    const m = await mount(TUE_1005);
    disc(m).click();
    // Straight after the click, with nothing awaited: iOS raises the keyboard
    // only for a field focused inside the tap's own handler.
    expect(document.activeElement).toBe(field(m));
    expect(field(m).value).toBe('');
    expect(field(m).placeholder).toBe("What's on your mind?");
    expect(field(m).getAttribute('enterkeyhint')).toBe('enter');
    expect(field(m).closest('form')).toBeNull();
    // Lifted to where the keyboard will be, before the keyboard says so.
    expect(document.documentElement.style.getPropertyValue('--kb')).not.toBe('');
  });

  it('is modal over Today, which stays lit above it: the lantern raised, the capsule nowhere', async () => {
    const m = await captured();
    expect(m.container.dataset['sheet']).toBe('today');
    const dialog = sheetOf(m).querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(nameOf(dialog)).toBe('Capture');
    for (const under of ['.screen', '.fade', '.dock', '.drawer', '.foot', '.tabs']) {
      expect(m.container.querySelector(under)?.hasAttribute('inert'), under).toBe(true);
    }
    expect(sheetOf(m).hasAttribute('inert')).toBe(false);
    // The lantern keeps burning above the sheet, its title joined to the Now line.
    expect(drawnText(m.container.querySelector('.lantern .nowline')!)).toContain(
      'step 2 of 3 · Write the school email',
    );
    expect(m.container.querySelector('.screen')?.getAttribute('data-lamp')).toBe('lit');
    expect(m.container.dataset['ride']).toBeUndefined();
    expect(m.container.querySelector('#b-capsule')).toBeNull();
  });

  it('says what it is in SPEC 5.5’s words', async () => {
    const m = await captured();
    const sheet = drawnText(sheetOf(m));
    for (const words of [
      'Capture',
      'Close',
      'Goes to the inbox with no date. Plan it later if you like.',
      'Inbox',
      'Today',
      'Save',
    ]) {
      expect(sheet).toContain(words);
    }
    expect(nameOf(id(m, 'c-to-inbox')!)).toBe('Inbox');
    expect(id(m, 'c-to-inbox')?.getAttribute('aria-checked')).toBe('true');
    expect(id(m, 'c-to-today')?.getAttribute('aria-checked')).toBe('false');
    expect(nameOf(m.container.querySelector('[role="radiogroup"]')!)).toBe('Where it goes');
  });

  it('offers four choices, and reads them in SPEC 11’s order, Me last', async () => {
    const m = await captured();
    expect(choices(m.container)).toBe(4);
    expect(readingOrder(m.container)).toEqual([
      'Capture',
      'Close',
      'Capture',
      'Goes to the inbox with no date. Plan it later if you like.',
      'Inbox',
      'Today',
      'Save',
      'Me',
    ]);
    expect(hintOf(id(m, 'c-me')!)).toBe('Keeps your draft.');
  });

  it('is a level of its own in history: back closes it and keeps the draft', async () => {
    const m = await captured();
    expect(depth()).toBe(1);
    type(m, ASK);
    goBack();
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(stateOf(m).bench.drafts.capture).toEqual({ text: ASK, to: 'inbox' });
    expect(nameOf(disc(m))).toBe('Capture, draft kept');
    expect(document.activeElement).toBe(id(m, 'b-lit'));
  });

  it('Save files the words in the inbox, drops the sheet, says so and goes back to the step', async () => {
    const m = await captured();
    type(m, ASK);
    press(m.container, 'Save');
    expect(inboxTitles(m)).toContain(ASK);
    const saved = titled(stateOf(m), ASK);
    expect(saved.when).toEqual({ kind: 'none' });
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(said(m)).toBe('Saved to inbox');
    expect(document.activeElement).toBe(id(m, 'b-lit'));
    // The Next line: "Saved to the inbox" over the words, with Undo at its right.
    const handle = id(m, 'b-handle')!;
    expect(drawnText(handle)).toContain('Saved to the inbox');
    expect(drawnText(handle)).toContain(ASK);
    expect(nameOf(id(m, 'b-undo')!)).toBe(`Undo: remove ${ASK} from the inbox`);
    // Nothing is kept: the words went where they were going.
    expect(stateOf(m).bench.drafts.capture).toBeUndefined();
    expect(nameOf(disc(m))).toBe('Capture');
    expect(depth()).toBe(0);
  });

  it('lands without a ring after Save, Return and back, and the next key brings it back', async () => {
    // A tap on Save never takes focus, so the field has it to the end, and a
    // browser draws the ring wherever focus goes from a field. SPEC 5.5 draws
    // none on the step after Save.
    const quiet = () => (document.activeElement as HTMLElement).dataset['quiet'] !== undefined;
    const key = (name: string) =>
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: name, bubbles: true }),
      );

    const saved = await captured();
    type(saved, ASK);
    press(saved.container, 'Save');
    expect(document.activeElement).toBe(id(saved, 'b-lit'));
    expect(quiet()).toBe(true);
    // Held through the Undo's six seconds and the redraw at their end.
    vi.advanceTimersByTime(7000);
    expect(document.activeElement).toBe(id(saved, 'b-lit'));
    expect(quiet()).toBe(true);
    // A modifier alone says nothing; Tab says the person is on the keys.
    key('Shift');
    expect(quiet()).toBe(true);
    key('Tab');
    expect(quiet()).toBe(false);
    unmount();

    const returned = await captured();
    type(returned, ASK).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(id(returned, 'b-lit'));
    // The return key that saved is the field's, not a key on the step.
    expect(quiet()).toBe(true);
    (document.activeElement as HTMLElement).blur();
    expect(id(returned, 'b-lit')?.dataset['quiet']).toBeUndefined();
    unmount();

    const back = await captured();
    goBack();
    expect(document.activeElement).toBe(id(back, 'b-lit'));
    expect(quiet()).toBe(true);
    key('ArrowDown');
    expect(quiet()).toBe(false);
  });

  it('the return key saves, as Save does', async () => {
    const m = await captured();
    const input = type(m, ASK);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(inboxTitles(m)).toContain(ASK);
    expect(m.container.dataset['sheet']).toBeUndefined();
  });

  it('Today files it on today’s list, anytime, and the helper line says so first', async () => {
    const m = await captured();
    type(m, ASK);
    const today = id(m, 'c-to-today')!;
    // A tap on the switch keeps the field focused, so the keyboard stays up.
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    today.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    press(m.container, 'Today');
    expect(document.activeElement).toBe(field(m));
    expect(id(m, 'c-to-today')?.getAttribute('aria-checked')).toBe('true');
    expect(drawnText(sheetOf(m))).toContain("Goes on today's list, anytime.");
    expect(drawnText(sheetOf(m))).not.toContain('Goes to the inbox');
    // The choice is kept with the words.
    expect(stateOf(m).bench.drafts.capture).toEqual({ text: ASK, to: 'today' });
    press(m.container, 'Save');
    expect(titled(stateOf(m), ASK).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(said(m)).toBe("Saved to today's list");
    expect(drawnText(id(m, 'b-handle')!)).toContain("Saved to today's list");
  });

  it('moves between Inbox and Today with the arrow keys, keeping focus on the switch', async () => {
    const m = await captured();
    id(m, 'c-to-inbox')!.focus();
    id(m, 'c-to-inbox')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(id(m, 'c-to-today')?.getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(id(m, 'c-to-today'));
  });

  it('files nothing from an empty field, and the sheet stays', async () => {
    const m = await captured();
    const before = stateOf(m).tasks.length;
    type(m, '   ');
    press(m.container, 'Save');
    expect(stateOf(m).tasks).toHaveLength(before);
    expect(m.container.dataset['sheet']).toBe('today');
    expect(id(m, 'b-undo')).toBeNull();
  });

  it('Undo removes the item and opens the sheet again with the words in it', async () => {
    const m = await captured();
    type(m, ASK);
    press(m.container, 'Save');
    press(m.container, `Undo: remove ${ASK} from the inbox`);
    expect(inboxTitles(m)).not.toContain(ASK);
    expect(m.container.dataset['sheet']).toBe('today');
    expect(document.activeElement).toBe(field(m));
    expect(field(m).value).toBe(ASK);
    expect(said(m)).toBe('Undone. Now: Write the question');
    expect(depth()).toBe(1);
  });

  it('Undo after Save to Today opens on Today again', async () => {
    const m = await captured();
    type(m, ASK);
    press(m.container, 'Today');
    press(m.container, 'Save');
    press(m.container, `Undo: remove ${ASK} from today's list`);
    expect(stateOf(m).tasks.some((task) => task.title === ASK)).toBe(false);
    expect(id(m, 'c-to-today')?.getAttribute('aria-checked')).toBe('true');
  });

  it('Close keeps the words as a draft: a dot on the disc, its name says so, and the next tap has them', async () => {
    const m = await captured();
    type(m, ASK);
    press(m.container, 'Close');
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(depth()).toBe(0);
    expect(stateOf(m).bench.drafts.capture).toEqual({ text: ASK, to: 'inbox' });
    expect(nameOf(disc(m))).toBe('Capture, draft kept');
    expect(disc(m).querySelector('.draft-dot')?.getAttribute('aria-hidden')).toBe('true');
    // Back on the step, exactly where the person was.
    expect(document.activeElement).toBe(id(m, 'b-lit'));
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    outlastSheet();
    expect(sheetOf(m).hidden).toBe(true);
    press(m.container, 'Capture, draft kept');
    expect(field(m).value).toBe(ASK);
    expect(document.activeElement).toBe(field(m));
    // The draft is in the field now, not behind the disc.
    expect(nameOf(disc(m))).toBe('Capture');
  });

  it('a tap above the sheet closes it and keeps the draft', async () => {
    const m = await captured();
    type(m, ASK);
    (sheetOf(m).querySelector('.c-above') as HTMLElement).click();
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
  });

  it('a swipe down its top band closes it and keeps the draft; a short one does not', async () => {
    const m = await captured();
    type(m, ASK);
    const panel = sheetOf(m).querySelector<HTMLElement>('.c-panel')!;
    const head = panel.querySelector<HTMLElement>('.c-head')!;
    const drag = (from: HTMLElement, to: number) => {
      from.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientY: 300 }));
      panel.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientY: 300 + to }));
      panel.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 300 + to }));
    };
    drag(head, 12);
    expect(m.container.dataset['sheet']).toBe('today');
    expect(panel.style.transform).toBe('');
    // A drag in the field is the field's.
    drag(field(m), 90);
    expect(m.container.dataset['sheet']).toBe('today');
    drag(head, 90);
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
  });

  it('a swipe down from the grabber closes it too: the band above the title is the sheet’s', async () => {
    const m = await captured();
    type(m, ASK);
    const panel = sheetOf(m).querySelector<HTMLElement>('.c-panel')!;
    const grip = panel.querySelector<HTMLElement>('.c-grip')!;
    expect(grip.getAttribute('aria-hidden')).toBe('true');
    grip.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientY: 284 }));
    panel.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 384 }));
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
  });

  it('Escape closes it, keeping the draft, and focus lands with its ring: the person is on the keys', async () => {
    const m = await captured();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    type(m, ASK).dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(stateOf(m).bench.drafts.capture).toEqual({ text: ASK, to: 'inbox' });
    expect(nameOf(disc(m))).toBe('Capture, draft kept');
    expect(document.activeElement).toBe(id(m, 'b-lit'));
    expect(id(m, 'b-lit')?.dataset['quiet']).toBeUndefined();
    expect(depth()).toBe(0);
  });

  it('lets an empty draft go: no dot after closing with nothing in the field', async () => {
    const m = await captured();
    type(m, ASK);
    type(m, '');
    press(m.container, 'Close');
    expect(stateOf(m).bench.drafts.capture).toBeUndefined();
    expect(nameOf(disc(m))).toBe('Capture');
  });

  it('keeps help two taps away: Me above the sheet keeps the draft and opens Me', async () => {
    const m = await captured();
    type(m, ASK);
    press(m.container, 'Me');
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Me');
    expect(sheetOf(m).contains(document.activeElement)).toBe(false);
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
    // The sheet's entry became Me's.
    expect(depth()).toBe(1);
    press(m.container, 'If things are bad right now');
    expect(visibleText(m.container)).toContain('If things are bad right now');
  });

  it('keeps the draft through a reload, as a dot on the disc, never pushed at the person', async () => {
    const m = await captured();
    // Typing stops; a moment later the words are kept, the sheet still open.
    type(m, ASK);
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
    window.dispatchEvent(new Event('pagehide'));
    const drafts = stateOf(m).bench.drafts;
    unmount();
    const again = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, drafts },
    }));
    // The sheet is not opened by itself: the keyboard comes only with a tap.
    expect(again.container.dataset['sheet']).toBeUndefined();
    expect(nameOf(id(again, 'b-capture')!)).toBe('Capture, draft kept');
    press(again.container, 'Capture, draft kept');
    expect(field(again).value).toBe(ASK);
  });

  it('keeps what was typed when the app is hidden with the sheet open', async () => {
    const m = await captured();
    const input = field(m);
    input.value = ASK;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // Hidden before the moment after typing: the words are kept all the same.
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
    expect(stateOf(m).bench.drafts.capture?.text).toBe(ASK);
  });

  describe('from Focus', () => {
    async function inFocus() {
      const m = await mount(TUE_1005);
      press(m.container, LIT);
      settle(m);
      press(m.container, 'Capture');
      return m;
    }

    it('keeps the step lit above the sheet, and Focus stays open under it', async () => {
      const m = await inFocus();
      expect(m.container.dataset['sheet']).toBe('focus');
      expect(m.container.dataset['focus']).toBe('open');
      expect(document.activeElement).toBe(field(m));
      for (const under of ['.focus', '.ffoot', '.dock']) {
        expect(m.container.querySelector(under)?.hasAttribute('inert'), under).toBe(true);
      }
      expect(m.container.querySelector('#b-capsule')).toBeNull();
      expect(depth()).toBe(2);
    });

    it('closes back to the step in Focus', async () => {
      const m = await inFocus();
      press(m.container, 'Close');
      expect(m.container.dataset['focus']).toBe('open');
      expect(document.activeElement).toBe(id(m, 'f-step'));
      expect(depth()).toBe(1);
    });

    it('saves back to Focus on the same step, its foot offering Undo', async () => {
      const m = await inFocus();
      type(m, ASK);
      press(m.container, 'Save');
      expect(m.container.dataset['focus']).toBe('open');
      expect(document.activeElement).toBe(id(m, 'f-step'));
      expect(id(m, 'f-step')?.textContent).toContain('Write the question');
      expect(drawnText(id(m, 'f-foot')!)).toBe(`Saved to the inbox · ${ASK}`);
      expect(nameOf(id(m, 'b-undo')!)).toBe(`Undo: remove ${ASK} from the inbox`);
      // Back on the step with no ring round it.
      expect(id(m, 'f-step')?.dataset['quiet']).toBe('');
    });

    it('back closes the sheet first, then Focus', async () => {
      const m = await inFocus();
      goBack();
      expect(m.container.dataset['sheet']).toBeUndefined();
      expect(m.container.dataset['focus']).toBe('open');
      goBack();
      expect(m.container.dataset['focus']).toBeUndefined();
    });

    it('Me above the sheet folds Focus away and opens Me', async () => {
      const m = await inFocus();
      press(m.container, 'Me');
      expect(m.container.dataset['focus']).toBeUndefined();
      expect(m.container.querySelector('.screen h1')?.textContent).toBe('Me');
      expect(depth()).toBe(1);
    });
  });

  describe('from a place', () => {
    it('carries the capsule on the sheet’s top edge, as a picture only', async () => {
      const m = await mount(TUE_1005);
      press(m.container, 'Tasks');
      press(m.container, 'Capture');
      expect(m.container.dataset['sheet']).toBe('place');
      expect(m.container.dataset['ride']).toBe('');
      const picture = sheetOf(m).querySelector<HTMLElement>('.c-ride .capsule')!;
      expect(picture.getAttribute('aria-hidden')).toBe('true');
      expect(picture.hasAttribute('inert')).toBe(true);
      expect(picture.getAttribute('tabindex')).toBe('-1');
      expect(picture.tagName).toBe('DIV');
      expect(drawnText(picture)).toContain('18 min left');
      // The capsule on the dock line is under the sheet, and nothing reaches it.
      expect(controls(m.container).some((node) => node.id === 'b-capsule')).toBe(false);
      expect(choices(m.container)).toBe(4);
    });

    it('closes back to the disc, and the capsule is a button again', async () => {
      const m = await mount(TUE_1005);
      press(m.container, 'Tasks');
      press(m.container, 'Capture');
      press(m.container, 'Close');
      expect(document.activeElement).toBe(id(m, 'b-capture'));
      expect(m.container.dataset['ride']).toBeUndefined();
      expect(id(m, 'b-capsule')?.tagName).toBe('BUTTON');
      expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    });

    it('saves back to the disc', async () => {
      const m = await mount(TUE_1005);
      press(m.container, 'Tasks');
      press(m.container, 'Capture');
      type(m, ASK);
      press(m.container, 'Save');
      expect(document.activeElement).toBe(id(m, 'b-capture'));
      expect(id(m, 'b-capture')?.dataset['quiet']).toBe('');
      expect(drawnText(id(m, 'b-handle')!)).toContain('Saved to the inbox');
    });

    it('rides no timer on the crisis page, where capture stays', async () => {
      const m = await mount(TUE_1005);
      press(m.container, 'Me');
      press(m.container, 'If things are bad right now');
      press(m.container, 'Capture');
      expect(m.container.dataset['sheet']).toBe('place');
      expect(sheetOf(m).querySelector('.capsule')).toBeNull();
      expect(m.container.dataset['ride']).toBeUndefined();
    });

    it('has no Me above it on Me itself, where there is none to keep', async () => {
      const m = await mount(TUE_1005);
      press(m.container, 'Me');
      press(m.container, 'Capture');
      expect(id(m, 'c-me')).toBeNull();
    });

    it('over the open drawer: Me above the sheet is the drawer’s, and closing keeps the drawer open', async () => {
      const m = await mount(TUE_1005);
      press(m.container, /^Next, in 25 minutes/);
      press(m.container, 'Capture');
      expect(m.container.dataset['sheet']).toBe('place');
      expect(m.container.dataset['ride']).toBe('');
      expect(depth()).toBe(2);
      press(m.container, 'Close');
      expect(m.container.dataset['drawer']).toBe('open');
      expect(document.activeElement).toBe(id(m, 'b-capture'));
      expect(depth()).toBe(1);
    });

    it('over the open drawer: Save says so on the Hide band, with Undo, and the drawer stays open', async () => {
      const m = await mount(TUE_1005);
      press(m.container, /^Next, in 25 minutes/);
      press(m.container, 'Capture');
      type(m, ASK);
      press(m.container, 'Save');
      // Exactly where the person was: the drawer open, focus on the disc.
      expect(m.container.dataset['drawer']).toBe('open');
      expect(document.activeElement).toBe(id(m, 'b-capture'));
      expect(said(m)).toBe('Saved to inbox');
      // The open drawer has no Next line: its Hide band holds the six seconds,
      // "Saved to the inbox" over the words, Undo where "⌄ Hide" was.
      const hide = id(m, 'b-hide')!;
      expect(nameOf(hide)).toBe('Hide the rest of today');
      expect(hide.querySelector('.h-l1')?.textContent).toBe('Saved to the inbox');
      expect(hide.querySelector('.h-title')?.textContent).toBe(ASK);
      expect(drawnText(hide)).not.toContain('Hide');
      const undo = id(m, 'b-undo')!;
      expect(undo.closest('.foot')).not.toBeNull();
      expect(nameOf(undo)).toBe(`Undo: remove ${ASK} from the inbox`);
      expect(m.container.querySelectorAll('#b-undo')).toHaveLength(1);
      // Read after Hide, as the folded handle's Undo is read after the handle.
      const order = readingOrder(m.container);
      expect(order.indexOf(`Undo: remove ${ASK} from the inbox`)).toBe(
        order.indexOf('Hide the rest of today') + 1,
      );
      // The band is still Hide.
      expect(choices(m.container)).toBeLessThanOrEqual(5);
      outlastUndo();
      expect(id(m, 'b-undo')).toBeNull();
      expect(drawnText(id(m, 'b-hide')!)).toBe('Hide');
      expect(m.container.dataset['drawer']).toBe('open');
    });

    it('over the open drawer: Undo after Save opens the sheet again over it, with the words', async () => {
      const m = await mount(TUE_1005);
      press(m.container, /^Next, in 25 minutes/);
      press(m.container, 'Capture');
      type(m, ASK);
      press(m.container, 'Today');
      press(m.container, 'Save');
      expect(id(m, 'b-hide')?.querySelector('.h-l1')?.textContent).toBe("Saved to today's list");
      press(m.container, `Undo: remove ${ASK} from today's list`);
      expect(stateOf(m).tasks.some((task) => task.title === ASK)).toBe(false);
      expect(m.container.dataset['drawer']).toBe('open');
      expect(m.container.dataset['sheet']).toBe('place');
      expect(field(m).value).toBe(ASK);
      expect(document.activeElement).toBe(field(m));
    });

    it('over the open drawer: a tick puts nothing on the Hide band, its row’s disc the way back', async () => {
      const m = await mount(TUE_1005);
      press(m.container, /^Next, in 25 minutes/);
      press(m.container, 'Mark done: Order printer ink');
      expect(id(m, 'b-undo')).toBeNull();
      expect(drawnText(id(m, 'b-hide')!)).toBe('Hide');
    });
  });

  it('on nothing planned, files to Today and the day is planned after all', async () => {
    const m = await captured(MON_0912, 'weeksAway');
    type(m, ASK);
    press(m.container, 'Today');
    press(m.container, 'Save');
    expect(m.container.querySelector('.screen')?.getAttribute('data-lamp')).toBe('idle');
    // Focus goes to the screen's own block, which is now the lit item.
    expect(document.activeElement).toBe(id(m, 'b-idle'));
    expect(drawnText(id(m, 'b-handle')!)).toContain("Saved to today's list");
  });

  it('fades out as a picture that nothing can find or tap', async () => {
    const m = await captured();
    press(m.container, 'Close');
    const layer = sheetOf(m);
    expect(layer.hasAttribute('data-leaving')).toBe(true);
    expect(layer.hasAttribute('inert')).toBe(true);
    expect(layer.querySelector('[id]')).toBeNull();
    outlastSheet();
    expect(layer.hidden).toBe(true);
    expect(layer.childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------- chunk 5

/** Names of the Tasks switcher's parts, and which is selected. */
const switcherOf = (m: Mounted) =>
  [...m.container.querySelectorAll<HTMLElement>('[role="tab"]')].map((tab) => [
    nameOf(tab),
    tab.getAttribute('aria-selected'),
  ]);
/** The rows of the list on screen, by title, in order. */
const rowTitles = (m: Mounted) =>
  [...m.container.querySelectorAll('.screen [data-row] .rowbtn')].map((row) =>
    drawnText(row.querySelector('.rt > span, .ti') ?? row),
  );
const page = (m: Mounted) => m.container.querySelector<HTMLElement>('.screen')!;

describe('6a and 6b · Tasks (SPEC 5.6)', () => {
  const INBOX = [
    'Birthday present for Mum',
    'Cancel the gym trial',
    'Ask about the boiler quote',
    'Look into swimming lessons',
    'Return the library books',
    'Fix the bike light',
  ];

  it('opens on the inbox: the switcher, its helper line, and what has no date in the order it came', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    expect(m.container.querySelector('h1')?.textContent).toBe('Tasks');
    expect(switcherOf(m)).toEqual([
      ['Inbox', 'true'],
      ['Today', 'false'],
      ['Coming up', 'false'],
      ['Done', 'false'],
    ]);
    expect(m.container.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Tasks');
    expect(drawnText(m.container.querySelector('.body .helper')!)).toBe(
      'Anything with no date waits here.',
    );
    expect(rowTitles(m)).toEqual(INBOX);
    // Second lines: steps still to do, the minutes and their track, or the
    // start of the note. Never when it came in, never how long it waited.
    const second = [...m.container.querySelectorAll('.screen [data-row]')].map((row) => {
      const small = row.querySelector('small');
      return small ? drawnText(small) : '';
    });
    expect(second).toEqual([
      '',
      '2 steps',
      'Thursday or Friday morning',
      '3 steps · 30 min',
      '15 min',
      '',
    ]);
    const tracks = [...m.container.querySelectorAll<HTMLElement>('.screen .dur .m')];
    expect(tracks.map((track) => track.style.width)).toEqual(['45px', '22.5px']);
    expect(nameOf(id(m, 'r-' + titled(stateOf(m), 'Look into swimming lessons').id)!)).toBe(
      'Look into swimming lessons, 3 steps, 30 minutes',
    );
    // The capsule rides it, lifted on charcoal, over the fade.
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(true);
    expect(m.container.querySelector('.fade')?.hasAttribute('hidden')).toBe(false);
  });

  it('offers four choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    expect(choices(m.container)).toBe(4);
    const order = readingOrder(m.container);
    expect(order.slice(0, 7)).toEqual([
      'Tasks',
      'Me',
      'Inbox',
      'Today',
      'Coming up',
      'Done',
      'Anything with no date waits here.',
    ]);
    expect(order.slice(7, 11)).toEqual([
      'Mark done: Birthday present for Mum',
      'Birthday present for Mum',
      'Mark done: Cancel the gym trial',
      'Cancel the gym trial, 2 steps',
    ]);
    expect(order.slice(-7)).toEqual([
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
      'Capture',
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
      ...TABS,
    ]);
  });

  it('moves along the switcher with the arrow keys, choosing as it goes', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    id(m, 'l-inbox')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(switcherOf(m)[1]).toEqual(['Today', 'true']);
    expect(document.activeElement).toBe(id(m, 'l-today'));
    id(m, 'l-today')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    expect(switcherOf(m)[0]).toEqual(['Inbox', 'true']);
  });

  it('opens the inbox at its newest end, every time, and Save leaves it where it was', async () => {
    const tall = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(900);
    try {
      const m = await mount(TUE_1005);
      const list = () => m.container.querySelector<HTMLElement>('[data-scroll-key="tasks-inbox"]')!;
      press(m.container, 'Tasks');
      expect(list().scrollTop).toBe(900);
      list().scrollTop = 300;
      press(m.container, 'Capture');
      type(m, 'Ask Ana about Friday');
      press(m.container, 'Save');
      expect(rowTitles(m).at(-1)).toBe('Ask Ana about Friday');
      expect(list().scrollTop).toBe(300);
      // A row opened and back: the list where it was.
      press(m.container, 'Fix the bike light');
      press(m.container, 'Back to Tasks');
      expect(list().scrollTop).toBe(300);
      // Opened again: the newest end.
      press(m.container, 'Today');
      press(m.container, 'Tasks');
      expect(list().scrollTop).toBe(900);
      pressTab(m.container, 'Done');
      list;
      pressTab(m.container, 'Inbox');
      expect(list().scrollTop).toBe(900);
    } finally {
      tall.mockRestore();
    }
  });

  it('ticks a ring in place, its disc the way back, and the Next line offers Undo', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Mark done: Fix the bike light');
    expect(titled(stateOf(m), 'Fix the bike light').doneAt).toBeDefined();
    expect(rowTitles(m)).toEqual(INBOX);
    expect(button(m.container, 'Fix the bike light, done')).toBeTruthy();
    expect(said(m)).toBe('Done: Fix the bike light');
    expect(drawnText(id(m, 'b-handle')!.querySelector('.h-l1')!)).toBe('Done');
    expect(drawnText(id(m, 'b-handle')!.querySelector('.h-l2')!)).toBe('Fix the bike light');
    press(m.container, 'Undo done: Fix the bike light');
    expect(titled(stateOf(m), 'Fix the bike light').doneAt).toBeUndefined();
    press(m.container, 'Mark done: Fix the bike light');
    // Opened again, the list holds only what is not done.
    pressTab(m.container, 'Today');
    pressTab(m.container, 'Inbox');
    expect(rowTitles(m)).toEqual(INBOX.slice(0, 5));
  });

  it('opens a row’s page pushed on Tasks, which stays current', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Cancel the gym trial, 2 steps');
    expect(id(m, 'p-title')?.textContent).toBe('Cancel the gym trial');
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    expect(nameOf(id(m, 'b-back')!)).toBe('Back to Tasks');
    press(m.container, 'Back to Tasks');
    expect(switcherOf(m)[0]).toEqual(['Inbox', 'true']);
  });

  it('Today: the drawer’s list, the present in it with its Now tag, and what got done under Done', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    const labels = [...m.container.querySelectorAll('.screen .lbl')].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Later today', 'Anytime today', 'Done']);
    expect(rowTitles(m).slice(0, 4)).toEqual([
      'Call the dentistin 25 min',
      'Walk to the park',
      'Ring the bank',
      'Write the school emailNow',
    ]);
    const email = id(m, `r-${emailOf(stateOf(m)).id}`)!;
    expect(nameOf(email)).toBe('Now: Write the school email');
    expect(email.querySelector('.ntag')?.getAttribute('aria-hidden')).toBe('true');
    expect(readingOrder(m.container)).toContain('Bins out, done');
    expect(m.container.querySelector('.screen .helper')).toBeNull();
    // A row opens the running task's own page.
    email.click();
    expect(m.container.dataset['ground']).toBe('present');
    expect(id(m, 'b-focus')).not.toBeNull();
  });

  it('Today: says Paused where Now would be, for a task paused today', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    const email = id(m, `r-${emailOf(stateOf(m)).id}`)!;
    expect(nameOf(email)).toBe('Paused: Write the school email');
    expect(email.querySelector('.ntag')?.textContent).toBe('Paused');
    expect(email.querySelector('.ntag')?.classList.contains('now')).toBe(false);
  });

  it('Today: ticking the running task finishes it, and Undo runs its clock again', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    press(m.container, 'Mark done: Write the school email');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    press(m.container, 'Undo done: Write the school email');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
  });

  it('Coming up: grouped by day under muted labels, booked items first with their time', async () => {
    const m = await mount(TUE_1005, 'example', (state) => {
      let tasks = state.tasks;
      const gym = titled(state, 'Cancel the gym trial').id;
      const bike = titled(state, 'Fix the bike light').id;
      const mum = titled(state, 'Birthday present for Mum').id;
      tasks = model.schedule(tasks, gym, { kind: 'anytime', date: '2026-11-25' });
      tasks = model.schedule(tasks, bike, {
        kind: 'timed',
        date: '2026-11-25',
        time: '09:00',
        durationMinutes: 15,
      });
      tasks = model.schedule(tasks, mum, { kind: 'anytime', date: '2026-11-26' });
      return { ...state, tasks };
    });
    press(m.container, 'Tasks');
    pressTab(m.container, 'Coming up');
    expect(drawnText(m.container.querySelector('.body .helper')!)).toBe(
      'Anything with a date after today waits here.',
    );
    const labels = [...m.container.querySelectorAll('.screen .lbl')].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Tomorrow', 'Thursday 26 November']);
    expect(rowTitles(m)).toEqual([
      'Fix the bike light',
      'Cancel the gym trial',
      'Birthday present for Mum',
    ]);
    expect(drawnText(m.container.querySelector('.screen [data-row] small')!)).toBe('9:00 · 15 min');
    expect(choices(m.container)).toBe(4);
  });

  it('Coming up and Done say only their helper line when they hold nothing', async () => {
    const m = await mount(TUE_1005, 'empty');
    press(m.container, 'Tasks');
    pressTab(m.container, 'Coming up');
    expect(m.container.querySelectorAll('.screen [data-row]')).toHaveLength(0);
    pressTab(m.container, 'Done');
    expect(drawnText(m.container.querySelector('.body .helper')!)).toBe(
      'What got done, the newest first.',
    );
    expect(m.container.querySelectorAll('.screen [data-row]')).toHaveLength(0);
    pressTab(m.container, 'Today');
    expect(drawnText(m.container.querySelector('.body .helper')!)).toBe(
      'Nothing planned for today.',
    );
  });

  it('Done: newest first, each a disc that un-ticks it, the row kept until the list is next opened', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Mark done: Fix the bike light');
    pressTab(m.container, 'Done');
    expect(rowTitles(m)).toEqual(['Fix the bike light', 'Bins out']);
    // Each row says it is done, in words, as SPEC 11's "Bins out, done".
    const rowNames = () =>
      [...m.container.querySelectorAll<HTMLElement>('.screen .rowbtn')].map(nameOf);
    expect(rowNames()).toEqual(['Fix the bike light, done', 'Bins out, done']);
    press(m.container, 'Undo done: Fix the bike light');
    expect(titled(stateOf(m), 'Fix the bike light').doneAt).toBeUndefined();
    expect(rowNames()).toEqual(['Fix the bike light', 'Bins out, done']);
    expect(rowTitles(m)).toEqual(['Fix the bike light', 'Bins out']);
    expect(button(m.container, 'Mark done: Fix the bike light')).toBeTruthy();
    press(m.container, 'Mark done: Fix the bike light');
    // Ticked again, it keeps its place rather than jumping to the top.
    expect(rowTitles(m)).toEqual(['Fix the bike light', 'Bins out']);
    press(m.container, 'Undo done: Fix the bike light');
    pressTab(m.container, 'Inbox');
    pressTab(m.container, 'Done');
    expect(rowTitles(m)).toEqual(['Bins out']);
  });

  it('6b: on white places the same list, the capsule the one dark thing', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    press(m.container, 'Tasks');
    expect(m.container.dataset['places']).toBe('white');
    expect(m.container.dataset['ground']).toBe('place');
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(false);
    expect(rowTitles(m)).toEqual(INBOX);
    expect(choices(m.container)).toBe(4);
  });
});

describe('the capsule’s scroll guard (SPEC 4, "Gestures")', () => {
  it('takes no tap for 150 ms after the list under it scrolled', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    m.container.querySelector('.body')!.dispatchEvent(new Event('scroll'));
    press(m.container, /^Now: Write the question, step 2 of 3/);
    expect(m.container.dataset['focus']).toBeUndefined();
    settle(m, 149);
    press(m.container, /^Now: Write the question, step 2 of 3/);
    expect(m.container.dataset['focus']).toBeUndefined();
    settle(m, 1);
    press(m.container, /^Now: Write the question, step 2 of 3/);
    expect(m.container.dataset['focus']).toBe('open');
  });
});

describe('3a and 3b · A task opened while another runs (SPEC 5.3)', () => {
  const DENTIST = /^(10:30, )?Call the dentist/;
  async function opened(
    scenario: 'example' | 'notStarted' | 'pauseLeft' = 'example',
    local = TUE_1005,
  ) {
    const m = await mount(local, scenario);
    // Folded, the handle opens the rest of today; at 9:58 it rests half open.
    if (scenario !== 'notStarted') press(m.container, /^Next|^Anytime/);
    press(m.container, DENTIST);
    return m;
  }

  it('says what it is: its title, the when pill, Start this instead and its sentence, Steps and Add a step', async () => {
    const m = await opened();
    expect(id(m, 'p-title')?.textContent).toBe('Call the dentist');
    expect(id(m, 'p-title')?.tagName).toBe('H1');
    const when = id(m, 'p-when')!;
    expect(drawnText(when)).toBe('Today, 10:30 · 10 min · in 25 min');
    expect(nameOf(when)).toBe('When: Today, 10:30, 10 minutes, in 25 minutes');
    const start = id(m, 'p-start')!;
    expect(drawnText(start)).toBe('Start this instead');
    expect(hintOf(start)).toBe(
      'Stops the timer on Write the school email. It keeps its place at step 2.',
    );
    expect(drawnText(m.container.querySelector('.page .sentence')!)).toBe(
      'Starting this stops the timer on Write the school email. It keeps its place at step 2.',
    );
    expect(drawnText(m.container.querySelector('.steps-lbl')!)).toBe('Steps');
    expect(drawnText(id(m, 'p-addstep')!)).toBe('Add a step');
    // The capsule on the dock line, the drawer folded naming the true next item: this one.
    expect(m.container.querySelector('.capsule')?.tagName).toBe('BUTTON');
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(nameOf(id(m, 'b-handle')!)).toBe(
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
    );
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
  });

  it('offers five choices, and reads them in SPEC 11’s order', async () => {
    const m = await opened();
    expect(choices(m.container)).toBe(5);
    expect(readingOrder(m.container)).toEqual([
      'Back to Today',
      'More',
      'Me',
      'Call the dentist',
      'When: Today, 10:30, 10 minutes, in 25 minutes',
      'Start this instead',
      'Starting this stops the timer on Write the school email. It keeps its place at step 2.',
      'Steps',
      'Add a step',
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
      'Capture',
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
      ...TABS,
    ]);
  });

  it('moves the when pill’s "in 25 min" in place as time passes', async () => {
    const m = await opened();
    const when = id(m, 'p-when')!;
    advance(m, 1);
    expect(id(m, 'p-when')).toBe(when);
    expect(drawnText(when)).toBe('Today, 10:30 · 10 min · in 24 min');
    expect(nameOf(when)).toBe('When: Today, 10:30, 10 minutes, in 24 minutes');
  });

  it('Start this instead lights the page, says both tasks, and Undo goes back at step 2', async () => {
    const m = await opened();
    press(m.container, 'Start this instead');
    expect(model.running(stateOf(m).tasks)?.title).toBe('Call the dentist');
    expect(m.container.dataset['ground']).toBe('present');
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(id(m, 'b-focus')).not.toBeNull();
    expect(said(m)).toBe(
      'Started Call the dentist. Write the school email keeps its place at step 2.',
    );
    const handle = id(m, 'b-handle')!;
    expect(drawnText(handle.querySelector('.h-l1')!)).toBe('Started Call the dentist');
    expect(drawnText(handle.querySelector('.h-l2')!)).toBe('Write the school email at step 2');
    press(m.container, 'Undo: go back to Write the school email at step 2');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(titled(stateOf(m), 'Call the dentist').sessions).toHaveLength(0);
    expect(m.container.dataset['ground']).toBe('place');
    expect(drawnText(id(m, 'p-start')!)).toBe('Start this instead');
  });

  it('with nothing running reads "Start", with no sentence, and offers four choices', async () => {
    const m = await opened('notStarted', TUE_0958);
    expect(drawnText(id(m, 'p-start')!)).toBe('Start');
    expect(m.container.querySelector('.page .sentence')).toBeNull();
    expect(hintOf(id(m, 'p-start')!)).toBeUndefined();
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(choices(m.container)).toBe(4);
    press(m.container, 'Start');
    expect(model.running(stateOf(m).tasks)?.title).toBe('Call the dentist');
    expect(nameOf(id(m, 'b-undo')!)).toBe('Undo start: Call the dentist');
    press(m.container, 'Undo start: Call the dentist');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    expect(titled(stateOf(m), 'Call the dentist').sessions).toHaveLength(0);
  });

  it('with another task paused reads "Start" too, and the paused capsule goes when it starts', async () => {
    const m = await opened('pauseLeft', TUE_1320);
    expect(drawnText(id(m, 'p-start')!)).toBe('Start');
    expect(m.container.querySelector('.page .sentence')).toBeNull();
    expect(m.container.querySelector('.capsule .ptag')?.textContent).toBe('Paused');
    press(m.container, 'Start');
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(m.container.dataset['ground']).toBe('present');
  });

  it('3b: on white places a white page, which turns charcoal when it is lit', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    press(m.container, /^Next/);
    press(m.container, DENTIST);
    expect(m.container.dataset['places']).toBe('white');
    expect(m.container.dataset['ground']).toBe('place');
    expect(page(m).classList.contains('task')).toBe(true);
    expect(choices(m.container)).toBe(5);
    press(m.container, 'Start this instead');
    expect(m.container.dataset['ground']).toBe('present');
  });
});

describe('8 · The running task’s own page (SPEC 5.8)', () => {
  async function own(scenario: 'example' | 'pauseLeft' = 'example', local = TUE_1005) {
    const m = await mount(local, scenario);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    press(
      m.container,
      scenario === 'example' ? 'Now: Write the school email' : 'Paused: Write the school email',
    );
    return m;
  }

  it('is lit: the meta line, the bar row, the steps on the rail, the note, and Focus on the dock line', async () => {
    const m = await own();
    expect(m.container.dataset['ground']).toBe('present');
    expect(id(m, 'p-title')?.textContent).toBe(EMAIL);
    const meta = m.container.querySelector('.tmeta')!;
    expect(drawnText(meta)).toBe('Today · 25 min estimate · 7 min so far');
    expect(readText(meta)).toBe('Today, 25 minute estimate, 7 minutes so far');
    const bar = m.container.querySelector('.timerow .bar')!;
    expect(bar.className).toBe('bar bar-page is-burn');
    expect(nameOf(bar)).toBe('Time left');
    expect(bar.getAttribute('aria-valuetext')).toBe('18 of 25 minutes left');
    expect(drawnText(m.container.querySelector('.tmins')!)).toBe('18 min left ends 10:23');
    expect(drawnText(m.container.querySelector('.rail li.current .s')!)).toBe(
      'Write the question Now',
    );
    expect(drawnText(id(m, 'p-note')!)).toBe('Note When is the permission slip due?');
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(drawnText(id(m, 'b-focus')!)).toBe('Focus');
    expect(hintOf(id(m, 'b-focus')!)).toBe('Opens focus.');
  });

  it('offers four choices, and reads them in SPEC 11’s order', async () => {
    const m = await own();
    expect(choices(m.container)).toBe(4);
    expect(readingOrder(m.container)).toEqual([
      'Back to Tasks',
      'More',
      'Me',
      EMAIL,
      'Today, 25 minute estimate, 7 minutes so far',
      'Time left',
      'Undo step done: Find the school address',
      'Now, step 2: Write the question',
      'Step 3: Read it once and send',
      'Note: When is the permission slip due?',
      'Focus',
      'Capture',
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
      ...TABS,
    ]);
  });

  it('moves the bar, the minutes and "so far" in place as time passes', async () => {
    const m = await own();
    const rail = m.container.querySelector('.rail');
    advance(m, 1);
    expect(m.container.querySelector('.rail')).toBe(rail);
    expect(drawnText(m.container.querySelector('.tmins')!)).toBe('17 min left ends 10:23');
    expect(drawnText(m.container.querySelector('.tmeta')!)).toBe(
      'Today · 25 min estimate · 8 min so far',
    );
  });

  it('opens Focus from "⌃ Focus", and focus comes back to it', async () => {
    const m = await own();
    press(m.container, 'Focus');
    expect(m.container.dataset['focus']).toBe('open');
    expect(nameOf(id(m, 'f-back')!)).toBe('Back to Tasks');
    press(m.container, 'Back to Tasks');
    expect(document.activeElement).toBe(id(m, 'b-focus'));
  });

  it('un-ticks a done step from its disc', async () => {
    const m = await own();
    press(m.container, 'Undo step done: Find the school address');
    expect(drawnText(m.container.querySelector('.rail li.current .s')!)).toBe(
      'Find the school address Now',
    );
  });

  it('paused: the bar frozen in ash, the minutes in white with no end time, and Paused where Now was', async () => {
    const m = await own('pauseLeft', TUE_1320);
    expect(m.container.dataset['ground']).toBe('present');
    expect(m.container.querySelector('.timerow .bar')?.className).toBe(
      'bar bar-page is-paused is-frozen',
    );
    const minutes = m.container.querySelector('.tmins strong')!;
    expect(minutes.textContent).toBe('18 min left');
    expect(minutes.className).toBe('still');
    expect(drawnText(m.container.querySelector('.tmins')!)).toBe('18 min left');
    expect(readingOrder(m.container)).toContain('Paused, step 2: Write the question');
    expect(m.container.querySelector('.rail .nowtag')).toBeNull();
    expect(id(m, 'b-focus')).not.toBeNull();
  });

  it('done: a sage Done line, and "Not done after all"', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Done');
    // A done row says so (SPEC 11).
    press(m.container, 'Bins out, done');
    expect(drawnText(m.container.querySelector('.doneline')!)).toBe('Done');
    expect(id(m, 'p-when')).toBeNull();
    expect(id(m, 'p-addstep')).toBeNull();
    // No steps and nothing to add: no Steps heading over nothing.
    expect(m.container.querySelector('.steps-lbl')).toBeNull();
    press(m.container, 'Not done after all');
    expect(titled(stateOf(m), 'Bins out').doneAt).toBeUndefined();
    expect(id(m, 'p-start')).not.toBeNull();
    expect(m.container.querySelector('.steps-lbl')).not.toBeNull();
  });
});

describe('Add a step (SPEC 5.3 and 3, "When a field has the keyboard")', () => {
  async function opened() {
    const m = await mount(TUE_1005);
    press(m.container, /^Next/);
    press(m.container, /^10:30, Call the dentist/);
    return m;
  }
  const field = (m: Mounted) => id(m, 'p-stepfield') as HTMLInputElement;
  const dentist = (m: Mounted) => titled(stateOf(m), 'Call the dentist');

  it('turns into a field focused in the same tap, so the keyboard comes up', async () => {
    const m = await opened();
    id(m, 'p-addstep')!.click();
    expect(document.activeElement).toBe(field(m));
    expect(id(m, 'p-addstep')?.hidden).toBe(true);
    expect(m.container.dataset['typing']).toBe('');
    // The frame does not move: the dock line, the drawer and the tabs stay.
    expect(m.container.dataset['drawer']).toBe('folded');
    expect(choices(m.container)).toBe(5);
  });

  it('adds a step on return and stays open for the next, which stays focused', async () => {
    const m = await opened();
    id(m, 'p-addstep')!.click();
    const input = field(m);
    input.value = 'Find the card';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(model.stepsOf(stateOf(m).tasks, dentist(m).id).map((step) => step.title)).toEqual([
      'Find the card',
    ]);
    expect(document.activeElement).toBe(field(m));
    expect(field(m).value).toBe('');
    expect(readingOrder(m.container)).toContain('Step 1: Find the card');
  });

  it('keeps what it holds as a draft when left, shown in the field, and closes when empty', async () => {
    const m = await opened();
    id(m, 'p-addstep')!.click();
    const input = field(m);
    input.value = 'Ring at nine';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.blur();
    await Promise.resolve();
    expect(stateOf(m).bench.drafts.fields[`step:${dentist(m).id}`]).toBe('Ring at nine');
    expect(m.container.dataset['typing']).toBeUndefined();
    expect(field(m).value).toBe('Ring at nine');
    expect(id(m, 'p-addstep')?.hidden).toBe(true);
    // Back later, the draft is in the field.
    press(m.container, 'Back to Today');
    press(m.container, /^Next/);
    press(m.container, /^10:30, Call the dentist/);
    expect(field(m).value).toBe('Ring at nine');
    field(m).focus();
    field(m).value = '';
    field(m).blur();
    await Promise.resolve();
    expect(stateOf(m).bench.drafts.fields[`step:${dentist(m).id}`]).toBeUndefined();
    expect(id(m, 'p-addstep')?.hidden).toBe(false);
  });
});

describe('Add a step from a keyboard (SPEC 11)', () => {
  async function opened() {
    const m = await mount(TUE_1005);
    press(m.container, /^Next/);
    press(m.container, /^10:30, Call the dentist/);
    return m;
  }
  const field = (m: Mounted) => id(m, 'p-stepfield') as HTMLInputElement;
  const key = (m: Mounted, name: string) =>
    field(m).dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

  it('lets go of an empty field with Escape onto Add a step, never the page', async () => {
    const m = await opened();
    id(m, 'p-addstep')!.focus();
    id(m, 'p-addstep')!.click();
    field(m).value = 'Find the card';
    key(m, 'Enter');
    expect(document.activeElement).toBe(field(m));
    key(m, 'Escape');
    await Promise.resolve();
    expect(document.activeElement).toBe(id(m, 'p-addstep'));
    expect(id(m, 'p-addstep')?.hidden).toBe(false);
    expect(field(m).closest('.field')?.hasAttribute('hidden')).toBe(true);
  });

  it('lets go of a field holding words with Escape onto the page’s title, keeping them', async () => {
    const m = await opened();
    id(m, 'p-addstep')!.click();
    field(m).value = 'Ring at nine';
    field(m).dispatchEvent(new Event('input', { bubbles: true }));
    key(m, 'Escape');
    await Promise.resolve();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(id(m, 'p-title'));
    expect(field(m).value).toBe('Ring at nine');
  });
});

describe('the sheets a task’s page raises (SPEC 9.9 and 12)', () => {
  const depth = () => {
    vi.advanceTimersByTime(1);
    return historyDepth();
  };
  async function opened(places: 'charcoal' | 'white' = 'charcoal') {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places } },
    }));
    press(m.container, /^Next/);
    press(m.container, /^10:30, Call the dentist/);
    return m;
  }
  const dentist = (m: Mounted) => titled(stateOf(m), 'Call the dentist');
  const radios = (m: Mounted) =>
    [...m.container.querySelectorAll<HTMLElement>('.ts-panel [role="radio"]')].map((radio) => [
      nameOf(radio),
      radio.getAttribute('aria-checked'),
    ]);

  it('the when sheet: a level of its own, modal, its rows a radio group with the slot chosen', async () => {
    const m = await opened();
    const before = depth();
    press(m.container, /^When: /);
    expect(depth()).toBe((before as number) + 1);
    expect(m.container.dataset['tsheet']).toBe('when');
    expect(page(m).hasAttribute('inert')).toBe(true);
    expect(m.container.querySelector('.dock')?.hasAttribute('inert')).toBe(true);
    expect(document.activeElement?.id).toBe('ts-title');
    expect(nameOf(m.container.querySelector('[role="dialog"]')!)).toBe('When');
    expect(radios(m)).toEqual([
      ['No date (inbox)', 'false'],
      ['Today, anytime', 'false'],
      ['Today at a time', 'true'],
      ['Tomorrow', 'false'],
      ['Pick a day', 'false'],
    ]);
    expect((id(m, 'w-time') as HTMLInputElement).value).toBe('10:30');
    expect(id(m, 'w-length')?.textContent).toBe('10 min');
    // The capsule rides its top edge as a picture: not a control.
    const ride = m.container.querySelector('.ts-ride .capsule')!;
    expect(ride.getAttribute('aria-hidden')).toBe('true');
    expect(choices(m.container)).toBe(5);
  });

  it('a choice takes effect at once, and Done closes it, back on the pill', async () => {
    const m = await opened();
    press(m.container, /^When: /);
    press(m.container, 'Today, anytime');
    expect(dentist(m).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(radios(m)[1]).toEqual(['Today, anytime', 'true']);
    expect(id(m, 'w-time')).toBeNull();
    press(m.container, 'Tomorrow');
    expect(dentist(m).when).toEqual({ kind: 'anytime', date: '2026-11-25' });
    press(m.container, 'Pick a day');
    expect(dentist(m).when).toEqual({ kind: 'anytime', date: '2026-11-26' });
    const day = id(m, 'w-date') as HTMLInputElement;
    day.value = '2026-12-02';
    day.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dentist(m).when).toEqual({ kind: 'anytime', date: '2026-12-02' });
    // A day typed before today is today: never a day gone by, which no list shows.
    day.value = '2026-11-20';
    day.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dentist(m).when).toEqual({ kind: 'anytime', date: '2026-11-24' });
    expect(radios(m)[1]).toEqual(['Today, anytime', 'true']);
    press(m.container, 'Pick a day');
    press(m.container, 'No date (inbox)');
    expect(dentist(m).when).toEqual({ kind: 'none' });
    press(m.container, 'Today at a time');
    expect(dentist(m).when).toMatchObject({ kind: 'timed', date: '2026-11-24', time: '10:30' });
    press(m.container, 'Done');
    outlastSheet();
    expect(m.container.dataset['tsheet']).toBeUndefined();
    expect(document.activeElement).toBe(id(m, 'p-when'));
    expect(drawnText(id(m, 'p-when')!)).toBe('Today, 10:30 · 10 min · in 25 min');
  });

  it('the arrow keys move the check and focus together, round the rows', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Fix the bike light');
    press(m.container, /^When: /);
    const key = (name: string) =>
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: name, bubbles: true }),
      );
    id(m, 'w-none')!.focus();
    const at = () => [
      document.activeElement?.id,
      document.activeElement?.getAttribute('aria-checked'),
    ];
    key('ArrowDown');
    expect(at()).toEqual(['w-today', 'true']);
    key('ArrowDown');
    expect(at()).toEqual(['w-at', 'true']);
    key('ArrowRight');
    expect(at()).toEqual(['w-tomorrow', 'true']);
    expect(titled(stateOf(m), 'Fix the bike light').when).toEqual({
      kind: 'anytime',
      date: '2026-11-25',
    });
    key('ArrowUp');
    key('ArrowUp');
    key('ArrowUp');
    expect(at()).toEqual(['w-none', 'true']);
    key('ArrowLeft');
    expect(at()).toEqual(['w-pick', 'true']);
    expect((document.activeElement as HTMLElement).tabIndex).toBe(0);
  });

  it('How long sets a booked slot and its estimate together, and says what it reads', async () => {
    const m = await opened();
    press(m.container, /^When: /);
    press(m.container, 'Add 5 minutes');
    expect(dentist(m).when).toMatchObject({ kind: 'timed', durationMinutes: 15 });
    expect(dentist(m).estimateMinutes).toBe(15);
    expect(id(m, 'w-length')?.textContent).toBe('15 min');
    expect(said(m)).toBe('How long: 15 min');
    press(m.container, 'Take 5 minutes off');
    press(m.container, 'Take 5 minutes off');
    expect(dentist(m).when).toMatchObject({ durationMinutes: 5 });
    // Nothing to take off: −5 is not there, its place kept, never dimmed.
    expect(id(m, 'w-less')).toBeNull();
    expect(m.container.querySelector('.stepper .gap')?.getAttribute('aria-hidden')).toBe('true');
    expect(choices(m.container)).toBe(5);
  });

  it('focus on −5 as it goes lands on the minutes, which say why', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Return the library books, 15 minutes');
    press(m.container, /^When: /);
    id(m, 'w-less')!.focus();
    // 15, then 10, then 5: focus stays on −5 while it is there.
    for (const left of ['10 min', '5 min']) {
      id(m, 'w-less')!.click();
      expect(id(m, 'w-length')?.textContent).toBe(left);
      expect(document.activeElement).toBe(id(m, 'w-less'));
    }
    id(m, 'w-less')!.click();
    expect(titled(stateOf(m), 'Return the library books').estimateMinutes).toBeUndefined();
    expect(id(m, 'w-less')).toBeNull();
    expect(document.activeElement).toBe(id(m, 'w-length'));
    expect(drawnText(document.activeElement!)).toBe('Not set');
  });

  it('Done is the stone sheet’s quiet pill, never charcoal, which means only now', async () => {
    const m = await opened();
    press(m.container, /^When: /);
    const done = id(m, 'w-done')!;
    expect(done.classList.contains('quiet')).toBe(true);
    expect(done.classList.contains('present')).toBe(false);
  });

  it('How long sets an estimate on anything not booked, and can unset it', async () => {
    const m = await opened();
    press(m.container, /^When: /);
    press(m.container, 'No date (inbox)');
    // Its slot's length goes with it, as its estimate.
    expect(id(m, 'w-length')?.textContent).toBe('10 min');
    expect(dentist(m).estimateMinutes).toBe(10);
    press(m.container, 'Take 5 minutes off');
    press(m.container, 'Take 5 minutes off');
    expect(dentist(m).estimateMinutes).toBeUndefined();
    expect(id(m, 'w-length')?.textContent).toBe('Not set');
  });

  it('closes by back, by Close and by a tap above it, and keeps nothing behind it inert', async () => {
    const m = await opened();
    const base = depth();
    press(m.container, /^When: /);
    goBack();
    expect(m.container.dataset['tsheet']).toBeUndefined();
    expect(depth()).toBe(base);
    expect(page(m).hasAttribute('inert')).toBe(false);
    press(m.container, 'More');
    press(m.container, 'Close');
    expect(m.container.dataset['tsheet']).toBeUndefined();
    expect(document.activeElement).toBe(id(m, 'b-more'));
    expect(depth()).toBe(base);
    press(m.container, 'More');
    m.container.querySelector<HTMLElement>('[role="dialog"] .c-above')!.click();
    expect(m.container.dataset['tsheet']).toBeUndefined();
    expect(depth()).toBe(base);
  });

  it('the ⋯ sheet: the note, Rename and Delete, four choices', async () => {
    const m = await opened('white');
    press(m.container, 'More');
    expect(nameOf(m.container.querySelector('[role="dialog"]')!)).toBe('Call the dentist');
    expect(
      controls(m.container)
        .filter((node) => node.closest('.ts-panel'))
        .map(nameOf),
    ).toEqual(['Close', 'Add a note', 'Rename', 'Delete']);
    expect(choices(m.container)).toBe(4);
  });

  it('Add a note: the field focused in the same tap, the words kept as typed, one level throughout', async () => {
    const m = await opened();
    const base = depth();
    press(m.container, 'More');
    id(m, 'm-note')!.click();
    expect(document.activeElement?.id).toBe('ts-field');
    expect(m.container.dataset['tsheet']).toBe('note');
    expect(depth()).toBe((base as number) + 1);
    const note = id(m, 'ts-field') as HTMLTextAreaElement;
    note.value = 'Ask about the crown';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(dentist(m).notes).toBe('Ask about the crown');
    note.value = 'Ask about the crown, and the bill';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    press(m.container, 'Close');
    expect(dentist(m).notes).toBe('Ask about the crown, and the bill');
    expect(depth()).toBe(base);
    press(m.container, 'More');
    expect(button(m.container, 'Edit the note')).toBeTruthy();
  });

  it('Rename: return closes it; an empty name keeps the one it had', async () => {
    const m = await opened();
    press(m.container, 'More');
    id(m, 'm-rename')!.click();
    const name = id(m, 'ts-field') as HTMLInputElement;
    expect(document.activeElement).toBe(name);
    expect(name.value).toBe('Call the dentist');
    name.value = '';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(m.container.dataset['tsheet']).toBeUndefined();
    expect(dentist(m)).toBeDefined();
    press(m.container, 'More');
    id(m, 'm-rename')!.click();
    const again = id(m, 'ts-field') as HTMLInputElement;
    again.value = 'Call the dentist about the crown';
    again.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(id(m, 'p-title')?.textContent).toBe('Call the dentist about the crown');
  });

  it('Delete: confirms, says there is no Undo, and the page drops back with its level', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    const base = depth();
    press(m.container, 'Cancel the gym trial, 2 steps');
    press(m.container, 'More');
    press(m.container, 'Delete');
    expect(nameOf(m.container.querySelector('[role="dialog"]')!)).toBe(
      'Delete Cancel the gym trial?',
    );
    expect(drawnText(m.container.querySelector('.ts-line')!)).toBe(
      'Its steps go with it, and there is no Undo for this.',
    );
    expect(choices(m.container)).toBe(2);
    const gym = titled(stateOf(m), 'Cancel the gym trial').id;
    press(m.container, 'Delete');
    expect(stateOf(m).tasks.some((task) => task.id === gym || task.parentId === gym)).toBe(false);
    expect(switcherOf(m)[0]).toEqual(['Inbox', 'true']);
    expect(depth()).toBe(base);
    expect(rowTitles(m)).not.toContain('Cancel the gym trial');
  });

  it('Delete ends an Undo about the task it deletes, which would say what is no longer so', async () => {
    const m = await opened();
    press(m.container, 'Start this instead');
    expect(id(m, 'b-undo')).not.toBeNull();
    press(m.container, 'More');
    press(m.container, 'Delete');
    press(m.container, 'Delete');
    expect(stateOf(m).tasks.some((task) => task.title === 'Call the dentist')).toBe(false);
    expect(id(m, 'b-undo')).toBeNull();
    const handle = id(m, 'b-handle')!;
    expect(drawnText(handle)).not.toContain('Started Call the dentist');
    // The email stays stopped at step 2: nothing was taken back.
    expect(model.running(stateOf(m).tasks)).toBeUndefined();

    // After a tick, the same: the row's page deleted, its Undo goes with it.
    press(m.container, 'Tasks');
    press(m.container, 'Mark done: Fix the bike light');
    expect(nameOf(id(m, 'b-undo')!)).toBe('Undo done: Fix the bike light');
    press(m.container, 'Fix the bike light, done');
    press(m.container, 'More');
    press(m.container, 'Delete');
    press(m.container, 'Delete');
    expect(id(m, 'b-undo')).toBeNull();
  });

  it('Delete leaves an Undo about another task standing', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Mark done: Fix the bike light');
    press(m.container, 'Cancel the gym trial, 2 steps');
    press(m.container, 'More');
    press(m.container, 'Delete');
    press(m.container, 'Delete');
    expect(nameOf(id(m, 'b-undo')!)).toBe('Undo done: Fix the bike light');
    press(m.container, 'Undo done: Fix the bike light');
    expect(titled(stateOf(m), 'Fix the bike light').doneAt).toBeUndefined();
  });

  it('opens over the running task’s own page with nothing riding its edge', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    press(m.container, 'Now: Write the school email');
    press(m.container, 'Note: When is the permission slip due?');
    expect(document.activeElement?.id).toBe('ts-field');
    expect((id(m, 'ts-field') as HTMLTextAreaElement).value).toBe(
      'When is the permission slip due?',
    );
    expect(m.container.querySelector('.ts-ride')).toBeNull();
  });
});

describe('9 · Routines (SPEC 5.9)', () => {
  const HANDLE = 'Next, in 25 minutes: 10:30, Call the dentist. Rest of today';
  /** Each row as drawn: its title, its second line, and "Ran today" where it shows. */
  const rowsOf = (m: Mounted) =>
    [...m.container.querySelectorAll('.screen [data-row]')].map((row) =>
      [...row.querySelectorAll('.rt > span, .rt > small, .ran')].map(drawnText).join(' · '),
    );

  it('lists the routines under the helper line, Morning saying only that it ran today', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
    expect(id(m, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(drawnText(m.container.querySelector('.body .helper')!)).toBe(
      'Open a routine to start it.',
    );
    expect(rowsOf(m)).toEqual([
      'Morning · 6 steps · Ran today',
      'Leaving the house · 4 steps',
      'Evening wind-down · 5 steps',
      'Sunday reset · 7 steps',
    ]);
    // No ring: a routine is not ticked from the list. Each row says by its
    // chevron that it opens the routine; "Ran today" is a check and words.
    expect(m.container.querySelectorAll('.screen .ring, .screen .disc')).toHaveLength(0);
    expect(m.container.querySelectorAll('.screen .rrow.routine use[href="#i-right"]')).toHaveLength(
      4,
    );
    expect(m.container.querySelectorAll('.screen .ran')).toHaveLength(1);
    expect(m.container.querySelector('.screen .ran use')?.getAttribute('href')).toBe('#i-check-s');
    expect(drawnText(id(m, 'r-new')!)).toBe('New routine');
    // The capsule rides it, lifted on charcoal, over the fade.
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(true);
    expect(m.container.querySelector('.fade')?.hasAttribute('hidden')).toBe(false);
  });

  it('names each row in SPEC 11’s words, with its hint', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    const rows = [...m.container.querySelectorAll<HTMLElement>('.screen [data-row] .rowbtn')];
    expect(rows.map(nameOf)).toEqual([
      'Morning, 6 steps, ran today',
      'Leaving the house, 4 steps',
      'Evening wind-down, 5 steps',
      'Sunday reset, 7 steps',
    ]);
    expect(rows.map(hintOf)).toEqual(Array(4).fill('Opens the routine.'));
  });

  it('offers four choices, and reads them in SPEC 11’s order', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    expect(choices(m.container)).toBe(4);
    expect(readingOrder(m.container)).toEqual([
      'Routines',
      'Me',
      'Open a routine to start it.',
      'Morning, 6 steps, ran today',
      'Leaving the house, 4 steps',
      'Evening wind-down, 5 steps',
      'Sunday reset, 7 steps',
      'New routine',
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
      'Capture',
      HANDLE,
      ...TABS,
    ]);
  });

  it('says "Ran today" only for a run finished today, and lets it go at 04:00', async () => {
    const m = await mount(TUE_1005, 'example', (state, now) => {
      // Evening wind-down begun and left unfinished: it did not run, and
      // nothing says so either.
      const evening = state.routines.routines[2]!;
      return {
        ...state,
        routines: {
          ...state.routines,
          runs: routineModel.startRun(state.routines.runs, evening, now),
        },
      };
    });
    press(m.container, 'Routines');
    expect(rowsOf(m)[0]).toBe('Morning · 6 steps · Ran today');
    expect(rowsOf(m)[2]).toBe('Evening wind-down · 5 steps');
    m.clock.now = at('2026-11-25T04:01:00');
    vi.advanceTimersByTime(60_000);
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
    expect(m.container.querySelectorAll('.screen .ran')).toHaveLength(0);
    expect(rowsOf(m)[0]).toBe('Morning · 6 steps');
    expect(nameOf(id(m, 'rt-' + stateOf(m).routines.routines[0]!.id)!)).toBe('Morning, 6 steps');
  });

  it('on white places: the same list, the capsule the one dark thing', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    press(m.container, 'Routines');
    expect(m.container.dataset['places']).toBe('white');
    expect(m.container.dataset['ground']).toBe('place');
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(false);
    expect(rowsOf(m)).toHaveLength(4);
    expect(choices(m.container)).toBe(4);
  });

  it('with nothing running carries no capsule: the list, New routine and capture', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Routines');
    expect(m.container.querySelector('.capsule')).toBeNull();
    expect(choices(m.container)).toBe(3);
  });

  it('with no routines says only its helper line, and still offers New routine', async () => {
    const m = await mount(TUE_1005, 'empty');
    press(m.container, 'Routines');
    expect(rowsOf(m)).toEqual([]);
    expect(m.container.querySelector('.screen [data-list]')).toBeNull();
    expect(readingOrder(m.container).slice(0, 4)).toEqual([
      'Routines',
      'Me',
      'Open a routine to start it.',
      'New routine',
    ]);
  });
});

describe('a routine’s own page, without running (SPEC 12; owner default 10)', () => {
  const LEAVING = 'Leaving the house, 4 steps';
  /** A step on the rail as drawn: its number, its title, and its minutes where set. */
  const railDrawn = (li: Element) =>
    [...li.querySelectorAll('.mk, .s, .sm')].map(drawnText).join(' · ');
  const opened = async (at = TUE_1005, scenario: 'example' | 'notStarted' = 'example') => {
    const m = await mount(at, scenario);
    press(m.container, 'Routines');
    press(m.container, LEAVING);
    return m;
  };

  it('opens pushed on Routines, which stays current: its name, and that running one is not here', async () => {
    const m = await opened();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Leaving the house');
    expect(id(m, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(nameOf(id(m, 'b-back')!)).toBe('Back to Routines');
    const sentences = [...m.container.querySelectorAll('.page .sentence')].map(drawnText);
    expect(sentences).toEqual([
      'Running a routine is not in this prototype.',
      'In the app, a routine starts from its own page, and starting it stops the timer on Write the school email. It keeps its place at step 2.',
    ]);
    // Nothing offers to start it: no Start, no Start this instead.
    expect(controls(m.container).map(nameOf)).not.toContain('Start');
    expect(controls(m.container).map(nameOf)).not.toContain('Start this instead');
    // The capsule rides the page, as on any other page that is not the present's.
    expect(m.container.querySelector('#b-capsule')).not.toBeNull();
  });

  it('shows its steps on the rail, with their minutes where a step is timed', async () => {
    const m = await opened();
    const rail = [...m.container.querySelectorAll('.rail li')];
    expect(rail.map(railDrawn)).toEqual([
      '1 · Keys, phone and wallet · 1 min',
      '2 · Put shoes on · 2 min',
      '3 · Coat on · 1 min',
      '4 · Lock the back door · 1 min',
    ]);
    expect(rail.map((li) => readText(li))).toEqual([
      'Step 1: Keys, phone and wallet, 1 minute',
      'Step 2: Put shoes on, 2 minutes',
      'Step 3: Coat on, 1 minute',
      'Step 4: Lock the back door, 1 minute',
    ]);
    // Nothing on the rail is a control: the page keeps to its choices.
    expect(m.container.querySelectorAll('.rail button')).toHaveLength(0);
  });

  it('offers two choices, the capsule and capture, and reads top to bottom', async () => {
    const m = await opened();
    expect(choices(m.container)).toBe(2);
    expect(readingOrder(m.container)).toEqual([
      'Back to Routines',
      'Me',
      'Leaving the house',
      'Running a routine is not in this prototype.',
      'In the app, a routine starts from its own page, and starting it stops the timer on Write the school email. It keeps its place at step 2.',
      'Steps',
      'Step 1: Keys, phone and wallet, 1 minute',
      'Step 2: Put shoes on, 2 minutes',
      'Step 3: Coat on, 1 minute',
      'Step 4: Lock the back door, 1 minute',
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
      'Capture',
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
      ...TABS,
    ]);
  });

  it('with nothing running says only where it would start, and a step with no minutes says none', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Routines');
    press(m.container, 'Morning, 6 steps, ran today');
    expect([...m.container.querySelectorAll('.page .sentence')].map(drawnText)).toEqual([
      'Running a routine is not in this prototype.',
      'In the app, a routine starts from its own page.',
    ]);
    expect(railDrawn(m.container.querySelector('.rail li')!)).toBe('1 · Open the curtains');
    expect(readText(m.container.querySelector('.rail li')!)).toBe('Step 1: Open the curtains');
    expect(m.container.querySelector('.capsule')).toBeNull();
  });

  it('is a level of its own in history: back goes back to Routines, as its back pill does', async () => {
    const m = await opened();
    expect(historyDepth()).toBe(1);
    goBack();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
    expect(historyDepth()).toBe(0);
    press(m.container, LEAVING);
    press(m.container, 'Back to Routines');
    vi.advanceTimersByTime(1);
    expect(historyDepth()).toBe(0);
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
  });

  it('keeps help two taps away: Me over the page, then back to it', async () => {
    const m = await opened();
    press(m.container, 'Me');
    expect(historyDepth()).toBe(2);
    expect(button(m.container, 'If things are bad right now')).toBeTruthy();
    goBack();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Leaving the house');
  });

  it('"+ New routine" opens a page that says making one is not in this prototype', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'New routine');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('New routine');
    expect(nameOf(id(m, 'b-back')!)).toBe('Back to Routines');
    expect([...m.container.querySelectorAll('.page .sentence')].map(drawnText)).toEqual([
      'Making a routine is not in this prototype.',
    ]);
    expect(choices(m.container)).toBe(2);
    expect(historyDepth()).toBe(1);
    goBack();
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Routines');
  });
});

describe('the Library (SPEC 12)', () => {
  const ROWS = [
    'Sleep, Bedtimes, waking and winding down',
    'Exercise, Moving more, in small ways',
    'Mindfulness, Short practices, a few minutes each',
    'Thinking tools, If-then phrases and problem-solving',
    'How we know, The evidence, and how strong it is',
  ];

  it('is a place of five rows, each a name over one plain line, and the capsule rides it', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Library');
    expect(m.container.querySelector('.screen h1')?.textContent).toBe('Library');
    expect(id(m, 't-library')?.getAttribute('aria-current')).toBe('page');
    const rows = [...m.container.querySelectorAll<HTMLElement>('.screen [data-row]')];
    expect(rows.map((row) => drawnText(row.querySelector('.rt > span')!))).toEqual([
      'Sleep',
      'Exercise',
      'Mindfulness',
      'Thinking tools',
      'How we know',
    ]);
    expect(rows.map((row) => nameOf(row.querySelector('.rowbtn')!))).toEqual(ROWS);
    // No tier as a letter or a badge, and none of it called evidence-based.
    expect(visibleText(m.container)).not.toMatch(/\bTier\b|evidence-based/i);
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(true);
  });

  it('offers three choices, and reads top to bottom', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Library');
    expect(choices(m.container)).toBe(3);
    expect(readingOrder(m.container)).toEqual([
      'Library',
      'Me',
      ...ROWS,
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
      'Capture',
      'Next, in 25 minutes: 10:30, Call the dentist. Rest of today',
      ...TABS,
    ]);
  });

  it('opens each row’s page pushed on Library, saying it is not in this prototype', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Library');
    for (const [index, name] of ROWS.entries()) {
      press(m.container, name);
      const title = name.split(', ')[0];
      expect(m.container.querySelector('.screen h1')?.textContent, name).toBe(title);
      expect(id(m, 't-library')?.getAttribute('aria-current')).toBe('page');
      expect(drawnText(m.container.querySelector('.page .sentence')!)).toBe(
        'Not in this prototype.',
      );
      expect(choices(m.container)).toBe(2);
      expect(historyDepth()).toBe(1);
      // Back by the edge swipe for some, by the back pill for the rest.
      if (index % 2 === 0) goBack();
      else press(m.container, 'Back to Library');
      vi.advanceTimersByTime(1);
      expect(m.container.querySelector('.screen h1')?.textContent).toBe('Library');
      expect(historyDepth()).toBe(0);
    }
  });

  it('on white places: the same rows, the capsule plain charcoal', async () => {
    const m = await mount(TUE_1005, 'example', (state) => ({
      ...state,
      bench: { ...state.bench, settings: { ...state.bench.settings, places: 'white' } },
    }));
    press(m.container, 'Library');
    expect(m.container.dataset['places']).toBe('white');
    expect(m.container.querySelector('.capsule')?.classList.contains('lift')).toBe(false);
    expect(choices(m.container)).toBe(3);
  });
});

describe('coming back after a reload (plan sections 4 and 8; SPEC 5.7)', () => {
  // Under 15 minutes away, exactly where the person was, level by level: the
  // tab, its list and its scroll, the pages pushed on it, Focus, and what an
  // open sheet held. After that, Today. Each reload goes away as Safari does
  // and boots from exactly what was stored.
  const title = (m: Mounted) => m.container.querySelector('.screen h1')?.textContent;
  const onToday = (m: Mounted) => {
    expect(id(m, 'b-lit')).not.toBeNull();
    expect(id(m, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(0);
  };

  it('the tab, its list and where the list was scrolled; Today after 15 minutes', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    pressTab(m.container, 'Today');
    m.container.querySelector<HTMLElement>('[data-scroll-key="tasks-today"]')!.scrollTop = 120;
    const again = await reload(m, 14);
    expect(title(again)).toBe('Tasks');
    expect(id(again, 'l-today')?.getAttribute('aria-selected')).toBe('true');
    expect(
      again.container.querySelector<HTMLElement>('[data-scroll-key="tasks-today"]')!.scrollTop,
    ).toBe(120);
    expect(historyDepth()).toBe(0);
    const later = await reload(again, 15);
    onToday(later);
    press(later.container, 'Tasks');
    expect(id(later, 'l-inbox')?.getAttribute('aria-selected')).toBe('true');
  });

  it('the Tasks list under a pushed page, scrolled where it was when back finds it', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    const inbox = () => m.container.querySelector<HTMLElement>('[data-scroll-key="tasks-inbox"]')!;
    inbox().scrollTop = 80;
    press(m.container, 'Cancel the gym trial, 2 steps');
    const again = await reload(m, 5);
    expect(title(again)).toBe('Cancel the gym trial');
    goBack();
    expect(title(again)).toBe('Tasks');
    expect(
      again.container.querySelector<HTMLElement>('[data-scroll-key="tasks-inbox"]')!.scrollTop,
    ).toBe(80);
  });

  it('a routine’s page pushed on Routines, with its entry, so back goes to the list', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'Leaving the house, 4 steps');
    const again = await reload(m, 10);
    expect(title(again)).toBe('Leaving the house');
    expect(id(again, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(title(again)).toBe('Routines');
    press(again.container, 'Leaving the house, 4 steps');
    onToday(await reload(again, 30));
  });

  it('two pages deep: Me over a Library topic, each back a page', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Library');
    press(m.container, 'Sleep, Bedtimes, waking and winding down');
    press(m.container, 'Me');
    const again = await reload(m, 5);
    expect(title(again)).toBe('Me');
    expect(historyDepth()).toBe(2);
    goBack();
    expect(title(again)).toBe('Sleep');
    goBack();
    expect(title(again)).toBe('Library');
  });

  it('the open drawer, over Today, a place or a page, with its entry, so back folds it first', async () => {
    const open = (m: Mounted) => expect(m.container.dataset['drawer']).toBe('open');
    const folded = (m: Mounted) => expect(m.container.dataset['drawer']).toBe('folded');
    // Over Today.
    const m = await mount(TUE_1005);
    press(m.container, /^Next/);
    const today = await reload(m, 5);
    open(today);
    expect(id(today, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(1);
    goBack();
    folded(today);
    expect(id(today, 'b-lit')).not.toBeNull();
    expect(historyDepth()).toBe(0);
    // Over a place, which stays current under it.
    press(today.container, 'Routines');
    press(today.container, /^Next/);
    const place = await reload(today, 5);
    open(place);
    expect(id(place, 't-routines')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(1);
    goBack();
    folded(place);
    expect(title(place)).toBe('Routines');
    expect(historyDepth()).toBe(0);
    // Over a page pushed on the place: back goes the drawer first, then the page.
    press(place.container, 'Leaving the house, 4 steps');
    press(place.container, /^Next/);
    const page = await reload(place, 5);
    open(page);
    expect(historyDepth()).toBe(2);
    goBack();
    folded(page);
    expect(title(page)).toBe('Leaving the house');
    goBack();
    expect(title(page)).toBe('Routines');
    expect(historyDepth()).toBe(0);
  });

  it('after 15 minutes, a drawer left open opens over Today, still open: its place is kept for the day', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'Leaving the house, 4 steps');
    press(m.container, /^Next/);
    const later = await reload(m, 20);
    expect(id(later, 't-today')?.getAttribute('aria-current')).toBe('page');
    expect(later.container.dataset['drawer']).toBe('open');
    expect(historyDepth()).toBe(1);
    goBack();
    expect(later.container.dataset['drawer']).toBe('folded');
    onToday(later);
  });

  it('a task’s page, and the words left in its "Add a step" field', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Cancel the gym trial, 2 steps');
    id(m, 'p-addstep')!.click();
    const input = id(m, 'p-stepfield') as HTMLInputElement;
    input.value = 'Find the contract';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const again = await reload(m, 5);
    expect(title(again)).toBe('Cancel the gym trial');
    expect((id(again, 'p-stepfield') as HTMLInputElement).value).toBe('Find the contract');
    expect(historyDepth()).toBe(1);
    // After longer, Today; the words are still kept for the field.
    const later = await reload(again, 20);
    onToday(later);
    press(later.container, 'Tasks');
    press(later.container, 'Cancel the gym trial, 2 steps');
    expect((id(later, 'p-stepfield') as HTMLInputElement).value).toBe('Find the contract');
  });

  it('Focus, over the tab it was opened on, which "⌄" names', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, /^Now: Write the question, step 2 of 3/);
    expect(m.container.dataset['focus']).toBe('open');
    const again = await reload(m, 5);
    expect(again.container.dataset['focus']).toBe('open');
    expect(button(again.container, 'Back to Routines')).toBeTruthy();
    expect(historyDepth()).toBe(1);
    goBack();
    expect(again.container.dataset['focus']).toBeUndefined();
    expect(title(again)).toBe('Routines');
    press(again.container, /^Now: Write the question, step 2 of 3/);
    const later = await reload(again, 15);
    expect(later.container.dataset['focus']).toBeUndefined();
    onToday(later);
  });

  it('capture’s words and where they go; the sheet waits for a tap, which brings the keyboard', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Capture');
    type(m, 'Ask Ana about Friday');
    press(m.container, 'Today');
    const again = await reload(m, 5);
    expect(again.container.dataset['sheet']).toBeUndefined();
    press(again.container, 'Capture, draft kept');
    expect((id(again, 'c-field') as HTMLInputElement).value).toBe('Ask Ana about Friday');
    expect(id(again, 'c-to-today')?.getAttribute('aria-checked')).toBe('true');
    // A draft is kept however long the person was away; only where they open changes.
    const later = await reload(again, 60);
    onToday(later);
    expect(nameOf(id(later, 'b-capture')!)).toBe('Capture, draft kept');
  });

  it('a note being written in its sheet: the words are the task’s, the sheet waits for a tap', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Fix the bike light');
    press(m.container, 'More');
    press(m.container, 'Add a note');
    const note = id(m, 'ts-field') as HTMLTextAreaElement;
    note.value = 'The front one';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    const again = await reload(m, 5);
    expect(title(again)).toBe('Fix the bike light');
    expect(again.container.dataset['tsheet']).toBeUndefined();
    expect(titled(stateOf(again), 'Fix the bike light').notes).toBe('The front one');
    expect(historyDepth()).toBe(1);
  });

  it('the when, ⋯ and delete sheets: the page comes back, the sheet waits to be opened again', async () => {
    for (const [kind, open] of [
      ['when', [/^When: /]],
      ['more', ['More']],
      ['delete', ['More', 'Delete']],
    ] as const) {
      const m = await mount(TUE_1005);
      press(m.container, 'Tasks');
      press(m.container, 'Cancel the gym trial, 2 steps');
      for (const name of open) press(m.container, name);
      expect(m.container.dataset['tsheet'], kind).toBe(kind);
      expect(historyDepth(), kind).toBe(2);
      const again = await reload(m, 5);
      expect(title(again), kind).toBe('Cancel the gym trial');
      expect(again.container.dataset['tsheet'], kind).toBeUndefined();
      expect(historyDepth(), kind).toBe(1);
      // Nothing was chosen in the sheet, so nothing changed: the task is there.
      expect(titled(stateOf(again), 'Cancel the gym trial'), kind).toBeDefined();
      goBack();
      expect(title(again), kind).toBe('Tasks');
      unmount();
    }
  });

  it('after 15 minutes: Today, whether a note was being written or two pages were open', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    press(m.container, 'Fix the bike light');
    press(m.container, 'More');
    press(m.container, 'Add a note');
    const note = id(m, 'ts-field') as HTMLTextAreaElement;
    note.value = 'The front one';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    const later = await reload(m, 20);
    onToday(later);
    expect(later.container.dataset['tsheet']).toBeUndefined();
    // The words are the task's, kept however long the person was away.
    expect(titled(stateOf(later), 'Fix the bike light').notes).toBe('The front one');

    press(later.container, 'Library');
    press(later.container, 'Sleep, Bedtimes, waking and winding down');
    press(later.container, 'Me');
    expect(historyDepth()).toBe(2);
    onToday(await reload(later, 15));
  });

  it('leaves out a restored Library topic this build does not have, and opens on the Library', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Library');
    press(m.container, 'Sleep, Bedtimes, waking and winding down');
    const again = await reload(m, 5, {
      edit: (state) => ({
        ...state,
        bench: {
          ...state.bench,
          ui: { ...state.bench.ui!, stack: [{ kind: 'library', topic: 'astrology' }] },
        },
      }),
    });
    expect(title(again)).toBe('Library');
    expect(id(again, 't-library')?.getAttribute('aria-current')).toBe('page');
    expect(historyDepth()).toBe(0);
  });

  it('a page killed before it could say it went away: from where it was last, if that was recent', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'New routine');
    // No pagehide: the last page change is the only record, once the store's
    // debounce has written it, as it has a moment after the tap.
    vi.advanceTimersByTime(500);
    const again = await reload(m, 10, { hide: false });
    expect(title(again)).toBe('New routine');
    press(again.container, 'Back to Routines');
    vi.advanceTimersByTime(1);
    press(again.container, 'Library');
    vi.advanceTimersByTime(500);
    onToday(await reload(again, 15, { hide: false }));
  });

  it('leaves out a restored page whose routine has gone, and opens on its tab', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    press(m.container, 'Sunday reset, 7 steps');
    const again = await reload(m, 5, {
      edit: (state) => ({
        ...state,
        routines: {
          ...state.routines,
          routines: state.routines.routines.filter((routine) => routine.title !== 'Sunday reset'),
        },
      }),
    });
    expect(title(again)).toBe('Routines');
    expect(historyDepth()).toBe(0);
  });
});

describe('Reduce Motion between pages, and lighting on Start (SPEC 10; plan section 14)', () => {
  const faded = (m: Mounted) =>
    [...m.container.querySelectorAll('.screen > *')].map((node) =>
      node.classList.contains('enter'),
    );

  it('fades a tab’s screen in once, as it arrives, and not as it moves after', async () => {
    const m = await mount(TUE_1005);
    // Nothing fades on launch: the page is simply there.
    expect(faded(m).some(Boolean)).toBe(false);
    press(m.container, 'Routines');
    expect(faded(m).length).toBeGreaterThan(0);
    expect(faded(m).every(Boolean)).toBe(true);
    vi.advanceTimersByTime(300);
    expect(faded(m).some(Boolean)).toBe(false);
    advance(m, 1);
    expect(faded(m).some(Boolean)).toBe(false);
    press(m.container, 'Today');
    expect(faded(m).every(Boolean)).toBe(true);
  });

  it('fades a page pushed or popped, by the back pill or by back, but not a choice in the switcher', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Routines');
    vi.advanceTimersByTime(300);
    press(m.container, 'Leaving the house, 4 steps');
    expect(faded(m).every(Boolean)).toBe(true);
    vi.advanceTimersByTime(300);
    goBack();
    expect(faded(m).every(Boolean)).toBe(true);
    press(m.container, 'Tasks');
    vi.advanceTimersByTime(300);
    pressTab(m.container, 'Done');
    expect(faded(m).some(Boolean)).toBe(false);
    // Opening the drawer over a place changes nothing under it.
    press(m.container, /^Next/);
    expect(faded(m).some(Boolean)).toBe(false);
  });

  it('lights Today on Start as a 150 ms colour change, and only then', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Start');
    const lantern = m.container.querySelector('.screen .lantern')!;
    expect(lantern.classList.contains('lighting')).toBe(true);
    expect(faded(m).some(Boolean)).toBe(false);
    vi.advanceTimersByTime(200);
    expect(lantern.classList.contains('lighting')).toBe(false);
    settle(m);
    // Pausing and resuming change nothing that lights: it was lit already.
    press(m.container, 'Pause');
    press(m.container, 'Resume');
    expect(m.container.querySelector('.screen .lantern.lighting')).toBeNull();
  });
});

describe('the drawer in the hand (SPEC 9.8 and 10; plan section 13)', () => {
  const HANDLE = 'Next, in 25 minutes: 10:30, Call the dentist. Rest of today';
  const reduced = (state: BenchDomains): BenchDomains => ({
    ...state,
    bench: { ...state.bench, settings: { ...state.bench.settings, motion: 'reduced' } },
  });
  const handle = (m: Mounted) => id(m, 'b-handle')!;
  const heading = (m: Mounted) => id(m, 'h-rest')!;
  const drawerOf = (m: Mounted) => m.container.querySelector<HTMLElement>('.drawer')!;
  /** History once the moves made by a fold have landed (jsdom moves on its timers). */
  const depth = () => {
    vi.advanceTimersByTime(1);
    return historyDepth();
  };
  const at = (m: Mounted) => m.container.dataset['drawer'];

  // The finger is pressed on the handle band 36 below the drawer's top, and
  // on the open drawer's header 30 below it, so these let go with the top at
  // the last y less 36 (or plus 30 less 90 for the header).

  it('pulled up from folded and let go nearer open, it opens as a tap would: one entry, focus on its heading', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    pull(m, handle(m), [720, 600, 480, 300]);
    expect(at(m)).toBe('open');
    expect(depth()).toBe(1);
    expect(document.activeElement).toBe(heading(m));
    expect(stateOf(m).bench.drawer.running).toBe('open');
    // The lantern has folded into the capsule, on the cover with capture.
    expect(id(m, 'b-capsule')).not.toBeNull();
    expect(id(m, 'b-stepdone')).toBeNull();
    // Back folds it, as after a tap.
    goBack();
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
  });

  it('pulled down by its header row, or the grabber’s band above it, it folds: the entry goes, focus on the handle', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    press(m.container, HANDLE);
    expect(depth()).toBe(1);
    pull(m, heading(m), [90, 300, 500, 700]);
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
    expect(document.activeElement).toBe(handle(m));
    expect(stateOf(m).bench.drawer.running).toBe('folded');
    press(m.container, HANDLE);
    const band = m.container.querySelector('.drawer .grabzone')!;
    expect(band.getAttribute('aria-hidden')).toBe('true');
    pull(m, band, [66, 300, 500, 700]);
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
  });

  it('Escape folds it as Hide does, unless a sheet over it takes the key', async () => {
    const m = await mount(TUE_1005);
    const escape = () =>
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    // Folded, Escape is nobody's.
    const idle = escape();
    handle(m).dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);
    press(m.container, HANDLE);
    expect(depth()).toBe(1);
    const key = escape();
    heading(m).dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
    expect(document.activeElement).toBe(handle(m));
    // Over the open drawer, the capture sheet closes, and the drawer stays.
    press(m.container, HANDLE);
    press(m.container, 'Capture');
    expect(m.container.dataset['sheet']).toBe('place');
    type(m, 'Ring the garage').dispatchEvent(escape());
    expect(m.container.dataset['sheet']).toBeUndefined();
    expect(at(m)).toBe('open');
    expect(depth()).toBe(1);
  });

  it('pulled down by Hide at its foot, it folds as Hide would', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    press(m.container, HANDLE);
    const hide = button(m.container, 'Hide the rest of today');
    pull(m, hide, [720, 800, 900, 1300]);
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
    expect(document.activeElement).toBe(handle(m));
  });

  it('idle on Today, rests at each of half, folded and open where let go, kept for the day; only open has an entry', async () => {
    layOut();
    const m = await mount(TUE_0958, 'notStarted', reduced);
    expect(at(m)).toBe('half');
    const half = () => button(m.container, 'Rest of today');
    // Half to folded: let go at 584, nearer folded (684) than half (366).
    pull(m, half(), [389, 450, 520, 607]);
    expect(at(m)).toBe('folded');
    expect(stateOf(m).bench.drawer.idle).toBe('folded');
    expect(depth()).toBe(0);
    // Folded to half: let go at 400.
    pull(m, handle(m), [720, 600, 500, 436]);
    expect(at(m)).toBe('half');
    expect(stateOf(m).bench.drawer.idle).toBe('half');
    expect(depth()).toBe(0);
    // Half to open: let go at 140.
    pull(m, half(), [389, 300, 200, 163]);
    expect(at(m)).toBe('open');
    expect(depth()).toBe(1);
    // Open to half, by the header: let go at 340.
    pull(m, heading(m), [90, 200, 300, 370]);
    expect(at(m)).toBe('half');
    expect(stateOf(m).bench.drawer.idle).toBe('half');
    expect(depth()).toBe(0);
    // Open to folded, past half.
    press(m.container, 'Rest of today');
    pull(m, heading(m), [90, 300, 500, 700]);
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
    // A tab away and back: the drawer rests where it was left, for the day.
    press(m.container, 'Tasks');
    press(m.container, 'Today');
    expect(at(m)).toBe('folded');
  });

  it('while something runs it never rests half, wherever it is let go', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    // Let go at 366, where idle would rest half: nearer open (306) than folded (318).
    pull(m, handle(m), [720, 600, 500, 402]);
    expect(at(m)).toBe('open');
    goBack();
    // At 400: nearer folded.
    pull(m, handle(m), [720, 600, 500, 436]);
    expect(at(m)).toBe('folded');
    expect(stateOf(m).bench.drawer.running).toBe('folded');
  });

  it('a short flick carries it to where it was flung', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    // 60 pt up in 24 ms: let go at 624, nearest folded, but heading for open.
    pull(m, handle(m), [720, 708, 690, 660], { every: 8 });
    expect(at(m)).toBe('open');
  });

  it('the half drawer’s top is measured under the open drawer too, so a pull down finds where the lantern ends now', async () => {
    layOut();
    // Where the unlit lantern ends: moved below while the drawer is open.
    let foot = 340;
    const laid = vi.mocked(Element.prototype.getBoundingClientRect);
    const board = laid.getMockImplementation()!;
    laid.mockImplementation(function (this: Element) {
      if (this instanceof HTMLElement && this.dataset['halfAnchor'] !== undefined) {
        return {
          top: foot - 48,
          bottom: foot,
          left: 0,
          right: 0,
          width: 0,
          height: 48,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return board.call(this);
    });
    const m = await mount(TUE_0958, 'notStarted', reduced);
    const top = () => m.container.style.getPropertyValue('--half-t');
    expect(top()).toBe('356px');
    press(m.container, 'Rest of today');
    expect(at(m)).toBe('open');
    foot = 400;
    advance(m, 1);
    expect(at(m)).toBe('open');
    expect(top()).toBe('416px');
  });

  it('a quick 40 pt pull from half, held still a moment before letting go, rests half', async () => {
    layOut();
    const m = await mount(TUE_0958, 'notStarted');
    expect(m.container.dataset['motion']).toBe('full');
    const before = stateOf(m);
    // Up from 389 to 349, the last 11 pt in 16 ms, then held 74 ms: the
    // drawer's top is at 326, and the finger has stopped.
    pull(m, button(m.container, 'Rest of today'), [389, 380, 370, 360, 349], {
      every: [18, 33, 34, 16],
      hold: 74,
    });
    fly(m);
    expect(at(m)).toBe('half');
    expect(stateOf(m)).toBe(before);
    expect(depth()).toBe(0);
    expect(drawerOf(m).style.transform).toBe('');
    // Lifted at once, it is not flung either.
    pull(m, button(m.container, 'Rest of today'), [389, 380, 370, 360, 349], {
      every: [18, 33, 34, 16],
      hold: 5,
    });
    fly(m);
    expect(at(m)).toBe('half');
  });

  it('a pull that ends where it began changes nothing: no write, no entry', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    const before = stateOf(m);
    pull(m, handle(m), [720, 660, 700, 730]);
    expect(at(m)).toBe('folded');
    expect(stateOf(m)).toBe(before);
    expect(depth()).toBe(0);
    expect(m.container.querySelector('.ghost')).toBeNull();
    expect(drawerOf(m).style.transform).toBe('');
  });

  it('a press on the list, or a row, scrolls the list and never pulls the drawer', async () => {
    layOut();
    const m = await mount(TUE_0958, 'notStarted', reduced);
    const row = m.container.querySelector('.drawer .list .rowbtn')!;
    pull(m, row, [500, 300, 100], { click: false });
    expect(at(m)).toBe('half');
    expect(m.container.dataset['travel']).toBeUndefined();
    pull(m, m.container.querySelector('.drawer .list')!, [500, 300, 100]);
    expect(at(m)).toBe('half');
  });

  it('a press that does not move is a tap: the handle’s button opens it', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    pull(m, handle(m), [720, 724], { up: false });
    expect(m.container.dataset['travel']).toBeUndefined();
    handle(m).dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientY: 724, pointerId: 7 }),
    );
    expect(at(m)).toBe('folded');
    handle(m).click();
    expect(at(m)).toBe('open');
    expect(document.activeElement).toBe(heading(m));
  });

  it('offers no pull at its lip, under Focus, or under a sheet', async () => {
    layOut();
    const lip = await mount(MON_0912, 'weeksAway', reduced);
    expect(at(lip)).toBe('lip');
    pull(lip, drawerOf(lip), [740, 500, 300], { click: false });
    expect(at(lip)).toBe('lip');
    expect(lip.container.dataset['travel']).toBeUndefined();
    unmount();

    const m = await mount(TUE_1005, 'example', reduced);
    press(m.container, /^Now: Write the question/);
    expect(m.container.dataset['focus']).toBe('open');
    pull(m, handle(m), [720, 500, 300], { click: false });
    expect(at(m)).toBe('folded');
    press(m.container, 'Back to Today');
    outlastFade();
    press(m.container, 'Capture');
    pull(m, handle(m), [720, 500, 300], { click: false });
    expect(at(m)).toBe('folded');
    expect(m.container.dataset['travel']).toBeUndefined();
  });

  it('on its way, carries the list and fades the lantern, Step done and Pause; drawn only, never read', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    const read = readingOrder(m.container);
    pull(m, handle(m), [720, 600, 500], { up: false });
    expect(m.container.dataset['travel']).toBe('present');
    expect(drawerOf(m).style.transform).toBe('translateY(464px)');
    // The list it would open to, under the handle: a picture, not a list.
    const copy = drawerOf(m).querySelector('.ghost')!;
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.hasAttribute('inert')).toBe(true);
    expect(copy.querySelector('[id]')).toBeNull();
    expect(copy.textContent).toContain('Call the dentist');
    // 220 of 624 pt up: the lantern a third gone; the dock line's buttons,
    // past their 48 pt, gone.
    expect(Number(m.container.style.getPropertyValue('--lift'))).toBeCloseTo(220 / 624, 2);
    expect(m.container.style.getPropertyValue('--fold-fg')).toBe('0.000');
    // A screen reader meets nothing new.
    expect(readingOrder(m.container)).toEqual(read);
    // Step done takes no tap while the drawer moves.
    const done = stateOf(m).tasks;
    press(m.container, /^Step done/);
    expect(stateOf(m).tasks).toBe(done);
    m.container
      .querySelector('.drawer')!
      .dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 500, pointerId: 7 }));
    // Let go at 464, nearer folded: back to rest, the pictures gone.
    expect(at(m)).toBe('folded');
    expect(m.container.dataset['travel']).toBeUndefined();
    expect(m.container.querySelector('.ghost')).toBeNull();
    expect(m.container.style.getPropertyValue('--lift')).toBe('');
    // Nor for a second after, as when the lantern grows out of the capsule.
    press(m.container, /^Step done/);
    expect(stateOf(m).tasks).toBe(done);
    settle(m);
    press(m.container, /^Step done/);
    expect(stateOf(m).tasks).not.toBe(done);
  });

  it('pulled down from open, a picture of the folded handle comes back over the list near the foot', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    press(m.container, HANDLE);
    pull(m, heading(m), [90, 400, 690], { up: false });
    // At 660, 24 above folded: the stone has come back, the words half way.
    const top = drawerOf(m).querySelector('.ghost.top')!;
    expect(top.textContent).toContain('Call the dentist');
    expect(top.querySelector('[id]')).toBeNull();
    expect(m.container.style.getPropertyValue('--fold-bg')).toBe('1.000');
    expect(m.container.style.getPropertyValue('--fold-fg')).toBe('0.500');
    // The capsule, which the folded drawer does not show over Today, has gone.
    expect(m.container.style.getPropertyValue('--open-fg')).toBe('0.000');
  });

  it('with motion on, it travels on the spring and rests, and commits, only when it gets there', async () => {
    layOut();
    const m = await mount(TUE_1005);
    expect(m.container.dataset['motion']).toBe('full');
    pull(m, handle(m), [720, 600, 480, 300]);
    // On its way: still folded in the record and in history.
    expect(at(m)).toBe('folded');
    expect(depth()).toBe(0);
    const first = drawerOf(m).style.transform;
    expect(first).toBe('translateY(264px)');
    fly(m, 64);
    const y = Number(/translateY\((.+)px\)/.exec(drawerOf(m).style.transform)?.[1]);
    expect(y).toBeLessThan(264);
    expect(y).toBeGreaterThan(60);
    fly(m);
    expect(at(m)).toBe('open');
    expect(depth()).toBe(1);
    expect(drawerOf(m).style.transform).toBe('');
    expect(document.activeElement).toBe(heading(m));
  });

  it('caught on its spring, it stops under the finger', async () => {
    layOut();
    const m = await mount(TUE_1005);
    pull(m, handle(m), [720, 600, 480, 300]);
    fly(m, 48);
    const caught = drawerOf(m).style.transform;
    drawerOf(m).dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientY: 300, pointerId: 7 }),
    );
    fly(m, 200);
    expect(drawerOf(m).style.transform).toBe(caught);
    expect(at(m)).toBe('folded');
    m.mono.now += 200;
    drawerOf(m).dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientY: 300, pointerId: 7 }),
    );
    fly(m);
    expect(at(m)).toBe('open');
  });

  it('a tap on the handle as it springs back lands it, and the tap opens it as at rest', async () => {
    layOut();
    const m = await mount(TUE_1005);
    // Pulled up 30 pt and let go: back toward folded on the spring.
    pull(m, handle(m), [720, 700, 690]);
    fly(m, 48);
    expect(m.container.dataset['travel']).toBe('present');
    const tap = handle(m);
    tap.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientY: 715, pointerId: 7 }),
    );
    fly(m, 64);
    expect(at(m)).toBe('folded');
    m.mono.now += 20;
    tap.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 715, pointerId: 7 }));
    tap.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(m.container.dataset['travel']).toBeUndefined();
    expect(at(m)).toBe('open');
    expect(depth()).toBe(1);
    expect(document.activeElement).toBe(heading(m));
  });

  it('a tap on a row of the open drawer as it springs down lands it, then opens the row', async () => {
    layOut();
    const m = await mount(TUE_1005);
    press(m.container, HANDLE);
    // Pulled down to 100 and let go there: back up toward open.
    pull(m, heading(m), [90, 130, 160]);
    fly(m, 32);
    const row = m.container.querySelector<HTMLElement>('.drawer .list .rowbtn')!;
    row.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientY: 300, pointerId: 7 }),
    );
    m.mono.now += 60;
    row.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 300, pointerId: 7 }));
    row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(m.container.dataset['travel']).toBeUndefined();
    // The row's page, pushed over the folded drawer, as a tap at rest does.
    expect(at(m)).toBe('folded');
    expect(m.container.querySelector('.screen.task')).not.toBeNull();
  });

  it('a tap elsewhere while it springs lands it first, where it was going, then acts', async () => {
    layOut();
    const m = await mount(TUE_1005);
    pull(m, handle(m), [720, 600, 480, 300]);
    fly(m, 32);
    // Heading open: it opens, then the tab folds it and goes, as on the open drawer.
    press(m.container, 'Tasks');
    expect(m.container.dataset['travel']).toBeUndefined();
    expect(at(m)).toBe('folded');
    expect(id(m, 't-tasks')?.getAttribute('aria-current')).toBe('page');
    expect(stateOf(m).bench.drawer.running).toBe('folded');
    expect(depth()).toBe(0);
  });

  it('leaving the app mid-spring lands it where it was going', async () => {
    layOut();
    const m = await mount(TUE_1005);
    pull(m, handle(m), [720, 600, 480, 300]);
    fly(m, 32);
    window.dispatchEvent(new Event('pagehide'));
    expect(at(m)).toBe('open');
    expect(stateOf(m).bench.drawer.running).toBe('open');
  });

  it('leaving the app with a finger still on it lets it go where it is: nothing stays held', async () => {
    layOut();
    const m = await mount(TUE_1005);
    pull(m, handle(m), [720, 600, 480, 300], { up: false });
    expect(m.container.dataset['travel']).toBe('present');
    window.dispatchEvent(new Event('pagehide'));
    // Let go at 264, nearer open, as a touch the system took.
    expect(m.container.dataset['travel']).toBeUndefined();
    expect(at(m)).toBe('open');
    expect(stateOf(m).bench.drawer.running).toBe('open');
    expect(drawerOf(m).style.transform).toBe('');
    expect(m.container.querySelector('.ghost')).toBeNull();
    // The lift, should it come, changes nothing.
    drawerOf(m).dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientY: 300, pointerId: 7 }),
    );
    expect(at(m)).toBe('open');
  });

  it('a pull whose capture is lost with no lift lets go where it is, and the next pull is a pull', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    pull(m, handle(m), [720, 600, 500], { up: false });
    // The handle a touch pressed loses its hold to the drawer as the pull
    // begins: the pull goes on.
    handle(m).dispatchEvent(
      new PointerEvent('lostpointercapture', { pointerId: 7, bubbles: true }),
    );
    vi.advanceTimersByTime(16);
    expect(m.container.dataset['travel']).toBe('present');
    drawerOf(m).dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 7 }));
    vi.advanceTimersByTime(16);
    // Let go at 464, nearer folded; Step done takes taps again once the guard is over.
    expect(m.container.dataset['travel']).toBeUndefined();
    expect(at(m)).toBe('folded');
    // Past the guard, and the moment in which a lost lift's click is eaten.
    settle(m);
    vi.advanceTimersByTime(500);
    const before = stateOf(m).tasks;
    press(m.container, /^Step done/);
    expect(stateOf(m).tasks).not.toBe(before);
    pull(m, handle(m), [720, 600, 480, 300]);
    expect(at(m)).toBe('open');
  });

  it('“Rest of today ⌃” and “⌄ Hide” cross-fade in one place over 150 ms when tapped', async () => {
    const m = await mount(TUE_1005);
    press(m.container, HANDLE);
    const foot = m.container.querySelector('.foot')!;
    // Hide's words fade in, and the words that stood there fade out.
    expect(foot.querySelector('#b-hide .h-more')?.classList.contains('xin')).toBe(true);
    const leaving = foot.querySelector('.xghost')!;
    expect(leaving.getAttribute('aria-hidden')).toBe('true');
    expect(drawnText(leaving)).toBe('Rest of today');
    // Drawn, not read: the open drawer's heading is the one "Rest of today".
    expect(readingOrder(m.container).filter((name) => name === 'Rest of today')).toEqual([
      'Rest of today',
    ]);
    vi.advanceTimersByTime(200);
    expect(foot.querySelector('.xghost')).toBeNull();
    expect(foot.querySelector('.xin')).toBeNull();
    // And back.
    press(m.container, 'Hide the rest of today');
    expect(drawnText(foot.querySelector('.xghost')!)).toBe('Hide');
    expect(handle(m).querySelector('.h-more')?.classList.contains('xin')).toBe(true);
    vi.advanceTimersByTime(200);
    expect(foot.querySelector('.xghost')).toBeNull();
    expect(foot.children.length).toBe(0);
  });

  it('after a pull, Hide fades in alone: the old words went up with the drawer', async () => {
    layOut();
    const m = await mount(TUE_1005, 'example', reduced);
    pull(m, handle(m), [720, 600, 480, 300]);
    const foot = m.container.querySelector('.foot')!;
    expect(foot.querySelector('#b-hide .h-more')?.classList.contains('xin')).toBe(true);
    expect(foot.querySelector('.xghost')).toBeNull();
  });

  it('where it comes to rest on another list than it carried (half and open), the old fades out over the new', async () => {
    layOut();
    const m = await mount(TUE_0958, 'notStarted', reduced);
    pull(m, button(m.container, 'Rest of today'), [389, 300, 200, 163]);
    expect(at(m)).toBe('open');
    const leaving = drawerOf(m).querySelector('.ghost.leaving')!;
    expect(leaving.getAttribute('aria-hidden')).toBe('true');
    expect(leaving.querySelector('[id]')).toBeNull();
    // The open drawer's own heading is the one read, and has focus.
    expect(document.activeElement).toBe(heading(m));
    expect(readingOrder(m.container).filter((name) => name === 'Rest of today')).toEqual([
      'Rest of today',
    ]);
    vi.advanceTimersByTime(200);
    expect(drawerOf(m).querySelector('.ghost')).toBeNull();
  });

  it('pulled while an Undo holds it folded, it rests where it is let go, and stays there after', async () => {
    layOut();
    const m = await mount(TUE_1320, 'pauseLeft', reduced);
    settle(m);
    press(m.container, /^Set aside/);
    // Idle now, it would rest half; the Undo holds it folded for six seconds.
    expect(at(m)).toBe('folded');
    expect(id(m, 'b-undo')).not.toBeNull();
    pull(m, handle(m), [720, 600, 500, 436]);
    expect(at(m)).toBe('half');
    outlastUndo();
    expect(at(m)).toBe('half');
    // Pulled to folded under an Undo, it stays folded once the Undo has gone.
    press(m.container, 'Tasks');
    press(m.container, 'Today');
    settle(m);
    pull(m, button(m.container, 'Rest of today'), [389, 450, 520, 607]);
    expect(at(m)).toBe('folded');
    outlastUndo();
    expect(at(m)).toBe('folded');
  });
});
