import { createRng } from '@modules/flora';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

const HEX = '0123456789abcdef';

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (let n = 0; n < entries.length; n += 1) {
    roll -= entries[n][1];
    if (roll <= 0) return entries[n][0];
  }
  return entries[entries.length - 1][0];
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

function rollHash(rng) {
  let hash = '0x';
  for (let n = 0; n < 64; n += 1) hash += HEX[Math.floor(rng() * 16)];
  return hash;
}

const FACET_DICE = {
  form(config, rng) {
    Object.assign(config, {
      cutI: rng.chance(0.08),
      cutK: rng.chance(0.08),
      dixScale: weighted(rng, [
        ['1', 5],
        ['0.75', 2],
        ['1.25', 2],
        ['0.5', 1],
      ]),
      perspective: weighted(rng, [
        ['split', 6],
        ['top', 2],
        ['inverted', 2],
        ['below', 1],
      ]),
      piece: weighted(rng, [
        ['ambifeuille', 4],
        ['dixfeuille', 4],
        ['winterkammer', 2],
      ]),
      seed: rollHash(rng),
      tokenId: Math.floor(rng() * 256),
      warpLevel: rng.chance(0.7)
        ? 'rolled'
        : pick(rng, ['0', '1', '2', '4', '8', '16']),
    });
  },
  palette(config, rng, { palettes }) {
    Object.assign(config, {
      palette:
        palettes?.length && rng.chance(0.85)
          ? pick(rng, palettes)
          : PALETTE_NONE,
      paletteBackground: rng.chance(0.35),
      paletteExact: rng.chance(0.3),
      paletteInk: rng.chance(0.3),
      paletteMode: weighted(rng, [
        ['layers', 5],
        ['faces', 3],
        ['strata', 2],
      ]),
      paletteReverse: rng.chance(0.5),
      paletteStrength: rng.chance(0.8)
        ? 1
        : Number((0.55 + rng() * 0.35).toFixed(2)),
    });
  },
};

export function seedFor(batch, index) {
  return index === 0 ? String(batch) : `${batch}-${index}`;
}

export function randomBatch() {
  return Math.random().toString(36).slice(2, 8);
}

// A flat IsoMeter config, a valid scene preset. Facets roll on their own
// streams so one can be held while the others move; `pinned` wins.
export default function rollConfig(
  name,
  { base = {}, keep = [], palettes = null, pinned = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base };
  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${name}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
      });
      FACET_DICE[facet]?.(config, rng, { palettes });
    });
  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });
  return config;
}
