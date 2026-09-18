import { createRng } from '@modules/flora';

import {
  ARCHETYPES,
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

// A flat fungi config — a valid preset. Facets roll on their own streams so
// one can be held while the others move, as in Flora's rollFloraConfig.
export default function rollFungiConfig(
  seed,
  { base = {}, keep = [], pinned = {}, seeds = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base, seed: String(seed) };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${seeds[facet] ?? seed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
      });
      if (facet === 'form') {
        config.archetype = rng.chance(0.3)
          ? 'auto'
          : ARCHETYPES[1 + Math.floor(rng() * (ARCHETYPES.length - 1))];
      }
      if (facet === 'palette') {
        config.glow = rng.chance(0.15) ? rng.range(0.4, 1) : 0;
      }
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'seed') config[key] = value;
  });

  return config;
}
