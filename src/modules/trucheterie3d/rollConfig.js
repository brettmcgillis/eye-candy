import { createRng } from '@modules/trucheterieBlob';

import {
  HEIGHT_MODES,
  LANE_MODES,
  MEATBALLS,
  PALETTE_NONE,
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

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

const FACET_ROLLS = {
  structure(config, rng) {
    Object.assign(config, {
      blobMeatballs: pick(rng, [
        MEATBALLS.HIDE_LOOSE,
        MEATBALLS.PRUNE_LOOSE,
        MEATBALLS.KEEP_ALL,
      ]),
      planeRotation: rng.chance(0.5) ? 45 : 0,
    });
  },
  palette(config, rng, { paletteNames }) {
    Object.assign(config, {
      blobLaneMode: pick(rng, LANE_MODES),
      blobPalette:
        paletteNames.length > 0 ? pick(rng, paletteNames) : PALETTE_NONE,
      blobPaletteExact: rng.chance(0.5),
    });
  },
  form(config, rng) {
    Object.assign(config, {
      heightMode: weighted(
        rng,
        HEIGHT_MODES.map((mode) => [mode, mode === 'flat' ? 2 : 1])
      ),
      junction: rng.chance(0.35) ? 'weave' : 'cap',
      strands: weighted(rng, [
        ['lanes', 5],
        ['both', 3],
        ['wires', 1],
      ]),
      tubeProfile: weighted(rng, [
        ['round', 6],
        ['half', 2],
        ['ribbon', 2],
      ]),
    });
  },
};

// A flat Trucheterie3D config — a valid preset. Facets roll on their own
// streams so one can be held while the others move; `pinned` wins over
// everything; `base` supplies whatever the dice leave alone.
export default function rollTubeConfig(
  seed,
  { base = {}, keep = [], paletteNames = [], pinned = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base, blobSeed: String(seed) };
  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${seed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { paletteNames });
    });
  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'blobSeed') config[key] = value;
  });
  return config;
}
