// A small, honest reader for src/styles/base.css.
//
// jsdom does not run a full cascade, and the accessibility rules in
// docs/05-architecture.md are stated in CSS pixels — "text never below 12.5 px
// on screen", "no text smaller than 16 px" on the child surface — so a test
// that wants to hold them has to know what the stylesheet actually declares for
// an element that is really on the screen.
//
// So this parses the declarations we care about out of the sheet and resolves
// them against a rendered element with `element.matches`, which jsdom does
// implement properly. It is not a browser: it approximates specificity by
// counting selector parts and lets a later rule win a tie, which is how the
// sheet is written anyway. Where it is wrong it is wrong in the direction of
// reporting a smaller size than the browser would, and a false failure that
// makes someone look at a rule is a much better bug than a silent pass.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Rule {
  selector: string;
  declarations: Record<string, string>;
  /** Rules inside `@media print` never apply on screen. */
  media: string | undefined;
  order: number;
}

const WANTED = new Set(['font-size', 'min-height', 'min-width', 'padding']);

export function parseRules(file = 'src/styles/base.css'): Rule[] {
  const css = readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  let media: string | undefined;
  let depth = 0;
  let order = 0;

  // One pass, tracking whether we are inside an at-rule. The sheet nests at
  // most one level deep, which this relies on and a test below asserts.
  const pattern = /([^{}]+)\{([^{}]*)\}|\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    if (match[0] === '}') {
      depth = Math.max(0, depth - 1);
      if (depth === 0) media = undefined;
      continue;
    }
    const prelude = (match[1] ?? '').trim();
    const body = match[2] ?? '';
    if (prelude.startsWith('@')) {
      media = prelude;
      depth += 1;
      continue;
    }
    const declarations: Record<string, string> = {};
    for (const declaration of body.split(';')) {
      const [property, ...rest] = declaration.split(':');
      const name = (property ?? '').trim();
      if (!WANTED.has(name)) continue;
      declarations[name] = rest.join(':').trim();
    }
    if (Object.keys(declarations).length === 0) continue;
    for (const selector of prelude.split(',')) {
      rules.push({ selector: selector.trim(), declarations, media, order: order++ });
    }
  }
  return rules;
}

/** Roughly CSS specificity: ids, then classes and attributes, then elements. */
function weight(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (selector.match(/[.:[][\w-]+/g) ?? []).length;
  const elements = (selector.match(/(^|[\s>+~])[a-z]+/g) ?? []).length;
  return ids * 10000 + classes * 100 + elements;
}

/**
 * What the sheet declares for `property` on this element, on screen. Undefined
 * when nothing matches, which for font-size means it inherits.
 */
export function declared(
  element: Element,
  property: string,
  rules: readonly Rule[],
): { value: string; selector: string } | undefined {
  let best: { value: string; selector: string; weight: number; order: number } | undefined;
  for (const rule of rules) {
    if (rule.media !== undefined && rule.media.includes('print')) continue;
    if (rule.declarations[property] === undefined) continue;
    let matches = false;
    try {
      matches = element.matches(rule.selector);
    } catch {
      // A selector jsdom cannot parse is skipped rather than failing the run.
      continue;
    }
    if (!matches) continue;
    const w = weight(rule.selector);
    if (best === undefined || w > best.weight || (w === best.weight && rule.order > best.order)) {
      best = {
        value: rule.declarations[property] as string,
        selector: rule.selector,
        weight: w,
        order: rule.order,
      };
    }
  }
  return best === undefined ? undefined : { value: best.value, selector: best.selector };
}

/** The nearest declared font-size, walking up as the cascade would inherit. */
export function effectiveFontSize(
  element: Element,
  rules: readonly Rule[],
): { px: number; selector: string } | undefined {
  let node: Element | null = element;
  while (node !== null) {
    const found = declared(node, 'font-size', rules);
    if (found !== undefined) {
      const px = Number.parseFloat(found.value);
      if (found.value.endsWith('px') && Number.isFinite(px)) {
        return { px, selector: found.selector };
      }
      return undefined;
    }
    node = node.parentElement;
  }
  return undefined;
}
