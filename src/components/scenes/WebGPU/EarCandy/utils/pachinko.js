/* eslint-disable no-param-reassign */
export const MAX_PARTICLES = 320;
export const MAX_BUMPERS = 96;
export const SPAWN_POINTS_MAX = 6;

const SUBSTEP = 1 / 150;
const HIT_COOLDOWN = 0.07;
const MIN_IMPACT = 4;

export function createSim() {
  return {
    alive: new Uint8Array(MAX_PARTICLES),
    bumpers: [],
    px: new Float32Array(MAX_PARTICLES),
    py: new Float32Array(MAX_PARTICLES),
    spawnAccumulator: 0,
    vx: new Float32Array(MAX_PARTICLES),
    vy: new Float32Array(MAX_PARTICLES),
  };
}

export function spawnX(index, points, stage) {
  return ((index + 0.5) / points - 0.5) * stage.width * 0.7;
}

export function addBumper(sim, x, y, r) {
  if (sim.bumpers.length >= MAX_BUMPERS) return null;
  const bumper = { cooldown: 0, glow: 0, r, x, y };
  sim.bumpers.push(bumper);
  return bumper;
}

export function scatterBumpers(sim, stage, count, radius) {
  sim.bumpers.length = 0;
  for (let n = 0; n < count; n += 1) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const r = radius * (0.6 + Math.random() * 0.8);
      const x = (Math.random() - 0.5) * stage.width * 0.86;
      const y = (Math.random() * 0.62 - 0.3) * stage.height;
      const clear = sim.bumpers.every(
        (b) => Math.hypot(b.x - x, b.y - y) > b.r + r + 1.2
      );
      if (clear) {
        addBumper(sim, x, y, r);
        break;
      }
    }
  }
}

export function pickBumper(sim, x, y) {
  let best = null;
  let bestDistance = Infinity;
  sim.bumpers.forEach((b) => {
    const d = Math.hypot(b.x - x, b.y - y);
    if (d <= b.r + 1 && d < bestDistance) {
      best = b;
      bestDistance = d;
    }
  });
  return best;
}

function spawn(sim, p, stage) {
  const slot = sim.alive.indexOf(0);
  if (slot < 0) return;
  const index = Math.floor(Math.random() * p.spawnPoints);
  sim.alive[slot] = 1;
  sim.px[slot] =
    spawnX(index, p.spawnPoints, stage) + (Math.random() - 0.5) * 1.6;
  sim.py[slot] = stage.height / 2 + 2;
  sim.vx[slot] = (Math.random() - 0.5) * 6;
  sim.vy[slot] = 0;
}

function collide(sim, i, p, onHit) {
  const radius = p.particleRadius;
  for (let k = 0; k < sim.bumpers.length; k += 1) {
    const b = sim.bumpers[k];
    const dx = sim.px[i] - b.x;
    const dy = sim.py[i] - b.y;
    const reach = b.r + radius;
    const d2 = dx * dx + dy * dy;
    if (d2 < reach * reach && d2 > 1e-8) {
      const d = Math.sqrt(d2);
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.12;
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      sim.px[i] = b.x + nx * reach;
      sim.py[i] = b.y + ny * reach;
      const vn = sim.vx[i] * nx + sim.vy[i] * ny;
      if (vn < 0) {
        sim.vx[i] -= (1 + p.bounciness) * vn * nx;
        sim.vy[i] -= (1 + p.bounciness) * vn * ny;
        if (-vn > MIN_IMPACT && b.cooldown <= 0) {
          b.cooldown = HIT_COOLDOWN;
          b.glow = 1;
          onHit(b, -vn);
        }
      }
      if (d > reach) break;
    }
  }
}

export function stepSim(sim, dt, p, stage, onHit) {
  sim.spawnAccumulator += p.spawnRate * dt;
  while (sim.spawnAccumulator >= 1) {
    sim.spawnAccumulator -= 1;
    spawn(sim, p, stage);
  }

  const substeps = Math.max(1, Math.ceil(dt / SUBSTEP));
  const h = dt / substeps;
  const wall = stage.width / 2 - p.particleRadius;

  for (let s = 0; s < substeps; s += 1) {
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      if (sim.alive[i]) {
        sim.vy[i] -= p.gravity * h;
        sim.px[i] += sim.vx[i] * h;
        sim.py[i] += sim.vy[i] * h;
        if (sim.px[i] < -wall) {
          sim.px[i] = -wall;
          sim.vx[i] = Math.abs(sim.vx[i]) * p.bounciness;
        } else if (sim.px[i] > wall) {
          sim.px[i] = wall;
          sim.vx[i] = -Math.abs(sim.vx[i]) * p.bounciness;
        }
        if (sim.py[i] < -stage.height / 2 - 4) sim.alive[i] = 0;
        else collide(sim, i, p, onHit);
      }
    }
  }

  sim.bumpers.forEach((b) => {
    const bumper = b;
    bumper.cooldown = Math.max(0, bumper.cooldown - dt);
    bumper.glow *= Math.exp(-dt * 5);
  });
}
