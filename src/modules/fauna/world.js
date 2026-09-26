/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';

import update from './behavior';
import { createFood, depositMeat, stepFood } from './food';
import { crossover, mutate } from './genome';
import { DEFAULT_WORLD_PARAMS, PLANS, SNAPSHOT_STRIDE } from './params';
import express from './phenotype';
import createSpatialHash from './spatialHash';

export const CAPACITY = 512;
const DYING_SECONDS = 1.4;
const SPAWN_SECONDS = 0.9;
const FOOD_STEP = 0.25;

function allocateSlot(world) {
  return world.freeSlots.length ? world.freeSlots.pop() : -1;
}

export function spawn(world, genome, x, z, lineage = {}) {
  const slot = allocateSlot(world);

  if (slot < 0) return null;

  const phenotype = express(genome, world.params);
  const c = {
    age: 0,
    children: 0,
    energy: lineage.energy ?? phenotype.stats.capacity * 0.6,
    genome,
    generation: lineage.generation ?? 0,
    heading: world.rng() * Math.PI * 2,
    hybrid: lineage.hybrid ?? false,
    id: world.nextId,
    kills: 0,
    lineage: lineage.lineage ?? world.nextId,
    lonely: 0,
    mateCooldown: phenotype.stats.maturity,
    parents: lineage.parents ?? [],
    phenotype,
    slot,
    speed: 0,
    state: 'alive',
    stride: world.rng() * 2,
    wander: world.rng() * Math.PI * 2,
    x,
    z,
  };

  world.nextId += 1;
  world.slots[slot] = c;
  world.byId.set(c.id, c);
  world.alive += 1;
  world.stats.maxGeneration = Math.max(world.stats.maxGeneration, c.generation);
  world.events.push({ genome, id: c.id, slot, type: 'spawn' });

  return c;
}

function createActions(world) {
  const kill = (c, cause) => {
    if (c.state !== 'alive') return;

    c.state = 'dying';
    c.cause = cause;
    c.dyingT = 0;
    world.alive -= 1;
    world.stats.deaths += 1;
    world.stats.causes[cause] = (world.stats.causes[cause] ?? 0) + 1;

    if (cause !== 'eaten') {
      depositMeat(world.food, c.x, c.z, c.phenotype.stats.size * 0.8);
    }
  };

  const attack = (hunter, prey) => {
    const power = hunter.phenotype.stats.attack * (0.6 + 0.8 * world.rng());
    const ps = prey.phenotype.stats;

    if (power > ps.armor * ps.size) {
      kill(prey, 'eaten');
      hunter.kills += 1;
      hunter.energy = Math.min(
        hunter.phenotype.stats.capacity,
        hunter.energy +
          ps.size * (0.5 + hunter.phenotype.temperament.diet) +
          prey.energy * 0.5
      );
      depositMeat(world.food, prey.x, prey.z, ps.size * 0.3);
    } else {
      hunter.energy -= hunter.phenotype.stats.capacity * 0.06;
    }
  };

  const breed = (a, b) => {
    const { rng, params } = world;
    const genome = b
      ? mutate(crossover(a.genome, b.genome, rng), rng, params.mutationScale)
      : mutate(a.genome, rng, params.mutationScale * 1.6);
    const parents = b ? [a, b] : [a];
    const gift = b ? 0.3 : 0.45;
    let energy = 0;

    parents.forEach((p) => {
      const share = p.phenotype.stats.capacity * gift;

      p.energy -= share;
      p.children += 1;
      p.lonely = 0;
      p.mateCooldown = 8 + (1 - p.phenotype.temperament.fertility) * 22;
      energy += share * 0.85;
    });

    const angle = rng() * Math.PI * 2;
    const child = spawn(
      world,
      genome,
      (a.x + (b?.x ?? a.x)) / 2 + Math.cos(angle) * 0.6,
      (a.z + (b?.z ?? a.z)) / 2 + Math.sin(angle) * 0.6,
      {
        energy,
        generation: Math.max(...parents.map((p) => p.generation)) + 1,
        hybrid:
          parents.some((p) => p.hybrid) ||
          (b !== null && a.genome.plan !== b.genome.plan),
        lineage: (b && b.genome.genes.dominance > a.genome.genes.dominance
          ? b
          : a
        ).lineage,
        parents: parents.map((p) => p.id),
      }
    );

    if (child) {
      world.stats.births += 1;
      child.energy = Math.min(child.energy, child.phenotype.stats.capacity);
    }
  };

  return { attack, breed, kill };
}

export function createWorld(founders, params = {}, seed = 'world') {
  const merged = { ...DEFAULT_WORLD_PARAMS, ...params };
  const rng = createRng(seed);
  const world = {
    alive: 0,
    byId: new Map(),
    events: [],
    food: createFood(merged.worldSize, rng, merged.foodStart),
    foodClock: 0,
    freeSlots: Array.from({ length: CAPACITY }, (_, i) => CAPACITY - 1 - i),
    hash: createSpatialHash(merged.worldSize, 4),
    nextId: 1,
    params: merged,
    rng,
    scratchNeighbors: [],
    scratchSteer: { x: 0, z: 0 },
    slots: new Array(CAPACITY).fill(null),
    stats: { births: 0, causes: {}, deaths: 0, maxGeneration: 0 },
    time: 0,
  };

  world.actions = createActions(world);

  const reach = merged.worldSize * 0.32;

  founders.forEach((genome) => {
    const cx = rng.range(-reach, reach);
    const cz = rng.range(-reach, reach);
    let lineage = null;

    for (let k = 0; k < merged.founderCopies; k += 1) {
      const c = spawn(
        world,
        genome,
        cx + rng.signed() * 2.5,
        cz + rng.signed() * 2.5,
        {
          lineage: lineage ?? undefined,
        }
      );

      lineage = lineage ?? c?.lineage;

      if (c) c.age = rng() * c.phenotype.stats.maturity;
    }
  });

  return world;
}

export function setWorldParams(world, params) {
  Object.assign(world.params, params);
  world.slots.forEach((c) => {
    if (c) c.phenotype = express(c.genome, world.params);
  });
}

export function stepWorld(world, dt) {
  const { hash, scratchNeighbors, slots } = world;

  hash.clear();
  slots.forEach((c) => {
    if (c?.state === 'alive') hash.insert(c);
  });

  for (let i = 0; i < slots.length; i += 1) {
    const c = slots[i];

    if (c?.state === 'alive') {
      update(
        world,
        c,
        hash.query(c.x, c.z, c.phenotype.stats.sense, scratchNeighbors),
        dt,
        world.actions
      );
    } else if (c) {
      c.dyingT += dt;

      if (c.dyingT > DYING_SECONDS) {
        slots[i] = null;
        world.byId.delete(c.id);
        world.freeSlots.push(i);
        world.events.push({ id: c.id, slot: i, type: 'despawn' });
      }
    }
  }

  world.foodClock += dt;

  if (world.foodClock >= FOOD_STEP) {
    stepFood(world.food, world.foodClock, world.params, world.rng);
    world.foodClock = 0;
  }

  world.time += dt;
}

export function writeSnapshot(world, out) {
  out.fill(0);
  world.slots.forEach((c, slot) => {
    if (!c) return;

    const i = slot * SNAPSHOT_STRIDE;
    const { plan } = c.genome;
    const { size } = c.phenotype.stats;
    const fade =
      c.state === 'alive'
        ? Math.min(1, c.age / SPAWN_SECONDS)
        : Math.max(0, 1 - c.dyingT / DYING_SECONDS);
    const bob = Math.sin(world.time * 1.3 + c.id) * 0.08 * size;
    const hop = Math.abs(Math.sin(c.stride * Math.PI)) * 0.05 * size;

    out[i] = c.x;
    out[i + 1] =
      plan === 'swimmer' ? size * 0.5 + bob : plan === 'invader' ? hop : 0; // eslint-disable-line no-nested-ternary
    out[i + 2] = c.z;
    out[i + 3] = c.heading;
    out[i + 4] = size;
    out[i + 5] = c.stride;
    out[i + 6] = fade;
    out[i + 7] = c.id;
  });

  return out;
}

export function worldSummary(world) {
  const plans = Object.fromEntries(PLANS.map((plan) => [plan, 0]));
  const lineages = new Set();
  let hybrids = 0;

  world.slots.forEach((c) => {
    if (c?.state !== 'alive') return;

    plans[c.genome.plan] += 1;
    lineages.add(c.lineage);
    hybrids += c.hybrid ? 1 : 0;
  });

  return {
    ...world.stats,
    alive: world.alive,
    hybrids,
    lineages: lineages.size,
    plans,
    time: world.time,
  };
}

export function inspectCreature(world, id) {
  const c = world.byId.get(id);

  if (!c) return null;

  return {
    age: c.age,
    cause: c.cause ?? null,
    children: c.children,
    energy: c.energy,
    generation: c.generation,
    genome: c.genome,
    hybrid: c.hybrid,
    id: c.id,
    kills: c.kills,
    lineage: c.lineage,
    parents: c.parents,
    phenotype: c.phenotype,
    slot: c.slot,
    state: c.state,
  };
}
