// Static no-network audit over the shipped source.
//
// The CSP enforces this in the browser and tests/harness/no-network.ts enforces it
// under test. This catches it earlier: at `npm run check`, before anything runs.
//
// Scope is deliberately narrow — index.html and src/ — because tests/ and
// reference/ mention these APIs legitimately.
//
// Part of `npm run check`, alongside the contrast check. Linting is the one
// piece of `check` still missing; it needs a linter, which is a dependency
// decision for a human.

import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const FORBIDDEN = [
  [/\bfetch\s*\(/, 'fetch()'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bsendBeacon\b/, 'navigator.sendBeacon'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bimportScripts\s*\(/, 'importScripts()'],
  /*
   * A resource the document *loads*. Deliberately not every `href`: an <a> to
   * the source repository fetches nothing until a person chooses to leave, and
   * the About page has carried such links since it was written. What must never
   * appear is a stylesheet, script, font, image or preload from somewhere else.
   */
  [/\bsrc\s*=\s*["'](?:https?:)?\/\//i, 'an external URL loaded by the page'],
  [
    /<link\b(?![^>]*\brel\s*=\s*["'](?:noreferrer|noopener)?["'])[^>]*\bhref\s*=\s*["'](?:https?:)?\/\//i,
    'an external stylesheet, font or preload',
  ],
  [/url\(\s*["']?(?:https?:)?\/\//i, 'an external URL in CSS'],
  [/@import\s+(?:url\()?["']?(?:https?:)?\/\//i, 'an external CSS import'],
];

const EXTENSIONS = ['.ts', '.js', '.mjs', '.css', '.html'];

async function filesUnder(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await filesUnder(path)));
    else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) found.push(path);
  }
  return found;
}

/**
 * Both documents, and both are named rather than globbed.
 *
 * This used to audit one `index.html` and swallow a missing file. When the app
 * moved to `app/index.html` that would have kept printing "audit passed" while
 * checking the welcome page and not the app — hard rule 1 unenforced, silently,
 * with a green tick. A named file that is absent is now a failure.
 */
const REQUIRED = [join(root, 'index.html'), join(root, 'app', 'index.html')];
const targets = [...REQUIRED, ...(await filesUnder(join(root, 'src')))];
const failures = [];

for (const path of targets) {
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    if (REQUIRED.includes(path)) {
      failures.push(
        `${relative(root, path)}  is missing, so this audit was not covering it. ` +
          'Point REQUIRED at wherever it went.',
      );
    }
    continue;
  }
  source.split('\n').forEach((line, index) => {
    for (const [pattern, what] of FORBIDDEN) {
      if (pattern.test(line)) {
        failures.push(`${relative(root, path)}:${index + 1}  ${what}\n    ${line.trim()}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error('No-network audit failed. Adnotia sends nothing anywhere.\n');
  for (const failure of failures) console.error(`  ${failure}\n`);
  console.error('See docs/03-scope.md "Data and privacy commitments".');
  process.exit(1);
}

console.log(`No-network audit passed across ${targets.length} file(s).`);
