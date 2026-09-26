import {
  BITMAP_HALF,
  BITMAP_ROWS,
  GENES,
  LEG_ROW_START,
  PLANS,
  TEMPERAMENT_GENES,
} from './params';

const GENE_NAMES = Object.keys(GENES);
const BIT_COUNT = BITMAP_ROWS * BITMAP_HALF;
const MIN_FILLED_BITS = 7;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function decode(genome, name) {
  const [min, max] = GENES[name];

  return min + (max - min) * genome.genes[name];
}

function popcount(bits) {
  return bits.reduce((sum, bit) => sum + bit, 0);
}

function pickPlan(rng, weights) {
  const total = PLANS.reduce((sum, plan) => sum + (weights[plan] ?? 0), 0);

  if (total <= 0) {
    return PLANS[Math.floor(rng() * PLANS.length)];
  }

  let roll = rng() * total;

  return (
    PLANS.find((plan) => {
      roll -= weights[plan] ?? 0;

      return roll <= 0;
    }) ?? PLANS[0]
  );
}

function rollBitmap(rng, density) {
  let bitmap;

  do {
    bitmap = Array.from({ length: BIT_COUNT }, () => (rng() < density ? 1 : 0));
  } while (popcount(bitmap) < MIN_FILLED_BITS);

  return bitmap;
}

function rollLegs(rng, bitmap) {
  return Array.from(
    { length: (BITMAP_ROWS - LEG_ROW_START) * BITMAP_HALF },
    (_, i) => {
      const bit = bitmap[LEG_ROW_START * BITMAP_HALF + i];

      return rng() < 0.4 ? 1 - bit : bit;
    }
  );
}

export function randomGenome(rng, options = {}) {
  const plan = pickPlan(rng, {
    blob: options.planBlob ?? 1,
    invader: options.planInvader ?? 1,
    swimmer: options.planSwimmer ?? 1,
  });
  const bitmap = rollBitmap(rng, options.bitDensity ?? 0.5);
  const genes = Object.fromEntries(GENE_NAMES.map((name) => [name, rng()]));
  const tentacled =
    plan === 'swimmer' || rng() < (options.tentacleChance ?? 0.3);

  genes.tentacles = tentacled ? rng.range(0.2, 1) : rng.range(0, 0.14);
  genes.diet =
    rng() < (options.carnivoreChance ?? 0.25)
      ? rng.range(0.55, 1)
      : rng() * 0.35;

  return {
    bitmap,
    genes,
    legs: rollLegs(rng, bitmap),
    plan,
    rows: Array.from({ length: BITMAP_ROWS }, () => rng()),
  };
}

function mixHue(a, b, t) {
  let delta = b - a;

  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;

  return (a + delta * t + 1) % 1;
}

export function crossover(a, b, rng) {
  const [dominant, recessive] =
    a.genes.dominance >= b.genes.dominance ? [a, b] : [b, a];
  const bitmap = [];
  const legs = [];
  const rows = [];

  for (let r = 0; r < BITMAP_ROWS; r += 1) {
    const src = rng() < 0.5 ? a : b;

    for (let c = 0; c < BITMAP_HALF; c += 1) {
      bitmap.push(src.bitmap[r * BITMAP_HALF + c]);

      if (r >= LEG_ROW_START) {
        legs.push(src.legs[(r - LEG_ROW_START) * BITMAP_HALF + c]);
      }
    }

    rows.push(src.rows[r]);
  }

  const genes = {};

  GENE_NAMES.forEach((name) => {
    const t = rng() < 0.5 ? Math.round(rng()) : rng();

    genes[name] =
      name === 'hue'
        ? mixHue(a.genes.hue, b.genes.hue, t)
        : a.genes[name] + (b.genes[name] - a.genes[name]) * t;
  });

  return {
    bitmap,
    genes,
    legs,
    plan: rng() < 0.75 ? dominant.plan : recessive.plan,
    rows,
  };
}

export function mutate(genome, rng, scale = 1) {
  const rate = (0.02 + 0.2 * genome.genes.mutation) * scale;
  const flip = (bit) => (rng() < rate * 0.12 ? 1 - bit : bit);
  const next = {
    bitmap: genome.bitmap.map(flip),
    genes: { ...genome.genes },
    legs: genome.legs.map(flip),
    plan: genome.plan,
    rows: genome.rows.map((v) => clamp01(v + rng.gauss() * rate * 0.3)),
  };

  GENE_NAMES.forEach((name) => {
    const drifted = next.genes[name] + rng.gauss() * rate * 0.22;

    next.genes[name] = name === 'hue' ? (drifted + 1) % 1 : clamp01(drifted);
  });

  if (rng() < rate * 0.05) {
    next.plan = PLANS[Math.floor(rng() * PLANS.length)];
  }

  while (popcount(next.bitmap) < MIN_FILLED_BITS) {
    next.bitmap[Math.floor(rng() * BIT_COUNT)] = 1;
  }

  return next;
}

export function geneticDistance(a, b) {
  let hamming = 0;

  for (let i = 0; i < BIT_COUNT; i += 1) {
    hamming += a.bitmap[i] === b.bitmap[i] ? 0 : 1;
  }

  const hueDelta = Math.abs(a.genes.hue - b.genes.hue);
  const temperament =
    TEMPERAMENT_GENES.reduce(
      (sum, name) => sum + Math.abs(a.genes[name] - b.genes[name]),
      0
    ) / TEMPERAMENT_GENES.length;

  return (
    (hamming / BIT_COUNT) * 0.4 +
    (a.plan === b.plan ? 0 : 0.25) +
    Math.min(hueDelta, 1 - hueDelta) * 0.3 +
    temperament * 0.3
  );
}

export function fullBitmap(genome, frame = 0) {
  const grid = [];

  for (let r = 0; r < BITMAP_ROWS; r += 1) {
    const row = [];
    const legRow = frame === 1 && r >= LEG_ROW_START;

    for (let x = 0; x < BITMAP_HALF * 2; x += 1) {
      const c = x < BITMAP_HALF ? x : BITMAP_HALF * 2 - 1 - x;

      row.push(
        legRow
          ? genome.legs[(r - LEG_ROW_START) * BITMAP_HALF + c]
          : genome.bitmap[r * BITMAP_HALF + c]
      );
    }

    grid.push(row);
  }

  return grid;
}
