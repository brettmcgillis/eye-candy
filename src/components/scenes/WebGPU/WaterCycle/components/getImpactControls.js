import { isSurfaceVisible } from './controlPaths';

// Only reaches the screen when the water surface is visible: surface-bound
// drops are stippled into the foam render target the ocean material samples.
export default function getImpactControls(snapshot = {}) {
  return {
    impactAreaSize: {
      label: 'Foam Area',
      max: 400,
      min: 20,
      render: isSurfaceVisible,
      step: 1,
      value: snapshot.impactAreaSize ?? 140,
    },
    impactDotSize: {
      label: 'Stipple Size',
      max: 4,
      min: 0.05,
      render: isSurfaceVisible,
      step: 0.05,
      value: snapshot.impactDotSize ?? 0.55,
    },
    impactDotStrength: {
      label: 'Stipple Strength',
      max: 4,
      min: 0,
      render: isSurfaceVisible,
      step: 0.05,
      value: snapshot.impactDotStrength ?? 1,
    },
    impactFoamStrength: {
      label: 'Foam Response',
      max: 3,
      min: 0,
      render: isSurfaceVisible,
      step: 0.05,
      value: snapshot.impactFoamStrength ?? 0.8,
    },
    impactFoamDecay: {
      label: 'Foam Decay',
      max: 0.3,
      min: 0.005,
      render: isSurfaceVisible,
      step: 0.005,
      value: snapshot.impactFoamDecay ?? 0.06,
    },
  };
}
