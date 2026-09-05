import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
      ? [viteSingleFile()]
      : [
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
              theme_color: '#F3EDE2',
              background_color: '#F3EDE2',
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
