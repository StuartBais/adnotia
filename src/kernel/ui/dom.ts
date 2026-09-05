// Small DOM helpers. Every primitive is built with these, so markup stays
// consistent and nothing reaches for innerHTML with user text in it.

export type Attributes = Record<string, string | number | boolean | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    if (name === 'class') node.className = String(value);
    else if (name === 'text') node.textContent = String(value);
    else if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, String(value));
  }
  node.append(...children);
  return node;
}

/** A control a module or the shell can read, write and take apart. */
export interface Control<T> {
  element: HTMLElement;
  value(): T;
  set(value: T): void;
  destroy?(): void;
}

/**
 * The label above a control, with the optional marker where there is one.
 * "Optional" never shouts: see docs/07-design-system.md "Voice".
 */
export function fieldLabel(text: string, optional = false): HTMLElement {
  const label = el('span', { class: 'flabel', text });
  if (optional) {
    label.append(' ', el('span', { class: 'opt', text: 'optional' }));
  }
  return label;
}

/** A field wrapper: label, control, and an optional hint beneath. */
export function field(label: HTMLElement | null, control: Node, hint?: string): HTMLElement {
  const wrapper = el('div', { class: 'field' });
  if (label) wrapper.append(label);
  wrapper.append(control);
  if (hint !== undefined && hint !== '') {
    wrapper.append(el('p', { class: 'hint', text: hint }));
  }
  return wrapper;
}
