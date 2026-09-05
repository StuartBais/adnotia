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
import type { KernelDay } from '../store/document';
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
  timeList,
  toggleDetail,
  type Control,
} from '../ui/index';
import { carriedValue, readPath, writePath } from './carry';
import { measure, type Budget } from './budget';
import { KERNEL_TODAY } from './kernelFields';

export { carriedValue, readPath, writePath, type CarriedValue } from './carry';
export { BUDGET_STRINGS, measure, type Budget, type MeasureOptions } from './budget';
export { KERNEL_TODAY, kernelTodayCost, type KernelTodayGroup } from './kernelFields';
export {
  KERNEL_RECORDS_TITLE,
  renderKernelRecords,
  type KernelRecordsContext,
} from './kernelRecords';

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

/**
 * One card in the check-in. Almost always a module, but the kernel has fields of
 * its own — wins, misses and the day's note — that no module owns, and they are
 * filled in the same way and by the same code. See ./kernelFields.ts.
 */
interface Group {
  id: string;
  name: string;
  sub?: string;
  fields: readonly TodayField[];
  /** Every day this group has, so carry can look backwards. */
  read: () => Days;
  write: (date: IsoDate, values: DayRecord, changedFieldId: string) => DayRecord;
  controls: Map<string, Control<unknown>>;
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

    case 'timeList':
      return timeList({
        label: field.label,
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

  /**
   * Set on first save and never changed. The record-quality footer uses it to
   * tell a same-day entry from one filled in later, so a later edit must not
   * move it.
   */
  function stampCreatedAt(): void {
    store.updateKernel((kernel) => {
      const existing = kernel.days[date];
      if (existing?.createdAt !== undefined) return kernel;
      return {
        ...kernel,
        days: {
          ...kernel.days,
          ...{
            [date]: { ...(existing ?? {}), createdAt: now().toISOString() },
          },
        },
      };
    });
  }

  /** Write one module's working values, and stamp the day as begun. */
  function persist(manifest: ModuleManifest, values: DayRecord, changedFieldId: string): DayRecord {
    const slice = (store.get<Record<string, unknown>>(manifest.id) ?? {
      version: manifest.version,
    }) as Record<string, unknown>;
    const days = { ...((slice['days'] as Days) ?? {}) };

    // A dotted field id is a path: docs/06-data-model.md nests side-effect
    // detail rather than flattening it.
    const record: DayRecord = structuredClone(days[date] ?? {});
    for (const [fieldId, value] of Object.entries(values)) writePath(record, fieldId, value);
    const updates: DayRecord = {};
    if (typeof manifest.derive === 'function') {
      const stored = record['_derived'];
      const automatic: DayRecord =
        typeof stored === 'object' && stored !== null && !Array.isArray(stored)
          ? { ...(stored as DayRecord) }
          : {};
      delete automatic[changedFieldId];
      const derived = manifest.derive(record);
      for (const fieldId of new Set([...Object.keys(automatic), ...Object.keys(derived)])) {
        if (fieldId === '_derived') continue;
        const current = readPath(record, fieldId);
        const wasAutomatic =
          Object.hasOwn(automatic, fieldId) &&
          JSON.stringify(automatic[fieldId]) === JSON.stringify(current);
        if (current !== undefined && current !== '' && current !== null && !wasAutomatic) {
          delete automatic[fieldId];
          continue;
        }
        const computed = derived[fieldId];
        if (computed === undefined && !wasAutomatic) continue;
        const next = computed ?? '';
        writePath(record, fieldId, next);
        values[fieldId] = next;
        updates[fieldId] = next;
        if (computed === undefined) delete automatic[fieldId];
        else automatic[fieldId] = computed;
      }
      if (Object.keys(automatic).length > 0) {
        record['_derived'] = automatic;
        values['_derived'] = automatic;
      } else {
        delete record['_derived'];
        delete values['_derived'];
      }
    }
    days[date] = record;
    store.set(manifest.id, { ...slice, version: manifest.version, days });

    stampCreatedAt();
    options.onSaved?.();
    return updates;
  }

  /** The kernel's own fields go to kernel.days, not to any module slice. */
  function persistKernel(values: DayRecord): DayRecord {
    store.updateKernel((kernel) => {
      const record: DayRecord = structuredClone(kernel.days[date] ?? {});
      for (const [fieldId, value] of Object.entries(values)) writePath(record, fieldId, value);
      if (record['createdAt'] === undefined) record['createdAt'] = now().toISOString();
      return {
        ...kernel,
        days: { ...kernel.days, [date]: record as KernelDay },
      };
    });
    options.onSaved?.();
    return {};
  }

  function groups(): Group[] {
    const list: Group[] = modules
      .filter((manifest) => (manifest.contributes.today ?? []).length > 0)
      .map((manifest) => ({
        id: manifest.id,
        name: manifest.name,
        fields: manifest.contributes.today ?? [],
        read: () => daysOf(store, manifest.id),
        write: (_date, values, changedFieldId) => persist(manifest, values, changedFieldId),
        controls: new Map(),
      }));

    // Last: a person reflects on the day after recording it, and these are the
    // only fields that ask them to write a sentence.
    if (list.length > 0) {
      for (const group of KERNEL_TODAY) {
        list.push({
          id: group.id,
          name: group.name,
          sub: group.sub,
          fields: group.fields,
          read: () => store.document().kernel.days as Days,
          write: (_date, values) => persistKernel(values),
          controls: new Map(),
        });
      }
    }
    return list;
  }

  function renderField(
    group: Group,
    field: TodayField,
    values: DayRecord,
    into: HTMLElement,
  ): void {
    if (hideOptional && field.optional === true) return;

    const days = group.read();
    const carried = carriedValue(field, date, days);
    if (carried !== undefined) values[field.id] = carried.value;

    // Follow-ups live in a detail block that is hidden until the parent has a
    // value. followUp is the only way a module may ask for detail.
    const detail = detailRow({ children: [] });
    toggleDetail(detail, false);

    const control = controlFor(field, carried?.value, (value) => {
      values[field.id] = value;
      const updates = group.write(date, values, field.id);
      for (const [fieldId, computed] of Object.entries(updates)) {
        group.controls.get(fieldId)?.set(computed);
      }
      paintFollowUp(value);
    });
    group.controls.set(field.id, control);

    function paintFollowUp(value: unknown): void {
      if (typeof field.followUp !== 'function') return;
      const more = field.followUp(value);
      const show = Array.isArray(more) && more.length > 0;
      detail.replaceChildren();
      if (show) {
        for (const child of more) renderField(group, child, values, detail);
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
        text:
          carried.backwards === true
            ? `Carried back from ${carried.from}, because there is nothing earlier.`
            : `Carried from ${carried.from}.`,
      });
      into.append(note);
    }
  }

  function paint(): void {
    root.replaceChildren();

    for (const group of groups()) {
      const body = el('div', {});
      // A deep copy: the store hands back frozen objects, and a shallow spread
      // would leave the nested ones frozen for writePath to fail on.
      const values: DayRecord = structuredClone(group.read()[date] ?? {}) as DayRecord;
      for (const field of group.fields) renderField(group, field, values, body);

      root.append(
        card({
          title: group.name,
          children: [body],
          ...(group.sub === undefined ? {} : { sub: group.sub }),
        }),
      );
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
    budget: () => measure(modules, { includeKernel: true }),
    setHideOptional(hide) {
      hideOptional = hide;
      paint();
    },
  };
}
