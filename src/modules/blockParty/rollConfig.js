import { createRng } from '@modules/flora';

import {
  COLOR_BY,
  COLOR_TARGETS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
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

const FACET_ROLLS = {
  composition(config, rng) {
    Object.assign(config, {
      glowMode: weighted(rng, [
        ['reference', 4],
        ['random', 3],
        ['none', 2],
        ['all', 1],
      ]),
      pedestalShape: weighted(rng, [
        ['square', 3],
        ['circle', 1],
      ]),
      stairDirection: pick(rng, ['random', 'forward', 'backward', 'alternate']),
    });
  },
  form(config, rng) {
    Object.assign(config, {
      pitStyle: weighted(rng, [
        ['shaft', 2],
        ['terraced', 1],
      ]),
    });
  },
  palette(config, rng, { palettes }) {
    Object.assign(config, {
      colorBy: pick(rng, COLOR_BY),
      colorTarget: weighted(
        rng,
        COLOR_TARGETS.map((target) => [
          target,
          { all: 2, none: 0.5, towers: 3 }[target] ?? 1.5,
        ])
      ),
      paletteExact: rng.chance(0.6),
      paletteReverse: rng.chance(0.5),
      ...(palettes?.length ? { palette: pick(rng, palettes) } : {}),
    });
  },
};

// A flat Block Party config — a valid preset. Facets roll on their own
// streams so one can be held while the others move; the city seed belongs
// to composition, so holding it holds the city itself.
export default function rollBlockPartyConfig(
  batchSeed,
  { base = {}, keep = [], palettes = null, pinned = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
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
