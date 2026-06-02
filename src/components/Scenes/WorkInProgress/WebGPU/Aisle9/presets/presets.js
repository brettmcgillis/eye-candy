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
  'cameraMode',
  'fixedCameraShot',
  'blackHoleVariant',
  'storeVariant',
  'skyboxRotationX',
  'skyboxRotationY',
  'skyboxRotationZ',
  'storeScale',
  'storePosition',
  'storeRotation',
  ...LEGACY_CONTROL_KEYS,
  ...WEBGPU_CONTROL_KEYS,
  ...SINGULARITY_CONTROL_KEYS,
  'bodyOrbitRadius',
  'bodyOrbitHeight',
  'bodyOrbitSpeed',
  'bloomEnabled',
  'surveillanceOverlayEnabled',
  'surveillanceCameraLabel',
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

const STORE_ORBIT_CAMERA = {
  desktop: {
    fov: 52,
    pivot: STORE_CENTER,
    position: [0, 240, 480],
    target: STORE_CENTER,
  },
  mobile: {
    fov: 62,
    pivot: STORE_CENTER,
    position: [0, 240, 480],
    target: STORE_CENTER,
  },
};

const STORE_FIXED_SHOTS = {
  surveillance1: {
    desktop: {
      fov: 80,
      position: [3, 2.5, -4],
      target: STORE_CENTER,
    },
    mobile: {
      fov: 85,
      position: [3, 2.5, -4],
      target: STORE_CENTER,
    },
  },
  surveillance2: {
    desktop: {
      fov: 80,
      position: [5, 2.5, 1.5],
      target: STORE_CENTER,
    },
    mobile: {
      fov: 85,
      position: [5, 2.5, 1.5],
      target: STORE_CENTER,
    },
  },
  surveillance3: {
    desktop: {
      fov: 80,
      position: [-5.5, 2.5, -2],
      target: STORE_CENTER,
    },
    mobile: {
      fov: 85,
      position: [-5.5, 2.5, -2],
      target: STORE_CENTER,
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
  bodyOrbitRadius: 0.75,
  bodyOrbitHeight: 0.1,
  bodyOrbitSpeed: 0.22,
};

const BASE_POST = {
  bloomEnabled: false,
  surveillanceOverlayEnabled: false,
};

const BASE_STORE = {
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
    cameraFar: 10000,
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
    ...BASE_STORE,
    ...overrides,
  };
}

export const PRESETS = {
  Store: createPreset({}),
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
};

export function getPresetControls({ presetName, presetSnapshot }) {
  return {
    ...Object.fromEntries(
      CONTROL_KEYS.filter((key) => key in presetSnapshot).map((key) => [
        key,
        presetSnapshot[key],
      ])
    ),
    preset: presetName,
  };
}
