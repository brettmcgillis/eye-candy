// The trash the scenes throw: one instanced pool per asset (drei's
// createInstances), kept apart from @modules/trashCatalog so the catalog's
// plain components stay drei-free for the headless render stages.
import {
  AppleCoreInstance,
  AppleCoreInstances,
} from '@elements/AppleCore/AppleCoreInstances';
import {
  BeerBottle1Instance,
  BeerBottle1Instances,
  BeerBottle2Instance,
  BeerBottle2Instances,
  WhiskeyBottleInstance,
  WhiskeyBottleInstances,
} from '@elements/Bottles/BottlesInstances';
import {
  BucketInstance,
  BucketInstances,
} from '@elements/Bucket/BucketInstances';
import {
  BeerCase1Instance,
  BeerCase1Instances,
  BeerCase2Instance,
  BeerCase2Instances,
  CardboardBox1Instance,
  CardboardBox1Instances,
  CardboardBox2Instance,
  CardboardBox2Instances,
  CardboardBox3Instance,
  CardboardBox3Instances,
  CardboardBox4Instance,
  CardboardBox4Instances,
  CardboardBox5Instance,
  CardboardBox5Instances,
} from '@elements/CardboardBoxes/CardboardBoxesInstances';
import {
  LowPolyCassetteTape1Instance,
  LowPolyCassetteTape1Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape1Instances';
import {
  LowPolyCassetteTape2Instance,
  LowPolyCassetteTape2Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape2Instances';
import {
  LowPolyCassetteTape3Instance,
  LowPolyCassetteTape3Instances,
} from '@elements/CassetteTape/LowPolyCassetteTape3Instances';
import {
  CatfoodInstance,
  CatfoodInstances,
} from '@elements/Catfood/CatfoodInstances';
import {
  LowPolyFloppyDiskInstance,
  LowPolyFloppyDiskInstances,
} from '@elements/FloppyDisk/LowPolyFloppyDiskInstances';
import {
  GarbageBag1Instance,
  GarbageBag1Instances,
  GarbageBagInstance,
  GarbageBagInstances,
} from '@elements/GarbageBags/GarbageBagsInstances';
import {
  HappyMealInstance,
  HappyMealInstances,
} from '@elements/HappyMeal/HappyMealInstances';
import { McCupInstance, McCupInstances } from '@elements/McCup/McCupInstances';
import {
  SnickersInstance,
  SnickersInstances,
} from '@elements/Snickers/SnickersInstances';
import {
  SodaCanInstance,
  SodaCanInstances,
} from '@elements/SodaCan/SodaCanInstances';
import {
  StarbucksCupInstance,
  StarbucksCupInstances,
} from '@elements/StarbucksCup/StarbucksCupInstances';
import {
  LowPolyVHSTapeInstance,
  LowPolyVHSTapeInstances,
} from '@elements/VhsTape/LowPolyVHSTapeInstances';
import { createTrashAsset } from '@modules/trashCatalog';

const INSTANCE_COMPONENTS = {
  'garbage-bag': {
    InstanceComponent: GarbageBagInstance,
    InstancesComponent: GarbageBagInstances,
  },
  'garbage-bag-1': {
    InstanceComponent: GarbageBag1Instance,
    InstancesComponent: GarbageBag1Instances,
  },
  'cardboard-box-1': {
    InstanceComponent: CardboardBox1Instance,
    InstancesComponent: CardboardBox1Instances,
  },
  'cardboard-box-2': {
    InstanceComponent: CardboardBox2Instance,
    InstancesComponent: CardboardBox2Instances,
  },
  'cardboard-box-3': {
    InstanceComponent: CardboardBox3Instance,
    InstancesComponent: CardboardBox3Instances,
  },
  'starbucks-cup': {
    InstanceComponent: StarbucksCupInstance,
    InstancesComponent: StarbucksCupInstances,
  },
  'vhs-tape': {
    InstanceComponent: LowPolyVHSTapeInstance,
    InstancesComponent: LowPolyVHSTapeInstances,
  },
  'cassette-tape-1': {
    InstanceComponent: LowPolyCassetteTape1Instance,
    InstancesComponent: LowPolyCassetteTape1Instances,
  },
  'cassette-tape-2': {
    InstanceComponent: LowPolyCassetteTape2Instance,
    InstancesComponent: LowPolyCassetteTape2Instances,
  },
  'cassette-tape-3': {
    InstanceComponent: LowPolyCassetteTape3Instance,
    InstancesComponent: LowPolyCassetteTape3Instances,
  },
  'floppy-disk': {
    InstanceComponent: LowPolyFloppyDiskInstance,
    InstancesComponent: LowPolyFloppyDiskInstances,
  },
  'apple-core': {
    InstanceComponent: AppleCoreInstance,
    InstancesComponent: AppleCoreInstances,
  },
  'cardboard-box-4': {
    InstanceComponent: CardboardBox4Instance,
    InstancesComponent: CardboardBox4Instances,
  },
  'cardboard-box-5': {
    InstanceComponent: CardboardBox5Instance,
    InstancesComponent: CardboardBox5Instances,
  },
  'beer-case-1': {
    InstanceComponent: BeerCase1Instance,
    InstancesComponent: BeerCase1Instances,
  },
  'beer-case-2': {
    InstanceComponent: BeerCase2Instance,
    InstancesComponent: BeerCase2Instances,
  },
  'whiskey-bottle': {
    InstanceComponent: WhiskeyBottleInstance,
    InstancesComponent: WhiskeyBottleInstances,
  },
  'beer-bottle-1': {
    InstanceComponent: BeerBottle1Instance,
    InstancesComponent: BeerBottle1Instances,
  },
  'beer-bottle-2': {
    InstanceComponent: BeerBottle2Instance,
    InstancesComponent: BeerBottle2Instances,
  },
  bucket: {
    InstanceComponent: BucketInstance,
    InstancesComponent: BucketInstances,
  },
  'happy-meal': {
    InstanceComponent: HappyMealInstance,
    InstancesComponent: HappyMealInstances,
  },
  'mc-cup': {
    InstanceComponent: McCupInstance,
    InstancesComponent: McCupInstances,
  },
  'soda-can': {
    InstanceComponent: SodaCanInstance,
    InstancesComponent: SodaCanInstances,
  },
  snickers: {
    InstanceComponent: SnickersInstance,
    InstancesComponent: SnickersInstances,
  },
  catfood: {
    InstanceComponent: CatfoodInstance,
    InstancesComponent: CatfoodInstances,
  },
};

export const SHOT_ASSET_OPTIONS = [
  'garbage-bag',
  'garbage-bag-1',
  'cardboard-box-1',
  'cardboard-box-2',
  'cardboard-box-3',
  'starbucks-cup',
  'vhs-tape',
  'cassette-tape-1',
  'cassette-tape-2',
  'cassette-tape-3',
  'floppy-disk',
  'apple-core',
  'cardboard-box-4',
  'cardboard-box-5',
  'beer-case-1',
  'beer-case-2',
  'whiskey-bottle',
  'beer-bottle-1',
  'beer-bottle-2',
  'bucket',
  'happy-meal',
  'mc-cup',
  'soda-can',
  'snickers',
  'catfood',
].map((key) => createTrashAsset(key, INSTANCE_COMPONENTS[key]));

export function getRandomShotAsset(random = Math.random) {
  return SHOT_ASSET_OPTIONS[Math.floor(random() * SHOT_ASSET_OPTIONS.length)];
}
