// The four tabs.
//
// Each is assembled from whatever the person has enabled. With nothing enabled,
// each says so plainly rather than showing an encouraging blank page: a gap is a
// fact to show, never a failure to punish.

import { card, el } from '../ui/index';
import type { ModuleManifest, Space } from '../index';
import { TAB_LABELS, type TabId } from './router';

export interface ViewContext {
  space: Space;
  enabled: readonly ModuleManifest[];
  /** Every module in the build, enabled or not. The Library shows them all. */
  known: readonly ModuleManifest[];
}

const EMPTY: Readonly<Record<TabId, { title: string; sub: string }>> = {
  today: {
    title: 'Nothing to fill in',
    sub: 'When you turn a tool on, its questions appear here as one short check-in.',
  },
  tools: {
    title: 'No tools yet',
    sub: 'Tools are things you open when you need them: a timer, a plan for the next hour.',
  },
  records: {
    title: 'Nothing recorded yet',
    sub: 'What you fill in on Today shows up here, day by day.',
  },
  library: {
    title: 'The Library is being written',
    sub: 'It will explain what each tool is for, what the evidence says, and what it will not do.',
  },
};

export function renderTab(tab: TabId, context: ViewContext): HTMLElement {
  const section = el('div', { class: 'view', 'aria-label': TAB_LABELS[tab] });

  if (tab === 'library') {
    // The Library shows every module, enabled or not, so a person can read why a
    // tool exists before turning it on.
    if (context.known.length === 0) {
      section.append(card(EMPTY.library));
      return section;
    }
    for (const manifest of context.known) {
      section.append(
        card({
          title: manifest.name,
          sub: manifest.contributes.library.whatItIs,
          children: [
            el('p', { class: 'hint', text: manifest.contributes.library.whatItWontDo }),
          ],
        }),
      );
    }
    return section;
  }

  if (context.enabled.length === 0) {
    section.append(card(EMPTY[tab]));
    return section;
  }

  for (const manifest of context.enabled) {
    section.append(card({ title: manifest.name, sub: manifest.summary }));
  }
  return section;
}
