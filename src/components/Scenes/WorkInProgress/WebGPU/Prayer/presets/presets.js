export const DEFAULT_PRESET = 'Default';

export const DEFAULT_PRESET_VALUES = {
  bgColor: '#030304',

  ambientColor: '#ffffff',
  ambientIntensity: 0.18,
  keyColor: '#f4f1ef',
  keyIntensity: 5.4,
  keyPosition: [2.6, 3.4, 3.2],
  fillColor: '#6f8fd6',
  fillIntensity: 1.15,
  fillPosition: [-3.2, 1.2, -2.8],
  godraysColor: '#fff4ea',
  godraysIntensity: 15,
  godraysPosition: [0, 4.2, 2.2],

  baseScale: 1,
  middleScale: 1.125,
  outerScale: 1.25,
  basePosition: [0, 0, 0],
  middlePosition: [0.1, -0.05, 0],
  outerPosition: [0.2, -0.1, 0],
  middleSpread: 30,
  outerSpread: 60,
  middleYaw: 0,
  outerYaw: 0,

  cleanBaseColor: '#fafafa',
  cleanAccentColor: '#ffffff',
  cleanAmount: 0.08,
  cleanScale: 3.5,
  cleanIterations: 4,
  cleanNoise: 0.12,
  cleanNoiseScale: 0.75,
  cleanSeed: 2,
  cleanMetalness: 0.08,
  cleanRoughness: 0.26,

  oilBaseColor: '#050505',
  oilAccentColor: '#101010',
  oilAmount: -0.32,
  oilScale: 6.5,
  oilIterations: 6,
  oilNoise: 0.42,
  oilNoiseScale: 0.9,
  oilSeed: 7,
  oilMetalness: 0.93,
  oilRoughness: 0.08,

  bloodBaseColor: '#240104',
  bloodAccentColor: '#5d050d',
  bloodAmount: -0.12,
  bloodScale: 5.8,
  bloodIterations: 7,
  bloodNoise: 0.55,
  bloodNoiseScale: 0.82,
  bloodSeed: 11,
  bloodMetalness: 0.58,
  bloodRoughness: 0.16,

  godraysEnabled: true,
  godraysBlendColor: '#b89d94',
  godraysDensity: 1.5,
  godraysMaxDensity: 0.78,
  godraysDistanceAttenuation: 0.95,
  godraysBlur: true,
  godraysEdgeRadius: 2,
  godraysEdgeStrength: 2,

  bloomEnabled: true,
  bloomStrength: 0.22,
  bloomThreshold: 0.72,
  bloomRadius: 0.45,
};

const PRESETS = {
  [DEFAULT_PRESET]: DEFAULT_PRESET_VALUES,
};

export default PRESETS;
