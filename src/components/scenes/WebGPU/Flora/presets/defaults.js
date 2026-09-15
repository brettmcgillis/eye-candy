import { DEFAULT_PARAMS } from '@modules/flora';

const FORM = Object.fromEntries(
  Object.entries(DEFAULT_PARAMS).filter(([key]) => key !== 'stemSegments')
);

export const LOOK = {
  backgroundColor: '#050505',
  stemColor: '#3f9a4a',
  budColor: '#e4eed8',
  crownColor: '#e58fc2',
  accentColor: '#f0a040',
  tipColor: '#fff0e0',
  ornamentColor: '#ffd27a',
  greenReach: 0.18,
  tipAmount: 0.55,
  tipPower: 2,
  tintVariance: 0.3,
  stemWidth: 0.045,
  tipWidth: 0.004,
  thicknessCurve: 2.4,
  leafWidth: 0.06,
  leafFlatness: 0.22,
  minPixels: 0.6,
  roughness: 0.55,
  occlusion: 0.8,
  cardCup: 0.25,
  ornamentScale: 1,
  ornamentMinPixels: 1.5,
};

export const MOTION = {
  regrow: true,
  timeScale: 1,
  growSeconds: 16,
  bloomStart: 0.5,
  bloomSeconds: 9,
  holdSeconds: 6,
  exitSeconds: 8,
  restSeconds: 1.5,
  windStrength: 0.2,
  windSpeed: 0.6,
  scatterDistance: 7,
  scatterSpread: 1,
  scatterLift: 0.7,
  scatterTurbulence: 0.8,
  scatterSpin: 3,
};

export const SCENE_DEFAULTS = { ...FORM, ...LOOK, ...MOTION };
