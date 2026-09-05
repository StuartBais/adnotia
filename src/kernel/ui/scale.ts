// The five-point scale.
//
// Five equal chips, end labels beneath, and the chosen anchor spelled out in the
// person's own words. Tapping the selected value clears it.
// See docs/07-design-system.md "Components".

import { el, field, fieldLabel, type Control } from './dom';

export interface Scale5Options {
  label?: string;
  /** Six strings; index 1–5 are used, so anchors[value] reads directly. */
  anchors: readonly string[];
  value?: number | null;
  optional?: boolean;
  hint?: string;
  onChange?: (value: number | null) => void;
}

export function scale5(options: Scale5Options): Control<number | null> {
  let current = options.value ?? null;
  const buttons: HTMLButtonElement[] = [];

  const row = el('div', { class: 'scale', role: 'group' });
  if (options.label !== undefined) row.setAttribute('aria-label', options.label);

  // The chosen anchor. A live region so a screen reader hears the words, not
  // just the number, and it reserves its line so the layout does not jump.
  const anchor = el('p', { class: 'anchor', 'aria-live': 'polite' });

  const paint = (): void => {
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', index + 1 === current ? 'true' : 'false');
    });
    anchor.textContent = current === null ? '' : (options.anchors[current] ?? '');
  };

  for (let value = 1; value <= 5; value++) {
    const button = el('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': 'false',
      'aria-label': `${value}: ${options.anchors[value] ?? ''}`,
      text: String(value),
    });
    button.addEventListener('click', () => {
      current = current === value ? null : value;
      paint();
      options.onChange?.(current);
    });
    buttons.push(button);
    row.append(button);
  }

  const ends = el('div', { class: 'ends' }, [
    el('span', { text: options.anchors[1] ?? '' }),
    el('span', { text: options.anchors[5] ?? '' }),
  ]);

  const group = el('div', {}, [row, ends, anchor]);
  paint();

  const element =
    options.label === undefined
      ? group
      : field(fieldLabel(options.label, options.optional), group, options.hint);

  return {
    element,
    value: () => current,
    set(value) {
      current = value;
      paint();
    },
  };
}
