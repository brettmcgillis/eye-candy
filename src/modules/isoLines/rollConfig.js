/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import * as flat from './renderOptions.mjs';

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

export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const between = (rng, min, max) => min + (max - min) * rng();
const round = (v, places = 2) => Number(v.toFixed(places));

export function hsl(hue, saturation, lightness) {
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

const DRIVERS = ['weightNoise', 'weightShape', 'weightFocal'];

export const SHARED_ROLLS = {
  // Usually the reference noise leads; now and then one driver alone, or a
  // blend that hides which made what.
  field(config, rng) {
    const mode = weighted(rng, [
      ['reference', 2],
      ['solo', 1],
      ['blend', 2],
    ]);
    DRIVERS.forEach((key) => {
      config[key] = 0;
    });
    if (mode === 'reference') config.weightNoise = 1;
    else if (mode === 'solo') config[pick(rng, DRIVERS)] = 1;
    else {
      DRIVERS.forEach((key) => {
        config[key] = rng.chance(0.7) ? round(between(rng, 0.2, 1)) : 0;
      });
      if (DRIVERS.every((key) => config[key] === 0)) config.weightNoise = 1;
    }
    config.shapeKind = pick(rng, flat.SHAPE_KINDS);
    if (mode === 'reference') config.warpAmount = 0;
  },

  contours(config, rng) {
    config.style = rng.chance(0.55) ? 'terraced' : 'lines';
  },

  // Dark grounds most of the time; a paper map now and then.
  color(config, rng, { palettes }) {
    config.colorMode = weighted(rng, [
      ['cosine', 2],
      ['palette', palettes?.length ? 2 : 0],
      ['ramp', 1.2],
    ]);
    config.paletteName =
      config.colorMode === 'palette' ? pick(rng, palettes) : 'None';
    const hue = rng() * 360;
    const paper = rng.chance(0.25);
    Object.assign(config, {
      background: paper
        ? hsl(between(rng, 30, 50), between(rng, 0.15, 0.35), 0.92)
        : hsl(hue + 180, between(rng, 0.1, 0.4), between(rng, 0.02, 0.06)),
      lineColor: paper ? hsl(hue, 0.3, 0.2) : hsl(hue, 0.2, 0.92),
      outlineColor: hsl(hue, 0.3, paper ? 0.25 : 0.04),
      rampHigh: hsl(hue + between(rng, 20, 90), between(rng, 0.3, 0.7), 0.85),
      rampLow: hsl(hue, between(rng, 0.3, 0.7), between(rng, 0.08, 0.2)),
    });
    if (paper && config.style === 'lines') config.lineTint = 1;
  },

  atmosphere(config, rng) {
    config.postGrainEnabled = rng.chance(0.3);
  },
};

// A roller over one schema (IsoLines' or IsoLinesRelief's): a flat config
// that is a valid preset for it. Facets roll on their own streams so one can
// be held while the others move.
export function createRoller(schema, facetRolls) {
  return function roll(
    batchSeed,
    { base = {}, keep = [], palettes = null, pinned = {} } = {}
  ) {
    const config = { ...schema.sceneDefaults(), ...base };

    schema
      .facets()
      .filter((facet) => !keep.includes(facet))
      .forEach((facet) => {
        const rng = createRng(`${batchSeed}:${facet}`);
        schema.keysInFacet(facet).forEach((key) => {
          const item = schema.RENDER_OPTIONS[key];
          if (item.roll) config[key] = rollValue(item, rng);
        });
        facetRolls[facet]?.(config, rng, { palettes });
      });

    Object.entries(pinned).forEach(([key, value]) => {
      if (value != null) config[key] = value;
    });

    return config;
  };
}

const rollIsoLinesConfig = createRoller(flat, SHARED_ROLLS);
export default rollIsoLinesConfig;

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
