// Scene presets for Still Pulling For You
// Keys must match the DEFAULTS shape in useStillPullingForYouControls.

const STILL_PULLING = {
  // Scene
  backgroundColor: '#f5f5f0',
  cameraMode: 'Fixed',
  ambientIntensity: 0.8,
  mainLightIntensity: 1.2,
  fillLightIntensity: 0.4,

  // Tugboat — fixed, nose-up, half sunk
  boatMode: 'Fixed',
  boatX: 0.6,
  boatY: 0.65,
  boatZ: -0.2,
  boatScale: 0.12,
  boatRotX: 0,
  boatRotY: 0.8,
  boatRotZ: 0.6,
  floatDraft: -0.05,

  // Smoke — visible
  smokeVisible: true,
  smokeOffsetX: 0.02,
  smokeOffsetY: 0.35,
  smokeOffsetZ: -0.04,
  particleColor: '#a8a8a0',
  smokeOpacity: 0.35,
  particleSize: 25,
  particleCount: 3000,
  flowSpeed: 0.15,
  springK: 1.0,
  damping: 0.93,
  turbulence: 0.5,
  fadeRate: 1.5,
  growth: 2.0,
  fadeExponent: 1.0,

  // Water — wavy
  waterTopColor: '#2a7f8f',
  waterBottomColor: '#1a5060',
  waterOpacity: 0.85,
  waterTransmission: 0.4,
  waterRoughness: 0.6,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.08,
  waveChoppiness: 0.5,
  waveSpeed: 0.6,

  // Seafloor — hidden
  seafloorVisible: false,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.08,
  bumpFrequency: 1.0,
  bumpDetail: 1.0,
};

const ROUGH_WATERS = {
  // Scene
  backgroundColor: '#e8eef2',
  cameraMode: 'Fixed',
  ambientIntensity: 0.7,
  mainLightIntensity: 1.4,
  fillLightIntensity: 0.5,

  // Tugboat — floating on waves
  boatMode: 'Floating',
  boatX: 0,
  boatY: 0,
  boatZ: 0,
  boatScale: 0.12,
  boatRotX: 0,
  boatRotY: 0,
  boatRotZ: 0,
  floatDraft: -0.02,

  // Smoke — visible, more turbulent
  smokeVisible: true,
  smokeOffsetX: 0.02,
  smokeOffsetY: 0.35,
  smokeOffsetZ: -0.04,
  particleColor: '#b0b0a8',
  smokeOpacity: 0.3,
  particleSize: 22,
  particleCount: 3000,
  flowSpeed: 0.2,
  springK: 0.8,
  damping: 0.9,
  turbulence: 0.8,
  fadeRate: 1.5,
  growth: 2.0,
  fadeExponent: 1.0,

  // Water — very wavy
  waterTopColor: '#2a7f8f',
  waterBottomColor: '#1a5060',
  waterOpacity: 0.8,
  waterTransmission: 0.4,
  waterRoughness: 0.7,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.18,
  waveChoppiness: 0.8,
  waveSpeed: 0.9,

  // Seafloor — hidden
  seafloorVisible: false,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.12,
  bumpFrequency: 1.5,
  bumpDetail: 0.8,
};

const SUNK = {
  // Scene
  backgroundColor: '#e0e4e0',
  cameraMode: 'Fixed',
  ambientIntensity: 0.5,
  mainLightIntensity: 0.8,
  fillLightIntensity: 0.3,

  // Tugboat — at the bottom
  boatMode: 'Fixed',
  boatX: 0.45,
  boatY: -0.9,
  boatZ: -0.3,
  boatScale: 0.12,
  boatRotX: 1.3,
  boatRotY: 0.2,
  boatRotZ: 0.6,
  floatDraft: -0.05,

  // Smoke — hidden
  smokeVisible: false,
  smokeOffsetX: 0.02,
  smokeOffsetY: 0.35,
  smokeOffsetZ: -0.04,
  particleColor: '#a8a8a0',
  smokeOpacity: 0.35,
  particleSize: 25,
  particleCount: 3000,
  flowSpeed: 0.15,
  springK: 1.0,
  damping: 0.93,
  turbulence: 0.5,
  fadeRate: 1.5,
  growth: 2.0,
  fadeExponent: 1.0,

  // Water — calm
  waterTopColor: '#3a8a96',
  waterBottomColor: '#1a4a58',
  waterOpacity: 0.9,
  waterTransmission: 0.35,
  waterRoughness: 0.5,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.02,
  waveChoppiness: 0.15,
  waveSpeed: 0.25,

  // Seafloor — visible
  seafloorVisible: true,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.06,
  bumpFrequency: 0.8,
  bumpDetail: 0.6,
};

export const SCENE_PRESETS = {
  'Still Pulling': STILL_PULLING,
  'Rough Waters': ROUGH_WATERS,
  Sunk: SUNK,
};

export default SCENE_PRESETS;
