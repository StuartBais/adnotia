import { describe, expect, it, vi } from 'vitest';
import { tidy, timeList } from '../../src/kernel/index';

// See docs/decisions/ADR-011-time-list-field.md.

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const type = (input: Element, value: string): void => {
  (input as HTMLInputElement).value = value;
  input.dispatchEvent(new Event('input'));
};

describe('tidy', () => {
  it('drops blanks and malformed entries', () => {
    expect(tidy(['08:00', '', '13:00', 'nonsense', '25:00'])).toEqual(['08:00', '13:00']);
  });

  it('puts times in clock order', () => {
    expect(tidy(['13:00', '08:00', '20:30'])).toEqual(['08:00', '13:00', '20:30']);
  });

  it('leaves an empty list empty', () => {
    expect(tidy([])).toEqual([]);
    expect(tidy(['', ''])).toEqual([]);
  });
});

describe('the time list control', () => {
  it('starts with one empty row', () => {
    const control = timeList();
    expect(control.element.querySelectorAll('input[type="time"]')).toHaveLength(1);
    expect(control.value()).toEqual([]);
  });

  it('shows the times it was given', () => {
    const control = timeList({ value: ['08:00', '13:00'] });
    const inputs = control.element.querySelectorAll('input[type="time"]');
    expect(inputs).toHaveLength(2);
    expect((inputs[0] as HTMLInputElement).value).toBe('08:00');
    expect(control.value()).toEqual(['08:00', '13:00']);
  });

  it('adds a row when asked', () => {
    const control = timeList({ value: ['08:00'] });
    click([...control.element.querySelectorAll('button')].find((b) => b.textContent?.includes('Add')));
    expect(control.element.querySelectorAll('input[type="time"]')).toHaveLength(2);
  });

  it('reports a tidied list as it is typed', () => {
    const onChange = vi.fn();
    const control = timeList({ value: ['13:00'], onChange });
    click([...control.element.querySelectorAll('button')].find((b) => b.textContent?.includes('Add')));
    type(control.element.querySelectorAll('input[type="time"]')[1] as Element, '08:00');
    // Reported in clock order, not the order they were typed.
    expect(onChange).toHaveBeenLastCalledWith(['08:00', '13:00']);
  });

  it('keeps a half-typed row rather than dropping it under the person', () => {
    const control = timeList({ value: ['08:00'] });
    click([...control.element.querySelectorAll('button')].find((b) => b.textContent?.includes('Add')));
    // The blank row stays on screen even though it is not in the value.
    expect(control.element.querySelectorAll('input[type="time"]')).toHaveLength(2);
    expect(control.value()).toEqual(['08:00']);
  });

  it('removes a row', () => {
    const control = timeList({ value: ['08:00', '13:00'] });
    click(control.element.querySelector('.xbtn'));
    expect(control.value()).toEqual(['13:00']);
  });

  it('will not let the last row be removed', () => {
    // A prescription with no time at all is not worth being able to reach by accident.
    const control = timeList({ value: ['08:00'] });
    expect(control.element.querySelector('.xbtn')).toBeNull();
  });

  it('names each row for a screen reader', () => {
    const control = timeList({ label: 'When you take it', value: ['08:00', '13:00'] });
    const first = control.element.querySelector('input[type="time"]');
    expect(first?.getAttribute('aria-label')).toBe('When you take it 1 of 2');
  });

  it('can be set from outside', () => {
    const control = timeList({ value: ['08:00'] });
    control.set(['09:00', '14:00']);
    expect(control.value()).toEqual(['09:00', '14:00']);
    expect(control.element.querySelectorAll('input[type="time"]')).toHaveLength(2);
  });
});
