export const DEFAULT_PRESET_TARGETS = [
  { target: [-3.4, 1, -1.8] },
  { target: [0, 0.8, 1.2] },
  { target: [3.2, 1.3, -1.4] },
];

export const DEFAULT_KEYBOARD_SHORTCUTS = {
  clear: 'Escape',
  preset: 'KeyP',
  random: 'KeyR',
};

export const DEFAULT_LIGHTNING_PROPS = {
  branchCount: 3,
  coreColor: '#aceeff',
  fadeDuration: 1,
  fallbackPlaneEnabled: true,
  flashIntensity: 0,
  flashRadius: 1.8,
  glowColor: '#1072bd',
  groundPlaneY: 0,
  mainFractalDepth: 6,
  maxConcurrentStrikes: 12,
  roughness: 0.5,
  strikeDuration: 0.15,
  thickness: 0.045,
};

export const DEFAULT_ARC_PROPS = {
  branchCount: 0,
  branchLengthFactorMax: 0.1,
  branchLengthFactorMin: 0.04,
  branchRadiusScale: 0.35,
  mainFractalDepth: 5,
  mainRadiusScale: 0.75,
  roughness: 0.28,
};

export const DEFAULT_EFFECT_CONTROLS = {
  cameraShakeDecay: 10,
  cameraShakeEnabled: false,
  cameraShakeFrequency: 36,
  cameraShakeIntensity: 0.08,
  cracksCountMax: 7,
  cracksCountMin: 4,
  cracksEnabled: true,
  cracksLengthScale: 1,
  debrisCountMax: 8,
  debrisCountMin: 3,
  debrisEnabled: true,
  groundFlashEnabled: true,
  groundFlashIntensity: 0.35,
  groundFlashSize: 5,
  overlayDecay: 8,
  overlayEnabled: true,
  overlayMaxAlpha: 0.6,
  pointLightEnabled: false,
  pointLightIntensity: 0,
  pointLightRadius: 1.8,
  shockwaveAlpha: 0.4,
  shockwaveEnabled: true,
  shockwaveSize: 10,
  sparksCountMax: 40,
  sparksCountMin: 30,
  sparksEnabled: true,
  sparksGravity: 9.5,
  sparksSize: 2.5,
};

export const EFFECT_PRESETS = {
  Default: {
    ...DEFAULT_EFFECT_CONTROLS,
  },
  Minimal: {
    ...DEFAULT_EFFECT_CONTROLS,
    cameraShakeEnabled: false,
    cracksEnabled: false,
    debrisEnabled: false,
    groundFlashEnabled: false,
    overlayEnabled: false,
    pointLightEnabled: false,
    shockwaveEnabled: false,
    sparksEnabled: false,
  },
  Arc: {
    ...DEFAULT_EFFECT_CONTROLS,
    cameraShakeEnabled: false,
    cracksEnabled: false,
    debrisEnabled: false,
    groundFlashEnabled: false,
    overlayEnabled: false,
    pointLightEnabled: false,
    shockwaveEnabled: false,
    sparksEnabled: false,
  },
  Impact: {
    ...DEFAULT_EFFECT_CONTROLS,
    cracksLengthScale: 0.8,
    groundFlashIntensity: 0.5,
    overlayMaxAlpha: 0.25,
    pointLightEnabled: true,
    pointLightIntensity: 0.9,
    sparksCountMax: 48,
    sparksCountMin: 36,
  },
  Storm: {
    ...DEFAULT_EFFECT_CONTROLS,
    cameraShakeEnabled: true,
    cameraShakeIntensity: 0.075,
    overlayMaxAlpha: 0.52,
    pointLightEnabled: true,
    pointLightIntensity: 1.25,
    shockwaveAlpha: 0.55,
    sparksCountMax: 64,
    sparksCountMin: 44,
  },
};

export const DEFAULT_RANDOM_BOUNDS = {
  avoidCameraRadius: 10,
  centerX: 0,
  centerZ: 0,
  maxAttempts: 40,
  maxHeight: 24,
  maxX: 18,
  maxZ: 18,
  minHeight: 15,
  minX: -18,
  minZ: -18,
  radialMax: 38,
  radialMin: 8,
  sourceSpread: 1.5,
  topJitter: 1.5,
};

export const DEFAULT_CAMERA = {
  fov: 60,
  position: [0, 11, 28],
  target: [0, 0, 0],
};

export const DEFAULT_SCENE = {
  ambientIntensity: 0.72,
  backgroundColor: '#242832',
  directionalIntensity: 0.95,
  directionalPosition: [15, 30, 10],
  groundColor: '#4a5568',
  groundMetalness: 0,
  groundRoughness: 1,
  groundSize: 80,
  hemiGroundColor: '#64748b',
  hemiIntensity: 0.72,
  hemiSkyColor: '#dbeafe',
};

export const DEFAULT_SOURCE_POINT = [0, 20, 0];
export const CONTROL_KEY = 'Lightning Lab';

export const ANCHOR_FALLBACK_SOURCE = [-1.5, 1.5, 0];
export const ANCHOR_FALLBACK_TARGET = [1.5, 1.5, 0];

export const WATER_DEPTH = 3.4;
export const WATER_HEIGHT = 2.2;
export const WATER_POSITION = [0, 0, -4.1];
export const WATER_WAVE_CHOPPINESS = 0.48;
export const WATER_WAVE_HEIGHT = 0.12;
export const WATER_WAVE_SPEED = 0.72;
export const WATER_WIDTH = 3.4;
