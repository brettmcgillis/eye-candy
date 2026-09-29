import {
  COLOR_MODES,
  LATTICES,
  PALETTE_NONE,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';
import { createRng } from './rng';

const ROLLED_FIELDS = ['fbm', 'ridged', 'rings', 'blobs', 'stripes', 'radial'];
const SYMMETRY_WEIGHTS = [
  ['none', 0.55],
  ['2-fold', 0.25],
  ['4-fold', 0.2],
];
const DRIVER_WEIGHTS = [
  ['noise', 0.45],
  ['variance', 0.35],
  ['focal', 0.2],
];

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
  const snapped = Math.round((min + (max - min) * rng()) / step) * step;
  return Number(snapped.toFixed(6));
}

const pick = (items, rng) => items[Math.floor(rng() * items.length)];

function weighted(entries, rng) {
  let roll = rng() * entries.reduce((sum, [, w]) => sum + w, 0);
  const hit = entries.find(([, w]) => {
    roll -= w;
    return roll <= 0;
  });
  return (hit ?? entries[entries.length - 1])[0];
}

const FACET_DICE = {
  field(config, rng) {
    Object.assign(config, { field: pick(ROLLED_FIELDS, rng) });
  },
  palette(config, rng, { paletteNames }) {
    Object.assign(config, {
      colorMode: pick(
        COLOR_MODES.filter((mode) => mode !== 'source'),
        rng
      ),
      gradientRadial: rng.chance(0.3),
      palette: paletteNames.length > 0 ? pick(paletteNames, rng) : PALETTE_NONE,
      paletteExact: rng.chance(0.7),
      paletteReverse: rng.chance(0.5),
    });
  },
  structure(config, rng) {
    Object.assign(config, {
      driver: weighted(DRIVER_WEIGHTS, rng),
      focalInvert: rng.chance(0.2),
      lattice: pick(LATTICES, rng),
      symmetry: weighted(SYMMETRY_WEIGHTS, rng),
    });
  },
};

export function rollableKeys() {
  return new Set(facets().flatMap((facet) => keysInFacet(facet)));
}

// A flat scene-keyed config — a valid Subdivision preset. Facets roll on their
// own streams so one can be held while the others move; `pinned` wins over
// everything; `base` supplies whatever the dice leave alone.
export default function rollConfig(
  seed,
  { base = {}, keep = [], paletteNames = [], pinned = {}, seeds = {} } = {}
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
      FACET_DICE[facet]?.(config, rng, { paletteNames });
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'seed') config[key] = value;
  });

  return config;
}
