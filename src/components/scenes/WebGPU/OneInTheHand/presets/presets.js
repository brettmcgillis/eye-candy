// Literal artwork values; new controls require an explicit migration.
const SAVED_BASE = {
  ambientIntensity: 1.1,
  ambientColor: '#d7c7b2',
  backgroundColor: '#111111',
  branchPosition: {
    x: 0.08,
    y: 1.43,
    z: 0.06,
  },
  branchRotation: {
    x: 0,
    y: 0,
    z: 0.6,
  },
  branchScale: {
    x: 0.01,
    y: 0.01,
    z: 0.01,
  },
  bird1Clip: 'Robin_Bird_Idle2',
  bird1Color: '#d8b38a',
  bird1Model: 'robin',
  bird1Position: {
    x: -0.06,
    y: 1.22,
    z: 0.01,
  },
  bird1Rotation: {
    x: 0,
    y: 0.5,
    z: 0,
  },
  bird1Scale: 1.7,
  bird2Clip: 'idleA1_bird',
  bird2Color: '#c9d5b3',
  bird2Model: 'kingfisher',
  bird2Position: {
    x: 0.04,
    y: 1.18,
    z: -0.08,
  },
  bird2Rotation: {
    x: 0,
    y: -0.25,
    z: 0,
  },
  bird2Scale: 0.11,
  cameraAutoFit: true,
  cameraFar: 500,
  cameraMode: 'orbit',
  cameraNear: 0.1,
  cameraOrbit: {
    desktop: {
      fov: 32,
      pivot: {
        x: 0,
        y: 1.15,
        z: 0,
      },
      position: {
        x: 1.8,
        y: 1.55,
        z: 3.8,
      },
      target: {
        x: 0,
        y: 1.1,
        z: 0,
      },
    },
    mobile: {
      fov: 40,
      pivot: {
        x: 0,
        y: 1.1,
        z: 0,
      },
      position: {
        x: 0.7,
        y: 1.7,
        z: 4.8,
      },
      target: {
        x: 0,
        y: 1.05,
        z: 0,
      },
    },
  },
  cameraSpline: {
    closed: false,
    duration: 20,
    forwardDistance: 1,
    orientationMode: 'target',
    points: [
      {
        position: {
          x: 1.6,
          y: 1.5,
          z: 4.2,
        },
        lookAt: {
          x: 0,
          y: 1.1,
          z: 0,
        },
      },
      {
        position: {
          x: -0.4,
          y: 1.65,
          z: 3.1,
        },
        lookAt: {
          x: 0,
          y: 1.15,
          z: 0,
        },
      },
      {
        position: {
          x: -1.2,
          y: 1.45,
          z: 2.2,
        },
        lookAt: {
          x: -0.1,
          y: 1.15,
          z: 0.1,
        },
      },
    ],
    preset: 'Default',
    showPath: true,
    tension: 0.35,
  },
  directionalColor: '#fff3dc',
  directionalIntensity: 2.2,
  directionalPosition: {
    x: 2.2,
    y: 4.5,
    z: 3.5,
  },
  fogColor: '#111111',
  fogFar: 14,
  fogNear: 2,
  skeletonPosition: {
    x: 0,
    y: 0.03,
    z: 0,
  },
  skeletonRotation: {
    x: 0,
    y: 0,
    z: 0,
  },
  skeletonScale: 0.1,
  skeletonPose: 'one_in_the_hand',
  cameraProjection: 'perspective',
  cameraFrustumHeight: 10,
  cameraMobileFrustumHeight: 10,
  fixedBehavior: 'single',
  fixedShotDefaultDesktopPosition: {
    x: 0,
    y: 0,
    z: 5,
  },
  fixedShotDefaultDesktopTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  fixedShotDefaultDesktopFov: 50,
  fixedShotDefaultMobilePosition: {
    x: 0,
    y: 0,
    z: 5,
  },
  fixedShotDefaultMobileTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  fixedShotDefaultMobileFov: 50,
  orbitAutoRotate: false,
  orbitAutoRotateSpeed: 2,
  orbitEnablePan: true,
  orbitMinPolarAngle: 0,
  orbitMaxPolarAngle: 180,
  orbitAzimuthUnlimited: true,
  orbitMinAzimuthAngle: -180,
  orbitMaxAzimuthAngle: 180,
  orbitMinDistance: 0,
  orbitMaxDistanceUnlimited: true,
  orbitMaxDistance: 100,
  orbitDesktopPosition: {
    x: 1.8,
    y: 1.55,
    z: 3.8,
  },
  orbitDesktopTarget: {
    x: 0,
    y: 1.1,
    z: 0,
  },
  orbitDesktopPivot: {
    x: 0,
    y: 1.15,
    z: 0,
  },
  orbitDesktopFov: 32,
  orbitMobilePosition: {
    x: 0.7,
    y: 1.7,
    z: 4.8,
  },
  orbitMobileTarget: {
    x: 0,
    y: 1.05,
    z: 0,
  },
  orbitMobilePivot: {
    x: 0,
    y: 1.1,
    z: 0,
  },
  orbitMobileFov: 40,
  splinePreset: 'Scene Path',
  splineDesktopTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  splineDesktopFov: 50,
  splineMobileTarget: {
    x: 0,
    y: 0,
    z: 0,
  },
  splineMobileFov: 50,
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
  splineDuration: 20,
  splineTension: 0.35,
  splineClosed: false,
  splineShowPath: true,
  operatorMoveSpeed: 6,
  operatorLiftSpeed: 6,
  operatorBoostMultiplier: 2,
  operatorPointerLookSensitivity: 0.003,
  operatorStickLookSpeed: 2.5,
  operatorZoomSpeed: 24,
  operatorMinFov: 20,
  operatorMaxFov: 80,
};

const SCENE_PRESETS = {
  'One In The Hand': { ...SAVED_BASE },
  'Two In The Cage': {
    ...SAVED_BASE,
    bird1Clip: 'idleB1',
    bird1Model: 'kingfisher',
    bird1Position: {
      x: -0.12,
      y: 1.17,
      z: 0.08,
    },
    bird1Rotation: {
      x: 0,
      y: 0.3,
      z: 0,
    },
    bird2Clip: 'take 001',
    bird2Model: 'hummingbird',
    bird2Position: {
      x: 0.03,
      y: 1.21,
      z: -0.03,
    },
    bird2Rotation: {
      x: 0,
      y: -0.15,
      z: 0,
    },
    skeletonPose: 'two_in_the_chest',
  },
};

export const DEFAULT_PRESET = 'One In The Hand';

export default SCENE_PRESETS;

export const PRESET_METADATA_KEYS = [
  'cameraFar',
  'cameraNear',
  'cameraOrbit',
  'cameraSpline',
];
