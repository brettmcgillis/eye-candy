import { folder } from 'leva';

// Continuous CA controls (utils/continuousCompute.js) — two interchangeable
// rule modes sharing one engine, distinct from the hierarchical growth
// engine's one-shot resolve (VoxelField/Palette controls above):
// - 'life': classic 3D neighbor-counting Life-style birth/death. Survive/
//   birth are min/max *live-neighbor-count* bands (26-neighbor Moore
//   neighborhood) so the sim can be tuned toward dying out, exploding/
//   chaotic, or a stable simmering equilibrium.
// - 'cyclic': Cyclic Cellular Automaton — a cell advances through a fixed
//   N-length cycle once `continuousCyclicThreshold` neighbors already sit at
//   its next state. continuousRuleMode is structural (switching reseeds from
//   scratch — see VoxelField.jsx's pickStructuralSettings).
export default function getContinuousControls(p = {}) {
  return folder({
    continuousEnabled: {
      label: 'Continuous CA Enabled',
      value: p.continuousEnabled ?? false,
    },
    continuousRuleMode: {
      label: 'Rule Mode',
      value: p.continuousRuleMode ?? 'life',
      options: ['life', 'cyclic'],
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
    continuousCyclicStates: {
      label: 'Cyclic States',
      value: p.continuousCyclicStates ?? 12,
      min: 3,
      max: 32,
      step: 1,
    },
    continuousCyclicThreshold: {
      label: 'Cyclic Threshold',
      value: p.continuousCyclicThreshold ?? 4,
      min: 1,
      max: 26,
      step: 1,
    },
    // Classic Cyclic CA has no dead state (see continuousCompute.js) — every
    // cell is always occupied, which reads as one solid block rather than
    // Life's sparse look. This hides one specific phase of the cycle at
    // render time (purely cosmetic — doesn't touch storage/compaction),
    // giving Cyclic mode visible gaps like Life's dead cells, at the cost of
    // not benefiting from compaction (still draws every cell, some at scale
    // 0) since the underlying state is still always nonzero.
    continuousCyclicQuiescentPhase: {
      label: 'Cyclic Quiescent Phase',
      value: p.continuousCyclicQuiescentPhase ?? false,
    },
  });
}
