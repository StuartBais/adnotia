// A stretch on one thing, then a break, then another.
//
// The fifth tool, and the one that needed an ADR before it could be written.
// docs/03-scope.md excludes "streaks, badges, points" outright and CLAUDE.md
// makes that a hard rule, and the cycle this implements — a longer break after
// every fourth stretch — cannot work without knowing which stretch it is on.
//
// What makes that lawful is written in ADR-038 and enforced here in three ways,
// all of which are load-bearing:
//
//   1. `done` is a variable in this closure. It is never written to the slice,
//      so it dies with the page and there is nothing to compare tomorrow with.
//   2. It is taken modulo the cycle length the moment it is read, so the only
//      number that exists is a position between 0 and 3. It cannot grow, so it
//      cannot become a total.
//   3. Nothing it drives is phrased as attainment. FOCUS_STRINGS says what comes
//      next — "a longer break after this one" — and there is no wording in the
//      module for what has been finished.
//
// The sessions that *are* kept describe time spent, the way the mindfulness log
// describes a practice: "20 minutes on ring the surgery". Stopping half way
// records the minutes that happened rather than nothing, deliberately — a tool
// that only records finished rounds has made finishing the thing that counts.

import {
  el,
  chips,
  numberInput,
  textInput,
  timer,
  type Tool,
  type ToolContext,
  type TimerControl,
} from '../../kernel/index';
import { FOCUS_STRINGS } from './strings';
import {
  focusTargets,
  longBreakAfter,
  newId,
  recordFocus,
  type FocusSession,
  type FocusTarget,
  type PlanningSlice,
} from './state';

interface Lengths {
  focus: number;
  rest: number;
  long: number;
  every: number;
}

/** The familiar lengths, and nothing more authoritative than that. */
const DEFAULTS: Lengths = { focus: 25, rest: 5, long: 15, every: 4 };

/** Long enough to be a stretch, short enough to be honest about. */
const LIMITS = { min: 1, max: 180 } as const;

type Phase = 'idle' | 'focus' | 'rest';

function sliceOf(context: ToolContext): PlanningSlice {
  return { version: 1, ...(context.slice as PlanningSlice | undefined) };
}

function clamp(value: string, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(LIMITS.max, Math.max(LIMITS.min, n));
}

function minuteWord(minutes: number): string {
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

function mount(container: HTMLElement, context: ToolContext): void {
  /**
   * Focus stretches finished in this sitting.
   *
   * Not in the slice. See the header: this is the number that would be points if
   * it were kept, and the only thing it is ever asked is `done % every`.
   */
  let done = 0;
  let phase: Phase = 'idle';
  let clock: TimerControl | undefined;
  /** The target when the current stretch began, so renaming mid-stretch is fine. */
  let running: FocusTarget | undefined;
  let freeText = '';
  let chosen = '';

  const status = el('p', { class: 'bmsg', role: 'status' });
  const next = el('p', { class: 'hint' });
  const face = el('div', {});
  const acts = el('div', { class: 'btnrow' });
  const history = el('div', {});

  const settings = {
    focus: numberInput({ label: FOCUS_STRINGS.focusLength }),
    rest: numberInput({ label: FOCUS_STRINGS.breakLength }),
    long: numberInput({ label: FOCUS_STRINGS.longLength }),
    every: numberInput({ label: FOCUS_STRINGS.rounds }),
  };
  settings.focus.set(String(DEFAULTS.focus));
  settings.rest.set(String(DEFAULTS.rest));
  settings.long.set(String(DEFAULTS.long));
  settings.every.set(String(DEFAULTS.every));

  const lengths = (): Lengths => ({
    focus: clamp(settings.focus.value(), DEFAULTS.focus),
    rest: clamp(settings.rest.value(), DEFAULTS.rest),
    long: clamp(settings.long.value(), DEFAULTS.long),
    every: clamp(settings.every.value(), DEFAULTS.every),
  });

  const free = textInput({
    label: FOCUS_STRINGS.free,
    placeholder: FOCUS_STRINGS.freePlaceholder,
  });
  free.element.hidden = true;

  function targets(): FocusTarget[] {
    return focusTargets(sliceOf(context));
  }

  /** What the current stretch is on, as a line rather than an id. */
  function currentTarget(): FocusTarget | undefined {
    if (chosen === '') return undefined;
    return targets().find((target) => target.key === chosen);
  }

  function label(target: FocusTarget | undefined): string {
    return target?.label ?? (freeText === '' ? '' : freeText);
  }

  // ------------------------------------------------------------ keeping a stretch

  /**
   * Write down the minutes that happened.
   *
   * Called when a stretch runs out and when somebody stops one early, with the
   * minutes that actually passed. Under a minute is not a stretch and is not
   * kept; it is also not a failure, and nothing says anything about it.
   */
  function keep(minutes: number): void {
    if (minutes < 1) return;
    const target = running;
    const text = label(target);
    const session: FocusSession = {
      id: newId(),
      minutes,
      label: text,
      ...(target?.taskId === undefined ? {} : { taskId: target.taskId }),
      ...(target?.stepId === undefined ? {} : { stepId: target.stepId }),
    };
    context.save(recordFocus(sliceOf(context), context.today, session));
    status.textContent =
      text === '' ? FOCUS_STRINGS.keptNothing(minutes) : FOCUS_STRINGS.kept(minutes, text);
    paintHistory();
  }

  /** Minutes elapsed on the running clock, rounded down. */
  function elapsed(total: number): number {
    return Math.floor((total * 60 - (clock?.remaining() ?? total * 60)) / 60);
  }

  // ------------------------------------------------------------------- the cycle

  function begin(kind: Phase, autoStart: boolean): void {
    clock?.destroy();
    const times = lengths();
    phase = kind;

    if (kind === 'focus') running = currentTarget();
    // `done` has already been incremented by the stretch that just ended, so
    // this asks where the *next* break falls, which is the only thing the
    // position is ever used for.
    const isLong = kind === 'rest' && longBreakAfter(done, times.every);
    const minutes = kind === 'focus' ? times.focus : isLong ? times.long : times.rest;

    clock = timer({
      seconds: minutes * 60,
      label: kind === 'focus' ? FOCUS_STRINGS.title : FOCUS_STRINGS.onBreak,
      doneText: kind === 'focus' ? FOCUS_STRINGS.timeUp : FOCUS_STRINGS.breakOver,
      onFinish: () => {
        if (kind === 'focus') {
          keep(minutes);
          done += 1;
          // Automatic, because a cycle that needs pressing is not a cycle. It
          // starts a clock; it does not stop anybody working. There is no sound
          // and no notification in this build, so nothing here can interrupt.
          begin('rest', true);
        } else {
          begin('focus', true);
        }
      },
    });

    face.replaceChildren(clock.element);
    if (autoStart) clock.start();
    paintPhase();
  }

  function paintPhase(): void {
    const times = lengths();
    const target = phase === 'focus' ? running : currentTarget();
    const text = label(target);

    if (phase === 'idle') {
      next.textContent = '';
    } else if (phase === 'rest') {
      next.textContent = '';
    } else {
      // Where the next break falls. Never how many have been done.
      next.textContent = longBreakAfter(done + 1, times.every)
        ? FOCUS_STRINGS.nextIsLong
        : FOCUS_STRINGS.nextIsShort;
    }

    if (phase === 'focus') {
      status.textContent =
        text === '' ? FOCUS_STRINGS.focusingNothing : FOCUS_STRINGS.focusing(text);
    } else if (phase === 'rest') {
      status.textContent = FOCUS_STRINGS.onBreak;
    }

    acts.replaceChildren();
    if (phase === 'rest') {
      const on = el('button', { type: 'button', class: 'btn', text: FOCUS_STRINGS.skipBreak });
      on.addEventListener('click', () => begin('focus', true));
      acts.append(on);
    }
    if (phase !== 'idle') {
      const stop = el('button', { type: 'button', class: 'btn small', text: FOCUS_STRINGS.stop });
      stop.addEventListener('click', () => {
        const times2 = lengths();
        if (phase === 'focus') keep(elapsed(times2.focus));
        // The sitting is over, so the position in the cycle goes with it.
        done = 0;
        idle();
      });
      acts.append(stop);
    }
  }

  /** Nothing running: the chooser, and one button that starts a stretch. */
  function idle(): void {
    clock?.destroy();
    clock = undefined;
    phase = 'idle';
    running = undefined;

    const start = el('button', {
      type: 'button',
      class: 'btn primary',
      text: FOCUS_STRINGS.begin,
    });
    start.addEventListener('click', () => begin('focus', true));
    face.replaceChildren(start);

    next.textContent = '';
    status.textContent = '';
    paintPhase();
  }

  // ------------------------------------------------------------------- what today

  function paintHistory(): void {
    const day = sliceOf(context).days?.[context.today];
    const sessions = day?.focus ?? [];
    history.replaceChildren();
    if (sessions.length === 0) {
      history.append(el('p', { class: 'hint', text: FOCUS_STRINGS.nothing }));
      return;
    }
    // A list, in the order they happened. Not a total: see the header.
    const list = el('ul', { class: 'plain' });
    for (const session of sessions) {
      list.append(
        el('li', {
          text:
            session.label === ''
              ? minuteWord(session.minutes)
              : `${minuteWord(session.minutes)} on ${session.label}`,
        }),
      );
    }
    history.append(list);
  }

  // ------------------------------------------------------------------- the picker

  const options = targets().map((target) => ({ v: target.key, l: target.label }));
  const choose = chips({
    label: FOCUS_STRINGS.what,
    options: [...options, { v: 'free', l: FOCUS_STRINGS.free }],
    value: '',
    optional: true,
    onChange: (value) => {
      free.element.hidden = value !== 'free';
      chosen = value === 'free' ? '' : value;
      if (value !== 'free') free.set('');
      freeText = '';
      paintPhase();
    },
  });

  free.element.addEventListener('input', () => {
    freeText = free.value().trim();
  });

  const lengthFields = el('details', { class: 'more' }, [
    el('summary', { text: FOCUS_STRINGS.lengths }),
    settings.focus.element,
    settings.rest.element,
    settings.long.element,
    settings.every.element,
  ]);

  container.append(
    el('p', { class: 'sub', text: FOCUS_STRINGS.sub }),
    choose.element,
    free.element,
    // Visible, not folded away behind the disclosure it introduces. It is the
    // one claim on this screen that the tier wording above does not already
    // make, and a three-line <summary> is a sentence nobody opens.
    el('p', { class: 'hint', text: FOCUS_STRINGS.convention }),
    lengthFields,
    face,
    status,
    next,
    acts,
    el('p', { class: 'hint', text: FOCUS_STRINGS.noSound }),
    history,
  );

  idle();
  paintHistory();
}

export const focusTool: Tool = {
  title: FOCUS_STRINGS.title,
  icon: 'clock',
  // docs/02-evidence-rubric.md: "Focus timers, body doubling | C | Widely used;
  // mechanistically sensible (externalised time, reduced initiation cost); no
  // direct trials." Applied, not assigned — the same move ADR-025 made for the
  // other two Tier C tools in this module.
  tier: 'C',
  mount: (container, kernel) => mount(container, kernel as ToolContext),
};
