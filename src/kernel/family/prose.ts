// The two shapes every guidance page is built from.
//
// Guidance pages are prose, so they need almost nothing: a heading with a
// paragraph, or a heading with a list. They live here rather than in one of the
// pages so that a new page cannot quietly invent a third shape and read
// differently from the others.

import { card, el } from '../ui/index';
import { citationList, tierWording } from '../library/index';
import type { Citation, Tier } from '../registry/types';

export function bullets(items: readonly string[]): HTMLElement {
  const list = el('ul', { class: 'plain' });
  for (const item of items) list.append(el('li', { text: item }));
  return list;
}

export function section(heading: string, body: string | readonly string[]): HTMLElement {
  return el('div', { class: 'lib-part' }, [
    el('h3', { text: heading }),
    typeof body === 'string' ? el('p', { text: body }) : bullets(body),
  ]);
}

/**
 * The tier and references a guidance page rests on.
 *
 * docs/02-evidence-rubric.md makes no exception for prose: "the tier of any
 * individual Library article follows the evidence for that article's topic".
 * Guidance that says a thing works is making the same kind of claim a module
 * makes, and it is held to the same standard — the tier in the wording the
 * rubric fixes, the references under it, and the plain statement when nobody
 * has checked them.
 *
 * Always `family`: these pages exist only in the Family space.
 */
export function evidenceNote(entry: {
  tier: Tier;
  citations: readonly Citation[];
  citationsVerified?: string;
}): HTMLElement {
  return card({
    children: [
      el('p', { class: 'tier', text: tierWording(entry.tier, 'family') }),
      citationList(entry.citations, entry.citationsVerified),
    ],
  });
}
