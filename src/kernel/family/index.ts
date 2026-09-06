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
