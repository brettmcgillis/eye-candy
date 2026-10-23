import { perlin3 } from '../materialxNoise/index.mjs';

export const BURN_DEFAULTS = {
  burnEnabled: false,
  burnSpeed: 0.12,
  burnAmount: 0.32,
  burnLoop: false,
  burnNoiseScale: 3,
  burnEdgeWidth: 0.06,
  burnCharWidth: 0.22,
  burnColorA: '#ff4000',
  burnColorB: '#ffd089',
  burnGlowIntensity: 5,
  emberRate: 45,
  emberSize: 0.012,
  emberRise: 0.55,
  emberDrift: 0.15,
  emberColorHot: '#ffe8a3',
  emberColorCool: '#ff3c00',
  emberIntensity: 4,
};
export const burnFromControls = (controls) =>
  Object.fromEntries(
    Object.entries(BURN_DEFAULTS).map(([key, value]) => [
      key,
      controls[key] ?? value,
    ])
  );
export function burnProgress(params, seconds) {
  if (!params.burnLoop) return params.burnAmount;
  return ((params.burnAmount + seconds * params.burnSpeed + 0.1) % 1.2) - 0.1;
}
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function burnAt(u, v, params, progress, seed) {
  const distance =
    perlin3(
      u * params.burnNoiseScale * 2.35,
      v * params.burnNoiseScale,
      seed * 43.7
    ) *
      0.5 +
    0.5 -
    progress;
  return {
    alpha: distance >= 0 ? 1 : 0,
    glow: smooth(params.burnEdgeWidth, 0, distance),
    char: smooth(params.burnCharWidth, params.burnEdgeWidth * 0.5, distance),
  };
}

export const BURN_RANGES = {
  burnSpeed: [0, 0.5, 0.01],
  burnAmount: [0, 0.9, 0.01],
  burnNoiseScale: [0.5, 10, 0.1],
  burnEdgeWidth: [0.005, 0.2, 0.005],
  burnCharWidth: [0.02, 0.5, 0.01],
  burnGlowIntensity: [0, 15, 0.1],
  emberRate: [0, 160, 1],
  emberSize: [0.002, 0.05, 0.001],
  emberRise: [0, 2, 0.05],
  emberDrift: [0, 1, 0.01],
  emberIntensity: [0, 10, 0.1],
};

export function emberPoints(snapshot, params, matrix) {
  if (!snapshot || !(params.emberRate > 0) || !(params.emberIntensity > 0))
    return [];
  const { origins, velocities, births, seeds, time } = snapshot;
  const stride = origins.length / births.length;
  const points = [];
  for (let i = 0; i < births.length; i += 1) {
    const age = time - births[i];
    const seed = seeds[i];
    const phase = age / (0.7 + 0.9 * seed);
    if (!(age > 0 && phase < 0.95)) continue;
    const j = i * stride;
    const x =
      origins[j] +
      velocities[j] * age +
      Math.sin(age * (5 + 6 * seed) + seed * 40) * 0.04;
    const y =
      origins[j + 1] +
      velocities[j + 1] * age +
      params.emberRise * age * (phase * 0.7 + 0.3);
    const z =
      origins[j + 2] +
      velocities[j + 2] * age +
      Math.cos(age * (4 + 5 * ((seed * 7.31) % 1))) * 0.04;
    points.push({
      phase,
      position: [
        matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
        matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
        matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
      ],
    });
  }
  return points;
}
