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
  'vhs-tape': 'lightTrash',
  'cassette-tape-1': 'lightTrash',
  'cassette-tape-2': 'lightTrash',
  'cassette-tape-3': 'lightTrash',
  'floppy-disk': 'lightTrash',
  'apple-core': 'appleCore',
  'whiskey-bottle': 'glass',
  'beer-bottle-1': 'glass',
  'beer-bottle-2': 'glass',
  bucket: 'bucket',
  'happy-meal': 'lightTrash',
  'mc-cup': 'lightTrash',
  'soda-can': 'lightTrash',
  snickers: 'lightTrash',
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

  if (
    assetKey.startsWith('newspaper') ||
    assetKey.startsWith('litter') ||
    assetKey === 'cigarette-butts' ||
    assetKey.endsWith('-cup') ||
    assetKey.startsWith('cassette-tape') ||
    assetKey === 'vhs-tape' ||
    assetKey === 'floppy-disk' ||
    assetKey === 'happy-meal'
  ) {
    return 'lightTrash';
  }

  return null;
}
