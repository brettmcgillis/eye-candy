import * as THREE from 'three';

// Slow self-driving "performance" envelope (WS0). A sum of slow sines on a
// private clock gently modulates gravity direction, noise, rest density and
// speed over ~20–90s so the as-is piece breathes and shifts mood instead of
// looping visibly. Pure CPU-side additive deltas onto the base config.
export default function createAutonomousLfo() {
  const gravity = new THREE.Vector3();
  const delta = { gravity, noise: 0, restDensity: 0, speed: 0 };
  let t = 0;

  function update(dt, options = {}) {
    const { rate = 1, depth = 1 } = options;
    t += dt * rate;

    gravity.set(
      Math.sin(t * 0.07) * 0.12 * depth,
      Math.sin(t * 0.043 + 1.3) * 0.1 * depth,
      Math.sin(t * 0.031 + 2.7) * 0.1 * depth
    );
    delta.noise =
      (Math.sin(t * 0.053) * 0.5 + Math.sin(t * 0.017 + 1.1) * 0.3) * depth;
    delta.restDensity = Math.sin(t * 0.023 + 0.5) * 0.25 * depth;
    delta.speed = Math.sin(t * 0.037 + 2.0) * 0.15 * depth;

    return delta;
  }

  return { update };
}
