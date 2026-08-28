import { folder } from 'leva';

export function getDescentControls() {
  return folder(
    {
      fallSpeed: { label: 'Fall Speed', min: 0, max: 40, step: 0.1, value: 8 },
      speedDriftAmount: {
        label: 'Speed Drift',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0,
      },
      speedDriftWavelength: {
        label: 'Speed Drift Scale',
        min: 20,
        max: 2000,
        step: 10,
        value: 400,
      },
      aboveCamera: {
        label: 'Reach Above',
        min: 20,
        max: 400,
        step: 5,
        value: 120,
      },
      belowCamera: {
        label: 'Reach Below',
        min: 100,
        max: 1600,
        step: 10,
        value: 620,
      },
    },
    { collapsed: true }
  );
}

export function getShaftControls() {
  return folder(
    {
      voidRadius: {
        label: 'Void Radius',
        min: 5,
        max: 200,
        step: 0.5,
        value: 24,
      },
      stairWidth: {
        label: 'Stair Width',
        min: 1,
        max: 40,
        step: 0.25,
        value: 6,
      },
      wallGap: { label: 'Wall Gap', min: 0, max: 30, step: 0.25, value: 2 },
      risePerTurn: {
        label: 'Rise Per Turn',
        min: 10,
        max: 300,
        step: 1,
        value: 90,
      },
      stepsPerTurn: {
        label: 'Steps Per Turn',
        min: 32,
        max: 1536,
        step: 1,
        value: 512,
      },
      clockwise: { label: 'Clockwise', value: true },
      stepThickness: {
        label: 'Step Thickness',
        min: 1,
        max: 8,
        step: 0.1,
        value: 2.5,
      },
      stepNosing: {
        label: 'Step Nosing',
        min: 0.9,
        max: 1.6,
        step: 0.01,
        value: 1.04,
      },
      stoneColor: { label: 'Stone', value: '#3a3a38' },
      wallColor: { label: 'Wall', value: '#37373a' },
      wallRadialSegments: {
        label: 'Wall Segments',
        min: 32,
        max: 256,
        step: 8,
        value: 128,
      },
      wallHeightSegments: {
        label: 'Wall Rings',
        min: 32,
        max: 512,
        step: 8,
        value: 256,
      },
    },
    { collapsed: true }
  );
}

export function getWrongnessControls() {
  return folder(
    {
      radiusDriftAmount: {
        label: 'Radius Drift',
        min: 0,
        max: 1.5,
        step: 0.01,
        value: 0,
      },
      radiusDriftWavelength: {
        label: 'Radius Drift Scale',
        min: 20,
        max: 2000,
        step: 10,
        value: 450,
      },
      axisDriftAmount: {
        label: 'Axis Drift',
        min: 0,
        max: 60,
        step: 0.5,
        value: 0,
      },
      axisDriftWavelength: {
        label: 'Axis Drift Scale',
        min: 20,
        max: 2000,
        step: 10,
        value: 600,
      },
      overlapAmount: {
        label: 'Pitch Warp',
        min: 0,
        max: 8,
        step: 0.05,
        value: 0,
      },
      overlapWavelength: {
        label: 'Pitch Warp Scale',
        min: 50,
        max: 3000,
        step: 10,
        value: 800,
      },
      landingSpacing: {
        label: 'Landing Spacing',
        min: 10,
        max: 400,
        step: 1,
        value: 90,
      },
      landingDriftAmount: {
        label: 'Landing Drift',
        min: 0,
        max: 0.9,
        step: 0.01,
        value: 0,
      },
      landingDriftPeriod: {
        label: 'Landing Drift Period',
        min: 1.5,
        max: 40,
        step: 0.1,
        value: 6,
      },
    },
    { collapsed: true }
  );
}

export function getShaftLightControls() {
  return folder(
    {
      shaftFalloff: {
        label: 'Shaft Falloff',
        min: 0,
        max: 0.03,
        step: 0.0005,
        value: 0.004,
      },
      shaftFloor: {
        label: 'Shaft Floor',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.05,
      },
      columnRecovery: {
        label: 'Column Recovery',
        min: 0,
        max: 1,
        step: 0.005,
        value: 0.05,
      },
    },
    { collapsed: true }
  );
}

export function getBranchControls() {
  return folder(
    {
      landingArc: {
        label: 'Landing Arc (turns)',
        min: 0.01,
        max: 0.5,
        step: 0.005,
        value: 0.09,
      },
      landingThickness: {
        label: 'Landing Thickness',
        min: 0.2,
        max: 6,
        step: 0.1,
        value: 1.2,
      },
      landingWidthScale: {
        label: 'Landing Width',
        min: 1,
        max: 6,
        step: 0.05,
        value: 2.4,
      },
      mouthChanceNone: {
        label: 'Chance Of None',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.35,
      },
      mouthChanceOne: {
        label: 'Chance Of One',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.45,
      },
      mouthHeight: {
        label: 'Mouth Height',
        min: 2,
        max: 20,
        step: 0.1,
        value: 7,
      },
      mouthWidth: {
        label: 'Mouth Width',
        min: 1,
        max: 20,
        step: 0.1,
        value: 4.5,
      },
      mouthSill: {
        label: 'Mouth Sill',
        min: 0,
        max: 12,
        step: 0.1,
        value: 3.4,
      },
      tunnelLength: {
        label: 'Tunnel Length',
        min: 2,
        max: 80,
        step: 0.5,
        value: 16,
      },
      roomDepth: { label: 'Room Depth', min: 2, max: 40, step: 0.5, value: 9 },
      roomWiden: {
        label: 'Room Widen',
        min: 1,
        max: 6,
        step: 0.05,
        value: 2.2,
      },
      branchColor: { label: 'Branch', value: '#2f2f2e' },
    },
    { collapsed: true }
  );
}

export function getFlareControls() {
  return folder(
    {
      flareRoomChance: {
        label: 'Room Flare Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.45,
      },
      flareLandingChance: {
        label: 'Landing Flare Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.3,
      },
      flareIntensity: {
        label: 'Flare Intensity',
        min: 0,
        max: 60,
        step: 0.5,
        value: 12,
      },
      flareHeight: {
        label: 'Flare Height',
        min: 0,
        max: 4,
        step: 0.05,
        value: 0.4,
      },
      flareSize: {
        label: 'Flare Size',
        min: 0.02,
        max: 2,
        step: 0.01,
        value: 0.25,
      },
      flareFlicker: {
        label: 'Flare Flicker',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      flareColor: { label: 'Flare', value: '#ff3a1e' },
    },
    { collapsed: true }
  );
}

export function getVolumetricControls() {
  return folder(
    {
      fogDensity: {
        label: 'Fog Density',
        min: 0,
        max: 0.08,
        step: 0.0005,
        value: 0.012,
      },
      fogSteps: { label: 'March Steps', min: 8, max: 128, step: 1, value: 48 },
      fogMaxDistance: {
        label: 'March Distance',
        min: 40,
        max: 1200,
        step: 10,
        value: 400,
      },
      fogNoiseAmount: {
        label: 'Fog Noise',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      fogNoiseScale: {
        label: 'Fog Noise Scale',
        min: 0.002,
        max: 0.2,
        step: 0.002,
        value: 0.02,
      },
      shaftIntensity: {
        label: 'Shaft Intensity',
        min: 0,
        max: 8,
        step: 0.05,
        value: 1.4,
      },
      shaftEdge: {
        label: 'Shaft Edge Softness',
        min: 0.02,
        max: 0.95,
        step: 0.01,
        value: 0.4,
      },
      shaftColor: { label: 'Shaft Color', value: '#c9d4e6' },
      flareScatter: {
        label: 'Flare Scatter',
        min: 0,
        max: 6,
        step: 0.05,
        value: 1,
      },
      flareGlow: {
        label: 'Flare Glow',
        min: 0,
        max: 8,
        step: 0.05,
        value: 2.5,
      },
      flareLightGain: {
        label: 'Flare Light Gain',
        min: 0,
        max: 20,
        step: 0.1,
        value: 4,
      },
      flareLightRange: {
        label: 'Flare Light Range',
        min: 2,
        max: 120,
        step: 1,
        value: 30,
      },
      bloomStrength: {
        label: 'Bloom',
        min: 0,
        max: 3,
        step: 0.01,
        value: 0.6,
      },
      bloomThreshold: {
        label: 'Bloom Threshold',
        min: 0,
        max: 2,
        step: 0.01,
        value: 0.35,
      },
    },
    { collapsed: true }
  );
}

export function getSurfaceControls() {
  return folder(
    {
      mottleAmount: {
        label: 'Mottle',
        min: 0,
        max: 0.6,
        step: 0.005,
        value: 0.12,
      },
      mottleScale: {
        label: 'Mottle Scale',
        min: 0.02,
        max: 2,
        step: 0.01,
        value: 0.35,
      },
      inkAmount: { label: 'Ink', min: 0, max: 1, step: 0.01, value: 0 },
      inkScale: {
        label: 'Ink Scale',
        min: 0.005,
        max: 0.4,
        step: 0.005,
        value: 0.06,
      },
      inkThreshold: {
        label: 'Ink Threshold',
        min: 0.2,
        max: 0.95,
        step: 0.01,
        value: 0.62,
      },
      inkWarp: { label: 'Ink Warp', min: 0, max: 20, step: 0.1, value: 4 },
      inkFlow: {
        label: 'Ink Flow',
        min: 0,
        max: 0.2,
        step: 0.001,
        value: 0.01,
      },
    },
    { collapsed: true }
  );
}
