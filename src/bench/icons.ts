// The board's icon set, lifted as drawn (design/lantern/board.html, the
// <symbol> elements named i-*; SPEC 9.12). One hand-drawn set on a 24 grid:
// 1.75 stroke with round caps and joins, 2.25 for the check and plus at large
// sizes. The app's mark and the board's system glyphs are left out: the mark is
// never drawn inside the app, and the phone draws its own status bar.
//
// It is injected once, hidden, and every icon is a <use> of it. Strokes are
// non-scaling, so a 20 pt chevron and a 24 pt one carry the same weight.

export const ICONS = [
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
] as const;

export type IconName = (typeof ICONS)[number];

export const SPRITE =
  '<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
  '<symbol id="i-check" viewBox="0 0 24 24"><path d="M5.5 12.5l4.25 4.25L18.5 8" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-check-s" viewBox="0 0 24 24"><path d="M5.5 12.5l4.25 4.25L18.5 8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-pause" viewBox="0 0 24 24"><rect x="6.5" y="5" width="3.75" height="14" rx="1.4" fill="currentColor" /><rect x="13.75" y="5" width="3.75" height="14" rx="1.4" fill="currentColor" /></symbol><symbol id="i-play" viewBox="0 0 24 24"><path d="M8 6.2v11.6a1 1 0 0 0 1.53.85l9.2-5.8a1 1 0 0 0 0-1.7l-9.2-5.8A1 1 0 0 0 8 6.2z" fill="currentColor" /></symbol><symbol id="i-back" viewBox="0 0 24 24"><path d="M14.5 5.75L8.25 12l6.25 6.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-right" viewBox="0 0 24 24"><path d="M9.5 5.75L15.75 12 9.5 18.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-down" viewBox="0 0 24 24"><path d="M5.75 9.25L12 15.5l6.25-6.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-up" viewBox="0 0 24 24"><path d="M5.75 14.75L12 8.5l6.25 6.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-note" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ><path vector-effect="non-scaling-stroke" d="M6.5 3.75h8l4 4v11.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1z" /><path vector-effect="non-scaling-stroke" d="M14.25 3.75V8h4.25M8.75 12.5h6.5M8.75 16h4" /></g></symbol><symbol id="i-cal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ><rect vector-effect="non-scaling-stroke" x="3.75" y="5.25" width="16.5" height="15" rx="2.75" /><path vector-effect="non-scaling-stroke" d="M3.75 10.25h16.5M8.25 3.25v4M15.75 3.25v4" /></g></symbol><symbol id="i-more" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="5.75" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="18.25" cy="12" r="1.75" /></g></symbol><symbol id="i-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.125" fill="none" stroke="currentColor" stroke-width="1.75" vector-effect="non-scaling-stroke" /></symbol><symbol id="i-today" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle vector-effect="non-scaling-stroke" cx="12" cy="12" r="3.75" /><path vector-effect="non-scaling-stroke" d="M12 3v1.75M12 19.25V21M3 12h1.75M19.25 12H21M5.64 5.64l1.24 1.24M17.12 17.12l1.24 1.24M5.64 18.36l1.24-1.24M17.12 6.88l1.24-1.24" /></g></symbol><symbol id="i-tasks" viewBox="0 0 24 24"><path vector-effect="non-scaling-stroke" d="M4 6.5l1.6 1.6L8.75 5M4 12.5l1.6 1.6 3.15-3.1M4.5 18.25h3.5M12 6.75h8M12 12.75h8M12 18.25h8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></symbol><symbol id="i-routines" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ><path vector-effect="non-scaling-stroke" d="M16.5 3.5l3 3-3 3" /><path vector-effect="non-scaling-stroke" d="M19.5 6.5H9a4.5 4.5 0 0 0-4.5 4.5v.5" /><path vector-effect="non-scaling-stroke" d="M7.5 20.5l-3-3 3-3" /><path vector-effect="non-scaling-stroke" d="M4.5 17.5H15a4.5 4.5 0 0 0 4.5-4.5v-.5" /></g></symbol><symbol id="i-library" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ><path vector-effect="non-scaling-stroke" d="M12 6.5c-1.6-1.3-4-2-7.25-2v13.25c3.25 0 5.65.7 7.25 2 1.6-1.3 4-2 7.25-2V4.5c-3.25 0-5.65.7-7.25 2z" /><path vector-effect="non-scaling-stroke" d="M12 6.5v13.25" /></g></symbol><symbol id="i-today-f" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.9" fill="currentColor" /><path vector-effect="non-scaling-stroke" d="M12 2.75v1.9M12 19.35v1.9M2.75 12h1.9M19.35 12h1.9M5.46 5.46l1.34 1.34M17.2 17.2l1.34 1.34M5.46 18.54l1.34-1.34M17.2 6.8l1.34-1.34" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" /></symbol><symbol id="i-tasks-f" viewBox="0 0 24 24"><circle cx="6" cy="6.6" r="3.35" fill="currentColor" /><circle cx="6" cy="12.7" r="3.35" fill="currentColor" /><path vector-effect="non-scaling-stroke" d="M4.6 6.7l1 1 1.85-1.95M4.6 12.8l1 1 1.85-1.95" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /><path vector-effect="non-scaling-stroke" d="M4.25 18.5h3.5M12 6.75h8M12 12.75h8M12 18.5h8" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" /></symbol><symbol id="i-routines-f" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" ><path vector-effect="non-scaling-stroke" d="M18 6.5H9a4.5 4.5 0 0 0-4.5 4.5v.5" /><path vector-effect="non-scaling-stroke" d="M6 17.5H15a4.5 4.5 0 0 0 4.5-4.5v-.5" /></g><path d="M16 2.9l4.3 3.6-4.3 3.6z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" /><path d="M8 13.9l-4.3 3.6 4.3 3.6z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" /></symbol><symbol id="i-library-f" viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.3-4-2-7.25-2v13.25c3.25 0 5.65.7 7.25 2 1.6-1.3 4-2 7.25-2V4.5c-3.25 0-5.65.7-7.25 2z" fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" /><path vector-effect="non-scaling-stroke" d="M12 7.25v11.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" /></symbol>' +
  '</defs></svg>';
