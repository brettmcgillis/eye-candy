import { createRng } from '@modules/flora';

import {
  FACETS,
  RENDER_OPTIONS,
  VARIANTS,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

function rollValue(item, rng) {
  const { max, min, step } = item.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

const between = (rng, min, max) => min + (max - min) * rng();
const round = (v, places = 3) => Number(v.toFixed(places));
const pick = (rng, list) => list[Math.floor(rng() * list.length)];

const FACET_ROLLS = {
  composition(config, rng) {
    Object.assign(config, {
      composition: pick(rng, [
        'reference',
        'cross',
        'cross',
        'horizon',
        'horizon',
        'portal',
        'burst',
        'columns',
      ]),
      compWedge: rng.chance(0.6),
    });
  },

  palette(config, rng, { palettes }) {
    Object.assign(config, {
      paletteName:
        palettes?.length && rng.chance(0.45) ? pick(rng, palettes) : 'None',
    });
  },

  layout(config, rng) {
    Object.assign(config, { mirror: rng.chance(0.35) });
  },

  blocks(config, rng) {
    Object.assign(config, {
      blockEngine: pick(rng, ['grid', 'quadtree', 'quadtree', 'rect', 'rect']),
      blockLayers: pick(rng, [2, 3, 4, 4]),
    });
  },

  paint(config, rng, { variants }) {
    Object.assign(config, { variant: pick(rng, variants) });
  },

  // Now and then the seams breathe as hard as the wild bundle's.
  field(config, rng) {
    if (rng.chance(0.15)) {
      Object.assign(config, { seamBreath: round(between(rng, 0.3, 0.7)) });
    }
  },

  // A roll keeps the motif it was given; it only varies how it is painted.
  motif(config, rng, { base }) {
    Object.assign(config, {
      motif: base.motif ?? 'none',
      motifStyle: rng.chance(0.3) ? 'outline' : 'filled',
    });
  },

  accents(config, rng) {
    Object.assign(config, {
      redAccent: pick(rng, ['both', 'both', 'drips', 'flecks', 'none']),
      scratches: rng.chance(0.8),
      soot: rng.chance(0.85),
      wedge: rng.chance(0.85),
    });
  },
};

// A flat Imperfection config — a valid preset. Facets roll on their own
// streams so one can be held while the others move.
export default function rollImperfectionConfig(
  batchSeed,
  {
    base = {},
    keep = [],
    palettes = null,
    pinned = {},
    variants = VARIANTS,
  } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  FACETS.filter((facet) => !keep.includes(facet)).forEach((facet) => {
    const rng = createRng(`${batchSeed}:${facet}`);
    keysInFacet(facet).forEach((key) => {
      const item = RENDER_OPTIONS[key];
      if (item.roll) config[key] = rollValue(item, rng);
    });
    FACET_ROLLS[facet]?.(config, rng, { base, palettes, variants });
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
