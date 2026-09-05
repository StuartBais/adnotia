import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The CSP is what makes "no network" a browser-enforced property rather than a
// promise. It is specified in docs/05-architecture.md "Security posture"; this
// asserts index.html still carries it, directive for directive.

// Resolved from the project root. Under jsdom, import.meta.url is an http URL,
// so it cannot be used to find a file on disk.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

function cspContent(): string {
  // The attribute delimiter is captured and back-referenced because the policy
  // itself contains single quotes ('self', 'none').
  const match = html.match(
    /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2\s*\/?>/i,
  );
  if (!match?.[3]) throw new Error('index.html has no Content-Security-Policy meta tag');
  return match[3];
}

function directives(): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of cspContent().split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const space = trimmed.indexOf(' ');
    if (space === -1) map.set(trimmed, '');
    else map.set(trimmed.slice(0, space), trimmed.slice(space + 1).trim());
  }
  return map;
}

describe('the Content-Security-Policy in index.html', () => {
  it('is present', () => {
    expect(cspContent()).toBeTruthy();
  });

  it("forbids every outbound connection with connect-src 'none'", () => {
    expect(directives().get('connect-src')).toBe("'none'");
  });

  it('carries each directive from docs/05-architecture.md', () => {
    expect(Object.fromEntries(directives())).toEqual({
      'default-src': "'self'",
      'connect-src': "'none'",
      'img-src': "'self' data:",
      'font-src': "'self'",
      'style-src': "'self' 'unsafe-inline'",
      'script-src': "'self'",
      'frame-ancestors': "'none'",
      'base-uri': "'none'",
      'form-action': "'none'",
    });
  });

  it('allows no remote script or style origin', () => {
    for (const name of ['default-src', 'script-src', 'style-src', 'font-src', 'img-src']) {
      expect(directives().get(name) ?? '').not.toMatch(/https?:|\*/);
    }
  });
});

describe('index.html', () => {
  it('references nothing off the device', () => {
    const external = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map((m) => m[1] ?? '')
      .filter((url) => /^(?:https?:)?\/\//i.test(url));
    expect(external).toEqual([]);
  });

  it('loads no font file', () => {
    // Typography is system stacks only. See docs/07-design-system.md.
    expect(html).not.toMatch(/\.(?:woff2?|ttf|otf|eot)\b/i);
  });
});
