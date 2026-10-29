import { createRng } from '@modules/flora';
import { hexToRgb, rgbToHex } from '@utils/paletteStops';

import {
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

function rollValue(item, rng) {
  const { max, min, step } = item.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

// A colour nudged in brightness and warmth, so two candles from one wax are
// siblings rather than twins.
function nudge(rng, hex, amount) {
  const k = 1 + (rng() * 2 - 1) * amount;
  const warm = (rng() * 2 - 1) * amount * 30;
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * k + warm, g * k, b * k - warm]);
}

// Waxes and how often they turn up: mostly the pale church-candle range.
const WAXES = [
  ['#f4ecdc', 5],
  ['#f7f5f0', 4],
  ['#efe2c4', 4],
  ['#e8d3a6', 2],
  ['#d9a441', 1.5],
  ['#9e1b1b', 1.2],
  ['#5c1424', 1],
  ['#1e1b1b', 0.8],
  ['#9caf88', 0.7],
  ['#7c95ad', 0.7],
  ['#e3b5a8', 0.7],
  ['#c99a2e', 0.5],
];

// Stylised looks redraw the sim flame and curl smoke; the legacy systems
// have no cartoon or clay version, so a stylised roll swaps them out.
const STYLED_FLAMES = new Set(['sim', 'out']);
const STYLED_SMOKES = new Set(['curl', 'none']);

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

// Stylised looks bring their own colours: candy wax on deep backdrops for
// cartoon, plasticine primaries on felt-toned sets for clay.
const STYLE_PALETTES = {
  cartoon: {
    backgrounds: [
      '#1b1f3b',
      '#2d1e2f',
      '#13293d',
      '#2b1d4f',
      '#0b2e33',
      '#3b1f2b',
    ],
    waxes: [
      '#ff6b6b',
      '#ffd93d',
      '#6bcbef',
      '#c77dff',
      '#4ecdc4',
      '#ff9f1c',
      '#f7f3e8',
      '#ff70a6',
      '#8ce99a',
    ],
  },
  clay: {
    backgrounds: [
      '#3b2f2f',
      '#2e4057',
      '#4a3b52',
      '#33402a',
      '#5c3d2e',
      '#1d3557',
    ],
    waxes: [
      '#e63946',
      '#f4a261',
      '#2a9d8f',
      '#e9c46a',
      '#457b9d',
      '#f1ede4',
      '#8ac926',
      '#ff99c8',
      '#6a4c93',
    ],
  },
};

const FACET_ROLLS = {
  candle(config, rng) {
    Object.assign(config, {
      profile: weighted(rng, [
        ['pillar', 4],
        ['twisted', 1.6],
        ['spindle', 1],
        ['waisted', 1],
        ['fluted', 1.2],
        ['faceted', 1],
      ]),
      waxColor: nudge(rng, weighted(rng, WAXES), 0.06),
    });
  },

  fire(config, rng) {
    Object.assign(config, {
      emberState: weighted(rng, [
        ['snuffed', 3],
        ['smoulder', 2],
        ['cold', 0.4],
      ]),
      flame: weighted(rng, [
        ['sim', 6],
        ['shader', 1.2],
        ['slices', 1.2],
        ['out', 2],
      ]),
      flameState: weighted(rng, [
        ['calm', 3],
        ['flicker', 3],
        ['gutter', 1.4],
        ['breeze', 1.6],
        ['sooty', 1.2],
      ]),
    });
  },

  style(config, rng) {
    const look = weighted(rng, [
      ['realistic', 4],
      ['cartoon', 1.5],
      ['clay', 1.5],
    ]);
    const palette = STYLE_PALETTES[look] ?? STYLE_PALETTES.cartoon;
    Object.assign(config, {
      look,
      styleBackground: nudge(rng, pick(rng, palette.backgrounds), 0.08),
      styleWax: nudge(rng, pick(rng, palette.waxes), 0.05),
      toonInk: rgbToHex(hexToRgb('#1a1013').map((c) => c + rng() * 20)),
    });
  },

  smoke(config, rng) {
    const grey = 150 + Math.round(rng() * 80);
    Object.assign(config, {
      smoke: weighted(rng, [
        ['curl', 7],
        ['ribbon', 1.2],
        ['billboard', 0.8],
        ['none', 0.3],
      ]),
      smokeColor: nudge(rng, rgbToHex([grey, grey, grey]), 0.04),
    });
  },
};

// A flat candle config — a valid scene preset. Facets roll on their own
// streams, so one can be held while the others move.
export default function rollCandleConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {} } = {}
) {
  const config = {
    ...sceneDefaults(),
    settle: RENDER_OPTIONS.settle.default,
    ...base,
  };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng);
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });
  if (config.look !== 'realistic') {
    if (!STYLED_FLAMES.has(config.flame) && pinned.flame == null) {
      config.flame = 'sim';
    }
    if (!STYLED_SMOKES.has(config.smoke) && pinned.smoke == null) {
      config.smoke = 'curl';
    }
  }
  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}

// A seeded stand-in for Math.random while a generation burns: the legacy
// flame and smoke elements draw from Math.random, so a still repeats only
// with this swapped in.
export function burnRandom(name) {
  return createRng(`${name}:burn`);
}
