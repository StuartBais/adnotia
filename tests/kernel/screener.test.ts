import { describe, expect, it } from 'vitest';
import {
  ASRS_DOCUMENTED_MAX,
  ASRS_ITEMS,
  ASRS_ITEM_ORDER,
  ASRS_RESPONSES,
  ASRS_SOURCE,
  ASRS_THRESHOLD,
  SCREENER_STRINGS,
  UNWEIGHTED_MAX,
  isComplete,
  isUsable,
  maxScore,
  outcome,
  score,
  screenerPage,
  type ScreenerItem,
  type ScreenerSource,
} from '../../src/kernel/index';

// docs/03-scope.md "Screening" fixes every rule asserted here, and
// docs/decisions/ADR-021 records why the instrument is not yet offered.

const VERIFIED: ScreenerSource = { ...ASRS_SOURCE, verified: '2026-10', licensed: '2026-10' };

/**
 * A stand-in instrument. The real items are copyrighted and are not in this
 * repository (ADR-023), so the machinery is exercised against six questions of
 * our own that have the same shape and none of the wording.
 */
const STAND_IN: readonly ScreenerItem[] = ASRS_ITEM_ORDER.map((id, index) => ({
  id,
  text: `Stand-in question ${index + 1}?`,
}));

function render(source?: ScreenerSource, items: readonly ScreenerItem[] = STAND_IN): HTMLElement {
  const host = document.createElement('div');
  screenerPage(source === undefined ? { items: ASRS_ITEMS } : { source, items }).render(host);
  return host;
}

const flat = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

const answerAll = (value: number): Record<string, number> =>
  Object.fromEntries(STAND_IN.map((item) => [item.id, value]));

describe('the source, before anything else', () => {
  it('carries no items, and is not usable', () => {
    // ADR-023: both candidate instruments are copyrighted, so the items are not
    // in this repository at all. Two independent reasons the gate is shut.
    expect(ASRS_ITEMS).toEqual([]);
    expect(ASRS_SOURCE.verified).toBeUndefined();
    expect(ASRS_SOURCE.licensed).toBeUndefined();
    expect(isUsable()).toBe(false);
  });

  it('stays shut on permission even once someone has checked the wording', () => {
    const checked: ScreenerSource = { ...ASRS_SOURCE, verified: '2026-10' };
    expect(isUsable(checked, STAND_IN)).toBe(true);
    // Items alone are not enough: with none, nothing is offered whatever the
    // source record says.
    expect(isUsable(checked, [])).toBe(false);
  });

  it('records who holds the rights', () => {
    expect(ASRS_SOURCE.rights).toContain('New York University');
    expect(ASRS_SOURCE.rights).toContain('proprietary');
  });

  it('records what it is, what paper it is from, and where the text came from', () => {
    expect(ASRS_SOURCE.instrument).toContain('ASRS-5');
    expect(ASRS_SOURCE.paper).toContain('2017');
    expect(ASRS_SOURCE.transcribedFrom).toContain('not the paper');
  });

  it('knows the published scale is weighted, and a plain sum is a different test', () => {
    // Confirmed against Ustün et al. 2017: never is 0 throughout and the top
    // response is worth 6, 5, 5, 4, 3 and 2 across the six items, so the scale
    // runs 0–25. Six items scored 0–4 reach 24, which is how a flattened copy
    // gives itself away. The cutoff of 14 belongs to the weighted score.
    expect(ASRS_DOCUMENTED_MAX).toBe(25);
    expect(UNWEIGHTED_MAX).toBe(24);
    expect(maxScore(STAND_IN)).toBe(UNWEIGHTED_MAX);
    expect(maxScore(STAND_IN)).not.toBe(ASRS_DOCUMENTED_MAX);
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
    expect(text).toContain('written permission');
    expect(text).not.toMatch(/\b(invalid|useless|wrong|broken)\b/i);
  });
});

describe('the scoring', () => {
  it('sums the six items', () => {
    expect(score(answerAll(0), STAND_IN)).toBe(0);
    expect(score(answerAll(4), STAND_IN)).toBe(24);
    expect(score({ ...answerAll(0), concentrating: 3 }, STAND_IN)).toBe(3);
  });

  it('treats an unanswered item as nothing, and knows it is unanswered', () => {
    const partial = { ...answerAll(4) };
    delete partial['others'];
    expect(isComplete(partial, STAND_IN)).toBe(false);
    expect(score(partial, STAND_IN)).toBe(20);
    expect(isComplete(answerAll(1), STAND_IN)).toBe(true);
  });

  it('reports one bit either side of the threshold, and nothing else', () => {
    const at = { ...answerAll(2), concentrating: 4 }; // 2*5 + 4 = 14
    expect(score(at, STAND_IN)).toBe(ASRS_THRESHOLD);
    expect(outcome(at, STAND_IN)).toBe('worth-seeking');

    const below = { ...answerAll(2), concentrating: 3 }; // 13
    expect(score(below, STAND_IN)).toBe(ASRS_THRESHOLD - 1);
    expect(outcome(below, STAND_IN)).toBe('below-threshold');
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

  it('asks every item it is given, for the period the instrument asks about', () => {
    const page = render(VERIFIED);
    for (const item of STAND_IN) expect(flat(page)).toContain(item.text);
    expect(flat(page)).toContain('the past 6 months');
    expect(page.querySelectorAll('.chips')).toHaveLength(STAND_IN.length);
    expect(STAND_IN).toHaveLength(6);
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
    const page = screenerPage({ source: VERIFIED, items: STAND_IN });
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
    screenerPage({ source: VERIFIED, items: STAND_IN }).render(first);
    (first.querySelectorAll('.chip')[4] as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(first.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);

    const second = document.createElement('div');
    screenerPage({ source: VERIFIED, items: STAND_IN }).render(second);
    expect(second.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  });
});
