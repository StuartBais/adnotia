import { describe, expect, it } from 'vitest';
import {
  MAX_OBSERVATIONS,
  backupNag,
  buildMirror,
  kernelObservations,
  NAG_INTERVAL_DAYS,
  type IsoDate,
  type MirrorObservation,
  type ModuleManifest,
  type ReportContext,
} from '../../src/kernel/index';

// The screen-only reflection and the backup reminder. See
// docs/decisions/ADR-019-the-mirror-and-the-nag.md, ADR-005 and docs/03-scope.md
// "Why there is no covert assessment".

const NOW = new Date('2026-10-01T12:00:00Z');

function dates(count: number): IsoDate[] {
  return Array.from({ length: count }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
}

function context(over: Partial<ReportContext> = {}): ReportContext {
  const span = dates(30);
  return {
    report: 'clinical',
    range: { choice: 'all', from: span[0]!, to: span.at(-1)!, dates: span, logged: span },
    dates: span,
    coverage: { logged: 30, ofDays: 30, percent: 100 },
    days: {},
    moduleDays: {},
    slice: undefined,
    kernelDays: {},
    questions: [],
    generatedOn: '2026-10-01',
    timeline: [],
    timelineLegend: '',
    table: { columns: [], rows: [], legend: '' },
    ...over,
  };
}

function moduleWith(mirror: ModuleManifest['contributes']['mirror']): ModuleManifest {
  return {
    id: 'demo',
    name: 'Demo',
    version: 1,
    tier: 'A',
    audience: 'adult',
    summary: 's',
    contributes: {
      library: {
        tier: 'A',
        whatItIs: 'x',
        whatTheEvidenceSays: 'y',
        whatItWontDo: 'z',
        citations: [{ title: 't', authors: 'a', year: 2020, venue: 'v', doi_or_url: 'u' }],
        reviewed: '2026-09',
        nextReview: '2027-09',
      },
      ...(mirror === undefined ? {} : { mirror }),
    },
  };
}

const say = (weight: number, ...tags: string[]) =>
  moduleWith({
    weight,
    observations: () => tags.map((tag) => ({ tag, text: `about ${tag}` })),
  });

describe('the mirror', () => {
  it('says nothing at all from less than a week', () => {
    const short = dates(6);
    const base = context({ dates: short, coverage: { logged: 6, ofDays: 6, percent: 100 } });
    expect(buildMirror(base, [say(10, 'x')], () => base)).toEqual([]);
  });

  it('shows what a module noticed alongside what the kernel did', () => {
    const base = context();
    const out = buildMirror(base, [say(10, 'from the module')], () => base);
    expect(out.map((o) => o.tag)).toContain('from the module');
    expect(out.map((o) => o.tag)).toContain('What the report is for');
  });

  it('orders by weight, so a module can speak before the kernel or after it', () => {
    const base = context();
    const first = buildMirror(base, [say(10, 'early')], () => base);
    const last = buildMirror(base, [say(90, 'late')], () => base);
    expect(first[0]?.tag).toBe('early');
    expect(last[0]?.tag).toBe('What the report is for');
  });

  it('stops at four, so a reflection does not become a lecture', () => {
    const base = context();
    const many = say(10, 'a', 'b', 'c', 'd', 'e', 'f');
    const out = buildMirror(base, [many], () => base);
    expect(out).toHaveLength(MAX_OBSERVATIONS);
  });

  it('hands a module the same context its report sections get', () => {
    const seen: unknown[] = [];
    const base = context();
    const watcher = moduleWith({
      weight: 10,
      observations: (given) => {
        seen.push(given);
        return [];
      },
    });
    buildMirror(base, [watcher], () => base);
    expect(seen).toEqual([base]);
  });

  it('works with no module contributing anything', () => {
    const base = context();
    expect(buildMirror(base, [moduleWith(undefined)], () => base).length).toBeGreaterThan(0);
  });

  describe('what the kernel notices for itself', () => {
    it('says the record is patchy, with the figures, and does not scold', () => {
      const out = kernelObservations(
        context({ coverage: { logged: 12, ofDays: 30, percent: 40 } }),
      );
      const patchy = out.find((o) => o.tag === 'The record is patchy');
      expect(patchy?.text).toContain('12 of 30 days');
      expect(patchy?.text).not.toMatch(/you (forgot|failed|missed)/i);
    });

    it('says nothing about patchiness when the record is nearly complete', () => {
      const out = kernelObservations(context());
      expect(out.map((o) => o.tag)).not.toContain('The record is patchy');
    });

    it('notices a fortnight filled in on one evening', () => {
      const span = dates(30);
      const kernelDays = Object.fromEntries(
        span.map((date) => [date, { createdAt: '2026-09-30T21:00:00.000Z' }]),
      );
      const out = kernelObservations(context({ kernelDays }));
      const sitting = out.find((o) => o.tag === 'A lot of it was written at once');
      expect(sitting?.text).toContain('30 entries were filled in on');
    });

    it('says nothing about sittings when the days were written as they happened', () => {
      const span = dates(30);
      const kernelDays = Object.fromEntries(
        span.map((date) => [date, { createdAt: `${date}T21:00:00.000Z` }]),
      );
      const out = kernelObservations(context({ kernelDays }));
      expect(out.map((o) => o.tag)).not.toContain('A lot of it was written at once');
    });

    it('tells the person what the report is for, which the printed page does not', () => {
      // docs/decisions/ADR-017: the printed page presents the four and stops.
      // This is where the person is told what they are for, on screen only.
      const explainer = kernelObservations(context())[0] as MirrorObservation;
      expect(explainer.tag).toBe('What the report is for');
      expect(explainer.text).toContain('efficacy, duration, tolerability and adherence');
      expect(explainer.text).toContain('It does not weigh them');
      expect(explainer.text).not.toMatch(/optimal dose/i);
    });
  });
});

describe('the backup reminder', () => {
  it('holds off until there is something to lose', () => {
    expect(backupNag({ entries: 4, now: NOW })).toBeUndefined();
    expect(backupNag({ entries: 5, now: NOW })).toBeDefined();
  });

  it('counts the entries when no backup has ever been made', () => {
    expect(backupNag({ entries: 9, now: NOW })?.message).toContain('9 entries and no backup yet');
  });

  it('says how long it has been when there has been one', () => {
    expect(backupNag({ entries: 9, lastBackup: '2026-09-10', now: NOW })?.message).toContain(
      '21 days ago',
    );
  });

  it('stays quiet for a fortnight after a backup', () => {
    const day = (n: number): string => `2026-09-${String(n).padStart(2, '0')}`;
    expect(backupNag({ entries: 9, lastBackup: day(30), now: NOW })).toBeUndefined();
    expect(backupNag({ entries: 9, lastBackup: day(18), now: NOW })).toBeUndefined();
    expect(backupNag({ entries: 9, lastBackup: day(17), now: NOW })).toBeDefined();
  });

  it('waits the same fortnight after being dismissed, and does not switch off', () => {
    expect(backupNag({ entries: 9, lastDismissed: '2026-09-30', now: NOW })).toBeUndefined();
    expect(backupNag({ entries: 9, lastDismissed: '2026-09-17', now: NOW })).toBeDefined();
    expect(NAG_INTERVAL_DAYS).toBe(14);
  });

  it('never counts anything about the person or their days', () => {
    const shown = backupNag({ entries: 9, lastBackup: '2026-09-10', now: NOW })!;
    // docs/03-scope.md hard exclusion 9: no streaks, no shaming.
    expect(shown.message).not.toMatch(/streak|missed|failed|forgot|should/i);
    expect(shown.actionLabel).toBe('Download a backup');
  });
});
