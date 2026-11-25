// The Now capsule (design/lantern/SPEC.md section 4): the lit step at its
// smallest, in the lantern's order. Line 1 is Now (or Paused) and the step;
// then the bar; then line 2, the minutes and, only where it fits whole, the
// task's name.
//
// Whether the name fits is left to the browser (plan section 4): line 2 is one
// fixed-height row that wraps, and the name is one unbreakable item, so when
// it does not fit it wraps out of sight whole. It follows the font, the width
// and the text size without any measuring here.

import { T, capsuleLabel } from './strings';
import { bar, h, patchBar, sep } from './ui';
import type { PresentLive, PresentView } from './view';

export interface CapsuleProps {
  view: PresentView;
  live: PresentLive;
  /** Lifted on a charcoal place; plain charcoal on white, and on the stone drawer. */
  look: 'lifted' | 'plain';
  /** A button, or a picture riding a sheet's edge that cannot be tapped. */
  mode: 'button' | 'picture';
  /** The id of the element holding "Opens focus.", for the button's description. */
  hintId?: string;
  onOpen?: () => void;
}

export interface Capsule {
  el: HTMLElement;
  /** Brings the minutes, the bar and the spoken label up to `live`, in place. */
  patch(live: PresentLive): void;
}

/** Whether line 2 offers the task's name at all (SPEC 4's state table). */
export function offersName(view: PresentView, live: PresentLive): boolean {
  // A task with no steps already has its title on line 1.
  if (view.position === undefined && view.steps.current === undefined) return false;
  // Paused with the estimate used up: "estimate 25" stands alone.
  if (view.kind === 'paused' && live.facts.usedUp) return false;
  return true;
}

export function capsule(props: CapsuleProps): Capsule {
  const { view, live, look, mode } = props;
  const paused = view.kind === 'paused';
  const minutes = h('b', { class: live.words.tone === 'still' ? 'still' : undefined });
  minutes.textContent = live.words.main;
  const theBar = bar('capsule', live.bar);

  const line2 = h('span', { class: 'c2' }, minutes);
  if (offersName(view, live)) {
    line2.append(h('span', { class: 'tn' }, sep(), h('span', { text: view.task.title })));
  }

  const attrs: Record<string, unknown> = {
    class: look === 'lifted' ? 'capsule lift' : 'capsule',
    'data-geo': 'capsule',
  };
  if (mode === 'button') {
    attrs['type'] = 'button';
    attrs['id'] = 'b-capsule';
    attrs['aria-label'] = capsuleLabel(live.spoken);
    if (props.hintId) attrs['aria-describedby'] = props.hintId;
    if (props.onOpen) attrs['onclick'] = props.onOpen;
  } else {
    attrs['aria-hidden'] = 'true';
    attrs['inert'] = true;
    attrs['tabindex'] = '-1';
    attrs['data-picture'] = true;
  }

  const el = h(
    mode === 'button' ? 'button' : 'div',
    attrs,
    h(
      'span',
      { class: 'c1', 'aria-hidden': 'true' },
      paused
        ? h('span', { class: 'ptag', text: T.paused })
        : h('span', { class: 'nowtag', text: T.now }),
      h('span', { class: 'cstep', text: view.step }),
    ),
    theBar,
    line2,
  );
  // The visible lines are read through the button's own label.
  line2.setAttribute('aria-hidden', 'true');

  return {
    el,
    patch(next) {
      patchBar(theBar, 'capsule', next.bar);
      if (minutes.textContent !== next.words.main) minutes.textContent = next.words.main;
      minutes.className = next.words.tone === 'still' ? 'still' : '';
      if (mode === 'button') {
        const label = capsuleLabel(next.spoken);
        if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
      }
    },
  };
}
