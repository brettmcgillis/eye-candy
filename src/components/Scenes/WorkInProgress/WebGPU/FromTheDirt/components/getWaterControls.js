import { folder } from 'leva';

export default function getWaterControls(p) {
  return folder(
    {
      waterLevel: {
        label: 'Water Table',
        max: -0.2,
        min: -2.5,
        step: 0.05,
        value: p.waterLevel,
      },
      pitDepth: {
        label: 'Depth Below Water',
        max: 2,
        min: 0.1,
        step: 0.05,
        value: p.pitDepth,
      },
      waterColor: { label: 'Color', value: p.waterColor },
      waterOpacity: {
        label: 'Opacity',
        max: 1,
        min: 0.2,
        step: 0.01,
        value: p.waterOpacity,
      },
      rippleScale: {
        label: 'Ripple Scale',
        max: 6,
        min: 0.2,
        step: 0.1,
        value: p.rippleScale,
      },
      rippleSpeed: {
        label: 'Ripple Speed',
        max: 2,
        min: 0.05,
        step: 0.05,
        value: p.rippleSpeed,
      },
      rippleStrength: {
        label: 'Ripple Strength',
        max: 2,
        min: 0,
        step: 0.05,
        value: p.rippleStrength,
      },
    },
    { collapsed: true }
  );
}
