import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { allEntries, coverage, describe as describeEntry, settingsPhrase } from './entries';
import { bySetting } from './reports/preparation';
import { threeDays, thirtyDays } from './fixtures/index';
import { tools } from './tools';
import type { ToolContext } from '../../kernel/index';

smokeTest(manifest);

function section(id: string) {
  const found = manifest.contributes.reports?.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no section ${id}`);
  return found;
}

const dates = Object.keys(thirtyDays.days ?? {}).sort();
const context = { dates, days: thirtyDays.days ?? {}, slice: thirtyDays };

/** A tool mounted over an in-memory slice, the way the Tools tab mounts one. */
function mount(index: number, initial: unknown = { version: 1, days: {} }) {
  let slice = initial;
  const host = document.createElement('div');
  const ctx: ToolContext = {
    slice,
    save: (next) => {
      slice = next;
      ctx.slice = next;
    },
    today: '2026-09-20',
    refresh: () => {},
  };
  tools[index]!.mount(host, ctx);
  return { host, read: () => slice as { days?: Record<string, unknown>; childhood?: string } };
}

const type = (host: HTMLElement, label: string, value: string): void => {
  const field = [...host.querySelectorAll('.field')].find((node) =>
    (node.textContent ?? '').includes(label),
  );
  const input = field?.querySelector('input, textarea') as HTMLInputElement | null;
  if (input === null || input === undefined) throw new Error(`no field for ${label}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('preparation: the log', () => {
  it('saves an entry against the day it happened', () => {
    const { host, read } = mount(0);
    type(host, 'What happened?', 'Missed the deadline.');
    click([...host.querySelectorAll('button')].find((b) => b.textContent === 'Save this one'));

    const days = read().days ?? {};
    expect(Object.keys(days)).toEqual(['2026-09-20']);
    expect(allEntries(read() as never)[0]?.what).toBe('Missed the deadline.');
  });

  it('keeps more than one thing that happened on the same day', () => {
    const { host, read } = mount(0);
    const save = [...host.querySelectorAll('button')].find(
      (b) => b.textContent === 'Save this one',
    );
    type(host, 'What happened?', 'First thing.');
    click(save);
    type(host, 'What happened?', 'Second thing.');
    click(save);
    expect(allEntries(read() as never)).toHaveLength(2);
  });

  it('will not save an entry with nothing in it', () => {
    const { host, read } = mount(0);
    click([...host.querySelectorAll('button')].find((b) => b.textContent === 'Save this one'));
    expect(allEntries(read() as never)).toHaveLength(0);
    expect(host.textContent).toContain('Write what happened');
  });

  it('says the same thing after the first entry as after the fifteenth', () => {
    // ADR-024: adding a fifth entry looks exactly like adding a first. A count
    // here, or a word of encouragement, would be a score in disguise.
    const { host } = mount(0);
    const save = [...host.querySelectorAll('button')].find(
      (b) => b.textContent === 'Save this one',
    );
    const messages: string[] = [];
    for (let i = 0; i < 15; i++) {
      type(host, 'What happened?', `Thing ${i}.`);
      click(save);
      messages.push(host.querySelector('.bmsg')?.textContent ?? '');
    }
    expect(new Set(messages).size).toBe(1);
    expect(messages[0]).toBe('Saved.');
  });

  it('keeps what was found about childhood, without rating any of it', () => {
    const { host, read } = mount(1);
    const box = host.querySelector('textarea') as HTMLTextAreaElement;
    box.value = 'Two school reports.';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    expect(read().childhood).toBe('Two school reports.');
    expect(host.querySelectorAll('.chip')).toHaveLength(0);
    expect(host.querySelectorAll('.scale')).toHaveLength(0);
  });
});

describe('preparation: what the record says about itself', () => {
  it('describes how much there is and where it came from', () => {
    const cover = coverage(allEntries(threeDays));
    expect(cover.entries).toBe(3);
    expect(cover.settings).toContain('At work');
    expect(settingsPhrase(['At work', 'At home'])).toBe('at work and at home');
  });

  it('counts nothing toward anything', () => {
    const rendered = section('preparation.entries').render(context);
    // A coverage line is a fact about the record, the way the report header is.
    expect(rendered).toMatch(/\d+ entries across \d+ weeks/);
    // Anything that reads as a judgement of it is not.
    expect(rendered).not.toMatch(
      /\b(that is a lot|suggests|indicates|consistent with|likely|score|total|threshold)\b/i,
    );
  });

  it('never says whether to seek an assessment', () => {
    const both = [
      section('preparation.entries').render(context),
      section('preparation.childhood').render(context),
      section('preparation.entries').renderText(context),
    ].join(' ');
    expect(both).not.toMatch(/worth seeking|you (should|may|might) have|consistent with seeking/i);
  });

  it('groups by setting, because assessment asks about settings', () => {
    const groups = bySetting(allEntries(thirtyDays));
    expect(groups.length).toBeGreaterThan(1);
    // Most-written-about first is a fact about the record, not a ranking of the
    // settings, so the section says nothing about the order.
    expect(groups[0]!.entries.length).toBeGreaterThanOrEqual(groups[1]!.entries.length);
    expect(section('preparation.entries').render(context)).not.toMatch(/most|main|primary/i);
  });

  it('prints the childhood note only when there is one', () => {
    expect(section('preparation.childhood').when?.(context)).toBe(true);
    expect(
      section('preparation.childhood').when?.({ ...context, slice: { version: 1, days: {} } }),
    ).toBe(false);
  });

  it('shows an entry in the words it was written in', () => {
    const entry = allEntries(threeDays)[0]!;
    expect(describeEntry(entry).join(' ')).toContain(entry.what);
    expect(section('preparation.entries').render(context)).not.toContain('undefined');
  });

  it('goes to its own report, not into the clinical one', () => {
    for (const entry of manifest.contributes.reports ?? []) {
      expect(entry.report).toBe('preparation');
    }
  });

  it('asks nothing every day', () => {
    // Not a daily check-in: you open it when something has just happened.
    expect(manifest.contributes.today).toBeUndefined();
  });
});
