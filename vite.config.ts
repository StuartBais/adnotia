import { copyFile, readFile } from 'node:fs/promises';
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
      async handler(html) {
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
    // Relative so both outputs work from a subdirectory, and so the single file
    // works when opened directly.
    base: './',

    // assets/ holds the canonical logo and home-screen icon. The PWA build serves
    // them as static files; the single-file build must copy nothing at all.
    publicDir: single ? false : 'assets',

    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
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
              start_url: './',
              scope: './',
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
              globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
              navigateFallback: 'index.html',
              // There is nothing to fetch at runtime, so there is nothing to cache
              // at runtime either.
              runtimeCaching: [],
            },
          }),
        ],
  };
});
