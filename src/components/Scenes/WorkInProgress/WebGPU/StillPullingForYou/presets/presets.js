// Scene presets for the WebGPU StillPullingForYou scene.
// WebGL-only post-processing keys (painterly, outline, hatching) are omitted.

const STILL_PULLING = {
  // Scene
  backgroundColor: '#00101f',
  cameraMode: 'Fixed',
  ambientIntensity: 0.8,
  mainLightIntensity: 1.2,
  fillLightIntensity: 0.4,

  // Tugboat — fixed, nose-up, half sunk
  boatMode: 'Fixed',
  boatVisible: true,
  boatPosition: { x: 0, y: 0.65, z: 0.4 },
  boatRotation: { x: 0, y: -0.7, z: 0.6 },
  boatScale: 0.12,
  floatDraft: -0.05,
  tiltDamping: 0.3,

  // Boat Lights
  lightDebug: false,
  headlightVisible: true,
  headlightX: 6,
  headlightY: 13.5,
  headlightZ: -1.6,
  headlightIntensity: 2,
  headlightDistance: 8,
  headlightColor: '#ffe8b0',
  headlightMode: 'shorting',
  cabinVisible: true,
  cabinX: 1.8,
  cabinY: 10.4,
  cabinZ: -1.5,
  cabinIntensity: 5,
  cabinDistance: 0.5,
  cabinColor: '#ffd080',
  cabinMode: 'shorting',

  // Sparkles — bugs flocking to the headlight
  sparklesVisible: true,
  sparklesCount: 6,
  sparklesSize: 2.0,
  sparklesSpeed: 1.5,
  sparklesScale: 3,
  sparklesColor: '#ffedb1',
  sparklesIntensity: 3,

  // Smoke — visible
  smokeVisible: true,
  editSplines: false,

  // Water — wavy
  waterVisible: true,
  waterWidth: 4.0,
  waterDepth: 4.0,
  waterHeight: 2.0,
  waterSegments: 24,
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
  waterShowEdges: false,
  waterEdgeColor: '#1f4455',
  waterEdgeOpacity: 0.65,

  // Seafloor — hidden
  seafloorVisible: false,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.08,
  bumpFrequency: 1.0,
  bumpDetail: 1.0,

  // Post Processing
  bloomEnabled: true,
  bloomIntensity: 1.2,
  bloomRadius: 0.4,
};

const ROUGH_WATERS = {
  // Scene
  backgroundColor: '#000000',
  cameraMode: 'Fixed',
  ambientIntensity: 0.7,
  mainLightIntensity: 1.4,
  fillLightIntensity: 0.5,

  // Tugboat — floating on waves
  boatMode: 'Floating',
  boatVisible: true,
  boatPosition: { x: -0.1, y: 0, z: 0.4 },
  boatRotation: { x: 0, y: -0.9, z: 0.1 },
  boatScale: 0.12,
  floatDraft: 0.66,
  tiltDamping: 0.3,

  // Boat Lights
  lightDebug: false,
  headlightVisible: true,
  headlightX: 6,
  headlightY: 13.5,
  headlightZ: -1.6,
  headlightIntensity: 3,
  headlightDistance: 10,
  headlightColor: '#ffe8b0',
  headlightMode: 'static',
  cabinVisible: true,
  cabinX: 1.8,
  cabinY: 10.4,
  cabinZ: -1.5,
  cabinIntensity: 5,
  cabinDistance: 0.5,
  cabinColor: '#ffd080',
  cabinMode: 'static',

  // Sparkles — bugs flocking to the headlight
  sparklesVisible: true,
  sparklesCount: 6,
  sparklesSize: 2.0,
  sparklesSpeed: 1.5,
  sparklesScale: 3,
  sparklesColor: '#ffedb1',
  sparklesIntensity: 3,

  // Smoke — visible, with the tail pinned behind the boat
  smokeVisible: true,
  editSplines: false,

  // Water — very wavy
  waterVisible: true,
  waterWidth: 4.0,
  waterDepth: 4.0,
  waterHeight: 2.0,
  waterSegments: 24,
  waterTopColor: '#2a7f8f',
  waterBottomColor: '#1a5060',
  waterOpacity: 0.8,
  waterTransmission: 0.4,
  waterRoughness: 0.7,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.19,
  waveChoppiness: 1.13,
  waveSpeed: 0.9,
  waterShowEdges: false,
  waterEdgeColor: '#1f4455',
  waterEdgeOpacity: 0.65,

  // Seafloor — hidden
  seafloorVisible: false,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.12,
  bumpFrequency: 1.5,
  bumpDetail: 0.8,

  // Post Processing
  bloomEnabled: true,
  bloomIntensity: 1.0,
  bloomRadius: 0.35,
};

const SUNK = {
  // Scene
  backgroundColor: '#d9d9d9',
  cameraMode: 'Fixed',
  ambientIntensity: 0.5,
  mainLightIntensity: 0.8,
  fillLightIntensity: 0.3,

  // Tugboat — at the bottom
  boatMode: 'Fixed',
  boatVisible: true,
  boatPosition: { x: 0.45, y: -0.9, z: -0.3 },
  boatRotation: { x: 1.3, y: 0.2, z: 0.6 },
  boatScale: 0.12,
  floatDraft: -0.05,
  tiltDamping: 0.3,

  // Boat Lights
  lightDebug: false,
  headlightVisible: true,
  headlightX: 6,
  headlightY: 13.5,
  headlightZ: -1.6,
  headlightIntensity: 1,
  headlightDistance: 6,
  headlightColor: '#ffe8b0',
  headlightMode: 'dying',
  cabinVisible: true,
  cabinX: 1.8,
  cabinY: 10.4,
  cabinZ: -1.5,
  cabinIntensity: 5,
  cabinDistance: 0.5,
  cabinColor: '#ffd080',
  cabinMode: 'dying',

  // Sparkles — off underwater
  sparklesVisible: false,
  sparklesCount: 6,
  sparklesSize: 2.0,
  sparklesSpeed: 1.5,
  sparklesScale: 3,
  sparklesColor: '#ffedb1',
  sparklesIntensity: 3,

  // Smoke — hidden
  smokeVisible: false,
  editSplines: false,

  // Water — calm
  waterVisible: true,
  waterWidth: 4.0,
  waterDepth: 4.0,
  waterHeight: 2.0,
  waterSegments: 24,
  waterTopColor: '#3a8a96',
  waterBottomColor: '#1a4a58',
  waterOpacity: 0.9,
  waterTransmission: 0.35,
  waterRoughness: 0.5,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.13,
  waveChoppiness: 0.4,
  waveSpeed: 0.25,
  waterShowEdges: false,
  waterEdgeColor: '#1f4455',
  waterEdgeOpacity: 0.65,

  // Seafloor — visible
  seafloorVisible: true,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.06,
  bumpFrequency: 0.8,
  bumpDetail: 0.6,

  // Post Processing
  bloomEnabled: true,
  bloomIntensity: 0.6,
  bloomRadius: 0.3,
};

export const SCENE_PRESETS = {
  'Still Pulling': STILL_PULLING,
  'Rough Waters': ROUGH_WATERS,
  Sunk: SUNK,
};

export default SCENE_PRESETS;
