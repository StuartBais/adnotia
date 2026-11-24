// Writes the review packet for a second reader: every factual sentence the
// Library shows, beside the references it rests on, and every crisis line beside
// the organisation it belongs to. Each row has empty columns for the reader.
//
//   node scripts/review-packet.mjs
//
// It quotes; it never rephrases. Regenerate it after any change to a Library
// entry, guidance page or crisis line, and the header records the commit it was
// made from, so a reader can tell when it has gone stale.
//
// It bundles the TypeScript sources with esbuild, which Vite already installs,
// and reads them in Node. Nothing here is shipped.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'adnotia-review-'));

const entry = `
export { MODULES } from '${root}/src/kernel/registry/index.ts';
export { EXCLUSIONS } from '${root}/src/kernel/library/exclusions.ts';
export { tierName } from '${root}/src/kernel/library/tiers.ts';
export {
  ASSESSMENT_STRINGS, ASSESSMENT_EVIDENCE,
  UNDER_SIX_STRINGS, UNDER_SIX_EVIDENCE,
  THIRTEEN_PLUS_STRINGS, THIRTEEN_PLUS_EVIDENCE,
} from '${root}/src/kernel/family/guidance.ts';
export { SCHOOL_STRINGS, SCHOOL_EVIDENCE } from '${root}/src/kernel/family/school.ts';
export { CRISIS_LINES, FAMILY_CRISIS_LINES, CRISIS_REVIEWED, CRISIS_STRINGS } from '${root}/src/kernel/shell/crisis.ts';
`;
writeFileSync(join(work, 'entry.ts'), entry);
await build({
  entryPoints: [join(work, 'entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(work, 'bundle.mjs'),
  loader: { '.svg': 'text', '.css': 'empty' },
  logLevel: 'error',
});
const src = await import(pathToFileURL(join(work, 'bundle.mjs')).href);
rmSync(work, { recursive: true, force: true });

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root })
  .toString()
  .trim();
const today = new Date().toISOString().slice(0, 10);
const stamp = `Generated ${today} by \`node scripts/review-packet.mjs\` from the source at commit \`${commit}\`. If the source has changed since, regenerate it before reviewing.`;

/** Sentences, as the text has them. A split falls only before a capital or a quote. */
function sentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.?!])\s+(?=[A-Z"“‘(])/)
    .filter((s) => s.length > 0);
}

const cell = (s) => String(s).replace(/\|/g, '\\|');

function citations(list) {
  if (!list || list.length === 0) return '_No references._\n';
  return (
    list
      .map((c, i) =>
        `${i + 1}. ${c.authors} (${c.year}). ${c.title}. *${c.venue}*. ${c.doi_or_url ?? ''}`.trim(),
      )
      .join('\n') + '\n'
  );
}

function claimTable(parts) {
  const rows = [
    '| # | Part | Claim, quoted exactly | Checked by | Date | Verdict |',
    '|---|---|---|---|---|---|',
  ];
  let n = 0;
  for (const [part, text] of parts)
    for (const sentence of sentences(text))
      rows.push(`| ${++n} | ${part} | ${cell(sentence)} | | | |`);
  return rows.join('\n') + '\n';
}

/** Every string inside a strings object, labelled by its key. */
function leaves(object, prefix = '') {
  const out = [];
  for (const [key, value] of Object.entries(object)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.push([label, value]);
    else if (Array.isArray(value))
      value.forEach((v, i) => {
        if (typeof v === 'string') out.push([`${label}[${i + 1}]`, v]);
        else if (v && typeof v === 'object') out.push(...leaves(v, `${label}[${i + 1}]`));
      });
    else if (value && typeof value === 'object') out.push(...leaves(value, label));
  }
  return out;
}

let claims = `# Review packet: claims

${stamp}

**For the second reader.** Each row is one sentence the app shows, quoted
exactly from the source. Check it against the references listed for its entry,
and fill in the last three columns. Do not edit the claim column: a change to
the wording is made in the source and this file is regenerated.

A sentence is the unit, which means some rows state no fact (an instruction, a
definition) and can be marked "not a claim". Splitting is mechanical, so an
abbreviation can occasionally cut a sentence in two; read across the rows.

Tiers are shown as the build has them. Every one of them is a proposal until
someone other than its author confirms it (\`docs/02-evidence-rubric.md\`).

## Modules
`;

for (const manifest of src.MODULES) {
  const lib = manifest.contributes?.library;
  if (!lib) continue;
  claims += `
### ${manifest.name} (\`${manifest.id}\`)

Tier: **${src.tierName(lib.tier)}** · audience: ${manifest.audience} · references checked against the originals: ${lib.citationsVerified ?? 'not yet'} · reviewed ${lib.reviewed}, next ${lib.nextReview}

${citations(lib.citations)}
${claimTable([
  ['What it is', lib.whatItIs],
  ['What the evidence says', lib.whatTheEvidenceSays],
  ['What it will not do', lib.whatItWontDo],
])}`;
  const tools = (manifest.contributes?.tools ?? []).filter((t) => t.tier !== undefined);
  if (tools.length > 0)
    claims += `\nTools in this module that carry a tier of their own: ${tools
      .map((t) => `${t.title ?? t.id} (${src.tierName(t.tier)})`)
      .join('; ')}.\n`;
}

claims += `\n## Things the Library says Adnotia will not build\n`;
for (const ex of src.EXCLUSIONS) {
  claims += `
### ${ex.title}

${citations(ex.citations)}
${claimTable([
  ['What it is', ex.whatItIs],
  ['Why it is not here', ex.why],
  ['What would change this', ex.whatWouldChangeIt],
])}`;
}

claims += `\n## Guidance pages for parents\n`;
for (const [strings, evidence] of [
  [src.ASSESSMENT_STRINGS, src.ASSESSMENT_EVIDENCE],
  [src.UNDER_SIX_STRINGS, src.UNDER_SIX_EVIDENCE],
  [src.THIRTEEN_PLUS_STRINGS, src.THIRTEEN_PLUS_EVIDENCE],
  [src.SCHOOL_STRINGS, src.SCHOOL_EVIDENCE],
]) {
  claims += `
### ${strings.title}

Tier: **${src.tierName(evidence.tier)}** · references checked against the originals: ${evidence.citationsVerified ?? 'not yet'}

${citations(evidence.citations)}
${claimTable(leaves(strings).filter(([key]) => !/title$/i.test(key)))}`;
}

const lineTable = (lines, withGroup) =>
  [
    `| ${withGroup ? 'For | ' : ''}Where | Organisation | Number or contact as shown | Dials | Note shown | Confirmed on the organisation's own site, with date |`,
    `|${withGroup ? '---|' : ''}---|---|---|---|---|---|`,
    ...lines.map(
      (l) =>
        `| ${withGroup ? `${l.group} | ` : ''}${cell(l.where)} | ${cell(l.who)} | ${cell(l.contact)} | ${l.dial ?? ''} | ${cell(l.note ?? '')} | |`,
    ),
  ].join('\n');

const crisis = `# Review packet: crisis lines

${stamp}

**For whoever confirms the numbers.** Every line on the "if things are bad right
now" pages, as the app shows it. Confirm each against the organisation's own
website, not a directory or a search result, and write the page address and
date in the last column. The app has no network, so these numbers cannot
correct themselves: a wrong one stays wrong until the source is changed.

The page states it was last reviewed in **${src.CRISIS_REVIEWED}**. That date is
when the list was written, not when it was checked: no number here has yet been
confirmed by a person.

## Emergency numbers on every page

These are named in the page's own text, not in a list, so they are quoted with
the sentence they sit in.

> ${src.CRISIS_STRINGS.emergencyNote}

| Where, as the sentence says | Number | Confirmed as that region's emergency number, with source and date |
|---|---|---|
| Much of Europe | 112 | |
| United Kingdom | 999 | |
| United States and Canada | 911 | |
| Australia | 000 | |

## The link for anywhere else

> ${src.CRISIS_STRINGS.elsewhereBody}

| Link | Opens | Confirmed that it lists free lines by country, with date |
|---|---|---|
| findahelpline.com | https://findahelpline.com | |

## Helplines on every page

${lineTable(src.CRISIS_LINES, false)}

## Added on the parent's page

"worried" is for an adult worried about a child, "child" is shown for a child
to know about, "parent" is for the parent themselves.

${lineTable(src.FAMILY_CRISIS_LINES, true)}
`;

mkdirSync(join(root, 'docs/review'), { recursive: true });
writeFileSync(join(root, 'docs/review/claims.md'), claims);
writeFileSync(join(root, 'docs/review/crisis-numbers.md'), crisis);
console.log('Wrote docs/review/claims.md and docs/review/crisis-numbers.md');
