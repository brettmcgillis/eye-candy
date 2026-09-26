/* eslint-disable no-param-reassign */
import { FOOD_RES } from './params';

export function createFood(worldSize, rng, start) {
  const cells = FOOD_RES * FOOD_RES;
  const plant = new Float32Array(cells);
  const meat = new Float32Array(cells);

  for (let i = 0; i < cells; i += 1) {
    plant[i] = rng() < start ? rng.range(0.3, 1) : 0;
  }

  return {
    cellSize: worldSize / FOOD_RES,
    meat,
    next: new Float32Array(cells),
    plant,
    worldSize,
  };
}

export function cellAt(food, x, z) {
  const cx = Math.floor((x / food.worldSize + 0.5) * FOOD_RES);
  const cz = Math.floor((z / food.worldSize + 0.5) * FOOD_RES);

  if (cx < 0 || cz < 0 || cx >= FOOD_RES || cz >= FOOD_RES) {
    return -1;
  }

  return cx + cz * FOOD_RES;
}

export function sampleFood(food, x, z, meatWeight) {
  const i = cellAt(food, x, z);

  return i < 0
    ? -1
    : food.plant[i] * (1 - meatWeight) + food.meat[i] * meatWeight;
}

export function depositMeat(food, x, z, amount) {
  const i = cellAt(food, x, z);

  if (i < 0) return;

  const cx = i % FOOD_RES;
  const cz = Math.floor(i / FOOD_RES);

  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = cx + dx;
      const nz = cz + dz;

      if (nx >= 0 && nz >= 0 && nx < FOOD_RES && nz < FOOD_RES) {
        food.meat[nx + nz * FOOD_RES] +=
          amount * (dx === 0 && dz === 0 ? 0.4 : 0.075);
      }
    }
  }
}

export function stepFood(food, dt, params, rng) {
  const { meat, next, plant } = food;

  for (let cz = 0; cz < FOOD_RES; cz += 1) {
    for (let cx = 0; cx < FOOD_RES; cx += 1) {
      const i = cx + cz * FOOD_RES;
      let neighbors = 0;

      if (cx > 0) neighbors += plant[i - 1];
      if (cx < FOOD_RES - 1) neighbors += plant[i + 1];
      if (cz > 0) neighbors += plant[i - FOOD_RES];
      if (cz < FOOD_RES - 1) neighbors += plant[i + FOOD_RES];

      const f = plant[i];
      const rot = meat[i] * params.meatDecay * dt;
      const spread = params.foodSpread * Math.max(0, neighbors / 4 - f);
      const seed = rng() < 0.0004 * dt ? 0.2 : 0;

      meat[i] -= rot;
      next[i] = Math.min(
        1,
        f + dt * (params.foodGrowth * f * (1 - f) + spread) + rot * 0.6 + seed
      );
    }
  }

  food.plant = next;
  food.next = plant;
}
