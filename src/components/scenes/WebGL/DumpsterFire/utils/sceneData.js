import {
  AppleCore,
  AppleCoreInstance,
  AppleCoreInstances,
} from '@elements/AppleCore/AppleCore';
import {
  BeerBottle1,
  BeerBottle1Instance,
  BeerBottle1Instances,
  BeerBottle2,
  BeerBottle2Instance,
  BeerBottle2Instances,
  WhiskeyBottle,
  WhiskeyBottleInstance,
  WhiskeyBottleInstances,
} from '@elements/Bottles/Bottles';
import {
  Bucket,
  BucketInstance,
  BucketInstances,
} from '@elements/Bucket/Bucket';
import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '@elements/Cardboard/Cardboard';
import {
  BeerCase1,
  BeerCase1Instance,
  BeerCase1Instances,
  BeerCase2,
  BeerCase2Instance,
  BeerCase2Instances,
  CardboardBox1,
  CardboardBox1Instance,
  CardboardBox1Instances,
  CardboardBox2,
  CardboardBox2Instance,
  CardboardBox2Instances,
  CardboardBox3,
  CardboardBox3Instance,
  CardboardBox3Instances,
  CardboardBox4,
  CardboardBox4Instance,
  CardboardBox4Instances,
  CardboardBox5,
  CardboardBox5Instance,
  CardboardBox5Instances,
} from '@elements/CardboardBoxes/CardboardBoxes';
import {
  LowPolyCassetteTape1,
  LowPolyCassetteTape1Instance,
  LowPolyCassetteTape1Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape1';
import {
  LowPolyCassetteTape2,
  LowPolyCassetteTape2Instance,
  LowPolyCassetteTape2Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape2';
import {
  LowPolyCassetteTape3,
  LowPolyCassetteTape3Instance,
  LowPolyCassetteTape3Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape3';
import {
  Catfood,
  CatfoodInstance,
  CatfoodInstances,
} from '@elements/Catfood/Catfood';
import CigaretteButts from '@elements/CigaretteButts/CigaretteButts';
import Dumpster from '@elements/Dumpster/Dumpster';
import {
  LowPolyFloppyDisk,
  LowPolyFloppyDiskInstance,
  LowPolyFloppyDiskInstances,
} from '@elements/FloppyDisk/LowPolyFloppyDisk';
import {
  GarbageBag,
  GarbageBag1,
  GarbageBag1Instance,
  GarbageBag1Instances,
  GarbageBagInstance,
  GarbageBagInstances,
  GarbageBags1,
  GarbageBags2,
  GarbageBagsPile,
} from '@elements/GarbageBags/GarbageBags';
import {
  HappyMeal,
  HappyMealInstance,
  HappyMealInstances,
} from '@elements/HappyMeal/HappyMeal';
import { Litter, Litter2 } from '@elements/Litter/Litter';
import { McCup, McCupInstance, McCupInstances } from '@elements/McCup/McCup';
import NewspaperStack from '@elements/NewsPaperStack/NewsPaperStack';
import {
  NewsPaper1,
  NewsPaper2,
  NewsPaper3,
} from '@elements/NewsPapers/NewsPapers';
import PersianRug from '@elements/PersianRug/PersianRug';
import {
  Snickers,
  SnickersInstance,
  SnickersInstances,
} from '@elements/Snickers/Snickers';
import {
  SodaCan,
  SodaCanInstance,
  SodaCanInstances,
} from '@elements/SodaCan/SodaCan';
import {
  StarbucksCup,
  StarbucksCupInstance,
  StarbucksCupInstances,
} from '@elements/StarbucksCup/StarbucksCup';
import {
  LowPolyVHSTape,
  LowPolyVHSTapeInstance,
  LowPolyVHSTapeInstances,
} from '@elements/VhsTape/LowPolyVHSTape';
import {
  SHOT_ASSET_OPTIONS,
  createPropAsset,
  createTrashAsset,
} from '@modules/trashCatalog';
import { radians } from '@utils/math';

import ArticulatedDumpster from '../components/ArticulatedDumpster';

export const GROUND_Y = -1;
export const SCENE_ROOT_POSITION = [-9, GROUND_Y, 1];
export const FLOOR_COLLIDER_HALF_EXTENTS = [15, 0.25, 9];
export const FLOOR_COLLIDER_POSITION = [
  -2.25,
  GROUND_Y - FLOOR_COLLIDER_HALF_EXTENTS[1],
  1,
];

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

export const BACKGROUND = '#e8e8e8';
export const FOG_RANGE = [18, 34];
export const SIDEWALK_GROUND = Object.freeze({
  enabled: true,
  length: 30,
  rows: 2,
  rotationDeg: 0,
  position: { x: -7, y: GROUND_Y, z: 0.5 },
});
// Nominal footprint of a single curb slab (measured from the GLBs), used to
// size the sidewalk's physics collider to match the visual tiling.
export const SIDEWALK_TILE_SIZE = Object.freeze({ width: 6.99, depth: 5.9 });
export const DECOR_RUG = Object.freeze({
  position: [0, -0.012, 0.55],
  rotation: [0, Math.PI / 2, 0],
  scale: 1.2,
  colliderHalfExtents: [2.35, 0.02, 5.15],
});
export const DECOR_RUG_COLLIDER_POSITION = [
  SCENE_ROOT_POSITION[0] + DECOR_RUG.position[0],
  GROUND_Y + 0.02,
  SCENE_ROOT_POSITION[2] + DECOR_RUG.position[2],
];
export const LIGHTING = {
  ambientIntensity: 0.85,
  directionalPosition: [8, 12, 10],
  directionalIntensity: 1.15,
};

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
  dumpster: 2.4,
  'garbage-bags-pile': 1.25,
  'cardboard-leaning-2': 1.1,
  'cardboard-flat': 1.05,
  'cardboard-flat-2': 1.05,
  'garbage-bags-1': 0.95,
  'garbage-bags-2': 0.95,
  'garbage-bag': 0.85,
  'garbage-bag-1': 0.85,
  'cardboard-box': 0.75,
  'cardboard-box-5': 0.74,
  'cardboard-box-4': 0.72,
  'cardboard-box-2': 0.68,
  'cardboard-box-3': 0.66,
  'cardboard-box-1': 0.64,
  'newspaper-1': 0.58,
  'newspaper-2': 0.58,
  'newspaper-3': 0.58,
  'newspaper-stack': 0.58,
  'beer-case-1': 0.45,
  'beer-case-2': 0.45,
  bucket: 0.36,
  litter: 0.34,
  'whiskey-bottle': 0.12,
  'litter-2': 0.28,
  'beer-bottle-1': 0.24,
  'beer-bottle-2': 0.24,
  'vhs-tape': 0.19,
  'starbucks-cup': 0.17,
  'happy-meal': 0.16,
  'mc-cup': 0.14,
  catfood: 0.2,
  'soda-can': 0.13,
  'cigarette-butts': 0.12,
  snickers: 0.11,
  'cassette-tape-1': 0.1,
  'cassette-tape-2': 0.1,
  'cassette-tape-3': 0.1,
  'floppy-disk': 0.09,
  'apple-core': 0.08,
};

const BASE_FIXED_SCENE_ITEMS = [
  createPropAsset('dumpster', {
    position: [0, 0.04, 0],
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
  createPropAsset('garbage-bags-pile', {
    position: [0, 1.04, 0.1],
    rotation: [0, 0, 0],
  }),
  createPropAsset('garbage-bags-2', {
    position: [-1, 2.04, 0.1],
    rotation: [0, 0, 0],
  }),
  createPropAsset('litter', {
    position: [1, 0.085, 1],
    rotation: [0, 0, 0],
  }),
  createPropAsset('litter-2', {
    position: [0, 0.085, 0],
    rotation: [0, 0, 0],
  }),
  createPropAsset('litter', {
    position: [-2, 0.085, 0.8],
    rotation: [0, 0, 0],
  }),
  createPropAsset('cardboard-flat', {
    position: [-2, 0.08, 1],
    rotation: [0, 90, 0],
  }),
  createPropAsset('newspaper-1', {
    position: [-1, 0.04, 1.4],
    rotation: [0, 90, 0],
  }),
  createPropAsset('vhs-tape', {
    position: [0.8, 0.07, 1.45],
    rotation: [Math.PI / 2, Math.PI, -Math.PI / 9],
  }),
  createPropAsset('cassette-tape-1', {
    position: [-0.2, 0.07, 1.6],
    rotation: [Math.PI / 2, Math.PI, 0],
  }),
  createPropAsset('cassette-tape-2', {
    position: [1.85, 0.07, 1.9],
    rotation: [Math.PI / 2, -Math.PI, 0],
  }),
  createPropAsset('cassette-tape-3', {
    position: [4.1, 0.07, 1.45],
    rotation: [Math.PI / 2.2, Math.PI, 0],
  }),
  createPropAsset('floppy-disk', {
    position: [-1.35, 0.07, 2.05],
    rotation: [Math.PI / 2, -Math.PI, Math.PI / 7],
  }),
  createPropAsset('litter-2', {
    position: [-3.5, 0.085, 1],
    rotation: [0, -Math.PI / 3, 0],
  }),
  createPropAsset('garbage-bags-1', {
    position: [-2.7, 0.04, 0],
    rotation: [0, 90, 0],
  }),
  createPropAsset('cardboard-box', {
    position: [-2.2, 0.42, 1.2],
    rotation: [0, 90, 0],
  }),
  createPropAsset('cardboard-box-1', {
    position: [-3.2, 0.19, 1.2],
    rotation: [0, Math.PI / 3, 0],
  }),
  createPropAsset('cardboard-box-1', {
    position: [-3.75, 0.19, 1.2],
    rotation: [0, Math.PI / 1.7, 0],
  }),
  createPropAsset('cardboard-box-1', {
    position: [-3.45, 0.49, 1.2],
    rotation: [0, Math.PI / 2, 0],
  }),
  createPropAsset('newspaper-2', {
    position: [-5, 0.04, 2],
    rotation: [0, 90, 0],
  }),
  createPropAsset('cigarette-butts', {
    position: [0, 0.04, 1.7],
    rotation: [0, -Math.PI / 1.5, 0],
    showcaseYOffset: 0.02,
  }),
  createPropAsset('cigarette-butts', {
    position: [0.7, 0.04, 1.2],
    rotation: [0, Math.PI / 2.5, 0],
  }),
  createPropAsset('newspaper-stack', {
    position: [-1.5, 0.17, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
  }),
  createPropAsset('cardboard-flat-2', {
    position: [2.4, 0.1, 0.75],
    rotation: [0, 0, 0],
  }),
  createPropAsset('cardboard-box-3', {
    position: [2, 0.29, 1.55],
    rotation: [0, -Math.PI / 2, 0],
  }),
  createPropAsset('cardboard-box-1', {
    position: [1.4, 0.2, 1.3],
    rotation: [0, Math.PI / 3, 0],
  }),
  createPropAsset('cardboard-leaning-2', {
    position: [2.17, 0.29, 0],
    rotation: [0, Math.PI / 2, 0],
  }),
  createPropAsset('litter', {
    position: [3, 0.085, 0.8],
    rotation: [0, -Math.PI / 4, 0],
  }),
  createPropAsset('cigarette-butts', {
    position: [3, 0.04, 1.6],
    rotation: [0, Math.PI, 0],
  }),
  createPropAsset('garbage-bags-2', {
    position: [2.5, 0.04, 0],
    rotation: [0, -Math.PI / 1.3, 0],
    scale: 1,
  }),
  createPropAsset('cardboard-box-2', {
    position: [3.1, 0.24, 0.35],
    rotation: [0, Math.PI / 2, 0],
  }),
  createPropAsset('cardboard-box', {
    position: [3.1, 0.44, -0.75],
    rotation: [0, Math.PI / 7, 0],
  }),
  createPropAsset('newspaper-stack', {
    position: [2.6, 0.17, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
  }),
  createPropAsset('newspaper-3', {
    position: [4.5, 0.04, 1.2],
    rotation: [0, 90, 0],
  }),
];

export { SHOT_ASSET_OPTIONS, getRandomShotAsset } from '@modules/trashCatalog';

export const FIXED_SCENE_ITEMS = BASE_FIXED_SCENE_ITEMS;

export const DYNAMIC_SCENE_ITEMS = [
  createTrashAsset('garbage-bag', {
    id: 'right-garbage-bag',
    position: [-4.0, 0, 0.2],
    rotation: [0, Math.PI / 1.5, 0],
  }),
  createTrashAsset('garbage-bag-1', {
    id: 'left-garbage-bag',
    position: [4, 0, 0.25],
    rotation: [0, 0, 0],
  }),
  createTrashAsset('starbucks-cup', {
    id: 'front-right-cup',
    position: [-1.1, 0.02, 1.95],
    rotation: [Math.PI / 2, Math.PI / 5, 0],
  }),
  createTrashAsset('starbucks-cup', {
    id: 'left-side-cup',
    position: [3.55, 0.02, 1.05],
    rotation: [Math.PI / 2, -Math.PI / 3, 0],
  }),
  createTrashAsset('apple-core', {
    id: 'front-apple-core',
    position: [0.15, 0.03, 2.05],
    rotation: [Math.PI / 5, -Math.PI / 6, Math.PI / 7],
  }),
  createTrashAsset('apple-core', {
    id: 'left-apple-core',
    position: [3.4, 0.03, 1.85],
    rotation: [Math.PI / 6, Math.PI / 4, -Math.PI / 5],
  }),
  createTrashAsset('cardboard-box-4', {
    id: 'front-left-box-4',
    position: [-2.4, 0.02, 2.2],
    rotation: [0, Math.PI / 7, 0],
  }),
  createTrashAsset('cardboard-box-5', {
    id: 'front-right-box-5',
    position: [1.85, 0.02, 2.1],
    rotation: [0, -Math.PI / 6, 0],
  }),
  createTrashAsset('beer-case-1', {
    id: 'right-side-beer-case-1',
    position: [-5.1, 0.02, 0.95],
    rotation: [0, Math.PI / 9, 0],
  }),
  createTrashAsset('beer-case-2', {
    id: 'left-side-beer-case-2',
    position: [4.8, 0.02, -0.2],
    rotation: [0, -Math.PI / 4, 0],
  }),
  createTrashAsset('whiskey-bottle', {
    id: 'front-whiskey-bottle',
    position: [-0.2, 0.04, 2.5],
    rotation: [0, Math.PI / 3, Math.PI / 2],
  }),
  createTrashAsset('beer-bottle-1', {
    id: 'right-beer-bottle-1',
    position: [-4.55, 0.03, 1.55],
    rotation: [Math.PI / 10, 0, Math.PI / 2],
  }),
  createTrashAsset('beer-bottle-2', {
    id: 'left-beer-bottle-2',
    position: [4.15, 0.03, 1.55],
    rotation: [Math.PI / 12, 0, -Math.PI / 2],
  }),
  createTrashAsset('soda-can', {
    id: 'front-left-soda-can',
    position: [-3.05, 0.03, 2.7],
    rotation: [1, 1, 1],
  }),
  createTrashAsset('soda-can', {
    id: 'front-right-soda-can',
    position: [2.75, 0.03, 2.65],
    rotation: [2, -2, 2],
  }),
  createTrashAsset('snickers', {
    id: 'right-side-snickers',
    position: [-5.35, 0.03, 1.85],
    rotation: [0, Math.PI / 8, 0],
  }),
  createTrashAsset('snickers', {
    id: 'left-side-snickers',
    position: [4.85, 0.03, 2.15],
    rotation: [0, -Math.PI / 7, 0],
  }),
  createTrashAsset('bucket', {
    id: 'front-bucket',
    position: [0.95, 0.4, 2.35],
    rotation: [0, -Math.PI / 8, 0],
  }),
  createTrashAsset('catfood', {
    id: 'front-left-catfood',
    position: [-1.7, 0.04, 2.45],
    rotation: [0, Math.PI / 5, 0],
  }),
  createTrashAsset('catfood', {
    id: 'right-side-catfood',
    position: [-4.75, 0.04, 1.2],
    rotation: [0, -Math.PI / 6, 0],
  }),
];

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
    FIXED_SCENE_ITEMS,
    DYNAMIC_SCENE_ITEMS,
    SHOT_ASSET_OPTIONS
  ).map((asset) => ({
    ...asset,
    showcaseYOffset: asset.showcaseYOffset ?? 0,
    expectedSizeMeters: EXPECTED_GRID_ASSET_SIZE_METERS[asset.key],
  }))
);
