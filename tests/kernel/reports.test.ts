import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildReport,
  coverageOf,
  createDocument,
  createStore,
  escapeHtml,
  loggedDates,
  memoryStorageAdapter,
  mountReport,
  qualityLines,
  recordQuality,
  resolveRange,
  type AdnotiaDocument,
  type KernelStore,
  type ModuleManifest,
  type ReportSection,
} from '../../src/kernel/index';

// The kernel owns the report frame. See docs/01-module-contract.md "reports",
// docs/05-architecture.md "Reports engine" and
// docs/decisions/ADR-012-report-frame-contributions.md.

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

function libraryEntry() {
  return {
    tier: 'A' as const,
    whatItIs: 'x',
    whatTheEvidenceSays: 'y',
    whatItWontDo: 'z',
    citations: [{ title: 't', authors: 'a', year: 2020, venue: 'v', doi_or_url: 'u' }],
    reviewed: '2026-09',
    nextReview: '2027-09',
  };
}

function section(overrides: Partial<ReportSection> = {}): ReportSection {
  return {
    report: 'clinical',
    id: 'demo.section',
    weight: 10,
    title: () => 'Demo',
    render: () => '<h3>Demo</h3><p class="meta">A section.</p>',
    renderText: () => 'Demo\n----\nA section.',
    ...overrides,
  };
}

function manifest(
  sections: ReportSection[],
  overrides: Partial<ModuleManifest> = {},
): ModuleManifest {
  return {
    id: 'demo',
    name: 'Demo',
    version: 1,
    tier: 'A',
    audience: 'adult',
    summary: 'A demo module.',
    contributes: { library: libraryEntry(), reports: sections },
    ...overrides,
  };
}

/** A document with `count` consecutive logged days ending on `last`. */
function documentWith(
  days: Record<string, Record<string, unknown>>,
  kernelDays: Record<string, Record<string, unknown>> = {},
): AdnotiaDocument {
  const doc = createDocument({ now: new Date('2026-09-01T00:00:00Z') });
  doc.modules['demo'] = { version: 1, days };
  doc.kernel.days = kernelDays as AdnotiaDocument['kernel']['days'];
  return doc;
}

describe('the report range', () => {
  const logged = ['2026-09-01', '2026-09-03', '2026-09-08', '2026-09-10'];

  it('runs from the first entry inside the window to the last, not the window edges', () => {
    const range = resolveRange({ choice: 'all', logged });
    expect(range.from).toBe('2026-09-01');
    expect(range.to).toBe('2026-09-10');
    expect(range.dates).toHaveLength(10);
    expect(coverageOf(range)).toEqual({ logged: 4, ofDays: 10, percent: 40 });
  });

  it('counts back from today for a numbered range', () => {
    const range = resolveRange({ choice: 3, logged, now: new Date('2026-09-10T12:00:00') });
    expect(range.logged).toEqual(['2026-09-08', '2026-09-10']);
    expect(range.from).toBe('2026-09-08');
  });

  it('takes only what came after the appointment', () => {
    const range = resolveRange({ choice: 'since', logged, lastAppointment: '2026-09-03' });
    expect(range.logged).toEqual(['2026-09-08', '2026-09-10']);
    expect(range.sinceAppointment).toBe('2026-09-03');
  });

  it('means everything when there is no appointment to date from', () => {
    const range = resolveRange({ choice: 'since', logged });
    expect(range.logged).toEqual(logged);
    expect(range.sinceAppointment).toBeUndefined();
  });

  it('is empty, not broken, when nothing is logged', () => {
    const range = resolveRange({ choice: 'all', logged: [] });
    expect(range.dates).toEqual([]);
    expect(coverageOf(range).percent).toBe(0);
  });
});

describe('which days count as logged', () => {
  it('ignores a day record whose fields are all empty', () => {
    const doc = documentWith({
      '2026-09-01': { focus: 4 },
      '2026-09-02': { focus: null, side: [], detail: {}, note: '' },
    });
    expect(loggedDates(doc, [manifest([])]).sort()).toEqual(['2026-09-01']);
  });

  it('counts a day carrying only a kernel win, because that day still happened', () => {
    const doc = documentWith({}, { '2026-09-04': { createdAt: 'x', win: 'Started the forms' } });
    expect(loggedDates(doc, [manifest([])])).toEqual(['2026-09-04']);
  });

  it('does not count a day carrying only a timestamp', () => {
    const doc = documentWith({}, { '2026-09-04': { createdAt: '2026-09-04T21:00:00.000Z' } });
    expect(loggedDates(doc, [manifest([])])).toEqual([]);
  });
});

describe('record quality', () => {
  const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];

  it('counts the next morning as written on the day', () => {
    const quality = recordQuality(dates, {
      '2026-09-01': { createdAt: '2026-09-02T01:00:00.000Z' },
      '2026-09-02': { createdAt: '2026-09-02T22:00:00.000Z' },
      '2026-09-03': { createdAt: '2026-09-09T10:00:00.000Z' },
    });
    expect(quality.known).toBe(3);
    expect(quality.timely).toBe(2);
    expect(quality.late).toBe(1);
    expect(quality.medianLag).toBe(6);
  });

  it('says so plainly when nothing was timed', () => {
    const lines = qualityLines(recordQuality(dates, {}));
    expect(lines[0]).toContain('pre-date this version of the log');
  });

  it('names the day a backfilled record was written on', () => {
    const kernelDays = Object.fromEntries(
      ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'].map((date) => [
        date,
        { createdAt: '2026-09-06T10:00:00.000Z' },
      ]),
    );
    const lines = qualityLines(recordQuality(Object.keys(kernelDays), kernelDays));
    expect(lines[1]).toContain('5 of them on');
  });

  it('appends what a section contributed', () => {
    const lines = qualityLines(recordQuality(dates, {}), ['Focus was rated between 3 and 4.']);
    expect(lines[lines.length - 1]).toBe('Focus was rated between 3 and 4.');
  });
});

describe('the report engine', () => {
  const days = Object.fromEntries(
    ['2026-09-01', '2026-09-02', '2026-09-03'].map((date) => [date, { focus: 4 }]),
  );

  it('says there is nothing to summarise rather than printing an empty sheet', () => {
    const report = buildReport({
      document: documentWith({}),
      modules: [manifest([section()])],
      choice: 'all',
    });
    expect(report.empty).toBe(true);
    expect(report.html).toContain('Nothing to summarise yet');
    expect(report.included).toEqual([]);
  });

  it('orders sections by weight, whatever order the modules are in', () => {
    const last = section({ id: 'demo.last', weight: 90, render: () => '<h3>Last</h3>' });
    const first = section({ id: 'demo.first', weight: 1, render: () => '<h3>First</h3>' });
    const report = buildReport({
      document: documentWith(days),
      modules: [manifest([last, first])],
      choice: 'all',
    });
    expect(report.included.map((entry) => entry.id).slice(0, 2)).toEqual([
      'demo.first',
      'demo.last',
    ]);
    expect(report.html.indexOf('First')).toBeLessThan(report.html.indexOf('Last'));
  });

  it('leaves out a section whose own `when` says no', () => {
    const report = buildReport({
      document: documentWith(days),
      modules: [manifest([section({ when: () => false })])],
      choice: 'all',
    });
    expect(report.included.map((entry) => entry.id)).not.toContain('demo.section');
  });

  it('hands a section its own module’s days', () => {
    const seen: unknown[] = [];
    const report = buildReport({
      document: documentWith(days),
      modules: [
        manifest([
          section({
            render: (context) => {
              seen.push((context as { days: unknown }).days);
              return '';
            },
          }),
        ]),
      ],
      choice: 'all',
    });
    expect(report.empty).toBe(false);
    expect(seen[0]).toEqual(days);
  });

  it('hands over a declared dependency’s days, and only when it is enabled', () => {
    const doc = documentWith(days);
    doc.modules['sleep'] = { version: 1, days: { '2026-09-01': { bed: '23:00' } } };

    const sleep = manifest([], { id: 'sleep', name: 'Sleep' });
    const capture: Record<string, unknown>[] = [];
    const dependent = manifest(
      [
        section({
          render: (context) => {
            capture.push(context as Record<string, unknown>);
            return '';
          },
        }),
      ],
      { dependencies: ['sleep'] },
    );

    buildReport({ document: doc, modules: [dependent, sleep], choice: 'all' });
    expect(capture[0]?.['moduleDays']).toEqual({ sleep: { '2026-09-01': { bed: '23:00' } } });

    capture.length = 0;
    buildReport({ document: doc, modules: [dependent], choice: 'all' });
    expect(capture[0]?.['moduleDays']).toEqual({});
  });

  it('never hands a module another module’s days without a declared dependency', () => {
    const doc = documentWith(days);
    doc.modules['sleep'] = { version: 1, days: { '2026-09-01': { bed: '23:00' } } };

    const capture: Record<string, unknown>[] = [];
    const nosy = manifest([
      section({
        render: (context) => {
          capture.push(context as Record<string, unknown>);
          return '';
        },
      }),
    ]);
    buildReport({
      document: doc,
      modules: [nosy, manifest([], { id: 'sleep', name: 'Sleep' })],
      choice: 'all',
    });
    expect(capture[0]?.['moduleDays']).toEqual({});
  });

  it('leaves out a module that may not contribute to this report at all', () => {
    const parent = manifest([section({ id: 'parent.section' })], {
      id: 'parenting',
      audience: 'parent',
    });
    const report = buildReport({ document: documentWith(days), modules: [parent], choice: 'all' });
    expect(report.included.map((entry) => entry.id)).not.toContain('parent.section');
  });

  describe('the frame', () => {
    it('names the record from the first section that offers a subject', () => {
      const report = buildReport({
        document: documentWith(days),
        modules: [
          manifest([
            section({ id: 'demo.late', weight: 50, frame: () => ({ subject: 'Second' }) }),
            section({ id: 'demo.early', weight: 5, frame: () => ({ subject: 'First' }) }),
          ]),
        ],
        choice: 'all',
      });
      expect(report.html).toContain('<b>First</b>');
      expect(report.html).not.toContain('Second');
    });

    it('asks a section for its subject even when `when` left the section out', () => {
      const report = buildReport({
        document: documentWith(days),
        modules: [
          manifest([section({ when: () => false, frame: () => ({ subject: 'Elvanse' }) })]),
        ],
        choice: 'all',
      });
      expect(report.included).toEqual([]);
      expect(report.html).toContain('<b>Elvanse</b>');
    });

    it('appends a header clause and a record-quality sentence', () => {
      const report = buildReport({
        document: documentWith(days),
        modules: [
          manifest([
            section({
              frame: () => ({
                header: '2 with a missed or skipped dose',
                quality: 'Focus was rated between 3 and 4.',
              }),
            }),
          ]),
        ],
        choice: 'all',
      });
      expect(report.html).toContain('days logged (100%), 2 with a missed or skipped dose');
      expect(report.html).toContain('Focus was rated between 3 and 4.');
    });

    it('prints a correct header when no section offers anything', () => {
      const report = buildReport({
        document: documentWith(days),
        modules: [manifest([section()])],
        choice: 'all',
      });
      expect(report.html).toContain('<h2>Daily record</h2>');
      expect(report.html).toContain('3 of 3 days logged (100%)');
      expect(report.html).not.toContain('<b>');
    });
  });

  it('warns on its own face when the record is patchy', () => {
    const patchy = { '2026-09-01': { focus: 4 }, '2026-09-10': { focus: 4 } };
    const report = buildReport({
      document: documentWith(patchy),
      modules: [manifest([section()])],
      choice: 'all',
    });
    expect(report.html).toContain('8 days in this range have no entry');
  });

  it('does not warn when the record is nearly complete', () => {
    const report = buildReport({
      document: documentWith(days),
      modules: [manifest([section()])],
      choice: 'all',
    });
    expect(report.html).not.toContain('no entry');
  });

  it('prints the questions last, in the person’s own words', () => {
    const doc = documentWith(days);
    doc.kernel.questions = [
      { id: 'q1', text: 'Could we try splitting the dose?', added: '2026-09-01' },
    ];
    const report = buildReport({ document: doc, modules: [manifest([section()])], choice: 'all' });

    expect(report.html.indexOf('Questions for this appointment')).toBeGreaterThan(
      report.html.indexOf('About this record'),
    );
    expect(report.html).toContain('Could we try splitting the dose?');
  });

  it('escapes what the person typed rather than rendering it', () => {
    const doc = documentWith(days);
    doc.kernel.questions = [{ id: 'q1', text: '<script>alert(1)</script>', added: '2026-09-01' }];
    const report = buildReport({ document: doc, modules: [manifest([section()])], choice: 'all' });
    expect(report.html).not.toContain('<script>');
    expect(report.html).toContain('&lt;script&gt;');
  });

  it('produces a text export with the same content as the sheet', () => {
    const doc = documentWith(days, {
      '2026-09-02': { createdAt: '2026-09-02T21:00:00.000Z', win: 'Started the tax forms' },
    });
    doc.kernel.questions = [
      { id: 'q1', text: 'Could we try splitting the dose?', added: '2026-09-01' },
    ];
    const report = buildReport({ document: doc, modules: [manifest([section()])], choice: 'all' });

    expect(report.text).toContain('Daily record\n============');
    expect(report.text).toContain('A section.');
    expect(report.text).toContain('Started the tax forms');
    expect(report.text).toContain('1. Could we try splitting the dose?');
    expect(report.text).toMatch(/Generated .+ from a self-kept daily log\.$/);
    expect(report.text).not.toContain('<');
  });

  it('never addresses the clinician with a recommendation from the frame', () => {
    // The same rule the module smoke test applies to sections, applied to the
    // kernel's own header, footer and legend. docs/03-scope.md.
    const doc = documentWith(days, {
      '2026-09-01': { createdAt: '2026-09-01T21:00:00.000Z', win: 'a', miss: 'b', notes: 'c' },
    });
    const report = buildReport({ document: doc, modules: [manifest([section()])], choice: 'all' });
    const frame = report.html.replace('<h3>Demo</h3><p class="meta">A section.</p>', '');
    expect(frame).not.toMatch(/\b(should|increase|decrease|recommend|advise|suggest)\b/i);
  });
});

describe('the kernel’s own sections', () => {
  const kernelDays = {
    '2026-09-01': {
      createdAt: 'x',
      win: 'Started the tax forms',
      notes: 'Good morning, bad afternoon',
    },
    '2026-09-02': { createdAt: 'x', miss: 'Snapped at my partner' },
    '2026-09-03': { createdAt: 'x' },
  };

  function report() {
    const doc = documentWith(
      Object.fromEntries(Object.keys(kernelDays).map((date) => [date, { focus: 3 }])),
      kernelDays,
    );
    return buildReport({ document: doc, modules: [manifest([])], choice: 'all' });
  }

  it('prints wins and misses in two columns, most recent first', () => {
    expect(report().html).toContain('What changed in daily life');
    expect(report().html).toContain('Started the tax forms');
    expect(report().html).toContain('Snapped at my partner');
  });

  it('says nothing was noted rather than leaving a column blank', () => {
    const doc = documentWith(
      { '2026-09-01': { focus: 3 } },
      { '2026-09-01': { createdAt: 'x', win: 'only a win' } },
    );
    expect(buildReport({ document: doc, modules: [manifest([])], choice: 'all' }).html).toContain(
      'Nothing noted.',
    );
  });

  it('prints the day’s notes in the person’s own words', () => {
    expect(report().html).toContain('In their words');
    expect(report().html).toContain('Good morning, bad afternoon');
  });

  it('leaves both out when there is nothing to say', () => {
    const doc = documentWith({ '2026-09-01': { focus: 3 } }, { '2026-09-01': { createdAt: 'x' } });
    const html = buildReport({ document: doc, modules: [manifest([])], choice: 'all' }).html;
    expect(html).not.toContain('What changed in daily life');
    expect(html).not.toContain('In their words');
  });
});

describe('escaping', () => {
  it('covers both text and attribute contexts', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('the report view', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.set('demo', {
      version: 1,
      days: Object.fromEntries(
        ['2026-09-01', '2026-09-02', '2026-09-03'].map((date) => [date, { focus: 4 }]),
      ),
    });
  });

  function mount(overrides: Partial<Parameters<typeof mountReport>[0]> = {}) {
    return mountReport({
      store,
      modules: [manifest([section()])],
      choice: 'all',
      ...overrides,
    } as Parameters<typeof mountReport>[0]);
  }

  it('puts the controls outside what prints, and the sheet inside it', () => {
    const view = mount();
    expect(view.element.querySelector('.noprint')).not.toBeNull();
    expect(view.element.querySelector('.sheet')?.innerHTML).toContain('Daily record');
    expect(
      view.element.querySelector('.noprint')?.contains(view.element.querySelector('.sheet')),
    ).toBe(false);
  });

  it('rebuilds the sheet when the range changes', () => {
    const view = mount();
    const select = view.element.querySelector('select') as HTMLSelectElement;
    select.value = '14';
    select.dispatchEvent(new window.Event('change'));
    expect(view.choice()).toBe(14);
  });

  it('offers the appointment range only once there is an appointment', () => {
    const view = mount();
    const since = view.element.querySelector('option[value="since"]') as HTMLOptionElement;
    expect(since.disabled).toBe(true);
    expect(since.textContent).toBe('since your last appointment');

    store.updateKernel((kernel) => ({ ...kernel, lastAppointment: '2026-09-02' }));
    view.refresh();
    expect(
      (view.element.querySelector('option[value="since"]') as HTMLOptionElement).disabled,
    ).toBe(false);
  });

  it('adds a question and prints it on the sheet', () => {
    const view = mount();
    const input = view.element.querySelector('.qadd input') as HTMLInputElement;
    input.value = 'Could we try splitting the dose?';
    click(view.element.querySelector('.qadd .btn'));

    expect(store.document().kernel.questions).toHaveLength(1);
    expect(view.element.querySelector('.sheet')?.innerHTML).toContain('splitting the dose');
    expect(input.value).toBe('');
  });

  it('removes a question again', () => {
    const view = mount();
    const input = view.element.querySelector('.qadd input') as HTMLInputElement;
    input.value = 'One question';
    click(view.element.querySelector('.qadd .btn'));
    click(view.element.querySelector('.qitem .xbtn'));
    expect(store.document().kernel.questions).toEqual([]);
  });

  it('will not clear the questions without asking first', () => {
    const view = mount({ confirm: () => false });
    const input = view.element.querySelector('.qadd input') as HTMLInputElement;
    input.value = 'One question';
    click(view.element.querySelector('.qadd .btn'));

    const buttons = [...view.element.querySelectorAll('button')];
    click(buttons.find((button) => button.textContent === 'I have had the appointment'));

    expect(store.document().kernel.questions).toHaveLength(1);
    expect(store.document().kernel.lastAppointment).toBeUndefined();
  });

  it('marks the appointment, clears the questions and dates the range from today', () => {
    const view = mount({ confirm: () => true, now: () => new Date('2026-09-04T10:00:00') });
    const input = view.element.querySelector('.qadd input') as HTMLInputElement;
    input.value = 'One question';
    click(view.element.querySelector('.qadd .btn'));

    const buttons = [...view.element.querySelectorAll('button')];
    click(buttons.find((button) => button.textContent === 'I have had the appointment'));

    expect(store.document().kernel.lastAppointment).toBe('2026-09-04');
    expect(store.document().kernel.questions).toEqual([]);
    expect(view.choice()).toBe('since');
  });

  it('records the person’s own overall word, and never infers one', () => {
    const view = mount();
    const chip = [...view.element.querySelectorAll('.chip')].find(
      (element) => element.textContent === 'Much better',
    );
    click(chip);
    expect(store.document().kernel.overall).toBe('mi');
  });

  it('copies the text export, and says so', async () => {
    const copied: string[] = [];
    const view = mount({
      copyText: async (text: string) => {
        copied.push(text);
      },
    });
    const buttons = [...view.element.querySelectorAll('button')];
    click(buttons.find((button) => button.textContent === 'Copy as text'));
    await vi.waitFor(() => expect(copied).toHaveLength(1));

    expect(copied[0]).toBe(view.text());
    expect(view.element.querySelector('.bmsg')?.textContent).toContain('Copied.');
  });

  it('points at Print when the clipboard refuses', async () => {
    const view = mount({ copyText: async () => Promise.reject(new Error('no')) });
    const buttons = [...view.element.querySelectorAll('button')];
    click(buttons.find((button) => button.textContent === 'Copy as text'));
    await vi.waitFor(() =>
      expect(view.element.querySelector('.bmsg')?.textContent).toContain('try Print'),
    );
  });
});
