import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dayTimeline, severityGrid, stepChart } from '../../src/kernel/index';

// The design system is specified in docs/07-design-system.md, which is the
// authority; these assert the stylesheets still say what it says.

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src/styles', file), 'utf8');
const tokens = read('tokens.css');
const base = read('base.css');
const print = read('print.css');

function tokenValue(name: string): string | undefined {
  return tokens.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
}

/**
 * The design document writes its hex values in upper case and the formatter
 * writes them in lower case. Only the colour is pinned to the document, not the
 * spelling of it: `#F3EDE2` and `#f3ede2` are the same colour, and asserting the
 * case would make the stylesheet answer to the formatter instead of to
 * docs/07-design-system.md.
 */
function expectColour(name: string, documented: string): void {
  expect(tokenValue(name)?.toLowerCase()).toBe(documented.toLowerCase());
}

describe('tokens', () => {
  it.each([
    ['ground', '#EAECE7'],
    ['paper', '#F8F9F6'],
    ['ink', '#2B2F2C'],
    ['ink2', '#5C6360'],
    ['line', '#D2D6CF'],
    ['line2', '#E2E6DF'],
    // The logo's own two, which the design document forbids changing.
    ['sage', '#728871'],
    ['terra', '#CA7F58'],
    ['mark', '#3F6144'],
    ['mark-soft', '#DFE9E0'],
    ['terra-deep', '#A85231'],
    ['flag', '#8A5524'],
    ['flag-soft', '#F6E7DA'],
  ])('defines --%s as %s', (name, value) => {
    expectColour(name, value);
  });

  it('carries the chart colours the design document names', () => {
    expectColour('chart-sleep', '#C9CFD4');
    expectColour('chart-gap', '#E4E7E1');
    expectColour('sev-1', '#F0DFD1');
    expectColour('sev-2', '#D9A176');
    expectColour('sev-unrated', '#DDE0DA');
    expectColour('sev-absent', '#EFF1EC');
  });

  it('keeps every colour in the token file', () => {
    // The palette change of September 2026 found ten colours written into
    // base.css by hand, six of which duplicated the value of a token that
    // already existed. Changing --chart-sleep did nothing to the sleep band,
    // which is the one thing a token is for. White is allowed: it is not a
    // palette colour, it is the absence of one.
    const hardcoded = [...base.matchAll(/#[0-9a-fA-F]{3,8}/g)]
      .map((match) => match[0].toLowerCase())
      .filter((colour) => colour !== '#fff' && colour !== '#ffffff');
    expect(hardcoded).toEqual([]);
  });

  it('leaves print in greys, because a colour print of this is not the point', () => {
    const colours = [...print.matchAll(/#[0-9a-fA-F]{3,6}/g)].map((match) => match[0]);
    expect(colours.length).toBeGreaterThan(5);
    for (const colour of colours) {
      const full =
        colour.length === 4 ? colour.replace(/([0-9a-f])/gi, '$1$1').slice(0, 7) : colour;
      const [r, g, b] = [1, 3, 5].map((at) => parseInt(full.slice(at, at + 2), 16));
      // A grey has no separation between its channels.
      expect(
        Math.max(r as number, g as number, b as number) -
          Math.min(r as number, g as number, b as number),
        colour,
      ).toBeLessThanOrEqual(4);
    }
  });

  it('uses system font stacks, because there are no font files', () => {
    expect(tokenValue('serif')).toContain('Iowan Old Style');
    expect(tokenValue('sans')).toContain('-apple-system');
    expect(tokens).not.toMatch(/@font-face/);
  });
});

describe('every stylesheet', () => {
  it.each([
    ['tokens.css', tokens],
    ['base.css', base],
    ['print.css', print],
  ])('%s loads nothing off the device', (_name, css) => {
    expect(css).not.toMatch(/url\(\s*['"]?https?:/i);
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/\.(?:woff2?|ttf|otf|eot)\b/i);
  });
});

describe('base', () => {
  it('sets inputs at 16px, which stops iOS zooming on focus', () => {
    const inputRule = base.match(/input\[type=['"]text['"]\][\s\S]*?\}/)?.[0] ?? '';
    expect(inputRule).toContain('font-size: 16px');
  });

  it('gives every interactive element a visible focus ring', () => {
    expect(base).toMatch(/:focus-visible[\s\S]*?outline: 2px solid var\(--mark\)/);
  });

  it('marks toggles by aria-pressed rather than by a class', () => {
    expect(base).toMatch(/\[aria-pressed=['"]true['"]\]/);
  });

  it('never sets screen text below 12.5px', () => {
    // SVG rules are excluded: a chart label is sized in user units inside a
    // viewBox, not in CSS pixels, so the same number means something different.
    // See the chart-label test below for what governs those instead.
    const withoutCharts = base.replace(/svg [^{]*\{[^}]*\}/g, '');
    const sizes = [...withoutCharts.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(10);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
    // 11.5px is used only for the "optional" marker and the mirror's tag, which
    // are labels rather than reading text. Nothing else goes near it.
    const belowFloor = sizes.filter((size) => size < 12.5);
    expect(belowFloor.every((size) => size === 11.5 || size === 11 || size === 12)).toBe(true);
  });

  it('never puts anything only in a chart label', () => {
    // Chart labels are 9 user units in a 640-wide viewBox, so on a narrow phone
    // they render well under the 12.5px floor and on paper under the 7.5pt one.
    // ADR-027 accepts that, on the condition that nothing a chart plots is
    // available from the picture alone. The condition is held by
    // tests/kernel/a11y.test.ts, which is where it belongs: when it was only
    // written here as a claim, it was false for the dose chart for months.
    expect(base).toMatch(/svg \.tick \{[^}]*font-size: 9px/);

    for (const chart of [stepChart, dayTimeline, severityGrid]) {
      expect(typeof chart).toBe('function');
    }
    const drawn = stepChart({
      columns: [{ step: 30 }, { step: 50 }],
      pointScale: { min: 1, max: 5, label: 'focus 5' },
      startLabel: '1 Sep',
      endLabel: '2 Sep',
      title: 'Dose over time with daily focus ratings',
      legend: 'Solid line: daily dose.',
    });
    expect(drawn).toContain('aria-label="Dose over time with daily focus ratings"');
    expect(drawn).toContain('<p class="legend">Solid line: daily dose.</p>');
  });

  it('respects prefers-reduced-motion', () => {
    expect(base).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('gives the child surface large targets', () => {
    const rule = base.match(/\.child-surface \.btn[\s\S]*?\}/)?.[0] ?? '';
    expect(rule).toContain('min-height: 48px');
    expect(rule).toContain('font-size: 18px');
  });
});

describe('print', () => {
  it('is a print-only stylesheet', () => {
    expect(print).toContain('@media print');
  });

  it('never prints the mirror', () => {
    // The mirror is a reflection for the person. It is screen-only, never
    // printed and never shared. See docs/01-module-contract.md.
    const hidden = print.match(/([^{}]*)\{\s*display: none !important/)?.[1] ?? '';
    expect(hidden).toContain('.mirror');
  });

  it('hides the masthead, tabs and calendar', () => {
    const hidden = print.match(/([^{}]*)\{\s*display: none !important/)?.[1] ?? '';
    for (const selector of ['.mast', '.tabs', '.cal', '.nag', '.linkrow']) {
      expect(hidden).toContain(selector);
    }
  });

  it('maps chart colour to greys, so a mono print still reads', () => {
    expect(print).toMatch(/svg \.coverband\s*\{\s*fill: #333/);
    expect(print).toMatch(/svg \.sleepband\s*\{\s*fill: #c9c9c9/i);
  });

  it('never breaks a row or a dose block across pages', () => {
    expect(print).toMatch(/break-inside: avoid/);
  });

  it('sets a portrait page with a 13mm margin', () => {
    expect(print).toMatch(/@page[\s\S]*?margin: 13mm/);
    expect(print).toMatch(/size: portrait/);
  });

  it('never prints text below 7.5pt', () => {
    const sizes = [...print.matchAll(/font-size:\s*([\d.]+)pt/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(7.5);
  });
});
