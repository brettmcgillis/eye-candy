import { folder } from 'leva';

export default function getWaterControls(p) {
  return folder(
    {
      shallowColor: { label: 'Shallow', value: p.shallowColor },
      deepColor: { label: 'Deep', value: p.deepColor },
      skyColor: { label: 'Sky Tint', value: p.skyColor },
      absorption: {
        label: 'Absorption',
        value: p.absorption,
        min: 0.01,
        max: 1.5,
        step: 0.01,
      },
      shallowOpacity: {
        label: 'Shallow Opacity',
        value: p.shallowOpacity,
        min: 0,
        max: 1,
        step: 0.01,
      },
      opacityDepth: {
        label: 'Opaque Depth',
        value: p.opacityDepth,
        min: 0.1,
        max: 8,
        step: 0.05,
      },
      waterRoughness: {
        label: 'Roughness',
        value: p.waterRoughness,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      rippleAmplitude: {
        label: 'Ripple Amount',
        value: p.rippleAmplitude,
        min: 0,
        max: 1,
        step: 0.01,
      },
      rippleScale: {
        label: 'Ripple Scale',
        value: p.rippleScale,
        min: 0.1,
        max: 4,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
