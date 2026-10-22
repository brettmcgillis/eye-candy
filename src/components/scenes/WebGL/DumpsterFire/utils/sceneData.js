import {
  ASSET_SIZE,
  DECOR_RUG,
  DUMPSTER_POSITION,
  GROUND_Y,
  SCENE_ROOT_POSITION,
  layoutTrash,
} from '@modules/dumpsterFire';
import { createPropAsset, createTrashAsset } from '@modules/trashCatalog';
import { SHOT_ASSET_OPTIONS } from '@modules/trashShots';
import { radians } from '@utils/math';

import ArticulatedDumpster from '../components/ArticulatedDumpster';

export {
  BACKGROUND,
  DECOR_RUG,
  FLOOR_COLLIDER_HALF_EXTENTS,
  FLOOR_COLLIDER_POSITION,
  FOG_RANGE,
  GROUND_Y,
  LIGHTING,
  SCENE_ROOT_POSITION,
  SIDEWALK_GROUND,
  SIDEWALK_TILE_SIZE,
} from '@modules/dumpsterFire';

const DUMPSTER_CAMERA_DESKTOP_TARGET = [-8, 1, 1];
const DUMPSTER_CAMERA_MOBILE_TARGET = [-8, 1, 1];
const DUMPSTER_CAMERA_SPLINE_POINTS = [
  { position: [-7.5, 5.2, 16.5] },
  { position: [-13.5, 6.25, 11.5] },
  { position: [-14.75, 4.2, 1.25] },
  { position: [-10.75, 3.3, -7.5] },
  { position: [-3.5, 4.5, 6] },
];

// Generic cinematic loops framed around the dumpster (target ~[-6, 1, 0]).
// All authored as closed loops since the scene spline runs closed by default;
// toggle "Closed" off in the Camera controls for one-way versions.
const DUMPSTER_CAMERA_LOW_ORBIT_POINTS = [
  { position: [-6, 2.2, 11] },
  { position: [1.8, 2.6, 7.8] },
  { position: [5, 2.2, 0] },
  { position: [1.8, 2.8, -7.8] },
  { position: [-6, 2.4, -11] },
  { position: [-13.8, 2.8, -7.8] },
  { position: [-17, 2.2, 0] },
  { position: [-13.8, 2.6, 7.8] },
];

const DUMPSTER_CAMERA_HIGH_SWEEP_POINTS = [
  { position: [-6, 6.5, 13] },
  { position: [3.2, 7.2, 9.2] },
  { position: [7, 6.5, 0] },
  { position: [3.2, 7.6, -9.2] },
  { position: [-6, 6.8, -13] },
  { position: [-15.2, 7.4, -9.2] },
  { position: [-19, 6.5, 0] },
  { position: [-15.2, 7, 9.2] },
];

const DUMPSTER_CAMERA_RISE_AND_FALL_POINTS = [
  { position: [-6, 2.2, 11] },
  { position: [1.8, 5, 7.8] },
  { position: [5, 7, 0] },
  { position: [1.8, 5, -7.8] },
  { position: [-6, 2.4, -11] },
  { position: [-13.8, 5, -7.8] },
  { position: [-17, 7, 0] },
  { position: [-13.8, 5, 7.8] },
];

export const CAMERA = {
  defaultMode: 'orbit',
  cameraAutoFit: true,
  fixed: {
    behavior: 'single',
    activeShot: 'establishing',
    shots: {
      establishing: {
        desktop: {
          position: [-7.1, 5.1, 13.25],
          target: DUMPSTER_CAMERA_DESKTOP_TARGET,
          fov: 50,
        },
        mobile: {
          position: [-5.5, 4, 13.8],
          target: DUMPSTER_CAMERA_MOBILE_TARGET,
          fov: 79,
        },
      },
    },
  },
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 2,
    enablePan: false,
    minDistance: 5,
    maxDistance: 16,
    maxDistanceUnlimited: false,
    minPolarAngle: 40,
    maxPolarAngle: 80,
    minAzimuthAngle: -90,
    maxAzimuthAngle: 90,
    azimuthUnlimited: false,
    desktop: {
      position: [-7.1, 5.1, 13.25],
      target: DUMPSTER_CAMERA_DESKTOP_TARGET,
      pivot: DUMPSTER_CAMERA_DESKTOP_TARGET,
      fov: 46,
    },
    mobile: {
      position: [-5.5, 4, 13.8],
      target: DUMPSTER_CAMERA_MOBILE_TARGET,
      pivot: DUMPSTER_CAMERA_MOBILE_TARGET,
      fov: 60,
    },
  },
  spline: {
    desktop: {
      target: DUMPSTER_CAMERA_DESKTOP_TARGET,
      fov: 50,
    },
    mobile: {
      target: DUMPSTER_CAMERA_MOBILE_TARGET,
      fov: 64,
    },
    closed: true,
    duration: 28,
    orientationMode: 'target',
    showPath: false,
    tension: 0.45,
    preset: 'Dumpster Fire',
    paths: {
      'Dumpster Fire': {
        points: DUMPSTER_CAMERA_SPLINE_POINTS,
      },
      'Low Orbit': {
        points: DUMPSTER_CAMERA_LOW_ORBIT_POINTS,
      },
      'High Sweep': {
        points: DUMPSTER_CAMERA_HIGH_SWEEP_POINTS,
      },
      'Rise & Fall': {
        points: DUMPSTER_CAMERA_RISE_AND_FALL_POINTS,
      },
    },
  },
  operator: {
    moveSpeed: 8,
    liftSpeed: 6,
    boostMultiplier: 2.2,
    pointerLookSensitivity: 0.0032,
    stickLookSpeed: 2.6,
    zoomSpeed: 32,
    minFov: 24,
    maxFov: 80,
  },
};

export const DECOR_RUG_COLLIDER_POSITION = [
  SCENE_ROOT_POSITION[0] + DECOR_RUG.position[0],
  GROUND_Y + 0.02,
  SCENE_ROOT_POSITION[2] + DECOR_RUG.position[2],
];
export const POINTER_TAP_THRESHOLD = 8;
export const SHOT_SPAWN_OFFSET = 0.1;
export const SHOT_SPEED = 20;
export const SHOT_BASE_VERTICAL_BOOST = 0;
export const SHOT_POINTER_VERTICAL_BOOST = 0;
export const SHOT_SPIN_SPREAD = Object.freeze({
  x: 26,
  y: 26,
  z: 26,
});
export const SHOT_TUNING_PRESETS = Object.freeze({
  Realistic: Object.freeze({
    spawnOffset: SHOT_SPAWN_OFFSET,
    speed: SHOT_SPEED,
    baseVerticalBoost: SHOT_BASE_VERTICAL_BOOST,
    pointerVerticalBoost: SHOT_POINTER_VERTICAL_BOOST,
    spinX: SHOT_SPIN_SPREAD.x,
    spinY: SHOT_SPIN_SPREAD.y,
    spinZ: SHOT_SPIN_SPREAD.z,
  }),
  Fun: Object.freeze({
    spawnOffset: SHOT_SPAWN_OFFSET,
    speed: 80,
    baseVerticalBoost: SHOT_BASE_VERTICAL_BOOST,
    pointerVerticalBoost: SHOT_POINTER_VERTICAL_BOOST,
    spinX: SHOT_SPIN_SPREAD.x,
    spinY: SHOT_SPIN_SPREAD.y,
    spinZ: SHOT_SPIN_SPREAD.z,
  }),
});
export const DEFAULT_SHOT_TUNING_MODE = 'Realistic';
export const DEFAULT_SHOT_TUNING =
  SHOT_TUNING_PRESETS[DEFAULT_SHOT_TUNING_MODE];
export const SHOT_POOL_SLOTS_PER_ASSET = 10;
export const SHOT_AIM_PLANE_POINT = [
  SCENE_ROOT_POSITION[0],
  GROUND_Y + 1.5,
  SCENE_ROOT_POSITION[2] + 0.5,
];

export const FIRE_LOOP_TRACK = 'looped-fire.mp3';
export const FIRE_LOOP_VOLUME = 0.75;
// Positional-audio defaults for the spatialized fire loop. offset is relative
// to the flame's instance group; ref/rolloff/max feed Howler's panner.
export const DEFAULT_FIRE_AUDIO = Object.freeze({
  enabled: true,
  volume: FIRE_LOOP_VOLUME,
  refDistance: 4,
  rolloffFactor: 1,
  maxDistance: 60,
  offsetX: 0.65,
  offsetY: 0.5,
  offsetZ: 0,
});
// The dumpster asset is centered on local z=0 in scene space, so the scene
// root z coordinate is the midpoint through the dumpster depth in world space.
export const CURSOR_ATTRACTOR_PLANE_Z = SCENE_ROOT_POSITION[2];
export const CURSOR_ATTRACTOR_FALLBACK_POSITION = [0, -10, 0];
export const CURSOR_ATTRACTOR_DIRECTION = [0, 1, 0];
export const TRASH_CLEANUP_PLANE_SIZE = [100, 100];
export const TRASH_CLEANUP_PLANE_Y = -18;
export const TRASH_CLEANUP_COLLIDER_HALF_EXTENTS = [
  TRASH_CLEANUP_PLANE_SIZE[0] / 2,
  0.25,
  TRASH_CLEANUP_PLANE_SIZE[1] / 2,
];
export const TRASH_CLEANUP_POSITION = [0, TRASH_CLEANUP_PLANE_Y, 0];

export const ASSET_GRID_COLUMNS = 6;
export const ASSET_GRID_COLUMN_SPACING = 2.2;
export const ASSET_GRID_ROW_SPACING = 3.05;
export const ASSET_GRID_POSITION = [4.75, GROUND_Y, 2.2];
export const ASSET_GRID_LABEL_HEIGHT = 1.6;

const EXPECTED_GRID_ASSET_SIZE_METERS = {
  ...ASSET_SIZE,
  dumpster: 2.4,
  'happy-meal': 0.16,
  'mc-cup': 0.14,
};
const GRID_SHOWCASE_Y_OFFSETS = { 'cigarette-butts': 0.02 };

export { SHOT_ASSET_OPTIONS, getRandomShotAsset } from '@modules/trashShots';

// The dumpster, the rug and the generation's litter (@modules/dumpsterFire's
// layoutTrash) as rigid-body items.
export function buildSceneItems(config) {
  const { dynamic, fixed } = layoutTrash(config);
  return {
    dynamic: dynamic.map(({ id, key, position, rotation }) =>
      createTrashAsset(key, { id, position, rotation })
    ),
    fixed: [
      createPropAsset('dumpster', {
        position: DUMPSTER_POSITION,
        rotation: [0, 0, 0],
        PhysicsComponent: ArticulatedDumpster,
        componentProps: {
          rightLidRotation: -radians(521),
          leftLidRotation: -radians(521),
        },
      }),
      createPropAsset('persian-rug', {
        position: DECOR_RUG.position,
        rotation: DECOR_RUG.rotation,
        scale: DECOR_RUG.scale,
      }),
      ...fixed.map(({ key, position, rotation }) =>
        createPropAsset(key, { position, rotation })
      ),
    ],
  };
}

const AUTHORED_ITEMS = buildSceneItems({ trashLayout: 'authored' });

export const INSTANCED_TRASH_POOL_META = SHOT_ASSET_OPTIONS.reduce(
  (meta, asset, assetIndex) => ({
    ...meta,
    [asset.key]: {
      assetIndex,
    },
  }),
  {}
);

function collectUniqueGridAssets(...assetGroups) {
  const seenKeys = new Set();

  return assetGroups.flat().filter((asset) => {
    if (asset.key === 'dumpster' || seenKeys.has(asset.key)) {
      return false;
    }

    seenKeys.add(asset.key);
    return true;
  });
}

function sortGridAssetsByExpectedSize(assets) {
  return assets
    .map((asset, index) => ({ asset, index }))
    .sort(
      (left, right) =>
        (right.asset.expectedSizeMeters ?? 0) -
          (left.asset.expectedSizeMeters ?? 0) || left.index - right.index
    )
    .map(({ asset }) => asset);
}

export const ASSET_GRID_OPTIONS = sortGridAssetsByExpectedSize(
  collectUniqueGridAssets(
    AUTHORED_ITEMS.fixed,
    AUTHORED_ITEMS.dynamic,
    SHOT_ASSET_OPTIONS
  ).map((asset) => ({
    ...asset,
    showcaseYOffset:
      asset.showcaseYOffset ?? GRID_SHOWCASE_Y_OFFSETS[asset.key] ?? 0,
    expectedSizeMeters: EXPECTED_GRID_ASSET_SIZE_METERS[asset.key],
  }))
);
