// The screenshots on the welcome page, taken from the built app.
//
// docs/07-design-system.md said "The logo mark is the only graphic" and now says
// what ADR-037 decided instead. The short version is that the one honest picture
// of this app is the app, and the only way a picture of it stays honest is if
// nobody draws it by hand. So these are generated: a real build, a real record,
// a real browser, and a script anybody can re-run.
//
//   npm run build && npm run shots
//
// Not part of `npm run build`. It needs Chromium and ImageMagick, which CI has
// no reason to install, and the output is committed — the welcome page is a
// static page and must not depend on a browser being present to deploy it.
//
// Two things downstream keep the page and these images honest with each other.
// `scripts/shots/manifest.json`, written at the end of this, carries each shot's
// alt text and real dimensions, and tests/kernel/welcome.test.ts compares the
// page against it. scripts/check-budget.mjs fails a build whose welcome page
// asks for an image that is not there.
//
// SHOTS_KEEP=<dir> keeps the full-page captures instead of deleting them, which
// is how you find out what Chromium actually saw when a shot comes out wrong.

import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const outDir = join(root, 'assets/shots');

/**
 * A phone's width, captured at Chromium's 2x device scale, then shipped at
 * roughly twice the 260 px the welcome page shows them at. Sharp on a phone
 * without sending a 780 px image to fill a 260 px slot.
 */
const CAPTURE_WIDTH = 390;
const SHIP_WIDTH = 640;

/**
 * What to photograph, and how to get there.
 *
 * `drive` runs in the page after the app has mounted. There is no deep-link
 * routing in the shell — deliberately, see src/kernel/shell/router.ts — so the
 * only honest way to reach a screen is to press the things a person presses.
 * If a label here stops matching the interface, `press` throws and the shot
 * fails rather than quietly photographing the landing tab three times.
 */
const SHOTS = [
  {
    name: 'tools',
    alt: 'The Adnotia tools index on a phone, showing cards for Focus and starting, Calm, Movement, Medication and body, and Preparing for an appointment.',
    height: 760,
    drive: '',
  },
  {
    name: 'today',
    alt: "Adnotia's Today tab, showing the day's record: a check-in with a few questions, and a list of what already happened today.",
    height: 760,
    drive: `press('[role=tab]', 'Today');`,
  },
  {
    name: 'sheet',
    alt: 'The one-page record Adnotia prepares for an appointment, headed with the Adnotia mark, the dates it covers and how many days were logged, above a table of what was recorded.',
    // Taller than the others: once the sheet is on its own it is a long
    // document, and Chromium captures exactly the window it is given.
    height: 1000,
    // The clinical report opens from the area whose modules contribute to it,
    // which is "Medication and body" and not, despite the name, "Preparing for
    // an appointment". See rowsFor() in src/kernel/shell/areaIndex.ts.
    drive: `press('*', 'Medication and body'); press('*', 'For an appointment');`,
    // Then the sheet on its own, which is what "one page to take with you"
    // means. src/styles/print.css already sets everything that is not the sheet
    // to display:none, so this is not a staged screen: it is the document as it
    // comes out, without the mirror and the export buttons that never print.
    isolate: '.sheet',
  },
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited ${result.status}\n${result.stderr ?? ''}`);
  }
  return result;
}

/**
 * Async, and that is not a style preference.
 *
 * The static server below runs in this process, so anything that blocks the
 * event loop stops it answering. Chromium under `spawnSync` therefore waits
 * forever for a first byte that cannot arrive until Chromium exits — a hang with
 * no output and nothing in either log to say why.
 */
function runAsync(command, args) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', fail);
    child.on('close', (status) => {
      if (status === 0) ok();
      else fail(new Error(`${command} exited ${status}\n${stderr}`));
    });
  });
}

function need(command, why) {
  if (spawnSync('sh', ['-c', `command -v ${command}`]).status !== 0) {
    throw new Error(`${command} is not installed, and ${why}.`);
  }
}

/**
 * The seed document, built by bundling scripts/shots/seed.ts through the
 * esbuild that Vite already installs.
 *
 * The bundle is the point rather than an inconvenience: seed.ts imports the
 * modules' real fixtures, so a renamed field is a build error here instead of an
 * empty-looking screenshot nobody notices until it is on the front page.
 */
async function buildSeed(work) {
  const bundle = join(work, 'seed.mjs');
  run(join(root, 'node_modules/.bin/esbuild'), [
    join(root, 'scripts/shots/seed.ts'),
    '--bundle',
    '--format=esm',
    '--platform=node',
    `--outfile=${bundle}`,
    '--log-level=warning',
  ]);
  return import(pathToFileURL(bundle).href);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Serves dist/ to Chromium, with two changes to the app as built.
 *
 * It injects one classic script into the app shell, ahead of the module script,
 * which seeds storage and freezes the clock. Classic and external, in that
 * order, because the app's script is a module and so deferred, and because the
 * shell's CSP is `script-src 'self'` and an inline one would need a hash.
 *
 * And it refuses to serve the service worker. A worker that installed on the
 * first shot would answer the next one out of its own cache, which is a real
 * behaviour of the real app and exactly the wrong thing to photograph through.
 */
function serve(seedJs, failures) {
  const server = createServer((request, response) => {
    // An unhandled rejection in here would leave Chromium waiting on a socket
    // that never answers, which looks exactly like a hang. Say what broke.
    handle(request, response).catch((error) => {
      console.error(`Failed serving ${request.url}: ${error.message}`);
      if (!response.headersSent) response.writeHead(500);
      response.end('failed');
    });
  });

  async function handle(request, response) {
    const url = new URL(request.url, 'http://127.0.0.1');
    const path = url.pathname;

    if (path === '/__shot.js') {
      response.writeHead(200, { 'content-type': TYPES['.js'] });
      response.end(
        seedJs(
          url.searchParams.get('shot') ?? '',
          url.searchParams.get('drive') ?? '',
          url.searchParams.get('after') ?? '',
        ),
      );
      return;
    }
    if (path === '/__failed') {
      failures.push(`${url.searchParams.get('shot')}: ${url.searchParams.get('why')}`);
      response.writeHead(204).end();
      return;
    }
    if (path === '/sw.js' || path === '/registerSW.js') {
      response.writeHead(404).end('not in a screenshot');
      return;
    }

    // A directory is a request for its index.html: the app is served at /app/.
    const asked = join(dist, path.replace(/^\/+/, ''));
    const file = path.endsWith('/') ? join(asked, 'index.html') : asked;
    if (!file.startsWith(dist) || !existsSync(file)) {
      response.writeHead(404).end('no');
      return;
    }
    let body = await readFile(file);
    if (file.endsWith('app/index.html')) {
      const html = body.toString('utf8');
      const injected = html.replace(
        '<script type="module"',
        `<script src="/__shot.js${url.search}"></script>\n    <script type="module"`,
      );
      if (injected === html) throw new Error("Could not find the app shell's module script.");
      body = Buffer.from(injected, 'utf8');
    }
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  }

  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

/**
 * The script injected ahead of the app: the record, the clock, and the driving.
 *
 * The clock is frozen so that regenerating these is reproducible. Today shows
 * the logging day, the fixtures end on 30 September 2026, and without this every
 * shot but one would be of an app with nothing entered — and the images would
 * differ every day they were regenerated, so a diff would never mean anything.
 */
function seedScript(document, pinned) {
  return (name, drive, after) => `
(function () {
  var NAME = ${JSON.stringify(name)};
  localStorage.clear();
  localStorage.setItem('adnotia-v1', ${JSON.stringify(JSON.stringify(document))});

  var PINNED = new Date(${JSON.stringify(pinned)}).getTime();
  var Real = Date;
  function Frozen(...args) {
    if (!(this instanceof Frozen)) return new Real(PINNED).toString();
    return args.length === 0 ? new Real(PINNED) : new Real(...args);
  }
  Frozen.prototype = Real.prototype;
  Frozen.now = function () { return PINNED; };
  Frozen.parse = Real.parse;
  Frozen.UTC = Real.UTC;
  Object.setPrototypeOf(Frozen, Real);
  Date = Frozen;

  function press(selector, text) {
    var wanted = text.toLowerCase();
    var matches = Array.prototype.filter.call(
      document.querySelectorAll(selector),
      function (node) {
        return (node.textContent || '').trim().toLowerCase().indexOf(wanted) === 0;
      },
    );
    // The smallest match. '*' matches every ancestor of the thing as well, and
    // the outermost of those is <html>, which is not a button.
    matches.sort(function (a, b) {
      return (a.textContent || '').length - (b.textContent || '').length;
    });
    if (matches.length === 0) throw new Error('Nothing to press for: ' + text);
    var found = matches[0];
    (found.closest('button, a, [role=tab], [tabindex]') || found).click();
  }

  /*
   * How a broken shot gets reported.
   *
   * The driving runs inside a timeout, so a throw in it is an uncaught error
   * that stops nothing: Chromium captures the screen it was already on and the
   * run passes. That happened once already -- one shot was of an area page
   * nobody asked for, and only looking at the image showed it.
   *
   * The app's CSP sets connect-src to none, which is the whole point of it, so
   * there is no fetch to report with. An image request is allowed by img-src
   * self, and the server counts it as a failure.
   */
  function report(message) {
    new Image().src = '/__failed?shot=' + encodeURIComponent(NAME) +
      '&why=' + encodeURIComponent(message);
  }

  addEventListener('error', function (event) {
    report(event.message || 'an error with no message');
  });

  /*
   * Everything but this, gone.
   *
   * Chromium screenshots the document from the top however the page is
   * scrolled, so reaching something further down would otherwise mean cropping
   * to a measured offset — and that offset moved between the measurement and
   * the capture, which put the crop 42 pixels into the card above and was
   * invisible until somebody looked at the picture.
   *
   * This has no offset to get wrong, and it is what print.css does: the sheet
   * is the only thing that prints.
   */
  function isolate(selector) {
    var target = document.querySelector(selector);
    if (!target) throw new Error('Nothing to isolate: ' + selector);
    document.body.replaceChildren(target);
    document.body.style.padding = '14px';
  }

  addEventListener('load', function () {
    setTimeout(function () {
      try {
        ${drive}
      } catch (error) {
        report(error && error.message ? error.message : String(error));
        return;
      }
      // A tick later, and not in the same breath as the driving: whatever the
      // report draws settles after the click that opened it, and this has to see
      // the finished page. Virtual time makes the wait free.
      setTimeout(function () {
        try {
          ${after}
        } catch (error) {
          report(error && error.message ? error.message : String(error));
          return;
        }
        document.documentElement.setAttribute('data-shot-ready', '');
      }, 500);
    }, 0);
  });
})();
`;
}

async function main() {
  need('chromium-browser', 'the screenshots are taken in a real browser');
  need('magick', 'the captures are resized and converted to WebP');
  if (!existsSync(join(dist, 'app/index.html'))) {
    throw new Error('No dist/app/index.html. Run `npm run build` first.');
  }

  const work = process.env['SHOTS_KEEP'] ?? (await mkdtemp(join(tmpdir(), 'adnotia-shots-')));
  await mkdir(work, { recursive: true });
  const { seedDocument, PINNED } = await buildSeed(work);
  const failures = [];
  const server = await serve(seedScript(seedDocument(), PINNED), failures);
  const port = server.address().port;
  await mkdir(outDir, { recursive: true });

  try {
    for (const shot of SHOTS) {
      const raw = join(work, `${shot.name}.png`);
      await runAsync('chromium-browser', [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=2',
        /*
         * Deterministic text, and better-looking text.
         *
         * Subpixel antialiasing is not reproducible run to run: today.webp came
         * out with different bytes about one run in five, entirely below a 5%
         * intensity threshold — no layout change, no content change, just the
         * rasteriser landing differently. That made the reproducibility this
         * script is built on nearly true, which is the least useful kind.
         *
         * Turning it off also removes the colour fringing that LCD text leaves
         * on glyph edges, which is visible as tinted words once one of these is
         * scaled down on the welcome page.
         */
        '--disable-lcd-text',
        '--font-render-hinting=none',
        // Paint everything before the capture rather than whatever the
        // compositor had ready. Without it the text inside native form controls
        // rasterised one of two ways depending on timing — invisible, and enough
        // to change the bytes on about a third of runs.
        '--run-all-compositor-stages-before-draw',
        '--disable-partial-raster',
        `--window-size=${CAPTURE_WIDTH},${shot.height}`,
        // Runs the page's timers to exhaustion, then captures. Without it the
        // shot lands before `drive` has pressed anything.
        '--virtual-time-budget=8000',
        `--screenshot=${raw}`,
        `http://127.0.0.1:${port}/app/?shot=${shot.name}` +
          `&drive=${encodeURIComponent(shot.drive)}` +
          `&after=${encodeURIComponent(
            shot.isolate === undefined ? '' : `isolate(${JSON.stringify(shot.isolate)});`,
          )}`,
      ]);

      const out = join(outDir, `${shot.name}.webp`);
      run('magick', [
        raw,
        '-resize',
        `${SHIP_WIDTH}x`,
        '-quality',
        '82',
        '-define',
        'webp:method=6',
        out,
      ]);
      const bytes = (await readFile(out)).length;
      console.log(`  ${`${shot.name}.webp`.padEnd(14)} ${(bytes / 1024).toFixed(1)} kB`);
    }
  } finally {
    server.close();
    if (process.env['SHOTS_KEEP'] === undefined) await rm(work, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    throw new Error(
      `The interface did not do what these shots expected, so the images are of the\n` +
        `wrong screens. Fix the drive steps in SHOTS, not the images.\n\n  ` +
        failures.join('\n  '),
    );
  }

  /*
   * What the welcome page needs to know about each picture, written down beside
   * the pictures.
   *
   * The alt text belongs here rather than in the HTML because it describes what
   * was photographed, and goes stale in the same moment the photograph does. The
   * dimensions are here because a page that states them reserves the space
   * before the image arrives, and a page that guesses them jumps under somebody
   * as they start reading.
   *
   * tests/kernel/welcome.test.ts compares this to the page. Regenerate a shot of
   * something else and forget to say so, and the test says so instead.
   */
  const manifest = {};
  for (const shot of SHOTS) {
    const size = run('magick', ['identify', '-format', '%w %h', join(outDir, `${shot.name}.webp`)]);
    const [width, height] = size.stdout.trim().split(' ').map(Number);
    manifest[shot.name] = { alt: shot.alt, width, height };
  }
  // Beside the script, not beside the images: assets/ is the site's public
  // directory and everything in it is served. This is build metadata for a test,
  // and there is no reason to deploy it.
  await writeFile(
    join(root, 'scripts/shots/manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log('\nWritten to assets/shots/. Commit them: the welcome page is static.');
}

await main();
