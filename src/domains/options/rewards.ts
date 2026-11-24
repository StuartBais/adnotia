// Rewards are the person's choice (ADR-044, decision 1). Every option is off
// until they turn it on, for the whole app or for one day view, list or
// routine, and they can change it whenever they like.
//
// There is deliberately no option that resets, removes or reports a gap. The
// tally only goes up: the completion log has an append and no remove, so
// reopening a task does not take a point back.

export const REWARD_OPTIONS = ['doneList', 'tally', 'celebrate'] as const;
export type RewardOption = (typeof REWARD_OPTIONS)[number];
export type RewardOptions = Readonly<Record<RewardOption, boolean>>;

export type RewardScope =
  | { kind: 'default' }
  | { kind: 'day' }
  | { kind: 'list'; id: string }
  | { kind: 'routine'; id: string };

export interface RewardSettings {
  [key: string]: unknown;
  /** Applies everywhere a scope has not said otherwise. */
  default: Readonly<Partial<Record<RewardOption, boolean>>>;
  /** Keyed by `scopeKey`. An option not named here falls back to the default. */
  scopes: Readonly<Record<string, Readonly<Partial<Record<RewardOption, boolean>>>>>;
}

export interface Completion {
  at: string;
  /** The `scopeKey` the completion happened in, if any. */
  scope?: string;
}

export const ALL_OFF: RewardOptions = Object.freeze({
  doneList: false,
  tally: false,
  celebrate: false,
});

export const NO_REWARDS: RewardSettings = Object.freeze({ default: {}, scopes: {} });

export function scopeKey(scope: RewardScope): string {
  switch (scope.kind) {
    case 'default':
      return 'default';
    case 'day':
      return 'day';
    case 'list':
    case 'routine':
      if (scope.id === '') throw new RangeError(`A ${scope.kind} scope needs an id`);
      return `${scope.kind}:${scope.id}`;
  }
}

function checkOption(option: string): asserts option is RewardOption {
  if (!(REWARD_OPTIONS as readonly string[]).includes(option))
    throw new RangeError(`Unknown reward option: ${option}`);
}

/** Turns one option on or off for one scope, or for the default. */
export function setOption(
  settings: RewardSettings,
  scope: RewardScope,
  option: RewardOption,
  on: boolean,
): RewardSettings {
  checkOption(option);
  if (scope.kind === 'default')
    return { ...settings, default: { ...settings.default, [option]: on } };
  const key = scopeKey(scope);
  return {
    ...settings,
    scopes: { ...settings.scopes, [key]: { ...settings.scopes[key], [option]: on } },
  };
}

/** Removes a scope's own choices, so it follows the default again. */
export function clearScope(settings: RewardSettings, scope: RewardScope): RewardSettings {
  if (scope.kind === 'default') return { ...settings, default: {} };
  const key = scopeKey(scope);
  return {
    ...settings,
    scopes: Object.fromEntries(Object.entries(settings.scopes).filter(([k]) => k !== key)),
  };
}

/** What is switched on in this scope: its own choice, else the default, else off. */
export function resolve(settings: RewardSettings, scope: RewardScope): RewardOptions {
  const own = scope.kind === 'default' ? {} : (settings.scopes[scopeKey(scope)] ?? {});
  return Object.fromEntries(
    REWARD_OPTIONS.map((option) => [option, own[option] ?? settings.default[option] ?? false]),
  ) as RewardOptions;
}

/** Appends a completion. There is no function that removes one. */
export function addCompletion(
  log: readonly Completion[],
  at: Date,
  scope?: RewardScope,
): Completion[] {
  const entry: Completion =
    scope === undefined
      ? { at: at.toISOString() }
      : { at: at.toISOString(), scope: scopeKey(scope) };
  return [...log, entry];
}

/** How many completions, in one scope or in all of them. It only ever goes up. */
export function tally(log: readonly Completion[], scope?: RewardScope): number {
  if (scope === undefined) return log.length;
  const key = scopeKey(scope);
  return log.filter((entry) => entry.scope === key).length;
}
