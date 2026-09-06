import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { PARENT_MODULE, tools } from './tools';
import { threeDays as parentSetup } from '../family-routines/fixtures/index';
import {
  CHILD_ALLOWED_CONTRIBUTIONS,
  validateManifest,
  type ToolContext,
} from '../../kernel/index';

smokeTest(manifest);

const TIMER = 0;
const SCHEDULE = 1;
const FIRST_THEN = 2;
const CHART = 3;

function mount(index: number, reads: Record<string, unknown> = {}) {
  const host = document.createElement('div');
  const saved: unknown[] = [];
  tools[index]!.mount(host, {
    slice: { version: 1 },
    reads,
    save: (next) => saved.push(next),
    today: '2026-09-20',
    refresh: () => {},
  } as ToolContext);
  return { host, saved };
}

const setUp = { [PARENT_MODULE]: parentSetup };

describe('what a child module is allowed to be', () => {
  it('declares only tools and a library', () => {
    // docs/04-family-space.md: no today fields, no reports, no free text, no links.
    expect(Object.keys(manifest.contributes).sort()).toEqual(['library', 'tools']);
    for (const key of Object.keys(manifest.contributes)) {
      expect(CHILD_ALLOWED_CONTRIBUTIONS).toContain(key);
    }
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('would be refused if it declared anything else', () => {
    const bad = {
      ...manifest,
      contributes: {
        ...manifest.contributes,
        today: [{ id: 'x', label: 'How was today?', type: 'text' as const, cost: 5 }],
      },
    };
    const issues = validateManifest(bad);
    expect(issues.some((issue) => issue.rule === 'child-surface')).toBe(true);
  });

  it('reads the parent’s setup as a declared dependency', () => {
    expect(manifest.dependencies).toEqual([PARENT_MODULE]);
  });
});

describe('the four things on the screen', () => {
  it('offers a timer a child can start without typing', () => {
    const { host } = mount(TIMER);
    expect(host.querySelector('.timer-face')?.textContent).toBe('5:00');
    expect(host.querySelectorAll('input, textarea')).toHaveLength(0);
    const options = [...host.querySelectorAll('.chip')].map((c) => c.textContent);
    expect(options).toEqual(['1 min', '2 min', '5 min', '10 min', '20 min']);
  });

  it('changes the timer when another length is tapped', () => {
    const { host } = mount(TIMER);
    const twenty = [...host.querySelectorAll('.chip')].find((c) => c.textContent === '20 min')!;
    twenty.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.querySelector('.timer-face')?.textContent).toBe('20:00');
  });

  it('shows the routine the parent built, in order', () => {
    const { host } = mount(SCHEDULE, setUp);
    expect(host.textContent).toContain('Getting out in the morning');
    const steps = [...host.querySelectorAll('.child-steps li')].map((li) =>
      (li.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(steps[0]).toContain('Breakfast');
    expect(steps[steps.length - 1]).toContain('Teeth');
  });

  it('shows the first/then pair the parent set', () => {
    const { host } = mount(FIRST_THEN, setUp);
    expect(host.textContent).toContain('Shoes');
    expect(host.textContent).toContain('Tablet');
  });

  it('shows the chart to look at and not to press', () => {
    const { host } = mount(CHART, setUp);
    // View only: no award control on the screen a child is holding.
    expect(host.querySelectorAll('button')).toHaveLength(0);
    expect(host.textContent).not.toMatch(/give a star|start again/i);
  });

  it('leaves the chart titled once, in the child’s own words', () => {
    const host = document.createElement('div');
    tools[CHART]!.mount(host, {
      slice: { version: 1 },
      reads: setUp,
      save: () => {},
      today: '',
      nickname: 'Sam',
      refresh: () => {},
    } as ToolContext);
    // The tool's own card says "Your stars"; the chart does not repeat it.
    expect(host.textContent).not.toContain("Sam's chart");
    expect(host.querySelectorAll('h2')).toHaveLength(0);
  });

  it('says plainly when a parent has set nothing up', () => {
    expect(mount(SCHEDULE).host.textContent).toContain('Nothing on the list.');
    expect(mount(FIRST_THEN).host.textContent).toContain('Nothing set.');
    expect(mount(CHART).host.textContent).toContain('No stars yet.');
  });
});

describe('what a child cannot do from here', () => {
  it('enters no text anywhere', () => {
    for (const index of [TIMER, SCHEDULE, FIRST_THEN, CHART]) {
      const { host } = mount(index, setUp);
      expect(host.querySelectorAll('input[type="text"], textarea'), String(index)).toHaveLength(0);
    }
  });

  it('follows no link anywhere', () => {
    for (const index of [TIMER, SCHEDULE, FIRST_THEN, CHART]) {
      expect(mount(index, setUp).host.querySelectorAll('a')).toHaveLength(0);
    }
  });

  it('changes nothing the parent set up', () => {
    // The chart, the routine and the pair arrive through `reads`, which has no
    // setter. Nothing a child touches writes.
    for (const index of [SCHEDULE, FIRST_THEN, CHART]) {
      const { host, saved } = mount(index, setUp);
      for (const button of host.querySelectorAll('button')) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      expect(saved, String(index)).toEqual([]);
    }
  });

  it('records nothing about what they pressed', () => {
    const { host, saved } = mount(TIMER);
    [...host.querySelectorAll('button')].forEach((b) =>
      b.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    );
    expect(saved).toEqual([]);
  });
});

describe('what it claims', () => {
  it('is Tier C, and says the four screens are untested', () => {
    expect(manifest.tier).toBe('C');
    expect(manifest.contributes.library.whatTheEvidenceSays).toContain(
      'no trial has tested this timer or this board',
    );
  });

  it('tells the parent nothing is collected about their child', () => {
    expect(manifest.contributes.library.whatItWontDo).toContain(
      'collects nothing about your child',
    );
    expect(manifest.contributes.library.whatItWontDo).toContain(
      'does not replace being in the room',
    );
  });
});
