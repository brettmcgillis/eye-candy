import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

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

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => min + (max - min) * rng();
const round = (v, places = 2) => Number(v.toFixed(places));

function hsl(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h) % 6];
  return rgbToHex([r, g, b].map((v) => (v + m) * 255));
}

const FRAME_METALS = ['#dacb59', '#d9d9d9', '#d49a6a', '#1c1c1c'];

const FACET_ROLLS = {
  structure(config, rng) {
    const octree = rng.chance(0.4);
    const cube = rng.chance(0.65);
    Object.assign(config, {
      cellShape: weighted(rng, [
        ['cube', 7],
        ['sphere', 1.5],
        ['mixed', 1.5],
      ]),
      domainX: cube ? 1 : round(between(rng, 0.6, 1.5)),
      domainY: cube ? 1 : round(between(rng, 0.5, 1.4)),
      domainZ: cube ? 1 : round(between(rng, 0.6, 1.5)),
      gap: round(octree ? between(rng, 0.004, 0.014) : config.gap, 3),
      structure: octree ? 'octree' : 'rect',
    });
  },

  // One mood: a dark body, a pale one, an accent and a glow drawn round a
  // hue, and a handful of roles given weight. The rect reference is mostly
  // dark with a tenth each of glow and accent; the octree one is dark, pale
  // and glass in thirds.
  color(config, rng, { palettes }) {
    const hue = rng() * 360;
    const accentHue = hue + (rng.chance(0.5) ? between(rng, 150, 210) : 0);
    const glass = rng.chance(0.4);
    Object.assign(config, {
      accentColor: hsl(accentHue, between(rng, 0.55, 0.9), 0.62),
      coreColor: hsl(hue + 30, between(rng, 0, 0.5), 0.85),
      darkColor: hsl(hue, between(rng, 0.03, 0.2), between(rng, 0.18, 0.4)),
      emissiveColor: hsl(
        rng.chance(0.5) ? accentHue : hue,
        between(rng, 0.3, 0.8),
        0.75
      ),
      frameColor: pick(rng, FRAME_METALS),
      frameMode: weighted(rng, [
        ['all', 3],
        ['solid', 1],
        ['none', 2],
      ]),
      glassColor: hsl(hue, between(rng, 0, 0.25), 0.95),
      lightColor: hsl(hue, between(rng, 0, 0.15), between(rng, 0.82, 0.95)),
      paletteName:
        palettes?.length && rng.chance(0.35) ? pick(rng, palettes) : 'None',
      roleAccent: round(rng.chance(0.6) ? between(rng, 0.03, 0.2) : 0),
      roleDark: round(between(rng, 0.3, 0.8)),
      roleEmissive: round(rng.chance(0.7) ? between(rng, 0.03, 0.15) : 0),
      roleGlass: round(glass ? between(rng, 0.1, 0.35) : 0),
      roleLight: round(rng.chance(0.5) ? between(rng, 0.1, 0.5) : 0),
      paletteExact: rng.chance(0.7),
    });
  },

  // The floor, the sky's lower half and the backdrop share one hue, as the
  // red of the rect reference does; `mono` is the octree reference's dark
  // room lit only by its panels.
  atmosphere(config, rng) {
    const studio = weighted(rng, [
      ['crimson', 3],
      ['mono', 2],
    ]);
    const hue = rng() * 360;
    const dark = studio === 'mono' || rng.chance(0.2);
    const saturation = dark ? between(rng, 0, 0.15) : between(rng, 0.4, 0.85);
    const lightness = dark
      ? between(rng, 0.04, 0.16)
      : between(rng, 0.35, 0.55);
    Object.assign(config, {
      background: hsl(hue, saturation, lightness * 1.1),
      floorColor: hsl(hue, saturation, lightness),
      skyNadir: dark ? '#000000' : hsl(hue, saturation, lightness + 0.1),
      skyZenith: dark
        ? '#000000'
        : hsl(hue + 180, between(rng, 0.05, 0.2), between(rng, 0.2, 0.35)),
      studio,
    });
  },
};

// A flat HyperCubes config — a valid preset. Facets roll on their own
// streams so one can be held while the others move.
export default function rollHyperCubesConfig(
  batchSeed,
  { base = {}, keep = [], palettes = null, pinned = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { palettes });
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });

  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
