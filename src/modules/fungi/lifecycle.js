// grow → hold → spore → rot → unravel → rest. Grow and rot are clocks that
// run past 1 by the age stagger; each member reads its own level on the GPU
// as clock − delay × stagger, so a clump comes up and goes down in age order.
export function timeline(config) {
  const stagger = config.stagger ?? 0;
  const matured = config.growSeconds * (1 + stagger);
  const sporeAt = matured + config.holdSeconds;
  const rotAt = sporeAt + config.sporeSeconds;
  const rotEnd = rotAt + config.rotSeconds * (1 + stagger * 0.5);
  const unravelEnd = rotEnd + config.unravelSeconds;

  return {
    cycleEnd: unravelEnd + config.restSeconds,
    matured,
    rotAt,
    rotEnd,
    sporeAt,
    stagger,
    unravelEnd,
  };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function levelsAt(config, t) {
  const { rotAt, rotEnd, sporeAt, stagger } = timeline(config);

  return {
    exit: clamp01((t - rotEnd) / config.unravelSeconds),
    grow: Math.max(0, t / config.growSeconds),
    rot: Math.max(0, (t - rotAt) / config.rotSeconds),
    spore: clamp01((t - sporeAt) / Math.max(config.sporeSeconds, 1e-3)),
    stagger,
  };
}

export function specimenLevels(config, specimen, t) {
  return levelsAt(config, t);
}

// Every member at the same point, whatever its age.
export function stillLevels(specimen, { grow = 1, rot = 0, spore = 0 } = {}) {
  return { exit: 0, grow, rot, spore, stagger: 0 };
}

export function seedFor(seed, cycle) {
  return cycle === 0 ? String(seed) : `${seed}-${cycle}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
