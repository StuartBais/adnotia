// "Cover across the day": the shared visual.
//
// One row per day on a 6pm-to-6pm clock, so a night's sleep and the next day's
// medication read left to right in the order they happened rather than being cut
// in half at midnight. That rotation is the whole point of the chart and
// reference/README.md lists it among the things not to reinvent.
//
// It belongs to the kernel because it reads from every module at once. Sleep
// draws its band, medication draws its cover, its dose ticks and its rebound
// dots, and neither has to know the other exists.
// See docs/decisions/ADR-013-shared-day-timeline.md.

import type { ReportSection } from '../../registry/types';
import { chartNote, dayTimeline } from '../../ui/index';
import type { ReportContext } from '../types';

const HEADING = 'Cover across the day';

/** Below this the rows are a list, not a shape, and the picture says nothing. */
const MIN_ROWS = 3;

export const timelineSection: ReportSection = {
  report: 'clinical',
  id: 'kernel.timeline',
  weight: 30,
  title: () => HEADING,

  when: (context) => (context as ReportContext).timeline.length >= MIN_ROWS,

  render: (context) => {
    const { timeline, timelineLegend } = context as ReportContext;
    const chart = dayTimeline({
      rows: timeline,
      title:
        'One row per day showing, where they were recorded, the sleep window, the hours ' +
        'the medication covered, dose times and rebound',
      legend: `Each row is one day, running from 6pm to 6pm. ${timelineLegend}`.trim(),
    });
    return chart === '' ? '' : `<h3>${HEADING}</h3>${chart}`;
  },

  renderText: (context) => {
    const { timeline, timelineLegend } = context as ReportContext;
    return [
      HEADING,
      '-'.repeat(HEADING.length),
      chartNote(HEADING.toLowerCase()),
      `${timeline.length} days drawn. Each row is one day, running from 6pm to 6pm. ${timelineLegend}`.trim(),
    ].join('\n');
  },
};
