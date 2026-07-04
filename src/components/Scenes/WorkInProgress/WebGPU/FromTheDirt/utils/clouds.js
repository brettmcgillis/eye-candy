/* eslint-disable camelcase */
import {
  Fn,
  float,
  int,
  mx_fractal_noise_float,
  smoothstep,
  time,
  uniform,
  vec3,
} from 'three/tsl';

// Sunny-afternoon cloud shadows, in the spirit of Surrender's moonlight
// projector: a scrolling FBM decides how much sun reaches each point.
// The same node is multiplied into terrain, grass, and water color so every
// surface agrees on the same drifting cloud shadows.

export function createCloudUniforms({
  coverage = 0.45,
  floorLevel = 0.55,
  scale = 0.06,
  speed = 1,
} = {}) {
  return {
    coverage: uniform(coverage),
    floorLevel: uniform(floorLevel),
    scale: uniform(scale),
    speed: uniform(speed),
  };
}

// Returns Fn([worldXZ: vec2]) -> float in [floorLevel, 1].
export function createCloudShade(uniforms) {
  const { coverage, floorLevel, scale, speed } = uniforms;
  return Fn(([worldXZ]) => {
    const drift = time.mul(speed);
    const p = vec3(
      worldXZ.x.mul(scale).add(drift.mul(0.031)),
      worldXZ.y.mul(scale).add(drift.mul(0.012)),
      drift.mul(0.019)
    );
    const cloud = mx_fractal_noise_float(p, int(4), float(2), float(0.5));
    // Higher coverage lowers the threshold clouds must clear to cast shadow.
    const threshold = float(0.8).sub(coverage.mul(1.3));
    const shadow = smoothstep(threshold, threshold.add(0.4), cloud);
    return float(1).sub(shadow.mul(float(1).sub(floorLevel)));
  });
}
