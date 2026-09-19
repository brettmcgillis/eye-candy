import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export function getFlareControls() {
  return folder(
    {
      flareChance: {
        label: 'Branch Flare',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      flareLandingChance: {
        label: 'Landing Flare',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.25,
      },
      flareColor: { label: 'Colour', value: '#ff3a1e' },
      flareIntensity: {
        label: 'Intensity',
        min: 0,
        max: 80,
        step: 0.5,
        value: 14,
      },
      flareGlow: { label: 'Glow', min: 1, max: 12, step: 0.1, value: 3 },
      flareRange: { label: 'Range', min: 2, max: 60, step: 0.5, value: 16 },
      flareRadius: {
        label: 'Radius',
        min: 0.01,
        max: 0.1,
        step: 0.005,
        value: 0.035,
      },
      flareLength: {
        label: 'Length',
        min: 0.1,
        max: 0.8,
        step: 0.01,
        value: 0.34,
      },
      flareFlicker: {
        label: 'Flicker',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      flareHeight: {
        label: 'Scatter Lift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.2,
      },
      flareScatter: {
        label: 'Air Scatter',
        min: 0,
        max: 6,
        step: 0.05,
        value: 1,
      },
      flareShadows: { label: 'Shadows', value: false },
    },
    COLLAPSED
  );
}

export function getBeamControls() {
  return folder(
    {
      beamEnabled: { label: 'Flashlight', value: true },
      beamAngle: { label: 'Cone °', min: 5, max: 60, step: 0.5, value: 26 },
      beamPenumbra: {
        label: 'Penumbra',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.55,
      },
      beamIntensity: {
        label: 'Intensity',
        min: 0,
        max: 4000,
        step: 10,
        value: 600,
      },
      beamRange: { label: 'Range m', min: 5, max: 200, step: 1, value: 55 },
      beamDecay: { label: 'Decay', min: 0, max: 3, step: 0.05, value: 2 },
      beamColor: { label: 'Colour', value: '#cdd3dd' },
      beamForward: {
        label: 'Held Fwd',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      beamDrop: {
        label: 'Held Drop',
        min: -0.8,
        max: 0.2,
        step: 0.01,
        value: -0.28,
      },
      beamLag: { label: 'Aim Lag', min: 1, max: 30, step: 0.5, value: 7 },
      beamScatter: {
        label: 'Air Scatter',
        min: 0,
        max: 6,
        step: 0.05,
        value: 1.4,
      },
      beamFalloff: {
        label: 'Air Falloff',
        min: 0,
        max: 0.05,
        step: 0.0005,
        value: 0.004,
      },
      beamShadows: { label: 'Shadows', value: true },
      beamShadowSize: {
        label: 'Shadow Map',
        options: [512, 1024, 2048],
        value: 1024,
      },
      beamLensGain: {
        label: 'Lens Gain',
        min: 0.2,
        max: 3,
        step: 0.05,
        value: 1,
      },
      beamLensLift: {
        label: 'Lens Lift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0,
      },
    },
    COLLAPSED
  );
}
