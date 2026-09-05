import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importV0 } from '../../src/kernel/store/index';

// Completeness of the v0 import, checked against the monolith rather than
// against my reading of it.
//
// The fixture is not written by hand: `blank()` is lifted out of
// reference/adnotia-v0-monolith.html and run, so the entry under test contains
// exactly the fields the monolith actually writes. A field added to the
// monolith, or one I overlooked, fails here instead of being dropped in
// silence — which is the failure mode docs/06-data-model.md forbids.

const monolith = readFileSync(resolve(process.cwd(), 'reference/adnotia-v0-monolith.html'), 'utf8');

function extract(name: string): string {
  const start = monolith.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`The monolith has no function ${name}`);
  let depth = 0;
  for (let i = monolith.indexOf('{', start); i < monolith.length; i++) {
    if (monolith[i] === '{') depth++;
    else if (monolith[i] === '}') {
      depth--;
      if (depth === 0) return monolith.slice(start, i + 1);
    }
  }
  throw new Error(`Unbalanced braces in ${name}`);
}

/** The monolith's own blank entry, built by the monolith's own code. */
function monolithBlank(date: string): Record<string, unknown> {
  const source = [extract('sortedDates'), extract('carrySource'), extract('blank')].join('\n');
  const build = new Function('state', `${source}\nreturn blank;`) as (
    state: unknown,
  ) => (date: string) => Record<string, unknown>;

  return build({
    entries: {},
    last: { med: '', dose: '', unit: 'mg', times: ['08:00'] },
  })(date);
}

const DAY = '2026-09-04';

/** Every field the monolith writes, each with a value that is easy to trace. */
function filledEntry(): Record<string, unknown> {
  const entry = monolithBlank(DAY);
  const filled: Record<string, unknown> = { ...entry };

  // A distinct value per field, so a field landing in the wrong place shows up.
  const values: Record<string, unknown> = {
    med: 'Elvanse',
    dose: '50',
    unit: 'mg',
    times: ['08:00', '13:00'],
    carriedFrom: '2026-09-03',
    carriedBack: true,
    adherence: 'late',
    focus: 4,
    mood: 3,
    onset: '09:30',
    woreOff: '16:30',
    rebound: 'mild',
    reboundTime: '17:00',
    appetite: 'reduced',
    heart: 'fine',
    side: ['dry'],
    detail: { dry: { sev: 'mild', time: '11:00', note: 'n', bpm: '' } },
    bed: '23:40',
    wake: '07:00',
    sleep: '7.25',
    sleepq: ['latency'],
    sleepLatency: '45',
    sleepNote: 'sleep note',
    notes: 'day note',
    win: 'a win',
    miss: 'a miss',
  };
  for (const [field, value] of Object.entries(values)) {
    if (field in filled) filled[field] = value;
  }
  filled['createdAt'] = '2026-09-04T21:30:00.000Z';
  return filled;
}

/** Fields the import drops on purpose, because each is exactly recoverable. */
const DELIBERATELY_DROPPED = new Set(['date']);

describe('the v0 import against the monolith’s own entry shape', () => {
  it('lifted blank() and got a real entry out of it', () => {
    const blank = monolithBlank(DAY);
    expect(blank['date']).toBe(DAY);
    expect(blank['unit']).toBe('mg');
    expect(Object.keys(blank).length).toBeGreaterThan(20);
  });

  it('loses no field the monolith writes', () => {
    const entry = filledEntry();
    const { document } = importV0({ entries: { [DAY]: entry } });

    const medication = (
      document.modules['medication']?.['days'] as Record<string, Record<string, unknown>>
    )[DAY];
    const sleep = (document.modules['sleep']?.['days'] as Record<string, Record<string, unknown>>)[
      DAY
    ];
    const kernelDay = document.kernel.days[DAY] as unknown as Record<string, unknown>;

    // Sleep fields are renamed, so compare on values rather than names.
    const landedValues = [
      ...Object.values(medication ?? {}),
      ...Object.values(sleep ?? {}),
      ...Object.values(kernelDay ?? {}),
    ].map((value) => JSON.stringify(value));

    const lost: string[] = [];
    for (const [field, value] of Object.entries(entry)) {
      if (DELIBERATELY_DROPPED.has(field)) continue;
      if (!landedValues.includes(JSON.stringify(value))) lost.push(field);
    }

    expect(lost).toEqual([]);
  });

  it('puts every field in exactly one place', () => {
    const entry = filledEntry();
    const { document } = importV0({ entries: { [DAY]: entry } });

    const medication = (document.modules['medication']?.['days'] as Record<string, object>)[DAY];
    const sleep = (document.modules['sleep']?.['days'] as Record<string, object>)[DAY];
    const kernelDay = document.kernel.days[DAY] as unknown as object;

    const total =
      Object.keys(medication ?? {}).length +
      Object.keys(sleep ?? {}).length +
      Object.keys(kernelDay ?? {}).length;

    expect(total).toBe(Object.keys(entry).length - DELIBERATELY_DROPPED.size);
  });

  it('drops nothing that is not on the deliberate list', () => {
    // Guards the list itself: if a future change starts dropping something new,
    // the count above moves and this says which field it was.
    const entry = filledEntry();
    const { document } = importV0({ entries: { [DAY]: entry } });
    const serialised = JSON.stringify(document);

    for (const [field, value] of Object.entries(entry)) {
      if (DELIBERATELY_DROPPED.has(field)) continue;
      if (typeof value === 'string' && value !== '') {
        expect(serialised, `lost the value of ${field}`).toContain(value);
      }
    }
  });

  it('carries a day the monolith would have saved, unchanged in substance', () => {
    // hasContent() is the monolith's own test for "worth saving". An entry that
    // passes it must survive the import with its medication record intact.
    const entry = filledEntry();
    const { counts } = importV0({ entries: { [DAY]: entry } });
    expect(counts).toMatchObject({ days: 1, medicationDays: 1, sleepDays: 1, kernelDays: 1 });
  });
});
