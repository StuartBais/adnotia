import { beforeEach, describe, expect, it } from 'vitest';
import {
  ASSESSMENT_STRINGS,
  GUIDANCE,
  THIRTEEN_PLUS_STRINGS,
  UNDER_SIX_STRINGS,
  assessmentPage,
  createStore,
  memoryStorageAdapter,
  renderTab,
  thirteenPlusPage,
  underSixPage,
  type KernelStore,
} from '../../src/kernel/index';

// The parent guidance docs/04-family-space.md asks for: what an assessment
// involves, and the two age ranges where no validated free form applies.

function render(page: { render(container: HTMLElement): void }): HTMLElement {
  const host = document.createElement('div');
  page.render(host);
  return host;
}

const flat = (node: HTMLElement): string => (node.textContent ?? '').replace(/\s+/g, ' ');

describe('what an assessment involves', () => {
  const text = flat(render(assessmentPage()));

  it('says it is made by a clinician, over time, and not in one appointment', () => {
    expect(text).toContain('made by a clinician, over time, and not in one appointment');
  });

  it('says it needs more than one setting and more than one adult', () => {
    expect(text).toContain('more than one setting');
    expect(text).toContain('more than one adult');
  });

  it('says a form is the start and never the end', () => {
    // docs/04-family-space.md requires this alongside any screener.
    expect(text).toContain('the start of that, never the end of it');
    expect(text).toContain('a form is not a diagnosis in either direction');
  });

  it('handles the reverse error, which is the one people forget', () => {
    // "a parent whose responses fall below the threshold is told that the
    // threshold is a screening convention, not a verdict".
    expect(text).toContain('screening convention, not a verdict');
    expect(text).toContain('worth raising whatever a form said');
  });

  it('says routes differ by country and by public or private care', () => {
    expect(text).toContain('differ by country');
    expect(text).toContain('public and private care');
  });

  it('is honest about waiting lists rather than reassuring', () => {
    expect(text).toContain('sometimes years');
  });
});

describe('under six', () => {
  const text = flat(render(underSixPage()));

  it('says why there is no form rather than just not having one', () => {
    expect(text).toContain('no free, validated screening form for this age');
    expect(text).toContain('close to universal at this age');
  });

  it('says what is developmentally ordinary, without hedging it', () => {
    expect(text).toContain('ordinary in three, four and five-year-olds');
    expect(text).toContain('That is not a hedge');
  });

  it('lists what guidelines say is worth raising, and scores none of it', () => {
    expect(UNDER_SIX_STRINGS.raise.length).toBeGreaterThanOrEqual(3);
    expect(text).toContain('more than one place');
    expect(text).not.toMatch(/\b(score|points|threshold|total|out of \d)\b/i);
  });

  it('shows how to describe something so it travels', () => {
    expect(text).toContain('Specifics travel and impressions do not');
  });

  it('does not treat parent support as a brush-off', () => {
    expect(text).toContain('that is not a brush-off');
  });
});

describe('thirteen and older', () => {
  const text = flat(render(thirteenPlusPage()));

  it('says the usual form is validated to twelve and stops there', () => {
    expect(text).toContain('validated for ages six to twelve');
    expect(text).toContain('does not mean what the score is supposed to mean');
  });

  it('refuses to hand over a number instead of an answer', () => {
    expect(text).toContain('giving you a number instead of an answer');
  });

  it('points at the observation log rather than at nothing', () => {
    expect(text).toContain('observation log in this space is the preparation tool');
  });

  it('collects no self-report from the child, and says so', () => {
    // docs/04-family-space.md exclusion 2.
    expect(text).toContain('does not collect self-report from a child');
    expect(text).toContain('nothing here that asks them');
  });

  it('says a first diagnosis this late is normal', () => {
    expect(text).toContain('not too late');
  });
});

describe('all of the guidance', () => {
  it('never diagnoses, scores or predicts', () => {
    const everything = [assessmentPage(), underSixPage(), thirteenPlusPage()]
      .map((page) => flat(render(page)))
      .join(' ');
    expect(everything).not.toMatch(/\b(likely has|probably has|diagnos(is|e) of|\d+\s?%)\b/i);
    expect(everything).not.toMatch(/\b(you should|you must|we recommend)\b/i);
  });

  it('reads nothing the parent has written', () => {
    // docs/04-family-space.md: the app never applies guidance to the data.
    // None of these takes a store, which is the mechanical form of that.
    for (const entry of GUIDANCE) expect(entry.page.length).toBe(0);
  });

  it('never labels a child', () => {
    const everything = [assessmentPage(), underSixPage(), thirteenPlusPage()]
      .map((page) => flat(render(page)))
      .join(' ');
    expect(everything).not.toMatch(/\b(oppositional|conduct disorder|subscale|positive for)\b/i);
  });
});

describe('where the guidance is offered', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  function library(space: 'adult' | 'family'): HTMLElement {
    store.useSpace(space);
    return renderTab('library', {
      space,
      enabled: [],
      known: [],
      store,
      onOpenPage: () => {},
    });
  }

  it('is in the Family Library', () => {
    const text = flat(library('family'));
    for (const entry of GUIDANCE) expect(text).toContain(entry.title);
  });

  it('is not in the Adult one', () => {
    const text = flat(library('adult'));
    expect(text).not.toContain(UNDER_SIX_STRINGS.title);
    expect(text).not.toContain(ASSESSMENT_STRINGS.title);
  });

  it('does not offer the adult screener to a parent', () => {
    // It is the adult instrument, and docs/04-family-space.md routes a parent
    // to the Family space's own material instead.
    expect(flat(library('family'))).not.toContain('Is a formal assessment worth seeking?');
    expect(flat(library('adult'))).toContain('Is a formal assessment worth seeking?');
  });

  it('is there before any child has been added', () => {
    expect(flat(library('family'))).toContain(THIRTEEN_PLUS_STRINGS.title);
  });
});
