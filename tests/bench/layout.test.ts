import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Where a control the keyboard reaches comes to rest, from the stylesheet
// (WCAG 2.4.7 and 2.4.11). The places' body and the drawer's lists run on
// under what covers their foot: the dock line with the capsule and capture,
// and the drawer's covered row. A browser scrolls a focused control into the
// scroller's box, which includes that band, so the scrollers say how much of
// it to keep clear. jsdom lays nothing out, so the rules are read as text and
// worked out at 390 × 844 with the board's insets of 54 and 34.

const css = readFileSync(resolve(process.cwd(), 'src/bench/bench.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

const tokens = new Map(
  [...(/:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '').matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(
    (match) => [match[1]!, match[2]!.trim()],
  ),
);

/** A length in px, its custom properties and the safe areas worked out. */
function px(value: string): number {
  const expression = value
    .replace(/env\(safe-area-inset-top[^)]*\)/g, '54px')
    .replace(/env\(safe-area-inset-bottom[^)]*\)/g, '34px')
    .replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => {
      const raw = tokens.get(name);
      if (raw === undefined) throw new Error(`No ${name} in :root`);
      return `(${px(raw)})`;
    })
    .replace(/(-?[\d.]+)px/g, '$1')
    .replace(/\bcalc\b/g, '')
    .replace(/\bmax\b/g, 'Math.max');
  if (!/^[\d\s.+\-*/(),Mathmax]*$/.test(expression)) throw new Error(`Not a length: ${value}`);
  return Number(new Function(`return ${expression};`)());
}

/** The bottom of a rule's scroll-padding, in px. */
function paddingBottom(selector: string): number {
  const body = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    (match) => match[1]!.trim() === selector,
  )?.[2];
  const value = /scroll-padding:\s*([^;]+);/.exec(body ?? '')?.[1];
  if (value === undefined) throw new Error(`${selector} has no scroll-padding`);
  // "top right bottom", as written here: split on spaces outside brackets.
  const parts: string[] = [''];
  let depth = 0;
  for (const char of value.trim()) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ' ' && depth === 0) parts.push('');
    else parts[parts.length - 1] += char;
  }
  return px(parts[2] ?? parts[0]!);
}

const RING = 4;

describe('a focused control stops clear of what covers a scroller’s foot', () => {
  it('on the places, above the dock line with its ring', () => {
    // The body ends at the folded drawer's top; the dock line's top is 64
    // above the dock line's foot.
    const under = px('var(--dock-b)') + 64 - px('var(--fold-b)');
    expect(under).toBe(78);
    expect(paddingBottom('.body')).toBeGreaterThanOrEqual(under + RING);
  });

  it('in the drawer’s lists, above the covered row with its ring', () => {
    expect(paddingBottom('.list')).toBeGreaterThanOrEqual(44 + RING);
  });
});
