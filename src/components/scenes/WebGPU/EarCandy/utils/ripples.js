/* eslint-disable no-param-reassign */
export const MAX_RIPPLES = 24;
export const MAX_SPARKS = 64;

export function createSim() {
  return { dropAccumulator: 0, nextId: 1, ripples: [], sparks: [] };
}

export function addRipple(sim, x, y) {
  if (sim.ripples.length >= MAX_RIPPLES) sim.ripples.shift();
  sim.ripples.push({ amp: 1, hit: new Set(), id: sim.nextId, r: 0.4, x, y });
  sim.nextId += 1;
}

function addSpark(sim, x, y, strength) {
  if (sim.sparks.length >= MAX_SPARKS) sim.sparks.shift();
  sim.sparks.push({ age: 0, strength, x, y });
}

function intersect(sim, a, b, onIntersect) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6 || d >= a.r + b.r || d <= Math.abs(a.r - b.r)) return;

  a.hit.add(b.id);
  b.hit.add(a.id);
  const along = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.r * a.r - along * along));
  const mx = a.x + (dx / d) * along;
  const my = a.y + (dy / d) * along;
  const strength = Math.min(a.amp, b.amp);
  addSpark(sim, mx - (dy / d) * h, my + (dx / d) * h, strength);
  addSpark(sim, mx + (dy / d) * h, my - (dx / d) * h, strength);
  onIntersect({ strength, x: mx, y: my });
}

export function stepSim(sim, dt, p, stage, onIntersect) {
  sim.dropAccumulator += p.dropRate * dt;
  while (sim.dropAccumulator >= 1) {
    sim.dropAccumulator -= 1;
    addRipple(
      sim,
      (Math.random() - 0.5) * stage.width * 0.85,
      (Math.random() - 0.5) * stage.height * 0.8
    );
  }

  sim.ripples.forEach((ripple) => {
    ripple.r += p.waveSpeed * dt;
    ripple.amp = Math.max(0, 1 - ripple.r / p.rippleRadius) ** 1.4;
  });
  sim.ripples = sim.ripples.filter((ripple) => ripple.amp > 0);

  const { ripples } = sim;
  for (let i = 0; i < ripples.length; i += 1) {
    for (let j = i + 1; j < ripples.length; j += 1) {
      if (!ripples[i].hit.has(ripples[j].id)) {
        intersect(sim, ripples[i], ripples[j], onIntersect);
      }
    }
  }

  sim.sparks.forEach((spark) => {
    spark.age += dt;
  });
  sim.sparks = sim.sparks.filter((spark) => spark.age < 1.2);
}
