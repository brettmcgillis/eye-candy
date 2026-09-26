export const PLANS = ['invader', 'blob', 'swimmer'];

export const BITMAP_ROWS = 8;
export const BITMAP_HALF = 4;
export const LEG_ROW_START = 6;
export const MAX_IFS_LEVELS = 9;
export const MAX_TENTACLES = 6;
export const TENTACLE_BEADS = 12;
export const BODY_BEAD_PAIRS = 58;

export const VOXEL_BLOCK = 256;
export const BEAD_BLOCK = BODY_BEAD_PAIRS * 2 + MAX_TENTACLES * TENTACLE_BEADS;

export const GENES = {
  hue: [0, 1],
  saturation: [0.35, 0.85],
  lightness: [0.34, 0.62],
  accentShift: [-0.5, 0.5],
  roughness: [0.25, 0.85],
  skin: [0, 1],
  depth: [0, 1],
  ifsCount: [4, 9],
  ifsRange: [0.8, 1.7],
  ifsRadius: [0.45, 0.8],
  ifsBlend: [0.15, 0.45],
  ifsFalloff: [1.15, 1.5],
  ifsBalance: [0.3, 1.4],
  ifsTwist: [0, Math.PI * 2],
  ifsPulse: [0.05, 0.45],
  ifsTempo: [0.3, 1.4],
  swimLength: [0.8, 1.4],
  swimWidth: [0.04, 0.14],
  swimFin: [0.05, 0.35],
  swimFinFreq: [8, 42],
  swimHead: [0.02, 0.18],
  swimTail: [0.02, 0.14],
  swimUndulate: [0, 1],
  tentacles: [0, 1],
  tentacleLength: [0.35, 1.3],
  tentacleWave: [0, 1],
  diet: [0, 1],
  aggression: [0, 1],
  sociability: [0, 1],
  fertility: [0, 1],
  wanderlust: [0, 1],
  dominance: [0, 1],
  mutation: [0, 1],
  lifespan: [0, 1],
};

export const TEMPERAMENT_GENES = [
  'diet',
  'aggression',
  'sociability',
  'fertility',
  'wanderlust',
  'dominance',
  'mutation',
  'lifespan',
];

export const DEFAULT_FOUNDER_PARAMS = {
  founderSeed: 'fauna',
  founderCount: 5,
  planInvader: 1,
  planBlob: 1,
  planSwimmer: 1,
  bitDensity: 0.5,
  tentacleChance: 0.3,
  carnivoreChance: 0.25,
};

export const DEFAULT_WORLD_PARAMS = {
  worldSize: 48,
  populationCap: 360,
  founderCopies: 4,
  foodGrowth: 0.09,
  foodSpread: 0.35,
  foodStart: 0.45,
  meatDecay: 0.05,
  metabolismScale: 1,
  mutationScale: 1,
  compatibility: 0.34,
  lifespanScale: 1,
};

export const SNAPSHOT_STRIDE = 8;
export const FOOD_RES = 48;
