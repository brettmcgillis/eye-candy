import { folder } from 'leva';

export default function getFluidControls(p) {
  return folder(
    {
      showFluid: { label: 'Show Fluid', value: p.showFluid },
      particleScale: {
        label: 'Particle Scale',
        value: p.particleScale,
        min: 0.3,
        max: 2.5,
        step: 0.05,
      },
      fluidColorCold: { label: 'Cold', value: p.fluidColorCold },
      fluidColorWarm: { label: 'Warm', value: p.fluidColorWarm },
      fluidColorHot: { label: 'Hot', value: p.fluidColorHot },
      fluidEmissive: {
        label: 'Emissive',
        value: p.fluidEmissive,
        min: 0,
        max: 8,
        step: 0.05,
      },
      heatGain: {
        label: 'Heat Gain',
        value: p.heatGain,
        min: 0,
        max: 4,
        step: 0.05,
      },
      heatBias: {
        label: 'Heat Bias',
        value: p.heatBias,
        min: -1,
        max: 1,
        step: 0.01,
      },
      heatGamma: {
        label: 'Heat Gamma',
        value: p.heatGamma,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      speedHeat: {
        label: 'Speed Heat',
        value: p.speedHeat,
        min: 0,
        max: 2,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
