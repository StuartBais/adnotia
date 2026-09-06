// The areas a tool can belong to.
//
// A fixed, kernel-owned vocabulary, for the same reason the tier wording is one:
// if every module named its own area, eight modules would produce eight
// almost-synonyms and the index would be a list of one-item lists. So the kernel
// owns the words and a module chooses from them.
//
// The areas are named for what a person would be doing, in the app's own voice —
// sentence case, plain, no jargon. See docs/07-design-system.md "Voice". They are
// not categories of evidence, not module names, and not clinical specialties:
// "Medication and body" rather than "Medical", because the person opening it is
// not doing medicine, they are looking at what a tablet did to their afternoon.
//
// An area is a property of a *module*, not of a tool. An area is not a bag of
// tools: medication and sleep contribute no tools at all — they are a daily log
// and a report — and a vocabulary that could only hold tools would leave the two
// most substantial modules in the app with nowhere to live.
//
// There is deliberately no area for the school guidance. Those pages are Library
// guidance rather than modules, and an area with nothing in it is a card that
// opens onto nothing; a test in tests/kernel/areas.test.ts fails if one appears.
// If that guidance should be found somewhere other than the Library, that is a
// decision to take on its own rather than a side effect of this one.

import type { Space } from '../store/document';
import { AREAS, type Area } from '../registry/types';

/** The heading on the area's card and its page. */
const NAMES: Readonly<Record<Area, string>> = {
  focus: 'Focus and starting',
  calm: 'Calm',
  movement: 'Movement',
  body: 'Medication and body',
  assessment: 'Preparing for an appointment',
  routines: 'Routines and charts',
  observations: 'What you have noticed',
};

/**
 * One line under the heading, saying what is in there. Not a description of the
 * evidence and not a promise about the effect — the Library does both of those,
 * and this is a signpost.
 */
const BLURBS: Readonly<Record<Area, string>> = {
  focus: 'Getting started on something, breaking it up, and working out how long it will take.',
  calm: 'A few minutes of sitting still, with a timer and nothing else.',
  movement: 'Somewhere to note that you moved, without a target or a streak.',
  body: 'The daily log, what the medication covered, and how you slept.',
  assessment: 'Building a record to take to an appointment.',
  routines: 'Parts of the day set out in order, a first and then, and a star chart.',
  observations: 'Dated, specific notes about your child, for an appointment.',
};

/**
 * Which areas belong to which space. An adult never sees the parent areas and a
 * parent never sees the adult ones, the same way `audience` already separates
 * the modules themselves.
 */
const BY_SPACE: Readonly<Record<Space, readonly Area[]>> = {
  adult: ['focus', 'calm', 'movement', 'body', 'assessment'],
  family: ['routines', 'observations'],
};

export function areaName(area: Area): string {
  return NAMES[area];
}

export function areaBlurb(area: Area): string {
  return BLURBS[area];
}

/**
 * The areas of a space, in the order they are shown.
 *
 * Deliberately a fixed order rather than one derived from what the person has
 * enabled or how often they open something. A list that reorders itself is a
 * list you have to read every time, and docs/07-design-system.md asks for the
 * opposite of that.
 */
export function areasIn(space: Space): readonly Area[] {
  return BY_SPACE[space];
}

export function isArea(value: unknown): value is Area {
  return typeof value === 'string' && (AREAS as readonly string[]).includes(value);
}

export { AREAS, type Area };
