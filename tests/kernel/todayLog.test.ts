import { beforeEach, describe, expect, it } from 'vitest';
import {
  MODULES,
  TODAY_STRINGS,
  buildReport,
  createDocument,
  createStore,
  memoryStorageAdapter,
  mountToday,
  type KernelStore,
  type ModuleManifest,
} from '../../src/kernel/index';

// The day's record, as a record of the day rather than a form.
//
// mountToday builds a card only for a module that declares `today` fields. Three
// of the six adult modules declare none, so a practice done this morning was
// recorded and appeared nowhere on the screen a person opens to see their day.
// That is the structural half of the app reading as a medication log with things
// bolted on. See docs/decisions/ADR-031.

const TODAY = '2026-09-30';

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

/** A module with no daily question at all — the case this exists for. */
function quiet(over: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'quiet',
    name: 'Quiet',
    version: 1,
    tier: 'A',
    audience: 'adult',
    area: 'calm',
    summary: 's',
    contributes: {
      library: libraryEntry(),
      log: {
        weight: 10,
        lines: (day) => ((day as { did?: string[] }).did ?? []).map((what) => `Did ${what}.`),
      },
    },
    ...over,
  } as ModuleManifest;
}

describe('what already happened today', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  function view(modules: ModuleManifest[]): HTMLElement {
    return mountToday({ store, modules, date: TODAY }).element;
  }

  it('shows a module that asks nothing, which nothing else on this screen does', () => {
    store.set('quiet', { version: 1, days: { [TODAY]: { did: ['the short one'] } } });
    const text = view([quiet()]).textContent ?? '';
    expect(text).toContain(TODAY_STRINGS.soFar);
    expect(text).toContain('Did the short one.');
  });

  it('says nothing at all on a quiet day, rather than saying nothing happened', () => {
    // docs/03-scope.md: a gap is a fact to show, never a failure to punish. The
    // absence of a line is how that is said; an empty row with a dash in it
    // would be the app noticing.
    store.set('quiet', { version: 1, days: {} });
    const element = view([quiet()]);
    expect(element.textContent ?? '').not.toContain(TODAY_STRINGS.soFar);
    expect(element.querySelector('.sofar')).toBeNull();
  });

  it('never says a thing did not happen', () => {
    store.set('quiet', { version: 1, days: { [TODAY]: { did: ['the short one'] } } });
    const text = view([quiet()]).textContent ?? '';
    expect(text).not.toMatch(/\b(missed|didn.t|did not|no sessions|none today|0 )/i);
  });

  it('reads only the day it was asked about', () => {
    store.set('quiet', {
      version: 1,
      days: { '2026-09-29': { did: ['yesterday'] }, [TODAY]: { did: ['today'] } },
    });
    const text = view([quiet()]).textContent ?? '';
    expect(text).toContain('Did today.');
    expect(text).not.toContain('Did yesterday.');
  });

  it('orders by weight, so the day reads in the order it happened in', () => {
    const late = quiet({ id: 'late', name: 'Late' });
    (late.contributes.log as { weight: number }).weight = 90;
    const early = quiet({ id: 'early', name: 'Early' });
    (early.contributes.log as { weight: number }).weight = 10;
    store.set('late', { version: 1, days: { [TODAY]: { did: ['the late thing'] } } });
    store.set('early', { version: 1, days: { [TODAY]: { did: ['the early thing'] } } });
    const items = [...view([late, early]).querySelectorAll('.sofar li')].map((n) => n.textContent);
    expect(items).toEqual(['Did the early thing.', 'Did the late thing.']);
  });

  it('sees only its own slice', () => {
    let handed: unknown;
    const nosy = quiet({ id: 'nosy' });
    (nosy.contributes.log as { lines: (day: unknown) => string[] }).lines = (day) => {
      handed = day;
      return [];
    };
    store.set('nosy', { version: 1, days: { [TODAY]: { did: ['x'] } } });
    store.set('somebody-else', { version: 1, secret: true });
    view([nosy]);
    expect(handed).toEqual({ did: ['x'] });
  });
});

describe('the real modules', () => {
  let store: KernelStore;

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
  });

  it('put a practice and a walk on the day’s record', () => {
    store.set('mindfulness', {
      version: 1,
      days: { [TODAY]: { sessions: [{ id: 's1', practice: 'three-minutes', minutes: 3 }] } },
    });
    store.set('exercise', {
      version: 1,
      days: { [TODAY]: { moved: [{ id: 'm1', kind: 'walk', minutes: 20, note: 'to the shops' }] } },
    });
    const modules = MODULES.filter((m) => ['mindfulness', 'exercise'].includes(m.id));
    const text = mountToday({ store, modules, date: TODAY }).element.textContent ?? '';
    expect(text).toContain('sat for 3 minutes');
    expect(text).toContain('A walk, 20 minutes');
    expect(text).toContain('A walk, 20 minutes — to the shops');
  });

  it('counts nothing and totals nothing', () => {
    store.set('exercise', {
      version: 1,
      days: {
        [TODAY]: {
          moved: [
            { id: 'm1', kind: 'walk', minutes: 20 },
            { id: 'm2', kind: 'cycle', minutes: 25 },
          ],
        },
      },
    });
    const modules = MODULES.filter((m) => m.id === 'exercise');
    const text = mountToday({ store, modules, date: TODAY }).element.textContent ?? '';
    // Two lines, not "45 minutes" and not "2 sessions". A total is the app
    // having an opinion about how much is the right amount.
    expect(text).toContain('A walk, 20 minutes');
    expect(text).toContain('Cycling, 25 minutes');
    expect(text).not.toContain('45');
  });
});

describe('the log never leaves the screen', () => {
  it('is absent from the clinical report', () => {
    // It is not `columns`, deliberately: that seam feeds the prescriber's day
    // table, and "sat for three minutes" does not belong in a clinical document.
    const document_ = createDocument({ now: new Date(`${TODAY}T00:00:00Z`) });
    document_.modules['mindfulness'] = {
      version: 1,
      days: { [TODAY]: { sessions: [{ id: 's1', practice: 'three-minutes', minutes: 3 }] } },
    };
    document_.kernel.days = { [TODAY]: { focus: 3 } } as never;
    const report = buildReport({
      document: document_,
      modules: MODULES.filter((m) => m.id === 'mindfulness'),
      choice: 'all',
      now: new Date(`${TODAY}T00:00:00Z`),
    });
    expect(report.html).not.toContain('sat for 3 minutes');
    expect(report.text).not.toContain('sat for 3 minutes');
  });
});
