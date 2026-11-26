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
      '.c-panel',
      ".app[data-places='white'][data-ground='place'] .screen",
      ".app[data-places='white'][data-ground='place']:not([data-focus]) .dock",
    ]) {
      expect(ringOf(light), light).toBe('var(--charcoal)');
    }
  });

  it('stays white on the dock line in Focus, which is charcoal over a white place too', () => {
    const dock = rules.filter((rule) =>
      rule.selectors.some((s) => s.endsWith(' .dock') && /--ring:/.test(rule.body)),
    );
    for (const rule of dock) {
      const white = rule.selectors.filter(
        (s) => s.includes("data-places='white'") && s.endsWith(' .dock'),
      );
      for (const selector of white) expect(selector).toContain(':not([data-focus])');
    }
  });
});

describe('the Reduce Motion fades (SPEC 10)', () => {
  const animationOf = (selector: string): string | undefined =>
    rules
      .filter((item) => item.selectors.includes(selector))
      .map((item) => /animation:\s*([^;]+);/.exec(item.body)?.[1]?.trim())
      .filter((value) => value !== undefined)
      .at(-1);

  it('fades Focus in whole and out again, and the capsule in, over 200 ms, with nothing travelling', () => {
    expect(animationOf('.app[data-focus] .focus')).toBe('bench-fade-in 200ms ease-out both');
    expect(animationOf('.dock .enter')).toBe('bench-fade-in 200ms ease-out both');
    expect(animationOf('.focus[data-leaving]')).toBe('bench-fade-out 200ms ease-in both');
    const frames = css.match(/@keyframes bench-fade-(?:in|out)\s*\{[^@]*?\}\s*\}/g) ?? [];
    expect(frames).toHaveLength(2);
    for (const frame of frames) expect(frame).not.toMatch(/transform|translate|scale/);
  });

  it('fades the capture sheet in and out, and what it raises, with nothing travelling', () => {
    expect(animationOf('.app[data-sheet] .csheet')).toBe('bench-fade-in 200ms ease-out both');
    expect(animationOf('.sheet-layer[data-leaving]')).toBe('bench-fade-out 200ms ease-in both');
    expect(animationOf(".app[data-sheet='today'] .lantern")).toBe(
      'bench-fade-in 200ms ease-out both',
    );
    expect(animationOf('.app[data-lowering] .lantern')).toBe('bench-fade-back 200ms ease-out both');
    const back = /@keyframes bench-fade-back\s*\{([^@]*?\})\s*\}/.exec(css)?.[1] ?? '';
    expect(back).toMatch(/opacity:\s*0/);
    expect(back).not.toMatch(/transform|translate|scale/);
  });
});
