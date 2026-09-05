// First run.
//
// One question: what would you like help with? The first choice is whether this
// is for you or for a child you care for, and the options that follow are the
// modules that can be enabled in that space, with their tier wording. The home
// screen is then built from the answers.
//
// Nothing is on by default except the shell. Someone who picks planning and
// sleep never sees a dose field. See docs/03-scope.md "The home screen is not
// the medication log".

import { card, el } from '../ui/index';
import type { ModuleManifest, Space } from '../index';

/** The in-app wording for a tier, fixed by docs/02-evidence-rubric.md. */
export function tierWording(tier: 'A' | 'B' | 'C', space: Space): string {
  const population =
    space === 'family' ? 'children with ADHD and their parents' : 'adults with ADHD';
  switch (tier) {
    case 'A':
      return `Established. This is based on treatments with repeated trial evidence in ${population}.`;
    case 'B':
      return `Promising. There is trial evidence for this in ${population}, but the studies are small or have methodological weaknesses. Treat it as worth trying, not as proven.`;
    case 'C':
      return 'Plausible. This tool comes from techniques used in evidence-based treatment, but this specific tool has not itself been tested in trials. Some people find it useful.';
  }
}

export interface FirstRunResult {
  space: Space;
  enabled: string[];
}

export interface FirstRunOptions {
  /** Modules available to offer, once there are any. */
  available: (space: Space) => readonly ModuleManifest[];
  onDone: (result: FirstRunResult) => void;
}

/**
 * The first-run flow. Two steps: whose this is, then what to turn on.
 */
export function firstRun(options: FirstRunOptions): HTMLElement {
  const root = el('div', { class: 'first-run' });
  let space: Space = 'adult';

  function chooseSpace(): void {
    const forMe = el('button', {
      type: 'button',
      class: 'linkrow',
      text: 'This is for me',
    });
    const forChild = el('button', {
      type: 'button',
      class: 'linkrow',
      text: 'This is for a child I care for',
    });

    forMe.addEventListener('click', () => {
      space = 'adult';
      chooseModules();
    });
    forChild.addEventListener('click', () => {
      space = 'family';
      chooseModules();
    });

    root.replaceChildren(
      card({
        title: 'What would you like help with?',
        sub: 'You can change any of this later.',
        children: [forMe, forChild],
      }),
    );
  }

  function chooseModules(): void {
    const modules = options.available(space);
    const chosen = new Set<string>();

    const list = el('div', {});
    for (const manifest of modules) {
      const row = el('div', { class: 'card' }, [
        el('h2', { text: manifest.name }),
        el('p', { class: 'sub', text: manifest.summary }),
        el('p', { class: 'hint', text: tierWording(manifest.tier, space) }),
      ]);
      const toggle = el('button', {
        type: 'button',
        class: 'btn wide',
        'aria-pressed': 'false',
        text: 'Turn this on',
      });
      toggle.addEventListener('click', () => {
        if (chosen.has(manifest.id)) {
          chosen.delete(manifest.id);
          toggle.setAttribute('aria-pressed', 'false');
          toggle.textContent = 'Turn this on';
          toggle.className = 'btn wide';
        } else {
          chosen.add(manifest.id);
          toggle.setAttribute('aria-pressed', 'true');
          toggle.textContent = 'On';
          toggle.className = 'btn wide primary';
        }
      });
      row.append(toggle);
      list.append(row);
    }

    const done = el('button', {
      type: 'button',
      class: 'btn primary wide',
      text: modules.length === 0 ? 'Continue' : 'Done',
    });
    done.addEventListener('click', () => options.onDone({ space, enabled: [...chosen] }));

    const back = el('button', { type: 'button', class: 'btn wide', text: 'Back' });
    back.addEventListener('click', chooseSpace);

    if (modules.length === 0) {
      // Honest rather than empty-with-a-shrug: there is genuinely nothing to
      // offer yet, and saying so beats an encouraging blank page.
      root.replaceChildren(
        card({
          title: 'Nothing to turn on yet',
          sub:
            space === 'family'
              ? 'The tools for parents and carers are still being built. Nothing about a child is recorded until they are.'
              : 'The tools are still being built. When they arrive you will choose which ones you want, and see what the evidence behind each one is.',
          children: [done, back],
        }),
      );
      return;
    }

    root.replaceChildren(
      card({
        title: 'Which of these would help?',
        sub: 'Turn on as few or as many as you like. Nothing is on until you say so.',
      }),
      list,
      el('div', { class: 'btnrow' }, [done, back]),
    );
  }

  chooseSpace();
  return root;
}
