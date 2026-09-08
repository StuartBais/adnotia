import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MODULES,
  buildReport,
  createDocument,
  createStore,
  formatLongDate,
  memoryStorageAdapter,
  mountShell,
  type KernelStore,
} from '../../src/kernel/index';
import { thirtyDays as medication } from '../../src/modules/medication/fixtures/index';
import { thirtyDays as sleep } from '../../src/modules/sleep/fixtures/index';

// The sheet a clinician is handed.
//
// It used to open straight into "Daily record" and a line of dates. Nothing said
// what the document was, what produced it, or that it is self-report — the app's
// name appeared exactly once, in the last paragraph on the page — so somebody
// reading top to bottom met every figure before they met the caveat.

const TODAY = '2026-09-30';

function report() {
  const document_ = createDocument({ now: new Date(`${TODAY}T00:00:00Z`) });
  document_.modules['medication'] = medication;
  document_.modules['sleep'] = sleep;
  document_.kernel.days = Object.fromEntries(
    [...Array<undefined>(30)].map((_, index) => [
      `2026-09-${String(index + 1).padStart(2, '0')}`,
      { focus: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5, createdAt: '2026-09-01T21:00:00.000Z' },
    ]),
  ) as never;
  return buildReport({
    document: document_,
    modules: MODULES.filter((m) => ['medication', 'sleep'].includes(m.id)),
    choice: 'all',
    now: new Date(`${TODAY}T00:00:00Z`),
  });
}

describe('the letterhead', () => {
  const built = report();
  const head = /<header class="sheet-head">([\s\S]*?)<\/header>/.exec(built.html)?.[1] ?? '';

  it('opens the sheet, before anything else on the page', () => {
    expect(built.html.startsWith('<header class="sheet-head">')).toBe(true);
    expect(head).not.toBe('');
  });

  it('carries the mark and the name', () => {
    expect(head).toContain('class="sheet-mark"');
    expect(head).toContain('Adnotia');
    // From assets/logo.svg, so the sheet cannot drift from the app's mark.
    const source = readFileSync(resolve(process.cwd(), 'assets/logo.svg'), 'utf8');
    const path = /d="([^"]+)"/.exec(source)?.[1];
    expect(path).toBeDefined();
    expect(head).toContain(path as string);
  });

  it('says what the record is and how complete it is', () => {
    expect(head).toContain('Elvanse');
    expect(head).toMatch(/30 of 30 days logged \(100%\)/);
  });

  it('says it is a self-kept log before the first figure, not after the last', () => {
    // The whole point of moving it. Same reviewed sentence, higher up.
    expect(head).toMatch(/Generated .+ from a self-kept daily log\./);
    const provenance = built.html.indexOf('from a self-kept daily log');
    const firstSection = built.html.indexOf('<h3>');
    expect(provenance).toBeGreaterThan(-1);
    expect(provenance).toBeLessThan(firstSection);
  });

  it('does not change a word of the reviewed wording', () => {
    // CLAUDE.md makes clinician-facing wording a stop-and-ask. This moved a
    // sentence; it did not write one.
    // Derived, never spelled out: CI runs under a different locale to this
    // machine and a hard-coded date string passes here and fails there.
    expect(built.text).toContain(`Generated ${formatLongDate(TODAY)} from a self-kept daily log.`);
    expect(built.html).toContain(
      'Kept in Adnotia, a self-managed daily log on the patient&#39;s phone, unverified.',
    );
  });

  it('is decorative: the mark is not a chart and is not announced', () => {
    expect(head).toContain('aria-hidden="true"');
    // A screen reader already says "Adnotia" from the text beside it.
    expect(/<svg[^>]*class="sheet-mark"[^>]*aria-label/.test(head)).toBe(false);
  });

  it('scopes its clip paths, so it can sit on a page that already has the mark', () => {
    // SVG ids are document-global. The sheet is injected into a page whose
    // masthead already carries one, and two marks sharing `clipPath id="g"`
    // both clip to whichever the browser resolved first.
    expect(head).toContain('id="g-sheet"');
    expect(head).toContain('url(#g-sheet)');
    expect(head).not.toMatch(/id="g"/);
  });

  it('leaves no markup in the plain-text export', () => {
    expect(built.text).not.toContain('<');
    expect(built.text).not.toContain('sheet-head');
  });
});

describe('where the report lives', () => {
  // Nothing used to assert that the clinical report was reachable from the
  // interface at all. mountReport was tested in isolation, so moving it off the
  // Records tab broke no test — which is why these exist now.

  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    store.updateKernel((kernel) => ({
      ...kernel,
      enabledModules: ['medication', 'sleep'],
      moduleOrder: ['medication', 'sleep'],
      settings: { ...kernel.settings, firstRunComplete: true },
    }));
    store.set('medication', medication);
    store.set('sleep', sleep);
  });

  function app(): { container: HTMLElement; shell: { destroy(): void } } {
    const container = document.createElement('div');
    const shell = mountShell({ store, container, modules: MODULES });
    return { container, shell };
  }

  const rows = (container: HTMLElement): string[] =>
    [...container.querySelectorAll('button.linkrow')].map((b) => b.textContent ?? '');

  it('is reachable, in two taps from the index', () => {
    const { container, shell } = app();
    const area = [...container.querySelectorAll('button.area-card')].find((card) =>
      (card.textContent ?? '').startsWith('Medication and body'),
    );
    expect(area, 'the area itself').toBeDefined();
    (area as HTMLElement).click();

    const row = [...container.querySelectorAll('button.linkrow')].find((b) =>
      (b.textContent ?? '').startsWith('For an appointment'),
    );
    expect(row, `rows were: ${rows(container).join(' | ')}`).toBeDefined();
    (row as HTMLElement).click();

    expect(container.querySelectorAll('.sheet')).toHaveLength(1);
    expect(container.querySelector('.sheet-head h2')?.textContent).toBe('Daily record');
    shell.destroy();
  });

  it('is not on the Records tab, which is a person looking back at their own days', () => {
    const { container, shell } = app();
    const records = [...container.querySelectorAll('[role="tab"]')].find(
      (t) => t.textContent === 'Records',
    );
    (records as HTMLElement).click();
    expect(container.querySelectorAll('.sheet')).toHaveLength(0);
    // The history is still there; only the document moved.
    expect(container.textContent).toContain('Medication log');
    shell.destroy();
  });

  it('never puts two sheets on one screen', () => {
    // print.css shows every .sheet, so two on a screen print as one document.
    // This is the rule that makes one report per page a rule and not a habit.
    const { container, shell } = app();
    for (const tab of ['Tools', 'Today', 'Records', 'Library']) {
      const button = [...container.querySelectorAll('[role="tab"]')].find(
        (t) => t.textContent === tab,
      );
      (button as HTMLElement).click();
      expect(container.querySelectorAll('.sheet').length, tab).toBeLessThanOrEqual(1);
    }
    shell.destroy();
  });

  it('keeps the page chrome off the paper', () => {
    // A named report opens as an off-tab page. Printing one used to carry a
    // Back button and a second copy of the title above the sheet's letterhead.
    const { container, shell } = app();
    const area = [...container.querySelectorAll('button.area-card')].find((card) =>
      (card.textContent ?? '').startsWith('Medication and body'),
    );
    (area as HTMLElement).click();
    const row = [...container.querySelectorAll('button.linkrow')].find((b) =>
      (b.textContent ?? '').startsWith('For an appointment'),
    );
    (row as HTMLElement).click();

    expect(container.querySelector('.page-title')?.className).toContain('noprint');
    // The row holding Back, not the masthead's — that one lives inside .mast,
    // which print.css already hides.
    const back = [...container.querySelectorAll('.btnrow')].find((row) =>
      [...row.querySelectorAll('button')].some((b) => b.textContent === 'Back'),
    );
    expect(back, 'the Back row').toBeDefined();
    expect(back?.className).toContain('noprint');
    shell.destroy();
  });
});

describe('what print has to get right', () => {
  const print = readFileSync(resolve(process.cwd(), 'src/styles/print.css'), 'utf8');

  it('repeats column headings on every page a table spans', () => {
    // The day-by-day table runs to thirty rows and will break across pages.
    // Without this, page two is a grid of unlabelled numbers.
    expect(print).toMatch(/thead\s*\{[^}]*display:\s*table-header-group/);
    expect(report().html).toContain('<thead>');
  });

  it('never strands a heading at the foot of a page', () => {
    expect(print).toMatch(/\.sheet h2,\s*\.sheet h3\s*\{[^}]*break-after:\s*avoid/);
  });

  it('keeps a row whole', () => {
    expect(print).toMatch(/tr\s*\{[^}]*break-inside:\s*avoid/);
  });

  it('prints the letterhead rather than hiding it with the rest of the app', () => {
    // print.css hides everything that is not the report. The letterhead is part
    // of the report, and it is the part that says what the report is.
    expect(print).toContain('.sheet-head');
    expect(print).not.toMatch(/\.sheet-head[^{]*\{[^}]*display:\s*none/);
  });
});
