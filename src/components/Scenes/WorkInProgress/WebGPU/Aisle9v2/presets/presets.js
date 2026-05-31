import {
  AISLE9_CAMERA_SPLINES,
  DEFAULT_AISLE9_CAMERA_SPLINE,
} from '../../../../../../presets/spline/aisle9CameraSplines';
import CENTER_STORE_REF_POSITION from '../../../../../elements/sevenEleven/sevenElevenAnchors';

export const ENVIRONMENT_SPACE = 'space';
export const ENVIRONMENT_STORE = 'store';

export const CAMERA_MODE_ORBIT = 'orbit';
export const CAMERA_MODE_FIXED = 'fixed';
export const CAMERA_MODE_SPLINE = 'spline';

export const DEFAULT_PRESET = 'Store';

const CONTROL_KEYS = [
  'environment',
  'cameraMode',
  'fixedCameraShot',
  'storeScale',
  'storePosition',
  'storeRotation',
  'blackHoleDiameter',
  'diskDiameter',
  'diskThickness',
  'lensDiameter',
  'diskInnerColor',
  'diskOuterColor',
  'lensColor',
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
    position: [0, -820, 360],
    target: STORE_CENTER,
  },
};

const SPACE_ORBIT_CAMERA = {
  desktop: {
    fov: 48,
    pivot: [0, 0, 0],
    position: [0.2, 1.2, 4.2],
    target: [0, 0, 0],
  },
  mobile: {
    fov: 54,
    pivot: [0, 0, 0],
    position: [0.4, 1.4, 5.4],
    target: [0, 0, 0],
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

const BASE_BLACK_HOLE = {
  blackHoleDiameter: BLACK_HOLE_DIAMETER_METERS,
  diskDiameter: DISK_DIAMETER_METERS,
  diskThickness: 0.055,
  lensDiameter: 1.55,
  diskInnerColor: '#fff4c7',
  diskOuterColor: '#ff5b19',
  lensColor: '#8fb9ff',
};

const BASE_BODIES = {
  bodyOrbitRadius: 0.75,
  bodyOrbitHeight: 0.1,
  bodyOrbitSpeed: 0.22,
};

const BASE_POST = {
  bloomEnabled: true,
  surveillanceOverlayEnabled: false,
};

const BASE_STORE = {
  storePosition: { x: 0, y: 0, z: 0 },
  storeRotation: { x: 0, y: 0, z: 0 },
  storeScale: 320,
};

function createPreset(overrides) {
  return {
    environment: ENVIRONMENT_STORE,
    cameraMode: CAMERA_MODE_ORBIT,
    fixedCameraShot: 'surveillance1',
    cameraNear: 0.1,
    cameraFar: 5000,
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
    starBackgroundColor: '#03040a',
    ...BASE_BLACK_HOLE,
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
  Space: createPreset({
    environment: ENVIRONMENT_SPACE,
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: SPACE_ORBIT_CAMERA,
    blackHolePosition: { x: 0, y: 0, z: 0 },
    bodyOrbitRadius: 1.45,
    bodyOrbitHeight: 0.08,
    bodyOrbitSpeed: 0.18,
    diskDiameter: 1.22,
    lensDiameter: 1.9,
    starBackgroundColor: '#01020a',
    storeScale: BASE_STORE.storeScale,
  }),
  'Space 2': createPreset({
    environment: ENVIRONMENT_SPACE,
    cameraMode: CAMERA_MODE_ORBIT,
    cameraOrbit: {
      desktop: {
        fov: 42,
        pivot: [0, 0, 0],
        position: [1.8, 0.9, 3.2],
        target: [0, 0, 0],
      },
      mobile: {
        fov: 50,
        pivot: [0, 0, 0],
        position: [2.1, 1.2, 4.4],
        target: [0, 0, 0],
      },
    },
    blackHolePosition: { x: 0, y: 0, z: 0 },
    bodyOrbitRadius: 1.7,
    bodyOrbitHeight: 0.18,
    bodyOrbitSpeed: 0.24,
    diskDiameter: 1.16,
    diskInnerColor: '#dff7ff',
    diskOuterColor: '#ff3c7a',
    lensDiameter: 2.05,
    starBackgroundColor: '#05020d',
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
