import { createRng } from '@modules/flora';

import {
  COLOR_BY,
  POOL_IDS,
  RENDER_OPTIONS,
  SPLIT_FOCI,
  SYMMETRY_NAMES,
  TILING_NAMES,
  ZONE_MODE_NAMES,
  facets,
  keysInFacet,
  poolKey,
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

// Image colourings need a source image, which a roll never has.
const ROLLED_COLOR_BY = COLOR_BY.filter(
  (mode) => mode !== 'image' && mode !== 'source'
);

const MIRRORS = ['mirrorX', 'mirrorY', 'quad'];
const SIXFOLD = [...MIRRORS, 'rotate2', 'rotate3', 'rotate6', 'kaleido6'];
const FOURFOLD = [...MIRRORS, 'rotate2', 'rotate4', 'kaleido4'];
// The symmetries each tiling really has about its centre; snub square is
// chiral, so it only turns.
const SYMMETRY_FITS = {
  elongated: [...MIRRORS, 'rotate2'],
  hex: SIXFOLD,
  kagome: SIXFOLD,
  rhombitrihex: SIXFOLD,
  snubSquare: ['rotate2', 'rotate4'],
  square: FOURFOLD,
  triangle: SIXFOLD,
  truncatedSquare: FOURFOLD,
};

// A grid turned off its own axes keeps its rotations but loses its mirrors.
function pickSymmetry(config, rng) {
  const fits = (SYMMETRY_FITS[config.tiling] ?? SYMMETRY_NAMES).filter(
    (name) => config.gridRotation % 45 === 0 || name.startsWith('rotate')
  );
  return fits.length > 0 ? fits[Math.floor(rng() * fits.length)] : 'none';
}

const TILING_WEIGHTS = TILING_NAMES.map((name) => [
  name,
  { square: 2, triangle: 4 }[name] ?? 1,
]);

const FACET_ROLLS = {
  layout(config, rng) {
    Object.assign(config, {
      gridRotation: weighted(rng, [
        [0, 3],
        [90, 3],
        [45, 1],
        [15, 1],
      ]),
      tiling: weighted(rng, TILING_WEIGHTS),
    });
  },
  // Anything from a single pattern to the whole catalogue.
  patterns(config, rng) {
    const size = rng.chance(0.3)
      ? 1
      : 2 + Math.floor(rng() ** 1.4 * (POOL_IDS.length - 1));
    const shuffled = [...POOL_IDS.filter((id) => id !== 'plain')].sort(
      () => rng() - 0.5
    );
    const chosen = new Set(shuffled.slice(0, size));
    if (rng.chance(0.2)) chosen.add('plain');
    POOL_IDS.forEach((id) => {
      Object.assign(config, { [poolKey(id)]: chosen.has(id) });
    });
  },
  mix(config, rng) {
    Object.assign(config, {
      splitFocus: SPLIT_FOCI[Math.floor(rng() * SPLIT_FOCI.length)],
      symmetry: rng.chance(0.5) ? 'none' : pickSymmetry(config, rng),
      zoneMode: rng.chance(0.25)
        ? 'none'
        : ZONE_MODE_NAMES[1 + Math.floor(rng() * (ZONE_MODE_NAMES.length - 1))],
    });
  },
  palette(config, rng, { palettes }) {
    Object.assign(config, {
      colorBy: ROLLED_COLOR_BY[Math.floor(rng() * ROLLED_COLOR_BY.length)],
      colorTarget: weighted(rng, [
        ['openings', 5],
        ['strips', 2],
        ['both', 2],
        ['none', 1],
      ]),
      paletteExact: rng.chance(0.7),
      ...(palettes?.length
        ? { palette: palettes[Math.floor(rng() * palettes.length)] }
        : {}),
    });
  },
};

// A flat kumiko config — a valid preset. Facets roll on their own streams so
// one can be held while the others move.
export default function rollKumikoConfig(
  seed,
  { base = {}, keep = [], palettes = null, pinned = {}, seeds = {} } = {}
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
      FACET_ROLLS[facet]?.(config, rng, { palettes });
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'seed') config[key] = value;
  });

  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
