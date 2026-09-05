// The module's whole daily footprint: one question.
//
// docs/08-roadmap.md caps this at under ten seconds, and the reason is that a
// planning module which adds a nightly form has become the thing it was meant to
// help with.
//
// Nothing counts the answers. There is no run, no percentage of days followed,
// and no comparison between weeks: the value is in reading a day back beside
// what was planned for it, which is something the person does, not the app.

import type { TodayField } from '../../kernel/index';
import { HELD, TODAY_STRINGS } from './strings';

export const today: TodayField[] = [
  {
    id: 'held',
    label: TODAY_STRINGS.held,
    type: 'chips',
    options: HELD.map((option) => ({ v: option.v, l: option.l })),
    optional: true,
    cost: 8,
  },
];
