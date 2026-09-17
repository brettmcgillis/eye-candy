import { SOLID_SHAPES } from './polyhedra';

const CARD_SHAPES = ['heart', 'petal'];

const SPREAD = {
  stemHeight: 0.4,
  stemCurve: 0.8,
  stemWaves: 0.5,
  leafLength: 0.35,
  leafHeight: 0.4,
  sideShootLength: 0.4,
  crownRadius: 0.4,
  crownStretch: 0.4,
  crownLift: 0.4,
  formSpread: 0.6,
  warp: 0.9,
  asymmetry: 1,
  accentAmount: 0.6,
  shellBias: 0.35,
  splitRatio: 0.45,
  sheaf: 0.45,
  splitBalance: 0.4,
  fiberStep: 0.25,
  fiberBend: 1.2,
  fiberSag: 0.8,
  wispChance: 1,
  wispReach: 0.5,
  ornamentDensity: 0.5,
  ornamentSize: 0.35,
};

const COUNTS = {
  leafBlades: 1,
  sideShoots: 1,
  formCount: 2,
  umbelSize: 4,
};

const RATIOS = new Set([
  'shellBias',
  'sheaf',
  'splitBalance',
  'accentAmount',
  'ornamentDensity',
  'asymmetry',
]);

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function varyParams(p, rng) {
  const amount = p.variation ?? 0;

  if (amount <= 0) {
    return p;
  }

  const varied = { ...p };
  const wobble = (spread) => 1 + rng.signed() * spread * amount;

  Object.entries(SPREAD).forEach(([key, spread]) => {
    varied[key] = Math.max(0, p[key] * wobble(spread));

    if (RATIOS.has(key)) {
      varied[key] = clamp01(varied[key]);
    }
  });

  Object.entries(COUNTS).forEach(([key, spread]) => {
    const drift = Math.round(rng.signed() * spread * amount);

    varied[key] = Math.max(
      key === 'formCount' || key === 'umbelSize' ? 1 : 0,
      p[key] + drift
    );
  });

  varied.tips = Math.round(Math.max(500, p.tips * wobble(0.35)));
  varied.wispChance = Math.min(varied.wispChance, 0.3);

  [...SOLID_SHAPES, ...CARD_SHAPES].forEach((shape) => {
    varied[`${shape}Amount`] = Math.max(0, p[`${shape}Amount`] * wobble(0.8));
    varied[`${shape}Wire`] = clamp01(
      p[`${shape}Wire`] + rng.signed() * 0.35 * amount
    );
  });

  return varied;
}
