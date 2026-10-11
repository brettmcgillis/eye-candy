/* eslint-disable no-param-reassign */
import { createRng, rollConfig as rollPieceConfig } from '@modules/subdivision';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

const HEIGHT_DRIVERS = ['depthWeight', 'fieldWeight', 'lumaWeight'];

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
  const snapped = Math.round((min + (max - min) * rng()) / step) * step;
  return Number(snapped.toFixed(6));
}

function hslHex(hue, saturation, lightness) {
  const k = (n) => (n + hue / 30) % 12;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n) =>
    Math.round(
      255 * (lightness - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))
    );
  return `#${[0, 8, 4].map((n) => channel(n).toString(16).padStart(2, '0')).join('')}`;
}

function rollRelief(config, rng) {
  keysInFacet('relief').forEach((key) => {
    const spec = RENDER_OPTIONS[key];
    if (spec.roll) config[key] = rollValue(spec, rng);
  });
  config.lumaInvert = rng.chance(0.3);
  config.plateColor = hslHex(rng() * 360, 0.12, 0.06 + rng() * 0.08);
  if (HEIGHT_DRIVERS.every((key) => config[key] < 0.2)) config.depthWeight = 1;
}

// A flat scene-keyed config — a valid SubdivisionRelief preset. The piece
// facets roll as Subdivision's do; `relief` rolls on its own stream, so any
// facet can be held while the others move. `pinned` wins over everything.
export default function rollReliefConfig(
  seed,
  { base = {}, keep = [], paletteNames = [], pinned = {}, seeds = {} } = {}
) {
  const piece = rollPieceConfig(seed, {
    base: { ...sceneDefaults(), ...base },
    keep,
    paletteNames,
    seeds,
  });
  const config = Object.fromEntries(SCENE_KEYS.map((key) => [key, piece[key]]));

  if (!keep.includes('relief')) {
    rollRelief(config, createRng(`${seeds.relief ?? seed}:relief`));
  }

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'seed') config[key] = value;
  });

  return config;
}
