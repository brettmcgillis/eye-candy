/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';

import { DESIGNS } from './designs';
import { TRADITIONAL_PALETTES } from './palettes';
import * as schema from './renderOptions.mjs';

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => min + (max - min) * rng();
const round = (v, places = 2) => Number(v.toFixed(places));

function rollValue(item, rng) {
  const { max, min, step } = item.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

const listOf = (text, allowed) => {
  const items = String(text ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item));
  return items.length ? items : null;
};

export const FACET_ROLLS = {
  design(config, rng, { designPool, pinned }) {
    config.design =
      pinned.design ??
      pick(
        rng,
        listOf(designPool, schema.DESIGN_CHOICES) ?? schema.DESIGN_CHOICES
      );
    const [lo, hi] = DESIGNS[config.design].knots;
    config.knotsAcross = Math.round(between(rng, lo, hi) / 2) * 2;
    const shape = rng();
    if (shape < 0.1) config.rugAspect = round(between(rng, 2.4, 3));
    else if (shape < 0.18) config.rugAspect = round(between(rng, 1, 1.2));
    else config.rugAspect = round(between(rng, 1.3, 1.65));
    config.pendants = rng.chance(0.8);
    config.spandrels = rng.chance(0.75);
  },

  border(config, rng) {
    config.borderMotif = rng.chance(0.85)
      ? 'auto'
      : pick(
          rng,
          schema.BORDER_CHOICES.filter(
            (id) => !/argyle|reversal|turboflex/u.test(id)
          )
        );
    config.guardMotif = rng.chance(0.8)
      ? 'auto'
      : pick(rng, schema.GUARD_CHOICES.slice(0, -1));
    config.cornerRosettes = rng.chance(0.6);
    config.selvedge = pick(rng, ['dark', 'dark', 'red', 'blue', 'camel']);
  },

  // Most rolled rugs are plain Persian; `houseRate` of them weave the house
  // motifs in, each placement on or off with its own strength.
  mine(config, rng, { houseRate = 0.5 }) {
    const keys = [
      'mineMedallion',
      'mineBorder',
      'mineGuard',
      'mineField',
      'mineSignature',
    ];
    keys.forEach((key) => {
      config[key] = 0;
    });
    if (!rng.chance(houseRate)) return;
    const ranges = {
      mineBorder: [0.4, 1],
      mineField: [0.1, 0.35],
      mineGuard: [0.3, 1],
      mineMedallion: [0.5, 1],
      mineSignature: [0.6, 1],
    };
    keys.forEach((key) => {
      if (rng.chance(0.45)) config[key] = round(between(rng, ...ranges[key]));
    });
    if (keys.every((key) => config[key] === 0)) config.mineSignature = 1;
    const weights = ['weightArgyle', 'weightReversal', 'weightTurboflex'];
    weights.forEach((key) => {
      config[key] = rng.chance(0.65) ? round(between(rng, 0.4, 1)) : 0;
    });
    if (weights.every((key) => config[key] === 0))
      config[pick(rng, weights)] = 1;
  },

  palette(config, rng, { palettePool }) {
    const pool =
      listOf(palettePool, schema.PALETTE_CHOICES) ?? TRADITIONAL_PALETTES;
    config.palette = pick(rng, pool);
    ['groundRole', 'borderRole', 'medallionRole'].forEach((key) => {
      config[key] = 'auto';
    });
    if (rng.chance(0.25)) {
      config[pick(rng, ['groundRole', 'borderRole', 'medallionRole'])] = pick(
        rng,
        ['red', 'blue', 'ivory', 'dark', 'green', 'gold']
      );
    }
  },

  room(config, rng) {
    config.hangStyle = pick(rng, ['rod', 'rod', 'clips', 'corners']);
    config.clipCount = 3 + Math.floor(rng() * 5);
    if (!rng.chance(0.3)) config.cornerFlip = 0;
  },
};

// A flat config that is a valid preset. Facets roll on their own streams,
// so one can be held while the others move.
export default function rollRugConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {}, ...context } = {}
) {
  const config = { ...schema.sceneDefaults(), ...base };
  schema
    .facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      schema.keysInFacet(facet).forEach((key) => {
        const item = schema.RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { ...context, pinned });
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
