import { folder } from 'leva';

export default function getGrainControls(p) {
  return folder(
    {
      bedCount: {
        label: 'Bed Grains',
        value: p.bedCount,
        min: 20000,
        max: 500000,
        step: 10000,
      },
      boltCapacity: {
        label: 'Bolt Grain Slots',
        value: p.boltCapacity,
        min: 4000,
        max: 120000,
        step: 1000,
      },
      pileMemory: {
        label: 'Pile Memory (strikes)',
        value: p.pileMemory,
        min: 1,
        max: 8,
        step: 1,
      },
      grainSize: {
        label: 'Grain Size',
        value: p.grainSize,
        min: 0.004,
        max: 0.05,
        step: 0.001,
      },
      bedRadius: {
        label: 'Bed Radius',
        value: p.bedRadius,
        min: 1,
        max: 10,
        step: 0.1,
      },
      bedThickness: {
        label: 'Sand Depth',
        value: p.bedThickness,
        min: 0.01,
        max: 0.4,
        step: 0.005,
      },
      bedBaseY: {
        label: 'Sand Height',
        value: p.bedBaseY,
        min: -0.5,
        max: 0.5,
        step: 0.005,
      },
      bedNoiseScale: {
        label: 'Dune Frequency',
        value: p.bedNoiseScale,
        min: 0.1,
        max: 6,
        step: 0.05,
      },
      bedNoiseDrift: {
        label: 'Dune Shift / Strike',
        value: p.bedNoiseDrift,
        min: 0,
        max: 4,
        step: 0.05,
      },
      bedDuneHeight: {
        label: 'Dune Relief',
        value: p.bedDuneHeight,
        min: 0,
        max: 0.3,
        step: 0.005,
      },
      bedSettle: {
        label: 'Bed Settle Rate',
        value: p.bedSettle,
        min: 0,
        max: 3,
        step: 0.05,
      },
      grainColor: { label: 'Grain Color', value: p.grainColor },
      leaderColor: { label: 'Leader Glow', value: p.leaderColor },
      returnColor: { label: 'Return Stroke', value: p.returnColor },
    },
    { collapsed: true }
  );
}
