import { describe, expect, it } from 'vitest';
import {
  ABOUT_STRINGS,
  CRISIS_LINES,
  CRISIS_REVIEWED,
  CRISIS_REVIEW_MONTHS,
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
