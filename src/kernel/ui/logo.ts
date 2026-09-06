// The mark.
//
// docs/07-design-system.md: "The logo mark is the only graphic. It is an inline
// SVG in the masthead (34 × 31 px) and the lock screen (44 × 40 px), and a 180 px
// PNG for the home screen icon. `assets/logo.svg` is canonical; do not embed the
// original raster."
//
// Inline, and not an <img>, for one reason that matters: the single-file build
// has to work with no network and no files beside it, so anything referenced by
// URL is a broken image the moment somebody saves adnotia.html to a USB stick.
// Importing the canonical file with `?raw` keeps one copy of the artwork in the
// repository and puts it in both builds.
//
// It is decorative. The word "Adnotia" is always next to it, so announcing the
// mark as well would make a screen reader say the name twice.

import source from '../../../assets/logo.svg?raw';

/** The two clip paths in the file. Two marks on one page would collide. */
const SCOPED = ['g', 't'];

let counter = 0;

let template: SVGSVGElement | undefined;

function parse(): SVGSVGElement {
  if (template === undefined) {
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = parsed.documentElement;
    if (root.nodeName !== 'svg') {
      throw new Error('assets/logo.svg did not parse as an SVG.');
    }
    template = root as unknown as SVGSVGElement;
  }
  return template;
}

export interface BrandOptions {
  /**
   * The lock screen's larger pairing. Absent is the masthead's. The size lives
   * on the wrapper — `.brand .logo` is 34 × 31, `.brand.big .logo` is 44 × 40 —
   * so a caller cannot end up with a 44px mark beside a masthead-sized name.
   */
  big?: boolean;
  /** `h1` unless the page already has one. */
  tag?: 'h1' | 'div';
}

/**
 * A fresh copy of the mark, safe to put on a page that already has one.
 *
 * The ids inside the file are rewritten per copy. SVG ids are document-global,
 * so two marks sharing `clipPath id="g"` would both clip to whichever the
 * browser resolved first, and half the mark would take the wrong colour.
 */
export function logoMark(): SVGSVGElement {
  const mark = parse().cloneNode(true) as SVGSVGElement;
  const suffix = `-${(counter += 1)}`;

  for (const id of SCOPED) {
    for (const node of mark.querySelectorAll(`[id="${id}"]`)) {
      node.setAttribute('id', id + suffix);
    }
    for (const node of mark.querySelectorAll(`[clip-path="url(#${id})"]`)) {
      node.setAttribute('clip-path', `url(#${id}${suffix})`);
    }
  }

  mark.setAttribute('class', 'logo');
  // Decorative: the name is beside it. focusable="false" is for IE-era engines
  // that put SVGs in the tab order, and costs nothing to keep.
  mark.setAttribute('aria-hidden', 'true');
  mark.setAttribute('focusable', 'false');
  return mark;
}

/**
 * The mark and the name together: `<div class="brand">`, which the stylesheet
 * has sized since the design system was written and nothing had been rendering.
 */
export function brand(options: BrandOptions = {}): HTMLElement {
  const wordmark = document.createElement(options.tag ?? 'h1');
  wordmark.textContent = 'Adnotia';
  const root = document.createElement('div');
  root.className = options.big === true ? 'brand big' : 'brand';
  root.append(logoMark(), wordmark);
  return root;
}
