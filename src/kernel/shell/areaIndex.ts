// The index a person lands on, and the pages under it.
//
// Milestone 9. The Tools tab used to mount every tool from every enabled module,
// fully expanded, in one scroll — nine of them for an adult with everything on,
// in registration order, with no way to see what was there without scrolling
// past all of it. That is an accumulation rather than a chooser, and it is why
// the tools were hard to find.
//
// So the tab becomes an index: one card per area, each opening a page that lists
// what is in it, each of those opening one tool. Two taps to anything, and the
// whole map visible without scrolling.
//
// An area holds more than tools. Medication and sleep contribute none at all —
// they are a daily log and a report — so an area page lists whatever its modules
// actually offer: tools, the day's log where the area asks questions, and any
// named report the area produces. Without that, "Medication and body" would be
// an empty room.
//
// This deliberately does not share code with src/kernel/family/childSurface.ts,
// which mounts its tools inline and must keep doing so: the child surface is four
// cards a child uses directly, not an index to navigate, and its integration test
// requires the timer to actually read 5:00 on arrival.

import { areaBlurb, areaName, areasIn, type Area } from '../areas/index';
import { REPORTS, mountReport } from '../reports/index';
import { audienceInSpace, type ModuleManifest, type Tool } from '../registry/types';
import { tierWording } from '../library/index';
import { loggingDay } from '../dates/index';
import { getProfile } from '../family/index';
import type { KernelStore } from '../store/store';
import type { Space } from '../store/document';
import { card, el, linkRow } from '../ui/index';
import type { OffTabPage } from './router';

export const AREA_STRINGS = {
  title: 'Tools',
  sub: 'What you can do, grouped by the sort of thing it is.',
  empty: {
    title: 'Nothing turned on yet',
    sub: 'Settings is at the top of the screen. Turning a tool on puts it here.',
  },
  nothingHere: 'Nothing in here yet.',
  turnOn: 'Turning something on in Settings puts it here.',
  open: 'Open',
  todayRow: 'Today’s log',
  todayValue: 'Fill in',
  recordsRow: 'What you have recorded',
  recordsValue: 'Look back',
  count: (n: number): string => (n === 1 ? '1 thing' : `${n} things`),
} as const;

/** What a tool is handed. Built per mount so a tool always reads a live slice. */
function contextFor(
  manifest: ModuleManifest,
  store: KernelStore,
  nickname: string | undefined,
  refresh: () => void,
): unknown {
  return {
    // A live read, not a value captured at mount: a tool that saves twice
    // without being redrawn must see its own first save, or the second write is
    // built on a stale copy and silently discards it.
    get slice() {
      return store.get(manifest.id);
    },
    get reads() {
      return Object.fromEntries((manifest.dependencies ?? []).map((id) => [id, store.get(id)]));
    },
    save: (next: unknown) => store.set(manifest.id, next),
    today: loggingDay(),
    ...(nickname === undefined ? {} : { nickname }),
    refresh,
  };
}

export interface AreaOptions {
  space: Space;
  enabled: readonly ModuleManifest[];
  store: KernelStore;
  openPage: (page: OffTabPage) => void;
  refresh: () => void;
  /** Leaves the index for the day's log. */
  goToday?: () => void;
  /** Leaves the index for the history and the report. */
  goRecords?: () => void;
}

/** The modules of one area that this space would actually draw. */
function modulesIn(area: Area, options: AreaOptions): ModuleManifest[] {
  return options.enabled.filter(
    (manifest) =>
      manifest.area === area && audienceInSpace(manifest.audience, options.space) === true,
  );
}

/** One tool, on its own page. */
export function toolPage(
  tool: Tool,
  manifest: ModuleManifest,
  options: AreaOptions,
  nickname: string | undefined,
): OffTabPage {
  return {
    id: `tool-${manifest.id}-${tool.icon}`,
    title: tool.title,
    render(container) {
      const body = el('div', {});
      tool.mount(body, contextFor(manifest, options.store, nickname, options.refresh));
      // A tool carrying a lower tier than its module says so where the person is
      // about to use it, in the rubric's own wording. ADR-025.
      container.replaceChildren(
        tool.tier === undefined
          ? card({ children: [body] })
          : card({
              children: [
                el('p', { class: 'tier', text: tierWording(tool.tier, options.space) }),
                body,
              ],
            }),
      );
    },
  };
}

/** Everything one area offers, as rows. */
function rowsFor(area: Area, options: AreaOptions, nickname: string | undefined): HTMLElement[] {
  const rows: HTMLElement[] = [];
  const modules = modulesIn(area, options);

  for (const manifest of modules) {
    for (const tool of manifest.contributes.tools ?? []) {
      rows.push(
        linkRow({
          label: tool.title,
          value: AREA_STRINGS.open,
          onSelect: () => options.openPage(toolPage(tool, manifest, options, nickname)),
        }),
      );
    }
  }

  // An area whose modules ask a daily question owns part of the day's log, and
  // this is the way back to it. Without it "Medication and body" is a heading
  // over nothing, because neither of its modules contributes a tool.
  if (
    options.goToday !== undefined &&
    modules.some((manifest) => (manifest.contributes.today ?? []).length > 0)
  ) {
    rows.push(
      linkRow({
        label: AREA_STRINGS.todayRow,
        value: AREA_STRINGS.todayValue,
        onSelect: () => options.goToday?.(),
      }),
    );
  }

  // The area's own history and, where it has one, the document a person takes to
  // an appointment. Only for areas that reach the clinical report: every module
  // contributes `records`, so keying off that would put this row in every area
  // and it would stop meaning anything.
  if (
    options.goRecords !== undefined &&
    modules.some((manifest) =>
      (manifest.contributes.reports ?? []).some((entry) => entry.report === 'clinical'),
    )
  ) {
    rows.push(
      linkRow({
        label: AREA_STRINGS.recordsRow,
        value: AREA_STRINGS.recordsValue,
        onSelect: () => options.goRecords?.(),
      }),
    );
  }

  // A named report other than the clinical one lives on its own page: print.css
  // shows every .sheet, so two on one screen would print as one document.
  for (const [name, definition] of Object.entries(REPORTS)) {
    if (name === 'clinical' || definition.audience !== options.space) continue;
    const from = modules.filter((manifest) =>
      (manifest.contributes.reports ?? []).some((entry) => entry.report === name),
    );
    if (from.length === 0) continue;
    rows.push(
      linkRow({
        label: definition.title,
        value: AREA_STRINGS.open,
        onSelect: () =>
          options.openPage({
            id: `report-${name}`,
            title: definition.title,
            render: (host) => {
              host.replaceChildren(
                mountReport({ store: options.store, modules: options.enabled, report: name })
                  .element,
              );
            },
          }),
      }),
    );
  }

  return rows;
}

/** One area, on its own page. */
export function areaPage(
  area: Area,
  options: AreaOptions,
  nickname: string | undefined,
): OffTabPage {
  return {
    id: `area-${area}`,
    title: areaName(area),
    render(container) {
      const rows = rowsFor(area, options, nickname);
      container.replaceChildren(
        card({ sub: areaBlurb(area) }),
        ...(rows.length > 0
          ? rows
          : [card({ title: AREA_STRINGS.nothingHere, sub: AREA_STRINGS.turnOn })]),
      );
    },
  };
}

/**
 * The index itself: one card per area of this space, in the fixed order the
 * kernel sets. Areas with nothing enabled in them are still shown, greyed, with
 * the count reading nothing — a person choosing what to turn on needs to see
 * that the room exists.
 */
export function renderAreaIndex(options: AreaOptions): HTMLElement {
  const nickname = getProfile(options.store.document(), options.store.profile())?.nickname;
  const root = el('div', { class: 'areas' });

  for (const area of areasIn(options.space)) {
    const count = rowsFor(area, options, nickname).length;
    const open = el('button', {
      type: 'button',
      class: count === 0 ? 'area-card empty' : 'area-card',
      ...(count === 0 ? { 'aria-disabled': 'true' } : {}),
    });
    open.append(
      el('span', { class: 'area-name', text: areaName(area) }),
      el('span', { class: 'area-blurb', text: areaBlurb(area) }),
      el('span', {
        class: 'area-count',
        text: count === 0 ? AREA_STRINGS.turnOn : AREA_STRINGS.count(count),
      }),
    );
    if (count > 0) {
      open.addEventListener('click', () => options.openPage(areaPage(area, options, nickname)));
    }
    root.append(open);
  }

  return root;
}
