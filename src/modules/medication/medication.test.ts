import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { describeCover, describePrescription } from './records';
import { doseLabel, groupByDose } from './reports/doses';
import { lines, summarise as summariseStanding } from './reports/standing';
import { summarise as summariseSide } from './reports/sideEffects';
import { threeDays, thirtyDays } from './fixtures/index';
import { today } from './today';

smokeTest(manifest);

const context = { dates: Object.keys(thirtyDays.days).sort(), days: thirtyDays.days };

describe('medication: today fields', () => {
  it('carries the prescription from the nearest earlier day', () => {
    for (const id of ['med', 'dose', 'unit', 'times']) {
      expect(today.find((field) => field.id === id)?.carry).toBe('nearestPrior');
    }
  });

  it('asks nothing about a side effect that was not ticked', () => {
    const side = today.find((field) => field.id === 'side');
    expect(side?.followUp?.([])).toEqual([]);
    expect(side?.followUp?.(undefined)).toEqual([]);
  });

  it('asks about severity, timing and a note once one is ticked', () => {
    const side = today.find((field) => field.id === 'side');
    const asked = side?.followUp?.(['dry']) ?? [];
    expect(asked.map((field) => field.id)).toEqual([
      'detail.dry.sev',
      'detail.dry.time',
      'detail.dry.note',
    ]);
  });

  it('asks when the rebound was only if there was one', () => {
    const rebound = today.find((field) => field.id === 'rebound');
    expect(rebound?.followUp?.('none')).toEqual([]);
    expect(rebound?.followUp?.('mild')?.[0]?.id).toBe('reboundTime');
  });
});

describe('medication: records', () => {
  it('describes a prescription the way a person would say it', () => {
    expect(describePrescription(threeDays.days['2026-09-04'])).toBe('Elvanse 50mg at 8am');
  });

  it('describes a split dose', () => {
    expect(
      describePrescription({ med: 'Elvanse', dose: '50', unit: 'mg', times: ['08:00', '14:00'] }),
    ).toBe('Elvanse 50mg at 8am and 2pm');
  });

  it('describes cover the way the docs do', () => {
    // docs/07-design-system.md "Voice": "Cover 9:30am to 4:30pm, about 7h".
    expect(describeCover(threeDays.days['2026-09-04'])).toBe(
      'Cover 9:30am to 4:30pm, about 7h',
    );
  });

  it('says nothing about a day with nothing recorded', () => {
    expect(describePrescription(undefined)).toBe('');
    expect(describeCover({})).toBe('');
  });
});

describe('medication: grouping by dose', () => {
  it('separates the runs at each prescription', () => {
    const groups = groupByDose(context.dates, context.days);
    expect(groups.map((group) => doseLabel(group))).toEqual(['Elvanse 30mg', 'Elvanse 50mg']);
  });

  it('counts the days at each', () => {
    const groups = groupByDose(context.dates, context.days);
    expect(groups[0]?.days.length).toBe(8);
    expect(groups[1]?.days.length).toBe(19);
  });
});

describe('medication: where things stand', () => {
  it('is about the current dose, not the whole range', () => {
    const standing = summariseStanding(context);
    expect(standing?.label).toBe('Elvanse 50mg');
    expect(standing?.days).toBe(19);
  });

  it('puts the four things a prescriber weighs side by side, and stops', () => {
    const standing = summariseStanding(context);
    const labels = lines(standing!).map((row) => row.label);
    expect(labels).toEqual(['Efficacy', 'Duration', 'Tolerability', 'Adherence']);
  });

  it('says nothing about a waking day without the sleep module', () => {
    const standing = summariseStanding(context);
    expect(standing?.waking).toBeUndefined();
    expect(lines(standing!)[1]?.body).not.toContain('waking day');
  });

  it('uses sleep when it is there, as a declared optional dependency', () => {
    const withSleep = summariseStanding({
      ...context,
      moduleDays: {
        sleep: Object.fromEntries(
          context.dates.map((date) => [date, { bed: '23:00', wake: '07:00' }]),
        ),
      },
    });
    expect(withSleep?.waking).toBe('16h');
    expect(lines(withSleep!)[1]?.body).toContain('across a 16h waking day');
  });

  it('shows the baseline beside the rating when there is one', () => {
    const withBaseline = summariseStanding({ ...context, baseline: { focus: 2 } });
    expect(lines(withBaseline!)[0]?.body).toContain('against a self-rated 2/5 before medication');
  });

  it('waits for three days at a dose before saying anything', () => {
    const oneDay = { dates: ['2026-09-02'], days: { '2026-09-02': threeDays.days['2026-09-02']! } };
    expect(manifest.contributes.reports?.[0]?.when?.(oneDay)).toBe(false);
    expect(manifest.contributes.reports?.[0]?.when?.(context)).toBe(true);
  });

  it('reaches no conclusion for the clinician', () => {
    const rendered = manifest.contributes.reports?.[0]?.render(context) ?? '';
    expect(rendered).not.toMatch(/\b(should|increase|decrease|recommend|optimal|too low|too high)\b/i);
  });

  it('says the same thing in print and in text', () => {
    const standing = summariseStanding(context)!;
    const text = manifest.contributes.reports?.[0]?.renderText(context) ?? '';
    for (const row of lines(standing)) expect(text).toContain(row.body);
  });
});

describe('medication: side effects', () => {
  it('counts days and the worst rating, never a score', () => {
    const summary = summariseSide(context);
    const dry = summary.rows.find((row) => row.label === 'Dry mouth');
    expect(dry?.days).toBe(7);
    expect(dry?.worst).toBe('moderate');
    expect(summariseSide(context).rows.every((row) => typeof row.worst === 'string')).toBe(true);
  });

  it('states its own coverage', () => {
    const rendered = manifest.contributes.reports?.[1]?.render(context) ?? '';
    expect(rendered).toContain('27 of 27 days recorded');
  });

  it('is not shown when nothing was reported', () => {
    expect(manifest.contributes.reports?.[1]?.when?.({ dates: [], days: {} })).toBe(false);
  });
});

describe('medication: the Library entry', () => {
  it('is Tier A supporting, as the rubric proposes', () => {
    expect(manifest.tier).toBe('A');
    expect(manifest.contributes.library.tier).toBe('A');
  });

  it('is clear the evidence is for the treatment, not for the log', () => {
    const entry = manifest.contributes.library;
    expect(entry.whatTheEvidenceSays).toContain('That evidence is for the treatment, not for this');
    expect(entry.whatTheEvidenceSays).toContain('supporting an established treatment rather than being one');
  });

  it('says plainly what it will not do', () => {
    const wont = manifest.contributes.library.whatItWontDo;
    expect(wont).toContain('will not tell you or your prescriber what dose to take');
    expect(wont).toContain('does not calculate doses, check interactions');
    expect(wont).toContain('you see first, in the same words');
  });
});

describe('medication: the dependency on sleep', () => {
  it('is declared, because it reads another module’s data', () => {
    expect(manifest.dependencies).toEqual(['sleep']);
  });
});
