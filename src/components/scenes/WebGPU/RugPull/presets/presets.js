// Keys match the Leva schema generated from @modules/rugPull's
// renderOptions.mjs 1:1, plus the camera rig's orbit keys per mode.
import { sceneDefaults } from '@modules/rugPull';

import { MODE_CAMERA } from '../utils/camera';

export const DEFAULT_PRESET = 'Tabriz Medallion';

const BASE = sceneDefaults();
const FLOOR = { ...BASE, ...MODE_CAMERA.floor, rugMode: 'floor' };
const WALL = { ...BASE, ...MODE_CAMERA.wall, rugMode: 'wall' };

const HOUSE = {
  weightArgyle: 1,
  weightReversal: 1,
  weightTurboflex: 1,
};

export const PRESETS = {
  'Tabriz Medallion': {
    ...FLOOR,
    design: 'city',
    palette: 'tabriz',
    rugSeed: 7,
    knotsAcross: 220,
    rumple: 0.3,
  },
  'Heriz By The Couch': {
    ...FLOOR,
    design: 'village',
    palette: 'heriz',
    rugSeed: 412,
    knotsAcross: 120,
    borderMotif: 'hookedDiamonds',
    cornerFlip: 0.22,
    wear: 0.35,
  },
  'Qashqai Wall Hanging': {
    ...WALL,
    design: 'tribal',
    palette: 'qashqai',
    rugSeed: 9031,
    knotsAcross: 104,
    rugAspect: 1.55,
    hangStyle: 'clips',
    clipCount: 6,
    abrash: 0.6,
  },
  'Turkmen Guls': {
    ...FLOOR,
    design: 'gul',
    palette: 'turkmen',
    rugSeed: 55,
    knotsAcross: 130,
    rugAspect: 1.4,
  },
  'Herati Runner': {
    ...FLOOR,
    design: 'herati',
    palette: 'kashan',
    rugSeed: 3,
    knotsAcross: 150,
    rugAspect: 2.8,
    rugWidth: 1,
  },
  'Prayer Rug': {
    ...WALL,
    design: 'prayer',
    palette: 'kerman',
    rugSeed: 21,
    knotsAcross: 160,
    rugAspect: 1.5,
    rugWidth: 1.2,
  },
  'Garden Of Paradise': {
    ...FLOOR,
    design: 'garden',
    palette: 'ziegler',
    rugSeed: 1717,
    knotsAcross: 150,
  },
  'Tree Of Life': {
    ...WALL,
    design: 'tree',
    palette: 'isfahan',
    rugSeed: 88,
    knotsAcross: 190,
    hangStyle: 'rod',
  },
  'Argyle Harlequin': {
    ...FLOOR,
    ...HOUSE,
    design: 'harlequin',
    palette: 'loader',
    rugSeed: 140,
    knotsAcross: 140,
    mineField: 0.3,
    mineGuard: 0.6,
    mineSignature: 1,
  },
  'House Medallion': {
    ...FLOOR,
    ...HOUSE,
    design: 'city',
    palette: 'tabriz',
    rugSeed: 3141,
    knotsAcross: 240,
    mineMedallion: 1,
    mineBorder: 1,
    weightArgyle: 0,
    weightTurboflex: 0,
  },
  'Turboflex Tapestry': {
    ...WALL,
    ...HOUSE,
    design: 'city',
    palette: 'turboflex',
    rugSeed: 2600,
    knotsAcross: 260,
    mineMedallion: 1,
    mineField: 0.15,
    mineSignature: 1,
    weightArgyle: 0.3,
    weightReversal: 0.3,
    hangStyle: 'clips',
  },
};

// Saved from RugPullCLI: only what differs from the scene defaults.
const SNAPSHOTS = {};

Object.entries(SNAPSHOTS).forEach(([name, snapshot]) => {
  PRESETS[name] = { ...FLOOR, ...snapshot };
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
