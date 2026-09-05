export {
  createDocument,
  isDocumentShaped,
  DOCUMENT_KEY,
  SCHEMA_VERSION,
  type AdnotiaDocument,
  type Baseline,
  type ChildProfile,
  type FamilyState,
  type KernelDay,
  type KernelSettings,
  type KernelState,
  type ModuleSlice,
  type Question,
  type Space,
} from './document';
export {
  isLocalStorageAvailable,
  localStorageAdapter,
  memoryStorageAdapter,
  type StorageAdapter,
} from './adapters';
export { plainJsonCodec, type DocumentCodec } from './codec';
export { createStore, type CreateStoreOptions, type KernelStore, type Store } from './store';
