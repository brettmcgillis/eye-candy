export const CROWN_SHAPES = ['dome', 'heart', 'stack', 'cluster', 'fan'];

export const DEFAULT_PARAMS = {
  seed: 'flora',

  stemHeight: 6.5,
  stemSegments: 48,
  stemCurve: 0.35,
  stemWaves: 1.2,
  leafBlades: 2,
  leafLength: 2.2,
  leafHeight: 0.3,
  sideShoots: 1,
  sideShootLength: 4,

  crownShape: 'dome',
  crownRadius: 3,
  crownStretch: 1,
  crownLift: 0.85,
  crownOpen: 0.7,
  crownBase: 0.94,
  lobeCount: 5,
  lobeSpread: 0.6,
  lobeJitter: 0.35,
  accentAmount: 0.25,
  shellBias: 0.45,

  tips: 22000,
  umbelSize: 3,
  splitRatio: 0.6,
  sheaf: 0.85,
  splitBalance: 0.35,
  fiberStep: 0.16,
  fiberBend: 0.06,
  fiberSag: 0.03,
  wispChance: 0.015,
  wispReach: 0.8,

  ornamentDensity: 0.18,
  cubeAmount: 0.25,
  dotAmount: 1,
  heartAmount: 0,
  petalAmount: 0,
  ornamentSize: 0.05,

  stemPhase: 0.28,
  burst: 0.75,
};

export function resolveParams(params = {}) {
  const resolved = { ...DEFAULT_PARAMS };

  Object.keys(DEFAULT_PARAMS).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      resolved[key] = params[key];
    }
  });

  return resolved;
}
