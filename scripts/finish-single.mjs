// Finishes the single-file build.
//
// vite-plugin-singlefile inlines every script and stylesheet into one document.
// Two things remain:
//
//   1. The CSP in index.html says script-src 'self', which would block an inline
//      script. Each inlined script is hashed and the hash added to the directive,
//      so the single file keeps the same guarantees as the PWA build rather than
//      loosening the policy to 'unsafe-inline'.
//   2. The output is named adnotia.html, which is what people download and keep.
//
// See docs/decisions/ADR-003-pwa-plus-single-file.md and docs/05-architecture.md.

import { createHash } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve(import.meta.dirname, '..', 'dist-single');
const input = resolve(outDir, 'index.html');
const output = resolve(outDir, 'adnotia.html');

let html = await readFile(input, 'utf8');

// Hash every inline script. Scripts with a src attribute have no body to hash;
// if any survive, the build is not self-contained and we say so below.
const hashes = [];
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const [, attributes = '', body = ''] = match;
  if (/\bsrc\s*=/i.test(attributes)) continue;
  if (body.trim() === '') continue;
  hashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
}

const before = html;
html = html.replace(/script-src 'self'/, `script-src 'self' ${hashes.join(' ')}`);
if (hashes.length > 0 && html === before) {
  throw new Error("Could not find \"script-src 'self'\" in the CSP to add script hashes to.");
}

// Self-containment check. Anything still pointing off the device is a bug, not a
// warning: this file is meant to work with no network at all.
const external = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
  .map((m) => m[1] ?? '')
  .filter((url) => /^(?:https?:)?\/\//i.test(url));

if (external.length > 0) {
  throw new Error(`Single-file build references external URLs: ${external.join(', ')}`);
}

await writeFile(output, html, 'utf8');
await rm(input, { force: true });

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(
  `dist-single/adnotia.html  ${kb} kB  ` +
    `(${hashes.length} inline script${hashes.length === 1 ? '' : 's'} hashed into the CSP)`,
);
