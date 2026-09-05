// Cards, link rows, the nag and the mirror.

import { el } from './dom';

export interface CardOptions {
  title?: string;
  /** The line under the heading. Plain, never alarmed. */
  sub?: string;
  children?: (Node | string)[];
}

export function card(options: CardOptions = {}): HTMLElement {
  const section = el('section', { class: 'card' });
  if (options.title !== undefined) section.append(el('h2', { text: options.title }));
  if (options.sub !== undefined) section.append(el('p', { class: 'sub', text: options.sub }));
  section.append(...(options.children ?? []));
  return section;
}

export interface LinkRowOptions {
  label: string;
  /** The status or action word on the right, in the mark colour. */
  value?: string;
  onSelect?: () => void;
}

/** A full-width row leading to an off-tab page. */
export function linkRow(options: LinkRowOptions): HTMLButtonElement {
  const button = el('button', { type: 'button', class: 'linkrow' }, [
    el('span', { text: options.label }),
  ]);
  if (options.value !== undefined) {
    button.append(el('span', { class: 'linkrow-v', text: options.value }));
  }
  if (options.onSelect) button.addEventListener('click', options.onSelect);
  return button;
}

export interface NagOptions {
  /** Plain language, no alarm. A gap is a fact to show, never a failure. */
  message: string;
  actionLabel: string;
  onAction: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
}

/**
 * One panel, one action. The kernel decides whether to show it at all: at most
 * once per fourteen days per topic. This only draws it.
 */
export function nag(options: NagOptions): HTMLElement {
  const panel = el('div', { class: 'nag', role: 'status' }, [
    el('p', { text: options.message, style: 'margin:0' }),
  ]);
  const row = el('div', { class: 'btnrow' }, [
    el('button', { type: 'button', class: 'btn small primary', text: options.actionLabel }),
  ]);
  row.firstElementChild?.addEventListener('click', options.onAction);

  if (options.dismissLabel !== undefined && options.onDismiss) {
    const dismiss = el('button', {
      type: 'button',
      class: 'btn small',
      text: options.dismissLabel,
    });
    dismiss.addEventListener('click', options.onDismiss);
    row.append(dismiss);
  }
  panel.append(row);
  return panel;
}

export interface MirrorObservation {
  /** A short word for what this is about. */
  tag: string;
  text: string;
}

/**
 * The mirror: what the record looks like, shown to the person and to nobody
 * else. Screen only — print.css hides it, and a test asserts that.
 */
export function mirror(
  title: string,
  sub: string,
  observations: readonly MirrorObservation[],
): HTMLElement {
  const list = el('ul', {});
  for (const observation of observations) {
    list.append(
      el('li', {}, [
        el('span', { class: 'tag', text: observation.tag }),
        document.createTextNode(observation.text),
      ]),
    );
  }
  return el('div', { class: 'mirror', 'data-print': 'never' }, [
    el('h2', { text: title }),
    el('p', { class: 'sub', text: sub }),
    list,
  ]);
}
