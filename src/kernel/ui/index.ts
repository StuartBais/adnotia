// The shared UI primitives. Modules do not build their own controls: a control
// built twice is a control that behaves differently in two places, and the
// accessibility rules only hold if there is one of each.
//
// See docs/07-design-system.md "Components".

export { el, field, fieldLabel, type Attributes, type Control } from './dom';
export { chips, chipsMulti, type ChipsMultiOptions, type ChipsOptions } from './chips';
export { scale5, type Scale5Options } from './scale';
export {
  numberInput,
  textInput,
  timeInput,
  type NumberInputOptions,
  type TextInputOptions,
  type TimeInputOptions,
} from './inputs';
export { detailRow, toggleDetail, type DetailRowOptions } from './detail';
export {
  card,
  linkRow,
  mirror,
  nag,
  type CardOptions,
  type LinkRowOptions,
  type MirrorObservation,
  type NagOptions,
} from './panels';
export { calendar, firstWeekday, type CalendarOptions } from './calendar';
export { timeList, tidy, type TimeListOptions } from './timeList';
export {
  parentGate,
  rewardChart,
  type ParentGateOptions,
  type RewardChartOptions,
} from './family';
export {
  chartNote,
  dayTimeline,
  severityGrid,
  stepChart,
  stepChartNeeds,
  type DayTimelineOptions,
  type GridOptions,
  type StepChartOptions,
  type StepColumn,
} from './charts';
