const ease = (t) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
};

export const cycleSeconds = (config) =>
  config.buildSeconds * 2 + config.holdSeconds;

// 0 → 1 over buildSeconds, held, then back to 0: the build cutoff (terraces
// stack up level by level) or the rise (flat and unlit to full relief).
export function cycleAt(seconds, config) {
  const total = cycleSeconds(config);
  const t = ((seconds % total) + total) % total;
  if (t < config.buildSeconds) return t / config.buildSeconds;
  if (t < config.buildSeconds + config.holdSeconds) return 1;
  return (
    1 - (t - config.buildSeconds - config.holdSeconds) / config.buildSeconds
  );
}

// What the rig's motion uniforms take for a mode at a moment: `cutoff` caps
// heights (build), `rise` scales relief and lighting together.
export function motionState(mode, seconds, config) {
  if (mode === 'build') return { cutoff: cycleAt(seconds, config), rise: 1 };
  if (mode === 'rise')
    return { cutoff: 1, rise: ease(cycleAt(seconds, config)) };
  return { cutoff: 1, rise: 1 };
}
