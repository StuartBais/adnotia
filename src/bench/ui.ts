// The prototype's small pieces (design/lantern/SPEC.md section 9): an element
// builder, the icon set, the bar, duration tracks and the separator. Plain
// DOM, no framework: the prototype is deciding nothing about how the phone
// apps are built.

import { ICONS, SPRITE, type IconName } from './icons';
import type { BarState } from './state';

type Child = Node | string | number | false | null | undefined;
type Attrs = Record<string, unknown>;

export function h(tag: string, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [name, set] of Object.entries(value as Record<string, string>)) {
        node.style.setProperty(name, set);
      }
    } else if (key.startsWith('on') && typeof value === 'function')
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    else if (key === 'value' && node instanceof HTMLInputElement) node.value = String(value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    node.append(typeof child === 'number' ? String(child) : child);
  }
  return node;
}

// ---------------------------------------------------------------- icons

/** Puts the icon set into `root` once, hidden, so every <use> can find it. */
export function injectSprite(root: HTMLElement): void {
  if (root.ownerDocument.getElementById('i-check')) return;
  const holder = document.createElement('div');
  holder.innerHTML = SPRITE;
  const sprite = holder.firstElementChild;
  if (sprite) root.prepend(sprite);
}

/**
 * One icon from the set. Hidden from screen readers, because every icon in
 * the prototype stands beside a word or inside a control that has a name.
 */
export function icon(name: IconName, size: 12 | 16 | 18 | 20 | 24 | 28 = 24): Element {
  if (!ICONS.includes(name)) throw new RangeError(`No icon ${name}`);
  // Parsed rather than built with createElementNS, so the SVG namespace is
  // the parser's and the prototype's code names no address.
  const holder = document.createElement('span');
  holder.innerHTML = `<svg class="i i${size}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  return holder.firstElementChild!;
}

// ---------------------------------------------------------------- text

/** The one separator: "·" with a word space and 0.3em either side (SPEC 5.8). */
export function sep(): HTMLElement {
  return h('span', { class: 'sep', 'aria-hidden': 'true' }, '·');
}

/** "of 25 · ends 10:23" with its separators drawn as the board draws them. */
export function dottedNodes(text: string): (Node | string)[] {
  const parts = text.split(' · ');
  return parts.flatMap((part, index) => (index === 0 ? [part] : [' ', sep(), ' ', part]));
}

/** Text a screen reader reads that the screen does not show. */
export function spoken(text: string): HTMLElement {
  return h('span', { class: 'vh', text });
}

// ---------------------------------------------------------------- the bar

export type BarSize = 'today' | 'focus' | 'page' | 'capsule';

export interface BarLook {
  state: BarState;
  /** The fill, 0 to 1. */
  p: number;
  /** Nothing burns: paused, or a count-up that stopped. */
  frozen: boolean;
}

/**
 * The bar (SPEC 9.2): a rounded ash-30 track with a terracotta fill that
 * burns down toward the leading edge, a white tick at the end of the fill,
 * and an ash end cap. Paused, the fill is ash and the tick goes; used up, the
 * track is a 1 pt outline with nothing inside; with no estimate, a terracotta
 * length grows from the leading edge with no track, tick or cap.
 */
export function bar(size: BarSize, look: BarLook): HTMLElement {
  const node = h(
    'span',
    { class: 'bar', 'aria-hidden': 'true' },
    h('i', { class: 'fill' }),
    h('i', { class: 'end' }),
  );
  patchBar(node, size, look);
  return node;
}

/** Brings a bar to `look` in place: the ticker's way of moving it. */
export function patchBar(node: HTMLElement, size: BarSize, look: BarLook): void {
  const className = ['bar', `bar-${size}`, `is-${look.state}`, look.frozen ? 'is-frozen' : '']
    .filter(Boolean)
    .join(' ');
  if (node.className !== className) node.className = className;
  const p = String(Math.round(look.p * 10000) / 10000);
  if (node.style.getPropertyValue('--p') !== p) node.style.setProperty('--p', p);
}

// ---------------------------------------------------------------- durations

/** A duration track's length: 1.5 pt a minute, stopping at 90 (an hour). */
export const trackLength = (minutes: number): number => Math.min(Math.max(0, minutes) * 1.5, 90);

/**
 * A duration in a list (SPEC 9.2): the number, then one short track as long
 * as the time it stands for. In a column of timed rows each track sits in a
 * slot as long as the longest in the list, so every number ends on one line.
 */
export function durationTrack(minutes: number, text: string, slot?: number): HTMLElement {
  const length = trackLength(minutes);
  const style: Record<string, string> = { width: `${length}px` };
  if (slot !== undefined) style['margin-right'] = `${Math.max(0, slot - length)}px`;
  return h('span', { class: 'dur' }, text, h('span', { class: 'm', 'aria-hidden': 'true', style }));
}

// ---------------------------------------------------------------- the Bookmark round

// Kept only until the Bookmark screens are replaced, which use them.
/** The notched bookmark that holds a person's step. */
export function bookmark(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'bookmark', 'aria-hidden': 'true' },
    h('small', { text: label }),
    h('b', { text: value }),
  );
}

/**
 * Minutes as marks as well as a number: a thick mark for each minute left, a
 * low one for each gone. Above sixty minutes, one mark stands for several.
 */
export function tally(left: number, total: number): HTMLElement {
  const per = Math.max(1, Math.ceil(total / 60));
  const marks = Math.ceil(total / per);
  const remaining = Math.max(0, Math.min(marks, Math.ceil(left / per)));
  const label = `${Math.max(0, Math.ceil(left))} of ${total} minutes left`;
  const node = h('div', { class: 'tally', role: 'img', 'aria-label': label });
  for (let i = 0; i < marks; i++) node.append(h('i', { class: i < remaining ? '' : 'gone' }));
  return node;
}

export const two = (n: number): string => String(n).padStart(2, '0');
