import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// deploy/_headers carries the real response headers for the deployed PWA.
//
// The <meta> CSP in index.html and the header CSP must say the same thing, or a
// change to one silently weakens the other. The one permitted difference is
// frame-ancestors, which browsers ignore in a meta tag and honour in a header.
//
// See docs/05-architecture.md "Security posture" and
// docs/decisions/ADR-009-hosting-and-edge-integrity.md.

const root = process.cwd();
const headersFile = readFileSync(resolve(root, 'deploy/_headers'), 'utf8');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');

/** The headers declared for one path pattern in a `_headers` file. */
function headersFor(pattern: string): Map<string, string> {
  const lines = headersFile.split('\n');
  const start = lines.findIndex((line) => line.trim() === pattern);
  if (start === -1) throw new Error(`deploy/_headers has no rule for ${pattern}`);

  const found = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('#') || line.trim() === '') continue;
    // A new rule begins at column 0.
    if (!/^\s/.test(line)) break;
    const colon = line.indexOf(':');
    found.set(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
  }
  return found;
}

function toDirectives(policy: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of policy.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const space = trimmed.indexOf(' ');
    if (space === -1) map.set(trimmed, '');
    else map.set(trimmed.slice(0, space), trimmed.slice(space + 1).trim());
  }
  return map;
}

const siteHeaders = headersFor('/*');

function metaPolicy(): string {
  const match = indexHtml.match(
    /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2\s*\/?>/i,
  );
  if (!match?.[3]) throw new Error('index.html has no Content-Security-Policy meta tag');
  return match[3];
}

describe('deploy/_headers', () => {
  it('sets a policy for every path', () => {
    expect(siteHeaders.get('Content-Security-Policy')).toBeTruthy();
  });

  it('says exactly what the meta tag says', () => {
    const header = toDirectives(siteHeaders.get('Content-Security-Policy') as string);
    const meta = toDirectives(metaPolicy());
    expect(Object.fromEntries(header)).toEqual(Object.fromEntries(meta));
  });

  it("forbids every outbound connection with connect-src 'none'", () => {
    const header = toDirectives(siteHeaders.get('Content-Security-Policy') as string);
    expect(header.get('connect-src')).toBe("'none'");
  });

  it('enforces frame-ancestors, which the meta tag cannot', () => {
    const header = toDirectives(siteHeaders.get('Content-Security-Policy') as string);
    expect(header.get('frame-ancestors')).toBe("'none'");
  });

  it('carries the rest of the security headers', () => {
    expect(siteHeaders.get('X-Content-Type-Options')).toBe('nosniff');
    expect(siteHeaders.get('Referrer-Policy')).toBe('no-referrer');
    expect(siteHeaders.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(siteHeaders.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(siteHeaders.get('Strict-Transport-Security')).toMatch(/^max-age=\d+/);
  });

  it('grants no permission it does not need', () => {
    const policy = siteHeaders.get('Permissions-Policy') as string;
    expect(policy).toBeTruthy();
    // Every feature listed is denied to everyone: `name=()`, never `name=(self)`.
    for (const entry of policy.split(',')) {
      expect(entry.trim()).toMatch(/^[a-z-]+=\(\)$/);
    }
    for (const sensitive of ['camera', 'microphone', 'geolocation', 'browsing-topics']) {
      expect(policy).toContain(`${sensitive}=()`);
    }
  });

  it('lets no edge cache decide which build a person runs', () => {
    for (const path of ['/index.html', '/sw.js', '/manifest.webmanifest']) {
      expect(headersFor(path).get('Cache-Control')).toBe('no-cache');
    }
  });

  it('names no origin but this one', () => {
    expect(headersFile).not.toMatch(/https?:\/\//);
  });
});
