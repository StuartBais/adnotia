import { afterEach, describe, expect, it } from 'vitest';
import { ICONS } from '../../src/bench/icons';
import {
  bar,
  dottedNodes,
  durationTrack,
  icon,
  injectSprite,
  patchBar,
  trackLength,
} from '../../src/bench/ui';

// The prototype's small pieces (design/lantern/SPEC.md section 9): the icon
// set lifted from the board, the bar in each of its states, and duration
// tracks.

afterEach(() => {
  document.body.replaceChildren();
});

describe('the icon set', () => {
  it('is the board’s i-* set, the line and filled tab glyphs included, and no mark', () => {
    expect(ICONS).toEqual([
      'check',
      'check-s',
      'plus',
      'pause',
      'play',
      'back',
      'right',
      'down',
      'up',
      'note',
      'cal',
      'more',
      'ring',
      'today',
      'tasks',
      'routines',
      'library',
      'today-f',
      'tasks-f',
      'routines-f',
      'library-f',
    ]);
  });

  it('is put in the page once, hidden, with a symbol for every name', () => {
    const root = document.createElement('div');
    document.body.append(root);
    injectSprite(root);
    injectSprite(root);
    const sprites = root.querySelectorAll('svg.sprite');
    expect(sprites).toHaveLength(1);
    expect(sprites[0]?.getAttribute('aria-hidden')).toBe('true');
    for (const name of ICONS) expect(root.querySelector(`symbol#i-${name}`)).not.toBeNull();
    expect(root.querySelector('#app-mark')).toBeNull();
  });

  it('draws an icon as a hidden use of its symbol, at its size', () => {
    const glyph = icon('pause', 20);
    expect(glyph.namespaceURI).toContain('svg');
    expect(glyph.getAttribute('class')).toBe('i i20');
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(glyph.querySelector('use')?.getAttribute('href')).toBe('#i-pause');
  });
});

describe('the bar (SPEC 9.2)', () => {
  it('burns down from the leading edge, its fill a share of the estimate', () => {
    const node = bar('today', { state: 'burn', p: 0.72, frozen: false });
    expect(node.className).toBe('bar bar-today is-burn');
    expect(node.style.getPropertyValue('--p')).toBe('0.72');
    expect(node.getAttribute('aria-hidden')).toBe('true');
    expect([...node.children].map((child) => child.className)).toEqual(['fill', 'end']);
  });

  it('changes state in place, without a new node', () => {
    const node = bar('capsule', { state: 'burn', p: 0.72, frozen: false });
    const fill = node.firstElementChild;
    patchBar(node, 'capsule', { state: 'paused', p: 0.72, frozen: true });
    expect(node.className).toBe('bar bar-capsule is-paused is-frozen');
    patchBar(node, 'capsule', { state: 'over', p: 0, frozen: false });
    expect(node.className).toBe('bar bar-capsule is-over');
    patchBar(node, 'capsule', { state: 'countUp', p: 7 / 60, frozen: false });
    expect(node.className).toBe('bar bar-capsule is-countUp');
    expect(node.style.getPropertyValue('--p')).toBe('0.1167');
    expect(node.firstElementChild).toBe(fill);
  });
});

describe('duration tracks (SPEC 9.2)', () => {
  it('are 1.5 pt a minute, and stop at 90', () => {
    expect([10, 15, 20, 30, 60, 90].map(trackLength)).toEqual([15, 22.5, 30, 45, 90, 90]);
  });

  it('follow the number, and sit in the list’s slot so the numbers end on one line', () => {
    const node = durationTrack(10, '10 min', 30);
    expect(node.textContent).toBe('10 min');
    const track = node.querySelector<HTMLElement>('.m')!;
    expect(track.getAttribute('aria-hidden')).toBe('true');
    expect(track.style.width).toBe('15px');
    expect(track.style.marginRight).toBe('15px');
    expect(durationTrack(15, '15 min').querySelector<HTMLElement>('.m')?.style.marginRight).toBe(
      '',
    );
  });
});

describe('the separator', () => {
  it('draws "·" between the parts, hidden from screen readers', () => {
    const holder = document.createElement('span');
    holder.append(...dottedNodes('of 25 · ends 10:23'));
    expect(holder.textContent).toBe('of 25 · ends 10:23');
    expect(holder.querySelector('.sep')?.getAttribute('aria-hidden')).toBe('true');
  });
});
