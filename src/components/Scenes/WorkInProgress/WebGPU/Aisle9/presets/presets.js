import { buildSceneCameraControlValues } from '../../../../../../hooks/sceneCameraUtils';
import {
  INTERIOR_OPERATOR_CAMERA,
  PARKING_LOT_ORBIT_CAMERA,
  STORE_CENTER,
  STORE_FIXED_SHOTS,
  STORE_GUIDED_PATH,
  STORE_ORBIT_CAMERA,
  V1_SPLINE_PROPS,
} from './cameraData';

export const CAMERA_MODE_ORBIT = 'orbit';
export const CAMERA_MODE_FIXED = 'fixed';
export const CAMERA_MODE_SPLINE = 'spline';

export const BLACK_HOLE_VARIANT_LEGACY_PORT = 'legacyPort';
export const BLACK_HOLE_VARIANT_WEBGPU = 'webgpu';
export const BLACK_HOLE_VARIANT_SINGULARITY = 'singularity';

export const STORE_VARIANT_SEVEN_ELEVEN = 'sevenEleven';
export const STORE_VARIANT_AISLE9 = 'aisle9Store';

export const SETTING_INDOOR = 'indoor';
export const SETTING_OUTDOOR = 'outdoor';

export const DEFAULT_PRESET = 'Store';

const LEGACY_CONTROL_KEYS = [
  'legacyDiskVariant',
  'legacyBlackHoleDiameter',
  'legacyDiskDiameter',
  'legacyLensDiameter',
  'legacyGravityStrength',
  'legacyStepCount',
  'legacyDiskBrightness',
  'legacyDiskTemperature',
  'legacyDopplerStrength',
  'legacyAccretionMinRadius',
  'legacyAccretionWidth',
  'legacyMaxRevolutions',
  'legacyStarBrightness',
  'legacyGalaxyBrightness',
  'legacyUseProceduralDisk',
  'legacyChromaticRingFreq',
  'legacyChromaticAnimSpeed',
  'legacyChromaticColorSpeed',
  'legacyChromaticSaturation',
  'legacyRibbonRotationSpeed',
  'legacyRibbonBandScale',
  'legacyRibbonBiasStrength',
];

const WEBGPU_CONTROL_KEYS = [
  'webgpuBlackHoleDiameter',
  'webgpuDiskDiameter',
  'webgpuLensDiameter',
  'webgpuMass',
  'webgpuDiskInnerRadius',
  'webgpuDiskOuterRadius',
  'webgpuDiskBrightness',
  'webgpuTemperature',
  'webgpuTemperatureFalloff',
  'webgpuLensingStrength',
  'webgpuDopplerStrength',
  'webgpuRotationSpeed',
  'webgpuStepCount',
  'webgpuStepSize',
  'webgpuTurbulenceScale',
  'webgpuTurbulenceStretch',
  'webgpuTurbulenceSharpness',
  'webgpuTurbulenceCycleTime',
  'webgpuTurbulenceLacunarity',
  'webgpuTurbulencePersistence',
  'webgpuDiskEdgeSoftnessInner',
  'webgpuDiskEdgeSoftnessOuter',
];

const SINGULARITY_CONTROL_KEYS = [
  'singularityLensDiameter',
  'singularityIterations',
  'singularityStepSize',
  'singularityPower',
  'singularityOriginRadius',
  'singularityBandWidth',
  'singularityFieldScale',
  'singularityRampPos1',
  'singularityRampPos2',
  'singularityRampPos3',
  'singularityRampColor1',
  'singularityRampColor2',
  'singularityRampColor3',
  'singularityEmissionStrength',
];

const CONTROL_KEYS = [
  'blackHoleEnabled',
  'blackHoleVariant',
  'orbitingBodiesEnabled',
  'skyTurbidity',
  'skyRayleigh',
  'skyMieCoefficient',
  'skyMieDirectionalG',
  'skyElevation',
  'skyAzimuth',
  'skyShowSunDisc',
  'skyCloudCoverage',
  'skyCloudDensity',
  'skyCloudElevation',
  'skyboxEnabled',
  'skyboxMode',
  'skyboxRotationEnabled',
  'skyboxRotationSpeed',
  'skyboxRotation',
  ...LEGACY_CONTROL_KEYS,
  ...WEBGPU_CONTROL_KEYS,
  ...SINGULARITY_CONTROL_KEYS,
  'bodyOrbitRadius',
  'bodyOrbitHeight',
  'bodyOrbitSpeed',
  'body1Scale',
  'body1Instances',
  'body2Scale',
  'body2Instances',
  'body3Scale',
  'body3Instances',
  'body4Scale',
  'body4Instances',
  'body5Scale',
  'body5Instances',
  'body6Scale',
  'body6Instances',
  'bloomEnabled',
  'bloomStrength',
  'bloomRadius',
  'bloomThreshold',
  'bloomToneMappingExposure',
  'retroEnabled',
  'retroCurvature',
  'retroColorDepthSteps',
  'retroScanlineIntensity',
  'retroScanlineDensity',
  'retroScanlineSpeed',
  'retroVignetteIntensity',
  'retroColorBleeding',
  'retroAffineDistortion',
  'chromaticAberrationEnabled',
  'chromaticAberrationStrength',
  'chromaticAberrationScale',
  'chromaticAberrationCenterX',
  'chromaticAberrationCenterY',
  'surveillanceOverlayEnabled',
  'surveillanceCameraLabel',
  'recordingOverrideEnabled',
  'recordingStartDate',
  'recordingStartTime',
  'setting',
  'ambientColor',
  'ambientIntensity',
  'moonColor',
  'moonIntensity',
  'outdoorEmissiveColor',
  'outdoorEmissiveIntensity',
  'outdoorLightColor',
  'outdoorLightIntensity',
  'indoorEmissiveColor',
  'indoorEmissiveIntensity',
  'indoorLightColor',
  'indoorLightIntensity',
  'storeFillColor',
  'storeFillIntensity',
  'signEmissiveColor',
  'signGlowIntensity',
];

const BLACK_HOLE_DIAMETER_METERS = 0.3048;
const DISK_DIAMETER_METERS = 1.08;
const DEFAULT_LENS_DIAMETER = 1.55;

const BASE_LEGACY_BLACK_HOLE = {
  legacyDiskVariant: 'ribbon',
  legacyBlackHoleDiameter: BLACK_HOLE_DIAMETER_METERS,
  legacyDiskDiameter: DISK_DIAMETER_METERS,
  legacyLensDiameter: DEFAULT_LENS_DIAMETER,
  legacyGravityStrength: 1,
  legacyStepCount: 100,
  legacyDiskBrightness: 1.67,
  legacyDiskTemperature: 8000,
  legacyDopplerStrength: 1,
  legacyAccretionMinRadius: 1.5,
  legacyAccretionWidth: 5,
  legacyMaxRevolutions: 2,
  legacyStarBrightness: 1,
  legacyGalaxyBrightness: 0.4,
  legacyUseProceduralDisk: true,
  legacyChromaticRingFreq: 1.0,
  legacyChromaticAnimSpeed: 1.0,
  legacyChromaticColorSpeed: 0.5,
  legacyChromaticSaturation: 0.45,
  legacyRibbonRotationSpeed: 0.02,
  legacyRibbonBandScale: 16,
  legacyRibbonBiasStrength: 0.05,
};

const BASE_WEBGPU_BLACK_HOLE = {
  webgpuBlackHoleDiameter: BLACK_HOLE_DIAMETER_METERS,
  webgpuDiskDiameter: DISK_DIAMETER_METERS,
  webgpuLensDiameter: DEFAULT_LENS_DIAMETER,
  webgpuMass: 0.4,
  webgpuDiskInnerRadius: 4.1,
  webgpuDiskOuterRadius: 14.5,
  webgpuDiskBrightness: 5,
  webgpuTemperature: 49.78,
  webgpuTemperatureFalloff: 5.22,
  webgpuLensingStrength: 2.4,
  webgpuDopplerStrength: 1,
  webgpuRotationSpeed: -8.7,
  webgpuStepCount: 64,
  webgpuStepSize: 1,
  webgpuTurbulenceScale: 1.81,
  webgpuTurbulenceStretch: 0.75,
  webgpuTurbulenceSharpness: 7.4,
  webgpuTurbulenceCycleTime: 5,
  webgpuTurbulenceLacunarity: 3,
  webgpuTurbulencePersistence: 0.8,
  webgpuDiskEdgeSoftnessInner: 0.18,
  webgpuDiskEdgeSoftnessOuter: 0.5,
};

const BASE_SINGULARITY_BLACK_HOLE = {
  singularityLensDiameter: DEFAULT_LENS_DIAMETER,
  singularityIterations: 112,
  singularityStepSize: 0.011,
  singularityPower: 0.26,
  singularityOriginRadius: 0.11,
  singularityBandWidth: 0.058,
  singularityFieldScale: 3.8,
  singularityRampPos1: 0.05,
  singularityRampPos2: 0.425,
  singularityRampPos3: 1,
  singularityRampColor1: '#f2b670',
  singularityRampColor2: '#3d180a',
  singularityRampColor3: '#050505',
  singularityEmissionStrength: 1.9,
};

const BASE_BODIES = {
  orbitingBodiesEnabled: true,
  bodyOrbitRadius: 0.75,
  bodyOrbitHeight: 0.1,
  bodyOrbitSpeed: 0.22,
  body1Scale: 1,
  body1Instances: 1,
  body2Scale: 1,
  body2Instances: 1,
  body3Scale: 1,
  body3Instances: 1,
  body4Scale: 1,
  body4Instances: 1,
  body5Scale: 1,
  body5Instances: 1,
  body6Scale: 1,
  body6Instances: 1,
};

const BASE_POST = {
  bloomEnabled: false,
  bloomStrength: 0.217,
  bloomRadius: 0,
  bloomThreshold: 0,
  bloomToneMappingExposure: 1.2,
  retroEnabled: true,
  retroCurvature: 0.02,
  retroColorDepthSteps: 32,
  retroScanlineIntensity: 1,
  retroScanlineDensity: 1,
  retroScanlineSpeed: 0.1,
  retroVignetteIntensity: 0.3,
  retroColorBleeding: 0.01,
  retroAffineDistortion: 1,
  chromaticAberrationEnabled: false,
  chromaticAberrationStrength: 1.2,
  chromaticAberrationScale: 1.25,
  chromaticAberrationCenterX: 0.5,
  chromaticAberrationCenterY: 0.5,
  surveillanceOverlayEnabled: false,
};

// Shared night lighting for all outdoor presets.
// storePosition/storeRotation/storeScale and orbitMinDistance/orbitMaxDistance
// are preset-only values — not exposed as leva controls since they are stable
// per-preset and don't need per-frame tuning.
const BASE_OUTDOOR_NIGHT = {
  ambientColor: '#1a2440',
  ambientIntensity: 0.35,
  moonColor: '#7090cc',
  moonIntensity: 2,
  outdoorEmissiveColor: '#ffcc44',
  outdoorEmissiveIntensity: 10,
  outdoorLightColor: '#ffcc44',
  outdoorLightIntensity: 6,
  indoorEmissiveColor: '#fffbe0',
  indoorEmissiveIntensity: 10,
  indoorLightColor: '#fffbe0',
  indoorLightIntensity: 5,
  storeFillColor: '#ffe8c0',
  storeFillIntensity: 1,
  signEmissiveColor: '#ede9ac',
  signGlowIntensity: 1.5,
};

const BASE_NIGHT_LIGHTS = {
  ...BASE_OUTDOOR_NIGHT,
  moonColor: '#010101',
  signGlowIntensity: 0,
};

const BASE_STORE = {
  setting: SETTING_INDOOR,
  blackHoleEnabled: true,
  skyTurbidity: 8,
  skyRayleigh: 4,
  skyMieCoefficient: 0.005,
  skyMieDirectionalG: 0.8,
  skyElevation: 0.3,
  skyAzimuth: 180,
  skyShowSunDisc: true,
  skyCloudCoverage: 0.4,
  skyCloudDensity: 0.4,
  skyCloudElevation: 0.5,
  skyboxEnabled: true,
  skyboxMode: 'night',
  skyboxRotationEnabled: true,
  skyboxRotationSpeed: 2,
  skyboxRotation: { x: 159, y: -93, z: -11 },
  storePosition: { x: 0, y: 0, z: 0 },
  storeRotation: { x: 0, y: 0, z: 0 },
  storeScale: 320,
};

const CCTV_RECORDING_DATE = '2026-05-15';

const CCTV_NIGHT_TIMESTAMP = {
  recordingOverrideEnabled: true,
  recordingStartDate: CCTV_RECORDING_DATE,
  recordingStartTime: '02:47:00',
};

const CCTV_DAY_TIMESTAMP = {
  recordingOverrideEnabled: true,
  recordingStartDate: CCTV_RECORDING_DATE,
  recordingStartTime: '05:55:00',
};

// Dawn sky — sun just cresting the horizon (~5:55am). High turbidity and
// low elevation produce the warm orange/pink gradient; azimuth 90 puts the
// sun in the east where it belongs.
const BASE_DAY_SKY = {
  skyboxMode: 'day',
  skyboxRotationEnabled: false,
  skyTurbidity: 12,
  skyRayleigh: 0.83,
  skyMieCoefficient: 0.01,
  skyMieDirectionalG: 0.95,
  skyElevation: 5,
  skyAzimuth: -66,
  skyShowSunDisc: true,
};

// Dawn lighting — store fixtures still burning, moon almost gone,
// ambient warm and dim rather than the full-brightness midday read.
const BASE_DAY_LIGHTS = {
  ambientColor: '#e8956a',
  ambientIntensity: 0.7,
  moonColor: '#4060aa',
  moonIntensity: 0.3,
  outdoorEmissiveColor: '#ffcc44',
  outdoorEmissiveIntensity: 6,
  outdoorLightColor: '#ffcc44',
  outdoorLightIntensity: 3,
  indoorEmissiveColor: '#fffbe0',
  indoorEmissiveIntensity: 8,
  indoorLightColor: '#fffbe0',
  indoorLightIntensity: 4,
  storeFillColor: '#ffb87a',
  storeFillIntensity: 0.6,
  signEmissiveColor: '#ede9ac',
  signGlowIntensity: 1.5,
};

const OUTDOOR_BASE_DAY = {
  ...BASE_DAY_SKY,
  ...BASE_DAY_LIGHTS,
  setting: SETTING_OUTDOOR,
  blackHoleEnabled: false,
  orbitingBodiesEnabled: false,
};

// Sky settings tuned for interior surveillance cams looking through the
// sevenElevenLow store windows — different from the exterior orbit view.
const BASE_INDOOR_DAY_SKY = {
  skyboxMode: 'day',
  skyboxRotationEnabled: false,
  skyTurbidity: 3.4,
  skyRayleigh: 0.14,
  skyMieCoefficient: 0.01,
  skyMieDirectionalG: 1,
  skyElevation: 8.5,
  skyAzimuth: 35.8,
  skyShowSunDisc: true,
  skyCloudCoverage: 0.62,
  skyCloudDensity: 0.16,
  skyCloudElevation: 0.81,
};

const BASE_INDOOR_DAY = {
  ...BASE_INDOOR_DAY_SKY,
  ...BASE_DAY_LIGHTS,
};

// BH size tiers — singularity variant only. Values will likely need
// per-shot tuning once rendered; these are proportional starting points.
const BH_SINGULARITY_MED = {
  singularityLensDiameter: 2.5,
  singularityFieldScale: 5.5,
  singularityOriginRadius: 0.18,
  singularityBandWidth: 0.09,
  singularityEmissionStrength: 2.4,
};

const BH_SINGULARITY_LG = {
  singularityLensDiameter: 4.5,
  singularityFieldScale: 9.0,
  singularityOriginRadius: 0.3,
  singularityBandWidth: 0.14,
  singularityEmissionStrength: 3.0,
};

// Orbiting body counts for escalating intensity
const BODIES_MORE = {
  orbitingBodiesEnabled: true,
  body1Instances: 3,
  body2Instances: 2,
  body3Instances: 3,
  body4Instances: 2,
  body5Instances: 2,
  body6Instances: 2,
  bodyOrbitSpeed: 0.32,
  bodyOrbitRadius: 0.9,
};

const BODIES_MOST = {
  orbitingBodiesEnabled: true,
  body1Instances: 5,
  body2Instances: 4,
  body3Instances: 5,
  body4Instances: 4,
  body5Instances: 4,
  body6Instances: 4,
  bodyOrbitSpeed: 0.42,
  bodyOrbitRadius: 1.1,
};

function createPreset(overrides) {
  return {
    cameraMode: CAMERA_MODE_ORBIT,
    fixedCameraShot: 'surveillance1',
    cameraNear: 0.1,
    cameraFar: 20000,
    cameraAutoFit: false,
    cameraOrbit: STORE_ORBIT_CAMERA,
    cameraFixed: {
      activeShot: 'surveillance1',
      behavior: 'single',
      shots: STORE_FIXED_SHOTS,
    },
    cameraSpline: {
      ...V1_SPLINE_PROPS,
      desktop: { fov: 60, target: STORE_CENTER },
      duration: 38,
      fov: 60,
      mobile: { fov: 120, target: STORE_CENTER },
      orientationMode: 'target',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
    },
    blackHoleVariant: BLACK_HOLE_VARIANT_LEGACY_PORT,
    ...BASE_LEGACY_BLACK_HOLE,
    ...BASE_WEBGPU_BLACK_HOLE,
    ...BASE_SINGULARITY_BLACK_HOLE,
    ...BASE_BODIES,
    ...BASE_POST,
    ...BASE_NIGHT_LIGHTS,
    ...BASE_STORE,
    ...overrides,
  };
}

function createCamPreset(shotKey, label, overrides = {}) {
  return createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: shotKey,
    surveillanceCameraLabel: label,
    surveillanceOverlayEnabled: true,
    ...overrides,
  });
}

export function buildAisle9CameraDeclaration(snapshot = {}) {
  return {
    cameraAutoFit: snapshot.cameraAutoFit,
    cameraMode: snapshot.cameraMode,
    far: snapshot.cameraFar,
    fixed: {
      ...snapshot.cameraFixed,
      activeShot: snapshot.fixedCameraShot ?? snapshot.cameraFixed?.activeShot,
    },
    near: snapshot.cameraNear,
    orbit: snapshot.cameraOrbit,
    spline: snapshot.cameraSpline,
  };
}

export const SURVEILLANCE_SHOT_LABELS = {
  surveillance1: 'CAM 01',
  surveillance2: 'CAM 02',
  surveillance3: 'CAM 03',
  parkingLot: 'PARKING LOT',
  backAlley: 'ALLEY',
  stockRoom: 'STOCK ROOM',
};

const OUTDOOR_BASE = {
  setting: SETTING_OUTDOOR,
  blackHoleEnabled: false,
  orbitingBodiesEnabled: false,
  ...BASE_OUTDOOR_NIGHT,
};

export const PRESETS = {
  Store: createPreset({}),

  'Parking Lot': createPreset({
    ...OUTDOOR_BASE,
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: PARKING_LOT_ORBIT_CAMERA,
    cameraFar: 30000,
    orbitMinDistance: 1000,
    orbitMaxDistance: 20000,
    skyboxRotation: { x: 90, y: 0, z: -90 },
  }),

  'Guided Tour': createPreset({
    cameraMode: CAMERA_MODE_SPLINE,
    cameraSpline: {
      ...V1_SPLINE_PROPS,
      desktop: { fov: 60, target: STORE_CENTER },
      duration: 42,
      fov: 60,
      mobile: { fov: 85, target: STORE_CENTER },
      orientationMode: 'target',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
    },
  }),

  Surveillance: createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance1',
    surveillanceCameraLabel: 'CAM 01',
    surveillanceOverlayEnabled: true,
  }),

  'Surveillance 2': createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance2',
    surveillanceCameraLabel: 'CAM 02',
    surveillanceOverlayEnabled: true,
  }),

  'Surveillance 3': createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance3',
    surveillanceCameraLabel: 'CAM 03',
    surveillanceOverlayEnabled: true,
  }),

  'Parking Lot Cam': createPreset({
    ...OUTDOOR_BASE,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'parkingLot',
    surveillanceCameraLabel: 'PARKING LOT',
    surveillanceOverlayEnabled: true,
    skyboxRotation: { x: 90, y: 0, z: -90 },
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Back Alley': createPreset({
    ...OUTDOOR_BASE,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'backAlley',
    surveillanceCameraLabel: 'ALLEY',
    surveillanceOverlayEnabled: true,
    skyboxRotation: { x: 90, y: 0, z: -90 },
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Stock Room': createPreset({
    ...OUTDOOR_BASE,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'stockRoom',
    surveillanceCameraLabel: 'STOCK ROOM',
    surveillanceOverlayEnabled: true,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  // ── Exterior operator cams ────────────────────────────────────────────────

  'Exterior - Night': createPreset({
    ...OUTDOOR_BASE,
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: PARKING_LOT_ORBIT_CAMERA,
    cameraFar: 30000,
    skyboxRotation: { x: 90, y: 0, z: -90 },
  }),

  'Exterior - Day': createPreset({
    ...OUTDOOR_BASE_DAY,
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: PARKING_LOT_ORBIT_CAMERA,
    cameraFar: 30000,
  }),

  // ── Cam 1 ─────────────────────────────────────────────────────────────────

  'Cam 1 - Night': createCamPreset('surveillance1', 'CAM 01', {
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 1 - Day': createCamPreset('surveillance1', 'CAM 01', {
    ...BASE_INDOOR_DAY,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_DAY_TIMESTAMP,
  }),

  'Cam 1 - BH': createCamPreset('surveillance1', 'CAM 01', {
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 1 - Med BH': createCamPreset('surveillance1', 'CAM 01', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_MED,
    ...BODIES_MORE,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 1 - LG BH': createCamPreset('surveillance1', 'CAM 01', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_LG,
    ...BODIES_MOST,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  // ── Cam 2 ─────────────────────────────────────────────────────────────────

  'Cam 2 - Night': createCamPreset('surveillance2', 'CAM 02', {
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 2 - Day': createCamPreset('surveillance2', 'CAM 02', {
    ...BASE_INDOOR_DAY,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_DAY_TIMESTAMP,
  }),

  'Cam 2 - BH': createCamPreset('surveillance2', 'CAM 02', {
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 2 - Med BH': createCamPreset('surveillance2', 'CAM 02', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_MED,
    ...BODIES_MORE,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 2 - LG BH': createCamPreset('surveillance2', 'CAM 02', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_LG,
    ...BODIES_MOST,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  // ── Cam 3 ─────────────────────────────────────────────────────────────────

  'Cam 3 - Night': createCamPreset('surveillance3', 'CAM 03', {
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 3 - Day': createCamPreset('surveillance3', 'CAM 03', {
    ...BASE_INDOOR_DAY,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    ...CCTV_DAY_TIMESTAMP,
  }),

  'Cam 3 - BH': createCamPreset('surveillance3', 'CAM 03', {
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 3 - Med BH': createCamPreset('surveillance3', 'CAM 03', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_MED,
    ...BODIES_MORE,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  'Cam 3 - LG BH': createCamPreset('surveillance3', 'CAM 03', {
    blackHoleEnabled: true,
    ...BH_SINGULARITY_LG,
    ...BODIES_MOST,
    ...CCTV_NIGHT_TIMESTAMP,
  }),

  // ── Outdoor fixed cams — day variants ────────────────────────────────────

  'Parking Lot Cam - Day': createPreset({
    ...OUTDOOR_BASE_DAY,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'parkingLot',
    surveillanceCameraLabel: 'PARKING LOT',
    surveillanceOverlayEnabled: true,
    ...CCTV_DAY_TIMESTAMP,
  }),

  'Back Alley - Day': createPreset({
    ...OUTDOOR_BASE_DAY,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'backAlley',
    surveillanceCameraLabel: 'ALLEY',
    surveillanceOverlayEnabled: true,
    ...CCTV_DAY_TIMESTAMP,
  }),

  'Stock Room - Day': createPreset({
    ...OUTDOOR_BASE_DAY,
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'stockRoom',
    surveillanceCameraLabel: 'STOCK ROOM',
    surveillanceOverlayEnabled: true,
    ...CCTV_DAY_TIMESTAMP,
  }),

  // ── Guided Tour ───────────────────────────────────────────────────────────

  'Guided Tour - Day': createPreset({
    ...BASE_INDOOR_DAY,
    cameraMode: CAMERA_MODE_SPLINE,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
    cameraSpline: {
      ...V1_SPLINE_PROPS,
      desktop: { fov: 60, target: STORE_CENTER },
      duration: 42,
      fov: 60,
      mobile: { fov: 85, target: STORE_CENTER },
      orientationMode: 'forward',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
    },
  }),

  'Guided Tour - Night - No BH': createPreset({
    cameraMode: CAMERA_MODE_SPLINE,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,

    cameraSpline: {
      ...V1_SPLINE_PROPS,
      desktop: { fov: 60, target: STORE_CENTER },
      duration: 42,
      fov: 60,
      mobile: { fov: 85, target: STORE_CENTER },
      orientationMode: 'forward',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
    },
  }),

  'Guided Tour - BH': createPreset({
    cameraMode: CAMERA_MODE_SPLINE,
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,

    cameraSpline: {
      ...V1_SPLINE_PROPS,
      desktop: { fov: 60, target: STORE_CENTER },
      duration: 42,
      fov: 60,
      mobile: { fov: 85, target: STORE_CENTER },
      orientationMode: 'target',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
    },
  }),

  // ── Interior operator / orbit ─────────────────────────────────────────────

  'Interior - Night': createPreset({
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
  }),

  'Interior - Day': createPreset({
    ...BASE_INDOOR_DAY,
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
  }),

  'Store - BH - Lensing': createPreset({
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,
    bloomEnabled: true,
    bloomStrength: 0.3,
    bloomThreshold: 0,
  }),

  'Store - BH - CA': createPreset({
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: true,
    orbitingBodiesEnabled: true,
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 2.0,
  }),

  'Store - Med BH - CA': createPreset({
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: true,
    ...BH_SINGULARITY_MED,
    ...BODIES_MORE,
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 3.0,
  }),

  'Store - LG BH - CA': createPreset({
    cameraOrbit: INTERIOR_OPERATOR_CAMERA,
    blackHoleEnabled: true,
    ...BH_SINGULARITY_LG,
    ...BODIES_MOST,
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 5.0,
  }),
};

export function getPresetControls({ presetName, presetSnapshot }) {
  return {
    ...buildSceneCameraControlValues(
      buildAisle9CameraDeclaration(presetSnapshot)
    ),
    ...Object.fromEntries(
      CONTROL_KEYS.filter((key) => key in presetSnapshot).map((key) => [
        key,
        presetSnapshot[key],
      ])
    ),
    preset: presetName,
  };
}
