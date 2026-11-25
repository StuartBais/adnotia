import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The prototype's page and what it loads (design/lantern/PROTOTYPE-PLAN.md
// sections 9, 13 and 16). It is held on the owner's phone from the same origin
// as the app, so it answers to the same rule: nothing leaves the device, and the
// browser enforces that, not a promise.
//
// Read from the project root: under jsdom, import.meta.url is an http URL and
// cannot find a file on disk.

const root = process.cwd();
const benchHtml = readFileSync(resolve(root, 'bench/index.html'), 'utf8');
const appHtml = readFileSync(resolve(root, 'app/index.html'), 'utf8');
const benchDir = resolve(root, 'src/bench');
const css = readFileSync(join(benchDir, 'bench.css'), 'utf8');

function policy(html: string): Map<string, string> {
  // The delimiter is back-referenced because the policy itself holds quotes.
  const match = html.match(
    /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2\s*\/?>/i,
  );
  if (!match?.[3]) throw new Error('No Content-Security-Policy meta tag');
  const map = new Map<string, string>();
  for (const part of match[3].split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const space = trimmed.indexOf(' ');
    if (space === -1) map.set(trimmed, '');
    else map.set(trimmed.slice(0, space), trimmed.slice(space + 1).trim());
  }
  return map;
}

function meta(name: string): string | undefined {
  const tag = [...benchHtml.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((t) => new RegExp(`\\bname=["']${name}["']`, 'i').test(t));
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1];
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/** `url(...)` values inside the `@font-face` rules of a stylesheet. */
function fontFaceUrls(source: string): string[] {
  return [...source.matchAll(/@font-face\s*\{([^}]*)\}/g)].flatMap((rule) =>
    [...(rule[1] ?? '').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1] ?? ''),
  );
}

describe("the prototype's page", () => {
  it("carries the app's policy, directive for directive", () => {
    // One deploy/_headers rule governs every path on the origin, so a page
    // whose meta policy differed would be governed by a rule written for
    // another page.
    expect(Object.fromEntries(policy(benchHtml))).toEqual(Object.fromEntries(policy(appHtml)));
    expect(policy(benchHtml).get('connect-src')).toBe("'none'");
    expect(policy(benchHtml).get('font-src')).toBe("'self'");
  });

  it('references nothing off the device', () => {
    const references = [...benchHtml.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(
      (m) => m[1] ?? '',
    );
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(reference, reference).not.toMatch(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i);
    }
  });

  it('runs under the status bar and the home indicator, edge to edge', () => {
    const viewport = meta('viewport') ?? '';
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('viewport-fit=cover');
    // Chrome on Android then keeps the frame behind the keyboard, as Safari
    // already does (SPEC 3, "When a field has the keyboard").
    expect(viewport).toContain('interactive-widget=resizes-visual');
    // Zoom is not blocked.
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
  });

  it('is a charcoal page under a translucent status bar', () => {
    // The canvas runs under the status bar with white glyphs (plan section
    // 13). iOS reads this once, at launch from the home screen.
    expect(meta('apple-mobile-web-app-status-bar-style')).toBe('black-translucent');
    expect(meta('theme-color')?.toUpperCase()).toBe('#222624');
    // Dark on the root; sheets and fields set light for themselves, so a light
    // keyboard rises over the stone sheet.
    expect(meta('color-scheme')).toBe('dark');
    expect(meta('apple-mobile-web-app-capable')).toBe('yes');
    expect(meta('apple-mobile-web-app-title')).toBe('Adnotia test');
  });

  it('does not turn figures into telephone links', () => {
    // "10:30" and "116 123" are not to be guessed at; the crisis page writes
    // its own tel: links.
    expect(meta('format-detection')).toBe('telephone=no');
  });

  it('keeps itself out of search results', () => {
    expect(meta('robots')).toBe('noindex');
  });
});

describe("the prototype's typeface", () => {
  const urls = fontFaceUrls(css);

  it('is loaded by one @font-face, from a file beside the stylesheet', () => {
    expect(urls).toEqual(['./fonts/InstrumentSans-latin.woff2']);
    for (const url of urls) {
      // Relative, so Vite emits it as a file and the page's font-src 'self'
      // lets it load. A remote face, or a data: one, would be refused.
      expect(url).not.toMatch(/^(?:[a-z][a-z0-9+.-]*:|\/)/i);
      expect(existsSync(resolve(benchDir, url)), url).toBe(true);
    }
  });

  it('is the file its README records', () => {
    const font = readFileSync(join(benchDir, 'fonts/InstrumentSans-latin.woff2'));
    const digest = createHash('sha256').update(font).digest('hex');
    const readme = readFileSync(join(benchDir, 'fonts/README.md'), 'utf8');
    expect(readme).toContain(digest);
    expect(readme).toContain(font.length.toLocaleString('en-GB'));
    // woff2's own signature, so a saved error page cannot pass for the font.
    expect(font.subarray(0, 4).toString('latin1')).toBe('wOF2');
  });

  it('has its licence beside it, and the licence is the licence', () => {
    for (const url of urls) {
      const licence = join(dirname(resolve(benchDir, url)), 'OFL.txt');
      expect(existsSync(licence)).toBe(true);
      const text = readFileSync(licence, 'utf8');
      expect(text).toContain('SIL OPEN FONT LICENSE Version 1.1');
      expect(text).toMatch(/^Copyright \d{4} The Instrument Sans Project Authors/);
      expect(text).not.toMatch(/<html|<!doctype|404/i);
    }
  });

  it('waits for the face rather than flashing the system one, and declares both axes', () => {
    const rule = /@font-face\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/font-family:\s*['"]Instrument Sans['"]/);
    expect(rule).toMatch(/font-display:\s*block/);
    expect(rule).toMatch(/font-weight:\s*400 700/);
    expect(rule).toMatch(/font-stretch:\s*75% 100%/);
  });

  it('stays in the prototype: nothing else in src names it', () => {
    // ADR-047 still calls the face proposed. The app carries no font file, and
    // tests/kernel/styles.test.ts and csp.test.ts hold it to that.
    const elsewhere = filesUnder(resolve(root, 'src'))
      .filter((path) => !path.startsWith(benchDir))
      .filter((path) =>
        /InstrumentSans|Instrument Sans|\.woff2?\b/.test(readFileSync(path, 'utf8')),
      );
    expect(elsewhere.map((path) => relative(root, path))).toEqual([]);
  });
});

describe('src/bench', () => {
  const files = filesUnder(benchDir);
  const code = files.filter((path) => /\.(?:ts|js|mjs|css|html)$/.test(path));

  it('names no address anywhere in its code', () => {
    // Stricter than the no-network audit, which allows a link a person chooses
    // to follow. The prototype has no reason to name any address at all.
    expect(code.length).toBeGreaterThan(0);
    for (const path of code) {
      expect(readFileSync(path, 'utf8'), relative(root, path)).not.toMatch(
        /https?:|\/\/[a-z0-9-]+\./i,
      );
    }
  });

  it('holds nothing but code and the typeface with its licence and provenance', () => {
    // The licence and the README name the addresses the face came from, which
    // is their job. They are never loaded. Anything else that is not code is
    // a file nobody has reviewed here.
    const other = files.filter((path) => !code.includes(path)).map((p) => relative(benchDir, p));
    expect(other.sort()).toEqual([
      'fonts/InstrumentSans-latin.woff2',
      'fonts/OFL.txt',
      'fonts/README.md',
    ]);
  });
});
