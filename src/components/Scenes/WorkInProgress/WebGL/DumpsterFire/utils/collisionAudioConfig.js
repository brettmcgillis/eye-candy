export const DUMPSTER_FIRE_COLLISION_AUDIO_DEFAULTS = {
  minImpactSpeed: 2.1,
  cooldownMs: 180,
  volumeRange: [0.2, 0.34],
  rateRange: [0.94, 1.05],
};

export const DUMPSTER_FIRE_COLLISION_AUDIO_GROUPS = {
  bucket: {
    sources: ['bucket_drop1.mp3', 'bucket_drop2.mp3', 'bucket_drop3.mp3'],
    volumeRange: [0.24, 0.4],
    rateRange: [0.94, 1.04],
    minImpactSpeed: 2.4,
    cooldownMs: 200,
  },
  cardboard: {
    source: 'cardboardBoxDropSprites.mp3',
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
      'glassBottleDrop.mp3',
      'glassBottleDrop2.mp3',
      'glassBottleDrop3.wav',
    ],
    volumeRange: [0.26, 0.42],
    rateRange: [0.97, 1.03],
    minImpactSpeed: 2,
    cooldownMs: 220,
  },
  lightTrash: {
    sources: ['paperCupFalling.wav', 'paperCupFalling2.mp3'],
    volumeRange: [0.16, 0.26],
    rateRange: [0.93, 1.06],
    minImpactSpeed: 2,
    cooldownMs: 160,
  },
  trashBag: {
    sources: ['trashbagFall.wav'],
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
  'apple-core': 'lightTrash',
  'whiskey-bottle': 'glass',
  'beer-bottle-1': 'glass',
  'beer-bottle-2': 'glass',
  bucket: 'bucket',
  'happy-meal': 'lightTrash',
  'mc-cup': 'lightTrash',
};
