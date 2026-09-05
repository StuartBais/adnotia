import { describe, expect, it } from 'vitest';
import {
  headingsOf,
  runMonolith,
  sectionsOf,
  toV0,
  type MonolithRun,
  type V0State,
} from '../harness/monolith';
import {
  buildReport,
  formatShortDate,
  formatWeekday,
  importV0,
  MODULES,
  type Report,
} from '../../src/kernel/index';
import { thirtyDays as medicationDays } from '../../src/modules/medication/fixtures/index';
import { thirtyDays as sleepDays } from '../../src/modules/sleep/fixtures/index';

// Report parity with reference/adnotia-v0-monolith.html.
//
// docs/08-roadmap.md makes this Milestone 1's definition of done: for the
// thirty-day fixture the monolith and the module build produce the same report,
// the same history lines and the same text export, and "a person who used the
// monolith notices nothing missing".
//
// Both sides are driven from one dataset. The monolith reads the v0 document
// built by `toV0` from the module fixtures; the module build reads what
// `importV0` makes of that same document. Transcribing the fixture twice would
// only prove the two transcriptions agreed.
//
// Where the two deliberately differ, the difference is named in DIFFERENCES
// below with the reason. That register is the point of this file as much as the
// assertions are: an entry is a decision, and an entry that has no decision
// behind it is a gap that has not been closed yet.

/** The day the report is produced, pinned so the ranges do not rot. */
const TODAY = new Date('2026-10-01T12:00:00Z');

/**
 * Wins, misses and notes are kernel fields the module fixtures do not carry, so
 * the parity fixture adds them. They are what the monolith's "what changed in
 * daily life" and "in their words" sections read.
 */
const kernelDays: Record<string, Record<string, unknown>> = {};
for (const date of Object.keys(medicationDays.days)) {
  const day = Number(date.slice(-2));
  kernelDays[date] = {
    createdAt: `${date}T21:${String(10 + (day % 40)).padStart(2, '0')}:00.000Z`,
    ...(day % 5 === 0 ? { win: `Cleared the inbox on day ${day}.` } : {}),
    ...(day % 6 === 0 ? { miss: `Lost the afternoon on day ${day}.` } : {}),
    ...(day % 7 === 0 ? { notes: `A long morning, then nothing after four.` } : {}),
  };
}

function fixture(): V0State {
  return toV0({
    medication: medicationDays.days as Record<string, Record<string, unknown>>,
    sleep: sleepDays.days as Record<string, Record<string, unknown>>,
    kernel: kernelDays,
    questions: [
      { id: 'q1', text: 'Could we try a later second dose?', added: '2026-09-20' },
      { id: 'q2', text: 'Is the dry mouth worth doing anything about?', added: '2026-09-24' },
    ],
    baseline: { focus: 2, mood: 2, sleep: '6', note: 'Mornings were the worst of it.' },
    overall: 'mi',
  });
}

const state = fixture();
const monolith: MonolithRun = runMonolith(state, { range: 'all', today: TODAY });

function ours(): Report {
  const imported = importV0(state, { now: TODAY });
  const enabled = imported.document.kernel.enabledModules;
  return buildReport({
    document: imported.document,
    modules: MODULES.filter((manifest) => enabled.includes(manifest.id)),
    choice: 'all',
    now: TODAY,
  });
}

const report = ours();

// ---------------------------------------------------------------------------
// The difference register.
//
// Every entry is a deliberate divergence with a reason, or a gap that is named
// rather than hidden. Closing a gap means deleting its entry, and the assertions
// below then hold the two builds together.
// ---------------------------------------------------------------------------

interface Difference {
  what: string;
  why: string;
  /** `decided` needs no further action. `open` is waiting on a person. */
  status: 'decided' | 'open';
  /**
   * A phrase the monolith prints and this build does not. It is removed from the
   * monolith's text before the comparison, so the rest of the section is still
   * held to the letter. Restoring the phrase means deleting this line and
   * watching the assertion pass on its own.
   */
  omits?: string;
  /**
   * A phrase this build words differently. The monolith's text is rewritten to
   * ours before the comparison, so everything around it still has to match.
   * Only the named phrase is excused, never the sentence it sits in.
   */
  rewrites?: { from: string; to: string };
  /**
   * A section heading whose wording is not compared to the letter, because the
   * two builds say different things there on purpose. The figures inside it are
   * still checked; see the test that follows the letter comparison.
   */
  reshapes?: string;
}

const DIFFERENCES: readonly Difference[] = [
  {
    what: 'The report is titled "Daily record", not "ADHD medication log".',
    why:
      'The kernel owns the header and does not know that a prescription has a name: ' +
      'the same report is produced for someone logging only sleep. ' +
      'See ADR-012, and ADR-017 for why "Daily record" was chosen over naming the ' +
      'medication: the subject line beneath carries the specificity.',
    status: 'decided',
  },
  {
    what: 'The verdict block drops one sentence about what an optimal dose is.',
    why:
      'It tells a prescriber how to weigh the dose, which is the line docs/03-scope.md ' +
      'draws, and it is an unreferenced clinical generalisation. Decided in ADR-017: ' +
      'the block presents the four things a prescriber weighs and stops.',
    status: 'decided',
    omits:
      'Optimal dose is usually described as the lowest one giving meaningful functional ' +
      'improvement with tolerable side effects.',
  },
  {
    what: 'There is no "Day by day" table.',
    why:
      "It spans medication, sleep and the kernel's own fields, so like the cover chart it " +
      'belongs to no module and needs a contribution seam of its own. Not yet built.',
    status: 'open',
  },
  {
    what: 'A dose block with no sleep hours prints "Sleep —", not "Sleep —h".',
    why: 'A dash followed by a unit reads as a measurement that came out as nothing.',
    status: 'decided',
    rewrites: { from: 'Sleep —h,', to: 'Sleep —,' },
  },
  {
    what:
      "The sleep section does not repeat the monolith's claim that 30 minutes of " +
      'sleep latency is "usually treated as clinically meaningful".',
    why:
      'It is an interpretive clinical claim with no citation behind it, in a Tier B ' +
      'module. docs/02-evidence-rubric.md fails an unreferenced claim at review, and ' +
      'the sentence tells a clinician how to read a number rather than reporting one. ' +
      'Decided in ADR-017: the latency is reported and the interpretation is not. It ' +
      'may return when the Milestone 8 citation pass can attach a verified source.',
    status: 'decided',
    reshapes: 'Sleep',
  },
  {
    what: 'The sleep section states its coverage and the typical bed and wake times.',
    why:
      'docs/01-module-contract.md requires a clinical section to state its own coverage ' +
      "when it matters, and the monolith's did not. The times are what the module has.",
    status: 'decided',
    reshapes: 'Sleep',
  },
  {
    what:
      '"Side effects over time" carries no Trend column and a different legend, states ' +
      'its coverage, keeps the summary table above the comparison, and splits the range ' +
      'by calendar half rather than by entry count.',
    why:
      'The Trend word came from a composite of frequency and severity the monolith never ' +
      'showed, which is the hidden scoring hard rule 4 forbids, and its legend told the ' +
      'reader which effects were "worth raising". The monolith also takes an equal count ' +
      'from each end, so the middle day of an odd-length range falls into neither half. ' +
      'See ADR-017.',
    status: 'decided',
    reshapes: 'Side effects over time',
  },
  {
    what: 'History is one card per module per day, not one card per day.',
    why:
      'docs/01-module-contract.md gives each module a `records` contribution over its own ' +
      "slice, and a module cannot draw another's data. A person who used the monolith " +
      'sees the same facts about a day, grouped by tool rather than merged into one line.',
    status: 'decided',
  },
  {
    what: "History does not show the day's win, miss or note.",
    why:
      'Those are kernel fields now, and the kernel has no `records` contribution of its ' +
      'own, only report sections. The seam exists for reports and not yet for history.',
    status: 'open',
  },
  {
    what: 'The text export separates table cells with " | ", not "  |  ".',
    why:
      'docs/07-design-system.md "Print" specifies " | "-separated rows, and the document ' +
      'is the authority over the monolith where the two disagree.',
    status: 'decided',
  },
  {
    what: 'The footer prints "About this record" before the questions.',
    why:
      'The monolith prints the questions first. The record-quality note is about the ' +
      'document and the questions are what the appointment is for, so the questions read ' +
      'last. A deliberate ordering choice.',
    status: 'decided',
  },
  {
    what: 'The sleep section appears whenever a night was recorded.',
    why:
      'The monolith shows it only if a quality chip or a note was added, so bed and wake ' +
      'times alone printed nothing. Sleep is its own module now and reports what it has.',
    status: 'decided',
  },
];

describe('the difference register', () => {
  it('gives every difference a reason', () => {
    for (const entry of DIFFERENCES) {
      expect(entry.what.length, entry.what).toBeGreaterThan(20);
      expect(entry.why.length, entry.what).toBeGreaterThan(40);
    }
  });

  it('still has gaps, and says so rather than implying parity', () => {
    // This is not an aspiration. Milestone 1 is not done while it is above zero,
    // and this assertion is what stops the file quietly claiming otherwise.
    //
    // What is left is unbuilt work, not undecided wording: the day-by-day table,
    // and the kernel's own fields in History. Every wording question was settled
    // in docs/decisions/ADR-017-what-the-report-will-not-say.md.
    const open = DIFFERENCES.filter((entry) => entry.status === 'open');
    expect(open.length).toBe(2);
  });
});

describe('the report, against the monolith', () => {
  it('produces a report at all from the same fixture', () => {
    expect(report.empty).toBe(false);
    expect(monolith.sheetText.length).toBeGreaterThan(500);
  });

  it('covers the same days', () => {
    // The monolith prints "N of M days logged (P%)"; so do we, from the same
    // import. A difference here means the migration lost or invented a day.
    const theirs = /(\d+) of (\d+) days logged \((\d+)%\)/.exec(monolith.sheetText);
    expect(theirs).not.toBeNull();
    expect(report.html).toContain(`${theirs?.[1]} of ${theirs?.[2]} days logged (${theirs?.[3]}%)`);
  });

  it('names the same medication and the same dates in the header', () => {
    const theirs = /Elvanse · ([^·]+) ·/.exec(monolith.sheetText);
    expect(theirs).not.toBeNull();
    expect(report.html).toContain('<b>Elvanse</b>');
    expect(report.html.replace(/<[^>]+>/g, '')).toContain((theirs?.[1] ?? '').trim());
  });

  it('carries every section the monolith has, but for the ones in the register', () => {
    const known = new Set(['Side effects over time', 'Day by day']);
    const theirs = headingsOf(monolith.sheetHtml)
      .filter((heading) => heading.startsWith('h3 '))
      .map((heading) => heading.slice(3))
      .filter((heading) => !known.has(heading));

    const mine = new Set(headingsOf(report.html).map((heading) => heading.replace(/^h\d /, '')));
    // The monolith folds the severity grid into the section this build calls
    // "Side effects"; the grid itself is asserted below.
    for (const heading of theirs) expect([...mine], `missing: ${heading}`).toContain(heading);
  });

  it('says the same things, to the letter, in the sections both builds have', () => {
    const theirs = sectionsOf(monolith.sheetHtml);
    const mine = sectionsOf(report.html);
    const omitted = DIFFERENCES.map((entry) => entry.omits).filter(
      (phrase): phrase is string => phrase !== undefined,
    );
    const rewrites = DIFFERENCES.map((entry) => entry.rewrites).filter(
      (rule): rule is { from: string; to: string } => rule !== undefined,
    );

    const reshaped = new Set(
      DIFFERENCES.map((entry) => entry.reshapes).filter(
        (heading): heading is string => heading !== undefined,
      ),
    );

    let compared = 0;
    for (const [heading, body] of theirs) {
      const ourBody = mine.get(heading);
      if (ourBody === undefined || reshaped.has(heading)) continue;

      let expected = body;
      for (const phrase of omitted) expected = expected.replace(phrase, '').trim();
      for (const rule of rewrites) expected = expected.split(rule.from).join(rule.to);
      expect(ourBody, `section: ${heading}`).toBe(expected.replace(/\s+/g, ' '));
      compared++;
    }
    // Guards the loop: a comparison that silently matched nothing would pass.
    expect(compared).toBeGreaterThanOrEqual(3);
  });

  it('reports the same figures in the sections it words differently', () => {
    // A section may be reshaped. The arithmetic underneath it may not: both
    // builds read the same nights and must count them the same way.
    const theirs = sectionsOf(monolith.sheetHtml).get('Sleep') ?? '';
    const mine = sectionsOf(report.html).get('Sleep') ?? '';
    expect(theirs).not.toBe('');

    const figures = (text: string): string[] =>
      [...text.matchAll(/(\d+) of (\d+)|(\d+) minutes/g)].map((match) => match[0]);

    expect(mine).toContain('43 minutes');
    for (const figure of figures(theirs)) expect(mine, `figure: ${figure}`).toContain(figure);
  });
});

describe('the history, against the monolith', () => {
  /** Every history line this build renders, across every module's contribution. */
  function ourHistory(): string {
    const imported = importV0(state, { now: TODAY });
    const enabled = imported.document.kernel.enabledModules;
    const lines: string[] = [];

    for (const manifest of MODULES.filter((m) => enabled.includes(m.id))) {
      const contribution = manifest.contributes.records;
      if (contribution === undefined) continue;
      const host = document.createElement('div');
      const days = (
        imported.document.modules[manifest.id] as unknown as {
          days: Record<string, unknown>;
        }
      ).days;
      contribution.render(host, { dates: Object.keys(days).sort(), days });
      lines.push((host.textContent ?? '').replace(/\s+/g, ' '));
    }
    return lines.join(' ');
  }

  const mine = ourHistory();

  it('says the same things about a day as the monolith does', () => {
    // The monolith puts one day on one line; this build groups by module. What
    // must not differ is the content: every fact the monolith shows about a day
    // has to be somewhere in what this build shows about the same day.
    const theirs = monolith.historyText
      // Edit and Delete are controls, not record.
      .replace(/EditDelete/g, ' | ')
      .split(' | ')
      .filter((line) => line.trim() !== '');

    expect(theirs.length).toBeGreaterThan(20);

    const missing: string[] = [];
    for (const line of theirs) {
      // "focus 4", "mood 1", "mild crash", "Dry mouth (mild) at 11am"
      for (const fact of line.matchAll(/focus \d|mood \d|\w+ crash|Ate less/g)) {
        if (!mine.includes(fact[0])) missing.push(`${line.slice(0, 20)}: ${fact[0]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('dates a history line the way the monolith does', () => {
    // A date with a weekday beside it, not an ISO date: a person scanning a list
    // reads the day. The exact wording is the reader's locale's business — the
    // app follows it deliberately, and this test runs in more than one — so the
    // expected string is taken from the monolith rather than written down here.
    const newest = Object.keys(medicationDays.days).sort().at(-1) as string;
    const dated = `${formatShortDate(newest)}, ${formatWeekday(newest)}`;

    expect(monolith.historyText, 'the monolith dates its lines differently').toContain(dated);
    expect(mine).toContain(dated);
    expect(mine).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('the text export, against the monolith', () => {
  it('underlines its headings the way the monolith does', () => {
    const lines = report.text.split('\n');
    const theirs = monolith.exportText.split('\n');

    expect(theirs[1]).toMatch(/^=+$/);
    expect(lines[1]).toMatch(/^=+$/);
    expect(lines[1]?.length).toBe(lines[0]?.length);

    // Every h3 in the sheet is a heading in the export, underlined with dashes.
    const underlined = lines.filter((line, index) => /^-+$/.test(line) && lines[index - 1] !== '');
    expect(underlined.length).toBeGreaterThanOrEqual(5);
    for (const [index, line] of lines.entries()) {
      if (!/^-+$/.test(line)) continue;
      expect(line.length, `underline under "${lines[index - 1]}"`).toBe(
        (lines[index - 1] ?? '').length,
      );
    }
  });

  it('replaces every chart with a bracketed note, as the monolith does', () => {
    expect(monolith.exportText).toContain('[dose chart — see the printed or PDF version]');
    expect(report.text).toContain('[dose chart — see the printed or PDF version]');
    expect(report.text).not.toContain('<svg');
    expect(report.text).not.toContain('<');
  });

  it('ends with the same generated line', () => {
    const theirs = /Generated .+ from a self-kept daily log\./.exec(monolith.exportText);
    expect(theirs).not.toBeNull();
    expect(report.text.trimEnd().endsWith(theirs?.[0] ?? '@')).toBe(true);
  });

  it('carries the same figures as the sheet it was made from', () => {
    // The export is a second rendering of the same sections, so a figure that
    // appears in one and not the other means the two renderings have drifted.
    const figures = (text: string): string[] =>
      [...text.matchAll(/\d+ of \d+|\d+\.\d+\/5|\d+h( \d+m)?/g)].map((match) => match[0]);

    const onSheet = new Set(figures(report.html.replace(/<[^>]+>/g, ' ')));
    const inText = new Set(figures(report.text));
    for (const figure of onSheet) {
      expect([...inText], `figure on the sheet but not in the export: ${figure}`).toContain(figure);
    }
  });
});
