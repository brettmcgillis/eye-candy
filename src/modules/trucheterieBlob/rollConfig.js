import { alignSymmetry, symmetryAxis } from './design';
import {
  LANE_MODES,
  MEATBALLS,
  PALETTE_NONE,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';
import { createRng } from './rng';

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
  const raw = min + (max - min) * rng();
  const snapped = Math.round(raw / step) * step;
  return Number(snapped.toFixed(6));
}

export function rollableKeys() {
  return new Set(facets().flatMap((facet) => keysInFacet(facet)));
}

// Square on, or the field turned onto its diagonal.
const ROTATION_CHOICES = [0, 45];
export const SYMMETRY_CHANCE = 0.12;
export const IRREGULAR_ROLL_CHANCE = 0.35;
export const STRAIGHTS_ROLL_CHANCE = 0.35;

// Straights roll on sometimes, at a chance per eligible cell in [0.2, 0.7].
export const rollStraights = (rng) =>
  rng.chance(STRAIGHTS_ROLL_CHANCE)
    ? Math.round((0.2 + rng() * 0.5) * 20) / 20
    : 0;

const MEATBALL_CHOICES = [
  MEATBALLS.HIDE_LOOSE,
  MEATBALLS.PRUNE_LOOSE,
  MEATBALLS.KEEP_ALL,
];

// A flat scene-keyed field config — a valid Trucheterie preset. Facets roll on
// their own streams so one can be held while the other moves; `pinned` wins
// over everything; `base` supplies whatever the dice leave alone.
export default function rollBlobConfig(
  seed,
  { base = {}, keep = [], paletteNames = [], pinned = {}, seeds = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base, blobSeed: String(seed) };
  const streams = Object.fromEntries(
    facets().map((facet) => [
      facet,
      createRng(`${seeds[facet] ?? seed}:${facet}`),
    ])
  );

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = streams[facet];
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
      });

      if (facet === 'structure') {
        config.blobMeatballs =
          MEATBALL_CHOICES[Math.floor(rng() * MEATBALL_CHOICES.length)];
        config.planeRotation = rng.chance(0.5)
          ? ROTATION_CHOICES[1]
          : ROTATION_CHOICES[0];
        config.blobSymmetry = rng.chance(SYMMETRY_CHANCE)
          ? symmetryAxis(config.planeRotation, rng.chance(0.5))
          : 'none';
        config.blobIrregular = rng.chance(IRREGULAR_ROLL_CHANCE);
        config.blobStraights = rollStraights(rng);
      }

      if (facet === 'palette') {
        config.blobPalette =
          paletteNames.length > 0
            ? paletteNames[Math.floor(rng() * paletteNames.length)]
            : PALETTE_NONE;
        config.blobPaletteExact = rng.chance(0.5);
        config.blobLaneMode = LANE_MODES[Math.floor(rng() * LANE_MODES.length)];
      }
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'blobSeed') config[key] = value;
  });
  // A pinned rotation (a saved design's, say) still gets a matching axis.
  if (pinned.blobSymmetry == null) {
    config.blobSymmetry = alignSymmetry(
      config.blobSymmetry,
      config.planeRotation
    );
  }

  return config;
}
