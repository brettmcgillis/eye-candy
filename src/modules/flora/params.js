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

  crownRadius: 3,
  crownStretch: 1,
  crownLift: 0.85,
  crownOpen: 0.7,
  crownBase: 0.94,
  lobeCount: 3,
  lobeRise: 0.35,
  lobeFalloff: 0.8,
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
  maxSegments: 400000,

  ornamentDensity: 0.18,
  sphereAmount: 1,
  d4Amount: 0,
  d6Amount: 0.25,
  d8Amount: 0,
  d10Amount: 0,
  d12Amount: 0,
  d20Amount: 0,
  heartAmount: 0,
  petalAmount: 0,
  sphereWire: 0,
  d4Wire: 0,
  d6Wire: 1,
  d8Wire: 0,
  d10Wire: 0,
  d12Wire: 0,
  d20Wire: 0,
  heartWire: 0,
  petalWire: 0,
  ornamentSize: 0.05,

  variation: 0.5,
  paletteVariation: 0.45,
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
