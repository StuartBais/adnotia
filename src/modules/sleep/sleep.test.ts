import { describe, expect, it } from 'vitest';
import { smokeTest } from '../../../tests/harness/smoke';
import manifest from './manifest';
import { derive } from './today';
import { describeNight } from './records';
import { summarise } from './reports/clinical';
import { threeDays, thirtyDays } from './fixtures/index';

smokeTest(manifest);

describe('sleep: hours', () => {
  it('follows from the two times, rounded to the quarter hour', () => {
    expect(derive({ bed: '23:00', wake: '07:00' })).toEqual({ hours: '8' });
    expect(derive({ bed: '23:40', wake: '07:00' })).toEqual({ hours: '7.25' });
  });

  it('crosses midnight', () => {
    // 23:40 to 07:00 is seven and a bit hours, not minus sixteen.
    expect(derive({ bed: '23:40', wake: '07:00' })).toEqual({ hours: '7.25' });
    expect(derive({ bed: '00:20', wake: '06:45' })).toEqual({ hours: '6.5' });
  });

  it('derives nothing without both times', () => {
    expect(derive({ bed: '23:00' })).toEqual({});
    expect(derive({ wake: '07:00' })).toEqual({});
    expect(derive({})).toEqual({});
  });
});

describe('sleep: records', () => {
  it('describes a night in the person’s own words', () => {
    const line = describeNight(threeDays.days['2026-09-02']);
    expect(line).toContain('11:40pm to 7am');
    expect(line).toContain('7h 20m between those');
    expect(line).toContain('Took ages to drop off');
    expect(line).toContain('about 45 minutes to drop off');
  });

  it('says nothing about a night with nothing in it', () => {
    expect(describeNight(undefined)).toBe('');
    expect(describeNight({})).toBe('');
  });
});

describe('sleep: the clinical section', () => {
  const context = {
    dates: Object.keys(thirtyDays.days).sort(),
    days: thirtyDays.days,
  };

  it('states its own coverage', () => {
    const summary = summarise(context);
    expect(summary.nights).toBe(27);
    expect(summary.ofNights).toBe(27);
    expect(manifest.contributes.reports?.[0]?.render(context)).toContain(
      '27 of 27 nights recorded',
    );
  });

  it('averages bed times across midnight rather than around noon', () => {
    const straddling = {
      dates: ['2026-09-01', '2026-09-02'],
      days: {
        '2026-09-01': { bed: '23:40', wake: '07:00' },
        '2026-09-02': { bed: '00:20', wake: '07:00' },
      },
    };
    expect(summarise(straddling).typicalBed).toBe('12am');
  });

  it('counts each reported quality against the nights recorded', () => {
    const summary = summarise(context);
    const latency = summary.reported.find((entry) => entry.label === 'Took ages to drop off');
    expect(latency?.count).toBeGreaterThan(0);
    expect(latency?.count).toBeLessThanOrEqual(summary.nights);
  });

  it('is not shown when nothing was recorded', () => {
    expect(manifest.contributes.reports?.[0]?.when?.({ dates: [], days: {} })).toBe(false);
  });

  it('says the same thing in print and in text', () => {
    const section = manifest.contributes.reports?.[0];
    const summary = summarise(context);
    expect(section?.renderText(context)).toContain(
      `${summary.nights} of ${summary.ofNights} nights recorded.`,
    );
  });
});

describe('sleep: the Library entry', () => {
  it('is Tier B, as the rubric proposes', () => {
    expect(manifest.tier).toBe('B');
    expect(manifest.contributes.library.tier).toBe('B');
  });

  it('is honest that this is a record rather than a measurement', () => {
    expect(manifest.contributes.library.whatItIs).toContain('not a sleep tracker');
    expect(manifest.contributes.library.whatItWontDo).toContain('measures nothing while you sleep');
  });

  it('does not call itself evidence-based', () => {
    const entry = manifest.contributes.library;
    expect(entry.whatTheEvidenceSays.toLowerCase()).not.toContain('evidence-based');
    expect(entry.whatTheEvidenceSays).toContain('promising rather than established');
  });

  it('is reviewed at six months, the Tier B interval', () => {
    expect(manifest.contributes.library.reviewed).toBe('2026-09');
    expect(manifest.contributes.library.nextReview).toBe('2027-03');
  });
});
