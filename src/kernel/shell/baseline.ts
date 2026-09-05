// Before medication.
//
// The clinical report reads averages against these numbers — "focus 2.9/5,
// against a self-rated 2/5 before medication" — and until now nothing wrote
// them, so that comparison never appeared for anyone. This is the page that
// fills them in.
//
// It is kernel-owned because the data is: docs/06-data-model.md puts `baseline`
// under `kernel`, so any module's report may read it and none of them owns it.
//
// Recalled after the fact, and the page says so. A number remembered from before
// a change is a rough marker, not a measurement, and the report labels it
// self-rated wherever it appears.

import type { Baseline } from '../store/document';
import type { KernelStore } from '../store/store';
import { card, el, numberInput, scale5, textInput } from '../ui/index';
import type { OffTabPage } from './router';

export const BASELINE_STRINGS = {
  title: 'Before medication',
  sub:
    'A typical week from before you started, as you remember it. Fill it in once and leave ' +
    'it — every average in the report gets read against these numbers.',
  focus: 'Focus and follow-through',
  mood: 'Mood and irritability',
  sleep: 'Hours slept on a typical night',
  note: 'What a typical day looked like',
  notePlaceholder: 'Could not start anything without a deadline',
  saved: 'Saved.',
  caveat:
    'Recalled after the fact, so treat it as a rough marker rather than a measurement. The ' +
    'report labels it as self-rated wherever it appears.',
  clear: 'Clear this',
  cleared: 'Cleared. The report will stop comparing against it.',
} as const;

/**
 * End labels only, not the medication module's per-value anchors. The baseline
 * is kernel data and the kernel does not read a module's wording; the ends are
 * the same two words the monolith's baseline page used.
 */
const FOCUS_ANCHORS = ['', 'Scattered', '', '', '', 'Locked in'];
const MOOD_ANCHORS = ['', 'Short-fused, low', '', '', '', 'Steady'];

const EMPTY: Baseline = { focus: null, mood: null, sleep: '', note: '' };

export interface BaselineOptions {
  store: KernelStore;
  /** Called after a change, so whatever opened this can redraw. */
  onChanged?: () => void;
}

/** True when there is anything worth showing in a report. */
export function hasBaseline(baseline: Baseline | undefined): boolean {
  if (baseline === undefined) return false;
  return (
    typeof baseline.focus === 'number' ||
    typeof baseline.mood === 'number' ||
    (baseline.sleep ?? '') !== '' ||
    (baseline.note ?? '') !== ''
  );
}

/** A one-line summary for the row that opens this page. */
export function describeBaseline(baseline: Baseline | undefined): string {
  if (!hasBaseline(baseline)) return 'Not set';
  const parts: string[] = [];
  if (typeof baseline?.focus === 'number') parts.push(`focus ${baseline.focus}`);
  if (typeof baseline?.mood === 'number') parts.push(`mood ${baseline.mood}`);
  if ((baseline?.sleep ?? '') !== '') parts.push(`${baseline?.sleep}h`);
  return parts.join(' · ') || 'Set';
}

export function baselinePage(options: BaselineOptions): OffTabPage {
  const { store } = options;

  const read = (): Baseline => ({ ...EMPTY, ...store.document().kernel.baseline });

  function write(change: Partial<Baseline>, status: HTMLElement, message: string): void {
    store.updateKernel((kernel) => ({
      ...kernel,
      baseline: { ...EMPTY, ...kernel.baseline, ...change },
    }));
    status.textContent = message;
    options.onChanged?.();
  }

  return {
    id: 'baseline',
    title: BASELINE_STRINGS.title,
    render(container) {
      const current = read();
      const status = el('p', { class: 'saved', role: 'status' });

      const focus = scale5({
        label: BASELINE_STRINGS.focus,
        anchors: FOCUS_ANCHORS,
        value: current.focus,
        optional: true,
        onChange: (value) => write({ focus: value }, status, BASELINE_STRINGS.saved),
      });

      const mood = scale5({
        label: BASELINE_STRINGS.mood,
        anchors: MOOD_ANCHORS,
        value: current.mood,
        optional: true,
        onChange: (value) => write({ mood: value }, status, BASELINE_STRINGS.saved),
      });

      const sleep = numberInput({
        label: BASELINE_STRINGS.sleep,
        value: current.sleep,
        optional: true,
        onChange: (value) => write({ sleep: value }, status, BASELINE_STRINGS.saved),
      });

      const note = textInput({
        label: BASELINE_STRINGS.note,
        placeholder: BASELINE_STRINGS.notePlaceholder,
        value: current.note,
        optional: true,
        onChange: (value) => write({ note: value }, status, BASELINE_STRINGS.saved),
      });

      const clear = el('button', {
        type: 'button',
        class: 'btn small',
        text: BASELINE_STRINGS.clear,
      });
      clear.addEventListener('click', () => {
        store.updateKernel((kernel) => {
          const { baseline: _removed, ...rest } = kernel;
          return rest;
        });
        options.onChanged?.();
        // Redrawn so the controls come back empty rather than showing what was
        // just removed.
        this.render(container);
        (container.querySelector('.saved') as HTMLElement).textContent = BASELINE_STRINGS.cleared;
      });

      container.replaceChildren(
        card({
          sub: BASELINE_STRINGS.sub,
          children: [focus.element, mood.element, sleep.element, note.element, status],
        }),
        el('p', { class: 'hint', text: BASELINE_STRINGS.caveat }),
        el('div', { class: 'btnrow' }, [clear]),
      );
    },
  };
}
