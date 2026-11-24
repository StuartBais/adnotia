// A small element builder for the prototype. Plain DOM, no framework: the
// prototype is deciding nothing about how the phone apps are built.

type Child = Node | string | number | false | null | undefined;
type Attrs = Record<string, unknown>;

export function h(tag: string, attrs: Attrs = {}, ...children: (Child | Child[])[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key.startsWith('on') && typeof value === 'function')
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
