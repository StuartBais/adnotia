import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { KINDS } from './strings';
import { describe as describeMovement, movements, record, remove } from './state';
import { tools } from './tools';
import { thirtyDays } from './fixtures/index';
import type { ToolContext } from '../../kernel/index';

smokeTest(manifest);

function mount(initial: unknown = { version: 1 }) {
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

describe('exercise: the log', () => {
  it('notes what it was and roughly how long', () => {
    const { host, read } = mount();
    type(host, 'Roughly how long', '25');
    press(host, 'Note it');
    const noted = movements(read() as never);
    expect(noted).toHaveLength(1);
    expect(noted[0]).toMatchObject({ kind: 'walk', minutes: 25, date: '2026-09-20' });
  });

  it('needs a number of minutes', () => {
    const { host, read } = mount();
    press(host, 'Note it');
    expect(read()['days']).toBeUndefined();
    expect(host.textContent).toContain('A number of minutes');
  });

  it('keeps an optional note, and does not invent one', () => {
    const { host, read } = mount();
    type(host, 'Roughly how long', '30');
    type(host, 'Anything worth remembering', 'Quieter afterwards');
    press(host, 'Note it');
    expect(movements(read() as never)[0]?.note).toBe('Quieter afterwards');

    const { host: second, read: readSecond } = mount();
    type(second, 'Roughly how long', '10');
    press(second, 'Note it');
    expect(movements(readSecond() as never)[0]?.note).toBeUndefined();
  });

  it('does not rank one kind of movement above another', () => {
    // Housework is on the list beside running, and nothing weights them.
    const kinds = KINDS.map((option) => option.v);
    expect(kinds).toContain('housework');
    expect(kinds).toContain('run');
    expect(JSON.stringify(KINDS)).not.toMatch(/\b(intensity|vigorous|moderate|light|points)\b/i);
  });

  it('sets no target and keeps no total', () => {
    const { host } = mount(thirtyDays);
    const text = host.textContent ?? '';
    expect(text).not.toMatch(
      /\b(goal|target|streak|this week|total|minutes so far|\d+ of \d+|per week)\b/i,
    );
    expect(host.querySelector('progress')).toBeNull();
  });

  it('says the same word however many there are', () => {
    const { host } = mount();
    const said: string[] = [];
    for (let i = 0; i < 10; i++) {
      type(host, 'Roughly how long', '20');
      press(host, 'Note it');
      said.push(host.querySelector('.bmsg')?.textContent ?? '');
    }
    expect(new Set(said).size).toBe(1);
    expect(said[0]).toBe('Noted.');
  });

  it('drops the day when its last movement goes', () => {
    const one = record(undefined, '2026-09-20', { id: 'a', kind: 'walk', minutes: 10 });
    expect(Object.keys(remove(one, '2026-09-20', 'a').days ?? {})).toEqual([]);
  });

  it('reads a movement back in plain words', () => {
    expect(describeMovement({ id: 'a', kind: 'walk', minutes: 25 }, 'A walk')).toBe(
      'A walk, 25 minutes',
    );
    expect(
      describeMovement({ id: 'a', kind: 'walk', minutes: 25, note: 'Quieter' }, 'A walk'),
    ).toBe('A walk, 25 minutes — Quieter');
  });
});

describe('exercise: what it claims', () => {
  it('puts the limit on the tool, not only in the Library', () => {
    const { host } = mount();
    expect(host.textContent).toContain('short-lived lift in attention');
    expect(host.textContent).toContain('not proven');
  });

  it('leads the evidence paragraph with the limit', () => {
    const says = manifest.contributes.library.whatTheEvidenceSays;
    expect(says.slice(0, says.indexOf('.') + 1)).toContain(
      'Less than the way it is usually talked about',
    );
  });

  it('is honest that the measured effect is the next hour, not the condition', () => {
    expect(manifest.contributes.library.whatTheEvidenceSays).toContain(
      'closer to "the next hour goes better"',
    );
  });

  it('does not tell anyone what to do or how much', () => {
    const entry = manifest.contributes.library;
    expect(entry.whatItWontDo).toContain('will not tell you what to do or how much');
    // And says the log knows nothing about a reason to be careful.
    expect(entry.whatItWontDo).toContain('this log has no idea about it');
  });

  it('never calls itself evidence-based, because it is Tier B', () => {
    const entry = manifest.contributes.library;
    expect(entry.tier).toBe('B');
    const prose = `${entry.whatItIs} ${entry.whatTheEvidenceSays} ${entry.whatItWontDo}`;
    expect(prose.toLowerCase()).not.toContain('evidence-based');
  });
});
