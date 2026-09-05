import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { describeCover, describePrescription } from './records';
import { doseLabel, doseSeries, groupByDose, medicationTimeline } from './reports/doses';
import { lines as levelLines, summarise as summariseLevels } from './reports/levels';
import { lines, summarise as summariseStanding } from './reports/standing';
import { grid as sideEffectGrid, summarise as summariseSide } from './reports/sideEffects';
import { threeDays, thirtyDays } from './fixtures/index';
import { today } from './today';

smokeTest(manifest);

const context = { dates: Object.keys(thirtyDays.days).sort(), days: thirtyDays.days };

/** Sections are found by id, never by position: the order is the report's, not this file's. */
function section(id: string) {
  const found = manifest.contributes.reports?.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no section ${id}`);
  return found;
}

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
    expect(describeCover(threeDays.days['2026-09-04'])).toBe('Cover 9:30am to 4:30pm, about 7h');
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
    expect(section('medication.standing').when?.(oneDay)).toBe(false);
    expect(section('medication.standing').when?.(context)).toBe(true);
  });

  it('reaches no conclusion for the clinician', () => {
    const rendered = section('medication.standing').render(context);
    expect(rendered).not.toMatch(
      /\b(should|increase|decrease|recommend|optimal|too low|too high)\b/i,
    );
  });

  it('says the same thing in print and in text', () => {
    const standing = summariseStanding(context)!;
    const text = section('medication.standing').renderText(context);
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
    const rendered = section('medication.side').render(context);
    expect(rendered).toContain('27 of 27 days recorded');
  });

  it('is not shown when nothing was reported', () => {
    expect(section('medication.side').when?.({ dates: [], days: {} })).toBe(false);
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
    expect(entry.whatTheEvidenceSays).toContain(
      'supporting an established treatment rather than being one',
    );
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

describe('medication: dose over time', () => {
  it('draws nothing from a single dose day, and says so in words instead', () => {
    const one = { dates: ['2026-09-01'], days: { '2026-09-01': { dose: '30', unit: 'mg' } } };
    expect(section('medication.doses').when?.(one)).toBe(false);
  });

  it('steps at each change and plots the focus ratings', () => {
    const series = doseSeries(context);
    expect(series).toBeDefined();
    expect(new Set(series!.columns.map((column) => column.step)).size).toBeGreaterThan(1);
    expect(series!.columns.some((column) => typeof column.point === 'number')).toBe(true);
  });

  it('waits for three ratings before it averages any of them', () => {
    const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];
    const days = {
      '2026-09-01': { dose: '30', unit: 'mg', focus: 3 },
      '2026-09-02': { dose: '30', unit: 'mg' },
      '2026-09-03': { dose: '30', unit: 'mg', focus: 5 },
    };
    const series = doseSeries({ dates, days });
    expect(series?.columns.map((column) => column.trend)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(series?.hasTrend).toBe(false);
  });

  it('flags only a rough crash below the axis', () => {
    const dates = ['2026-09-01', '2026-09-02'];
    const series = doseSeries({
      dates,
      days: {
        '2026-09-01': { dose: '30', unit: 'mg', rebound: 'mild' },
        '2026-09-02': { dose: '30', unit: 'mg', rebound: 'rough' },
      },
    });
    expect(series?.columns.map((column) => column.flag)).toEqual([undefined, true]);
  });

  it('replaces the picture with a bracketed note in the text export', () => {
    const text = section('medication.doses').renderText(context);
    expect(text).toContain('[dose chart — see the printed or PDF version]');
    expect(text).not.toContain('<svg');
    expect(text).toMatch(/across \d+ dose levels?: /);
  });
});

describe('medication: the shared day timeline', () => {
  it('puts the cover band, the dose ticks and the rebound dot on a row', () => {
    const parts = medicationTimeline.parts({
      onset: '09:30',
      woreOff: '16:30',
      times: ['08:00', ''],
      rebound: 'rough',
      reboundTime: '17:15',
    });
    expect(parts.bands).toEqual([{ from: '09:30', to: '16:30', className: 'coverband' }]);
    expect(parts.ticks).toEqual(['08:00']);
    expect(parts.marks).toEqual([{ at: '17:15', className: 'rbmark', radius: 2.6 }]);
  });

  it('marks a mild rebound smaller than a rough one', () => {
    const mild = medicationTimeline.parts({ rebound: 'mild', reboundTime: '17:00' });
    expect(mild.marks?.[0]?.radius).toBeLessThan(2.6);
  });

  it('falls back to where the cover ran out when no rebound time was given', () => {
    const parts = medicationTimeline.parts({ rebound: 'mild', onset: '09:00', woreOff: '16:00' });
    expect(parts.marks?.[0]?.at).toBe('16:00');
  });

  it('puts nothing on a row it has nothing for', () => {
    expect(medicationTimeline.parts({ focus: 4 })).toEqual({});
  });
});

describe('medication: how each dose performed', () => {
  it('makes one block per prescription that was in force', () => {
    const levels = summariseLevels(context);
    expect(levels.length).toBeGreaterThan(1);
    expect(levels[0]?.days).toBeGreaterThan(0);
    expect(levels.map((level) => level.label)).toEqual([...new Set(levels.map((l) => l.label))]);
  });

  it('states the days each block rests on', () => {
    const rendered = section('medication.levels').render(context);
    expect(rendered).toMatch(/\d+ days<\/span>/);
  });

  it('leaves out the sleep line entirely without the sleep module', () => {
    const [level] = summariseLevels(context);
    expect(levelLines(level!).some((line) => line.startsWith('Sleep'))).toBe(false);
  });

  it('adds the sleep line when sleep is there', () => {
    const nights = Object.fromEntries(
      context.dates.map((date) => [date, { bed: '23:00', wake: '07:00', hours: '8' }]),
    );
    const [level] = summariseLevels({ ...context, moduleDays: { sleep: nights } });
    const sleepLine = levelLines(level!).find((line) => line.startsWith('Sleep'));
    expect(sleepLine).toContain('8.0h');
    expect(sleepLine).toContain('up around 7am');
  });

  it('shows the person’s own baseline above the blocks, never a computed one', () => {
    const withBaseline = {
      ...context,
      baseline: { focus: 2, mood: 2, sleep: '6', note: 'Rough.' },
    };
    const rendered = section('medication.levels').render(withBaseline);
    expect(rendered).toContain('Before medication');
    expect(rendered).toContain('self-rated baseline');
    expect(rendered).toContain('Focus 2 · mood 2 · sleep 6h');
    expect(rendered.indexOf('Before medication')).toBeLessThan(rendered.indexOf('class="lvl">'));
  });

  it('says nothing about a baseline that was never set', () => {
    expect(section('medication.levels').render(context)).not.toContain('Before medication');
  });
});

describe('medication: the severity grid', () => {
  it('draws one column per day and one row per thing reported', () => {
    const shape = sideEffectGrid(context);
    expect(shape).toBeDefined();
    expect(shape!.cells[0]).toHaveLength(context.dates.length);
    expect(shape!.rowLabels.length).toBeGreaterThan(0);
  });

  it('shades a day that was reported without a severity differently from a blank one', () => {
    const dates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'];
    const shape = sideEffectGrid({
      dates,
      days: {
        '2026-09-01': { side: ['dry'] },
        '2026-09-02': { side: ['dry'], detail: { dry: { sev: 'severe' } } },
        '2026-09-03': {},
        '2026-09-04': { side: [] },
      },
    });
    expect(shape?.cells[0]).toEqual(['sev0', 'sev3', 'cellblank', 'cellblank']);
  });

  it('holds off until there are enough days to make a shape', () => {
    const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];
    expect(
      sideEffectGrid({ dates, days: Object.fromEntries(dates.map((d) => [d, { side: ['dry'] }])) }),
    ).toBeUndefined();
  });

  it('keeps the table underneath it, because the text export needs one', () => {
    const rendered = section('medication.side').render(context);
    expect(rendered).toContain('<svg');
    expect(rendered).toContain('<table>');
    expect(section('medication.side').renderText(context)).toContain(
      '[severity grid — see the printed or PDF version]',
    );
  });
});
