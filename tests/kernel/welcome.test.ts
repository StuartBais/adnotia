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

  it('says the one risk it cannot do anything about', () => {
    // A stranger deciding on this page has not typed anything yet, which is the
    // only moment the choice is free. No page can enumerate extensions, so this
    // is stated unconditionally rather than checked. See ADR-039.
    expect(text).toContain('browser extension');
    expect(text).toContain('no site can even tell you which extensions you have');
    // And it points at the two things that do help, rather than stopping at the
    // bad news.
    expect(text).toContain('passcode');
    expect(text).toContain('a file on your own computer');
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

describe('the pictures of the app', () => {
  /*
   * The page shows screenshots, and scripts/shots.mjs takes them. See ADR-037.
   *
   * The failure this exists for is quiet: regenerate a shot of a different
   * screen and the page keeps the old alt text, so the only description a
   * screen-reader user gets is of something that is no longer there. Same for
   * the dimensions — wrong ones do not break the picture, they just make the
   * page jump under somebody as it loads.
   */
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/shots/manifest.json'), 'utf8'),
  ) as Record<string, { alt: string; width: number; height: number }>;

  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => ({
    tag,
    attr: (name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1],
  }));

  it('shows some', () => {
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows only shots that were actually taken', () => {
    for (const image of images) {
      const src = image.attr('src');
      expect(src, image.tag).toMatch(/^\.\/shots\/[a-z]+\.webp$/);
      const name = /([a-z]+)\.webp$/.exec(src as string)?.[1] as string;
      expect(Object.keys(manifest), `${src} is not a shot scripts/shots.mjs takes`).toContain(name);
    }
  });

  it('describes what is in each one, in the words it was taken with', () => {
    for (const image of images) {
      const name = /([a-z]+)\.webp$/.exec(image.attr('src') as string)?.[1] as string;
      // Not "has some alt text": alt text describing the previous screenshot
      // passes that and is worse than none, because it is confidently wrong.
      expect(image.attr('alt'), image.attr('src')).toBe(manifest[name]?.alt);
    }
  });

  it('states the size each one really is, so the page does not jump', () => {
    for (const image of images) {
      const name = /([a-z]+)\.webp$/.exec(image.attr('src') as string)?.[1] as string;
      expect(Number(image.attr('width')), `${name} width`).toBe(manifest[name]?.width);
      expect(Number(image.attr('height')), `${name} height`).toBe(manifest[name]?.height);
    }
  });

  it('waits until they are needed', () => {
    // They sit below the fold and they are the bulk of the page's weight.
    // scripts/check-budget.mjs budgets them separately on the strength of this.
    for (const image of images) {
      expect(image.attr('loading'), image.attr('src')).toBe('lazy');
    }
  });
});
