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

import { isCryptoAvailable, isValidPasscode } from '../crypto/index';
import { tierWording } from '../library/tiers';
import { card, chips, el, passwordInput } from '../ui/index';
import type { ModuleManifest, Space } from '../index';

/*
 * What the third step says, and why it says it here.
 *
 * Nothing a website can do will tell somebody which extensions they have: there
 * is no API for it, and the side channels that remain find only the extensions
 * that visibly change a page — not the one that quietly reads what is stored.
 * So this is said once, plainly, rather than detected. See ADR-039.
 *
 * At first run because there is nothing to lose yet. A passcode has no recovery
 * path, and this is the only moment where forgetting it costs nothing.
 */
export const PASSCODE_STEP = {
  title: 'Lock this with a passcode?',
  sub: 'Optional. You can set one later, or remove it.',
  risk:
    'Anything a browser stores can be read by an extension that has permission to see the ' +
    'pages you visit. That is true of every site, and no site can tell you which extensions ' +
    'you have — including this one.',
  what:
    'A passcode encrypts what is stored, so an extension reading the browser\u2019s storage ' +
    'finds nothing it can use. It cannot protect what is on the screen while you are using ' +
    'the app.',
  noRecovery: 'There is no way to recover it. Forget it and what is here is gone.',
  code: 'Passcode',
  again: 'Type it again',
  hint: 'Six digits or more.',
  set: 'Set a passcode',
  skip: 'Not now',
  needValid: 'Six digits or more, numbers only.',
  needMatch: 'The two do not match.',
  failed: 'That could not be set, and nothing has been encrypted. You can try again in Settings.',
} as const;

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
  /**
   * Turns on encryption with a new passcode. Absent where there is no crypto to
   * use, in which case the step is not offered rather than offered and broken.
   */
  setPasscode?: (code: string) => Promise<void>;
}

/**
 * The first-run flow. Three steps: whose this is, what to turn on, and whether
 * to lock it.
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
    done.addEventListener('click', () => choosePasscode([...chosen]));

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

  /**
   * The last step, and skippable in one press.
   *
   * It is a question, not a gate. Somebody who has just been told there is a
   * risk they cannot check and no way to recover a code they forget is entitled
   * to say not now, and the app is no use to anybody who abandons it here.
   */
  function choosePasscode(enabled: string[]): void {
    const finish = (): void => options.onDone({ space, enabled });
    const setPasscode = options.setPasscode;
    if (setPasscode === undefined || !isCryptoAvailable()) {
      finish();
      return;
    }

    const status = el('p', { class: 'bmsg', role: 'status' });
    const code = passwordInput({
      label: PASSCODE_STEP.code,
      numeric: true,
      autocomplete: 'new-password',
      hint: PASSCODE_STEP.hint,
    });
    const again = passwordInput({
      label: PASSCODE_STEP.again,
      numeric: true,
      autocomplete: 'new-password',
    });

    const set = el('button', {
      type: 'button',
      class: 'btn primary wide',
      text: PASSCODE_STEP.set,
    });
    const skip = el('button', { type: 'button', class: 'btn wide', text: PASSCODE_STEP.skip });

    skip.addEventListener('click', finish);
    set.addEventListener('click', () => {
      const chosen = code.value();
      if (!isValidPasscode(chosen)) {
        status.textContent = PASSCODE_STEP.needValid;
        return;
      }
      if (chosen !== again.value()) {
        status.textContent = PASSCODE_STEP.needMatch;
        return;
      }
      set.disabled = true;
      // Awaited here rather than fired at the shell, so a failure is said on
      // this screen instead of landing somebody in an app they believe is
      // encrypted and is not.
      void setPasscode(chosen).then(finish, () => {
        set.disabled = false;
        status.textContent = PASSCODE_STEP.failed;
      });
    });

    root.replaceChildren(
      card({
        title: PASSCODE_STEP.title,
        sub: PASSCODE_STEP.sub,
        children: [
          el('p', { class: 'hint', text: PASSCODE_STEP.risk }),
          el('p', { class: 'hint', text: PASSCODE_STEP.what }),
          el('p', { class: 'hint', text: PASSCODE_STEP.noRecovery }),
          code.element,
          again.element,
          status,
          set,
          skip,
        ],
      }),
    );
  }

  chooseSpace();
  return root;
}
