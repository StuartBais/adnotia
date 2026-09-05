// The kernel's own report sections.
//
// The kernel contributes to a report where the material belongs to nobody's
// module: wins, misses and the day's note, which any report may read, and the
// shared day timeline, which reads from every module at once.

import type { ReportSection } from '../../registry/types';
import { lifeSection, notesSection } from './life';
import { timelineSection } from './timeline';

export { lifeLines, lifeSection, noteLines, notesSection, type LifeLine } from './life';
export { timelineSection } from './timeline';

export const KERNEL_SECTIONS: readonly ReportSection[] = [
  timelineSection,
  lifeSection,
  notesSection,
];
