import { afterEach, describe, expect, it, vi } from 'vitest';
import * as model from '../../src/domains/tasks';
import * as act from '../../src/bench/actions';
import { TAP_GUARD } from '../../src/bench/app';
import { EMAIL } from '../../src/bench/example';
import { loadScenario, migrateBench, type BenchDomains } from '../../src/bench/state';
import { emptyDomains } from '../../src/kernel/store';
import {
  button,
  hintOf,
  mount,
  nameOf,
  outlastUndo,
  press,
  readText,
  said,
  settle,
  stateOf,
  unmount,
  visibleText,
  type Mounted,
} from './mount';

// Every quick tap can be taken back (design/lantern/SPEC.md 9.8; plan section
// 12): for six seconds the Next line says what happened and offers Undo, and
// Undo puts back the record the tap changed, through the model, leaving
// anything else as it is. Times are the board's scenes in local time.

const TUE_1005 = '2026-11-24T10:05:00';
const TUE_0958 = '2026-11-24T09:58:00';
const TUE_1320 = '2026-11-24T13:20:00';

afterEach(unmount);

const at = (local: string) => new Date(local);
const top = (state: BenchDomains, title: string) =>
  state.tasks.find((task) => task.title === title && task.parentId === undefined)!;
const stepOf = (state: BenchDomains, title: string) =>
  state.tasks.find((task) => task.title === title && task.parentId !== undefined)!;
const id = (m: Mounted, key: string) => m.container.querySelector<HTMLElement>(`#${key}`);

function scene(
  scenario: 'example' | 'notStarted' | 'pauseLeft' | 'clockLeftRunning',
  local: string,
) {
  const now = at(local);
  return { state: loadScenario(migrateBench(emptyDomains(), now), scenario, now), now };
}

/** The scenario as waking the app would leave it: forgotten clocks closed, slots passed. */
async function woken(scenario: 'pauseLeft' | 'clockLeftRunning', local: string) {
  const m = await mount(local, scenario);
  const state = stateOf(m);
  unmount();
  return { state, now: at(local) };
}

const later = (now: Date, seconds: number) => new Date(now.getTime() + seconds * 1000);

describe('each inverse puts back what its tap changed', () => {
  it('Step done: the step is open again', () => {
    const { state, now } = scene('example', TUE_1005);
    const email = top(state, EMAIL);
    const done = act.stepDone(state, email.id, now);
    expect(stepOf(done.state, 'Write the question').doneAt).toBeDefined();
    expect(done.undo?.lines).toEqual({ line1: 'Step done', line2: 'Write the question' });
    expect(done.undo?.name).toBe('Undo step done: Write the question');
    const back = done.undo!.inverse(done.state, later(now, 3));
    expect(stepOf(back, 'Write the question').doneAt).toBeUndefined();
    expect(model.running(back.tasks)?.id).toBe(email.id);
  });

  it('Done on the last step: the step and the task open again, the clock running', () => {
    const { state, now } = scene('example', TUE_1005);
    const email = top(state, EMAIL);
    const two = act.stepDone(state, email.id, now).state;
    const done = act.stepDone(two, email.id, now);
    expect(top(done.state, EMAIL).doneAt).toBeDefined();
    expect(model.running(done.state.tasks)).toBeUndefined();
    expect(done.undo?.lines).toEqual({ line1: 'Step done', line2: 'Read it once and send' });
    const back = done.undo!.inverse(done.state, later(now, 4));
    expect(top(back, EMAIL).doneAt).toBeUndefined();
    expect(stepOf(back, 'Read it once and send').doneAt).toBeUndefined();
    expect(model.running(back.tasks)?.id).toBe(email.id);
  });

  it('Done on a task with no steps: the task opens again', () => {
    const { state, now } = scene('example', TUE_1005);
    const ink = top(state, 'Order printer ink');
    const started = act.start(state, ink.id, now).state;
    const done = act.stepDone(started, ink.id, now);
    expect(done.undo?.lines).toEqual({ line1: 'Done', line2: 'Order printer ink' });
    expect(done.undo?.name).toBe('Undo done: Order printer ink');
    const back = done.undo!.inverse(done.state, later(now, 2));
    expect(top(back, 'Order printer ink').doneAt).toBeUndefined();
    expect(model.running(back.tasks)?.id).toBe(ink.id);
  });

  it('A tick: the task is open again', () => {
    const { state, now } = scene('example', TUE_1005);
    const permit = top(state, 'Renew the parking permit');
    const ticked = act.tick(state, permit.id, now);
    expect(ticked.undo?.lines).toEqual({ line1: 'Done', line2: 'Renew the parking permit' });
    expect(ticked.undo?.name).toBe('Undo done: Renew the parking permit');
    const back = ticked.undo!.inverse(ticked.state, now);
    expect(top(back, 'Renew the parking permit').doneAt).toBeUndefined();
  });

  it('Start: the session goes as if it had never begun', () => {
    const { state, now } = scene('notStarted', TUE_0958);
    const email = top(state, EMAIL);
    const started = act.start(state, email.id, now);
    expect(started.undo?.lines).toEqual({ line1: 'Started', line2: EMAIL });
    expect(started.undo?.name).toBe(`Undo start: ${EMAIL}`);
    const back = started.undo!.inverse(started.state, later(now, 5));
    expect(top(back, EMAIL).sessions).toEqual(email.sessions);
    expect(model.running(back.tasks)).toBeUndefined();
  });

  it('Start this instead: the new session goes, and the other runs again at its step', () => {
    const { state, now } = scene('example', TUE_1005);
    const dentist = top(state, 'Call the dentist');
    const instead = act.start(state, dentist.id, now);
    expect(instead.announce).toBe(
      'Started Call the dentist. Write the school email keeps its place at step 2.',
    );
    expect(instead.undo?.lines).toEqual({
      line1: 'Started Call the dentist',
      line2: 'Write the school email at step 2',
    });
    expect(instead.undo?.name).toBe('Undo: go back to Write the school email at step 2');
    const back = instead.undo!.inverse(instead.state, later(now, 3));
    expect(top(back, 'Call the dentist').sessions).toEqual([]);
    expect(model.running(back.tasks)?.title).toBe(EMAIL);
  });

  it('Resume: paused again, with the session as it was and the mark the app made', async () => {
    const { state, now } = await woken('clockLeftRunning', TUE_1005);
    const email = top(state, EMAIL);
    expect(state.bench.closedByApp?.taskId).toBe(email.id);
    const resumed = act.resume(state, email.id, now);
    expect(resumed.state.bench.closedByApp).toBeUndefined();
    expect(resumed.undo?.lines).toEqual({ line1: 'Resumed', line2: `${EMAIL}, step 2` });
    expect(resumed.undo?.name).toBe(`Undo resume: ${EMAIL}`);
    const back = resumed.undo!.inverse(resumed.state, later(now, 4));
    expect(top(back, EMAIL).sessions).toEqual(email.sessions);
    expect(back.bench.closedByApp).toEqual(state.bench.closedByApp);
  });

  it('Set aside: the paused task is back', async () => {
    const { state, now } = await woken('pauseLeft', TUE_1320);
    const email = top(state, EMAIL);
    const aside = act.setAside(state, email.id, now);
    expect(aside.undo?.lines).toEqual({ line1: 'Set aside', line2: EMAIL });
    expect(aside.undo?.name).toBe(`Undo set aside: ${EMAIL}`);
    expect(aside.undo!.inverse(aside.state, now).bench.setAside).toBeUndefined();
  });

  it('leaves what was done since, and does nothing the second time', () => {
    const { state, now } = scene('example', TUE_1005);
    const done = act.stepDone(state, top(state, EMAIL).id, now);
    const ink = act.tick(done.state, top(state, 'Order printer ink').id, now).state;
    const back = done.undo!.inverse(ink, now);
    expect(stepOf(back, 'Write the question').doneAt).toBeUndefined();
    expect(top(back, 'Order printer ink').doneAt).toBeDefined();
    expect(done.undo!.inverse(back, now)).toEqual(back);
  });

  it('Pause and an un-tick are not offered: each is one tap from its own way back', () => {
    const { state, now } = scene('example', TUE_1005);
    expect(act.pause(state, top(state, EMAIL).id, now).undo).toBeUndefined();
    const ticked = act.tick(state, top(state, 'Order printer ink').id, now).state;
    expect(act.untick(ticked, top(state, 'Order printer ink').id).undo).toBeUndefined();
  });
});

describe('the Next line for six seconds (SPEC 9.8)', () => {
  const handle = (m: Mounted) => id(m, 'b-handle')!;

  it('says what happened over the step, with Undo where "Rest of today ⌃" was', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    expect(handle(m).querySelector('.h-l1')?.textContent).toBe('Step done');
    expect(handle(m).querySelector('.h-title')?.textContent).toBe('Write the question');
    expect(handle(m).querySelector('.h-more')).toBeNull();
    expect(nameOf(handle(m))).toBe('Step done: Write the question. Rest of today');
    expect(hintOf(handle(m))).toBe('Shows the rest of today.');
    const undo = button(m.container, 'Undo step done: Write the question');
    expect(undo.textContent).toBe('Undo');
    expect(handle(m).contains(undo)).toBe(false);
  });

  it('takes the step back, says so and what is now the case, and keeps focus in place', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    said(m);
    const undo = button(m.container, 'Undo step done: Write the question');
    undo.focus();
    undo.click();
    expect(said(m)).toBe('Undone. Now: Write the question');
    expect(stepOf(stateOf(m), 'Write the question').doneAt).toBeUndefined();
    expect(document.activeElement).toBe(handle(m));
    expect(id(m, 'b-undo')).toBeNull();
    expect(nameOf(handle(m))).toBe('Next, in 25 minutes: 10:30, Call the dentist. Rest of today');
  });

  it('puts focus on the handle though the pill never had it, as after a tap in Safari', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    (document.activeElement as HTMLElement | null)?.blur();
    press(m.container, 'Undo step done: Write the question');
    expect(id(m, 'b-undo')).toBeNull();
    expect(document.activeElement).toBe(handle(m));
  });

  it('lasts six seconds', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    vi.advanceTimersByTime(5999);
    expect(id(m, 'b-undo')).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(id(m, 'b-undo')).toBeNull();
    expect(handle(m).querySelector('.h-more')?.textContent).toBe('Rest of today');
  });

  it('is ended only by a newer undoable tap, not by other touches', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    press(m.container, 'Pause');
    press(m.container, /^Next|^Step done: Write the question\. Rest of today$/);
    press(m.container, 'Hide the rest of today');
    expect(nameOf(id(m, 'b-undo')!)).toBe('Undo step done: Write the question');
    settle(m);
    press(m.container, 'Resume');
    expect(nameOf(id(m, 'b-undo')!)).toBe(`Undo resume: ${EMAIL}`);
    expect(handle(m).querySelector('.h-title')?.textContent).toBe(`${EMAIL}, step 3`);
  });

  it('stays while the pill has focus, and goes when focus leaves it', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    const undo = id(m, 'b-undo')!;
    undo.focus();
    outlastUndo();
    vi.advanceTimersByTime(10_000);
    expect(id(m, 'b-undo')).toBe(undo);
    undo.blur();
    await Promise.resolve();
    expect(id(m, 'b-undo')).toBeNull();
  });

  it('ends when the app goes to the background', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    window.dispatchEvent(new Event('pagehide'));
    expect(id(m, 'b-undo')).toBeNull();
  });

  it('holds the drawer folded after Done, then lets it rest half', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Step done: Write the question');
    press(m.container, 'Done: Read it once and send');
    expect(visibleText(m.container)).toContain('Nothing running');
    expect(m.container.dataset['drawer']).toBe('folded');
    press(m.container, 'Undo step done: Read it once and send');
    expect(said(m)).toBe('Undone. Now: Read it once and send');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    expect(m.container.dataset['drawer']).toBe('folded');

    press(m.container, 'Done: Read it once and send');
    outlastUndo();
    expect(m.container.dataset['drawer']).toBe('half');
  });

  it('brings a task set aside back, paused', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    press(m.container, /^Set aside /);
    expect(handle(m).querySelector('.h-l1')?.textContent).toBe('Set aside');
    press(m.container, `Undo set aside: ${EMAIL}`);
    expect(said(m)).toBe('Undone. Paused: Write the question');
    expect(button(m.container, /^Paused: Write the question\./)).toBeTruthy();
  });

  it('takes back a Start, back to nothing running', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Start');
    expect(handle(m).querySelector('.h-l1')?.textContent).toBe('Started');
    press(m.container, `Undo start: ${EMAIL}`);
    expect(said(m)).toBe('Undone. Nothing running');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    expect(top(stateOf(m), EMAIL).sessions).toEqual([]);
    expect(m.container.dataset['drawer']).toBe('half');
  });

  it('after a tick in the half drawer, leaves the list where it is, its disc the way back', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Mark done: Renew the parking permit');
    expect(m.container.dataset['drawer']).toBe('half');
    expect(button(m.container, 'Undo done: Renew the parking permit')).toBeTruthy();
  });

  it('after a tick on the open drawer, shows on the Next line once it is folded', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Next, in 25 minutes/);
    press(m.container, 'Mark done: Order printer ink');
    press(m.container, 'Hide the rest of today');
    expect(handle(m).querySelector('.h-l1')?.textContent).toBe('Done');
    expect(handle(m).querySelector('.h-title')?.textContent).toBe('Order printer ink');
    // The ring's own disc and the Next line's pill name the same thing.
    press(m.container, /^Undo done: Order printer ink$/);
    expect(top(stateOf(m), 'Order printer ink').doneAt).toBeUndefined();
  });
});

describe('the tap guard (SPEC 5.1; plan section 12)', () => {
  const GREW = TAP_GUARD.morph + TAP_GUARD.afterCapsule;
  const stepDone = (m: Mounted) => press(m.container, 'Step done: Write the question');
  const questionDone = (m: Mounted) => stepOf(stateOf(m), 'Write the question').doneAt;

  it('ignores Step done for a second after Today grows out of the capsule, by a tab', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    settle(m);
    press(m.container, 'Today');
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, GREW - 1);
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    // Nothing is said and nothing moves: the tap is simply not taken.
    expect(m.container.querySelector('.live')?.textContent).toBe('');
    expect(id(m, 'b-undo')).toBeNull();
    settle(m, 1);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('does the same when the open drawer folds back into the lantern', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Next, in 25 minutes/);
    press(m.container, 'Hide the rest of today');
    press(m.container, 'Pause');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    settle(m, GREW);
    press(m.container, 'Pause');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
  });

  it('and when the Today tab folds the open drawer over a place', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    settle(m);
    press(m.container, /^Next, in 25 minutes/);
    expect(m.container.dataset['drawer']).toBe('open');
    press(m.container, 'Today');
    expect(m.container.dataset['drawer']).toBe('folded');
    settle(m, TAP_GUARD.other + 1);
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, GREW - TAP_GUARD.other - 1);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('and when back brings Today out from under Me', async () => {
    const m = await mount(TUE_1320, 'pauseLeft');
    press(m.container, 'Me');
    settle(m);
    press(m.container, 'Today');
    press(m.container, 'Resume');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    settle(m, GREW);
    press(m.container, 'Resume');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
  });

  it('ignores them for half a second after launch', async () => {
    const m = await mount(TUE_1005);
    m.mono.now = 0;
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    m.mono.now = TAP_GUARD.other - 1;
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    m.mono.now = TAP_GUARD.other;
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('for half a second when Today is reached another way: a scenario from About', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Me');
    press(m.container, 'About this prototype');
    press(m.container, 'Load the example day');
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, TAP_GUARD.other);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('never guards a change on Today itself: Start, then Step done', async () => {
    const m = await mount(TUE_0958, 'notStarted');
    press(m.container, 'Start');
    press(m.container, 'Step done: Find the school address');
    expect(stepOf(stateOf(m), 'Find the school address').doneAt).toBeDefined();
  });

  it('for half a second as Focus opens from the lit block, in the same places', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Now: Write the question\. Step 2 of 3/);
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, TAP_GUARD.other - 1);
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, 1);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('for a morph and a second as Focus grows out of the capsule', async () => {
    const m = await mount(TUE_1005);
    press(m.container, 'Tasks');
    settle(m);
    press(m.container, /^Now: Write the question, step 2 of 3/);
    press(m.container, 'Pause');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    settle(m, GREW - 1);
    press(m.container, 'Pause');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
    settle(m, 1);
    press(m.container, 'Pause');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    // Resume, in Pause's place, is not guarded by the change on the spot.
    press(m.container, 'Resume');
    expect(model.running(stateOf(m).tasks)?.title).toBe(EMAIL);
  });

  it('and for a morph and a second from the open drawer’s capsule, over Today', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Next, in 25 minutes/);
    settle(m);
    press(m.container, /^Now: Write the question, step 2 of 3/);
    settle(m, GREW - 1);
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, 1);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });

  it('for half a second when "⌄ Today" folds Focus back into the lantern', async () => {
    const m = await mount(TUE_1005);
    press(m.container, /^Now: Write the question\. Step 2 of 3/);
    settle(m);
    press(m.container, 'Back to Today');
    stepDone(m);
    expect(questionDone(m)).toBeUndefined();
    settle(m, TAP_GUARD.other);
    stepDone(m);
    expect(questionDone(m)).toBeDefined();
  });
});

describe('Undo on Focus’s foot (SPEC 5.4)', () => {
  const LIT = /^Now: Write the question\. Step 2 of 3/;
  const foot = (m: Mounted) => m.container.querySelector<HTMLElement>('.ffoot .ff-line')!;
  const handle = (m: Mounted) => id(m, 'b-handle')!;

  async function focused(local = TUE_1005, scenario: 'example' | 'pauseLeft' = 'example') {
    const m = await mount(local, scenario);
    press(m.container, scenario === 'example' ? LIT : /^Paused: Write the question\./);
    settle(m);
    return m;
  }

  it('reads the tap’s words for six seconds, with Undo at its right, then the later line', async () => {
    const m = await focused();
    press(m.container, 'Step done: Write the question');
    expect(foot(m).classList.contains('with-undo')).toBe(true);
    expect(readText(foot(m))).toBe('Step done: Write the question');
    const undo = id(m, 'b-undo')!;
    expect(undo.closest('.ffoot')).not.toBeNull();
    expect(nameOf(undo)).toBe('Undo step done: Write the question');
    vi.advanceTimersByTime(5999);
    expect(id(m, 'b-undo')).toBe(undo);
    vi.advanceTimersByTime(1);
    expect(id(m, 'b-undo')).toBeNull();
    expect(readText(foot(m))).toBe('Later today: 10:30, Call the dentist, in 25 minutes');
  });

  it('takes the step back, says so, and puts focus on the foot where the pill was', async () => {
    const m = await focused();
    press(m.container, 'Step done: Write the question');
    said(m);
    id(m, 'b-undo')!.click();
    expect(said(m)).toBe('Undone. Now: Write the question');
    expect(stepOf(stateOf(m), 'Write the question').doneAt).toBeUndefined();
    expect(id(m, 'f-step')?.textContent).toContain('Write the question');
    expect(document.activeElement).toBe(foot(m));
    expect(m.container.dataset['focus']).toBe('open');
  });

  it('stays while the pill has focus, as on the Next line', async () => {
    const m = await focused();
    press(m.container, 'Step done: Write the question');
    const undo = id(m, 'b-undo')!;
    undo.focus();
    outlastUndo();
    expect(id(m, 'b-undo')).toBe(undo);
    undo.blur();
    await Promise.resolve();
    expect(id(m, 'b-undo')).toBeNull();
  });

  it('moves to the Next line when Focus closes within the six seconds', async () => {
    const m = await focused();
    press(m.container, 'Step done: Write the question');
    press(m.container, 'Back to Today');
    expect(m.container.dataset['focus']).toBeUndefined();
    expect(handle(m).querySelector('.h-l1')?.textContent).toBe('Step done');
    expect(m.container.querySelectorAll('#b-undo')).toHaveLength(1);
    expect(id(m, 'b-undo')?.closest('.drawer')).not.toBeNull();
  });

  it('ends when the disc takes the same step back', async () => {
    const m = await focused();
    press(m.container, 'Step done: Write the question');
    id(m, 'f-disc')!.click();
    expect(stepOf(stateOf(m), 'Write the question').doneAt).toBeUndefined();
    expect(id(m, 'b-undo')).toBeNull();
    expect(readText(foot(m))).toBe('Later today: 10:30, Call the dentist, in 25 minutes');
  });

  it('after Resume pauses it again, and Focus stays', async () => {
    const m = await focused(TUE_1320, 'pauseLeft');
    press(m.container, 'Resume');
    expect(readText(foot(m))).toBe(`Resumed: ${EMAIL}, step 2`);
    press(m.container, `Undo resume: ${EMAIL}`);
    expect(said(m)).toBe('Undone. Paused: Write the question');
    expect(model.running(stateOf(m).tasks)).toBeUndefined();
    expect(m.container.dataset['focus']).toBe('open');
  });
});
