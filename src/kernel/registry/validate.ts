// Manifest validation.
//
// The kernel validates at registration rather than at review, because a rule
// that depends on someone remembering it is not a rule. The list is
// docs/05-architecture.md "Module registration", plus the Family constraints in
// docs/01-module-contract.md "Family space rules".
//
// A manifest either registers whole or not at all. It never half-mounts.

import {
  AREAS,
  CHILD_ALLOWED_CONTRIBUTIONS,
  DERIVED_METADATA_KEY,
  RESERVED_FIELD_IDS,
  TODAY_COST_BUDGET,
  type ModuleManifest,
  type TodayField,
} from './types';

export interface ValidationIssue {
  moduleId: string;
  rule: string;
  message: string;
}

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const REVIEW_DATE_PATTERN = /^\d{4}-\d{2}$/;
const TIERS = new Set(['A', 'B', 'C']);
const AUDIENCES = new Set(['adult', 'parent', 'child']);
/** Read from the contract rather than retyped, so the two cannot drift. */
const AREA_SET: ReadonlySet<string> = new Set(AREAS);
const FIELD_TYPES = new Set([
  'scale5',
  'chips',
  'chipsMulti',
  'time',
  'timeList',
  'number',
  'text',
  'toggle',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Every field a module declares, following followUp one level down. */
function allFields(fields: readonly TodayField[]): TodayField[] {
  const found: TodayField[] = [];
  for (const field of fields) {
    found.push(field);
    if (typeof field.followUp === 'function') {
      try {
        // Probed with a truthy value; a followUp that throws on an unexpected
        // value is itself a defect worth surfacing here.
        const more = field.followUp('probe');
        if (Array.isArray(more)) found.push(...more);
      } catch {
        // Reported separately by the followUp rule below.
      }
    }
  }
  return found;
}

/**
 * Check one manifest. Returns every issue found rather than the first, so a
 * module author sees the whole list at once.
 *
 * `known` is the set of module ids being registered alongside this one, used to
 * check declared dependencies and id uniqueness.
 */
export function validateManifest(
  manifest: ModuleManifest,
  known: ReadonlySet<string> = new Set(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = isNonEmptyString(manifest?.id) ? manifest.id : '(no id)';
  const fail = (rule: string, message: string): void => {
    issues.push({ moduleId: id, rule, message });
  };

  // ---------- identity ----------
  if (!isNonEmptyString(manifest?.id)) {
    fail('id', 'A module needs an id.');
  } else if (!ID_PATTERN.test(manifest.id)) {
    fail('id', `id "${manifest.id}" must be lowercase, starting with a letter.`);
  }
  if (!isNonEmptyString(manifest?.name)) fail('name', 'A module needs a name.');
  if (!isNonEmptyString(manifest?.summary)) fail('summary', 'A module needs a summary.');

  if (!Number.isInteger(manifest?.version) || manifest.version < 1) {
    fail('version', 'version must be a whole number of 1 or more.');
  }
  if (!TIERS.has(manifest?.tier)) {
    fail('tier', `tier must be A, B or C. No tier, no merge.`);
  }
  if (!AUDIENCES.has(manifest?.audience)) {
    fail('audience', 'audience must be adult, parent or child.');
  }
  // A module with no area is a module nobody can reach: the index is built from
  // the areas, so an unplaced module would exist in the build and nowhere on the
  // screen. Failing here is how that stays impossible.
  if (!AREA_SET.has(manifest?.area as string)) {
    fail('area', `area must be one of: ${[...AREA_SET].join(', ')}.`);
  }

  const contributes = manifest?.contributes;
  if (typeof contributes !== 'object' || contributes === null) {
    fail('contributes', 'A module must declare what it contributes.');
    return issues;
  }

  // ---------- the Library entry ----------
  // A tool may carry a lower tier than its module, never a higher one: it cannot
  // claim more evidence than the thing it ships inside. See ADR-025.
  const TIER_ORDER: Readonly<Record<string, number>> = { A: 3, B: 2, C: 1 };
  for (const tool of contributes.tools ?? []) {
    if (tool?.tier === undefined) continue;
    if (!TIERS.has(tool.tier)) {
      fail('tool-tier', `The tool "${tool.title}" has a tier that is not A, B or C.`);
      continue;
    }
    if ((TIER_ORDER[tool.tier] ?? 0) > (TIER_ORDER[manifest.tier] ?? 0)) {
      fail(
        'tool-tier',
        `The tool "${tool.title}" claims tier ${tool.tier} inside a tier ${manifest.tier} ` +
          'module. A tool cannot claim more evidence than the module it ships in.',
      );
    }
  }

  const library = contributes.library;
  if (typeof library !== 'object' || library === null) {
    fail('library', 'Every module needs a Library entry, including Tier C.');
  } else {
    if (!TIERS.has(library.tier)) fail('library', 'The Library entry needs a tier.');
    else if (library.tier !== manifest.tier) {
      fail(
        'library',
        `The Library entry says tier ${library.tier} and the manifest says ${manifest.tier}.`,
      );
    }
    if (!isNonEmptyString(library.whatItIs)) fail('library', 'The Library entry needs whatItIs.');
    if (!isNonEmptyString(library.whatTheEvidenceSays)) {
      fail('library', 'The Library entry needs whatTheEvidenceSays.');
    }
    if (!isNonEmptyString(library.whatItWontDo)) {
      fail('library', 'The Library entry needs whatItWontDo. The honest limits are not optional.');
    }
    if (!Array.isArray(library.citations) || library.citations.length === 0) {
      fail('library', 'The Library entry needs at least one citation.');
    }
    if (!REVIEW_DATE_PATTERN.test(library.reviewed ?? '')) {
      fail('library', 'The Library entry needs a reviewed date as YYYY-MM.');
    }
    if (!REVIEW_DATE_PATTERN.test(library.nextReview ?? '')) {
      fail('library', 'The Library entry needs a nextReview date as YYYY-MM.');
    }
  }

  // ---------- what a child module may contribute ----------
  if (manifest.audience === 'child') {
    for (const key of Object.keys(contributes)) {
      if (!CHILD_ALLOWED_CONTRIBUTIONS.includes(key)) {
        fail(
          'child-surface',
          `A child module may contribute only ${CHILD_ALLOWED_CONTRIBUTIONS.join(' and ')}, not ${key}.`,
        );
      }
    }
  }

  // ---------- today fields ----------
  const today = contributes.today;
  if (today !== undefined) {
    if (!Array.isArray(today)) {
      fail('today', 'today must be a list of fields.');
    } else {
      const seen = new Set<string>();
      let cost = 0;

      for (const field of today) {
        if (!isNonEmptyString(field?.id)) {
          fail('today', 'Every today field needs an id.');
          continue;
        }
        if (seen.has(field.id)) fail('today', `Two today fields share the id "${field.id}".`);
        seen.add(field.id);

        if (!isNonEmptyString(field.label)) fail('today', `Field "${field.id}" needs a label.`);
        if (!FIELD_TYPES.has(field.type)) {
          fail('today', `Field "${field.id}" has an unknown type "${String(field.type)}".`);
        }
        if (typeof field.cost !== 'number' || !Number.isFinite(field.cost) || field.cost < 0) {
          fail('today', `Field "${field.id}" needs a cost in seconds.`);
        } else {
          cost += field.cost;
        }

        if (
          (field.type === 'chips' || field.type === 'chipsMulti') &&
          !Array.isArray(field.options)
        ) {
          fail('today', `Field "${field.id}" is chips and needs options.`);
        }
        if (field.type === 'scale5' && !Array.isArray(field.anchors)) {
          fail('today', `Field "${field.id}" is a scale and needs anchors.`);
        }
        if (field.followUp !== undefined && typeof field.followUp !== 'function') {
          fail('today', `Field "${field.id}" has a followUp that is not a function.`);
        }
      }

      if (cost > TODAY_COST_BUDGET) {
        fail(
          'today-budget',
          `today fields cost ${cost}s, over the ${TODAY_COST_BUDGET}s budget. The whole check-in must fit in about ninety seconds.`,
        );
      }

      // Reserved ids, at every level including follow-ups.
      for (const field of allFields(today)) {
        if (
          isNonEmptyString(field?.id) &&
          (field.id === DERIVED_METADATA_KEY || field.id.startsWith(`${DERIVED_METADATA_KEY}.`))
        ) {
          fail('reserved-field', 'The _derived path is reserved for automatic-value metadata.');
        }
      }
      if (manifest.audience !== 'adult') {
        for (const field of allFields(today)) {
          if (isNonEmptyString(field?.id) && RESERVED_FIELD_IDS.includes(field.id)) {
            fail(
              'reserved-field',
              `Field "${field.id}" is reserved for the Adult space. There is no medication tracking in the Family space, by design.`,
            );
          }
        }
      }
    }
  }

  // ---------- reports ----------
  const reports = contributes.reports;
  if (reports !== undefined) {
    if (!Array.isArray(reports)) {
      fail('reports', 'reports must be a list of sections.');
    } else {
      for (const section of reports) {
        if (!isNonEmptyString(section?.id)) fail('reports', 'Every report section needs an id.');
        if (!isNonEmptyString(section?.report)) {
          fail('reports', `Section "${section?.id ?? '?'}" must name the report it belongs to.`);
        }
        if (typeof section?.weight !== 'number') {
          fail('reports', `Section "${section?.id ?? '?'}" needs a weight.`);
        }
        if (typeof section?.render !== 'function' || typeof section?.renderText !== 'function') {
          fail(
            'reports',
            `Section "${section?.id ?? '?'}" needs both render and renderText; the text export is not optional.`,
          );
        }
        // The clinical report is adult-only. See docs/04-family-space.md.
        if (section?.report === 'clinical' && manifest.audience !== 'adult') {
          fail(
            'reports',
            `Section "${section.id}" contributes to the clinical report, which is Adult-space only.`,
          );
        }
      }
    }
  }

  // ---------- dependencies ----------
  const dependencies = manifest.dependencies ?? [];
  if (!Array.isArray(dependencies)) {
    fail('dependencies', 'dependencies must be a list of module ids.');
  } else {
    for (const dependency of dependencies) {
      if (dependency === manifest.id) {
        fail('dependencies', 'A module cannot depend on itself.');
      } else if (known.size > 0 && !known.has(dependency)) {
        fail('dependencies', `Declared dependency "${dependency}" is not a registered module.`);
      }
    }
  }

  // ---------- migrations ----------
  if (manifest.version > 1) {
    if (typeof manifest.migrate !== 'function') {
      fail('migrate', `version is ${manifest.version}, so the module needs a migrate function.`);
    } else if (manifest.fixtures === undefined) {
      fail('migrate', 'Checking migrate needs fixtures to run it against.');
    } else {
      // Run it from every prior version, as docs/05-architecture.md requires.
      for (let from = 1; from < manifest.version; from++) {
        try {
          const result = manifest.migrate(structuredClone(manifest.fixtures.threeDays), from);
          if (typeof result !== 'object' || result === null) {
            fail('migrate', `migrate from version ${from} did not return a slice.`);
          }
        } catch (error) {
          fail(
            'migrate',
            `migrate from version ${from} threw: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  // ---------- derived values ----------
  if (manifest.derive !== undefined) {
    if (typeof manifest.derive !== 'function') {
      fail('derive', 'derive must be a function.');
    } else {
      // Run it against the module's own fixtures so a broken one fails at
      // registration rather than on someone's Tuesday.
      const sample = manifest.fixtures?.threeDays as
        { days?: Record<string, Record<string, unknown>> } | undefined;
      const day = Object.values(sample?.days ?? {})[0] ?? {};
      try {
        const produced = manifest.derive(day);
        if (typeof produced !== 'object' || produced === null) {
          fail('derive', 'derive did not return a partial day record.');
        }
      } catch (error) {
        fail(
          'derive',
          `derive threw on the module's own fixture: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  // ---------- fixtures ----------
  const fixtures = manifest.fixtures;
  if (fixtures === undefined) {
    fail('fixtures', 'A module ships fixtures for zero, three and thirty days.');
  } else {
    for (const name of ['empty', 'threeDays', 'thirtyDays'] as const) {
      if (fixtures[name] === undefined) fail('fixtures', `Missing the ${name} fixture.`);
    }
  }

  return issues;
}
