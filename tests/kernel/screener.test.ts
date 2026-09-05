import { describe, expect, it } from 'vitest';
import {
  ASRS_DOCUMENTED_MAX,
  ASRS_ITEMS,
  ASRS_RESPONSES,
  ASRS_SOURCE,
  ASRS_THRESHOLD,
  SCREENER_STRINGS,
  isComplete,
  isUsable,
  maxScore,
  outcome,
  score,
  screenerPage,
  type ScreenerSource,
} from '../../src/kernel/index';

// docs/03-scope.md "Screening" fixes every rule asserted here, and
// docs/decisions/ADR-021 records why the instrument is not yet offered.

const VERIFIED: ScreenerSource = { ...ASRS_SOURCE, verified: '2026-10' };

function render(source?: ScreenerSource): HTMLElement {
  const host = document.createElement('div');
  screenerPage(source === undefined ? {} : { source }).render(host);
  return host;
}

const flat = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

const answerAll = (value: number): Record<string, number> =>
  Object.fromEntries(ASRS_ITEMS.map((item) => [item.id, value]));

describe('the source, before anything else', () => {
  it('has not been checked, so the screener is not usable', () => {
    expect(ASRS_SOURCE.verified).toBeUndefined();
    expect(isUsable()).toBe(false);
  });

  it('records what it is, what paper it is from, and where the text came from', () => {
    expect(ASRS_SOURCE.instrument).toContain('ASRS-5');
    expect(ASRS_SOURCE.paper).toContain('2017');
    expect(ASRS_SOURCE.transcribedFrom).toContain('not the paper');
  });

  it('does not add up, which is why it is unverified rather than merely unchecked', () => {
    // Six items with a top response of 4 sum to 24. The transcription says 25.
    // ADR-021: a one-point gap is the signature of flattened per-item weights,
    // and a plain sum against a cutoff of 14 would then mean nothing.
    expect(maxScore()).toBe(24);
    expect(ASRS_DOCUMENTED_MAX).toBe(25);
    expect(
      maxScore(),
      'The transcription now agrees with the items. If that is because the ' +
        'instrument was replaced from its primary source, delete this test and set ' +
        'ASRS_SOURCE.verified.',
    ).not.toBe(ASRS_DOCUMENTED_MAX);
  });
});

describe('while it is unverified', () => {
  it('offers no questions at all, only an explanation', () => {
    const page = render();
    expect(page.querySelectorAll('.chip')).toHaveLength(0);
    expect(flat(page)).toContain(SCREENER_STRINGS.unavailableTitle);
  });

  it('says why, without pretending the instrument is unsound', () => {
    const text = flat(render());
    expect(text).toContain('has not been checked against the paper');
    expect(text).not.toMatch(/\b(invalid|useless|wrong|broken)\b/i);
  });
});

describe('the scoring', () => {
  it('sums the six items', () => {
    expect(score(answerAll(0))).toBe(0);
    expect(score(answerAll(4))).toBe(24);
    expect(score({ ...answerAll(0), concentrating: 3 })).toBe(3);
  });

  it('treats an unanswered item as nothing, and knows it is unanswered', () => {
    const partial = { ...answerAll(4) };
    delete partial['others'];
    expect(isComplete(partial)).toBe(false);
    expect(score(partial)).toBe(20);
    expect(isComplete(answerAll(1))).toBe(true);
  });

  it('reports one bit either side of the threshold, and nothing else', () => {
    const at = { ...answerAll(2), concentrating: 4 }; // 2*5 + 4 = 14
    expect(score(at)).toBe(ASRS_THRESHOLD);
    expect(outcome(at)).toBe('worth-seeking');

    const below = { ...answerAll(2), concentrating: 3 }; // 13
    expect(score(below)).toBe(ASRS_THRESHOLD - 1);
    expect(outcome(below)).toBe('below-threshold');
  });
});

describe('what it is allowed to say', () => {
  const done = (): HTMLElement => {
    const page = render(VERIFIED);
    for (const control of page.querySelectorAll('.chips')) {
      const chip = control.querySelectorAll('.chip')[4] as HTMLElement;
      chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    const submit = [...page.querySelectorAll('button')].find(
      (button) => button.textContent === SCREENER_STRINGS.submit,
    );
    submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return page;
  };

  it('asks all six items, for the period the instrument asks about', () => {
    const page = render(VERIFIED);
    for (const item of ASRS_ITEMS) expect(flat(page)).toContain(item.text);
    expect(flat(page)).toContain('the past 6 months');
    expect(page.querySelectorAll('.chips')).toHaveLength(ASRS_ITEMS.length);
  });

  it('offers the instrument’s own response options', () => {
    const first = render(VERIFIED).querySelector('.chips');
    const labels = [...(first?.querySelectorAll('.chip') ?? [])].map((c) => c.textContent);
    expect(labels).toEqual(ASRS_RESPONSES.map((r) => r.label));
  });

  it('never says the person has ADHD, or how likely it is', () => {
    const text = flat(done());
    expect(text).not.toMatch(/you (probably|likely|may|might) have adhd/i);
    expect(text).not.toMatch(/\d+\s?%/);
    expect(text).not.toMatch(/\b(likelihood|probability|severity|mild|moderate|severe)\b/i);

    // The page does say "not that you have ADHD", which is the opposite claim.
    // Every occurrence of the phrase has to be a denial of it.
    for (const match of text.matchAll(/you have adhd/gi)) {
      const before = text.slice(Math.max(0, (match.index ?? 0) - 12), match.index);
      expect(before, `unqualified: …${before}${match[0]}`).toMatch(/not that $/i);
    }
  });

  it('never shows the score, not even to someone who scored the maximum', () => {
    const text = flat(done());
    expect(text).not.toContain('24');
    expect(text).not.toMatch(/\bscore\b/i);
    expect(text).not.toContain(String(ASRS_THRESHOLD));
  });

  it('reports only whether an assessment is worth seeking', () => {
    expect(flat(done())).toContain('consistent with seeking a formal assessment');
  });

  it('says the threshold is a convention rather than a verdict, for someone under it', () => {
    const page = render(VERIFIED);
    for (const control of page.querySelectorAll('.chips')) {
      (control.querySelectorAll('.chip')[0] as HTMLElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    }
    [...page.querySelectorAll('button')]
      .find((b) => b.textContent === SCREENER_STRINGS.submit)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const text = flat(page);
    expect(text).toContain('screening convention rather than a verdict');
    expect(text).toContain('still worth raising');
  });

  it('will not report anything from a half-finished form', () => {
    const page = render(VERIFIED);
    [...page.querySelectorAll('button')]
      .find((b) => b.textContent === SCREENER_STRINGS.submit)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(flat(page)).toContain(SCREENER_STRINGS.incomplete);
    expect(flat(page)).not.toContain('consistent with seeking');
  });

  it('says what seeking an assessment involves, and that routes differ', () => {
    const text = flat(done());
    expect(text).toContain(SCREENER_STRINGS.nextTitle);
    expect(text).toContain('Routes differ by country');
    expect(text).toContain('public and private care');
  });

  it('says it is for adults and points a parent elsewhere', () => {
    expect(flat(render(VERIFIED))).toContain('for adults');
    expect(flat(render(VERIFIED))).toContain('Family space');
  });
});

describe('the result goes nowhere', () => {
  it('cannot be stored, because the page is handed nothing to store it in', () => {
    // docs/03-scope.md: not stored as a diagnosis, not in any clinical report,
    // not read by another module. Enforced by the shape of the function.
    expect(screenerPage.length).toBeLessThanOrEqual(1);
    const page = screenerPage({ source: VERIFIED });
    expect(Object.keys(page)).toEqual(['id', 'title', 'render']);
  });

  it('tells the person nothing is saved', () => {
    const page = render(VERIFIED);
    for (const control of page.querySelectorAll('.chips')) {
      (control.querySelectorAll('.chip')[4] as HTMLElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    }
    [...page.querySelectorAll('button')]
      .find((b) => b.textContent === SCREENER_STRINGS.submit)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(flat(page)).toContain('Nothing you answer here is saved');
  });

  it('starts blank every time it is opened', () => {
    // The shell builds a new page on each visit, so answers live no longer than
    // the page does. Re-rendering the same open page keeps them, which is what
    // makes the form usable; opening it again does not.
    const first = document.createElement('div');
    screenerPage({ source: VERIFIED }).render(first);
    (first.querySelectorAll('.chip')[4] as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(first.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);

    const second = document.createElement('div');
    screenerPage({ source: VERIFIED }).render(second);
    expect(second.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  });
});
