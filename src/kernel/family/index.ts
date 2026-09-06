// The Family space: profiles, the handed-over surface, and the gate between them.
// See docs/04-family-space.md.

export {
  AGE_BANDS,
  AGE_BAND_LABELS,
  addProfile,
  getProfile,
  isValidNickname,
  listProfiles,
  newProfileId,
  removeProfile,
  renameProfile,
  type AgeBand,
  type NewProfile,
  type Profile,
} from './profiles';
export { PROFILE_STRINGS, profilesPage, type ProfilesPageOptions } from './profilesPage';
export {
  CHILD_STRINGS,
  mountChildSurface,
  type ChildSurface,
  type ChildSurfaceOptions,
} from './childSurface';
export { SCHOOL_EVIDENCE, SCHOOL_STRINGS, schoolPage } from './school';
export { bullets, evidenceNote, section } from './prose';
export {
  ASSESSMENT_EVIDENCE,
  ASSESSMENT_STRINGS,
  GUIDANCE,
  THIRTEEN_PLUS_EVIDENCE,
  UNDER_SIX_EVIDENCE,
  type GuidanceEvidence,
  type GuidanceListing,
  THIRTEEN_PLUS_STRINGS,
  UNDER_SIX_STRINGS,
  assessmentPage,
  thirteenPlusPage,
  underSixPage,
} from './guidance';
