export const DUMPSTER_FIRE_THROW_WHOOSH = {
  sources: [
    'dumpsterfire/whoosh1.mp3',
    'dumpsterfire/whoosh2.mp3',
    'dumpsterfire/whoosh3.mp3',
    'dumpsterfire/whoosh4.mp3',
    'dumpsterfire/whoosh5.mp3',
  ],
  volumeRange: [0.12, 0.2],
  rateRange: [0.9, 1.12],
  cooldownMs: 55,
  pool: 6,
};

export const DUMPSTER_FIRE_COLLISION_AUDIO_DEFAULTS = {
  minImpactSpeed: 2.1,
  cooldownMs: 180,
  volumeRange: [0.2, 0.34],
  rateRange: [0.94, 1.05],
};

export const DUMPSTER_FIRE_COLLISION_AUDIO_GROUPS = {
  appleCore: {
    sources: ['dumpsterfire/appleCore.mp3'],
    volumeRange: [0.22, 0.32],
    rateRange: [0.96, 1.04],
    minImpactSpeed: 1.85,
    cooldownMs: 170,
  },
  bucket: {
    sources: [
      'dumpsterfire/bucket_drop1.mp3',
      'dumpsterfire/bucket_drop2.mp3',
      'dumpsterfire/bucket_drop3.mp3',
    ],
    volumeRange: [0.24, 0.4],
    rateRange: [0.94, 1.04],
    minImpactSpeed: 2.4,
    cooldownMs: 200,
  },
  cardboard: {
    source: 'dumpsterfire/cardboardBoxDropSprites.mp3',
    sprites: {
      cardboardBoxDrop1: [1040, 280],
      cardboardBoxDrop2: [3440, 390],
      cardboardBoxDrop3: [5980, 500],
      cardboardBoxDrop4: [8420, 620],
      cardboardBoxDrop5: [11820, 760],
    },
    clipKeys: [
      'cardboardBoxDrop1',
      'cardboardBoxDrop2',
      'cardboardBoxDrop3',
      'cardboardBoxDrop4',
      'cardboardBoxDrop5',
    ],
    volumeRange: [0.18, 0.3],
    rateRange: [0.95, 1.04],
    minImpactSpeed: 2.25,
    cooldownMs: 220,
  },
  glass: {
    sources: [
      'dumpsterfire/glassBottleDrop.mp3',
      'dumpsterfire/glassBottleDrop2.mp3',
      'dumpsterfire/glassBottleDrop3.mp3',
    ],
    volumeRange: [0.26, 0.42],
    rateRange: [0.97, 1.03],
    minImpactSpeed: 2,
    cooldownMs: 220,
  },
  lightTrash: {
    sources: [
      'dumpsterfire/paperCupFalling.mp3',
      'dumpsterfire/paperCupFalling2.mp3',
    ],
    volumeRange: [0.16, 0.26],
    rateRange: [0.93, 1.06],
    minImpactSpeed: 2,
    cooldownMs: 160,
  },
  trashBag: {
    sources: ['dumpsterfire/trashbagFall.mp3'],
    volumeRange: [0.18, 0.28],
    rateRange: [0.96, 1.04],
    minImpactSpeed: 1.9,
    cooldownMs: 240,
  },
  cdCase: {
    source: 'dumpsterfire/cd_case_falling_sprites.mp3',
    sprites: {
      cdCaseFalling1: [855, 313],
      cdCaseFalling2: [2686, 384],
      cdCaseFalling3: [4438, 299],
      cdCaseFalling4: [6866, 302],
      cdCaseFalling5: [8684, 233],
      cdCaseFalling6: [10732, 255],
      cdCaseFalling7: [12890, 212],
      cdCaseFalling8: [14282, 280],
      cdCaseFalling9: [15777, 324],
      cdCaseFalling10: [17032, 349],
      cdCaseFalling11: [19404, 369],
    },
    clipKeys: [
      'cdCaseFalling1',
      'cdCaseFalling2',
      'cdCaseFalling3',
      'cdCaseFalling4',
      'cdCaseFalling5',
      'cdCaseFalling6',
      'cdCaseFalling7',
      'cdCaseFalling8',
      'cdCaseFalling9',
      'cdCaseFalling10',
      'cdCaseFalling11',
    ],
    volumeRange: [0.18, 0.3],
    rateRange: [0.95, 1.05],
    minImpactSpeed: 2.1,
    cooldownMs: 180,
  },
  emptyCan: {
    source: 'dumpsterfire/empty_can_sprites.mp3',
    sprites: {
      emptyCan1: [325, 1081],
      emptyCan2: [2011, 681],
      emptyCan3: [3697, 667],
      emptyCan4: [5307, 933],
    },
    clipKeys: ['emptyCan1', 'emptyCan2', 'emptyCan3', 'emptyCan4'],
    volumeRange: [0.2, 0.34],
    rateRange: [0.95, 1.06],
    minImpactSpeed: 2,
    cooldownMs: 180,
  },
  plasticWrapper: {
    source: 'dumpsterfire/plastic_wrapper_sprites.mp3',
    sprites: {
      plasticWrapper1: [354, 498],
      plasticWrapper2: [1352, 666],
      plasticWrapper3: [2331, 209],
      plasticWrapper4: [2742, 582],
      plasticWrapper5: [3805, 660],
      plasticWrapper6: [4906, 776],
      plasticWrapper7: [6090, 628],
      plasticWrapper8: [7663, 322],
      plasticWrapper9: [8356, 422],
      plasticWrapper10: [9583, 306],
      plasticWrapper11: [10363, 548],
      plasticWrapper12: [11527, 304],
      plasticWrapper13: [12417, 510],
      plasticWrapper14: [13481, 351],
      plasticWrapper15: [14600, 487],
    },
    clipKeys: [
      'plasticWrapper1',
      'plasticWrapper2',
      'plasticWrapper3',
      'plasticWrapper4',
      'plasticWrapper5',
      'plasticWrapper6',
      'plasticWrapper7',
      'plasticWrapper8',
      'plasticWrapper9',
      'plasticWrapper10',
      'plasticWrapper11',
      'plasticWrapper12',
      'plasticWrapper13',
      'plasticWrapper14',
      'plasticWrapper15',
    ],
    volumeRange: [0.14, 0.24],
    rateRange: [0.95, 1.06],
    minImpactSpeed: 1.8,
    cooldownMs: 150,
  },
  plasticDrop: {
    source: 'dumpsterfire/plastic-dropping-sprites.mp3',
    sprites: {
      plasticDropping1: [532, 710],
      plasticDropping2: [2864, 648],
      plasticDropping3: [5003, 591],
    },
    clipKeys: ['plasticDropping1', 'plasticDropping2', 'plasticDropping3'],
    volumeRange: [0.16, 0.28],
    rateRange: [0.94, 1.05],
    minImpactSpeed: 2,
    cooldownMs: 180,
  },
};

export const DUMPSTER_FIRE_COLLISION_AUDIO_BY_ASSET = {
  'garbage-bag': 'trashBag',
  'garbage-bag-1': 'trashBag',
  'cardboard-box-1': 'cardboard',
  'cardboard-box-2': 'cardboard',
  'cardboard-box-3': 'cardboard',
  'cardboard-box-4': 'cardboard',
  'cardboard-box-5': 'cardboard',
  'beer-case-1': 'cardboard',
  'beer-case-2': 'cardboard',
  'starbucks-cup': 'lightTrash',
  'vhs-tape': 'plasticDrop',
  'cassette-tape-1': 'cdCase',
  'cassette-tape-2': 'cdCase',
  'cassette-tape-3': 'cdCase',
  'floppy-disk': 'cdCase',
  'apple-core': 'appleCore',
  'whiskey-bottle': 'glass',
  'beer-bottle-1': 'glass',
  'beer-bottle-2': 'glass',
  bucket: 'bucket',
  'happy-meal': 'lightTrash',
  'mc-cup': 'lightTrash',
  'soda-can': 'emptyCan',
  catfood: 'emptyCan',
  snickers: 'plasticWrapper',
};

export function getTrashCollisionAudioGroupKey(assetKey) {
  if (typeof assetKey !== 'string') {
    return null;
  }

  const explicitGroupKey = DUMPSTER_FIRE_COLLISION_AUDIO_BY_ASSET[assetKey];

  if (explicitGroupKey) {
    return explicitGroupKey;
  }

  if (assetKey === 'bucket') {
    return 'bucket';
  }

  if (assetKey === 'apple-core') {
    return 'appleCore';
  }

  if (assetKey.includes('bottle')) {
    return 'glass';
  }

  if (assetKey.startsWith('garbage-bag')) {
    return 'trashBag';
  }

  if (assetKey.startsWith('cardboard') || assetKey.startsWith('beer-case')) {
    return 'cardboard';
  }

  if (assetKey.startsWith('cassette-tape') || assetKey === 'floppy-disk') {
    return 'cdCase';
  }

  if (assetKey === 'vhs-tape') {
    return 'plasticDrop';
  }

  if (assetKey === 'soda-can' || assetKey === 'catfood') {
    return 'emptyCan';
  }

  if (assetKey === 'snickers') {
    return 'plasticWrapper';
  }

  if (
    assetKey.startsWith('newspaper') ||
    assetKey.startsWith('litter') ||
    assetKey === 'cigarette-butts' ||
    assetKey.endsWith('-cup') ||
    assetKey === 'happy-meal'
  ) {
    return 'lightTrash';
  }

  return null;
}
