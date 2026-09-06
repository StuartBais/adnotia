import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MODULES,
  addProfile,
  createStore,
  memoryStorageAdapter,
  mountChildSurface,
  mountShell,
  type KernelStore,
} from '../../src/kernel/index';
import { threeDays as parentSetup } from '../../src/modules/family-routines/fixtures/index';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { effectiveFontSize, declared, parseRules } from './styleRules';

// docs/05-architecture.md, Accessibility, held mechanically where it can be:
//
//   "Keyboard reachable throughout; visible focus; aria-pressed on every toggle
//   chip; live regions for save confirmation and month changes in the calendar;
//   prefers-reduced-motion respected; text never below 12.5 px on screen; print
//   never below 7.5 pt. The child surface additionally uses large targets
//   (≥ 48 px) and no text smaller than 16 px."
//
// The sizes are checked against the real stylesheet rather than against a list
// kept here, because a list kept here is a list that goes stale the first time
// somebody adds a class. See tests/kernel/styleRules.ts for what that reader
// can and cannot do.

const rules = parseRules();

const SCREEN_FLOOR = 12.5;
const CHILD_FLOOR = 16;
const CHILD_TARGET = 48;

describe('the type floor on screen', () => {
  it('has no HTML rule below 12.5px', () => {
    const small = rules
      .filter((rule) => rule.media === undefined)
      .filter((rule) => !rule.selector.startsWith('svg'))
      .map((rule) => ({ selector: rule.selector, size: rule.declarations['font-size'] }))
      .filter(
        (rule) =>
          rule.size !== undefined &&
          rule.size.endsWith('px') &&
          Number.parseFloat(rule.size) < SCREEN_FLOOR,
      );
    expect(small).toEqual([]);
  });

  it('has no print rule below 7.5pt', () => {
    const small = parseRules('src/styles/print.css')
      .map((rule) => ({ selector: rule.selector, size: rule.declarations['font-size'] }))
      .filter(
        (rule) =>
          rule.size !== undefined && rule.size.endsWith('pt') && Number.parseFloat(rule.size) < 7.5,
      );
    expect(small).toEqual([]);
  });

  it('reads the sheet well enough for those to mean anything', () => {
    // A parser that silently found nothing would pass both tests above.
    expect(rules.length).toBeGreaterThan(80);
    expect(rules.some((rule) => rule.selector === '.sub')).toBe(true);
    expect(rules.some((rule) => rule.selector === '.child-surface')).toBe(true);
    // It must also know what not to count: print sizes are in points.
    expect(rules.every((rule) => rule.media?.includes('print') !== true)).toBe(true);
  });
});

describe('what the stylesheet has to provide', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles/base.css'), 'utf8');

  it('respects prefers-reduced-motion', () => {
    const block = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1];
    expect(block).toBeDefined();
    // Not merely present: it has to actually stop the motion.
    expect(block).toMatch(/animation-duration:\s*0/);
    expect(block).toMatch(/transition-duration:\s*0/);
    expect(block).toMatch(/scroll-behavior:\s*auto/);
  });

  it('shows focus, and never takes the ring away', () => {
    expect(css).toMatch(/:focus-visible[\s\S]{0,120}outline:\s*\d+px solid/);
    // The commonest way this requirement is quietly lost.
    expect(css).not.toMatch(/outline:\s*(none|0)/);
  });

  it('covers every focusable kind, not only buttons', () => {
    const rule = /((?:[a-z[\]-]+:focus-visible,?\s*)+)\{/.exec(css)?.[1] ?? '';
    for (const kind of ['input', 'select', 'textarea', 'button', '[tabindex]']) {
      expect(rule).toContain(`${kind}:focus-visible`);
    }
  });
});

describe('everything that can be clicked can be reached', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: MODULES.filter((m) => m.audience === 'adult').map((m) => m.id),
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
  });

  it('puts every click handler on something the keyboard can focus', () => {
    // docs/05-architecture.md: "keyboard reachable throughout". Listeners are
    // not enumerable, so this records them as they are attached and then asks
    // what they were attached to. A div with a click handler is the classic way
    // a control becomes mouse-only, and it looks identical on screen.
    const clickable: Element[] = [];
    const original = window.EventTarget.prototype.addEventListener;
    window.EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (type === 'click' && this instanceof window.Element) clickable.push(this);
      return original.call(this, type, listener, options);
    };

    let shell: { destroy(): void };
    try {
      const container = document.createElement('div');
      shell = mountShell({ store, container, modules: MODULES });
      for (const tab of ['today', 'tools', 'records', 'library'] as const) {
        const button = [...container.querySelectorAll('.tabs button')].find((element) =>
          (element.getAttribute('aria-label') ?? element.textContent ?? '')
            .toLowerCase()
            .includes(tab),
        );
        (button as HTMLElement | undefined)?.click();
      }
    } finally {
      window.EventTarget.prototype.addEventListener = original;
    }

    const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex], summary';
    const unreachable = [...new Set(clickable)]
      .filter((element) => !element.matches(FOCUSABLE))
      .map((element) => `<${element.tagName.toLowerCase()} class="${element.className}">`);
    expect(unreachable).toEqual([]);
    // The recorder has to have recorded something, or this proves nothing.
    expect(clickable.length).toBeGreaterThan(10);
    shell.destroy();
  });
});

describe('state a sighted person reads from a colour', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: MODULES.filter((m) => m.audience === 'adult').map((m) => m.id),
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
  });

  function app(): HTMLElement {
    const container = document.createElement('div');
    mountShell({ store, container, modules: MODULES });
    return container;
  }

  it('says it in aria-pressed on every chip', () => {
    // docs/05-architecture.md names the chips specifically. A chip that carries
    // its state only in a class is a control a screen reader cannot report.
    const container = app();
    const chips = [...container.querySelectorAll('.chip')];
    expect(chips.length).toBeGreaterThan(5);
    const silent = chips
      .filter((chip) => chip.getAttribute('aria-pressed') === null)
      .map((chip) => chip.textContent);
    expect(silent).toEqual([]);
  });

  it('announces the save state rather than only colouring it', () => {
    const container = app();
    const live = [...container.querySelectorAll('[role="status"], [aria-live]')];
    expect(live.length).toBeGreaterThan(0);
  });

  it('announces a change of month in the calendar', () => {
    // The month label changes without the focus moving, so nothing else would
    // tell a screen reader that the grid underneath it is now a different month.
    const container = app();
    const open = [...container.querySelectorAll('button')].find((button) =>
      /date|day|calendar/i.test(button.className),
    );
    open?.click();
    const label = container.querySelector('.calhead [aria-live], .cal [aria-live]');
    expect(label).not.toBeNull();
  });
});

describe('the screen a child is handed', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.useSpace('family');
    store.updateFamily(() =>
      addProfile({ children: {} }, { nickname: 'Sam', ageBand: '4-11', id: 'c_1' }),
    );
    store.useProfile('c_1');
    store.set('family-routines', parentSetup);
  });

  function surface(): HTMLElement {
    return mountChildSurface({
      store,
      modules: MODULES,
      profileId: 'c_1',
      verify: async () => {},
      onLeave: vi.fn(),
    }).element;
  }

  /** Every element that actually carries text a child would read. */
  function textElements(root: HTMLElement): Element[] {
    return [...root.querySelectorAll('*')].filter((element) => {
      if (element.tagName === 'SVG' || element.closest('svg') !== null) return false;
      return [...element.childNodes].some(
        (node) => node.nodeType === 3 && (node.textContent ?? '').trim() !== '',
      );
    });
  }

  it('puts no text under 16px in front of the child', () => {
    const undersized = textElements(surface())
      .map((element) => ({
        text: (element.textContent ?? '').trim().slice(0, 28),
        found: effectiveFontSize(element, rules),
      }))
      .filter((entry) => entry.found !== undefined && entry.found.px < CHILD_FLOOR)
      .map((entry) => `${entry.found?.selector} (${entry.found?.px}px) — "${entry.text}"`);
    expect(undersized).toEqual([]);
  });

  it('gives every control a 48px target', () => {
    const small = [...surface().querySelectorAll('button')]
      .map((button) => ({
        label: (button.textContent ?? '').trim().slice(0, 24),
        height: declared(button, 'min-height', rules),
      }))
      .filter(
        (entry) =>
          entry.height === undefined || Number.parseFloat(entry.height.value) < CHILD_TARGET,
      )
      .map((entry) => `"${entry.label}" — ${entry.height?.value ?? 'no min-height'}`);
    expect(small).toEqual([]);
  });
});
