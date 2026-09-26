/* eslint-disable no-param-reassign */
import { cellAt, sampleFood } from './food';
import { geneticDistance } from './genome';

const PROBES = 6;
const WALL_MARGIN = 3;
const TURN_RATE = 2.6;

export function isReady(world, c) {
  const { stats } = c.phenotype;

  return (
    c.state === 'alive' &&
    c.age > stats.maturity &&
    c.mateCooldown <= 0 &&
    c.energy / stats.capacity > stats.fertilityThreshold &&
    world.alive < world.params.populationCap
  );
}

function forage(world, c, hunger, steer) {
  const { stats, temperament } = c.phenotype;
  const reach = stats.sense * 0.5;
  let best = -1;
  let bestAngle = 0;

  for (let k = 0; k < PROBES; k += 1) {
    const angle = c.heading + ((k / PROBES) * 2 - 1) * Math.PI;
    const value = sampleFood(
      world.food,
      c.x + Math.cos(angle) * reach,
      c.z + Math.sin(angle) * reach,
      temperament.diet
    );

    if (value > best) {
      best = value;
      bestAngle = angle;
    }
  }

  if (best > 0.05) {
    steer.x += Math.cos(bestAngle) * hunger * 2;
    steer.z += Math.sin(bestAngle) * hunger * 2;
  }
}

function survey(world, c, neighbors, hunger, steer) {
  const { stats, temperament } = c.phenotype;
  const ready = isReady(world, c);
  let prey = null;
  let mate = null;
  let preyDist = Infinity;
  let mateDist = Infinity;
  let fear = 0;

  neighbors.forEach((n) => {
    if (n === c || n.state !== 'alive') return;

    const dx = n.x - c.x;
    const dz = n.z - c.z;
    const dist = Math.hypot(dx, dz) || 1e-3;
    const ns = n.phenotype.stats;
    const personal = (stats.size + ns.size) * 0.5;
    const falloff = 1 - dist / stats.sense;

    if (dist < personal) {
      steer.x -= (dx / dist) * 1.6;
      steer.z -= (dz / dist) * 1.6;
    }

    const threat =
      n.phenotype.temperament.diet > 0.4 &&
      ns.attack > stats.armor * stats.size;

    if (threat) {
      const w = (1.3 - temperament.aggression) * 2.2 * falloff;

      steer.x -= (dx / dist) * w;
      steer.z -= (dz / dist) * w;
      fear = Math.max(fear, w);
    }

    const edible =
      temperament.diet > 0.4 &&
      hunger > 0.25 &&
      stats.attack > ns.armor * ns.size * 0.8 &&
      (n.lineage !== c.lineage || temperament.aggression > 0.8);

    if (edible && dist < preyDist) {
      prey = n;
      preyDist = dist;
    }

    if (ready && dist < mateDist && isReady(world, n)) {
      if (geneticDistance(c.genome, n.genome) < world.params.compatibility) {
        mate = n;
        mateDist = dist;
      }
    }

    if (n.genome.plan === c.genome.plan) {
      steer.x += (dx / dist) * temperament.sociability * 0.35 * falloff;
      steer.z += (dz / dist) * temperament.sociability * 0.35 * falloff;
    }
  });

  if (prey) {
    const w = 1 + temperament.diet * hunger * 2 + temperament.aggression;

    steer.x += ((prey.x - c.x) / preyDist) * w;
    steer.z += ((prey.z - c.z) / preyDist) * w;
  }

  if (mate) {
    steer.x += ((mate.x - c.x) / mateDist) * 2;
    steer.z += ((mate.z - c.z) / mateDist) * 2;
  }

  return { fear, mate, mateDist, prey, preyDist, ready };
}

function avoidWalls(world, c, steer) {
  const half = world.params.worldSize / 2 - WALL_MARGIN;

  if (c.x > half) steer.x -= (c.x - half) * 2;
  if (c.x < -half) steer.x -= (c.x + half) * 2;
  if (c.z > half) steer.z -= (c.z - half) * 2;
  if (c.z < -half) steer.z -= (c.z + half) * 2;
}

function move(world, c, steer, urgency, dt) {
  const { stats } = c.phenotype;
  const desired = Math.atan2(steer.z, steer.x);
  let turn = desired - c.heading;

  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  c.heading += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, turn));

  const target = stats.speed * Math.min(1.3, 0.25 + 0.75 * urgency);

  c.speed += (target - c.speed) * Math.min(1, dt * 2);
  c.x += Math.cos(c.heading) * c.speed * dt;
  c.z += Math.sin(c.heading) * c.speed * dt;

  const half = world.params.worldSize / 2 - 0.5;

  c.x = Math.max(-half, Math.min(half, c.x));
  c.z = Math.max(-half, Math.min(half, c.z));
  c.stride +=
    (c.speed * dt * (c.genome.plan === 'invader' ? 3 : 1.6)) / stats.size;
}

function eat(world, c, dt) {
  const { stats, temperament } = c.phenotype;
  const i = cellAt(world.food, c.x, c.z);

  if (i < 0) return;

  const { meat, plant } = world.food;
  const plantBite = Math.min(
    plant[i],
    0.9 * stats.size * dt * (1 - temperament.diet)
  );
  const meatBite = Math.min(meat[i], 1.2 * stats.size * dt * temperament.diet);

  plant[i] -= plantBite;
  meat[i] -= meatBite;
  c.energy = Math.min(
    stats.capacity,
    c.energy + plantBite * 1.6 + meatBite * 2.4
  );
}

export default function update(world, c, neighbors, dt, actions) {
  const { stats, temperament } = c.phenotype;
  const hunger = 1 - c.energy / stats.capacity;
  const effort = c.speed / stats.speed;

  c.age += dt;
  c.mateCooldown -= dt;
  c.energy -= stats.metabolism * (1 + 1.5 * effort * effort) * dt;

  if (c.energy <= 0) {
    actions.kill(c, 'starved');

    return;
  }

  if (c.age > stats.lifespan) {
    actions.kill(c, 'old age');

    return;
  }

  const steer = world.scratchSteer;

  c.wander += world.rng.gauss() * dt * (0.6 + 2 * temperament.wanderlust);
  steer.x = Math.cos(c.wander) * (0.3 + 0.6 * temperament.wanderlust);
  steer.z = Math.sin(c.wander) * (0.3 + 0.6 * temperament.wanderlust);

  if (hunger > 0.15) {
    forage(world, c, hunger, steer);
  }

  const seen = survey(world, c, neighbors, hunger, steer);

  avoidWalls(world, c, steer);
  move(
    world,
    c,
    steer,
    Math.hypot(steer.x, steer.z) * 0.5 + seen.fear * 0.3,
    dt
  );
  eat(world, c, dt);

  if (
    seen.prey &&
    seen.preyDist < (stats.size + seen.prey.phenotype.stats.size) * 0.5
  ) {
    actions.attack(c, seen.prey);
  }

  if (
    seen.mate &&
    seen.mateDist < (stats.size + seen.mate.phenotype.stats.size) * 0.6
  ) {
    actions.breed(c, seen.mate);
  } else if (seen.ready) {
    c.lonely += dt;

    if (c.lonely > 12 && c.energy / stats.capacity > 0.85) {
      actions.breed(c, null);
    }
  }
}
