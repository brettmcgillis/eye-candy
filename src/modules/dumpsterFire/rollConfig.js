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

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

const between = (rng, min, max) =>
  Number((min + (max - min) * rng()).toFixed(2));

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

const FACET_ROLLS = {
  trash(config, rng) {
    Object.assign(config, {
      trashLayout: rng.chance(0.9) ? 'rolled' : 'authored',
    });
  },

  // Brick reds and clays, or bare concrete now and then.
  wall(config, rng) {
    const concrete = rng.chance(0.3);
    if (rng.chance(0.3)) {
      Object.assign(config, {
        brickWallCrumble: 0,
        brickWallHoles: 0,
        brickWallRubble: 0,
      });
    }
    Object.assign(config, {
      brickWallEnabled: rng.chance(0.92),
      brickWallTintColor: concrete
        ? hex(
            between(rng, 20, 50),
            between(rng, 0.03, 0.1),
            between(rng, 0.5, 0.68)
          )
        : hex(
            between(rng, 2, 24),
            between(rng, 0.3, 0.55),
            between(rng, 0.36, 0.52)
          ),
    });
  },

  smoke(config, rng) {
    Object.assign(config, {
      smokeMirror: rng.chance(0.35),
      // One smoke system at a time; plume + particles (`mixed`) is the
      // scene's authored default, never rolled.
      smokeSystem: weighted(rng, [
        ['plume', 3],
        ['particles', 2],
        ['layered', 2],
        ['volumetric', 1],
      ]),
    });
  },

  dumpster(config, rng) {
    Object.assign(config, {
      dumpsterContents: weighted(rng, [
        ['full', 4],
        ['pile', 2],
        ['empty', 1],
      ]),
    });
  },

  // The scene's paper-white street, or its Dark Mode lit by the fire.
  stage(config, rng, { pinned }) {
    const rolledMood = weighted(rng, [
      ['day', 3],
      ['night', 2],
    ]);
    const mood = pinned.mood ?? rolledMood;
    if (mood === 'night') {
      const hue = between(rng, 195, 225);
      Object.assign(config, {
        mood,
        sceneAmbientIntensity: 0,
        sceneBackgroundColor: hex(
          hue,
          between(rng, 0.15, 0.35),
          between(rng, 0.04, 0.08)
        ),
        sceneDirectionalIntensity: between(rng, 1.1, 1.8),
        sceneEnvMapIntensity: 0,
        sceneFogColor: hex(
          hue,
          between(rng, 0.15, 0.3),
          between(rng, 0.07, 0.11)
        ),
      });
      return;
    }
    const paper = hex(
      rng() * 360,
      between(rng, 0.02, 0.12),
      between(rng, 0.86, 0.94)
    );
    Object.assign(config, {
      mood,
      sceneAmbientIntensity: between(rng, 0.6, 1.1),
      sceneBackgroundColor: paper,
      sceneDirectionalIntensity: between(rng, 0.8, 1.5),
      sceneEnvMapIntensity: between(rng, 0.6, 1.3),
      sceneFogColor: paper,
    });
  },

  // The whole plume wants the frame it was fitted to; tight on the
  // dumpster, a crop is welcome.
  camera(config, rng, { pinned }) {
    const viewFrame =
      pinned.viewFrame ??
      weighted(rng, [
        ['scene', 3],
        ['dumpster', 1],
      ]);
    const zoom = viewFrame === 'scene' ? [0.88, 1.08] : [0.95, 1.3];
    Object.assign(config, {
      viewFrame,
      viewZoom: between(rng, ...zoom),
    });
  },
};

// A flat DumpsterFire generation config. Facets roll on their own streams
// so one can be held while the others move.
export default function rollDumpsterConfig(
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
      FACET_ROLLS[facet]?.(config, rng, { pinned });
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

// Math.random for the scene's particle and flame sims while a CLI burns a
// generation, so it burns the same way every run.
export const burnRandom = (name) => createRng(`${name}:burn`);
