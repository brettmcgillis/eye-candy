import { buildSceneCameraControlValues } from '../../../../../../hooks/sceneCameraUtils';
import {
  AISLE9_CAMERA_SPLINES,
  DEFAULT_AISLE9_CAMERA_SPLINE,
} from '../../../../../../presets/spline/aisle9CameraSplines';
import CENTER_STORE_REF_POSITION from '../../../../../elements/sevenEleven/sevenElevenAnchors';

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
  'skyboxEnabled',
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
  'retroEnabled',
  'retroCurvature',
  'retroColorDepthSteps',
  'retroScanlineIntensity',
  'retroScanlineDensity',
  'retroScanlineSpeed',
  'retroVignetteIntensity',
  'retroColorBleeding',
  'retroAffineDistortion',
  'surveillanceOverlayEnabled',
  'surveillanceCameraLabel',
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

const STORE_CENTER = [
  CENTER_STORE_REF_POSITION.x,
  CENTER_STORE_REF_POSITION.y,
  CENTER_STORE_REF_POSITION.z,
];
const BLACK_HOLE_DIAMETER_METERS = 0.3048;
const DISK_DIAMETER_METERS = 1.08;
const V1_GUIDED_TOUR_SPLINE =
  AISLE9_CAMERA_SPLINES[DEFAULT_AISLE9_CAMERA_SPLINE];

const DEFAULT_LENS_DIAMETER = 1.55;

function vectorToTuple(vector) {
  return [vector.x, vector.y, vector.z];
}

const STORE_CENTER_WORLD = [52, -328, -346];

const STORE_ORBIT_CAMERA = {
  desktop: {
    fov: 52,
    pivot: STORE_CENTER_WORLD,
    position: [0, 240, 480],
    target: STORE_CENTER_WORLD,
  },
  mobile: {
    fov: 62,
    pivot: STORE_CENTER_WORLD,
    position: [0, 240, 480],
    target: STORE_CENTER_WORLD,
  },
};

const PARKING_LOT_ORBIT_CAMERA = {
  desktop: {
    fov: 50,
    pivot: [1428.3735, 28.5588, 3714.1915],
    position: [1895.8851, -94.9794, 5028.0299],
    target: [1428.3735, 28.5588, 3714.1915],
  },
  mobile: {
    fov: 50,
    pivot: [1428.3735, 28.5588, 3714.1915],
    position: [1895.8851, -94.9794, 5028.0299],
    target: [1428.3735, 28.5588, 3714.1915],
  },
};

export const SURVEILLANCE_SHOT_LABELS = {
  surveillance1: 'CAM 01',
  surveillance2: 'CAM 02',
  surveillance3: 'CAM 03',
  parkingLot: 'PARKING LOT',
  backAlley: 'ALLEY',
  stockRoom: 'STOCK ROOM',
};

const STORE_FIXED_SHOTS = {
  surveillance1: {
    desktop: {
      fov: 80,
      position: [1391.178, 488.9425, -1378.6474],
      target: [14.6585, -368.5795, -176.0343],
    },
    mobile: {
      fov: 80,
      position: [1391.178, 488.9425, -1378.6474],
      target: [14.6585, -368.5795, -176.0343],
    },
  },
  surveillance2: {
    desktop: {
      fov: 80,
      position: [1942.5989, 541.7598, 508.8782],
      target: [421.1822, -259.0559, -662.6165],
    },
    mobile: {
      fov: 80,
      position: [1942.5989, 541.7598, 508.8782],
      target: [421.1822, -259.0559, -662.6165],
    },
  },
  surveillance3: {
    desktop: {
      fov: 80,
      position: [-1560.9531, 530.6089, 616.6168],
      target: [-280.2008, -356.8199, -199.3305],
    },
    mobile: {
      fov: 80,
      position: [-1560.9531, 530.6089, 616.6168],
      target: [-280.2008, -356.8199, -199.3305],
    },
  },
  parkingLot: {
    desktop: {
      fov: 80,
      position: [2731.4239, 369.7285, 57.6482],
      target: [654.058, -598.7095, 1706.3125],
    },
    mobile: {
      fov: 80,
      position: [2731.4239, 369.7285, 57.6482],
      target: [654.058, -598.7095, 1706.3125],
    },
  },
  backAlley: {
    desktop: {
      fov: 80,
      position: [-683.703, 1038.5103, -5838.9676],
      target: [7031.5736, -2702.3475, -7679.2539],
    },
    mobile: {
      fov: 80,
      position: [-683.703, 1038.5103, -5838.9676],
      target: [7031.5736, -2702.3475, -7679.2539],
    },
  },
  stockRoom: {
    desktop: {
      fov: 80,
      position: [-3332.5039, 468.7574, -5452.2801],
      target: [2997.8608, -3831.5421, 0.0777],
    },
    mobile: {
      fov: 80,
      position: [-3332.5039, 468.7574, -5452.2801],
      target: [2997.8608, -3831.5421, 0.0777],
    },
  },
};

const STORE_GUIDED_PATH = V1_GUIDED_TOUR_SPLINE.points.map((point) => ({
  position: vectorToTuple(point.position),
}));

const BASE_LEGACY_BLACK_HOLE = {
  legacyBlackHoleDiameter: BLACK_HOLE_DIAMETER_METERS,
  legacyDiskDiameter: DISK_DIAMETER_METERS,
  legacyLensDiameter: DEFAULT_LENS_DIAMETER,
  legacyGravityStrength: 1,
  legacyStepCount: 100,
  legacyDiskBrightness: 0.9,
  legacyDiskTemperature: 8000,
  legacyDopplerStrength: 1,
  legacyAccretionMinRadius: 1.5,
  legacyAccretionWidth: 5,
  legacyMaxRevolutions: 2,
  legacyStarBrightness: 1,
  legacyGalaxyBrightness: 0.4,
  legacyUseProceduralDisk: true,
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
};

const BASE_POST = {
  bloomEnabled: false,
  retroEnabled: false,
  retroCurvature: 0.02,
  retroColorDepthSteps: 32,
  retroScanlineIntensity: 1,
  retroScanlineDensity: 1,
  retroScanlineSpeed: 0.1,
  retroVignetteIntensity: 0.3,
  retroColorBleeding: 0.01,
  retroAffineDistortion: 1,
  surveillanceOverlayEnabled: false,
};

const BASE_NIGHT_LIGHTS = {
  ambientColor: '#1a2440',
  ambientIntensity: 0.35,
  moonColor: '#010101',
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
  signGlowIntensity: 0,
};

const BASE_STORE = {
  setting: SETTING_INDOOR,
  blackHoleEnabled: true,
  skyboxEnabled: true,
  skyboxRotation: { x: 159, y: -93, z: -11 },
  skyboxRotationX: 159,
  skyboxRotationY: -93,
  skyboxRotationZ: -11,
  storePosition: { x: 0, y: 0, z: 0 },
  storeRotation: { x: 0, y: 0, z: 0 },
  storeScale: 320,
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
      closed: V1_GUIDED_TOUR_SPLINE.closed,
      desktop: {
        fov: 60,
        target: STORE_CENTER,
      },
      duration: 38,
      fov: 60,
      mobile: {
        fov: 85,
        target: STORE_CENTER,
      },
      orientationMode: 'target',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
      tension: V1_GUIDED_TOUR_SPLINE.tension,
    },
    blackHolePosition: {
      x: STORE_CENTER[0],
      y: STORE_CENTER[1],
      z: STORE_CENTER[2],
    },
    blackHoleVariant: BLACK_HOLE_VARIANT_SINGULARITY,
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

export const PRESETS = {
  Store: createPreset({}),
  'Parking Lot': createPreset({
    setting: SETTING_OUTDOOR,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
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
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: PARKING_LOT_ORBIT_CAMERA,
    cameraFar: 30000,
    orbitMinDistance: 1000,
    orbitMaxDistance: 20000,
  }),
  'Guided Tour': createPreset({
    cameraMode: CAMERA_MODE_SPLINE,
    cameraSpline: {
      closed: V1_GUIDED_TOUR_SPLINE.closed,
      desktop: {
        fov: 60,
        target: STORE_CENTER,
      },
      duration: 42,
      fov: 60,
      mobile: {
        fov: 85,
        target: STORE_CENTER,
      },
      orientationMode: 'target',
      points: STORE_GUIDED_PATH,
      target: STORE_CENTER,
      tension: V1_GUIDED_TOUR_SPLINE.tension,
    },
  }),
  Surveillance: createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance1',
    surveillanceCameraLabel: 'CAM 01',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
  }),
  'Surveillance 2': createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance2',
    surveillanceCameraLabel: 'CAM 02',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
  }),
  'Surveillance 3': createPreset({
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'surveillance3',
    surveillanceCameraLabel: 'CAM 03',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
  }),
  'Parking Lot Cam': createPreset({
    setting: SETTING_OUTDOOR,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
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
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'parkingLot',
    surveillanceCameraLabel: 'PARKING LOT',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
  }),
  'Back Alley': createPreset({
    setting: SETTING_OUTDOOR,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
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
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'backAlley',
    surveillanceCameraLabel: 'ALLEY',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
  }),
  'Stock Room': createPreset({
    setting: SETTING_OUTDOOR,
    blackHoleEnabled: false,
    orbitingBodiesEnabled: false,
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
    cameraMode: CAMERA_MODE_FIXED,
    fixedCameraShot: 'stockRoom',
    surveillanceCameraLabel: 'STOCK ROOM',
    surveillanceOverlayEnabled: true,
    retroEnabled: true,
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
