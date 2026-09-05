// The follow-up block.
//
// Revealed by a chip and never shown unconditionally: followUp is the only way
// a module may ask for detail. See docs/01-module-contract.md and
// docs/07-design-system.md "Components".

import { el } from './dom';

export interface DetailRowOptions {
  /** A line naming what this detail is about, in the person's own words. */
  label?: string;
  /** Warnings take the flag colour; everything else takes the mark. */
  flag?: boolean;
  children: (Node | string)[];
}

export function detailRow(options: DetailRowOptions): HTMLElement {
  const block = el('div', { class: options.flag ? 'detail flag' : 'detail' });
  if (options.label !== undefined) {
    block.append(el('div', { class: 'dl', text: options.label }));
  }
  block.append(...options.children);
  return block;
}

/**
 * Show or hide a follow-up. Hidden with the `hidden` attribute rather than a
 * style, so nothing about it reaches assistive technology while it is away.
 */
export function toggleDetail(detail: HTMLElement, shown: boolean): void {
  detail.hidden = !shown;
}
