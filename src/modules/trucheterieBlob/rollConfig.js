import {
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
      }

      if (facet === 'palette') {
        config.blobPalette =
          paletteNames.length > 0 && rng.chance(0.7)
            ? paletteNames[Math.floor(rng() * paletteNames.length)]
            : PALETTE_NONE;
      }
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'blobSeed') config[key] = value;
  });

  return config;
}
