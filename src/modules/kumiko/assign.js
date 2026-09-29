import { createRng, hashSeed } from '@modules/flora';

import { centroid, dist, lerp } from './geometry';
import { fitsShape } from './patterns';
import { POOL_IDS, poolKey } from './renderOptions.mjs';

// The enabled patterns, favourite first: rank is a seeded shuffle and each
// step down the ranking multiplies the weight by (1 - skew).
export function patternPool(config) {
  const enabled = POOL_IDS.filter((id) => config[poolKey(id)]);
  const ids = enabled.length > 0 ? enabled : ['plain'];
  const rng = createRng(`${config.seed}:rank`);
  const ranked = ids
    .map((id) => ({ id, key: rng() }))
    .sort((a, b) => a.key - b.key)
    .map(({ id }) => id);
  return ranked.map((id, rank) => ({
    id,
    weight: (1 - config.poolSkew) ** rank,
  }));
}

export function pick(pool, sides, rng) {
  const fits = pool.filter(({ id }) => fitsShape(id, sides));
  const options = fits.length > 0 ? fits : [{ id: 'plain', weight: 1 }];
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = rng() * total;
  for (let i = 0; i < options.length; i += 1) {
    roll -= options[i].weight;
    if (roll <= 0) return options[i].id;
  }
  return options[options.length - 1].id;
}

// One rng per folded position, so mirrored cells roll the same dice.
export function cellRng(seed, point, grain, salt = '') {
  const key = `${Math.round(point[0] / grain)},${Math.round(point[1] / grain)}`;
  return createRng(`${seed}:${key}:${salt}`);
}

export function createFavourites(config, pool) {
  const cache = new Map();
  return (zone, sides) => {
    const key = `${zone}:${sides}`;
    if (!cache.has(key)) {
      cache.set(
        key,
        pick(pool, sides, createRng(`${config.seed}:zone:${key}`))
      );
    }
    return cache.get(key);
  };
}

export function splitCell(poly) {
  const n = poly.length;
  const c = centroid(poly);
  const m = poly.map((p, i) => lerp(p, poly[(i + 1) % n], 0.5));
  if (n === 3) {
    return [
      [poly[0], m[0], m[2]],
      [m[0], poly[1], m[1]],
      [m[2], m[1], poly[2]],
      [m[0], m[1], m[2]],
    ];
  }
  if (n === 4) {
    return poly.map((p, i) => [p, m[i], c, m[(i + 3) % 4]]);
  }
  if (n === 6) return poly.map((p, i) => [c, p, poly[(i + 1) % n]]);
  return null;
}

const onBoundary = (point, poly) =>
  poly.some((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return Math.abs(dist(a, point) + dist(point, b) - dist(a, b)) < 1e-6;
  });

// A child edge that lies along its parent's side is the parent's jigumi.
export const innerEdges = (parent, children) =>
  children.flatMap((child) =>
    child
      .map((a, i) => [a, child[(i + 1) % child.length]])
      .filter(([a, b]) => !onBoundary(lerp(a, b, 0.5), parent))
  );

export const cellHash = (seed, point) =>
  (hashSeed(`${seed}:${point[0].toFixed(2)},${point[1].toFixed(2)}`) % 10007) /
  10007;
