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
const index = join(dist, 'app', 'index.html');
const welcome = join(dist, 'index.html');

/** docs/05-architecture.md. In bytes, because that is what we measure. */
const BUDGET = 150 * 1024;

/**
 * The welcome page has a budget of its own, and a tighter one.
 *
 * It is the first thing a stranger loads, often on a phone on mobile data, and they
 * have no reason yet to wait for it. The app's 150 kB is the price of a tool somebody
 * chose; this is the price of an introduction.
 */
const WELCOME_BUDGET = 100 * 1024;

/**
 * The pictures on the welcome page, budgeted apart from it.
 *
 * They are `loading="lazy"`, so they are not what stands between a stranger and
 * being able to read the page — that is the 100 kB above, and it stays where it
 * was. But they are still bytes on somebody's mobile data, and a budget that
 * could not see them at all was the reason this needed writing: the script
 * counted `<script src>` and `<link href>` only, so three screenshots could have
 * been added to the first page anybody sees without moving a number anywhere.
 */
const IMAGE_BUDGET = 200 * 1024;

/**
 * The benchmark prototype at /bench/, budgeted as the app is.
 *
 * It is the page the owner holds on a phone to decide how the phone apps get
 * built, so how fast it opens is part of what is being judged. It bundles its
 * typeface (ADR-047), which is the largest thing it loads: a woff2 is already
 * compressed and gains nothing from gzip, so fonts are counted as served rather
 * than gzipped, which is what a phone actually downloads.
 */
const BENCH_BUDGET = 150 * 1024;

/**
 * The single file is not in that budget — it is one document with everything
 * inlined, which is the whole point of it, and ADR-003 accepts the size. It is
 * printed so a jump in it is visible, and held well clear of the limits mail
 * and chat clients put on an attachment.
 */
const SINGLE_LIMIT = 1024 * 1024;

if (!existsSync(index)) {
  console.error('No dist/app/index.html. Run `npm run build` first.');
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

console.log(`The app's initial load, gzipped (budget ${kb(BUDGET)}):`);
for (const part of parts.sort((a, b) => b.bytes - a.bytes)) {
  console.log(`  ${part.name.padEnd(34)} ${kb(part.bytes).padStart(9)}`);
}
console.log(`  ${'total'.padEnd(34)} ${kb(total).padStart(9)}`);

/**
 * The welcome page, measured the same way and budgeted separately.
 *
 * Before this existed the script measured whatever sat at `dist/index.html`. When
 * the app moved to `/app/` that became the welcome page, and it reported 4.4 kB
 * of 150 kB with 145 kB to spare — passing, loudly, while measuring nothing
 * anybody had budgeted.
 */
let welcomeTotal = 0;
let imageTotal = 0;
if (existsSync(welcome)) {
  const page = readFileSync(welcome, 'utf8');
  welcomeTotal = gz(Buffer.from(page));

  const resolve_ = (reference) => join(dist, reference.replace(/^\.?\//, ''));
  const local = (reference) =>
    reference !== '' && !reference.startsWith('data:') && !/^(https?:)?\/\//.test(reference);

  for (const match of [
    ...page.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...page.matchAll(/<link[^>]+href="([^"]+)"/g),
  ]) {
    const reference = match[1] ?? '';
    if (!local(reference)) continue;
    const path = resolve_(reference);
    if (existsSync(path)) welcomeTotal += gz(readFileSync(path));
  }

  /*
   * Images are counted, and a missing one fails rather than costing nothing.
   *
   * WebP and PNG are already compressed, so gzip is not applied twice — that
   * would report a figure smaller than the file a browser actually downloads.
   * An image the page asks for and the build does not have is a broken picture
   * on the first page a stranger sees, which is worth more than a warning.
   */
  for (const match of page.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const reference = match[1] ?? '';
    if (!local(reference)) continue;
    const path = resolve_(reference);
    if (!existsSync(path)) {
      console.error(`The welcome page asks for an image the build has not got: ${reference}`);
      process.exit(1);
    }
    imageTotal += statSync(path).size;
  }

  console.log(`\nThe welcome page, gzipped (budget ${kb(WELCOME_BUDGET)}): ${kb(welcomeTotal)}`);
  console.log(`Its pictures, as served (budget ${kb(IMAGE_BUDGET)}): ${kb(imageTotal)}`);
}

/**
 * The prototype: its document, everything it asks for, and every font its
 * stylesheets name.
 *
 * Two ways a font can go wrong without anything else noticing, and both fail
 * here. A font the CSS names and the build has not got is text falling back to
 * the system face on the phone, which is the one place the typeface is being
 * judged. And a font inlined as a data: URI is refused outright by the page's
 * `font-src 'self'`, so it would cost bytes and never be used. Vite inlines
 * assets under its 4 kB limit, so a small enough subset would do exactly that.
 */
const benchIndex = join(dist, 'bench', 'index.html');
if (!existsSync(benchIndex)) {
  console.error(
    'No dist/bench/index.html. vite.config.ts builds the prototype as an input of the PWA ' +
      'build; if it has gone on purpose, take its section out of this script too.',
  );
  process.exit(1);
}

const benchHtml = readFileSync(benchIndex, 'utf8');
const benchParts = [{ name: 'bench/index.html', bytes: gz(Buffer.from(benchHtml)) }];
const benchSeen = new Set();
const fontsSeen = new Set();

/** A reference as written in a file served from `from`, resolved to a path in dist/. */
function inDist(reference, from) {
  const clean = reference.split(/[?#]/)[0];
  return clean.startsWith('/') ? join(dist, clean) : join(dirname(from), clean);
}

for (const match of [
  ...benchHtml.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...benchHtml.matchAll(/<link[^>]+href="([^"]+)"/g),
]) {
  const reference = match[1] ?? '';
  if (reference.startsWith('data:')) continue;
  if (/^(https?:)?\/\//.test(reference)) {
    console.error(`Remote reference in dist/bench/index.html: ${reference}`);
    process.exit(1);
  }
  const path = inDist(reference, benchIndex);
  if (benchSeen.has(path)) continue;
  benchSeen.add(path);
  if (!existsSync(path)) {
    console.error(`dist/bench/index.html references a file that is not in the build: ${reference}`);
    process.exit(1);
  }
  const bytes = readFileSync(path);
  benchParts.push({ name: path.slice(dist.length + 1), bytes: gz(bytes) });

  if (!path.endsWith('.css')) continue;
  for (const font of bytes.toString('utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const url = font[1] ?? '';
    if (/^data:(?:font\/|application\/(?:x-)?font)/i.test(url)) {
      console.error(
        `${path.slice(dist.length + 1)} inlines a font as a data: URI, which the page's ` +
          "font-src 'self' refuses. It has to ship as a file: see build.assetsInlineLimit.",
      );
      process.exit(1);
    }
    if (!/\.(?:woff2?|ttf|otf)$/i.test(url.split(/[?#]/)[0])) continue;
    const fontPath = inDist(url, path);
    if (fontsSeen.has(fontPath)) continue;
    fontsSeen.add(fontPath);
    if (!existsSync(fontPath)) {
      console.error(`${path.slice(dist.length + 1)} names a font that is not in the build: ${url}`);
      process.exit(1);
    }
    // As served: a woff2 is compressed already.
    benchParts.push({
      name: `${fontPath.slice(dist.length + 1)} (as served)`,
      bytes: statSync(fontPath).size,
    });
  }
}

const benchTotal = benchParts.reduce((sum, part) => sum + part.bytes, 0);
console.log(`\nThe prototype at /bench/, gzipped, fonts as served (budget ${kb(BENCH_BUDGET)}):`);
for (const part of benchParts.sort((a, b) => b.bytes - a.bytes)) {
  console.log(`  ${part.name.padEnd(48)} ${kb(part.bytes).padStart(9)}`);
}
console.log(`  ${'total'.padEnd(48)} ${kb(benchTotal).padStart(9)}`);

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

  // The app's worker keeps the app. vite.config.ts's globIgnores keeps the
  // prototype's own chunks out of it; this is what notices if that stops.
  const prototype = precached.filter((url) => /(^|\/)assets\/bench-/.test(url ?? ''));
  if (prototype.length > 0) {
    console.error(
      `The app's service worker precaches the prototype: ${prototype.join(', ')}. ` +
        'Every phone that opened the app would download and keep it.',
    );
    process.exit(1);
  }
}

const single = resolve(root, 'dist-single/adnotia.html');
if (existsSync(single)) {
  console.log(
    `Single file: ${kb(statSync(single).size)} on disk, ${kb(gz(readFileSync(single)))} gzipped.`,
  );
}

if (imageTotal > IMAGE_BUDGET) {
  console.error(
    `\nThe welcome page's pictures are over their ${kb(IMAGE_BUDGET)} budget by ` +
      `${kb(imageTotal - IMAGE_BUDGET)}. scripts/shots.mjs makes them; they get smaller by ` +
      'shipping fewer, or narrower, not by lowering this.',
  );
  process.exit(1);
}

if (welcomeTotal > WELCOME_BUDGET) {
  console.error(
    `\nThe welcome page is over its ${kb(WELCOME_BUDGET)} budget by ` +
      `${kb(welcomeTotal - WELCOME_BUDGET)}. It is an introduction, loaded by somebody with ` +
      'no reason yet to wait for it.',
  );
  process.exit(1);
}

if (benchTotal > BENCH_BUDGET) {
  console.error(
    `\nThe prototype is over its ${kb(BENCH_BUDGET)} budget by ${kb(benchTotal - BENCH_BUDGET)}. ` +
      'Its typeface is the largest part of it; a subset is smaller, a second face is not.',
  );
  process.exit(1);
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
