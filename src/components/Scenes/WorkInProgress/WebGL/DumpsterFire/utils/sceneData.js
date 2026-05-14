import { radians } from '../../../../../../utils/math';
import AppleCore from '../../../../../elements/appleCore/AppleCore';
import {
  BeerBottle1,
  BeerBottle2,
  WhiskeyBottle,
} from '../../../../../elements/bottles/Bottles';
import Bucket from '../../../../../elements/bucket/Bucket';
import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '../../../../../elements/cardboard/Cardboard';
import {
  BeerCase1,
  BeerCase2,
  CardboardBox1,
  CardboardBox2,
  CardboardBox3,
  CardboardBox4,
  CardboardBox5,
} from '../../../../../elements/cardboardBoxes/CardboardBoxes';
import CigaretteButts from '../../../../../elements/cigaretteButts/CigaretteButts';
import Dumpster from '../../../../../elements/dumpster/Dumpster';
import {
  GarbageBag,
  GarbageBag1,
  GarbageBags1,
  GarbageBags2,
  GarbageBagsPile,
} from '../../../../../elements/garbageBags/GarbageBags';
import HappyMeal from '../../../../../elements/happyMeal/HappyMeal';
import { Litter, Litter2 } from '../../../../../elements/litter/Litter';
import McCup from '../../../../../elements/mcCup/McCup';
import NewspaperStack from '../../../../../elements/newsPaperStack/NewsPaperStack';
import {
  NewsPaper1,
  NewsPaper2,
  NewsPaper3,
} from '../../../../../elements/newsPapers/NewsPapers';
import StarbucksCup from '../../../../../elements/starbucksCup/StarbucksCup';

const GARBAGE_BAG_MATERIAL_PROPS = {
  color: '#050505',
  roughness: 0.258,
  metalness: 0,
  specularIntensity: 1,
  ior: 1.45,
};

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
  fov: 40,
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
export const SHOT_POOL_SLOTS_PER_ASSET = 10;
export const SHOT_AIM_PLANE_POINT = [
  SCENE_ROOT_POSITION[0],
  GROUND_Y + 1.5,
  SCENE_ROOT_POSITION[2] + 0.5,
];

export const FIRE_LOOP_TRACK = 'looped-fire.mp3';
export const FIRE_LOOP_VOLUME = 0.35;

export const ASSET_GRID_COLUMNS = 6;
export const ASSET_GRID_COLUMN_SPACING = 2.2;
export const ASSET_GRID_ROW_SPACING = 3.05;
export const ASSET_GRID_POSITION = [4.75, GROUND_Y, 2.2];
export const ASSET_GRID_LABEL_HEIGHT = 1.6;

const TRASH_ASSET_CONFIGS = {
  'garbage-bag': {
    Component: GarbageBag,
    scale: 0.75,
    mass: 0.45,
  },
  'garbage-bag-1': {
    Component: GarbageBag1,
    scale: 0.8,
    mass: 0.5,
  },
  'cardboard-box-1': {
    Component: CardboardBox1,
    scale: 1,
    mass: 0.7,
  },
  'cardboard-box-2': {
    Component: CardboardBox2,
    scale: 1,
    mass: 0.75,
  },
  'cardboard-box-3': {
    Component: CardboardBox3,
    scale: 1,
    mass: 0.8,
  },
  'starbucks-cup': {
    Component: StarbucksCup,
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  'apple-core': {
    Component: AppleCore,
    scale: 1,
    mass: 0.18,
    colliders: 'hull',
  },
  'cardboard-box-4': {
    Component: CardboardBox4,
    scale: 1,
    mass: 0.85,
  },
  'cardboard-box-5': {
    Component: CardboardBox5,
    scale: 1,
    mass: 0.9,
  },
  'beer-case-1': {
    Component: BeerCase1,
    scale: 1,
    mass: 1.1,
  },
  'beer-case-2': {
    Component: BeerCase2,
    scale: 1,
    mass: 1.15,
  },
  'whiskey-bottle': {
    Component: WhiskeyBottle,
    scale: 1,
    mass: 0.38,
    colliders: 'hull',
  },
  'beer-bottle-1': {
    Component: BeerBottle1,
    scale: 1,
    mass: 0.32,
    colliders: 'hull',
  },
  'beer-bottle-2': {
    Component: BeerBottle2,
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  bucket: {
    Component: Bucket,
    scale: 1.4,
    mass: 0.6,
    colliders: 'hull',
  },
  'happy-meal': {
    Component: HappyMeal,
    scale: 1,
    mass: 0.24,
  },
  'mc-cup': {
    Component: McCup,
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
  },
  {
    key: 'garbage-bags-2',
    Component: GarbageBags2,
    position: [-1, 2, 0.1],
    rotation: [0, 0, 0],
    scale: 0.8,
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
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [-2.2, 0.35, 1.2],
    rotation: [0, 90, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.2, 0.15, 1.2],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.75, 0.15, 1.2],
    rotation: [0, Math.PI / 1.7, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.45, 0.45, 1.2],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
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
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [1.4, 0.16, 1.3],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
  },
  {
    key: 'cardboard-leaning-2',
    Component: CardboardLeaning2,
    position: [2.17, 0.25, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
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
  },
  {
    key: 'cardboard-box-2',
    Component: CardboardBox2,
    position: [3.1, 0.2, 0.35],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [3.1, 0.4, -0.75],
    rotation: [0, Math.PI / 7, 0],
    scale: 1,
  },
  {
    key: 'newspaper-stack',
    Component: NewspaperStack,
    position: [2.6, 0.1, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 1.25,
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
    position: [0.95, 0.02, 2.35],
    rotation: [0, -Math.PI / 8, 0],
  }),
];

export const INSTANCED_TRASH_ASSET_DEFS = {
  'garbage-bag': {
    modelPath: '/garbage_bag.glb',
    geometryName: 'Obj_Bags_5_asset__0',
    customMaterialProps: GARBAGE_BAG_MATERIAL_PROPS,
    transformChain: [{ scale: 0.01 }],
  },
  'garbage-bag-1': {
    modelPath: '/garbage_bag_1.glb',
    geometryName: 'Obj_Bags_4_asset__0',
    customMaterialProps: GARBAGE_BAG_MATERIAL_PROPS,
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-1': {
    modelPath: '/cardboardbox1.glb',
    geometryName: 'cardboard_box_1',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-2': {
    modelPath: '/cardboardbox2.glb',
    geometryName: 'cardboard_box_2',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-3': {
    modelPath: '/cardboardbox3.glb',
    geometryName: 'cardboard_box_3',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'starbucks-cup': {
    modelPath: '/starbucks.glb',
    geometryName: 'starbuckscup2_0',
    materialName: 'starbuckscup2_0_mat',
    transformChain: [
      { rotation: [-Math.PI / 2, 0, 0], scale: 0.05 },
      { position: [0, 0, 6.705], rotation: [0, 0, -0.351], scale: 0.13 },
    ],
  },
  'apple-core': {
    modelPath: '/apple_core.glb',
    geometryName: 'AppleCore001',
    materialName: 'AppleCore.001_mat',
    transformChain: [{ rotation: [-Math.PI / 2, 0, 0], scale: 0.1 }],
  },
  'cardboard-box-4': {
    modelPath: '/cardboardBox4.glb',
    geometryName: 'Object_122',
    materialName: 'sm36_002_Cardboard01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.01 }],
  },
  'cardboard-box-5': {
    modelPath: '/cardboardBox5.glb',
    geometryName: 'Object_124',
    materialName: 'sm36_004_Cardboard03A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.05], scale: 0.019 }],
  },
  'beer-case-1': {
    modelPath: '/beerCase1.glb',
    geometryName: 'Object_118',
    materialName: 'sm32_143_BeerCase01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.016], scale: 0.01 }],
  },
  'beer-case-2': {
    modelPath: '/beerCase2.glb',
    geometryName: 'Object_116',
    materialName: 'sm32_128_BeerCase01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.016], scale: 0.01 }],
  },
  'whiskey-bottle': {
    modelPath: '/whiskeyBottle.glb',
    geometryName: 'Object_114001',
    materialName: 'sm32_163_DrinkBottle02A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.013 }],
  },
  'beer-bottle-1': {
    modelPath: '/beerBottle1.glb',
    geometryName: 'Object_138',
    materialName: 'sm32_159_DrinkBottle01A_A_Mat.001',
    transformChain: [{ rotation: [Math.PI / 2, 0, -Math.PI / 2], scale: 0.02 }],
  },
  'beer-bottle-2': {
    modelPath: '/beerBottle2.glb',
    geometryName: 'Object_140',
    materialName: 'sm32_159_DrinkBottle01A_A_Mat.002',
    transformChain: [
      { rotation: [Math.PI / 2, 0, -Math.PI / 2], scale: 0.018 },
    ],
  },
  bucket: {
    modelPath: '/bucket.glb',
    geometryName: 'Object_142',
    materialName: 'sm30_072_PlasticBucket01A_A',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.015 }],
  },
  'happy-meal': {
    modelPath: '/happyMeal.glb',
    geometryName: 'Object_3',
    materialName: 'Material.001',
    transformChain: [
      { scale: 0.35 },
      { position: [0, 1.774, 0], rotation: [-Math.PI / 2, 0, 0] },
    ],
  },
  'mc-cup': {
    modelPath: '/mcCup.glb',
    geometryName: 'Cup',
    materialName: 'Material',
    transformChain: [
      { scale: 0.01 },
      { position: [0, 263.293, 0], rotation: [-Math.PI / 2, 0, 0], scale: 100 },
    ],
  },
};

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

export const ASSET_GRID_OPTIONS = collectUniqueGridAssets(
  FIXED_SCENE_ITEMS,
  DYNAMIC_SCENE_ITEMS,
  SHOT_ASSET_OPTIONS
).map((asset) => ({
  ...asset,
  showcaseYOffset: asset.showcaseYOffset ?? 0,
}));
