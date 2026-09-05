// Chips: pill buttons that carry their state in aria-pressed, never in a class
// alone. See docs/07-design-system.md "Components".

import { el, field, fieldLabel, type Control } from './dom';
// The chip option shape belongs to the module contract, not to this control.
import type { ChipOption } from '../registry/types';

export interface ChipsOptions {
  label?: string;
  options: readonly ChipOption[];
  value?: string;
  optional?: boolean;
  hint?: string;
  /** Warnings and cautions use the flag colour rather than the mark. */
  flag?: boolean;
  onChange?: (value: string) => void;
}

/**
 * A single-choice chip row. Pressing the chosen chip again clears it, because a
 * person who taps something by accident should not have to live with it.
 */
export function chips(options: ChipsOptions): Control<string> {
  let current = options.value ?? '';
  const buttons = new Map<string, HTMLButtonElement>();

  const row = el('div', { class: 'chips', role: 'group' });
  if (options.label !== undefined) row.setAttribute('aria-label', options.label);

  const paint = (): void => {
    for (const [value, button] of buttons) {
      button.setAttribute('aria-pressed', value === current ? 'true' : 'false');
    }
  };

  for (const option of options.options) {
    const button = el('button', {
      type: 'button',
      class: options.flag ? 'chip flagchip' : 'chip',
      'aria-pressed': 'false',
      text: option.l,
    });
    button.addEventListener('click', () => {
      current = current === option.v ? '' : option.v;
      paint();
      options.onChange?.(current);
    });
    buttons.set(option.v, button);
    row.append(button);
  }
  paint();

  const element =
    options.label === undefined
      ? row
      : field(fieldLabel(options.label, options.optional), row, options.hint);

  return {
    element,
    value: () => current,
    set(value) {
      current = value;
      paint();
    },
  };
}

export interface ChipsMultiOptions extends Omit<ChipsOptions, 'value' | 'onChange'> {
  value?: readonly string[];
  onChange?: (value: string[]) => void;
}

/** A multiple-choice chip row. Each chip toggles independently. */
export function chipsMulti(options: ChipsMultiOptions): Control<string[]> {
  let current = new Set(options.value ?? []);
  const buttons = new Map<string, HTMLButtonElement>();

  const row = el('div', { class: 'chips', role: 'group' });
  if (options.label !== undefined) row.setAttribute('aria-label', options.label);

  const paint = (): void => {
    for (const [value, button] of buttons) {
      button.setAttribute('aria-pressed', current.has(value) ? 'true' : 'false');
    }
  };

  for (const option of options.options) {
    const button = el('button', {
      type: 'button',
      class: options.flag ? 'chip flagchip' : 'chip',
      'aria-pressed': 'false',
      text: option.l,
    });
    button.addEventListener('click', () => {
      if (current.has(option.v)) current.delete(option.v);
      else current.add(option.v);
      paint();
      options.onChange?.([...current]);
    });
    buttons.set(option.v, button);
    row.append(button);
  }
  paint();

  const element =
    options.label === undefined
      ? row
      : field(fieldLabel(options.label, options.optional), row, options.hint);

  return {
    element,
    value: () => [...current],
    set(value) {
      current = new Set(value);
      paint();
    },
  };
}
