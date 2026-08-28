export const DEFAULT_PRESET = 'Plausible';

const BASE = {
  cameraMode: 'orbit',
  fixedActiveShot: 'rope',
  orbitEnablePan: false,
  orbitMinDistance: 1,
  orbitMaxDistance: 20,
  orbitMaxDistanceUnlimited: false,
  orbitMinPolarAngle: 20,
  orbitMaxPolarAngle: 125,

  fallSpeed: 8,
  speedDriftAmount: 0,
  speedDriftWavelength: 400,
  aboveCamera: 120,
  belowCamera: 620,

  voidRadius: 24,
  stairWidth: 6,
  wallGap: 2,
  risePerTurn: 90,
  stepsPerTurn: 512,
  clockwise: true,
  stepThickness: 2.5,
  stepNosing: 1.04,
  stoneColor: '#3a3a38',
  wallColor: '#37373a',
  wallRadialSegments: 128,
  wallHeightSegments: 256,

  radiusDriftAmount: 0,
  radiusDriftWavelength: 450,
  axisDriftAmount: 0,
  axisDriftWavelength: 600,
  overlapAmount: 0,
  overlapWavelength: 800,
  landingSpacing: 90,
  landingDriftAmount: 0,
  landingDriftPeriod: 6,

  landingArc: 0.09,
  landingThickness: 1.2,
  landingWidthScale: 2.4,
  mouthChanceNone: 0.35,
  mouthChanceOne: 0.45,
  mouthHeight: 7,
  mouthWidth: 4.5,
  mouthSill: 3.4,
  tunnelLength: 16,
  roomDepth: 9,
  roomWiden: 2.2,
  branchColor: '#2f2f2e',

  flareRoomChance: 0.45,
  flareLandingChance: 0.3,
  flareIntensity: 12,
  flareHeight: 0.4,
  flareSize: 0.25,
  flareFlicker: 0.5,
  flareColor: '#ff3a1e',

  shaftFalloff: 0.004,
  shaftFloor: 0.05,
  columnRecovery: 0.05,

  fogDensity: 0.012,
  fogSteps: 48,
  fogMaxDistance: 400,
  fogNoiseAmount: 0.5,
  fogNoiseScale: 0.02,
  shaftIntensity: 1.4,
  shaftEdge: 0.4,
  shaftColor: '#c9d4e6',
  flareScatter: 1,
  flareGlow: 2.5,
  flareLightGain: 4,
  flareLightRange: 30,
  bloomStrength: 0.6,
  bloomThreshold: 0.35,

  mottleAmount: 0.12,
  mottleScale: 0.35,
  inkAmount: 0,
  inkScale: 0.06,
  inkThreshold: 0.62,
  inkWarp: 4,
  inkFlow: 0.01,
};

const BREATHING = {
  ...BASE,
  radiusDriftAmount: 0.75,
  radiusDriftWavelength: 380,
};

const OFF_AXIS = {
  ...BASE,
  axisDriftAmount: 22,
  axisDriftWavelength: 520,
};

const ESCHER = {
  ...BASE,
  overlapAmount: 8,
  overlapWavelength: 640,
  radiusDriftAmount: 0.35,
};

const EVERYTHING = {
  ...BASE,
  radiusDriftAmount: 0.62,
  radiusDriftWavelength: 420,
  axisDriftAmount: 16,
  axisDriftWavelength: 560,
  overlapAmount: 6,
  overlapWavelength: 700,
  landingDriftAmount: 0.55,
  landingDriftPeriod: 5.4,
  inkAmount: 0.18,
};

function shot(id, overrides = {}) {
  return {
    ...EVERYTHING,
    cameraMode: 'fixed',
    fixedActiveShot: id,
    ...overrides,
  };
}

export const PRESETS = {
  Plausible: { ...BASE },
  Breathing: BREATHING,
  'Off Axis': OFF_AXIS,
  Escher: ESCHER,
  Everything: EVERYTHING,
  'Shot: Rope': shot('rope'),
  'Shot: Over The Edge': shot('overTheEdge', { fallSpeed: 11 }),
  'Shot: Looking Up': shot('lookingUp', { shaftIntensity: 2.4 }),
  'Shot: Near Stair': shot('nearStair', { fogDensity: 0.02 }),
  'Shot: Held Frame': shot('heldFrame', {
    fallSpeed: 0,
    speedDriftAmount: 0,
  }),
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
