import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { PRACTICES, byId } from './practices';
import { record, remove, sessions } from './state';
import { tools } from './tools';
import { threeDays, thirtyDays } from './fixtures/index';
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

const press = (host: HTMLElement, text: string): void => {
  const button = [...host.querySelectorAll('button')].find((b) => b.textContent === text);
  if (button === undefined) throw new Error(`no button "${text}"`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('mindfulness: the practices', () => {
  it('offers three, each short enough to actually do', () => {
    expect(PRACTICES).toHaveLength(3);
    expect(PRACTICES.map((practice) => practice.minutes)).toEqual([3, 10, 5]);
    for (const practice of PRACTICES) {
      expect(practice.steps.length, practice.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('says that losing attention is the practice, not a failure of it', () => {
    const all = PRACTICES.flatMap((practice) => practice.steps).join(' ');
    expect(all).toContain('that is the practice, not a failure of it');
    expect(all).not.toMatch(/\b(clear your mind|empty your mind|stop thinking)\b/i);
  });

  it('needs no audio, because there is none in this build', () => {
    const { host } = mount();
    expect(host.querySelector('audio')).toBeNull();
    expect(JSON.stringify(PRACTICES)).not.toMatch(/\.mp3|\.m4a|\.ogg|audio/i);
  });
});

describe('mindfulness: the log', () => {
  it('records what was done against today', () => {
    const { host, read } = mount();
    press(host, 'I did this one');
    const done = sessions(read() as never);
    expect(done).toHaveLength(1);
    expect(done[0]?.practice).toBe('three-minutes');
    expect(done[0]?.date).toBe('2026-09-20');
  });

  it('says the same word however many there are', () => {
    const { host } = mount();
    const said: string[] = [];
    for (let i = 0; i < 12; i++) {
      press(host, 'I did this one');
      said.push(host.querySelector('.bmsg:not(.timer-status)')?.textContent ?? '');
    }
    expect(new Set(said).size).toBe(1);
    expect(said[0]).toBe('Noted.');
  });

  it('keeps no run, no total and no count of days', () => {
    // docs/03-scope.md hard exclusion 9. A practice you can fall behind on is
    // one more thing to fail at.
    const { host } = mount(thirtyDays);
    const text = host.textContent ?? '';
    expect(text).not.toMatch(/\b(streak|in a row|\d+ days?|total|this week|consecutive)\b/i);
    expect(host.querySelector('progress')).toBeNull();
  });

  it('adds to a day that already has one rather than replacing it', () => {
    const first = record(undefined, '2026-09-20', { id: 'a', practice: 'noting', minutes: 5 });
    const both = record(first, '2026-09-20', { id: 'b', practice: 'body-scan', minutes: 10 });
    expect(sessions(both)).toHaveLength(2);
  });

  it('drops the day entirely when its last session goes', () => {
    const one = record(undefined, '2026-09-20', { id: 'a', practice: 'noting', minutes: 5 });
    expect(Object.keys(remove(one, '2026-09-20', 'a').days ?? {})).toEqual([]);
  });

  it('reads back a fixture without inventing a practice name', () => {
    for (const session of sessions(threeDays)) {
      expect(byId(session.practice), session.practice).toBeDefined();
    }
  });
});

describe('mindfulness: what it claims', () => {
  it('puts the limit on the practice, not only in the Library', () => {
    const { host } = mount();
    expect(host.textContent).toContain('low or very low confidence');
    expect(host.textContent).toContain('not proven');
  });

  it('leads the evidence paragraph with the limit', () => {
    // docs/08-roadmap.md: the limits are clear in the first paragraph.
    const says = manifest.contributes.library.whatTheEvidenceSays;
    const firstSentence = says.slice(0, says.indexOf('.') + 1);
    expect(firstSentence).toContain('thinner than it is usually sold as');
  });

  it('says the trials tested a taught course, not three screens', () => {
    expect(manifest.contributes.library.whatTheEvidenceSays).toContain('not three screens');
    expect(manifest.contributes.library.whatItWontDo).toContain('taught course');
  });

  it('never calls itself evidence-based, because it is Tier B', () => {
    const entry = manifest.contributes.library;
    expect(entry.tier).toBe('B');
    const prose = `${entry.whatItIs} ${entry.whatTheEvidenceSays} ${entry.whatItWontDo}`;
    expect(prose.toLowerCase()).not.toContain('evidence-based');
  });

  it('reviews sooner than a Tier A entry would', () => {
    // docs/02-evidence-rubric.md: six months for Tier B, where it is moving.
    expect(manifest.contributes.library.nextReview).toBe('2027-03');
  });
});
