// The keyboard (design/lantern/PROTOTYPE-PLAN.md section 13, "The keyboard";
// SPEC 3 and 5.5).
//
// The capture sheet rides the keyboard: its row sits on the keys, and the
// frame (the dock line, the drawer and the tabs) stays where it is, behind
// them. On iOS the layout viewport does not shrink when the keyboard rises;
// only the visual viewport does. So the frame, fixed to the layout viewport,
// already stays put, and the sheet is lifted by `--kb`: how much of the
// layout viewport the keyboard covers, worked out from `visualViewport`.
//
// The page must never pan. iOS pans the visual viewport when it focuses a
// field the keyboard would cover, so the sheet is raised to where the
// keyboard will be before its field is focused: a guess, the keyboard's last
// measured height or a share of the screen, held until the keyboard is
// measured. Where there is no visual viewport (an old browser, jsdom), the
// guess stands and nothing else happens.
//
// The keyboard can go while the sheet stays: Safari's Done above the keys,
// or a tap off the field. The sheet stays where the keyboard was, so a tap
// on the field brings the keyboard back up under it rather than over it,
// and nothing moves under the finger in between. It drops only when the
// sheet goes.

/** What this needs of `window.visualViewport`. */
export interface ViewportLike {
  height: number;
  offsetTop: number;
  scale?: number;
  addEventListener(type: 'resize' | 'scroll', listener: () => void): void;
  removeEventListener(type: 'resize' | 'scroll', listener: () => void): void;
}

/**
 * Before any keyboard has been measured: about the share of the screen an
 * iPhone's keyboard takes with its suggestion bar (0.40 on a 6.1 in phone,
 * 0.41 on a mini, 0.39 on an SE). It need not be exact: iOS pans only to
 * show the field, which sits 108 pt above the sheet's foot, so a guess that
 * short of the keyboard still leaves it in view. Too high would lift the
 * sheet over what is lit above it, for the moment before the keyboard lands.
 */
export const KEYBOARD_GUESS = 0.4;

/**
 * How much of the layout viewport the keyboard covers, in CSS px: the layout
 * viewport's height less the visual viewport's bottom edge in it. Pinch zoom
 * also shrinks the visual viewport, so while zoomed this says nothing (null),
 * and the last value stands. Under a pixel is rounding, not a keyboard.
 */
export function keyboardInset(
  layoutHeight: number,
  viewport: Pick<ViewportLike, 'height' | 'offsetTop' | 'scale'> | undefined,
): number | null {
  if (!viewport) return 0;
  if (viewport.scale !== undefined && Math.abs(viewport.scale - 1) > 0.01) return null;
  const inset = layoutHeight - (viewport.height + viewport.offsetTop);
  return inset >= 1 ? Math.round(inset) : 0;
}

export interface KeyboardOptions {
  /** Where `--kb` is set. The root, so a stylesheet's `:root` rule can stand in for it. */
  root: HTMLElement;
  viewport?: ViewportLike | undefined;
  /** The layout viewport's height: the frame's own, so it is what the sheet is placed in. */
  layoutHeight: () => number;
  /** After `--kb` changes, with its value. */
  onChange?: (inset: number) => void;
}

export interface Keyboard {
  /**
   * A sheet with a field is about to take the keyboard: lift it to where the
   * keyboard will be, and keep it there until the keyboard is measured. Until
   * `release()`, a keyboard that goes leaves the sheet where it was.
   */
  expect(): void;
  /** The sheet has gone: `--kb` follows the keyboard alone again. */
  release(): void;
  /** What `--kb` is now. */
  inset(): number;
  destroy(): void;
}

export function trackKeyboard(options: KeyboardOptions): Keyboard {
  const { root, viewport } = options;
  /** The keyboard as last measured, while it was up. */
  let seen = 0;
  /** A sheet with a field is open: between `expect()` and `release()`. */
  let lifted = false;
  let current = -1;

  const set = (value: number) => {
    if (value === current) return;
    current = value;
    if (value > 0) root.style.setProperty('--kb', `${value}px`);
    else root.style.removeProperty('--kb');
    options.onChange?.(value);
  };

  const measured = (): number | null => keyboardInset(options.layoutHeight(), viewport);

  /** Where an open sheet waits with no keyboard under it: where the keyboard was, or will be. */
  const held = (): number =>
    seen > 0 ? seen : Math.round(options.layoutHeight() * KEYBOARD_GUESS);

  const update = () => {
    const inset = measured();
    if (inset === null) return;
    if (inset > 0) {
      seen = inset;
      set(inset);
    } else {
      set(lifted ? held() : 0);
    }
  };

  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);

  return {
    expect() {
      lifted = true;
      const now = measured();
      set(now !== null && now > 0 ? now : held());
    },
    release() {
      lifted = false;
      const now = measured();
      set(now ?? 0);
    },
    inset: () => Math.max(0, current),
    destroy() {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      root.style.removeProperty('--kb');
      current = -1;
      lifted = false;
    },
  };
}
