// Child profiles.
//
// docs/04-family-space.md: "The child's name is a nickname chosen by the parent
// and nothing else about the child is asked for beyond an age band." That is the
// whole shape of this file, and the restraint is the point — a profile is two
// fields because two fields is everything the tools need.
//
// Data lives at family.children[<profileId>], and each child's module slices
// hang under it, so two children never share data and deleting a profile takes
// everything about that child with it.

import type { AdnotiaDocument, ChildProfile, FamilyState } from '../store/document';

/**
 * The two bands docs/04-family-space.md sets out, "because the evidence and the
 * tools differ".
 *
 * Note for Milestone 6: the screener's own boundaries are not these. The
 * Vanderbilt is validated 6 to 12, and that document routes under-6 and 13-to-17
 * to guidance instead — so the band a profile carries does not settle which
 * screening path it gets. That is a question for the milestone that builds the
 * screener, not for this one.
 */
export const AGE_BANDS = [
  { v: '4-11', l: '4 to 11' },
  { v: '12-17', l: '12 to 17' },
] as const;

export type AgeBand = (typeof AGE_BANDS)[number]['v'];

export const AGE_BAND_LABELS = new Map<string, string>(AGE_BANDS.map((band) => [band.v, band.l]));

export interface Profile extends ChildProfile {
  id: string;
}

/** `c_8f2a`, as docs/06-data-model.md has it. */
export function newProfileId(): string {
  return `c_${Math.random().toString(36).slice(2, 8)}`;
}

/** Every profile, oldest first, so the order does not shuffle under a parent. */
export function listProfiles(document: Readonly<AdnotiaDocument>): Profile[] {
  return Object.entries(document.family.children)
    .map(([id, child]) => ({ id, ...child }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getProfile(
  document: Readonly<AdnotiaDocument>,
  id: string | undefined,
): Profile | undefined {
  if (id === undefined) return undefined;
  const child = document.family.children[id];
  return child === undefined ? undefined : { id, ...child };
}

export interface NewProfile {
  nickname: string;
  ageBand: string;
  now?: Date;
  id?: string;
}

export function addProfile(family: Readonly<FamilyState>, profile: NewProfile): FamilyState {
  const id = profile.id ?? newProfileId();
  return {
    ...family,
    children: {
      ...family.children,
      [id]: {
        nickname: profile.nickname.trim(),
        ageBand: profile.ageBand,
        createdAt: (profile.now ?? new Date()).toISOString(),
        modules: {},
      },
    },
  };
}

export function renameProfile(
  family: Readonly<FamilyState>,
  id: string,
  nickname: string,
): FamilyState {
  const child = family.children[id];
  if (child === undefined) return family as FamilyState;
  return {
    ...family,
    children: { ...family.children, [id]: { ...child, nickname: nickname.trim() } },
  };
}

/**
 * Everything about that child, gone. docs/04-family-space.md requires this to be
 * available in one place and to take the module slices with it, which it does by
 * construction: the slices live inside the profile.
 */
export function removeProfile(family: Readonly<FamilyState>, id: string): FamilyState {
  const children = { ...family.children };
  delete children[id];
  return { ...family, children };
}

/** What a nickname has to be. Anything a parent would actually type. */
export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  return trimmed.length > 0 && trimmed.length <= 40;
}
