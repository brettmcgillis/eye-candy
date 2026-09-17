const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function timeline(config) {
  const bloomAt = config.growSeconds * config.bloomStart;
  const matured = Math.max(config.growSeconds, bloomAt + config.bloomSeconds);
  const exitAt = matured + config.holdSeconds;
  const exitEnd = exitAt + config.exitSeconds;

  return {
    bloomAt,
    cycleEnd: exitEnd + config.restSeconds,
    exitAt,
    exitEnd,
    matured,
  };
}

// The three uniforms a flower's shaders read, at `t` seconds into its cycle.
export function levelsAt(config, t) {
  const { bloomAt, exitAt } = timeline(config);

  return {
    bloom: clamp01((t - bloomAt) / config.bloomSeconds),
    exit: clamp01((t - exitAt) / config.exitSeconds),
    growth: clamp01(t / config.growSeconds),
  };
}

// A regrow cycle's seed, the same string the scene loop uses.
export function seedFor(seed, cycle) {
  return cycle === 0 ? String(seed) : `${seed}-${cycle}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
