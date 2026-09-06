import { describe, expect, it } from 'vitest';
import {
  buildDayTable,
  buildTimeline,
  chartNote,
  createDocument,
  dayTimeline,
  severityGrid,
  stepChart,
  type AdnotiaDocument,
  type ModuleManifest,
  type StepColumn,
} from '../../src/kernel/index';

// The chart primitives. See docs/07-design-system.md "Colour" for the palette,
// print.css for the greys it maps to, and
// docs/decisions/ADR-013-shared-day-timeline.md for who draws what.

function columns(steps: number[], extra: Partial<StepColumn>[] = []): StepColumn[] {
  return steps.map((step, index) => ({ step, ...extra[index] }));
}

const chart = (given: Partial<Parameters<typeof stepChart>[0]> = {}): string =>
  stepChart({
    columns: columns([30, 30, 50]),
    pointScale: { min: 1, max: 5, label: 'focus 5' },
    startLabel: '1 Sep',
    endLabel: '3 Sep',
    title: 'Dose over time',
    legend: 'A legend.',
    ...given,
  });

describe('the step chart', () => {
  it('draws nothing from a single column, because one point is not a line', () => {
    expect(chart({ columns: columns([30]) })).toBe('');
  });

  it('steps across then up, so a dose change reads as the step it was', () => {
    const path = /class="stair" d="([^"]+)"/.exec(chart())?.[1] ?? '';
    // Two segments per change: along at the old value, then vertically to the new.
    // Three columns: a move, then two segments per change after the first.
    expect(path).toMatch(/^M34 [\d.]+ (L[\d.]+ [\d.]+ ){3}L[\d.]+ [\d.]+$/);
    const ys = [...path.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(ys[0]).toBe(ys[1]);
    expect(ys[ys.length - 1]).toBeLessThan(ys[0] as number);
  });

  it('plots a dot per rating on the right-hand scale', () => {
    const svg = chart({ columns: columns([30, 30, 50], [{ point: 1 }, {}, { point: 5 }]) });
    expect([...svg.matchAll(/class="dot"/g)]).toHaveLength(2);
    const ys = [...svg.matchAll(/class="dot" cx="[\d.]+" cy="([\d.]+)"/g)].map((m) => Number(m[1]));
    // 5 is the good end of the scale, so it sits above 1.
    expect(ys[1]).toBeLessThan(ys[0] as number);
  });

  it('will not draw a trend line from a single point', () => {
    expect(chart({ columns: columns([30, 30, 50], [{ trend: 3 }, {}, {}]) })).not.toContain(
      'trend',
    );
    expect(chart({ columns: columns([30, 30, 50], [{ trend: 3 }, { trend: 4 }, {}]) })).toContain(
      'class="trend"',
    );
  });

  it('puts a bar below the axis for a flagged column', () => {
    expect(chart({ columns: columns([30, 30, 50], [{}, {}, { flag: true }]) })).toContain(
      'class="rb"',
    );
    expect(chart()).not.toContain('class="rb"');
  });

  it('is announced to a screen reader in words, not as a picture', () => {
    expect(chart()).toContain('role="img"');
    expect(chart()).toContain('aria-label="Dose over time"');
  });

  it('escapes a label rather than letting it into the markup', () => {
    expect(chart({ startLabel: '<b>x' })).toContain('&lt;b&gt;x');
  });
});

describe('the day timeline', () => {
  const row = (
    label: string,
    over: Partial<Parameters<typeof dayTimeline>[0]['rows'][number]> = {},
  ) => ({
    label,
    bands: [],
    ticks: [],
    marks: [],
    ...over,
  });

  const timeline = (rows: Parameters<typeof dayTimeline>[0]['rows']): string =>
    dayTimeline({ rows, title: 'Cover across the day', legend: 'A legend.' });

  it('runs the row from 6pm so a night’s sleep is not cut in half at midnight', () => {
    const svg = timeline([
      row('1 Sep', { bands: [{ from: '23:00', to: '07:00', className: 'sleepband' }] }),
    ]);
    // 23:00 is five hours past a 6pm origin; the band is drawn, not dropped.
    expect(svg).toContain('class="sleepband"');
    expect(svg).toContain('>midnight<');
    expect(svg).toContain('>6pm<');
  });

  it('drops a band that would wrap past the origin rather than drawing it wrong', () => {
    // 17:00 to 19:00 straddles the 6pm origin: the end lands before the start.
    const svg = timeline([
      row('1 Sep', { bands: [{ from: '17:00', to: '19:00', className: 'coverband' }] }),
    ]);
    expect(svg).not.toContain('class="coverband"');
  });

  it('draws a tick per dose and a mark sized by how rough it was', () => {
    const svg = timeline([
      row('1 Sep', {
        ticks: ['08:00', '13:00'],
        marks: [{ at: '17:00', className: 'rbmark', radius: 2.6 }],
      }),
    ]);
    expect([...svg.matchAll(/class="dosetick"/g)]).toHaveLength(2);
    expect(svg).toContain('r="2.6"');
  });

  it('labels three rows, not every one', () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(`day ${i}`));
    const labels = [...timeline(rows).matchAll(/class="tick" x="0"/g)];
    expect(labels).toHaveLength(3);
  });

  it('thins the rows as the range grows, but never into a smudge', () => {
    const rowHeight = (count: number): number =>
      Number(
        /class="gapband"[^>]*height="([\d.]+)"/.exec(
          timeline(Array.from({ length: count }, (_, i) => row(`d${i}`))),
        )?.[1],
      );
    expect(rowHeight(10)).toBe(11);
    expect(rowHeight(40)).toBeLessThan(11);
    expect(rowHeight(200)).toBe(6);
  });

  it('draws nothing at all from no rows', () => {
    expect(timeline([])).toBe('');
  });
});

describe('the severity grid', () => {
  const grid = (over: Partial<Parameters<typeof severityGrid>[0]> = {}): string =>
    severityGrid({
      rowLabels: ['Dry mouth', 'Headache'],
      cells: [
        ['sev1', 'sev2', 'cellblank'],
        ['cellblank', 'cellblank', 'sev3'],
      ],
      startLabel: '1 Sep',
      endLabel: '3 Sep',
      title: 'Grid of side effects by day',
      legend: 'A legend.',
      ...over,
    });

  it('draws one cell per day per row, in the class it was given', () => {
    expect([...grid().matchAll(/<rect /g)]).toHaveLength(6);
    expect(grid()).toContain('class="sev3"');
    expect(grid()).toContain('class="cellblank"');
  });

  it('draws nothing when there are no rows', () => {
    expect(grid({ rowLabels: [], cells: [] })).toBe('');
  });
});

describe('what a chart becomes in the text export', () => {
  it('is a bracketed note, not a table of coordinates', () => {
    expect(chartNote('dose chart')).toBe('[dose chart — see the printed or PDF version]');
  });
});

describe('assembling the shared timeline', () => {
  function moduleWith(
    id: string,
    timeline: ModuleManifest['contributes']['timeline'],
  ): ModuleManifest {
    return {
      id,
      name: id,
      version: 1,
      tier: 'A',
      audience: 'adult',
      area: 'focus',
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
        ...(timeline === undefined ? {} : { timeline }),
      },
    };
  }

  function documentWith(slices: Record<string, Record<string, unknown>>): AdnotiaDocument {
    const doc = createDocument({ now: new Date('2026-09-01T00:00:00Z') });
    for (const [id, days] of Object.entries(slices)) doc.modules[id] = { version: 1, days };
    return doc;
  }

  const sleep = moduleWith('sleep', {
    weight: 10,
    legend: 'Grey: asleep.',
    parts: (day) => ({
      bands: [{ from: day['bed'] as string, to: day['wake'] as string, className: 'sleepband' }],
    }),
  });
  const med = moduleWith('med', {
    weight: 20,
    legend: 'Solid: working.',
    parts: () => ({ bands: [{ from: '09:30', to: '16:30', className: 'coverband' }] }),
  });

  const doc = documentWith({
    sleep: { '2026-09-01': { bed: '23:00', wake: '07:00' } },
    med: { '2026-09-01': { dose: '50' }, '2026-09-02': { dose: '50' } },
  });

  it('merges every module’s marks onto one row per day', () => {
    const { rows } = buildTimeline(doc, [sleep, med], ['2026-09-01', '2026-09-02']);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.bands.map((band) => band.className)).toEqual(['sleepband', 'coverband']);
    expect(rows[1]?.bands.map((band) => band.className)).toEqual(['coverband']);
  });

  it('draws the widest band first, whatever order the modules are in', () => {
    const { rows } = buildTimeline(doc, [med, sleep], ['2026-09-01']);
    expect(rows[0]?.bands.map((band) => band.className)).toEqual(['sleepband', 'coverband']);
  });

  it('joins the legend in the same order', () => {
    expect(buildTimeline(doc, [med, sleep], ['2026-09-01']).legend).toBe(
      'Grey: asleep. Solid: working.',
    );
  });

  it('leaves out a day with nothing on it rather than drawing an empty stripe', () => {
    const { rows } = buildTimeline(doc, [sleep, med], ['2026-08-30', '2026-09-01']);
    expect(rows.map((r) => r.label)).toHaveLength(1);
  });

  it('shows a module only its own day record', () => {
    const seen: unknown[] = [];
    const nosy = moduleWith('nosy', {
      weight: 5,
      legend: '',
      parts: (day) => {
        seen.push(day);
        return {};
      },
    });
    buildTimeline(doc, [nosy], ['2026-09-01']);
    expect(seen).toEqual([]);

    buildTimeline(documentWith({ nosy: { '2026-09-01': { own: 1 } } }), [nosy], ['2026-09-01']);
    expect(seen).toEqual([{ own: 1 }]);
  });

  it('is empty when no module contributes to it', () => {
    expect(buildTimeline(doc, [moduleWith('plain', undefined)], ['2026-09-01'])).toEqual({
      rows: [],
      legend: '',
    });
  });
});

describe('assembling the shared day table', () => {
  function moduleWith(
    id: string,
    columns: ModuleManifest['contributes']['columns'],
  ): ModuleManifest {
    return {
      id,
      name: id,
      version: 1,
      tier: 'A',
      audience: 'adult',
      area: 'focus',
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
        ...(columns === undefined ? {} : { columns }),
      },
    };
  }

  function documentWith(slices: Record<string, Record<string, unknown>>): AdnotiaDocument {
    const doc = createDocument({ now: new Date('2026-09-01T00:00:00Z') });
    for (const [id, days] of Object.entries(slices)) doc.modules[id] = { version: 1, days };
    return doc;
  }

  const dose = moduleWith('med', [
    { label: 'Dose', weight: 10, numeric: true, cell: (day) => String(day['dose'] ?? '') },
    { label: 'Side effects', weight: 80, cell: (day) => String(day['side'] ?? ''), legend: 'B.' },
  ]);
  const sleep = moduleWith('sleep', [
    {
      label: 'Sleep',
      weight: 70,
      cell: (day) => String(day['hours'] ?? ''),
      note: (day) => String(day['window'] ?? ''),
      legend: 'A.',
    },
  ]);

  const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];
  const doc = documentWith({
    med: { '2026-09-01': { dose: '50', side: 'Dry mouth' }, '2026-09-03': { dose: '70' } },
    sleep: { '2026-09-01': { hours: '7', window: '23:00–06:00' } },
  });

  it('interleaves two modules’ columns by weight, not by module', () => {
    const table = buildDayTable(doc, [dose, sleep], dates);
    expect(table.columns.map((column) => column.label)).toEqual(['Dose', 'Sleep', 'Side effects']);
  });

  it('puts the newest day first', () => {
    const table = buildDayTable(doc, [dose, sleep], dates);
    expect(table.rows.map((row) => row.date)).toEqual(['2026-09-03', '2026-09-01']);
  });

  it('drops a day with nothing in any column rather than printing a row of dashes', () => {
    const table = buildDayTable(doc, [dose, sleep], dates);
    expect(table.rows.map((row) => row.date)).not.toContain('2026-09-02');
  });

  it('leaves a cell empty for a module that has nothing that day', () => {
    const table = buildDayTable(doc, [dose, sleep], dates);
    const newest = table.rows[0]!;
    expect(newest.cells.map((cell) => cell.text)).toEqual(['70', '', '']);
  });

  it('carries a column’s second line', () => {
    const table = buildDayTable(doc, [dose, sleep], dates);
    const oldest = table.rows[table.rows.length - 1]!;
    expect(oldest.cells[1]).toEqual({ text: '7', note: '23:00–06:00' });
  });

  it('joins the legends in the columns’ order, not the modules’', () => {
    expect(buildDayTable(doc, [dose, sleep], dates).legend).toBe('A. B.');
  });

  it('shows a module only its own day record', () => {
    const seen: unknown[] = [];
    const nosy = moduleWith('nosy', [
      {
        label: 'N',
        weight: 5,
        cell: (day) => {
          seen.push(day);
          return '';
        },
      },
    ]);
    buildDayTable(documentWith({ nosy: { '2026-09-01': { own: 1 } } }), [nosy], dates);
    expect(seen).toEqual([{ own: 1 }]);
  });

  it('is empty when no module contributes a column', () => {
    expect(buildDayTable(doc, [moduleWith('plain', undefined)], dates)).toEqual({
      columns: [],
      rows: [],
      legend: '',
    });
  });
});
