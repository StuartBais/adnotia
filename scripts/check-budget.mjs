// Performance budget.
//
// docs/05-architecture.md: "Initial load ≤ 150 kB compressed for the PWA
// including all modules. If a module pushes past that, lazy-load its `tools`
// and `reports` renderers; `today` fields and `library` entries stay eager
// because first run needs them."
//
// Two things follow from how that sentence is written, and both are why this is
// a script rather than a number somebody checks at release.
//
// "Including all modules" means the budget is a property of the whole build, so
// it can only be broken by a module that was fine on its own. Nobody notices
// that in review.
//
// "Initial load" means what the browser must fetch before the app is usable,
// not everything the service worker precaches for later. Those differ — the
// precache carries icons and the worker itself — so this counts what
// dist/index.html actually asks for, and reports the precache separately rather
// than budgeting it.
//
// Compressed means gzip. Every static host and every Cloudflare origin serves
// these compressed, so an uncompressed figure is a number nobody's phone ever
// downloads. Brotli would be smaller still, which makes gzip the safe one to
// hold the line at.
//
// Run after a build, by CI and by `npm run build:check`.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve, dirname, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const index = join(dist, 'index.html');

/** docs/05-architecture.md. In bytes, because that is what we measure. */
const BUDGET = 150 * 1024;

/**
 * The single file is not in that budget — it is one document with everything
 * inlined, which is the whole point of it, and ADR-003 accepts the size. It is
 * printed so a jump in it is visible, and held well clear of the limits mail
 * and chat clients put on an attachment.
 */
const SINGLE_LIMIT = 1024 * 1024;

if (!existsSync(index)) {
  console.error('No dist/index.html. Run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(index, 'utf8');
const gz = (bytes) => gzipSync(bytes, { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

// Everything the document asks the browser for. A <link rel="manifest"> and the
// service-worker registration script both count: they are fetched on the first
// load whether or not the person ever installs the app.
const referenced = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
].map((match) => match[1]);

const seen = new Set();
const parts = [];
for (const reference of referenced) {
  // A data: URI is already inside index.html, so its bytes are counted with the
  // document and there is no second file to fetch. The inlined icons are these.
  if (reference.startsWith('data:')) continue;
  if (/^(https?:)?\/\//.test(reference)) {
    // check-no-network.mjs is the authority on this and fails first. Here it
    // would silently drop a remote file out of the budget, so say so instead.
    console.error(`Remote reference in dist/index.html: ${reference}`);
    process.exit(1);
  }
  const path = join(dist, reference.replace(/^\.?\//, ''));
  if (seen.has(path)) continue;
  seen.add(path);
  if (!existsSync(path)) {
    console.error(`dist/index.html references a file that is not in the build: ${reference}`);
    process.exit(1);
  }
  parts.push({ name: reference.replace(/^\.?\//, ''), bytes: gz(readFileSync(path)) });
}

parts.unshift({ name: 'index.html', bytes: gz(Buffer.from(html)) });

const total = parts.reduce((sum, part) => sum + part.bytes, 0);

console.log(`Initial load, gzipped (budget ${kb(BUDGET)}):`);
for (const part of parts.sort((a, b) => b.bytes - a.bytes)) {
  console.log(`  ${part.name.padEnd(34)} ${kb(part.bytes).padStart(9)}`);
}
console.log(`  ${'total'.padEnd(34)} ${kb(total).padStart(9)}`);

// Reported, not budgeted. See the note at the top.
const sw = join(dist, 'sw.js');
if (existsSync(sw)) {
  const precached = [...readFileSync(sw, 'utf8').matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  const precacheBytes = precached
    .map((url) => join(dist, url.replace(/^\.?\//, '')))
    .filter((path) => existsSync(path))
    .reduce((sum, path) => sum + gz(readFileSync(path)), 0);
  console.log(
    `\nPrecached for later, gzipped: ${kb(precacheBytes)} across ${precached.length} files.`,
  );
}

const single = resolve(root, 'dist-single/adnotia.html');
if (existsSync(single)) {
  console.log(
    `Single file: ${kb(statSync(single).size)} on disk, ${kb(gz(readFileSync(single)))} gzipped.`,
  );
}

if (total > BUDGET) {
  console.error(
    `\nOver budget by ${kb(total - BUDGET)}. docs/05-architecture.md says what to do about it: ` +
      "lazy-load a module's tools and reports renderers. today fields and library entries stay eager.",
  );
  process.exit(1);
}

if (existsSync(single) && statSync(single).size > SINGLE_LIMIT) {
  console.error(
    `\nThe single file is over ${kb(SINGLE_LIMIT)}, which is where it stops being mailable.`,
  );
  process.exit(1);
}

console.log(`\nWithin budget, with ${kb(BUDGET - total)} to spare.`);
