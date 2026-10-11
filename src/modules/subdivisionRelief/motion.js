export const cycleSeconds = (config) =>
  config.growSeconds + config.holdSeconds + config.collapseSeconds;

// The grow loop's level at `seconds` into a cycle: split up to `top`, hold,
// recombine to the root grid. Past the cycle it stays at 0.
export function growAt(seconds, config, top) {
  const { collapseSeconds, growSeconds, holdSeconds } = config;
  if (seconds < growSeconds) return (seconds / growSeconds) * top;
  const collapsing = seconds - growSeconds - holdSeconds;
  if (collapsing <= 0) return top;
  return top * Math.max(0, 1 - collapsing / collapseSeconds);
}

// The motion a fixed clock gives: phases advance at their speeds, fully mixed
// in while Animate is on.
export const motionAt = (config, seconds) => ({
  mix: config.animate ? 1 : 0,
  noisePhase: seconds * config.motionNoiseSpeed,
  wavePhase: seconds * config.motionWaveSpeed,
});
