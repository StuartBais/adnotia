import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The bench's colours against design/lantern/SPEC.md section 7 (plan section
// 17). The token table is read from SPEC itself, so the stylesheet is held to
// the design as written, not to a copy of it kept here: every token's value,
// every "text on it" ratio SPEC quotes, every pair of ink and ground the bench
// sets text in, and every colour written anywhere in the file. There is no
// red, and nothing can creep in that is not one of SPEC's colours.
//
// jsdom resolves no custom properties, so the stylesheet is read as text.

const root = process.cwd();
const spec = readFileSync(resolve(root, 'design/lantern/SPEC.md'), 'utf8');
const css = readFileSync(resolve(root, 'src/bench/bench.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

// ---------------------------------------------------------------- reading

/** SPEC 7's token table: each row's name, value, and "Text on it" cell. */
const table = (() => {
  const start = spec.indexOf('## 7. Tokens');
  const end = spec.indexOf('## 8. Type');
  const rows: { name: string; value: string; textOn: string }[] = [];
  for (const line of spec.slice(start, end).split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim());
    const name = /^`([a-z0-9-]+)`$/.exec(cells[1] ?? '')?.[1];
    if (!name) continue;
    const value = /#[0-9A-Fa-f]{6}|rgba\([^)]*\)/.exec(cells[2] ?? '')?.[0];
    if (!value) throw new Error(`SPEC 7 row ${name} has no colour`);
    rows.push({ name, value, textOn: cells[3] ?? '' });
  }
  return rows;
})();

/** The custom property each SPEC token is written as. Only terracotta is shortened. */
const property = (name: string) => (name === 'terracotta' ? '--terra' : `--${name}`);

/** The tokens in the stylesheet's :root. */
const tokens = (() => {
  const body = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const out = new Map<string, string>();
  for (const match of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    out.set(match[1]!, match[2]!.trim());
  }
  return out;
})();

/** Every rule as selectors and body; a rule inside @media keeps only its own selector. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selectors: (match[1] ?? '')
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean),
  body: match[2] ?? '',
}));

type Rgb = readonly [number, number, number];

function rgbOf(colour: string): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(colour.trim());
  if (hex) {
    const n = Number.parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(colour.trim());
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`Not a colour: ${colour}`);
}

/** A colour as numbers, so "#FFFFFF" is "#ffffff" and "0.10" is "0.1". */
const normal = (colour: string): string => {
  const alpha = /,\s*([\d.]+)\s*\)$/.exec(colour)?.[1];
  return [...rgbOf(colour), alpha === undefined ? 1 : Number(alpha)].join(',');
};

/** A token's colour, by SPEC name or property name. Black is the system's, never written. */
function colourOf(name: string): Rgb {
  if (name === 'black') return [0, 0, 0];
  const value = tokens.get(name.startsWith('--') ? name : property(name));
  if (!value) throw new Error(`No token for ${name}`);
  return rgbOf(value);
}

/** WCAG 2.x contrast ratio. */
function ratio(a: Rgb, b: Rgb): number {
  const lum = ([r, g, b2]: Rgb) => {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b2);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The inks text is set in. */
const INKS = ['--white', '--ash', '--terra', '--charcoal', '--muted'];

/**
 * The rail's own name for the ground under it, so its discs cut the line in
 * the ground's colour: charcoal, and white on white places, where the rules
 * that re-set it re-set the ink as well.
 */
const ALIAS: Record<string, string> = { '--ground': '--charcoal' };

// ---------------------------------------------------------------- the tests

describe('the tokens (SPEC 7)', () => {
  it('reads SPEC’s table whole: seventeen tokens and the Island’s black', () => {
    expect(table.map((row) => row.name)).toEqual([
      'charcoal',
      'white',
      'ash',
      'terracotta',
      'stone',
      'sage',
      'muted',
      'ash-20',
      'ash-30',
      'ash-8',
      'ash-15',
      'ash-edge',
      'tint-stone',
      'tint-white',
      'hair-dark',
      'hair-light',
      'lamp',
      'black',
    ]);
  });

  it('sets every custom property to SPEC’s value', () => {
    for (const row of table) {
      // Black is the Dynamic Island's, which the system draws; the bench never does.
      if (row.name === 'black') {
        expect(tokens.has('--black')).toBe(false);
        continue;
      }
      expect(tokens.get(property(row.name)), row.name).toBeDefined();
      expect(normal(tokens.get(property(row.name))!), row.name).toBe(normal(row.value));
    }
  });

  it('measures every "text on it" pair SPEC quotes at 4.5:1 or more, within 0.1 of its figure', () => {
    let pairs = 0;
    for (const row of table) {
      for (const pair of row.textOn.matchAll(/([a-z-]+) (\d+(?:\.\d+)?)/g)) {
        const [, ink, quoted] = pair;
        const measured = ratio(colourOf(ink!), colourOf(row.name));
        expect(measured, `${ink} on ${row.name}`).toBeGreaterThanOrEqual(4.5);
        expect(Math.abs(measured - Number(quoted)), `${ink} on ${row.name}`).toBeLessThanOrEqual(
          0.1,
        );
        pairs++;
      }
    }
    // Charcoal 3, white 1, terracotta 1, stone 2, sage 2, ash-20 1, ash-8 3,
    // ash-15 3, the tints 2 each, lamp 3 and black 3.
    expect(pairs).toBe(26);
  });
});

describe('text on the bench’s grounds', () => {
  /**
   * Every ground the bench sets text on, and the inks it sets there, read
   * from the stylesheet and checked here by name: what the board draws, and
   * where each is used. Muted on white is SPEC's "may go" figure, 6.8.
   */
  const USED: Record<string, readonly string[]> = {
    // Today, Focus, the running page, charcoal places: the present's inks.
    '--charcoal': ['--white', '--ash', '--terra'],
    // The lantern's falloff, measured at its brightest point.
    '--lamp': ['--white', '--ash', '--terra'],
    // White places, white pills, fields in sheets.
    '--white': ['--charcoal', '--muted'],
    // The drawer, the sheets, the tabs.
    '--stone': ['--charcoal', '--muted'],
    '--sage': ['--charcoal', '--muted'],
    '--terra': ['--charcoal'],
    // Pause, +5 min, Set aside, Me and the back pills on charcoal.
    '--ash-20': ['--white'],
    // The note field on the running page, the dark switch.
    '--ash-8': ['--white', '--ash', '--terra'],
    // The lifted capsule.
    '--ash-15': ['--white', '--ash', '--terra'],
    // Me on stone, the Undo pill; Me and the back pills on white.
    '--tint-stone': ['--charcoal', '--muted'],
    '--tint-white': ['--charcoal', '--muted'],
  };

  it('measures every pair the bench uses at 4.5:1 or more', () => {
    for (const [ground, inks] of Object.entries(USED)) {
      for (const ink of inks) {
        expect(
          ratio(colourOf(ink), colourOf(ground)),
          `${ink} on ${ground}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('sets text only in SPEC’s five inks', () => {
    for (const rule of rules) {
      for (const match of rule.body.matchAll(/(?:^|[;\s])color:\s*([^;]+);/g)) {
        const value = match[1]!.trim();
        if (value === 'inherit' || value === 'transparent' || value === 'currentColor') continue;
        expect(INKS, `${rule.selectors.join(', ')} { color: ${value} }`).toContain(
          /^var\((--[a-z0-9-]+)\)$/.exec(value)?.[1],
        );
      }
    }
  });

  it('pairs ink and ground only as the table above allows, wherever one rule sets both', () => {
    let checked = 0;
    for (const rule of rules) {
      const ink = /(?:^|[;\s])color:\s*var\((--[a-z0-9-]+)\);/.exec(rule.body)?.[1];
      const named = /background(?:-color)?:\s*var\((--[a-z0-9-]+)\);/.exec(rule.body)?.[1];
      const ground = named && (ALIAS[named] ?? named);
      if (!ink || !ground) continue;
      const where = rule.selectors.join(', ');
      expect(USED[ground], `${where}: text on ${ground}`).toBeDefined();
      expect(USED[ground], `${where}: ${ink} on ${ground}`).toContain(ink);
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
  });

  /** Charcoal objects that sit on a light ground, each a whole class name. */
  const CHARCOAL_OBJECT =
    /\.(?:capsule|nowtag|focuspill|c-ride|ts-ride|ntag\.now|start\.first)(?![\w-])/;

  it('never sets ash or terracotta as text on a light ground: white places, stone or a tint', () => {
    const light =
      /data-places='white'\]\[data-ground='place'\]|^\.drawer|^\.tabs|^\.c-panel|^\.foot/;
    let seen = 0;
    for (const rule of rules) {
      const ink = /(?:^|[;\s])color:\s*var\((--[a-z0-9-]+)\);/.exec(rule.body)?.[1];
      if (!ink) continue;
      // A rule that sets its own ground is judged by the pair it makes, above.
      if (/background(?:-color)?:\s*var\(/.test(rule.body)) continue;
      for (const selector of rule.selectors.filter((s) => light.test(s))) {
        // A charcoal object on a light ground carries the present's inks: the
        // capsule and the pictures of it that ride a sheet, the Now tag, the
        // Focus pill and the charcoal Start. Named as whole classes, so the
        // quiet "Start this instead" and a plain tag are still held here.
        if (CHARCOAL_OBJECT.test(selector)) continue;
        expect(['--charcoal', '--muted', '--white'], `${selector} { color: ${ink} }`).toContain(
          ink,
        );
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(15);
  });
});

describe('every colour in the file', () => {
  it('is a SPEC 7 token, or a token’s colour at some opacity: no red, no colour for late', () => {
    const allowed = new Set(
      table.map((row) => rgbOf(row.value).join(',')).concat(['0,0,0', '255,255,255']),
    );
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
    expect(literals.length).toBeGreaterThan(40);
    for (const literal of literals) {
      expect(/^#[0-9a-f]{6}$/i.test(literal) || literal.startsWith('rgb'), literal).toBe(true);
      expect(allowed, literal).toContain(rgbOf(literal).join(','));
    }
  });

  it('writes no named colour', () => {
    const named =
      /(?:color|background|fill|stroke|border|outline)[a-z-]*:\s*[^;]*\b(red|orange|yellow|green|blue|purple|pink|crimson|tomato|gold)\b/i;
    expect(css).not.toMatch(named);
  });
});
