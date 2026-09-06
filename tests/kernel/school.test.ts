import { describe, expect, it } from 'vitest';
import {
  GUIDANCE,
  SCHOOL_EVIDENCE,
  SCHOOL_STRINGS,
  schoolPage,
  tierWording,
} from '../../src/kernel/index';

// docs/04-family-space.md: "Plain guidance on talking to the school, what a
// daily report card is and why it has evidence, and how to ask for one. The app
// does not manage the report card; the school does."

function render(page: { render(container: HTMLElement): void }): HTMLElement {
  const host = document.createElement('div');
  page.render(host);
  return host;
}

const flat = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

describe('the school page', () => {
  const page = render(schoolPage());
  const text = flat(page);

  it('says what a daily report card is, in one place', () => {
    expect(text).toContain('rated by the teacher every day');
    expect(text).toContain('sent home the same day');
  });

  it('says it is not a punishment record, because that is what parents fear it is', () => {
    expect(text).toContain('not a punishment record');
    expect(text).toContain('nothing is taken away for a bad day');
  });

  it('says what the evidence shows and what it does not', () => {
    expect(text).toContain('meta-analyses of single-case studies');
    // The honest limit. Without it, "consistent improvement" reads as a claim
    // about the ADHD rather than about the behaviours the card targets.
    expect(text).toContain('does not show is a change in the attention and impulsivity');
  });

  it('hands over the two findings a parent can actually ask for', () => {
    // Vannest 2010: whole-day use and home involvement moderate the effect.
    expect(text).toContain('across the whole day rather than in one lesson');
    expect(text).toContain('home is involved');
  });

  it('gives specific asks rather than encouragement', () => {
    expect(SCHOOL_STRINGS.ask.length).toBeGreaterThanOrEqual(5);
    expect(text).toContain('Three to five targets');
    expect(text).toContain('two different adults would rate the same day the same way');
    expect(text).toContain('the thing to do rather than the thing to stop');
  });

  it('says a diagnosis is not a precondition for asking', () => {
    expect(text).toContain('None of this needs a diagnosis first');
  });

  it('says what to do when the answer is no', () => {
    expect(text).toContain('Ask what they would do instead');
    expect(text).toContain('in writing');
  });
});

describe('the school page does not run the card', () => {
  const page = render(schoolPage());

  it('says so, and says why, rather than leaving a gap', () => {
    const text = flat(page);
    expect(text).toContain('nowhere here to enter a teacher’s ratings');
    expect(text).toContain('and there will not be');
    expect(text).toContain('Ask the school for its own form');
  });

  it('has nothing to fill in on it', () => {
    // The mechanical form of "the app does not manage the report card". A page
    // with an input on it is managing one, whatever the prose says.
    expect(page.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(page.querySelectorAll('button')).toHaveLength(0);
  });

  it('reads nothing the parent has written', () => {
    expect(schoolPage.length).toBe(0);
  });
});

describe('the school page carries its evidence', () => {
  const text = flat(render(schoolPage()));

  it('prints the tier in the wording the rubric fixes', () => {
    // docs/02-evidence-rubric.md: never as a bare letter, and never paraphrased.
    expect(text).toContain(tierWording(SCHOOL_EVIDENCE.tier, 'family'));
    expect(text).not.toMatch(/\bTier [ABC]\b/);
  });

  it('prints the references the tier rests on', () => {
    expect(SCHOOL_EVIDENCE.citations.length).toBeGreaterThanOrEqual(2);
    for (const source of SCHOOL_EVIDENCE.citations) {
      expect(text).toContain(source.title);
      expect(text).toContain(source.doi_or_url);
    }
  });

  it('says nobody has checked them yet', () => {
    // ADR-020. The absence is on the page, not only in a design document.
    expect(SCHOOL_EVIDENCE.citationsVerified).toBeUndefined();
    expect(text).toContain('not been checked against the originals');
  });
});

describe('every guidance page carries a tier and references', () => {
  it('leaves none of them making a claim with nothing behind it', () => {
    // docs/02-evidence-rubric.md: "the tier of any individual Library article
    // follows the evidence for that article's topic". Prose is not exempt.
    for (const entry of GUIDANCE) {
      expect(entry.tier).toMatch(/^[ABC]$/);
      expect(entry.citations.length).toBeGreaterThanOrEqual(1);
      const text = flat(render(entry.page()));
      expect(text).toContain(tierWording(entry.tier, 'family'));
      for (const source of entry.citations) expect(text).toContain(source.doi_or_url);
    }
  });

  it('reserves the strongest word for the strongest tier', () => {
    for (const entry of GUIDANCE) {
      if (entry.tier === 'A') continue;
      expect(flat(render(entry.page()))).not.toContain('evidence-based');
    }
  });

  it('offers the school page to a parent alongside the rest', () => {
    expect(GUIDANCE.map((entry) => entry.title)).toContain(SCHOOL_STRINGS.title);
  });
});
