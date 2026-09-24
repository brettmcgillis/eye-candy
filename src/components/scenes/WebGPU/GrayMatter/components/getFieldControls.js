import { folder } from 'leva';

export default function getFieldControls(p) {
  return folder(
    {
      fieldResolution: {
        label: 'Resolution',
        value: p.fieldResolution,
        min: 48,
        max: 192,
        step: 8,
      },
      feedRate: {
        label: 'Feed',
        value: p.feedRate,
        min: 0.01,
        max: 0.1,
        step: 0.0005,
      },
      killRate: {
        label: 'Kill',
        value: p.killRate,
        min: 0.03,
        max: 0.075,
        step: 0.0005,
      },
      diffusionScale: {
        label: 'Pattern Scale',
        value: p.diffusionScale,
        min: 0.2,
        max: 1,
        step: 0.01,
      },
      diffusionV: {
        label: 'Diffusion V',
        value: p.diffusionV,
        min: 0.2,
        max: 0.8,
        step: 0.01,
      },
      stepScale: {
        label: 'Iterations',
        value: p.stepScale,
        min: 2,
        max: 32,
        step: 2,
      },
      drift: {
        label: 'Drift',
        value: p.drift,
        min: 0,
        max: 0.02,
        step: 0.0005,
      },
      driftScale: {
        label: 'Drift Scale',
        value: p.driftScale,
        min: 0.005,
        max: 0.3,
        step: 0.005,
      },
      driftSpeed: {
        label: 'Drift Speed',
        value: p.driftSpeed,
        min: 0,
        max: 2,
        step: 0.01,
      },
      seedCoverage: {
        label: 'Seed Coverage',
        value: p.seedCoverage,
        min: 0,
        max: 1,
        step: 0.01,
      },
      bodyRadius: {
        label: 'Body Radius',
        value: p.bodyRadius,
        min: 0,
        max: 0.08,
        step: 0.001,
      },
      swellLow: {
        label: 'Swell From',
        value: p.swellLow,
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      swellHigh: {
        label: 'Swell To',
        value: p.swellHigh,
        min: 0,
        max: 0.6,
        step: 0.005,
      },
    },
    { collapsed: true }
  );
}
