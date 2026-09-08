import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { DOCUMENT_KEY } from '../../src/kernel/store/document';

// The welcome page. See docs/decisions/ADR-036.
//
// It is the only document in this project that is promotional material in the
// MHRA's sense, and the September 2026 review in docs/03-scope.md turns on
// exactly that: intended purpose is set by "the device's labelling, instructions
// for use and any promotional materials", and the guidance names the landing
// page. The review concluded Adnotia is not a medical device. This page is the
// easiest place in the repository to make that untrue in one sentence.

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const text = html
  .replace(/<script>[\s\S]*?<\/script>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

describe('what the welcome page may not say', () => {
  it('never uses a verb that would make this a medical device', () => {
    // docs/03-scope.md, "What would change the answer": any promotional wording
    // using the MHRA's indicative verbs.
    for (const verb of ['detects', 'screens', 'predicts', 'measures', 'diagnoses']) {
      expect(text.toLowerCase(), verb).not.toMatch(new RegExp(`\\b${verb}\\b`));
    }
    expect(text.toLowerCase()).not.toMatch(/monitors? your adhd/);
  });

  it('never offers to tell anyone whether they have ADHD', () => {
    expect(text.toLowerCase()).not.toMatch(/find out if you|do you have adhd|test yourself/);
    // It says the opposite, in as many words.
    expect(text).toContain('will not tell you whether you have ADHD');
  });

  it('never says the report shows whether a medication is working', () => {
    // Named in the review as a thing that would change the answer.
    expect(text.toLowerCase()).not.toMatch(/whether (your |the )?medication is working/);
    expect(text.toLowerCase()).not.toMatch(/is it working/);
  });

  it('keeps "evidence-based" for Tier A, as the rubric reserves it', () => {
    expect(text.toLowerCase()).not.toContain('evidence-based');
  });

  it('keeps the house voice', () => {
    // docs/07-design-system.md: no exclamation marks, no cheerleading.
    expect(text).not.toMatch(/!/);
    expect(text.toLowerCase()).not.toMatch(/\b(amazing|awesome|revolutionary|game.changer)\b/);
  });

  it('says what it is not, rather than only what it is', () => {
    expect(text).toContain('will not recommend a dose');
    expect(text).toContain('not a medical device');
  });
});

describe('the page a stranger gets', () => {
  it('leads with the record, which is the safe lead and the true one', () => {
    expect(html).toContain('<h1>');
    expect(text).toContain('notebook for ADHD');
  });

  it('offers a way into the app', () => {
    expect(html).toMatch(/href="\.\/app\/"/);
  });

  it('loads nothing from anywhere else', () => {
    // scripts/check-no-network.mjs audits this too; this is the same rule stated
    // where somebody editing the page will see it.
    expect(html).not.toMatch(/<(?:script|img)[^>]+src="(?:https?:)?\/\//i);
    expect(html).not.toMatch(/<link[^>]+href="(?:https?:)?\/\//i);
  });

  it('carries no font file', () => {
    expect(html).not.toMatch(/\.(?:woff2?|ttf|otf|eot)\b/);
  });
});

describe('the built page, not the source', () => {
  // The source page carries `script-src 'self'`, which blocks an inline script
  // outright. The redirect is inline on purpose — it must run before anything
  // paints — so the build authorises it by hash. Nothing in jsdom enforces CSP,
  // so without this the redirect could be dead in every real browser and every
  // other test here would still pass.
  const built = (() => {
    try {
      return readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
    } catch {
      return undefined;
    }
  })();

  it.runIf(built !== undefined)('authorises its own inline script by hash', () => {
    const page = built as string;
    const inline = /<script>([\s\S]*?)<\/script>/.exec(page)?.[1];
    expect(inline, 'the inline script').toBeDefined();
    const digest = createHash('sha256')
      .update(inline as string, 'utf8')
      .digest('base64');
    expect(page).toContain(`'sha256-${digest}'`);
  });

  it.runIf(built !== undefined)('does not fall back to allowing every inline script', () => {
    // script-src specifically. style-src carries 'unsafe-inline' on purpose and
    // docs/05-architecture.md says why: the single-file build needs it, and it
    // is acceptable precisely because script-src does not have it.
    const scriptSrc = /script-src([^;]*);/.exec(built as string)?.[1] ?? '';
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).toContain('sha256-');
  });

  it.runIf(built !== undefined)('carries none of the app’s plumbing', () => {
    // It is a page to read, not an installable app, and it must not be the
    // document that registers a service worker.
    expect(built as string).not.toContain('registerSW');
    expect(built as string).not.toMatch(/rel="manifest"/);
  });
});

describe('who the page is for', () => {
  /** The page's own redirect, run against stubs. */
  function visit(options: { search?: string; stored?: string | null; throws?: boolean }) {
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(script, 'the redirect script').toBeDefined();
    let went: string | null = null;
    const sandbox = {
      location: {
        search: options.search ?? '',
        replace: (to: string) => {
          went = to;
        },
      },
      localStorage: {
        getItem: (key: string) => {
          if (options.throws === true) throw new Error('site data blocked');
          return key === DOCUMENT_KEY ? (options.stored ?? null) : null;
        },
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(script as string, sandbox);
    return went;
  }

  it('welcomes somebody who has never been here', () => {
    expect(visit({})).toBeNull();
  });

  it('sends somebody who already has a record straight to it', () => {
    expect(visit({ stored: '{"schemaVersion":1}' })).toBe('./app/');
  });

  it('reads the same key the app writes', () => {
    // localStorage is scoped to the origin, not the path, so /app/ and / share
    // it. If the store ever renames its key this page silently stops
    // recognising anybody, and the test that catches it is this one.
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    expect(script).toContain(DOCUMENT_KEY);
  });

  it('stays put for anyone who asked for it, record or not', () => {
    // So the page remains readable and shareable by somebody who uses the app.
    expect(visit({ search: '?welcome', stored: '{"schemaVersion":1}' })).toBeNull();
  });

  it('shows the page when reading storage throws', () => {
    // Not defensive habit: localStorage access throws outright where a browser
    // is set to block site data, and the welcome page is the right fallback.
    expect(visit({ throws: true })).toBeNull();
  });
});
