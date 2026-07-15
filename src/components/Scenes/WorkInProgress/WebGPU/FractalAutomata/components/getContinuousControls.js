import { folder } from 'leva';

// Continuous CA controls (utils/continuousCompute.js) — a classic 3D
// neighbor-counting Life-style birth/death simulation, distinct from the
// hierarchical growth engine's one-shot resolve (VoxelField/Palette
// controls above). Survive/birth are min/max *live-neighbor-count* bands
// (26-neighbor Moore neighborhood) so the sim can be tuned toward dying
// out, exploding/chaotic, or a stable simmering equilibrium.
export default function getContinuousControls(p = {}) {
  return folder({
    continuousEnabled: {
      label: 'Continuous CA Enabled',
      value: p.continuousEnabled ?? false,
    },
    continuousStepsPerSecond: {
      label: 'Steps / Second',
      value: p.continuousStepsPerSecond ?? 6,
      min: 0.5,
      max: 30,
      step: 0.5,
    },
    continuousSurviveMin: {
      label: 'Survive Min Neighbors',
      value: p.continuousSurviveMin ?? 3,
      min: 0,
      max: 26,
      step: 1,
    },
    continuousSurviveMax: {
      label: 'Survive Max Neighbors',
      value: p.continuousSurviveMax ?? 10,
      min: 0,
      max: 26,
      step: 1,
    },
    continuousBirthMin: {
      label: 'Birth Min Neighbors',
      value: p.continuousBirthMin ?? 6,
      min: 0,
      max: 26,
      step: 1,
    },
    continuousBirthMax: {
      label: 'Birth Max Neighbors',
      value: p.continuousBirthMax ?? 8,
      min: 0,
      max: 26,
      step: 1,
    },
  });
}
