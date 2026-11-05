import {
  BLACK_HOLE_VARIANT_SINGULARITY,
  BLACK_HOLE_VARIANT_WEBGPU,
  DEFAULT_LENS_DIAMETER,
  LEGACY_CONTROL_KEYS,
  SINGULARITY_CONTROL_KEYS,
  WEBGPU_CONTROL_KEYS,
} from '@modules/blackHole';
import { buildSceneCameraControlValues } from '@modules/cameraRig';

export const CAMERA_MODE_ORBIT = 'orbit';
export const CAMERA_MODE_FIXED = 'fixed';
export const CAMERA_MODE_SPLINE = 'spline';

export const STORE_VARIANT_SEVEN_ELEVEN = 'sevenEleven';
export const STORE_VARIANT_AISLE9 = 'aisle9Store';

export const SETTING_INDOOR = 'indoor';
export const SETTING_OUTDOOR = 'outdoor';

export const DEFAULT_PRESET = 'Store';

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

// Shared night lighting for all outdoor presets.
// storePosition/storeRotation/storeScale and orbitMinDistance/orbitMaxDistance
// are preset-only values — not exposed as leva controls since they are stable
// per-preset and don't need per-frame tuning.

// Dawn sky — sun just cresting the horizon (~5:55am). High turbidity and
// low elevation produce the warm orange/pink gradient; azimuth 90 puts the
// sun in the east where it belongs.

// Dawn lighting — store fixtures still burning, moon almost gone,
// ambient warm and dim rather than the full-brightness midday read.

// Sky settings tuned for interior surveillance cams looking through the
// sevenElevenLow store windows — different from the exterior orbit view.

// BH size tiers — singularity variant only. Values will likely need
// per-shot tuning once rendered; these are proportional starting points.

// Orbiting body counts for escalating intensity

function getSnapshotLensDiameter(snapshot) {
  switch (snapshot.blackHoleVariant) {
    case BLACK_HOLE_VARIANT_WEBGPU:
      return snapshot.webgpuLensDiameter;
    case BLACK_HOLE_VARIANT_SINGULARITY:
      return snapshot.singularityLensDiameter;
    default:
      return snapshot.legacyLensDiameter;
  }
}

// The orbit clamps have to ride on the camera declaration rather than being
// applied by the scene: the shared rig publishes orbitMinDistance /
// orbitMaxDistance as leva controls, and anything the scene reads back off the
// merged control snapshot gets those values, not the preset's.
function buildOrbitDeclaration(snapshot) {
  const lensDiameter =
    getSnapshotLensDiameter(snapshot) ?? DEFAULT_LENS_DIAMETER;
  const worldScale = snapshot.storeScale ?? 320;

  return {
    ...snapshot.cameraOrbit,
    maxDistance:
      snapshot.orbitMaxDistance ??
      Math.max(1400, lensDiameter * worldScale * 2.5),
    maxDistanceUnlimited: false,
    minDistance:
      snapshot.orbitMinDistance ??
      Math.max(140, lensDiameter * worldScale * 0.55),
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
    orbit: buildOrbitDeclaration(snapshot),
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

// Literal artwork values; new controls require an explicit migration.
const SAVED_BASE = {
  cameraMode: 'orbit',
  fixedCameraShot: 'surveillance1',
  cameraNear: 0.1,
  cameraFar: 20000,
  cameraAutoFit: false,
  cameraOrbit: {
    desktop: {
      fov: 52,
      pivot: [0, 0, 0],
      position: [0, 240, 480],
      target: [0, 0, 0],
    },
    mobile: {
      fov: 120,
      pivot: [0, 0, 0],
      position: [0, 240, 480],
      target: [0, 0, 0],
    },
  },
  cameraFixed: {
    activeShot: 'surveillance1',
    behavior: 'single',
    shots: {
      surveillance1: {
        desktop: {
          fov: 80,
          position: [1391.178, 488.9425, -1378.6474],
          target: [14.6585, -368.5795, -176.0343],
        },
        mobile: {
          fov: 113,
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
          fov: 110,
          position: [1942.5989, 541.7598, 508.8782],
          target: [85, -259.0559, -662.6165],
        },
      },
      surveillance3: {
        desktop: {
          fov: 80,
          position: [-1560.9531, 530.6089, 616.6168],
          target: [-280.2008, -356.8199, -199.3305],
        },
        mobile: {
          fov: 106,
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
          fov: 120,
          position: [2731.4239, 369.7285, 57.6482],
          target: [-571, -598.7095, 1706.3125],
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
          fov: 120,
          position: [-3332.5039, 468.7574, -5452.2801],
          target: [2997.8608, -3831.5421, 0.0777],
        },
      },
    },
  },
  cameraSpline: {
    closed: true,
    tension: 0.45,
    desktop: {
      fov: 60,
      target: [-1, 1.5, 0],
    },
    duration: 38,
    fov: 60,
    mobile: {
      fov: 120,
      target: [-1, 1.5, 0],
    },
    orientationMode: 'target',
    points: [
      {
        position: [3.2989, 1.7, 0.5499],
      },
      {
        position: [3.1041, 1.7, 0.8588],
      },
      {
        position: [2.8095, 1.7, 1.1177],
      },
      {
        position: [2.4362, 1.7, 1.3253],
      },
      {
        position: [2.0049, 1.7, 1.4801],
      },
      {
        position: [1.5364, 1.7, 1.5806],
      },
      {
        position: [1.0518, 1.7, 1.6256],
      },
      {
        position: [0.5717, 1.7, 1.6135],
      },
      {
        position: [0.1171, 1.7, 1.5429],
      },
      {
        position: [-0.2913, 1.7, 1.4124],
      },
      {
        position: [-0.6324, 1.7, 1.2207],
      },
      {
        position: [-0.8856, 1.7, 0.9662],
      },
      {
        position: [-1.0299, 1.7, 0.6476],
      },
      {
        position: [-1.0743, 1.7, 0.389],
      },
      {
        position: [-1.1005, 1.7, 0.0922],
      },
      {
        position: [-1.1148, 1.7, -0.2327],
      },
      {
        position: [-1.1238, 1.7, -0.5757],
      },
      {
        position: [-1.1338, 1.7, -0.9269],
      },
      {
        position: [-1.1515, 1.7, -1.2761],
      },
      {
        position: [-1.1832, 1.7, -1.6134],
      },
      {
        position: [-1.2354, 1.7, -1.9287],
      },
      {
        position: [-1.3145, 1.7, -2.212],
      },
      {
        position: [-1.4271, 1.7, -2.4534],
      },
      {
        position: [-1.5796, 1.7, -2.6426],
      },
      {
        position: [-1.7784, 1.7, -2.7699],
      },
      {
        position: [-1.9829, 1.7, -2.8415],
      },
      {
        position: [-2.2012, 1.7, -2.894],
      },
      {
        position: [-2.4293, 1.7, -2.9279],
      },
      {
        position: [-2.6632, 1.7, -2.9438],
      },
      {
        position: [-2.8986, 1.7, -2.942],
      },
      {
        position: [-3.1317, 1.7, -2.9231],
      },
      {
        position: [-3.3583, 1.7, -2.8876],
      },
      {
        position: [-3.5744, 1.7, -2.8359],
      },
      {
        position: [-3.7759, 1.7, -2.7685],
      },
      {
        position: [-3.9587, 1.7, -2.6858],
      },
      {
        position: [-4.1188, 1.7, -2.5885],
      },
      {
        position: [-4.252, 1.7, -2.477],
      },
      {
        position: [-4.5504, 1.7, -2.1115],
      },
      {
        position: [-4.7035, 1.7, -1.7699],
      },
      {
        position: [-4.7261, 1.7, -1.4571],
      },
      {
        position: [-4.6326, 1.7, -1.1779],
      },
      {
        position: [-4.4376, 1.7, -0.9373],
      },
      {
        position: [-4.1559, 1.7, -0.7401],
      },
      {
        position: [-3.8018, 1.7, -0.5911],
      },
      {
        position: [-3.3902, 1.7, -0.4953],
      },
      {
        position: [-2.9355, 1.7, -0.4575],
      },
      {
        position: [-2.4523, 1.7, -0.4826],
      },
      {
        position: [-1.9553, 1.7, -0.5754],
      },
      {
        position: [-1.459, 1.7, -0.7409],
      },
      {
        position: [-0.8107, 1.7, -1.0096],
      },
      {
        position: [-0.1613, 1.7, -1.2722],
      },
      {
        position: [0.4781, 1.7, -1.5138],
      },
      {
        position: [1.0968, 1.7, -1.7197],
      },
      {
        position: [1.6837, 1.7, -1.8749],
      },
      {
        position: [2.2279, 1.7, -1.9646],
      },
      {
        position: [2.7184, 1.7, -1.974],
      },
      {
        position: [3.1442, 1.7, -1.8882],
      },
      {
        position: [3.4945, 1.7, -1.6923],
      },
      {
        position: [3.7583, 1.7, -1.3716],
      },
      {
        position: [3.9246, 1.7, -0.9112],
      },
      {
        position: [3.9824, 1.7, -0.2963],
      },
      {
        position: [3.9714, 1.7, -0.2703],
      },
      {
        position: [3.9406, 1.7, -0.2297],
      },
      {
        position: [3.8934, 1.7, -0.1765],
      },
      {
        position: [3.8333, 1.7, -0.1126],
      },
      {
        position: [3.7638, 1.7, -0.04],
      },
      {
        position: [3.6881, 1.7, 0.0394],
      },
      {
        position: [3.6098, 1.7, 0.1237],
      },
      {
        position: [3.5324, 1.7, 0.2109],
      },
      {
        position: [3.4591, 1.7, 0.299],
      },
      {
        position: [3.3935, 1.7, 0.3862],
      },
      {
        position: [3.339, 1.7, 0.4705],
      },
    ],
    target: [-1, 1.5, 0],
  },
  blackHoleVariant: 'legacyPort',
  legacyDiskVariant: 'ribbon',
  legacyBlackHoleDiameter: 0.3048,
  legacyDiskDiameter: 1.08,
  legacyLensDiameter: 1.55,
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
  legacyChromaticRingFreq: 1,
  legacyChromaticAnimSpeed: 1,
  legacyChromaticColorSpeed: 0.5,
  legacyChromaticSaturation: 0.45,
  legacyRibbonRotationSpeed: 0.02,
  legacyRibbonBandScale: 16,
  legacyRibbonBiasStrength: 0.05,
  webgpuBlackHoleDiameter: 0.3048,
  webgpuDiskDiameter: 1.08,
  webgpuLensDiameter: 1.55,
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
  singularityLensDiameter: 1.55,
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
  retroColorBleeding: 0.005,
  retroAffineDistortion: 1,
  chromaticAberrationEnabled: false,
  chromaticAberrationStrength: 1.2,
  chromaticAberrationScale: 1.25,
  chromaticAberrationCenterX: 0.5,
  chromaticAberrationCenterY: 0.5,
  surveillanceOverlayEnabled: false,
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
  setting: 'indoor',
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
  skyboxRotation: {
    x: 159,
    y: -93,
    z: -11,
  },
  storePosition: {
    x: 0,
    y: 0,
    z: 0,
  },
  storeRotation: {
    x: 0,
    y: 0,
    z: 0,
  },
  storeScale: 320,
  cameraProjection: 'perspective',
  cameraFrustumHeight: 10,
  cameraMobileFrustumHeight: 10,
  fixedBehavior: 'single',
  fixedActiveShot: 'surveillance1',
  fixedSequenceIntervalSeconds: 5,
  fixedSequenceOrder:
    'surveillance1, surveillance2, surveillance3, parkingLot, backAlley, stockRoom',
  fixedShotSurveillance1DesktopPosition: {
    x: 1391.178,
    y: 488.9425,
    z: -1378.6474,
  },
  fixedShotSurveillance1DesktopTarget: {
    x: 14.6585,
    y: -368.5795,
    z: -176.0343,
  },
  fixedShotSurveillance1DesktopFov: 80,
  fixedShotSurveillance1MobilePosition: {
    x: 1391.178,
    y: 488.9425,
    z: -1378.6474,
  },
  fixedShotSurveillance1MobileTarget: {
    x: 14.6585,
    y: -368.5795,
    z: -176.0343,
  },
  fixedShotSurveillance1MobileFov: 113,
  fixedShotSurveillance2DesktopPosition: {
    x: 1942.5989,
    y: 541.7598,
    z: 508.8782,
  },
  fixedShotSurveillance2DesktopTarget: {
    x: 421.1822,
    y: -259.0559,
    z: -662.6165,
  },
  fixedShotSurveillance2DesktopFov: 80,
  fixedShotSurveillance2MobilePosition: {
    x: 1942.5989,
    y: 541.7598,
    z: 508.8782,
  },
  fixedShotSurveillance2MobileTarget: {
    x: 85,
    y: -259.0559,
    z: -662.6165,
  },
  fixedShotSurveillance2MobileFov: 110,
  fixedShotSurveillance3DesktopPosition: {
    x: -1560.9531,
    y: 530.6089,
    z: 616.6168,
  },
  fixedShotSurveillance3DesktopTarget: {
    x: -280.2008,
    y: -356.8199,
    z: -199.3305,
  },
  fixedShotSurveillance3DesktopFov: 80,
  fixedShotSurveillance3MobilePosition: {
    x: -1560.9531,
    y: 530.6089,
    z: 616.6168,
  },
  fixedShotSurveillance3MobileTarget: {
    x: -280.2008,
    y: -356.8199,
    z: -199.3305,
  },
  fixedShotSurveillance3MobileFov: 106,
  fixedShotParkingLotDesktopPosition: {
    x: 2731.4239,
    y: 369.7285,
    z: 57.6482,
  },
  fixedShotParkingLotDesktopTarget: {
    x: 654.058,
    y: -598.7095,
    z: 1706.3125,
  },
  fixedShotParkingLotDesktopFov: 80,
  fixedShotParkingLotMobilePosition: {
    x: 2731.4239,
    y: 369.7285,
    z: 57.6482,
  },
  fixedShotParkingLotMobileTarget: {
    x: -571,
    y: -598.7095,
    z: 1706.3125,
  },
  fixedShotParkingLotMobileFov: 120,
  fixedShotBackAlleyDesktopPosition: {
    x: -683.703,
    y: 1038.5103,
    z: -5838.9676,
  },
  fixedShotBackAlleyDesktopTarget: {
    x: 7031.5736,
    y: -2702.3475,
    z: -7679.2539,
  },
  fixedShotBackAlleyDesktopFov: 80,
  fixedShotBackAlleyMobilePosition: {
    x: -683.703,
    y: 1038.5103,
    z: -5838.9676,
  },
  fixedShotBackAlleyMobileTarget: {
    x: 7031.5736,
    y: -2702.3475,
    z: -7679.2539,
  },
  fixedShotBackAlleyMobileFov: 80,
  fixedShotStockRoomDesktopPosition: {
    x: -3332.5039,
    y: 468.7574,
    z: -5452.2801,
  },
  fixedShotStockRoomDesktopTarget: {
    x: 2997.8608,
    y: -3831.5421,
    z: 0.0777,
  },
  fixedShotStockRoomDesktopFov: 80,
  fixedShotStockRoomMobilePosition: {
    x: -3332.5039,
    y: 468.7574,
    z: -5452.2801,
  },
  fixedShotStockRoomMobileTarget: {
    x: 2997.8608,
    y: -3831.5421,
    z: 0.0777,
  },
  fixedShotStockRoomMobileFov: 120,
  orbitAutoRotate: false,
  orbitAutoRotateSpeed: 2,
  orbitEnablePan: true,
  orbitMinPolarAngle: 0,
  orbitMaxPolarAngle: 180,
  orbitAzimuthUnlimited: true,
  orbitMinAzimuthAngle: -180,
  orbitMaxAzimuthAngle: 180,
  orbitMinDistance: 272.8,
  orbitMaxDistanceUnlimited: false,
  orbitMaxDistance: 1400,
  orbitDesktopPosition: {
    x: 0,
    y: 240,
    z: 480,
  },
  orbitDesktopTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  orbitDesktopPivot: {
    x: 0,
    y: 0,
    z: 0,
  },
  orbitDesktopFov: 52,
  orbitMobilePosition: {
    x: 0,
    y: 240,
    z: 480,
  },
  orbitMobileTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  orbitMobilePivot: {
    x: 0,
    y: 0,
    z: 0,
  },
  orbitMobileFov: 120,
  splinePreset: 'Scene Path',
  splineDesktopTarget: {
    x: -1,
    y: 1.5,
    z: 0,
  },
  splineDesktopFov: 60,
  splineMobileTarget: {
    x: -1,
    y: 1.5,
    z: 0,
  },
  splineMobileFov: 120,
  splineOrientationMode: 'target',
  splineForwardDistance: 1,
  splinePosition: {
    x: 0,
    y: 0,
    z: 0,
  },
  splineScale: {
    x: 1,
    y: 1,
    z: 1,
  },
  splineDuration: 38,
  splineTension: 0.45,
  splineClosed: true,
  splineShowPath: false,
  operatorMoveSpeed: 6,
  operatorLiftSpeed: 6,
  operatorBoostMultiplier: 2,
  operatorPointerLookSensitivity: 0.003,
  operatorStickLookSpeed: 2.5,
  operatorZoomSpeed: 24,
  operatorMinFov: 20,
  operatorMaxFov: 80,
  surveillanceCameraLabel: 'CAM 01',
  recordingOverrideEnabled: false,
  recordingStartDate: '2026-11-01',
  recordingStartTime: '00:00:00',
};

export const PRESETS = {
  Store: { ...SAVED_BASE },
  'Parking Lot': {
    ...SAVED_BASE,
    cameraFar: 30000,
    cameraOrbit: {
      desktop: {
        fov: 50,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
      mobile: {
        fov: 71,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
    },
    orbitingBodiesEnabled: false,
    moonColor: '#7090cc',
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyboxRotation: {
      x: 90,
      y: 0,
      z: -90,
    },
    orbitMinDistance: 1000,
    orbitMaxDistance: 20000,
    orbitDesktopPosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitDesktopTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopPivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopFov: 50,
    orbitMobilePosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitMobileTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobilePivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobileFov: 71,
  },
  'Guided Tour': {
    ...SAVED_BASE,
    cameraMode: 'spline',
    cameraSpline: {
      closed: true,
      tension: 0.45,
      desktop: {
        fov: 60,
        target: [-1, 1.5, 0],
      },
      duration: 42,
      fov: 60,
      mobile: {
        fov: 85,
        target: [-1, 1.5, 0],
      },
      orientationMode: 'target',
      points: [
        {
          position: [3.2989, 1.7, 0.5499],
        },
        {
          position: [3.1041, 1.7, 0.8588],
        },
        {
          position: [2.8095, 1.7, 1.1177],
        },
        {
          position: [2.4362, 1.7, 1.3253],
        },
        {
          position: [2.0049, 1.7, 1.4801],
        },
        {
          position: [1.5364, 1.7, 1.5806],
        },
        {
          position: [1.0518, 1.7, 1.6256],
        },
        {
          position: [0.5717, 1.7, 1.6135],
        },
        {
          position: [0.1171, 1.7, 1.5429],
        },
        {
          position: [-0.2913, 1.7, 1.4124],
        },
        {
          position: [-0.6324, 1.7, 1.2207],
        },
        {
          position: [-0.8856, 1.7, 0.9662],
        },
        {
          position: [-1.0299, 1.7, 0.6476],
        },
        {
          position: [-1.0743, 1.7, 0.389],
        },
        {
          position: [-1.1005, 1.7, 0.0922],
        },
        {
          position: [-1.1148, 1.7, -0.2327],
        },
        {
          position: [-1.1238, 1.7, -0.5757],
        },
        {
          position: [-1.1338, 1.7, -0.9269],
        },
        {
          position: [-1.1515, 1.7, -1.2761],
        },
        {
          position: [-1.1832, 1.7, -1.6134],
        },
        {
          position: [-1.2354, 1.7, -1.9287],
        },
        {
          position: [-1.3145, 1.7, -2.212],
        },
        {
          position: [-1.4271, 1.7, -2.4534],
        },
        {
          position: [-1.5796, 1.7, -2.6426],
        },
        {
          position: [-1.7784, 1.7, -2.7699],
        },
        {
          position: [-1.9829, 1.7, -2.8415],
        },
        {
          position: [-2.2012, 1.7, -2.894],
        },
        {
          position: [-2.4293, 1.7, -2.9279],
        },
        {
          position: [-2.6632, 1.7, -2.9438],
        },
        {
          position: [-2.8986, 1.7, -2.942],
        },
        {
          position: [-3.1317, 1.7, -2.9231],
        },
        {
          position: [-3.3583, 1.7, -2.8876],
        },
        {
          position: [-3.5744, 1.7, -2.8359],
        },
        {
          position: [-3.7759, 1.7, -2.7685],
        },
        {
          position: [-3.9587, 1.7, -2.6858],
        },
        {
          position: [-4.1188, 1.7, -2.5885],
        },
        {
          position: [-4.252, 1.7, -2.477],
        },
        {
          position: [-4.5504, 1.7, -2.1115],
        },
        {
          position: [-4.7035, 1.7, -1.7699],
        },
        {
          position: [-4.7261, 1.7, -1.4571],
        },
        {
          position: [-4.6326, 1.7, -1.1779],
        },
        {
          position: [-4.4376, 1.7, -0.9373],
        },
        {
          position: [-4.1559, 1.7, -0.7401],
        },
        {
          position: [-3.8018, 1.7, -0.5911],
        },
        {
          position: [-3.3902, 1.7, -0.4953],
        },
        {
          position: [-2.9355, 1.7, -0.4575],
        },
        {
          position: [-2.4523, 1.7, -0.4826],
        },
        {
          position: [-1.9553, 1.7, -0.5754],
        },
        {
          position: [-1.459, 1.7, -0.7409],
        },
        {
          position: [-0.8107, 1.7, -1.0096],
        },
        {
          position: [-0.1613, 1.7, -1.2722],
        },
        {
          position: [0.4781, 1.7, -1.5138],
        },
        {
          position: [1.0968, 1.7, -1.7197],
        },
        {
          position: [1.6837, 1.7, -1.8749],
        },
        {
          position: [2.2279, 1.7, -1.9646],
        },
        {
          position: [2.7184, 1.7, -1.974],
        },
        {
          position: [3.1442, 1.7, -1.8882],
        },
        {
          position: [3.4945, 1.7, -1.6923],
        },
        {
          position: [3.7583, 1.7, -1.3716],
        },
        {
          position: [3.9246, 1.7, -0.9112],
        },
        {
          position: [3.9824, 1.7, -0.2963],
        },
        {
          position: [3.9714, 1.7, -0.2703],
        },
        {
          position: [3.9406, 1.7, -0.2297],
        },
        {
          position: [3.8934, 1.7, -0.1765],
        },
        {
          position: [3.8333, 1.7, -0.1126],
        },
        {
          position: [3.7638, 1.7, -0.04],
        },
        {
          position: [3.6881, 1.7, 0.0394],
        },
        {
          position: [3.6098, 1.7, 0.1237],
        },
        {
          position: [3.5324, 1.7, 0.2109],
        },
        {
          position: [3.4591, 1.7, 0.299],
        },
        {
          position: [3.3935, 1.7, 0.3862],
        },
        {
          position: [3.339, 1.7, 0.4705],
        },
      ],
      target: [-1, 1.5, 0],
    },
    splineMobileFov: 85,
    splineDuration: 42,
  },
  Surveillance: {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    surveillanceOverlayEnabled: true,
  },
  'Surveillance 2': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 02',
    fixedActiveShot: 'surveillance2',
  },
  'Surveillance 3': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 03',
    fixedActiveShot: 'surveillance3',
  },
  'Parking Lot Cam': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'parkingLot',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    moonColor: '#7090cc',
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyboxRotation: {
      x: 90,
      y: 0,
      z: -90,
    },
    surveillanceCameraLabel: 'PARKING LOT',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'parkingLot',
  },
  'Back Alley': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'backAlley',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    moonColor: '#7090cc',
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyboxRotation: {
      x: 90,
      y: 0,
      z: -90,
    },
    surveillanceCameraLabel: 'ALLEY',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'backAlley',
  },
  'Stock Room': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'stockRoom',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    moonColor: '#7090cc',
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    surveillanceCameraLabel: 'STOCK ROOM',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'stockRoom',
  },
  'Exterior - Night': {
    ...SAVED_BASE,
    cameraFar: 30000,
    cameraOrbit: {
      desktop: {
        fov: 50,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
      mobile: {
        fov: 71,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
    },
    orbitingBodiesEnabled: false,
    moonColor: '#7090cc',
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyboxRotation: {
      x: 90,
      y: 0,
      z: -90,
    },
    orbitDesktopPosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitDesktopTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopPivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopFov: 50,
    orbitMobilePosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitMobileTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobilePivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobileFov: 71,
  },
  'Exterior - Day': {
    ...SAVED_BASE,
    cameraFar: 30000,
    cameraOrbit: {
      desktop: {
        fov: 50,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
      mobile: {
        fov: 71,
        pivot: [1428.3735, 28.5588, 3714.1915],
        position: [1895.8851, -94.9794, 5028.0299],
        target: [1428.3735, 28.5588, 3714.1915],
      },
    },
    orbitingBodiesEnabled: false,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyTurbidity: 12,
    skyRayleigh: 0.83,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 0.95,
    skyElevation: 5,
    skyAzimuth: -66,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    orbitDesktopPosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitDesktopTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopPivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitDesktopFov: 50,
    orbitMobilePosition: {
      x: 1895.8851,
      y: -94.9794,
      z: 5028.0299,
    },
    orbitMobileTarget: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobilePivot: {
      x: 1428.3735,
      y: 28.5588,
      z: 3714.1915,
    },
    orbitMobileFov: 71,
  },
  'Cam 1 - Night': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    blackHoleEnabled: false,
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
  },
  'Cam 1 - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    blackHoleEnabled: false,
    skyTurbidity: 3.4,
    skyRayleigh: 0.14,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 1,
    skyElevation: 8.5,
    skyAzimuth: 35.8,
    skyCloudCoverage: 0.62,
    skyCloudDensity: 0.16,
    skyCloudElevation: 0.81,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
  },
  'Cam 1 - BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    surveillanceOverlayEnabled: true,
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
  },
  'Cam 1 - Med BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    singularityLensDiameter: 2.5,
    singularityOriginRadius: 0.18,
    singularityBandWidth: 0.09,
    singularityFieldScale: 5.5,
    singularityEmissionStrength: 2.4,
    bodyOrbitRadius: 0.9,
    bodyOrbitSpeed: 0.32,
    body1Instances: 3,
    body2Instances: 2,
    body3Instances: 3,
    body4Instances: 2,
    body5Instances: 2,
    body6Instances: 2,
    surveillanceOverlayEnabled: true,
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
  },
  'Cam 1 - LG BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    singularityLensDiameter: 3.5,
    singularityOriginRadius: 0.3,
    singularityBandWidth: 0.14,
    singularityFieldScale: 9,
    singularityEmissionStrength: 3,
    bodyOrbitRadius: 1.1,
    bodyOrbitSpeed: 0.42,
    body1Instances: 5,
    body2Instances: 4,
    body3Instances: 5,
    body4Instances: 4,
    body5Instances: 4,
    body6Instances: 4,
    surveillanceOverlayEnabled: true,
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
  },
  'Cam 2 - Night': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    blackHoleEnabled: false,
    surveillanceCameraLabel: 'CAM 02',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance2',
  },
  'Cam 2 - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    blackHoleEnabled: false,
    skyTurbidity: 3.4,
    skyRayleigh: 0.14,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 1,
    skyElevation: 8.5,
    skyAzimuth: 35.8,
    skyCloudCoverage: 0.62,
    skyCloudDensity: 0.16,
    skyCloudElevation: 0.81,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    surveillanceCameraLabel: 'CAM 02',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
    fixedActiveShot: 'surveillance2',
  },
  'Cam 2 - BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 02',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance2',
  },
  'Cam 2 - Med BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    singularityLensDiameter: 2.5,
    singularityOriginRadius: 0.18,
    singularityBandWidth: 0.09,
    singularityFieldScale: 5.5,
    singularityEmissionStrength: 2.4,
    bodyOrbitRadius: 0.9,
    bodyOrbitSpeed: 0.32,
    body1Instances: 3,
    body2Instances: 2,
    body3Instances: 3,
    body4Instances: 2,
    body5Instances: 2,
    body6Instances: 2,
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 02',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance2',
  },
  'Cam 2 - LG BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance2',
    singularityLensDiameter: 3.5,
    singularityOriginRadius: 0.3,
    singularityBandWidth: 0.14,
    singularityFieldScale: 9,
    singularityEmissionStrength: 3,
    bodyOrbitRadius: 1.1,
    bodyOrbitSpeed: 0.42,
    body1Instances: 5,
    body2Instances: 4,
    body3Instances: 5,
    body4Instances: 4,
    body5Instances: 4,
    body6Instances: 4,
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 02',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance2',
  },
  'Cam 3 - Night': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    blackHoleEnabled: false,
    surveillanceCameraLabel: 'CAM 03',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance3',
  },
  'Cam 3 - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    blackHoleEnabled: false,
    skyTurbidity: 3.4,
    skyRayleigh: 0.14,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 1,
    skyElevation: 8.5,
    skyAzimuth: 35.8,
    skyCloudCoverage: 0.62,
    skyCloudDensity: 0.16,
    skyCloudElevation: 0.81,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    surveillanceCameraLabel: 'CAM 03',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
    fixedActiveShot: 'surveillance3',
  },
  'Cam 3 - BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 03',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance3',
  },
  'Cam 3 - Med BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    singularityLensDiameter: 2.5,
    singularityOriginRadius: 0.18,
    singularityBandWidth: 0.09,
    singularityFieldScale: 5.5,
    singularityEmissionStrength: 2.4,
    bodyOrbitRadius: 0.9,
    bodyOrbitSpeed: 0.32,
    body1Instances: 3,
    body2Instances: 2,
    body3Instances: 3,
    body4Instances: 2,
    body5Instances: 2,
    body6Instances: 2,
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 03',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance3',
  },
  'Cam 3 - LG BH': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'surveillance3',
    singularityLensDiameter: 3.5,
    singularityOriginRadius: 0.3,
    singularityBandWidth: 0.14,
    singularityFieldScale: 9,
    singularityEmissionStrength: 3,
    bodyOrbitRadius: 1.1,
    bodyOrbitSpeed: 0.42,
    body1Instances: 5,
    body2Instances: 4,
    body3Instances: 5,
    body4Instances: 4,
    body5Instances: 4,
    body6Instances: 4,
    surveillanceOverlayEnabled: true,
    surveillanceCameraLabel: 'CAM 03',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '02:47:00',
    fixedActiveShot: 'surveillance3',
  },
  'Parking Lot Cam - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'parkingLot',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyTurbidity: 12,
    skyRayleigh: 0.83,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 0.95,
    skyElevation: 5,
    skyAzimuth: -66,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    surveillanceCameraLabel: 'PARKING LOT',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
    fixedActiveShot: 'parkingLot',
  },
  'Back Alley - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'backAlley',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyTurbidity: 12,
    skyRayleigh: 0.83,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 0.95,
    skyElevation: 5,
    skyAzimuth: -66,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    surveillanceCameraLabel: 'ALLEY',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
    fixedActiveShot: 'backAlley',
  },
  'Stock Room - Day': {
    ...SAVED_BASE,
    cameraMode: 'fixed',
    fixedCameraShot: 'stockRoom',
    orbitingBodiesEnabled: false,
    surveillanceOverlayEnabled: true,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    setting: 'outdoor',
    blackHoleEnabled: false,
    skyTurbidity: 12,
    skyRayleigh: 0.83,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 0.95,
    skyElevation: 5,
    skyAzimuth: -66,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    surveillanceCameraLabel: 'STOCK ROOM',
    recordingOverrideEnabled: true,
    recordingStartDate: '2026-05-15',
    recordingStartTime: '05:55:00',
    fixedActiveShot: 'stockRoom',
  },
  'Guided Tour - Day': {
    ...SAVED_BASE,
    cameraMode: 'spline',
    cameraSpline: {
      closed: true,
      tension: 0.45,
      desktop: {
        fov: 60,
        target: [-1, 1.5, 0],
      },
      duration: 42,
      fov: 60,
      mobile: {
        fov: 85,
        target: [-1, 1.5, 0],
      },
      orientationMode: 'forward',
      points: [
        {
          position: [3.2989, 1.7, 0.5499],
        },
        {
          position: [3.1041, 1.7, 0.8588],
        },
        {
          position: [2.8095, 1.7, 1.1177],
        },
        {
          position: [2.4362, 1.7, 1.3253],
        },
        {
          position: [2.0049, 1.7, 1.4801],
        },
        {
          position: [1.5364, 1.7, 1.5806],
        },
        {
          position: [1.0518, 1.7, 1.6256],
        },
        {
          position: [0.5717, 1.7, 1.6135],
        },
        {
          position: [0.1171, 1.7, 1.5429],
        },
        {
          position: [-0.2913, 1.7, 1.4124],
        },
        {
          position: [-0.6324, 1.7, 1.2207],
        },
        {
          position: [-0.8856, 1.7, 0.9662],
        },
        {
          position: [-1.0299, 1.7, 0.6476],
        },
        {
          position: [-1.0743, 1.7, 0.389],
        },
        {
          position: [-1.1005, 1.7, 0.0922],
        },
        {
          position: [-1.1148, 1.7, -0.2327],
        },
        {
          position: [-1.1238, 1.7, -0.5757],
        },
        {
          position: [-1.1338, 1.7, -0.9269],
        },
        {
          position: [-1.1515, 1.7, -1.2761],
        },
        {
          position: [-1.1832, 1.7, -1.6134],
        },
        {
          position: [-1.2354, 1.7, -1.9287],
        },
        {
          position: [-1.3145, 1.7, -2.212],
        },
        {
          position: [-1.4271, 1.7, -2.4534],
        },
        {
          position: [-1.5796, 1.7, -2.6426],
        },
        {
          position: [-1.7784, 1.7, -2.7699],
        },
        {
          position: [-1.9829, 1.7, -2.8415],
        },
        {
          position: [-2.2012, 1.7, -2.894],
        },
        {
          position: [-2.4293, 1.7, -2.9279],
        },
        {
          position: [-2.6632, 1.7, -2.9438],
        },
        {
          position: [-2.8986, 1.7, -2.942],
        },
        {
          position: [-3.1317, 1.7, -2.9231],
        },
        {
          position: [-3.3583, 1.7, -2.8876],
        },
        {
          position: [-3.5744, 1.7, -2.8359],
        },
        {
          position: [-3.7759, 1.7, -2.7685],
        },
        {
          position: [-3.9587, 1.7, -2.6858],
        },
        {
          position: [-4.1188, 1.7, -2.5885],
        },
        {
          position: [-4.252, 1.7, -2.477],
        },
        {
          position: [-4.5504, 1.7, -2.1115],
        },
        {
          position: [-4.7035, 1.7, -1.7699],
        },
        {
          position: [-4.7261, 1.7, -1.4571],
        },
        {
          position: [-4.6326, 1.7, -1.1779],
        },
        {
          position: [-4.4376, 1.7, -0.9373],
        },
        {
          position: [-4.1559, 1.7, -0.7401],
        },
        {
          position: [-3.8018, 1.7, -0.5911],
        },
        {
          position: [-3.3902, 1.7, -0.4953],
        },
        {
          position: [-2.9355, 1.7, -0.4575],
        },
        {
          position: [-2.4523, 1.7, -0.4826],
        },
        {
          position: [-1.9553, 1.7, -0.5754],
        },
        {
          position: [-1.459, 1.7, -0.7409],
        },
        {
          position: [-0.8107, 1.7, -1.0096],
        },
        {
          position: [-0.1613, 1.7, -1.2722],
        },
        {
          position: [0.4781, 1.7, -1.5138],
        },
        {
          position: [1.0968, 1.7, -1.7197],
        },
        {
          position: [1.6837, 1.7, -1.8749],
        },
        {
          position: [2.2279, 1.7, -1.9646],
        },
        {
          position: [2.7184, 1.7, -1.974],
        },
        {
          position: [3.1442, 1.7, -1.8882],
        },
        {
          position: [3.4945, 1.7, -1.6923],
        },
        {
          position: [3.7583, 1.7, -1.3716],
        },
        {
          position: [3.9246, 1.7, -0.9112],
        },
        {
          position: [3.9824, 1.7, -0.2963],
        },
        {
          position: [3.9714, 1.7, -0.2703],
        },
        {
          position: [3.9406, 1.7, -0.2297],
        },
        {
          position: [3.8934, 1.7, -0.1765],
        },
        {
          position: [3.8333, 1.7, -0.1126],
        },
        {
          position: [3.7638, 1.7, -0.04],
        },
        {
          position: [3.6881, 1.7, 0.0394],
        },
        {
          position: [3.6098, 1.7, 0.1237],
        },
        {
          position: [3.5324, 1.7, 0.2109],
        },
        {
          position: [3.4591, 1.7, 0.299],
        },
        {
          position: [3.3935, 1.7, 0.3862],
        },
        {
          position: [3.339, 1.7, 0.4705],
        },
      ],
      target: [-1, 1.5, 0],
    },
    orbitingBodiesEnabled: false,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    blackHoleEnabled: false,
    skyTurbidity: 3.4,
    skyRayleigh: 0.14,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 1,
    skyElevation: 8.5,
    skyAzimuth: 35.8,
    skyCloudCoverage: 0.62,
    skyCloudDensity: 0.16,
    skyCloudElevation: 0.81,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    splineMobileFov: 85,
    splineOrientationMode: 'forward',
    splineDuration: 42,
  },
  'Guided Tour - Night - No BH': {
    ...SAVED_BASE,
    cameraMode: 'spline',
    cameraSpline: {
      closed: true,
      tension: 0.45,
      desktop: {
        fov: 60,
        target: [-1, 1.5, 0],
      },
      duration: 42,
      fov: 60,
      mobile: {
        fov: 85,
        target: [-1, 1.5, 0],
      },
      orientationMode: 'forward',
      points: [
        {
          position: [3.2989, 1.7, 0.5499],
        },
        {
          position: [3.1041, 1.7, 0.8588],
        },
        {
          position: [2.8095, 1.7, 1.1177],
        },
        {
          position: [2.4362, 1.7, 1.3253],
        },
        {
          position: [2.0049, 1.7, 1.4801],
        },
        {
          position: [1.5364, 1.7, 1.5806],
        },
        {
          position: [1.0518, 1.7, 1.6256],
        },
        {
          position: [0.5717, 1.7, 1.6135],
        },
        {
          position: [0.1171, 1.7, 1.5429],
        },
        {
          position: [-0.2913, 1.7, 1.4124],
        },
        {
          position: [-0.6324, 1.7, 1.2207],
        },
        {
          position: [-0.8856, 1.7, 0.9662],
        },
        {
          position: [-1.0299, 1.7, 0.6476],
        },
        {
          position: [-1.0743, 1.7, 0.389],
        },
        {
          position: [-1.1005, 1.7, 0.0922],
        },
        {
          position: [-1.1148, 1.7, -0.2327],
        },
        {
          position: [-1.1238, 1.7, -0.5757],
        },
        {
          position: [-1.1338, 1.7, -0.9269],
        },
        {
          position: [-1.1515, 1.7, -1.2761],
        },
        {
          position: [-1.1832, 1.7, -1.6134],
        },
        {
          position: [-1.2354, 1.7, -1.9287],
        },
        {
          position: [-1.3145, 1.7, -2.212],
        },
        {
          position: [-1.4271, 1.7, -2.4534],
        },
        {
          position: [-1.5796, 1.7, -2.6426],
        },
        {
          position: [-1.7784, 1.7, -2.7699],
        },
        {
          position: [-1.9829, 1.7, -2.8415],
        },
        {
          position: [-2.2012, 1.7, -2.894],
        },
        {
          position: [-2.4293, 1.7, -2.9279],
        },
        {
          position: [-2.6632, 1.7, -2.9438],
        },
        {
          position: [-2.8986, 1.7, -2.942],
        },
        {
          position: [-3.1317, 1.7, -2.9231],
        },
        {
          position: [-3.3583, 1.7, -2.8876],
        },
        {
          position: [-3.5744, 1.7, -2.8359],
        },
        {
          position: [-3.7759, 1.7, -2.7685],
        },
        {
          position: [-3.9587, 1.7, -2.6858],
        },
        {
          position: [-4.1188, 1.7, -2.5885],
        },
        {
          position: [-4.252, 1.7, -2.477],
        },
        {
          position: [-4.5504, 1.7, -2.1115],
        },
        {
          position: [-4.7035, 1.7, -1.7699],
        },
        {
          position: [-4.7261, 1.7, -1.4571],
        },
        {
          position: [-4.6326, 1.7, -1.1779],
        },
        {
          position: [-4.4376, 1.7, -0.9373],
        },
        {
          position: [-4.1559, 1.7, -0.7401],
        },
        {
          position: [-3.8018, 1.7, -0.5911],
        },
        {
          position: [-3.3902, 1.7, -0.4953],
        },
        {
          position: [-2.9355, 1.7, -0.4575],
        },
        {
          position: [-2.4523, 1.7, -0.4826],
        },
        {
          position: [-1.9553, 1.7, -0.5754],
        },
        {
          position: [-1.459, 1.7, -0.7409],
        },
        {
          position: [-0.8107, 1.7, -1.0096],
        },
        {
          position: [-0.1613, 1.7, -1.2722],
        },
        {
          position: [0.4781, 1.7, -1.5138],
        },
        {
          position: [1.0968, 1.7, -1.7197],
        },
        {
          position: [1.6837, 1.7, -1.8749],
        },
        {
          position: [2.2279, 1.7, -1.9646],
        },
        {
          position: [2.7184, 1.7, -1.974],
        },
        {
          position: [3.1442, 1.7, -1.8882],
        },
        {
          position: [3.4945, 1.7, -1.6923],
        },
        {
          position: [3.7583, 1.7, -1.3716],
        },
        {
          position: [3.9246, 1.7, -0.9112],
        },
        {
          position: [3.9824, 1.7, -0.2963],
        },
        {
          position: [3.9714, 1.7, -0.2703],
        },
        {
          position: [3.9406, 1.7, -0.2297],
        },
        {
          position: [3.8934, 1.7, -0.1765],
        },
        {
          position: [3.8333, 1.7, -0.1126],
        },
        {
          position: [3.7638, 1.7, -0.04],
        },
        {
          position: [3.6881, 1.7, 0.0394],
        },
        {
          position: [3.6098, 1.7, 0.1237],
        },
        {
          position: [3.5324, 1.7, 0.2109],
        },
        {
          position: [3.4591, 1.7, 0.299],
        },
        {
          position: [3.3935, 1.7, 0.3862],
        },
        {
          position: [3.339, 1.7, 0.4705],
        },
      ],
      target: [-1, 1.5, 0],
    },
    orbitingBodiesEnabled: false,
    blackHoleEnabled: false,
    splineMobileFov: 85,
    splineOrientationMode: 'forward',
    splineDuration: 42,
  },
  'Guided Tour - BH': {
    ...SAVED_BASE,
    cameraMode: 'spline',
    cameraSpline: {
      closed: true,
      tension: 0.45,
      desktop: {
        fov: 60,
        target: [-1, 1.5, 0],
      },
      duration: 42,
      fov: 60,
      mobile: {
        fov: 85,
        target: [-1, 1.5, 0],
      },
      orientationMode: 'target',
      points: [
        {
          position: [3.2989, 1.7, 0.5499],
        },
        {
          position: [3.1041, 1.7, 0.8588],
        },
        {
          position: [2.8095, 1.7, 1.1177],
        },
        {
          position: [2.4362, 1.7, 1.3253],
        },
        {
          position: [2.0049, 1.7, 1.4801],
        },
        {
          position: [1.5364, 1.7, 1.5806],
        },
        {
          position: [1.0518, 1.7, 1.6256],
        },
        {
          position: [0.5717, 1.7, 1.6135],
        },
        {
          position: [0.1171, 1.7, 1.5429],
        },
        {
          position: [-0.2913, 1.7, 1.4124],
        },
        {
          position: [-0.6324, 1.7, 1.2207],
        },
        {
          position: [-0.8856, 1.7, 0.9662],
        },
        {
          position: [-1.0299, 1.7, 0.6476],
        },
        {
          position: [-1.0743, 1.7, 0.389],
        },
        {
          position: [-1.1005, 1.7, 0.0922],
        },
        {
          position: [-1.1148, 1.7, -0.2327],
        },
        {
          position: [-1.1238, 1.7, -0.5757],
        },
        {
          position: [-1.1338, 1.7, -0.9269],
        },
        {
          position: [-1.1515, 1.7, -1.2761],
        },
        {
          position: [-1.1832, 1.7, -1.6134],
        },
        {
          position: [-1.2354, 1.7, -1.9287],
        },
        {
          position: [-1.3145, 1.7, -2.212],
        },
        {
          position: [-1.4271, 1.7, -2.4534],
        },
        {
          position: [-1.5796, 1.7, -2.6426],
        },
        {
          position: [-1.7784, 1.7, -2.7699],
        },
        {
          position: [-1.9829, 1.7, -2.8415],
        },
        {
          position: [-2.2012, 1.7, -2.894],
        },
        {
          position: [-2.4293, 1.7, -2.9279],
        },
        {
          position: [-2.6632, 1.7, -2.9438],
        },
        {
          position: [-2.8986, 1.7, -2.942],
        },
        {
          position: [-3.1317, 1.7, -2.9231],
        },
        {
          position: [-3.3583, 1.7, -2.8876],
        },
        {
          position: [-3.5744, 1.7, -2.8359],
        },
        {
          position: [-3.7759, 1.7, -2.7685],
        },
        {
          position: [-3.9587, 1.7, -2.6858],
        },
        {
          position: [-4.1188, 1.7, -2.5885],
        },
        {
          position: [-4.252, 1.7, -2.477],
        },
        {
          position: [-4.5504, 1.7, -2.1115],
        },
        {
          position: [-4.7035, 1.7, -1.7699],
        },
        {
          position: [-4.7261, 1.7, -1.4571],
        },
        {
          position: [-4.6326, 1.7, -1.1779],
        },
        {
          position: [-4.4376, 1.7, -0.9373],
        },
        {
          position: [-4.1559, 1.7, -0.7401],
        },
        {
          position: [-3.8018, 1.7, -0.5911],
        },
        {
          position: [-3.3902, 1.7, -0.4953],
        },
        {
          position: [-2.9355, 1.7, -0.4575],
        },
        {
          position: [-2.4523, 1.7, -0.4826],
        },
        {
          position: [-1.9553, 1.7, -0.5754],
        },
        {
          position: [-1.459, 1.7, -0.7409],
        },
        {
          position: [-0.8107, 1.7, -1.0096],
        },
        {
          position: [-0.1613, 1.7, -1.2722],
        },
        {
          position: [0.4781, 1.7, -1.5138],
        },
        {
          position: [1.0968, 1.7, -1.7197],
        },
        {
          position: [1.6837, 1.7, -1.8749],
        },
        {
          position: [2.2279, 1.7, -1.9646],
        },
        {
          position: [2.7184, 1.7, -1.974],
        },
        {
          position: [3.1442, 1.7, -1.8882],
        },
        {
          position: [3.4945, 1.7, -1.6923],
        },
        {
          position: [3.7583, 1.7, -1.3716],
        },
        {
          position: [3.9246, 1.7, -0.9112],
        },
        {
          position: [3.9824, 1.7, -0.2963],
        },
        {
          position: [3.9714, 1.7, -0.2703],
        },
        {
          position: [3.9406, 1.7, -0.2297],
        },
        {
          position: [3.8934, 1.7, -0.1765],
        },
        {
          position: [3.8333, 1.7, -0.1126],
        },
        {
          position: [3.7638, 1.7, -0.04],
        },
        {
          position: [3.6881, 1.7, 0.0394],
        },
        {
          position: [3.6098, 1.7, 0.1237],
        },
        {
          position: [3.5324, 1.7, 0.2109],
        },
        {
          position: [3.4591, 1.7, 0.299],
        },
        {
          position: [3.3935, 1.7, 0.3862],
        },
        {
          position: [3.339, 1.7, 0.4705],
        },
      ],
      target: [-1, 1.5, 0],
    },
    splineMobileFov: 85,
    splineDuration: 42,
  },
  'Interior - Night': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    orbitingBodiesEnabled: false,
    blackHoleEnabled: false,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
  'Interior - Day': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    orbitingBodiesEnabled: false,
    ambientColor: '#e8956a',
    ambientIntensity: 0.7,
    moonColor: '#4060aa',
    moonIntensity: 0.3,
    outdoorEmissiveIntensity: 6,
    outdoorLightIntensity: 3,
    indoorEmissiveIntensity: 8,
    indoorLightIntensity: 4,
    storeFillColor: '#ffb87a',
    storeFillIntensity: 0.6,
    signGlowIntensity: 1.5,
    blackHoleEnabled: false,
    skyTurbidity: 3.4,
    skyRayleigh: 0.14,
    skyMieCoefficient: 0.01,
    skyMieDirectionalG: 1,
    skyElevation: 8.5,
    skyAzimuth: 35.8,
    skyCloudCoverage: 0.62,
    skyCloudDensity: 0.16,
    skyCloudElevation: 0.81,
    skyboxMode: 'day',
    skyboxRotationEnabled: false,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
  'Store - BH - Lensing': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    bloomEnabled: true,
    bloomStrength: 0.3,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
  'Store - BH - CA': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 2,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
  'Store - Med BH - CA': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    singularityLensDiameter: 2.5,
    singularityOriginRadius: 0.18,
    singularityBandWidth: 0.09,
    singularityFieldScale: 5.5,
    singularityEmissionStrength: 2.4,
    bodyOrbitRadius: 0.9,
    bodyOrbitSpeed: 0.32,
    body1Instances: 3,
    body2Instances: 2,
    body3Instances: 3,
    body4Instances: 2,
    body5Instances: 2,
    body6Instances: 2,
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 3,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
  'Store - LG BH - CA': {
    ...SAVED_BASE,
    cameraOrbit: {
      desktop: {
        fov: 60,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
      mobile: {
        fov: 75,
        pivot: [-1, 1.5, 0],
        position: [-1, 1.5, 150],
        target: [-1, 1.5, 0],
      },
    },
    singularityLensDiameter: 3.5,
    singularityOriginRadius: 0.3,
    singularityBandWidth: 0.14,
    singularityFieldScale: 9,
    singularityEmissionStrength: 3,
    bodyOrbitRadius: 1.1,
    bodyOrbitSpeed: 0.42,
    body1Instances: 5,
    body2Instances: 4,
    body3Instances: 5,
    body4Instances: 4,
    body5Instances: 4,
    body6Instances: 4,
    chromaticAberrationEnabled: true,
    chromaticAberrationStrength: 5,
    orbitDesktopPosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitDesktopTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopPivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitDesktopFov: 60,
    orbitMobilePosition: {
      x: -1,
      y: 1.5,
      z: 150,
    },
    orbitMobileTarget: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobilePivot: {
      x: -1,
      y: 1.5,
      z: 0,
    },
    orbitMobileFov: 75,
  },
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

export const PRESET_METADATA_KEYS = [
  'cameraFar',
  'cameraFixed',
  'cameraNear',
  'cameraOrbit',
  'cameraSpline',
  'fixedCameraShot',
  'storePosition',
  'storeRotation',
  'storeScale',
];
