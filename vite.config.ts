import { createHash } from 'node:crypto';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Copies deploy/_headers into the build output. Cloudflare Pages and Netlify
// read it from the output root and turn it into real response headers, which is
// the only way frame-ancestors can be enforced: a <meta> CSP cannot do it.
// The single-file build gets none of this, having no host.
function deployHeaders(): Plugin {
  return {
    name: 'adnotia:deploy-headers',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir ?? resolve('dist');
      await copyFile(resolve('deploy/_headers'), resolve(outDir, '_headers'));
    },
  };
}

// The tab icon and the home-screen icon, inlined into index.html at build time.
//
// docs/07-design-system.md makes assets/logo.svg canonical and says not to embed
// the original raster, so neither is pasted into index.html by hand. They cannot
// be plain <link href> either: the single-file build has to work when saved to a
// disk with nothing beside it, and finish-single.mjs rejects a build that still
// points at anything outside itself.
//
// Inlining them as data: URIs satisfies both. The CSP already allows `img-src
// 'self' data:`, so no policy changes to let an icon through.
function inlineIcons(): Plugin {
  return {
    name: 'adnotia:inline-icons',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        // The app only. The welcome page is a document a person reads once and
        // its mark is inline in the source; giving it the app's tab icon would
        // also trip the test that keeps hand-written icon links out of a shell.
        if (!context.path.includes('app/')) return html;
        const svg = await readFile(resolve('assets/logo.svg'), 'utf8');
        const png = await readFile(resolve('assets/icon-180.png'));
        // encodeURIComponent rather than base64: an SVG data URI stays readable
        // in view-source, and is smaller.
        const mark = `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
        const home = `data:image/png;base64,${png.toString('base64')}`;
        return html.replace(
          '<title>',
          `<link rel="icon" href="${mark}" type="image/svg+xml" />\n    ` +
            `<link rel="apple-touch-icon" href="${home}" />\n    <title>`,
        );
      },
    },
  };
}

/**
 * Keeps the app's plumbing off the welcome page.
 *
 * vite-plugin-pwa injects a manifest link and the service-worker registration
 * into every HTML entry it finds. On the welcome page both are wrong: it is a
 * page a stranger reads, not an installable app, and it must not be the document
 * that registers a worker.
 *
 * This runs on the written file rather than through `transformIndexHtml`,
 * because the plugin injects after every such hook and a tidier-looking version
 * of this silently removed nothing. It throws when it finds nothing to remove,
 * so the day the plugin changes its markup this fails the build instead of
 * quietly shipping a welcome page that registers a service worker.
 */
function appPlumbingOnly(): Plugin {
  return {
    name: 'adnotia:app-plumbing-only',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir ?? resolve('dist');
      const welcome = resolve(outDir, 'index.html');
      const html = await readFile(welcome, 'utf8');
      /*
       * The welcome page's own CSP says `script-src 'self'`, which blocks an
       * inline script outright. Its redirect is inline on purpose — it has to
       * run before anything paints, and a separate file would mean a request and
       * a flash of a page not meant for that person — so the policy has to name
       * the script by hash. Same technique as scripts/finish-single.mjs.
       */
      const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
      if (inline === undefined) {
        throw new Error('The welcome page has no inline script to authorise.');
      }
      const hash = `'sha256-${createHash('sha256').update(inline, 'utf8').digest('base64')}'`;
      const withHash = html.replace("script-src 'self'", `script-src 'self' ${hash}`);
      if (withHash === html) {
        throw new Error('Could not find "script-src \'self\'" in the welcome page CSP.');
      }

      const stripped = withHash
        .replace(/\s*<link rel="manifest"[^>]*>/g, '')
        .replace(/\s*<script[^>]*register-sw[^>]*>\s*<\/script>/g, '');
      if (stripped === withHash) {
        throw new Error(
          'The welcome page carries no manifest link or service-worker registration to ' +
            'remove. Either vite-plugin-pwa stopped injecting them, or its markup changed ' +
            'and this plugin is now a no-op protecting nothing.',
        );
      }
      await writeFile(welcome, stripped, 'utf8');
    },
  };
}

// Two build outputs from one source. See docs/decisions/ADR-003-pwa-plus-single-file.md.
//
//   vite build                 -> dist/         installable PWA, service worker, hashed assets
//   vite build --mode single   -> dist-single/  one self-contained file
//
// scripts/finish-single.mjs renames the single-file output to adnotia.html and
// tightens its CSP around the inlined script.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';

  return {
    /*
     * The single file is opened from wherever a person put it, so its links have
     * to be relative. The PWA is served from a known origin root and is now two
     * documents at two depths: a relative base resolves `./manifest.webmanifest`
     * against `/app/`, where no such file exists, and the service worker never
     * registers. Absolute is the only base that is right at both depths.
     */
    base: single ? './' : '/',

    // assets/ holds the canonical logo and home-screen icon. The PWA build serves
    // them as static files; the single-file build must copy nothing at all.
    publicDir: single ? false : 'assets',

    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
      /*
       * Two documents, one origin. `index.html` is the welcome page a stranger
       * lands on; `app/index.html` is the app. Rollup maps an input path to an
       * output path, so this is what puts the app at /app/ and leaves / free.
       *
       * The single-file build has no host and no landing page: it is the app,
       * one document, and finish-single.mjs expects exactly that.
       */
      rollupOptions: {
        input: single
          ? { app: resolve('app/index.html') }
          : { home: resolve('index.html'), app: resolve('app/index.html') },
      },
      target: 'es2022',
      cssCodeSplit: !single,
      // The single file inlines everything, however large.
      assetsInlineLimit: single ? Number.MAX_SAFE_INTEGER : 4096,
      modulePreload: single ? { polyfill: false } : {},
      reportCompressedSize: true,
    },

    plugins: single
      ? [inlineIcons(), viteSingleFile()]
      : [
          inlineIcons(),
          deployHeaders(),
          VitePWA({
            registerType: 'autoUpdate',
            // 'script-defer' emits registerSW.js as a real file. An inline
            // registration would need a CSP hash for no benefit.
            injectRegister: 'script-defer',
            includeAssets: ['logo.svg', 'icon-180.png'],
            manifest: {
              name: 'Adnotia',
              short_name: 'Adnotia',
              description:
                'Evidence-based tools for adults with ADHD and for parents of children who may have it. Everything runs in your browser.',
              lang: 'en',
              theme_color: '#EAECE7',
              background_color: '#EAECE7',
              display: 'standalone',
              orientation: 'portrait',
              // Absolute, not './'. A relative start_url resolves against the
              // manifest's own location, and an installed shortcut that opened
              // the welcome page would be a shortcut to a page for strangers.
              start_url: '/app/',
              scope: '/app/',
              icons: [
                {
                  src: 'icon-180.png',
                  sizes: '180x180',
                  type: 'image/png',
                  purpose: 'any',
                },
              ],
            },
            workbox: {
              /*
               * The app's files, not the site's. Without the `app/` prefix this
               * sweeps the welcome page into the app's precache and versions it
               * with the app.
               */
              globPatterns: [
                'app/**/*.{js,css,html}',
                'assets/**/*.{js,css}',
                '*.{svg,png,webmanifest}',
              ],
              navigateFallback: 'app/index.html',
              /*
               * The reason the welcome page survives at all.
               *
               * A NavigationRoute with no denylist answers *every* navigation
               * inside the service worker's scope from the precached app shell.
               * Registered at the origin root that includes `/`, so the first
               * person to open the app would find the welcome page replaced by
               * it — online and offline, for as long as the registration lived,
               * with nothing in the build to say so.
               */
              navigateFallbackDenylist: [/^\/$/, /^\/index\.html$/, /^\/\?/],
              // There is nothing to fetch at runtime, so there is nothing to cache
              // at runtime either.
              runtimeCaching: [],
            },
          }),
          appPlumbingOnly(),
        ],
  };
});
