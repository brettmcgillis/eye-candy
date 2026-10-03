import { createRng } from '@modules/flora';

import {
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

// The four lights the forest is seen in. Presets spread one of these; the
// mood roll picks one and jitters it.
export const MOODS = {
  overcast: {
    skyZenith: '#7d858b',
    skyHorizon: '#b7bbb8',
    sunGlowColor: '#d9d6cc',
    sunGlow: 0.15,
    fogColor: '#a9aeab',
    fogDensity: 0.0045,
    fogHeight: 45,
    hazeDistance: 1100,
    exposure: 1,
    lightSunColor: '#e4e2da',
    lightSunIntensity: 0.5,
    lightSunElevation: 48,
    lightSkySkyColor: '#b9bfc2',
    lightSkyGroundColor: '#3b3a30',
    lightSkyIntensity: 1.3,
  },
  dusk: {
    skyZenith: '#2b3550',
    skyHorizon: '#8a6f72',
    sunGlowColor: '#ff9a5c',
    sunGlow: 0.9,
    fogColor: '#5e5a66',
    fogDensity: 0.0035,
    fogHeight: 30,
    hazeDistance: 1400,
    exposure: 1.15,
    lightSunColor: '#ff9f6b',
    lightSunIntensity: 0.9,
    lightSunElevation: 5,
    lightSkySkyColor: '#58607a',
    lightSkyGroundColor: '#2a2420',
    lightSkyIntensity: 0.7,
  },
  night: {
    skyZenith: '#05070c',
    skyHorizon: '#141a24',
    sunGlowColor: '#8fa6c8',
    sunGlow: 0.25,
    fogColor: '#151b24',
    fogDensity: 0.005,
    fogHeight: 25,
    hazeDistance: 800,
    exposure: 1.4,
    lightSunColor: '#9fb4d6',
    lightSunIntensity: 0.25,
    lightSunElevation: 38,
    lightSkySkyColor: '#1c2433',
    lightSkyGroundColor: '#07080a',
    lightSkyIntensity: 0.35,
  },
  golden: {
    skyZenith: '#8fa3b4',
    skyHorizon: '#e8c99a',
    sunGlowColor: '#ffd48a',
    sunGlow: 1.2,
    fogColor: '#d6b98e',
    fogDensity: 0.003,
    fogHeight: 35,
    hazeDistance: 1500,
    exposure: 1,
    lightSunColor: '#ffcf8f',
    lightSunIntensity: 1.8,
    lightSunElevation: 12,
    lightSkySkyColor: '#c9b79a',
    lightSkyGroundColor: '#4a3b28',
    lightSkyIntensity: 1,
  },
};

const CONCRETES = ['#8f8b83', '#868a8c', '#9a9284', '#7b7a74', '#a39d92'];
const MOSSES = ['#4b5a2a', '#3e4f27', '#5b6331', '#46512f'];
const GRIMES = ['#2c2822', '#23221f', '#33291f'];

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

const FACET_ROLLS = {
  form(config, rng) {
    Object.assign(config, {
      family: weighted(rng, [
        ['monolith', 4],
        ['habitable', 3],
        ['spomenik', 2],
      ]),
      layout: weighted(rng, [
        ['slab', 3],
        ['tower', 2],
        ['stack', 2],
      ]),
      motif: pick(rng, ['fan', 'split', 'ring', 'pierced']),
    });
  },

  weather(config, rng) {
    Object.assign(config, {
      concreteColor: pick(rng, CONCRETES),
      grimeColor: pick(rng, GRIMES),
      mossColor: pick(rng, MOSSES),
    });
  },

  site(config, rng) {
    Object.assign(config, {
      biome: weighted(rng, [
        ['conifer', 4],
        ['mixed', 3],
        ['deciduous', 2],
        ['bare', 1.5],
      ]),
    });
  },

  mood(config, rng) {
    const mood = weighted(rng, [
      ['overcast', 4],
      ['dusk', 2],
      ['night', 1.5],
      ['golden', 1.5],
    ]);
    const base = MOODS[mood];
    Object.assign(config, base, {
      fogDensity: Number((base.fogDensity * rng.range(0.7, 1.4)).toFixed(4)),
      fogHeight: Math.round(base.fogHeight * rng.range(0.7, 1.5)),
      lightSunAzimuth: Math.round(rng.range(-180, 180)),
      lightSunElevation: Math.round(
        base.lightSunElevation * rng.range(0.7, 1.3)
      ),
    });
  },
};

// A flat Brutalist config — a valid preset. Facets roll on their own streams
// so one can be held while the others move.
export default function rollBrutalistConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {} } = {}
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
