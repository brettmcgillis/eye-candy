import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '@elements/Cardboard/Cardboard';
import {
  CardboardBox1,
  CardboardBox2,
  CardboardBox3,
} from '@elements/CardboardBoxes/CardboardBoxes';
import { LowPolyCassetteTape1 } from '@elements/CassetteTape/LowPolyCassetteTape1';
import { LowPolyCassetteTape2 } from '@elements/CassetteTape/LowPolyCassetteTape2';
import { LowPolyCassetteTape3 } from '@elements/CassetteTape/LowPolyCassetteTape3';
import CigaretteButts from '@elements/CigaretteButts/CigaretteButts';
import Dumpster from '@elements/Dumpster/Dumpster';
import { LowPolyFloppyDisk } from '@elements/FloppyDisk/LowPolyFloppyDisk';
import {
  GarbageBags1,
  GarbageBags2,
  GarbageBagsPile,
} from '@elements/GarbageBags/GarbageBags';
import { Litter, Litter2 } from '@elements/Litter/Litter';
import NewspaperStack from '@elements/NewsPaperStack/NewsPaperStack';
import {
  NewsPaper1,
  NewsPaper2,
  NewsPaper3,
} from '@elements/NewsPapers/NewsPapers';
import PersianRug from '@elements/PersianRug/PersianRug';
import { LowPolyVHSTape } from '@elements/VhsTape/LowPolyVHSTape';

export const SCENE_PROP_CONFIGS = {
  dumpster: {
    Component: Dumpster,
    scale: 2,
    colliders: 'trimesh',
  },
  'persian-rug': {
    Component: PersianRug,
    colliders: false,
  },
  'garbage-bags-pile': {
    Component: GarbageBagsPile,
    scale: 0.65,
    colliders: 'hull',
  },
  'garbage-bags-2': {
    Component: GarbageBags2,
    scale: 0.8,
    colliders: 'hull',
  },
  litter: {
    Component: Litter,
    scale: 1,
  },
  'litter-2': {
    Component: Litter2,
    scale: 1,
  },
  'cardboard-flat': {
    Component: CardboardFlat,
    scale: 1,
  },
  'newspaper-1': {
    Component: NewsPaper1,
    scale: 1,
    showcaseYOffset: 0.02,
  },
  'vhs-tape': {
    Component: LowPolyVHSTape,
    scale: 1,
    colliders: 'hull',
  },
  'cassette-tape-1': {
    Component: LowPolyCassetteTape1,
    scale: 1,
    colliders: 'hull',
  },
  'cassette-tape-2': {
    Component: LowPolyCassetteTape2,
    scale: 1,
    colliders: 'hull',
  },
  'cassette-tape-3': {
    Component: LowPolyCassetteTape3,
    scale: 1,
    colliders: 'hull',
  },
  'floppy-disk': {
    Component: LowPolyFloppyDisk,
    scale: 1,
    colliders: 'hull',
  },
  'garbage-bags-1': {
    Component: GarbageBags1,
    scale: 1,
    colliders: 'hull',
  },
  'cardboard-box': {
    Component: CardboardBox,
    scale: 1,
    colliders: 'hull',
  },
  'cardboard-box-1': {
    Component: CardboardBox1,
    scale: 1,
    colliders: 'hull',
  },
  'newspaper-2': {
    Component: NewsPaper2,
    scale: 1,
    showcaseYOffset: 0.02,
  },
  'cigarette-butts': {
    Component: CigaretteButts,
    scale: 0.75,
  },
  'newspaper-stack': {
    Component: NewspaperStack,
    scale: 1.25,
    colliders: 'hull',
  },
  'cardboard-flat-2': {
    Component: CardboardFlat2,
    scale: 1,
  },
  'cardboard-box-3': {
    Component: CardboardBox3,
    scale: 1,
    colliders: 'hull',
  },
  'cardboard-leaning-2': {
    Component: CardboardLeaning2,
    scale: 1,
    colliders: 'hull',
  },
  'cardboard-box-2': {
    Component: CardboardBox2,
    scale: 1,
    colliders: 'hull',
  },
  'newspaper-3': {
    Component: NewsPaper3,
    scale: 1,
    showcaseYOffset: 0.02,
  },
};

export function createPropAsset(key, overrides = {}) {
  const config = SCENE_PROP_CONFIGS[key];

  if (!config) {
    throw new Error(`Unknown scene prop asset: ${key}`);
  }

  return { key, ...config, ...overrides };
}
