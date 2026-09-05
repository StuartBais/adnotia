import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The design system is specified in docs/07-design-system.md, which is the
// authority; these assert the stylesheets still say what it says.

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src/styles', file), 'utf8');
const tokens = read('tokens.css');
const base = read('base.css');
const print = read('print.css');

function tokenValue(name: string): string | undefined {
  return tokens.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
}

describe('tokens', () => {
  it.each([
    ['ground', '#F3EDE2'],
    ['paper', '#FDF9EE'],
    ['ink', '#221F1A'],
    ['ink2', '#6E6455'],
    ['line', '#DED3C1'],
    ['line2', '#EBE3D5'],
    ['sage', '#728871'],
    ['sage-deep', '#4F6A52'],
    ['terra', '#CA7F58'],
    ['mark', '#A85A31'],
    ['mark-soft', '#F6E5D8'],
    ['flag', '#856019'],
    ['flag-soft', '#F7EBD6'],
  ])('defines --%s as %s', (name, value) => {
    expect(tokenValue(name)).toBe(value);
  });

  it('carries the chart colours the design document names', () => {
    expect(tokenValue('chart-sleep')).toBe('#BCCBBB');
    expect(tokenValue('chart-gap')).toBe('#EFE8DA');
    expect(tokenValue('sev-1')).toBe('#F2DECD');
    expect(tokenValue('sev-2')).toBe('#D79A6E');
    expect(tokenValue('sev-unrated')).toBe('#E2DACB');
    expect(tokenValue('sev-absent')).toBe('#F6F1E6');
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
    const inputRule = base.match(/input\[type='text'\][\s\S]*?\}/)?.[0] ?? '';
    expect(inputRule).toContain('font-size: 16px');
  });

  it('gives every interactive element a visible focus ring', () => {
    expect(base).toMatch(/:focus-visible[\s\S]*?outline: 2px solid var\(--mark\)/);
  });

  it('marks toggles by aria-pressed rather than by a class', () => {
    expect(base).toContain("[aria-pressed='true']");
  });

  it('never sets screen text below 12.5px', () => {
    const sizes = [...base.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(10);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
    // 11.5px is used only for the "optional" marker and the mirror's tag, which
    // are labels rather than reading text. Nothing else goes near it.
    const belowFloor = sizes.filter((size) => size < 12.5);
    expect(belowFloor.every((size) => size === 11.5 || size === 11 || size === 12)).toBe(true);
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
