// The Today assembler.
//
// The shell owns one check-in for the day. Modules add fields to it; this
// collects them, groups by module in the person's chosen order, applies carry,
// and persists each value under modules.<id>.days[<date>].<fieldId>.
//
// Modules do not choose their own storage key for daily data, and fields never
// validate against each other across modules. See docs/05-architecture.md
// "Today assembler" and docs/01-module-contract.md.

import { loggingDay, type IsoDate } from '../dates/index';
import type { KernelStore } from '../store/store';
import type { ModuleManifest, TodayField } from '../registry/types';
import {
  card,
  chips,
  chipsMulti,
  detailRow,
  el,
  numberInput,
  scale5,
  textInput,
  timeInput,
  toggleDetail,
  type Control,
} from '../ui/index';
import { carriedValue } from './carry';
import { measure, type Budget } from './budget';

export { carriedValue, type CarriedValue } from './carry';
export { measure, type Budget } from './budget';

type DayRecord = Record<string, unknown>;
type Days = Record<IsoDate, DayRecord>;

export interface TodayOptions {
  store: KernelStore;
  /** Enabled modules, in the person's chosen order. */
  modules: readonly ModuleManifest[];
  date?: IsoDate;
  now?: () => Date;
  /** Called after any value is written, for the save confirmation. */
  onSaved?: () => void;
}

export interface TodayView {
  element: HTMLElement;
  date(): IsoDate;
  setDate(date: IsoDate): void;
  budget(): Budget;
  /** Hide optional fields, offered when the check-in runs long. */
  setHideOptional(hide: boolean): void;
}

function daysOf(store: KernelStore, moduleId: string): Days {
  const slice = store.get<{ days?: Days }>(moduleId);
  return (slice?.days ?? {}) as Days;
}

/** Build the control for one field, seeded from the day or from carry. */
function controlFor(
  field: TodayField,
  seed: unknown,
  onChange: (value: unknown) => void,
): Control<unknown> {
  switch (field.type) {
    case 'scale5':
      return scale5({
        label: field.label,
        anchors: field.anchors ?? [],
        value: typeof seed === 'number' ? seed : null,
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'chips':
      return chips({
        label: field.label,
        options: field.options ?? [],
        value: typeof seed === 'string' ? seed : '',
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'chipsMulti':
      return chipsMulti({
        label: field.label,
        options: field.options ?? [],
        value: Array.isArray(seed) ? (seed as string[]) : [],
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'time':
      return timeInput({
        label: field.label,
        value: typeof seed === 'string' ? seed : '',
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'number':
      return numberInput({
        label: field.label,
        value: seed === undefined || seed === null ? '' : String(seed),
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'toggle':
      return chips({
        label: field.label,
        options: [
          { v: 'yes', l: 'Yes' },
          { v: 'no', l: 'No' },
        ],
        value: typeof seed === 'string' ? seed : '',
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;

    case 'text':
      return textInput({
        label: field.label,
        value: typeof seed === 'string' ? seed : '',
        optional: field.optional ?? false,
        onChange,
      }) as unknown as Control<unknown>;
  }
}

export function mountToday(options: TodayOptions): TodayView {
  const { store, modules } = options;
  const now = options.now ?? (() => new Date());

  let date: IsoDate = options.date ?? loggingDay(now());
  let hideOptional = false;

  const root = el('div', { class: 'today' });

  /** Write one module's working values, and stamp the day as begun. */
  function persist(manifest: ModuleManifest, values: DayRecord): void {
    const slice = (store.get<Record<string, unknown>>(manifest.id) ?? {
      version: manifest.version,
    }) as Record<string, unknown>;
    const days = { ...((slice['days'] as Days) ?? {}) };
    days[date] = { ...(days[date] ?? {}), ...values };
    store.set(manifest.id, { ...slice, version: manifest.version, days });

    store.updateKernel((kernel) => {
      const existing = kernel.days[date];
      if (existing?.createdAt !== undefined) return kernel;
      return {
        ...kernel,
        days: {
          ...kernel.days,
          // Set on first save and never changed. The record-quality footer uses
          // it to tell a same-day entry from one filled in later.
          ...{ [date]: { ...(existing ?? {}), createdAt: now().toISOString() } },
        },
      };
    });
    options.onSaved?.();
  }

  function renderField(
    manifest: ModuleManifest,
    field: TodayField,
    values: DayRecord,
    into: HTMLElement,
  ): void {
    if (hideOptional && field.optional === true) return;

    const days = daysOf(store, manifest.id);
    const carried = carriedValue(field, date, days);
    if (carried !== undefined) values[field.id] = carried.value;

    // Follow-ups live in a detail block that is hidden until the parent has a
    // value. followUp is the only way a module may ask for detail.
    const detail = detailRow({ children: [] });
    toggleDetail(detail, false);

    const control = controlFor(field, carried?.value, (value) => {
      values[field.id] = value;
      persist(manifest, values);
      paintFollowUp(value);
    });

    function paintFollowUp(value: unknown): void {
      if (typeof field.followUp !== 'function') return;
      const more = field.followUp(value);
      const show = Array.isArray(more) && more.length > 0;
      detail.replaceChildren();
      if (show) {
        for (const child of more) renderField(manifest, child, values, detail);
      }
      toggleDetail(detail, show);
    }

    into.append(control.element);
    if (typeof field.followUp === 'function') {
      into.append(detail);
      paintFollowUp(carried?.value);
    }

    if (carried?.from !== undefined && carried.from !== date) {
      const note = el('p', {
        class: 'hint',
        text: carried.backwards === true
          ? `Carried back from ${carried.from}, because there is nothing earlier.`
          : `Carried from ${carried.from}.`,
      });
      into.append(note);
    }
  }

  function paint(): void {
    root.replaceChildren();

    for (const manifest of modules) {
      const fields = manifest.contributes.today ?? [];
      if (fields.length === 0) continue;

      const body = el('div', {});
      const values: DayRecord = { ...(daysOf(store, manifest.id)[date] ?? {}) };
      for (const field of fields) renderField(manifest, field, values, body);

      root.append(card({ title: manifest.name, children: [body] }));
    }

    if (modules.length === 0) {
      root.append(
        card({
          title: 'Nothing to fill in',
          sub: 'When you turn a tool on, its questions appear here as one short check-in.',
        }),
      );
    }
  }

  paint();

  return {
    element: root,
    date: () => date,
    setDate(next) {
      date = next;
      paint();
    },
    budget: () => measure(modules),
    setHideOptional(hide) {
      hideOptional = hide;
      paint();
    },
  };
}
