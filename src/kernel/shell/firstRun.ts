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

import { tierWording } from '../library/tiers';
import { card, chips, el } from '../ui/index';
import type { ModuleManifest, Space } from '../index';

/** The in-app wording for a tier, fixed by docs/02-evidence-rubric.md. */
export function moduleChoice(options: {
  manifest: ModuleManifest;
  space: Space;
  enabled: boolean;
  onChange(enabled: boolean): void;
}): HTMLElement {
  const { manifest, space } = options;
  let enabled = options.enabled;
  const toggle = el('button', { type: 'button', class: 'btn wide' });
  const detail = el('div', { id: `eligibility-${manifest.id}` });
  detail.hidden = true;
  function paint(): void {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'On' : 'Turn this on';
    toggle.className = enabled ? 'btn wide primary' : 'btn wide';
    if (manifest.eligibility) toggle.setAttribute('aria-expanded', String(!detail.hidden));
  }
  function select(next: boolean): void {
    enabled = next;
    detail.hidden = true;
    options.onChange(enabled);
    paint();
  }
  toggle.addEventListener('click', () => {
    if (enabled) {
      select(false);
      return;
    }
    if (!manifest.eligibility) {
      select(true);
      return;
    }
    const eligibility = manifest.eligibility;
    detail.replaceChildren(
      chips({
        label: eligibility.question,
        options: [
          { v: 'yes', l: 'Yes' },
          { v: 'no', l: 'No' },
        ],
        onChange: (answer) => {
          if (answer === eligibility.enableIf) select(true);
          else select(false);
          toggle.focus();
        },
      }).element,
      el('p', { class: 'hint', text: eligibility.note ?? '' }),
    );
    detail.hidden = false;
    toggle.setAttribute('aria-controls', detail.id);
    paint();
    detail.querySelector('button')?.focus();
  });
  paint();
  return card({
    title: manifest.name,
    sub: manifest.summary,
    children: [el('p', { class: 'hint', text: tierWording(manifest.tier, space) }), toggle, detail],
  });
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
      list.append(
        moduleChoice({
          manifest,
          space,
          enabled: false,
          onChange: (enabled) => {
            if (enabled) chosen.add(manifest.id);
            else chosen.delete(manifest.id);
          },
        }),
      );
    }

    const done = el('button', {
      type: 'button',
      class: 'btn primary wide',
      text: modules.length === 0 ? 'Continue' : 'Done',
    });
    done.addEventListener('click', () => options.onDone({ space, enabled: [...chosen] }));

    const back = el('button', {
      type: 'button',
      class: 'btn wide',
      text: 'Back',
    });
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
