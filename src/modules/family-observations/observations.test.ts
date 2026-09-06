import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { allEntries, coverage, record, remove, settingsPhrase } from './entries';
import { bySetting } from './reports/observations';
import { threeDays, thirtyDays } from './fixtures/index';
import { tools } from './tools';
import { audienceInSpace, type ToolContext } from '../../kernel/index';

smokeTest(manifest);

function mount(initial: unknown = { version: 1, days: {} }) {
  let slice = initial;
  const host = document.createElement('div');
  tools[0]!.mount(host, {
    get slice() {
      return slice;
    },
    reads: {},
    save: (next) => {
      slice = next;
    },
    today: '2026-09-20',
    refresh: () => {},
  } as ToolContext);
  return { host, read: () => slice as Record<string, unknown> };
}

const type = (host: HTMLElement, label: string, value: string): void => {
  const wrapper = [...host.querySelectorAll('.field')].find((node) =>
    (node.textContent ?? '').includes(label),
  );
  const input = wrapper?.querySelector('input, textarea') as HTMLInputElement | null;
  if (input === null || input === undefined) throw new Error(`no field for ${label}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const press = (host: HTMLElement, text: string): void => {
  const button = [...host.querySelectorAll('button')].find((b) => b.textContent === text);
  if (button === undefined) throw new Error(`no button "${text}"`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const section = () => manifest.contributes.reports![0]!;
const context = {
  dates: Object.keys(thirtyDays.days ?? {}).sort(),
  days: thirtyDays.days ?? {},
  slice: thirtyDays,
};

describe('family observations: the four fields', () => {
  it('asks what docs/04-family-space.md says to ask, and nothing else', () => {
    const { host } = mount();
    const labels = [...host.querySelectorAll('.field')].map(
      (node) => (node.textContent ?? '').split('\n')[0],
    );
    const joined = labels.join(' | ');
    expect(joined).toContain('When did it happen?');
    expect(joined).toContain('Where?');
    expect(joined).toContain('What happened?');
    expect(joined).toContain('What was going on beforehand?');
    expect(joined).toContain('Did anything help?');
  });

  it('saves an entry against the day it happened', () => {
    const { host, read } = mount();
    type(host, 'What happened?', 'Ran off in the supermarket.');
    press(host, 'Save this one');
    const entries = allEntries(read() as never);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ where: 'home', date: '2026-09-20' });
  });

  it('will not save an empty one', () => {
    const { host, read } = mount();
    press(host, 'Save this one');
    expect(allEntries(read() as never)).toHaveLength(0);
    expect(host.textContent).toContain('Write what happened');
  });

  it('keeps more than one thing from the same day', () => {
    const first = record(undefined, '2026-09-20', { id: 'a', where: 'home', what: 'One' });
    expect(
      allEntries(record(first, '2026-09-20', { id: 'b', where: 'school', what: 'Two' })),
    ).toHaveLength(2);
  });

  it('drops the day when its last entry goes', () => {
    const one = record(undefined, '2026-09-20', { id: 'a', where: 'home', what: 'One' });
    expect(Object.keys(remove(one, '2026-09-20', 'a').days ?? {})).toEqual([]);
  });
});

describe('family observations: nothing is scored', () => {
  it('says the same word after the fifteenth as after the first', () => {
    const { host } = mount();
    const said: string[] = [];
    for (let i = 0; i < 15; i++) {
      type(host, 'What happened?', `Thing ${i}`);
      press(host, 'Save this one');
      said.push(host.querySelector('.bmsg')?.textContent ?? '');
    }
    expect(new Set(said).size).toBe(1);
    expect(said[0]).toBe('Saved.');
  });

  it('rates nothing on a scale', () => {
    // docs/04-family-space.md: "Nothing is scored. Nothing is rated on a scale."
    const { host } = mount(thirtyDays);
    expect(host.querySelectorAll('.scale')).toHaveLength(0);
    expect(host.querySelector('progress')).toBeNull();
  });

  it('describes the record without interpreting it', () => {
    const rendered = section().render(context);
    expect(rendered).toMatch(/\d+ entries across \d+ weeks/);
    expect(rendered).not.toMatch(
      /\b(suggests|indicates|consistent with|likely|concerning|score|total|threshold|a lot)\b/i,
    );
  });

  it('never labels anything as a condition', () => {
    // docs/04-family-space.md: "These are never labelled as disorders in the app."
    // Checked on what a parent actually sees rather than on the whole module —
    // the Library entry says the words in order to promise not to use them.
    const shown = [
      section().render(context),
      section().renderText(context),
      mount(thirtyDays).host.textContent ?? '',
    ].join(' ');
    expect(shown).not.toMatch(
      /\b(oppositional|conduct disorder|anxiety disorder|depression screen|subscale|positive for)\b/i,
    );
  });

  it('promises in the Library not to label, which is a different thing', () => {
    expect(manifest.contributes.library.whatItWontDo).toContain(
      'nothing you write becomes a category, a subscale or a suspected condition',
    );
  });

  it('never says whether to seek an assessment', () => {
    const everything = `${section().render(context)} ${JSON.stringify(manifest.contributes.library)}`;
    expect(everything).not.toMatch(/you should (seek|see|book)|worth seeking|we recommend/i);
  });
});

describe('family observations: the printed page', () => {
  it('carries the coverage line docs/04-family-space.md asks for', () => {
    const cover = coverage(allEntries(threeDays));
    expect(cover.entries).toBe(3);
    expect(settingsPhrase(['At home', 'At school'])).toBe('at home and at school');
    expect(section().render(context)).toMatch(/entries across \d+ weeks, from /);
  });

  it('groups by setting, because assessment asks across settings', () => {
    const groups = bySetting(allEntries(thirtyDays));
    expect(groups.length).toBeGreaterThan(1);
    expect(section().render(context)).not.toMatch(/main|primary|most concerning/i);
  });

  it('goes to the observations report, never to the clinical one', () => {
    for (const entry of manifest.contributes.reports ?? []) {
      expect(entry.report).toBe('observations');
    }
  });

  it('is a Family-space module, and the engine can tell', () => {
    // A report names a space and a module names an audience; "parent" is a
    // Family audience and never equals "family".
    expect(manifest.audience).toBe('parent');
    expect(audienceInSpace('parent', 'family')).toBe(true);
    expect(audienceInSpace('parent', 'adult')).toBe(false);
    expect(audienceInSpace('adult', 'family')).toBe(false);
    expect(audienceInSpace('child', 'family')).toBe(true);
  });
});

describe('family observations: what it claims', () => {
  it('is honest that the evidence is for assessment, not for the notebook', () => {
    expect(manifest.contributes.library.whatTheEvidenceSays).toContain(
      'The evidence is for assessment, not for this',
    );
    expect(manifest.contributes.library.whatTheEvidenceSays).toContain('not claimed as one');
  });

  it('answers the pipeline concern rather than leaving it', () => {
    expect(manifest.contributes.library.whatItWontDo).toContain('There is no score here');
    expect(manifest.contributes.library.whatItWontDo).toContain('not a screening questionnaire');
  });
});
