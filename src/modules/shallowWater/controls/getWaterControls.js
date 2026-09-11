import { folder } from 'leva';

export default function getWaterControls(p) {
  return folder(
    {
      breakLow: {
        label: 'Break Onset',
        value: p.breakLow,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      breakHigh: {
        label: 'Break Full',
        value: p.breakHigh,
        min: 0.05,
        max: 2.5,
        step: 0.01,
      },
      breakWeight: {
        label: 'Break Weight',
        value: p.breakWeight,
        min: 0,
        max: 4,
        step: 0.05,
      },
      steepWeight: {
        label: 'Steepness Weight',
        value: p.steepWeight,
        min: 0,
        max: 5,
        step: 0.05,
      },
      shallowDepth: {
        label: 'Shallow Depth',
        value: p.shallowDepth,
        min: 0.1,
        max: 5,
        step: 0.05,
      },
      aerationBirth: {
        label: 'Aeration Birth',
        value: p.aerationBirth,
        min: 0,
        max: 8,
        step: 0.05,
      },
      aerationDecay: {
        label: 'Aeration Decay',
        value: p.aerationDecay,
        min: 0.02,
        max: 4,
        step: 0.01,
      },
      churnStrength: {
        label: 'Churn',
        value: p.churnStrength,
        min: 0,
        max: 6,
        step: 0.05,
      },
      churnScale: {
        label: 'Churn Scale',
        value: p.churnScale,
        min: 0.05,
        max: 2.5,
        step: 0.01,
      },
      churnEvolve: {
        label: 'Churn Evolve',
        value: p.churnEvolve,
        min: 0,
        max: 2,
        step: 0.01,
      },
      wetDepth: {
        label: 'Wet Depth',
        value: p.wetDepth,
        min: 0.005,
        max: 0.5,
        step: 0.005,
      },
      // Celerity factor. The solve's wave speed is sqrt(pipeArea * g * h), so
      // 1 is the true shallow-water speed and anything else is a deliberate
      // cheat on how fast the swell crosses the shelf.
      pipeArea: {
        label: 'Wave Speed',
        value: p.pipeArea,
        min: 0.1,
        max: 3,
        step: 0.01,
      },
      // Per second, not per substep, so changing Substeps does not change how
      // much energy the shelf takes out of the swell.
      friction: {
        label: 'Friction',
        value: p.friction,
        min: 0,
        max: 3,
        step: 0.005,
      },
      bedDrag: {
        label: 'Bed Drag',
        value: p.bedDrag,
        min: 0,
        max: 0.3,
        step: 0.002,
      },
    },
    { collapsed: true }
  );
}
