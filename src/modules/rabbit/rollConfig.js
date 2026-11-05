import { createRng } from '@modules/flora';

import {
  RENDER_OPTIONS,
  configDefaults,
  facets,
  keysInFacet,
} from './renderOptions.mjs';

function rollValue(item, rng) {
  const { max, min, step } = item.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

const FACET_ROLLS = {
  volley(config, rng) {
    Object.assign(config, { volley: rng.chance(0.15) ? 'painting' : 'rolled' });
  },
};

// A flat Stay Hunted generation config. Facets roll on their own streams so
// one can be held while the others move.
export default function rollRabbitConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {} } = {}
) {
  const config = { ...configDefaults(), ...base };

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

  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
