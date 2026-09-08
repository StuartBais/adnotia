// What the build produced, checked after it produced it.
//
// These were unit tests, and they were the wrong shape for it. They assert
// things about `dist/`, so they can only run once `dist/` exists — and CI runs
// `npm test` before `npm run build`, so all three skipped, every time, silently.
// One of them guards the thing that would otherwise break the welcome page's
// redirect in every real browser while the whole suite stayed green.
//
// A test that never runs is not a guard, and `npm test` has to keep passing on a
// fresh clone with no build (CLAUDE.md's definition of done for Milestone 0). So
// they live here instead, beside the budget check, and run when there is
// something to check.

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const welcomePath = join(dist, 'index.html');
const appPath = join(dist, 'app', 'index.html');

const failures = [];
const fail = (message) => failures.push(message);

for (const path of [welcomePath, appPath]) {
  if (!existsSync(path)) {
    console.error(`No ${path}. Run \`npm run build\` first.`);
    process.exit(1);
  }
}

const welcome = readFileSync(welcomePath, 'utf8');
const app = readFileSync(appPath, 'utf8');

// ---------------------------------------------------------------- the redirect

/*
 * The welcome page's policy is `script-src 'self'`, which blocks an inline
 * script outright. Its redirect is inline deliberately: it has to run before
 * anything paints, and a separate file would mean a request and a flash of a
 * page not meant for that person. So the build authorises it by hash.
 *
 * Nothing in jsdom enforces CSP. Without this check the redirect could be dead
 * on every real browser and every test would still pass.
 */
const inline = /<script>([\s\S]*?)<\/script>/.exec(welcome)?.[1];
if (inline === undefined) {
  fail('The welcome page has no inline script. Its redirect is gone.');
} else {
  const digest = createHash('sha256').update(inline, 'utf8').digest('base64');
  if (!welcome.includes(`'sha256-${digest}'`)) {
    fail(
      "The welcome page's inline script is not authorised by its own CSP hash, so a\n" +
        '    browser will refuse to run it and nobody with a record will be sent to the app.',
    );
  }
  if (!inline.includes('adnotia-v1')) {
    fail('The redirect no longer reads the key the store writes, so it recognises nobody.');
  }
}

const scriptSrc = /script-src([^;]*);/.exec(welcome)?.[1] ?? '';
if (scriptSrc.includes('unsafe-inline')) {
  fail(
    "The welcome page's script-src has fallen back to 'unsafe-inline'. The hash is\n" +
      '    there precisely so that it does not have to.',
  );
}

// ------------------------------------------------------------- what goes where

/*
 * The welcome page is a page a stranger reads, not an installable app, and it
 * must not be the document that registers a service worker. The app is both.
 * Checking each side means the stripping stays targeted rather than becoming
 * indiscriminate.
 */
for (const [what, page, shouldHave] of [
  ['The welcome page', welcome, false],
  ['The app', app, true],
]) {
  for (const [name, pattern] of [
    ['a service-worker registration', /registerSW/],
    ['a manifest link', /rel="manifest"/],
  ]) {
    const has = pattern.test(page);
    if (has !== shouldHave) {
      fail(`${what} ${has ? 'carries' : 'is missing'} ${name}, and should not be.`);
    }
  }
}

// ------------------------------------------------------------------- the guard

/*
 * The service worker answers navigations inside its scope from the app's
 * precache. Without a denylist for the root it would serve the app shell at `/`
 * — replacing the welcome page for anybody who had opened the app once, online
 * and offline, until the registration was removed.
 */
const swPath = join(dist, 'sw.js');
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, 'utf8');
  if (!/denylist/.test(sw)) {
    fail(
      'The service worker has no navigation denylist, so it will answer a request for\n' +
        '    / with the cached app shell and the welcome page disappears.',
    );
  }
}

if (failures.length > 0) {
  console.error('The built output is wrong.\n');
  for (const failure of failures) console.error(`  ${failure}\n`);
  process.exit(1);
}

console.log('Built output checks passed: the redirect is authorised and scoped correctly.');
