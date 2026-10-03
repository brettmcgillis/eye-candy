import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import { capPoints } from './layout';
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

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => min + (max - min) * rng();
const round = (v, places = 2) => Number(v.toFixed(places));
const snap = (v, step, min, max) =>
  Math.min(Math.max(Math.round(v / step) * step, min), max);

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
  // Cables fill the cavity: the count follows from a packing share of its
  // cross-section, and the cylinders from a share of the field's area.
  structure(config, rng) {
    const packing = between(rng, 0.34, 0.46);
    const wireArea = Math.PI * config.wireRadius ** 2;
    const radiusMin = round(between(rng, 0.3, 0.6));
    const radiusMax = round(radiusMin + between(rng, 0.05, 0.35));
    const meanArea = Math.PI * ((radiusMin + radiusMax) / 2) ** 2;
    const coverage = between(rng, 0.03, 0.14);
    Object.assign(config, {
      cylinderCount: snap(
        (coverage * config.fieldWidth * config.fieldHeight) / meanArea,
        1,
        1,
        32
      ),
      cylinderRadiusMax: radiusMax,
      cylinderRadiusMin: radiusMin,
      wireCount: snap(
        (packing * config.fieldWidth * config.cavityDepth) / wireArea,
        10,
        20,
        2000
      ),
    });
    Object.assign(config, capPoints(config));
  },

  // Face, rim and cylinders each take a different stop of the palette, so
  // the three read apart; unpainted targets fall back to one family of light
  // or dark neutrals, so a palette always reads against a quiet ground.
  color(config, rng, { palettes, stopsOf }) {
    const hue = rng() * 360;
    const dark = rng.chance(0.2);
    const neutral = (spread) =>
      dark
        ? hsl(hue, between(rng, 0, 0.12), between(rng, 0.1, 0.22) + spread)
        : hsl(hue, between(rng, 0, 0.1), between(rng, 0.88, 0.96) - spread);
    const plain = rng.chance(0.08);
    const paint = (chance) => !plain && rng.chance(chance);
    const targets = {
      paintCylinders: paint(0.6),
      paintPanelFace: paint(0.3),
      paintPanelRim: paint(0.5),
      paintWires: paint(0.75),
    };
    if (!plain && !Object.values(targets).some(Boolean)) {
      targets.paintWires = true;
    }
    const palette = palettes?.length ? pick(rng, palettes) : config.palette;
    const count = Math.max(stopsOf?.(palette)?.length ?? 5, 2);
    const spots = Array.from({ length: count }, (_, i) => i / (count - 1))
      .map((spot) => [spot, rng()])
      .sort((a, b) => a[1] - b[1])
      .map(([spot]) => round(spot));
    Object.assign(config, {
      ...targets,
      cylinderColor: neutral(0),
      cylinderTone: spots[2 % count],
      faceTone: spots[0],
      palette,
      paletteExact: rng.chance(0.8),
      panelColor: neutral(0),
      rimTone: spots[1 % count],
      wireColor: neutral(0.02),
    });
  },

  atmosphere(config, rng) {
    const hue = rng() * 360;
    const warm = rng.chance(0.6);
    Object.assign(config, {
      backgroundColor: hsl(hue, between(rng, 0, 0.15), between(rng, 0.8, 0.94)),
      lightKeyColor: warm
        ? hsl(between(rng, 30, 45), between(rng, 0.3, 0.9), 0.95)
        : hsl(between(rng, 200, 225), between(rng, 0.3, 0.9), 0.95),
      wallColor: hsl(hue, between(rng, 0, 0.12), between(rng, 0.3, 0.7)),
    });
  },
};

// A flat Push Comes to Shove config — a valid preset. Facets roll on their
// own streams so one can be held while the others move.
export default function rollShoveConfig(
  batchSeed,
  { base = {}, keep = [], palettes = null, pinned = {}, stopsOf = null } = {}
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
      FACET_ROLLS[facet]?.(config, rng, { palettes, stopsOf });
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
