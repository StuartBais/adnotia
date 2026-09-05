// A list of times, for a prescription taken more than once a day.
//
// See docs/decisions/ADR-011-time-list-field.md. Empty and malformed rows are
// dropped and the list is kept in clock order, so a reader never has to sort or
// filter what it is given.

import { isClockTime, toMinutes } from '../dates/index';
import { el, field, fieldLabel, type Control } from './dom';

export interface TimeListOptions {
  label?: string;
  value?: readonly string[];
  optional?: boolean;
  hint?: string;
  /** What the button offering another row says. */
  addLabel?: string;
  onChange?: (value: string[]) => void;
}

/** Drop the blanks and the malformed, then put them in clock order. */
export function tidy(times: readonly string[]): string[] {
  return times
    .filter((time) => isClockTime(time))
    .sort((a, b) => (toMinutes(a) ?? 0) - (toMinutes(b) ?? 0));
}

export function timeList(options: TimeListOptions = {}): Control<string[]> {
  // The working list keeps blank rows, so a half-typed row does not vanish
  // under the person while they are typing it.
  let rows: string[] = [...(options.value ?? [])];
  if (rows.length === 0) rows = [''];

  const list = el('div', { class: 'timelist' });
  const add = el('button', {
    type: 'button',
    class: 'btn small',
    text: options.addLabel ?? 'Add another time',
  });

  function report(): void {
    options.onChange?.(tidy(rows));
  }

  function paint(): void {
    list.replaceChildren();

    rows.forEach((time, index) => {
      const input = el('input', { type: 'time' });
      input.value = time;
      input.setAttribute('aria-label', `${options.label ?? 'Time'} ${index + 1} of ${rows.length}`);
      input.addEventListener('input', () => {
        rows[index] = input.value;
        report();
      });

      const row = el('div', { class: 'timerow' }, [input]);

      // The last remaining row has no remove button: a prescription with no
      // time at all is not a state worth being able to reach by accident.
      if (rows.length > 1) {
        const remove = el('button', {
          type: 'button',
          class: 'xbtn',
          'aria-label': `Remove the time ${time === '' ? index + 1 : time}`,
          text: '×',
        });
        remove.addEventListener('click', () => {
          rows.splice(index, 1);
          paint();
          report();
        });
        row.append(remove);
      }

      list.append(row);
    });
  }

  add.addEventListener('click', () => {
    rows.push('');
    paint();
  });

  paint();
  const group = el('div', {}, [list, add]);

  const element =
    options.label === undefined
      ? group
      : field(fieldLabel(options.label, options.optional), group, options.hint);

  return {
    element,
    value: () => tidy(rows),
    set(value) {
      rows = value.length === 0 ? [''] : [...value];
      paint();
    },
  };
}
