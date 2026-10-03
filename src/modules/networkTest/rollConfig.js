/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import {
  FAMILIES,
  FAMILY_KINDS,
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
const round = (v, places = 2) => Number(v.toFixed(places));

function hsl(hue, saturation, lightness) {
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
  return rgbToHex([r, g, b].map((v) => (v + m) * 255));
}

const FAMILY_KEYS = {
  attractor: 'weightAttractor',
  cluster: 'weightCluster',
  noise: 'weightNoise',
  primitive: 'weightPrimitive',
};
const BACKBONES = ['ruleMst', 'ruleRng', 'ruleGabriel'];
const EXTRAS = ['ruleKnn', 'ruleBand', 'ruleChain'];
const SOLO_RULES = [...BACKBONES, ...EXTRAS];

const FACET_ROLLS = {
  // A blend most of the time, so the eye cannot name the generator; now and
  // then a single family, to show one technique plainly.
  points(config, rng) {
    const mode = weighted(rng, [
      ['solo', 1],
      ['duo', 1.5],
      ['mix', 2.5],
    ]);
    const order = [...FAMILIES];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const weights = Object.fromEntries(FAMILIES.map((f) => [f, 0]));
    if (mode === 'solo') weights[order[0]] = 1;
    else if (mode === 'duo') {
      weights[order[0]] = round(between(rng, 0.5, 1));
      weights[order[1]] = round(between(rng, 0.3, 1));
    } else {
      FAMILIES.forEach((f) => {
        weights[f] = rng.chance(0.75) ? round(between(rng, 0.2, 1)) : 0;
      });
      if (FAMILIES.every((f) => weights[f] === 0)) weights[order[0]] = 1;
    }
    FAMILIES.forEach((f) => {
      config[FAMILY_KEYS[f]] = weights[f];
      config[`${f}Kind`] = rng.chance(0.8) ? 'any' : pick(rng, FAMILY_KINDS[f]);
    });
    const cube = rng.chance(0.5);
    Object.assign(config, {
      domainX: cube ? 1.2 : round(between(rng, 0.8, 1.6)),
      domainY: cube ? 1 : round(between(rng, 0.6, 1.3)),
      domainZ: cube ? 1 : round(between(rng, 0.6, 1.4)),
      shapeCount: mode === 'solo' && rng.chance(0.3) ? 1 : config.shapeCount,
      warpAmount: rng.chance(0.3)
        ? round(between(rng, 0.6, 1.1))
        : config.warpAmount,
    });
  },

  // One backbone graph at full weight, a few others mixed in partly; a
  // quarter of the time a single rule alone.
  wiring(config, rng) {
    const all = [...SOLO_RULES];
    all.forEach((key) => {
      config[key] = 0;
    });
    if (rng.chance(0.25)) {
      config[pick(rng, SOLO_RULES)] = 1;
      config.ruleBridge = rng.chance(0.5) ? 1 : 0;
    } else {
      config[pick(rng, BACKBONES)] = 1;
      [...BACKBONES, ...EXTRAS].forEach((key) => {
        if (config[key] === 0 && rng.chance(0.4)) {
          config[key] = round(
            between(rng, 0.15, key === 'ruleChain' ? 1 : 0.6)
          );
        }
      });
      config.ruleBridge =
        config.shapeCount > 1 ? round(between(rng, 0.6, 1)) : 0;
    }
  },

  // glow: light on a near-black ground; ink: dark lines on paper.
  color(config, rng, { palettes }) {
    const ink = rng.chance(0.3);
    const hue = rng() * 360;
    const accent =
      hue + (rng.chance(0.5) ? between(rng, 140, 220) : between(rng, 25, 60));
    const style = ink
      ? weighted(rng, [
          ['dot', 2],
          ['ring', 2],
          ['halo', 0.3],
        ])
      : weighted(rng, [
          ['halo', 3],
          ['dot', 2],
          ['ring', 1],
        ]);
    Object.assign(config, {
      mood: ink ? 'ink' : 'glow',
      nodeStyle: style,
      paletteName:
        palettes?.length && rng.chance(0.45) ? pick(rng, palettes) : 'None',
    });
    if (ink) {
      Object.assign(config, {
        background: hsl(
          between(rng, 25, 55),
          between(rng, 0.15, 0.35),
          between(rng, 0.88, 0.95)
        ),
        bridgeColor: hsl(
          accent,
          between(rng, 0.5, 0.8),
          between(rng, 0.35, 0.45)
        ),
        edgeColor: hsl(hue, between(rng, 0.1, 0.35), between(rng, 0.12, 0.25)),
        edgeIntensity: 1,
        edgeOpacity: round(between(rng, 0.55, 0.9)),
        nodeColor: hsl(hue, between(rng, 0.2, 0.5), between(rng, 0.12, 0.3)),
        nodeIntensity: 1,
        pulseColor: hsl(accent, 0.7, 0.45),
        pulseIntensity: 1,
      });
    } else {
      Object.assign(config, {
        background: hsl(
          hue + 200,
          between(rng, 0.2, 0.5),
          between(rng, 0.015, 0.05)
        ),
        bridgeColor: hsl(
          accent,
          between(rng, 0.6, 0.95),
          between(rng, 0.55, 0.7)
        ),
        edgeColor: hsl(
          hue + between(rng, -20, 20),
          between(rng, 0.5, 0.9),
          between(rng, 0.4, 0.6)
        ),
        nodeColor: hsl(hue, between(rng, 0.4, 0.9), between(rng, 0.6, 0.78)),
        pulseColor: hsl(accent, between(rng, 0, 0.4), 0.92),
      });
    }
  },

  atmosphere(config, rng) {
    const ink = config.mood === 'ink';
    Object.assign(config, {
      edgeSoftness: ink ? round(between(rng, 0, 0.25)) : config.edgeSoftness,
      postBloomEnabled: !ink,
      postGradeTint: '#ffffff',
      postGradeVignette: ink
        ? round(between(rng, 0, 0.15))
        : config.postGradeVignette,
      postGrainEnabled: ink ? rng.chance(0.5) : rng.chance(0.2),
    });
  },
};

// A flat NetworkTest config — a valid preset. Facets roll on their own
// streams so one can be held while the others move.
export default function rollNetworkTestConfig(
  batchSeed,
  { base = {}, keep = [], palettes = null, pinned = {} } = {}
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
      FACET_ROLLS[facet]?.(config, rng, { palettes });
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
