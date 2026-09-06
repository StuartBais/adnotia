import { describe, expect, it } from 'vitest';
import {
  ABOUT_STRINGS,
  CRISIS_LINES,
  CRISIS_REVIEWED,
  CRISIS_REVIEW_MONTHS,
  CRISIS_STRINGS,
  FAMILY_CRISIS_LINES,
  FAMILY_CRISIS_STRINGS,
  LICENCE,
  SOURCE_URL,
  aboutPage,
  crisisPage,
} from '../../src/kernel/index';

// The two pages docs/03-scope.md requires by name: "if things are bad right now"
// under "Safety and comorbidity", and About under "Data and privacy commitments".

function render(page: { render(container: HTMLElement): void }): HTMLElement {
  const host = document.createElement('div');
  page.render(host);
  return host;
}

const flat = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

describe('if things are bad right now', () => {
  const page = render(crisisPage());
  const text = flat(page);

  it('says plainly that the app cannot help', () => {
    expect(text).toContain('Adnotia cannot help in a crisis');
  });

  it('leads with the local emergency number, which cannot go out of date', () => {
    const first = page.querySelector('.crisis-first');
    expect(first?.textContent).toContain('call your local emergency number');
    // Before any helpline, because a compiled list is the fallible part.
    expect(text.indexOf('local emergency number')).toBeLessThan(text.indexOf(CRISIS_LINES[0]!.who));
  });

  it('lists a small number of lines, not a directory', () => {
    expect(CRISIS_LINES.length).toBeGreaterThanOrEqual(3);
    expect(CRISIS_LINES.length).toBeLessThanOrEqual(8);
  });

  it('says where each line applies and who answers it', () => {
    for (const entry of CRISIS_LINES) {
      expect(text, entry.who).toContain(entry.where);
      expect(text, entry.who).toContain(entry.who);
      expect(text, entry.who).toContain(entry.contact);
    }
  });

  it('lets a phone dial in one tap without leaking where the tap came from', () => {
    for (const link of page.querySelectorAll('a[href^="tel:"]')) {
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
    expect(page.querySelectorAll('a[href^="tel:"]').length).toBe(
      CRISIS_LINES.filter((entry) => entry.dial !== undefined).length,
    );
  });

  it('prints when the list was last checked', () => {
    expect(text).toContain(`last checked in ${CRISIS_REVIEWED}`);
    expect(CRISIS_REVIEWED).toMatch(/^\d{4}-\d{2}$/);
  });

  it('admits the numbers have not been confirmed by a person', () => {
    // Removed by passing checked: true, which nobody should do until they have.
    expect(text).toContain('have not yet been confirmed');
    expect(flat(render(crisisPage({ checked: true })))).not.toContain(
      'have not yet been confirmed',
    );
  });

  it('goes stale, so reviewing it is a build step and not an intention', () => {
    // docs/03-scope.md: "reviewed and updated with each release".
    const [year, month] = CRISIS_REVIEWED.split('-').map(Number) as [number, number];
    const reviewed = new Date(Date.UTC(year, month - 1, 1));
    const months = (Date.now() - reviewed.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    expect(
      months,
      `The crisis list was reviewed in ${CRISIS_REVIEWED} and is now ${Math.floor(months)} months old. ` +
        'Check every number against its organisation and move CRISIS_REVIEWED on.',
    ).toBeLessThan(CRISIS_REVIEW_MONTHS);
  });

  it('asks nothing, records nothing and reacts to nothing', () => {
    // "and nothing else". No input, no form, and no reading of the document:
    // crisisPage takes no store, which is the mechanical form of that rule.
    expect(page.querySelectorAll('input, textarea, select, form')).toHaveLength(0);
    expect(crisisPage.length).toBeLessThanOrEqual(1);
  });

  it('never asks how the person is, which would be a question it cannot answer', () => {
    expect(text).not.toMatch(/how (are|do) you|are you (ok|okay|safe)|rate your/i);
  });

  it('is not alarmed, and does not instruct', () => {
    expect(text).not.toMatch(/!|urgent|emergency!|you must|you should/i);
  });
});

describe('the parent-facing version of it', () => {
  // docs/04-family-space.md: "A parent-facing 'if things are bad right now' page
  // carries child- and parent-specific resources alongside the general ones,
  // reviewed each release with the review date printed."
  const family = render(crisisPage({ space: 'family' }));
  const text = flat(family);
  const adult = flat(render(crisisPage({ space: 'adult' })));

  it('carries the child- and parent-specific lines', () => {
    expect(text).toContain(FAMILY_CRISIS_STRINGS.worriedTitle);
    expect(text).toContain(FAMILY_CRISIS_STRINGS.childTitle);
    expect(text).toContain(FAMILY_CRISIS_STRINGS.parentTitle);
    for (const entry of FAMILY_CRISIS_LINES) expect(text).toContain(entry.contact);
  });

  it('carries them alongside the general ones rather than instead of them', () => {
    // "alongside". A parent who opens this because they are the one who is not
    // all right must not have to work out that the general lines are elsewhere.
    for (const entry of CRISIS_LINES) expect(text).toContain(entry.contact);
    expect(text).toContain(CRISIS_STRINGS.emergency);
    expect(text).toContain('Adnotia cannot help in a crisis');
  });

  it('puts the parent’s own line before the child protection one', () => {
    // The commonest reason a parent opens this page is themselves.
    expect(text.indexOf(FAMILY_CRISIS_STRINGS.parentTitle)).toBeLessThan(
      text.indexOf(FAMILY_CRISIS_STRINGS.worriedTitle),
    );
  });

  it('does not put any of it in front of an adult with no children in the app', () => {
    expect(adult).not.toContain(FAMILY_CRISIS_STRINGS.worriedTitle);
    expect(adult).not.toContain(FAMILY_CRISIS_STRINGS.childTitle);
    for (const entry of FAMILY_CRISIS_LINES) expect(adult).not.toContain(entry.who);
  });

  it('says out loud that nothing here reads the log', () => {
    // docs/04-family-space.md: "No module attempts to detect risk, abuse,
    // neglect or mood disorder from anything recorded."
    expect(text).toContain('Nothing in this app reads what you have written');
    expect(text).toContain('No entry sets anything off');
  });

  it('does not detect anything, whatever is in the document', () => {
    // The mechanical half of the same rule: the page cannot vary with the data
    // because it is never given any.
    expect(crisisPage.length).toBeLessThanOrEqual(1);
    expect(family.querySelectorAll('input, textarea, select, form')).toHaveLength(0);
  });

  it('does not tell a parent they must be sure before they ring', () => {
    expect(text).toContain('Being unsure is the ordinary reason people ring');
  });

  it('keeps the child lines off the screen a child is handed, and says why', () => {
    expect(text).toContain('rather than on the screen you hand over');
  });

  it('does not treat a parent at the end of their rope as a safeguarding matter', () => {
    expect(text).toContain('not a failure and it is not a safeguarding matter');
  });

  it('is reviewed on the same date as the rest of the page', () => {
    // One review date for one page. A second date is a second thing to forget.
    expect(text).toContain(`last checked in ${CRISIS_REVIEWED}`);
    expect(text).toContain(CRISIS_STRINGS.unchecked);
  });

  it('prints that date after the family lines, not before them', () => {
    // Built-file check: with the note under the general lines, the family ones
    // sat below it and read as though nobody had checked how old they were.
    const last = FAMILY_CRISIS_LINES[FAMILY_CRISIS_LINES.length - 1];
    expect(last).toBeDefined();
    expect(text.indexOf(`last checked in ${CRISIS_REVIEWED}`)).toBeGreaterThan(
      text.indexOf(last?.contact ?? ''),
    );
  });

  it('is not alarmed, and does not instruct', () => {
    expect(text).not.toMatch(/!|urgent|emergency!|you must|you should/i);
  });
});

describe('about Adnotia', () => {
  const page = render(aboutPage());
  const text = flat(page);

  it('says what it is not, item by item', () => {
    for (const claim of ABOUT_STRINGS.not) expect(text).toContain(claim);
    expect(text).toContain('does not diagnose');
    expect(text).toContain('does not prescribe');
  });

  it('states the privacy commitments the scope document makes', () => {
    expect(text).toContain('no server and no account');
    expect(text).toContain('no analytics');
    expect(text).toContain('Clearing your browser data deletes all of it');
  });

  it('states the origin caveat plainly, as docs/03-scope.md requires', () => {
    expect(text).toContain(ABOUT_STRINGS.originTitle);
    expect(text).toContain('starts empty');
    expect(text).toContain('downloading a backup and restoring it');
  });

  it('names the licence and points at the source', () => {
    expect(LICENCE).toBe('AGPL-3.0');
    expect(text).toContain('AGPL-3.0');
    expect(page.querySelector(`a[href="${SOURCE_URL}"]`)).not.toBeNull();
  });

  it('offers the one-file build and says what it is for', () => {
    expect(page.querySelector(`a[href="${SOURCE_URL}/releases"]`)).not.toBeNull();
    expect(text).toContain('nothing is being fetched from anywhere');
  });

  it('warns before sending anyone out of the app, and takes no referrer with them', () => {
    const outward = [...page.querySelectorAll('a[target="_blank"]')];
    expect(outward.length).toBeGreaterThan(0);
    for (const link of outward) {
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
    expect(text).toContain('leaves Adnotia and uses the internet');
  });

  it('claims nothing the app does not do', () => {
    expect(text).not.toMatch(/\b(cure|proven to|guarantee|clinically validated)\b/i);
  });
});
