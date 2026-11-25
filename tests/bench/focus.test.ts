import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Where keyboard focus is shown. The ring is drawn in the ground's own ink:
// terracotta is kept to time and capture (design/lantern/SPEC.md section 7),
// and on stone it would measure 2.1:1, under the 3:1 a focus indicator needs.
//
// jsdom resolves no custom properties, so the stylesheet is read as text.

const css = readFileSync(resolve(process.cwd(), 'src/bench/bench.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Every rule as selector and body; a rule inside @media keeps only its own selector. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selectors: (match[1] ?? '')
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean),
  body: match[2] ?? '',
}));

/** What the last rule for `selector` that sets --ring sets it to. */
const ringOf = (selector: string): string | undefined =>
  rules
    .filter((item) => item.selectors.includes(selector))
    .map((item) => /--ring:\s*([^;]+);/.exec(item.body)?.[1]?.trim())
    .filter((value) => value !== undefined)
    .at(-1);

describe('the focus ring', () => {
  it('is drawn in --ring, and nowhere in terracotta', () => {
    const base = rules.find((rule) => rule.selectors.includes(':focus-visible'));
    expect(base?.body).toMatch(/outline:\s*2px solid var\(--ring\)/);
    const focus = rules.filter((rule) => rule.selectors.some((s) => s.includes(':focus')));
    for (const rule of focus.filter((item) => /outline(-color)?:/.test(item.body))) {
      expect(rule.body).toMatch(/outline(-color)?:[^;]*var\(--ring\)/);
    }
    for (const rule of rules.filter((item) => /outline(-color)?:/.test(item.body))) {
      expect(rule.body).not.toMatch(/--terra/);
    }
  });

  it('is white on charcoal, and charcoal on stone and on white', () => {
    expect(ringOf(':root')).toBe('var(--white)');
    for (const light of [
      '.drawer',
      '.tabs',
      '.capture.on-light',
      ".app[data-places='white'][data-ground='place'] .screen",
      ".app[data-places='white'][data-ground='place'] .dock",
    ]) {
      expect(ringOf(light), light).toBe('var(--charcoal)');
    }
  });
});
