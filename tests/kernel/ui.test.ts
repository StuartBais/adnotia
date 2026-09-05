import { describe, expect, it, vi } from 'vitest';
import {
  calendar,
  card,
  chips,
  chipsMulti,
  detailRow,
  firstWeekday,
  linkRow,
  mirror,
  nag,
  numberInput,
  parentGate,
  rewardChart,
  scale5,
  textInput,
  timeInput,
  toggleDetail,
} from '../../src/kernel/index';

// See docs/07-design-system.md "Components" and docs/05-architecture.md
// "Accessibility".

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const pressed = (element: Element): string[] =>
  [...element.querySelectorAll('[aria-pressed]')].map(
    (node) => node.getAttribute('aria-pressed') ?? '',
  );

describe('chips', () => {
  const options = [
    { v: 'ontime', l: 'On time' },
    { v: 'late', l: 'Late' },
    { v: 'missed', l: 'Missed' },
  ];

  it('carries state in aria-pressed', () => {
    const control = chips({ options });
    expect(pressed(control.element)).toEqual(['false', 'false', 'false']);
    click(control.element.querySelector('.chip'));
    expect(pressed(control.element)).toEqual(['true', 'false', 'false']);
    expect(control.value()).toBe('ontime');
  });

  it('clears when the chosen chip is pressed again', () => {
    // Someone who taps by accident should not have to live with it.
    const control = chips({ options, value: 'late' });
    click(control.element.querySelectorAll('.chip')[1]);
    expect(control.value()).toBe('');
    expect(pressed(control.element)).toEqual(['false', 'false', 'false']);
  });

  it('holds one value at a time', () => {
    const control = chips({ options });
    click(control.element.querySelectorAll('.chip')[0]);
    click(control.element.querySelectorAll('.chip')[2]);
    expect(control.value()).toBe('missed');
    expect(pressed(control.element)).toEqual(['false', 'false', 'true']);
  });

  it('reports every change', () => {
    const onChange = vi.fn();
    const control = chips({ options, onChange });
    click(control.element.querySelector('.chip'));
    expect(onChange).toHaveBeenCalledWith('ontime');
  });

  it('uses the flag colour when asked', () => {
    const control = chips({ options, flag: true });
    expect(control.element.querySelector('.chip')?.className).toContain('flagchip');
  });

  it('is a labelled field when given a label', () => {
    const control = chips({ options, label: 'How did the dose go?', optional: true });
    expect(control.element.className).toBe('field');
    expect(control.element.textContent).toContain('How did the dose go?');
    expect(control.element.textContent).toContain('optional');
  });

  it('is reachable by keyboard, being real buttons', () => {
    const control = chips({ options });
    for (const chip of control.element.querySelectorAll('.chip')) {
      expect(chip.tagName).toBe('BUTTON');
      expect(chip.getAttribute('type')).toBe('button');
    }
  });
});

describe('chipsMulti', () => {
  const options = [
    { v: 'dry', l: 'Dry mouth' },
    { v: 'head', l: 'Headache' },
  ];

  it('toggles each chip independently', () => {
    const control = chipsMulti({ options });
    click(control.element.querySelectorAll('.chip')[0]);
    click(control.element.querySelectorAll('.chip')[1]);
    expect(control.value()).toEqual(['dry', 'head']);

    click(control.element.querySelectorAll('.chip')[0]);
    expect(control.value()).toEqual(['head']);
  });

  it('starts from the value it was given', () => {
    const control = chipsMulti({ options, value: ['head'] });
    expect(pressed(control.element)).toEqual(['false', 'true']);
  });
});

describe('scale5', () => {
  const anchors = ['', 'Scattered', 'Patchy', 'Mixed', 'Mostly there', 'Locked in'];

  it('offers five values', () => {
    const control = scale5({ anchors });
    expect(control.element.querySelectorAll('.scale .chip')).toHaveLength(5);
  });

  it('spells out the chosen anchor in the person’s own words', () => {
    const control = scale5({ anchors });
    click(control.element.querySelectorAll('.chip')[3]);
    expect(control.value()).toBe(4);
    expect(control.element.querySelector('.anchor')?.textContent).toBe('Mostly there');
  });

  it('announces the anchor rather than only the number', () => {
    const control = scale5({ anchors });
    expect(control.element.querySelector('.anchor')?.getAttribute('aria-live')).toBe('polite');
    expect(control.element.querySelectorAll('.chip')[0]?.getAttribute('aria-label')).toBe(
      '1: Scattered',
    );
  });

  it('clears when the chosen value is pressed again', () => {
    const control = scale5({ anchors, value: 2 });
    click(control.element.querySelectorAll('.chip')[1]);
    expect(control.value()).toBeNull();
    expect(control.element.querySelector('.anchor')?.textContent).toBe('');
  });

  it('shows the end labels beneath', () => {
    const control = scale5({ anchors });
    const ends = control.element.querySelector('.ends');
    expect(ends?.textContent).toContain('Scattered');
    expect(ends?.textContent).toContain('Locked in');
  });
});

describe('inputs', () => {
  it('are native controls', () => {
    expect((timeInput().element as HTMLInputElement).type).toBe('time');
    expect((numberInput().element as HTMLInputElement).type).toBe('number');
    expect((textInput().element as HTMLInputElement).type).toBe('text');
    expect(textInput({ multiline: true }).element.tagName).toBe('TEXTAREA');
  });

  it('report what was typed', () => {
    const onChange = vi.fn();
    const control = timeInput({ onChange });
    const input = control.element as HTMLInputElement;
    input.value = '08:30';
    input.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('08:30');
    expect(control.value()).toBe('08:30');
  });

  it('offer a numeric keypad for numbers', () => {
    expect((numberInput().element as HTMLInputElement).getAttribute('inputmode')).toBe('decimal');
  });

  it('carry an accessible name when labelled', () => {
    const control = timeInput({ label: 'When it started working' });
    expect(control.element.querySelector('input')?.getAttribute('aria-label')).toBe(
      'When it started working',
    );
  });
});

describe('the follow-up detail', () => {
  it('hides with the hidden attribute, not a style', () => {
    // Hidden by style is still announced by a screen reader.
    const detail = detailRow({ label: 'Dry mouth', children: [] });
    toggleDetail(detail, false);
    expect(detail.hidden).toBe(true);
    toggleDetail(detail, true);
    expect(detail.hidden).toBe(false);
  });

  it('takes the flag colour when asked', () => {
    expect(detailRow({ flag: true, children: [] }).className).toContain('flag');
  });
});

describe('panels', () => {
  it('builds a card with a heading and a sub', () => {
    const element = card({ title: 'Sleep', sub: '7 of 14 nights recorded' });
    expect(element.querySelector('h2')?.textContent).toBe('Sleep');
    expect(element.querySelector('.sub')?.textContent).toBe('7 of 14 nights recorded');
  });

  it('builds a link row with its action word', () => {
    const onSelect = vi.fn();
    const row = linkRow({ label: 'Baseline', value: 'Not set', onSelect });
    expect(row.textContent).toContain('Baseline');
    expect(row.querySelector('.linkrow-v')?.textContent).toBe('Not set');
    click(row);
    expect(onSelect).toHaveBeenCalled();
  });

  it('builds a nag with one action', () => {
    const onAction = vi.fn();
    const panel = nag({
      message: 'It has been a fortnight since your last backup.',
      actionLabel: 'Download a backup',
      onAction,
    });
    expect(panel.getAttribute('role')).toBe('status');
    expect(panel.querySelectorAll('button')).toHaveLength(1);
    click(panel.querySelector('button'));
    expect(onAction).toHaveBeenCalled();
  });

  it('marks the mirror as never printed', () => {
    const element = mirror('Before you go', 'For you, not for the appointment.', [
      { tag: 'Coverage', text: '11 of 14 days recorded.' },
    ]);
    expect(element.getAttribute('data-print')).toBe('never');
    expect(element.querySelectorAll('li')).toHaveLength(1);
    expect(element.textContent).toContain('11 of 14 days recorded.');
  });
});

describe('the calendar', () => {
  const now = () => new Date(2026, 8, 15, 12, 0);

  it('shows the month of the chosen day', () => {
    const control = calendar({ value: '2026-09-15', now });
    expect(control.element.querySelector('.calhead span')?.textContent).toContain('September');
    expect(control.value()).toBe('2026-09-15');
  });

  it('selects on one tap', () => {
    const onSelect = vi.fn();
    const control = calendar({ value: '2026-09-15', now, onSelect });
    const tenth = [...control.element.querySelectorAll('.calday')].find(
      (day) => day.textContent === '10',
    );
    click(tenth);
    expect(control.value()).toBe('2026-09-10');
    expect(onSelect).toHaveBeenCalledWith('2026-09-10');
  });

  it('disables days in the future', () => {
    const control = calendar({ value: '2026-09-15', now });
    const days = [...control.element.querySelectorAll('.calday')] as HTMLButtonElement[];
    const sixteenth = days.find((day) => day.textContent === '16');
    const fourteenth = days.find((day) => day.textContent === '14');
    expect(sixteenth?.disabled).toBe(true);
    expect(fourteenth?.disabled).toBe(false);
  });

  it('ignores a tap on a future day', () => {
    const onSelect = vi.fn();
    const control = calendar({ value: '2026-09-15', now, onSelect });
    const twentieth = [...control.element.querySelectorAll('.calday')].find(
      (day) => day.textContent === '20',
    );
    click(twentieth);
    expect(onSelect).not.toHaveBeenCalled();
    expect(control.value()).toBe('2026-09-15');
  });

  it('marks logged days with a dot', () => {
    const control = calendar({ value: '2026-09-15', now, logged: ['2026-09-03', '2026-09-04'] });
    expect(control.element.querySelectorAll('.calday .pip')).toHaveLength(2);
  });

  it('will not page past the current month', () => {
    const control = calendar({ value: '2026-09-15', now });
    const next = control.element.querySelector('[aria-label="Next month"]') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('pages backwards', () => {
    const control = calendar({ value: '2026-09-15', now });
    click(control.element.querySelector('[aria-label="Previous month"]'));
    expect(control.element.querySelector('.calhead span')?.textContent).toContain('August');
  });

  it('announces a month change', () => {
    const control = calendar({ value: '2026-09-15', now });
    expect(control.element.querySelector('.calhead span')?.getAttribute('aria-live')).toBe(
      'polite',
    );
  });

  it('jumps to the logging day, not the calendar day, after midnight', () => {
    // At 1am on the 16th, the day being logged is the 15th.
    const smallHours = () => new Date(2026, 8, 16, 1, 0);
    const control = calendar({ value: '2026-08-02', now: smallHours });
    click(control.element.querySelector('.caltoday'));
    expect(control.value()).toBe('2026-09-15');
  });

  it('names each day for a screen reader', () => {
    const control = calendar({ value: '2026-09-15', now, locale: 'en-GB' });
    const first = control.element.querySelector('.calday');
    expect(first?.getAttribute('aria-label')).toMatch(/September/);
  });

  it('starts the week where the locale starts it', () => {
    expect(firstWeekday('en-US')).toBe(0);
    expect(firstWeekday('en-GB')).toBe(1);
  });
});

describe('the reward chart', () => {
  it('shows points earned and nothing about points lost', () => {
    const chart = rewardChart({ nickname: 'Sam', points: 3, goal: 5 });
    expect(chart.textContent).toContain("Sam's chart");
    expect(chart.querySelector('.reward-stars')?.textContent).toBe('★★★');
    expect(chart.textContent).toContain('3 of 5 so far.');
    expect(chart.textContent).not.toMatch(/lost|left|missed|streak|keep it up/i);
  });

  it('awards only when the parent says so', () => {
    const onAward = vi.fn();
    const chart = rewardChart({ nickname: 'Sam', points: 0, onAward });
    expect(chart.querySelectorAll('button')).toHaveLength(1);
    click(chart.querySelector('button'));
    expect(onAward).toHaveBeenCalledTimes(1);
  });

  it('offers no way to remove a point', () => {
    const chart = rewardChart({ nickname: 'Sam', points: 3, onAward: () => undefined });
    const labels = [...chart.querySelectorAll('button')].map((b) => b.textContent ?? '');
    expect(labels).toEqual(['Add a star']);
  });

  it('is view-only on the handed-over surface', () => {
    const chart = rewardChart({
      nickname: 'Sam',
      points: 2,
      readOnly: true,
      onAward: () => undefined,
    });
    expect(chart.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('the parent gate', () => {
  it('opens on the right code', async () => {
    const onOpen = vi.fn();
    const gate = parentGate({ verify: (code) => code === '123456', onOpen });
    const input = gate.querySelector('input') as HTMLInputElement;
    input.value = '123456';
    click(gate.querySelector('button'));
    await Promise.resolve();
    expect(onOpen).toHaveBeenCalled();
  });

  it('says plainly when the code does not match, and blames nobody', async () => {
    const onWrong = vi.fn();
    const gate = parentGate({ verify: () => false, onOpen: () => undefined, onWrong });
    const input = gate.querySelector('input') as HTMLInputElement;
    input.value = '000000';
    click(gate.querySelector('button'));
    await Promise.resolve();
    await Promise.resolve();
    expect(onWrong).toHaveBeenCalled();
    expect(gate.querySelector('[role="status"]')?.textContent).toBe(
      'That code did not match. Try again.',
    );
  });

  it('clears the code after an attempt', async () => {
    const gate = parentGate({ verify: () => false, onOpen: () => undefined });
    const input = gate.querySelector('input') as HTMLInputElement;
    input.value = '000000';
    click(gate.querySelector('button'));
    await Promise.resolve();
    await Promise.resolve();
    expect(input.value).toBe('');
  });

  it('uses the large targets of the child surface', () => {
    const gate = parentGate({ verify: () => true, onOpen: () => undefined });
    expect(gate.className).toContain('child-surface');
  });
});
