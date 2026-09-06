import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  brand,
  createStore,
  logoMark,
  memoryStorageAdapter,
  mountShell,
  type KernelStore,
} from '../../src/kernel/index';

// docs/07-design-system.md: "The logo mark is the only graphic. It is an inline
// SVG in the masthead (34 × 31 px) and the lock screen (44 × 40 px), and a 180 px
// PNG for the home screen icon. `assets/logo.svg` is canonical; do not embed the
// original raster."
//
// The stylesheet had sized `.brand .logo` and `.brand.big .logo` since the design
// system was written. Nothing rendered either, so every screen showed the name
// with no mark and index.html had no icon at all.

describe('the mark', () => {
  it('is the artwork from the canonical file, not a copy of it', () => {
    const source = readFileSync('assets/logo.svg', 'utf8');
    const paths = [...source.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]);
    expect(paths.length).toBeGreaterThan(0);
    const rendered = logoMark();
    for (const path of paths) {
      expect(
        [...rendered.querySelectorAll('path')].map((node) => node.getAttribute('d')),
      ).toContain(path);
    }
  });

  it('is decorative, because the name is always beside it', () => {
    // Announcing the mark as well would make a screen reader say "Adnotia" twice.
    expect(logoMark().getAttribute('aria-hidden')).toBe('true');
    expect(logoMark().getAttribute('focusable')).toBe('false');
  });

  it('carries the class the stylesheet sizes', () => {
    expect(logoMark().getAttribute('class')).toBe('logo');
  });

  it('does not collide with another copy of itself on the same page', () => {
    // SVG ids are document-global. Two marks sharing clipPath id="g" would both
    // clip to whichever the browser resolved first, and half of one mark would
    // come out the wrong colour.
    const first = logoMark();
    const second = logoMark();
    const ids = (mark: SVGSVGElement): string[] =>
      [...mark.querySelectorAll('clipPath')].map((node) => node.getAttribute('id') ?? '');

    expect(ids(first)).not.toEqual(ids(second));
    expect(new Set([...ids(first), ...ids(second)]).size).toBe(ids(first).length * 2);

    // And each mark's own references still point at its own clip paths.
    for (const mark of [first, second]) {
      const own = new Set(ids(mark));
      const used = [...mark.querySelectorAll('[clip-path]')].map((node) =>
        (node.getAttribute('clip-path') ?? '').replace(/^url\(#|\)$/g, ''),
      );
      expect(used.length).toBeGreaterThan(0);
      for (const reference of used) expect(own.has(reference)).toBe(true);
    }
  });
});

describe('the pairing', () => {
  it('puts the mark before the name', () => {
    const paired = brand();
    expect(paired.className).toBe('brand');
    expect(paired.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(paired.lastElementChild?.textContent).toBe('Adnotia');
  });

  it('takes the larger size from the wrapper, never from the mark', () => {
    // .brand .logo is 34 × 31; .brand.big .logo is 44 × 40. Sizing the mark
    // itself would let a 44px mark sit beside a masthead-sized name.
    const big = brand({ big: true });
    expect(big.className).toBe('brand big');
    expect(big.querySelector('svg')?.getAttribute('class')).toBe('logo');
  });
});

describe('where the mark actually appears', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  function shellInto(firstRunComplete: boolean): HTMLElement {
    store.updateKernel((kernel) => ({
      ...kernel,
      settings: { ...kernel.settings, firstRunComplete },
    }));
    const container = document.createElement('div');
    mountShell({ store, container, modules: [] });
    return container;
  }

  it('is in the masthead', () => {
    const masthead = shellInto(true).querySelector('.mast .brand');
    expect(masthead?.querySelector('svg.logo')).not.toBeNull();
    expect(masthead?.textContent).toContain('Adnotia');
  });

  it('is on the first screen anybody sees', () => {
    expect(shellInto(false).querySelector('.mast .brand svg.logo')).not.toBeNull();
  });
});

describe('the icons in the document', () => {
  const html = readFileSync('index.html', 'utf8');

  it('leaves index.html without a hand-pasted copy of the artwork', () => {
    // The design document makes assets/logo.svg canonical. The icons are inlined
    // by vite.config.ts at build time so there is one copy in the repository.
    expect(html).not.toContain('728871');
    expect(html).not.toContain('<svg');
  });

  it('has no icon link to go stale in the source document', () => {
    expect(html).not.toContain('rel="icon"');
    expect(html).not.toContain('apple-touch-icon');
  });
});
