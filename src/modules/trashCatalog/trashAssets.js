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
} from '@elements/GarbageBags/GarbageBags';
import {
  HappyMeal,
  HappyMealInstance,
  HappyMealInstances,
} from '@elements/HappyMeal/HappyMeal';
import { McCup, McCupInstance, McCupInstances } from '@elements/McCup/McCup';
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

export const TRASH_ASSET_CONFIGS = {
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
  'soda-can': {
    Component: SodaCan,
    InstanceComponent: SodaCanInstance,
    InstancesComponent: SodaCanInstances,
    scale: 0.048,
    mass: 0.24,
    colliders: 'hull',
  },
  snickers: {
    Component: Snickers,
    InstanceComponent: SnickersInstance,
    InstancesComponent: SnickersInstances,
    scale: 0.088,
    mass: 0.18,
    colliders: 'hull',
  },
  catfood: {
    Component: Catfood,
    InstanceComponent: CatfoodInstance,
    InstancesComponent: CatfoodInstances,
    scale: 0.06,
    mass: 0.3,
    colliders: 'hull',
  },
};

export function createTrashAsset(key, overrides = {}) {
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
  createTrashAsset('soda-can'),
  createTrashAsset('snickers'),
  createTrashAsset('catfood'),
];

export function getRandomShotAsset(random = Math.random) {
  return SHOT_ASSET_OPTIONS[Math.floor(random() * SHOT_ASSET_OPTIONS.length)];
}
