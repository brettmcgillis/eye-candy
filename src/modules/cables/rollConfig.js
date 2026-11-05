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

const FACET_ROLLS = {
  field(config, rng) {
    Object.assign(config, {
      layout: weighted(rng, [
        ['flat', 3],
        ['tangle', 2],
      ]),
    });
  },

  // A sleeve colour (mostly black, as cables are) and a mood for the rest.
  cables(config, rng, { palettes }) {
    const hue = rng() * 360;
    const usePalette = palettes?.length > 0 && rng.chance(0.45);
    Object.assign(config, {
      accentColor: hsl(hue, between(rng, 0.55, 0.9), between(rng, 0.4, 0.6)),
      cableColor: rng.chance(0.75)
        ? hsl(hue, between(rng, 0, 0.08), between(rng, 0.05, 0.12))
        : hsl(hue + 180, between(rng, 0, 0.2), between(rng, 0.75, 0.9)),
      colorMode: usePalette
        ? weighted(rng, [
            ['mixed', 1],
            ['sweep', 1],
          ])
        : 'mono',
      paletteName: usePalette ? pick(rng, palettes) : 'None',
    });
  },

  // A floor and the backdrop behind it in one family, mostly neutral.
  atmosphere(config, rng) {
    const hue = rng() * 360;
    const saturation = rng.chance(0.7)
      ? between(rng, 0, 0.08)
      : between(rng, 0.15, 0.45);
    const lightness = between(rng, 0.25, 0.75);
    Object.assign(config, {
      background: hsl(hue, saturation, lightness * 0.92),
      envTint: hsl(hue + 30, between(rng, 0, 0.2), 0.92),
      floorColor: hsl(hue, saturation, lightness),
    });
  },
};

// A flat Cables config — a valid preset. Facets roll on their own streams
// so one can be held while the others move.
export default function rollCablesConfig(
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
