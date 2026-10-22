import { AppleCore } from '@elements/AppleCore/AppleCore';
import {
  BeerBottle1,
  BeerBottle2,
  WhiskeyBottle,
} from '@elements/Bottles/Bottles';
import { Bucket } from '@elements/Bucket/Bucket';
import {
  BeerCase1,
  BeerCase2,
  CardboardBox1,
  CardboardBox2,
  CardboardBox3,
  CardboardBox4,
  CardboardBox5,
} from '@elements/CardboardBoxes/CardboardBoxes';
import { LowPolyCassetteTape1 } from '@elements/CassetteTape/LowPolyCassetteTape1';
import { LowPolyCassetteTape2 } from '@elements/CassetteTape/LowPolyCassetteTape2';
import { LowPolyCassetteTape3 } from '@elements/CassetteTape/LowPolyCassetteTape3';
import { Catfood } from '@elements/Catfood/Catfood';
import { LowPolyFloppyDisk } from '@elements/FloppyDisk/LowPolyFloppyDisk';
import { GarbageBag, GarbageBag1 } from '@elements/GarbageBags/GarbageBags';
import { HappyMeal } from '@elements/HappyMeal/HappyMeal';
import { McCup } from '@elements/McCup/McCup';
import { Snickers } from '@elements/Snickers/Snickers';
import { SodaCan } from '@elements/SodaCan/SodaCan';
import { StarbucksCup } from '@elements/StarbucksCup/StarbucksCup';
import { LowPolyVHSTape } from '@elements/VhsTape/LowPolyVHSTape';

export const TRASH_ASSET_CONFIGS = {
  'garbage-bag': {
    Component: GarbageBag,
    scale: 0.75,
    mass: 0.45,
    colliders: 'hull',
  },
  'garbage-bag-1': {
    Component: GarbageBag1,
    scale: 0.8,
    mass: 0.5,
    colliders: 'hull',
  },
  'cardboard-box-1': {
    Component: CardboardBox1,
    scale: 1,
    mass: 0.7,
    colliders: 'hull',
  },
  'cardboard-box-2': {
    Component: CardboardBox2,
    scale: 1,
    mass: 0.75,
    colliders: 'hull',
  },
  'cardboard-box-3': {
    Component: CardboardBox3,
    scale: 1,
    mass: 0.8,
    colliders: 'hull',
  },
  'starbucks-cup': {
    Component: StarbucksCup,
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  'vhs-tape': {
    Component: LowPolyVHSTape,
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  'cassette-tape-1': {
    Component: LowPolyCassetteTape1,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'cassette-tape-2': {
    Component: LowPolyCassetteTape2,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'cassette-tape-3': {
    Component: LowPolyCassetteTape3,
    scale: 1,
    mass: 0.22,
    colliders: 'hull',
  },
  'floppy-disk': {
    Component: LowPolyFloppyDisk,
    scale: 1,
    mass: 0.2,
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
    colliders: 'hull',
  },
  'cardboard-box-5': {
    Component: CardboardBox5,
    scale: 1,
    mass: 0.9,
    colliders: 'hull',
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
    colliders: 'hull',
  },
  'mc-cup': {
    Component: McCup,
    scale: 0.1,
    mass: 0.26,
    colliders: 'hull',
  },
  'soda-can': {
    Component: SodaCan,
    scale: 0.048,
    mass: 0.24,
    colliders: 'hull',
  },
  snickers: {
    Component: Snickers,
    scale: 0.088,
    mass: 0.18,
    colliders: 'hull',
  },
  catfood: {
    Component: Catfood,
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
