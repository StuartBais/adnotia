import { describe, expect, it } from 'vitest';
import * as model from '../../src/domains/tasks';
import { emptyDomains } from '../../src/kernel/store';
import { EMAIL } from '../../src/bench/example';
import { capsule, offersName } from '../../src/bench/capsule';
import { loadScenario, migrateBench, type BenchDomains } from '../../src/bench/state';
import type { ScenarioId } from '../../src/bench/example';
import { presentLive, presentView } from '../../src/bench/view';

// The Now capsule in every state of SPEC 4's table, as a component: the
// lantern at its smallest, in the lantern's order. Routine steps wait for the
// routines chunk (plan section 19, chunk 8).

const TUE_1005 = new Date('2026-11-24T10:05:00');
const TUE_1320 = new Date('2026-11-24T13:20:00');

const scene = (id: ScenarioId, now: Date): BenchDomains =>
  loadScenario(migrateBench(emptyDomains(), now), id, now);
const emailOf = (state: BenchDomains) =>
  state.tasks.find((task) => task.title === EMAIL && task.parentId === undefined)!;

function draw(state: BenchDomains, now: Date, mode: 'button' | 'picture' = 'button') {
  const view = presentView(state, now)!;
  const live = presentLive(view, now, false);
  return { view, live, built: capsule({ view, live, look: 'lifted', mode, hintId: 'hint' }) };
}

const line1 = (el: HTMLElement) => el.querySelector('.c1')?.textContent;
const line2 = (el: HTMLElement) => el.querySelector('.c2')?.textContent;
const barOf = (el: HTMLElement) => el.querySelector('.bar')?.className;

describe('the Now capsule (SPEC 4 "States")', () => {
  it('running: Now and the step, the burning bar, the minutes and the name', () => {
    const { built } = draw(scene('example', TUE_1005), TUE_1005);
    const el = built.el;
    expect(el.tagName).toBe('BUTTON');
    expect(el.className).toBe('capsule lift');
    expect(line1(el)).toBe('NowWrite the question');
    expect(barOf(el)).toBe('bar bar-capsule is-burn');
    expect(line2(el)).toBe('18 min left·Write the school email');
    expect(el.querySelector('.c2 b')?.className).toBe('');
    expect(el.getAttribute('aria-label')).toBe(
      'Now: Write the question, step 2 of 3 of Write the school email. 18 of 25 minutes left, ends 10:23.',
    );
    expect(el.getAttribute('aria-describedby')).toBe('hint');
    // What it shows is read through its label.
    expect(el.querySelector('.c1')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.c2')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('estimate used up: the outline, the minutes so far, the estimate spoken', () => {
    const later = new Date('2026-11-24T10:25:00');
    const { built } = draw(scene('example', TUE_1005), later);
    expect(barOf(built.el)).toBe('bar bar-capsule is-over');
    expect(built.el.querySelector('.c2 b')?.textContent).toBe('27 min so far');
    expect(built.el.getAttribute('aria-label')).toMatch(/27 minutes so far, estimate 25\.$/);
  });

  it('no estimate: a length that grows, and the minutes so far', () => {
    const base = scene('example', TUE_1005);
    const state = { ...base, tasks: model.setEstimate(base.tasks, emailOf(base).id, undefined) };
    const { built } = draw(state, TUE_1005);
    expect(barOf(built.el)).toBe('bar bar-capsule is-countUp');
    expect(line2(built.el)).toBe('7 min so far·Write the school email');
  });

  it('paused: the word where Now was, the bar frozen in ash, the minutes in white', () => {
    const { built } = draw(scene('pauseLeft', TUE_1320), TUE_1320);
    expect(built.el.querySelector('.ptag')?.textContent).toBe('Paused');
    expect(line1(built.el)).toBe('PausedWrite the question');
    expect(barOf(built.el)).toBe('bar bar-capsule is-paused is-frozen');
    expect(built.el.querySelector('.c2 b')?.className).toBe('still');
    expect(line2(built.el)).toBe('18 min left·Write the school email');
    expect(built.el.getAttribute('aria-label')).toMatch(/^Paused: Write the question,/);
  });

  it('paused with the estimate used up: "estimate 25" in white, and the name gives way', () => {
    const { view, live, built } = draw(scene('clockLeftRunning', TUE_1005), TUE_1005);
    expect(offersName(view, live)).toBe(false);
    expect(line2(built.el)).toBe('estimate 25');
    expect(built.el.querySelector('.c2 b')?.className).toBe('still');
    expect(barOf(built.el)).toBe('bar bar-capsule is-over is-frozen');
  });

  it('a task with no steps: its title on line 1, the minutes alone on line 2', () => {
    const base = scene('notStarted', TUE_1005);
    const permit = base.tasks.find((task) => task.title === 'Renew the parking permit')!;
    let tasks = model.setEstimate(base.tasks, permit.id, 25);
    tasks = model.startWork(tasks, permit.id, new Date('2026-11-24T09:58:00'));
    const { built } = draw({ ...base, tasks }, TUE_1005);
    expect(line1(built.el)).toBe('NowRenew the parking permit');
    expect(line2(built.el)).toBe('18 min left');
  });

  it('as a picture on a sheet’s edge: not a button, not read, not reachable', () => {
    const { built } = draw(scene('example', TUE_1005), TUE_1005, 'picture');
    expect(built.el.tagName).toBe('DIV');
    expect(built.el.getAttribute('aria-hidden')).toBe('true');
    expect(built.el.hasAttribute('inert')).toBe(true);
    expect(built.el.getAttribute('tabindex')).toBe('-1');
    expect(built.el.hasAttribute('aria-label')).toBe(false);
  });

  it('plain charcoal on white and on the stone drawer', () => {
    const state = scene('example', TUE_1005);
    const view = presentView(state, TUE_1005)!;
    const live = presentLive(view, TUE_1005, false);
    expect(capsule({ view, live, look: 'plain', mode: 'button' }).el.className).toBe('capsule');
  });

  it('moves its minutes, its bar and its label in place', () => {
    const state = scene('example', TUE_1005);
    const { view, built } = draw(state, TUE_1005);
    const minute = new Date('2026-11-24T10:06:00');
    built.patch(presentLive(view, minute, false));
    expect(built.el.querySelector('.c2 b')?.textContent).toBe('17 min left');
    expect(built.el.getAttribute('aria-label')).toContain('17 of 25 minutes left, ends 10:23.');
    expect(built.el.querySelector<HTMLElement>('.bar')?.style.getPropertyValue('--p')).toBe('0.68');
  });
});
