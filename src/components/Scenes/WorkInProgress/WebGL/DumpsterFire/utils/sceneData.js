import { radians } from '../../../../../../utils/math';
import {
  AppleCore,
  AppleCoreInstance,
  AppleCoreInstances,
} from '../../../../../elements/appleCore/AppleCore';
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
} from '../../../../../elements/bottles/Bottles';
import {
  Bucket,
  BucketInstance,
  BucketInstances,
} from '../../../../../elements/bucket/Bucket';
import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '../../../../../elements/cardboard/Cardboard';
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
} from '../../../../../elements/cardboardBoxes/CardboardBoxes';
import {
  LowPolyCassetteTape1,
  LowPolyCassetteTape1Instance,
  LowPolyCassetteTape1Instances,
} from '../../../../../elements/cassetteTape/LowPolyCassetteTape1';
import {
  LowPolyCassetteTape2,
  LowPolyCassetteTape2Instance,
  LowPolyCassetteTape2Instances,
} from '../../../../../elements/cassetteTape/LowPolyCassetteTape2';
import {
  LowPolyCassetteTape3,
  LowPolyCassetteTape3Instance,
  LowPolyCassetteTape3Instances,
} from '../../../../../elements/cassetteTape/LowPolyCassetteTape3';
import CigaretteButts from '../../../../../elements/cigaretteButts/CigaretteButts';
import Dumpster from '../../../../../elements/dumpster/Dumpster';
import {
  LowPolyFloppyDisk,
  LowPolyFloppyDiskInstance,
  LowPolyFloppyDiskInstances,
} from '../../../../../elements/floppyDisk/LowPolyFloppyDisk';
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
} from '../../../../../elements/garbageBags/GarbageBags';
import {
  HappyMeal,
  HappyMealInstance,
  HappyMealInstances,
} from '../../../../../elements/happyMeal/HappyMeal';
import { Litter, Litter2 } from '../../../../../elements/litter/Litter';
import {
  McCup,
  McCupInstance,
  McCupInstances,
} from '../../../../../elements/mcCup/McCup';
import NewspaperStack from '../../../../../elements/newsPaperStack/NewsPaperStack';
import {
  NewsPaper1,
  NewsPaper2,
  NewsPaper3,
} from '../../../../../elements/newsPapers/NewsPapers';
import {
  StarbucksCup,
  StarbucksCupInstance,
  StarbucksCupInstances,
} from '../../../../../elements/starbucksCup/StarbucksCup';
import {
  LowPolyVHSTape,
  LowPolyVHSTapeInstance,
  LowPolyVHSTapeInstances,
} from '../../../../../elements/vhsTape/LowPolyVHSTape';
import ArticulatedDumpster from '../components/ArticulatedDumpster';

export const GROUND_Y = -1;
export const SCENE_ROOT_POSITION = [-9, GROUND_Y, 1];
export const FLOOR_COLLIDER_HALF_EXTENTS = [15, 0.25, 9];
export const FLOOR_COLLIDER_POSITION = [
  -2.25,
  GROUND_Y - FLOOR_COLLIDER_HALF_EXTENTS[1],
  1,
];

export const CAMERA = {
  position: [-2.5, 3.2, 20],
  target: [0, 0, 0],
  fov: 40,
  desktopPosition: [-8, 6.2, 16],
  desktopTarget: [-6, 1, 0],
  desktopFov: 50,
  mobilePosition: [-6, 4.2, 16],
  mobileTarget: [-6, 0, 0],
  mobileFov: 70,
};

export const BACKGROUND = '#e8e8e8';
export const FOG_RANGE = [18, 34];
export const GROUND = {
  color: '#efefef',
  size: [30, 18],
};
export const GRID = {
  args: [30, 15, '#cdcdcd', '#d9d9d9'],
};
export const LIGHTING = {
  ambientIntensity: 0.85,
  directionalPosition: [8, 12, 10],
  directionalIntensity: 1.15,
};

export const POINTER_TAP_THRESHOLD = 8;
export const SHOT_SPAWN_OFFSET = 1.25;
export const SHOT_SPEED = 20;
export const SHOT_BASE_VERTICAL_BOOST = 2.5;
export const SHOT_POINTER_VERTICAL_BOOST = 4.5;
export const SHOT_SPIN_SPREAD = Object.freeze({
  x: 6,
  y: 12,
  z: 6,
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
    spawnOffset: 1.5,
    speed: 80,
    baseVerticalBoost: 8,
    pointerVerticalBoost: 10,
    spinX: 10,
    spinY: 18,
    spinZ: 10,
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
export const FIRE_LOOP_VOLUME = 0.35;
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
  'cigarette-butts': 0.12,
  'cassette-tape-1': 0.1,
  'cassette-tape-2': 0.1,
  'cassette-tape-3': 0.1,
  'floppy-disk': 0.09,
  'apple-core': 0.08,
};

const TRASH_ASSET_CONFIGS = {
  'garbage-bag': {
    Component: GarbageBag,
    InstanceComponent: GarbageBagInstance,
    InstancesComponent: GarbageBagInstances,
    scale: 0.75,
    mass: 0.45,
    colliders: 'hull',
  },
  'garbage-bag-1': {
    Component: GarbageBag1,
    InstanceComponent: GarbageBag1Instance,
    InstancesComponent: GarbageBag1Instances,
    scale: 0.8,
    mass: 0.5,
    colliders: 'hull',
  },
  'cardboard-box-1': {
    Component: CardboardBox1,
    InstanceComponent: CardboardBox1Instance,
    InstancesComponent: CardboardBox1Instances,
    scale: 1,
    mass: 0.7,
    colliders: 'hull',
  },
  'cardboard-box-2': {
    Component: CardboardBox2,
    InstanceComponent: CardboardBox2Instance,
    InstancesComponent: CardboardBox2Instances,
    scale: 1,
    mass: 0.75,
    colliders: 'hull',
  },
  'cardboard-box-3': {
    Component: CardboardBox3,
    InstanceComponent: CardboardBox3Instance,
    InstancesComponent: CardboardBox3Instances,
    scale: 1,
    mass: 0.8,
    colliders: 'hull',
  },
  'starbucks-cup': {
    Component: StarbucksCup,
    InstanceComponent: StarbucksCupInstance,
    InstancesComponent: StarbucksCupInstances,
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  'vhs-tape': {
    Component: LowPolyVHSTape,
    InstanceComponent: LowPolyVHSTapeInstance,
    InstancesComponent: LowPolyVHSTapeInstances,
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  'cassette-tape-1': {
    Component: LowPolyCassetteTape1,
    InstanceComponent: LowPolyCassetteTape1Instance,
    InstancesComponent: LowPolyCassetteTape1Instances,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'cassette-tape-2': {
    Component: LowPolyCassetteTape2,
    InstanceComponent: LowPolyCassetteTape2Instance,
    InstancesComponent: LowPolyCassetteTape2Instances,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'cassette-tape-3': {
    Component: LowPolyCassetteTape3,
    InstanceComponent: LowPolyCassetteTape3Instance,
    InstancesComponent: LowPolyCassetteTape3Instances,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'floppy-disk': {
    Component: LowPolyFloppyDisk,
    InstanceComponent: LowPolyFloppyDiskInstance,
    InstancesComponent: LowPolyFloppyDiskInstances,
    scale: 1,
    mass: 0.2,
    colliders: 'hull',
  },
  'apple-core': {
    Component: AppleCore,
    InstanceComponent: AppleCoreInstance,
    InstancesComponent: AppleCoreInstances,
    scale: 1,
    mass: 0.18,
    colliders: 'hull',
  },
  'cardboard-box-4': {
    Component: CardboardBox4,
    InstanceComponent: CardboardBox4Instance,
    InstancesComponent: CardboardBox4Instances,
    scale: 1,
    mass: 0.85,
    colliders: 'hull',
  },
  'cardboard-box-5': {
    Component: CardboardBox5,
    InstanceComponent: CardboardBox5Instance,
    InstancesComponent: CardboardBox5Instances,
    scale: 1,
    mass: 0.9,
    colliders: 'hull',
  },
  'beer-case-1': {
    Component: BeerCase1,
    InstanceComponent: BeerCase1Instance,
    InstancesComponent: BeerCase1Instances,
    scale: 1,
    mass: 1.1,
  },
  'beer-case-2': {
    Component: BeerCase2,
    InstanceComponent: BeerCase2Instance,
    InstancesComponent: BeerCase2Instances,
    scale: 1,
    mass: 1.15,
  },
  'whiskey-bottle': {
    Component: WhiskeyBottle,
    InstanceComponent: WhiskeyBottleInstance,
    InstancesComponent: WhiskeyBottleInstances,
    scale: 1,
    mass: 0.38,
    colliders: 'hull',
  },
  'beer-bottle-1': {
    Component: BeerBottle1,
    InstanceComponent: BeerBottle1Instance,
    InstancesComponent: BeerBottle1Instances,
    scale: 1,
    mass: 0.32,
    colliders: 'hull',
  },
  'beer-bottle-2': {
    Component: BeerBottle2,
    InstanceComponent: BeerBottle2Instance,
    InstancesComponent: BeerBottle2Instances,
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  bucket: {
    Component: Bucket,
    InstanceComponent: BucketInstance,
    InstancesComponent: BucketInstances,
    scale: 1.4,
    mass: 0.6,
    colliders: 'hull',
  },
  'happy-meal': {
    Component: HappyMeal,
    InstanceComponent: HappyMealInstance,
    InstancesComponent: HappyMealInstances,
    scale: 1,
    mass: 0.24,
    colliders: 'hull',
  },
  'mc-cup': {
    Component: McCup,
    InstanceComponent: McCupInstance,
    InstancesComponent: McCupInstances,
    scale: 0.1,
    mass: 0.26,
    colliders: 'hull',
  },
};

function createTrashAsset(key, overrides = {}) {
  const assetConfig = TRASH_ASSET_CONFIGS[key];

  if (!assetConfig) {
    throw new Error(`Unknown trash asset: ${key}`);
  }

  return {
    key,
    ...assetConfig,
    ...overrides,
  };
}

export const SHOT_ASSET_OPTIONS = [
  createTrashAsset('garbage-bag'),
  createTrashAsset('garbage-bag-1'),
  createTrashAsset('cardboard-box-1'),
  createTrashAsset('cardboard-box-2'),
  createTrashAsset('cardboard-box-3'),
  createTrashAsset('starbucks-cup'),
  createTrashAsset('vhs-tape'),
  createTrashAsset('cassette-tape-1'),
  createTrashAsset('cassette-tape-2'),
  createTrashAsset('cassette-tape-3'),
  createTrashAsset('floppy-disk'),
  createTrashAsset('apple-core'),
  createTrashAsset('cardboard-box-4'),
  createTrashAsset('cardboard-box-5'),
  createTrashAsset('beer-case-1'),
  createTrashAsset('beer-case-2'),
  createTrashAsset('whiskey-bottle'),
  createTrashAsset('beer-bottle-1'),
  createTrashAsset('beer-bottle-2'),
  createTrashAsset('bucket'),
  createTrashAsset('happy-meal'),
  createTrashAsset('mc-cup'),
];

export function getRandomShotAsset(random = Math.random) {
  return SHOT_ASSET_OPTIONS[Math.floor(random() * SHOT_ASSET_OPTIONS.length)];
}

export const FIXED_SCENE_ITEMS = [
  {
    key: 'dumpster',
    Component: Dumpster,
    PhysicsComponent: ArticulatedDumpster,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 2,
    colliders: 'trimesh',
    componentProps: {
      rightLidRotation: -radians(521),
      leftLidRotation: -radians(521),
    },
  },
  {
    key: 'garbage-bags-pile',
    Component: GarbageBagsPile,
    position: [0, 1, 0.1],
    rotation: [0, 0, 0],
    scale: 0.65,
    colliders: 'hull',
  },
  {
    key: 'garbage-bags-2',
    Component: GarbageBags2,
    position: [-1, 2, 0.1],
    rotation: [0, 0, 0],
    scale: 0.8,
    colliders: 'hull',
  },
  {
    key: 'litter',
    Component: Litter,
    position: [1, 0, 1],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'litter-2',
    Component: Litter2,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'litter',
    Component: Litter,
    position: [-2, 0, 0.8],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'cardboard-flat',
    Component: CardboardFlat,
    position: [-2, 0, 1],
    rotation: [0, 90, 0],
    scale: 1,
  },
  {
    key: 'newspaper-1',
    Component: NewsPaper1,
    position: [-1, 0, 1.4],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.02,
  },
  {
    key: 'vhs-tape',
    Component: LowPolyVHSTape,
    position: [0.8, 0.03, 1.45],
    rotation: [Math.PI / 2, Math.PI, -Math.PI / 9],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cassette-tape-1',
    Component: LowPolyCassetteTape1,
    position: [-0.2, 0.03, 1.6],
    rotation: [Math.PI / 2, Math.PI, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cassette-tape-2',
    Component: LowPolyCassetteTape2,
    position: [1.85, 0.03, 1.9],
    rotation: [Math.PI / 2, -Math.PI, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cassette-tape-3',
    Component: LowPolyCassetteTape3,
    position: [4.1, 0.03, 1.45],
    rotation: [Math.PI / 2.2, Math.PI, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'floppy-disk',
    Component: LowPolyFloppyDisk,
    position: [-1.35, 0.03, 2.05],
    rotation: [Math.PI / 2, -Math.PI, Math.PI / 7],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'litter-2',
    Component: Litter2,
    position: [-3.5, 0, 1],
    rotation: [0, -Math.PI / 3, 0],
    scale: 1,
  },
  {
    key: 'garbage-bags-1',
    Component: GarbageBags1,
    position: [-2.7, 0, 0],
    rotation: [0, 90, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [-2.2, 0.35, 1.2],
    rotation: [0, 90, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.2, 0.15, 1.2],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.75, 0.15, 1.2],
    rotation: [0, Math.PI / 1.7, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.45, 0.45, 1.2],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'newspaper-2',
    Component: NewsPaper2,
    position: [-5, 0, 2],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.02,
  },
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [0, 0, 1.7],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 0.75,
    showcaseYOffset: 0.02,
  },
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [0.7, 0, 1.2],
    rotation: [0, Math.PI / 2.5, 0],
    scale: 0.75,
  },
  {
    key: 'newspaper-stack',
    Component: NewspaperStack,
    position: [-1.5, 0.1, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 1.25,
    colliders: 'hull',
  },
  {
    key: 'cardboard-flat-2',
    Component: CardboardFlat2,
    position: [2.4, 0, 0.75],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-3',
    Component: CardboardBox3,
    position: [2, 0.18, 1.55],
    rotation: [0, -Math.PI / 2, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [1.4, 0.16, 1.3],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-leaning-2',
    Component: CardboardLeaning2,
    position: [2.17, 0.25, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'litter',
    Component: Litter,
    position: [3, 0, 0.8],
    rotation: [0, -Math.PI / 4, 0],
    scale: 1,
  },
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [3, 0, 1.6],
    rotation: [0, Math.PI, 0],
    scale: 0.75,
  },
  {
    key: 'garbage-bags-2',
    Component: GarbageBags2,
    position: [2.5, 0, 0],
    rotation: [0, -Math.PI / 1.3, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-2',
    Component: CardboardBox2,
    position: [3.1, 0.2, 0.35],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [3.1, 0.4, -0.75],
    rotation: [0, Math.PI / 7, 0],
    scale: 1,
    colliders: 'hull',
  },
  {
    key: 'newspaper-stack',
    Component: NewspaperStack,
    position: [2.6, 0.1, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 1.25,
    colliders: 'hull',
  },
  {
    key: 'newspaper-3',
    Component: NewsPaper3,
    position: [4.5, 0, 1.2],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.02,
  },
];

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
  createTrashAsset('bucket', {
    id: 'front-bucket',
    position: [0.95, 0.4, 2.35],
    rotation: [0, -Math.PI / 8, 0],
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
