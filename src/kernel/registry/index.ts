// The module registry.
//
// Every manifest is imported statically. There is no dynamic loading and no
// remote loading: the set of modules is the set in the build, and a person
// reading the source can see all of it. See docs/05-architecture.md
// "Module registration".

import { validateManifest, type ValidationIssue } from './validate';
import type { Audience, ModuleManifest } from './types';
import medication from '../../modules/medication/manifest';
import sleep from '../../modules/sleep/manifest';

export * from './types';
export { validateManifest, type ValidationIssue } from './validate';

/**
 * Every module in this build. Deleting a module is deleting its directory and
 * its line here; nothing else references it.
 */
export const MODULES: readonly ModuleManifest[] = [medication, sleep];

export interface RegisterOptions {
  /**
   * Throw on an invalid manifest rather than skipping it. True in development,
   * so a broken module is impossible to miss; false in production, where one
   * bad module must not take the whole app down with it.
   */
  strict?: boolean;
  onError?: (issues: readonly ValidationIssue[]) => void;
}

export interface Registry {
  all(): readonly ModuleManifest[];
  /** Modules that mount in a given space. */
  forAudience(audience: Audience): readonly ModuleManifest[];
  get(id: string): ModuleManifest | undefined;
  /** Manifests that failed validation, with why. Never mounted. */
  readonly rejected: readonly { manifest: ModuleManifest; issues: readonly ValidationIssue[] }[];
}

export class ManifestError extends Error {
  readonly issues: readonly ValidationIssue[];
  constructor(issues: readonly ValidationIssue[]) {
    super(
      `${issues.length} problem${issues.length === 1 ? '' : 's'} in module manifests:\n` +
        issues.map((issue) => `  ${issue.moduleId} [${issue.rule}] ${issue.message}`).join('\n'),
    );
    this.name = 'ManifestError';
    this.issues = issues;
  }
}

/**
 * Validate and register. A manifest either registers whole or not at all.
 */
export function createRegistry(
  manifests: readonly ModuleManifest[] = MODULES,
  options: RegisterOptions = {},
): Registry {
  const strict = options.strict ?? true;

  // Duplicate ids are found across the set, not within one manifest.
  const seen = new Set<string>();
  const duplicates: ValidationIssue[] = [];
  for (const manifest of manifests) {
    const id = manifest?.id;
    if (typeof id !== 'string' || id === '') continue;
    if (seen.has(id)) {
      duplicates.push({
        moduleId: id,
        rule: 'id',
        message: `Two modules share the id "${id}". An id is stable and unique, and never renamed once shipped.`,
      });
    }
    seen.add(id);
  }

  const accepted: ModuleManifest[] = [];
  const rejected: { manifest: ModuleManifest; issues: readonly ValidationIssue[] }[] = [];
  const allIssues: ValidationIssue[] = [...duplicates];

  for (const manifest of manifests) {
    const issues = [
      ...validateManifest(manifest, seen),
      ...duplicates.filter((issue) => issue.moduleId === manifest?.id),
    ];
    if (issues.length === 0) accepted.push(manifest);
    else {
      rejected.push({ manifest, issues });
      for (const issue of issues) {
        if (!allIssues.includes(issue)) allIssues.push(issue);
      }
    }
  }

  if (allIssues.length > 0) {
    if (strict) throw new ManifestError(allIssues);
    if (options.onError) options.onError(allIssues);
    else console.error(new ManifestError(allIssues).message);
  }

  return {
    all: () => accepted,
    forAudience: (audience) => accepted.filter((manifest) => manifest.audience === audience),
    get: (id) => accepted.find((manifest) => manifest.id === id),
    rejected,
  };
}
