import { createRng } from '@modules/flora';

import {
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
const between = (rng, min, max) => min + (max - min) * rng();

function hex(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h) % 6];
  return `#${[r, g, b]
    .map((v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

const FACINGS_BY_ARRANGEMENT = {
  cluster: [
    ['forward', 3],
    ['random', 3],
    ['inward', 1],
    ['outward', 1],
  ],
  line: [
    ['forward', 5],
    ['random', 1],
    ['inward', 1],
  ],
  ring: [
    ['inward', 3],
    ['outward', 3],
    ['random', 1],
  ],
};

const FACET_ROLLS = {
  // Concrete greys and night blues, or paper now and then.
  location(config, rng) {
    const paper = rng.chance(0.3);
    Object.assign(config, {
      backdrop: 'solid',
      backgroundColor: paper
        ? hex(rng() * 360, between(rng, 0.04, 0.2), between(rng, 0.84, 0.94))
        : hex(
            between(rng, 190, 250),
            between(rng, 0.05, 0.3),
            between(rng, 0.05, 0.16)
          ),
      floor: rng.chance(0.85) ? 'shadow' : 'none',
      location: 'blank',
    });
  },

  flock(config, rng) {
    const arrangement = weighted(rng, [
      ['cluster', 3],
      ['line', 2],
      ['ring', 1],
    ]);
    Object.assign(config, {
      arrangement,
      facing: weighted(rng, FACINGS_BY_ARRANGEMENT[arrangement]),
    });
    if (arrangement === 'ring' && config.birdCount < 4) {
      Object.assign(config, { birdCount: 4 + Math.floor(rng() * 5) });
    }
  },

  bird(config, rng, { species }) {
    if (species?.length) Object.assign(config, { species: pick(rng, species) });
  },

  pose(config, rng) {
    Object.assign(config, {
      gaze: weighted(rng, [
        ['sweep', 5],
        ['camera', 2],
        ['ahead', 1],
      ]),
    });
  },
};

// A flat BirdsArentReal generation config. Facets roll on their own streams
// so one can be held while the others move.
export default function rollFlockConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {}, species = null } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { species });
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
