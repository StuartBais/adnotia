// Contrast check.
//
// docs/07-design-system.md states the ratios and requires ≥ 4.5:1 for every
// text-on-surface pair the design system uses. This reads src/styles/tokens.css,
// computes the WCAG 2.1 ratio for each pair and fails the build if one drops.
//
// It also reports where a measured ratio disagrees with the table in the design
// document, because a stale figure there is a bug in the document.
//
// Part of `npm run check`.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');

/** Pairs from docs/07-design-system.md, with the ratio the document claims. */
const PAIRS = [
  { text: 'ink', on: 'paper', documented: 12.9 },
  { text: 'ink2', on: 'paper', documented: 5.8 },
  { text: 'mark', on: 'paper', documented: 6.6 },
  { text: '#FFFFFF', on: 'mark', documented: 7.0, label: 'white' },
  { text: 'flag', on: 'flag-soft', documented: 5.1 },
  { text: 'terra-deep', on: 'paper', documented: 5.1 },
  { text: 'ink', on: 'ground', documented: 11.4 },
  { text: 'ink2', on: 'ground', documented: 5.2 },
  // Not in the document's table, but both are real surfaces for the accent.
  { text: 'mark', on: 'ground' },
  { text: 'mark', on: 'mark-soft' },
];

const MINIMUM = 4.5;

function token(name) {
  if (name.startsWith('#')) return name;
  const match = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{3,8})\\s*;`));
  if (!match) throw new Error(`tokens.css has no colour token --${name}`);
  return match[1];
}

function channels(hex) {
  let value = hex.slice(1);
  if (value.length === 3) value = [...value].map((c) => c + c).join('');
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = channels(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const failures = [];
const drifted = [];
const rows = [];

for (const pair of PAIRS) {
  const name = pair.label ?? pair.text;
  const measured = ratio(token(pair.text), token(pair.on));
  const rounded = Math.round(measured * 10) / 10;
  rows.push(`  ${`${name} on ${pair.on}`.padEnd(26)} ${rounded.toFixed(1)}:1`);

  if (measured < MINIMUM) {
    failures.push(`${name} on ${pair.on} is ${rounded.toFixed(1)}:1, below ${MINIMUM}:1`);
  }
  if (pair.documented !== undefined && Math.abs(rounded - pair.documented) > 0.15) {
    drifted.push(
      `${name} on ${pair.on} measures ${rounded.toFixed(1)}:1, ` +
        `but docs/07-design-system.md says ${pair.documented.toFixed(1)}:1`,
    );
  }
}

console.log(`Contrast, ${PAIRS.length} pairs:`);
console.log(rows.join('\n'));

if (drifted.length > 0) {
  console.warn('\nThe design document disagrees with the tokens:');
  for (const line of drifted) console.warn(`  ${line}`);
}

if (failures.length > 0) {
  console.error('\nContrast check failed. See docs/07-design-system.md "Colour".\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`\nAll pairs at or above ${MINIMUM}:1.`);
