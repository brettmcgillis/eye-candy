export const TAU = 6.28318530717959;

export const BOX_EXTENT = [0.5, 1.0, 0.5];

export const M_GROUND = 0;
export const M_STRATA = 1;
export const M_WATER = 2;

export const PAINT_BASE_HEIGHT = 0.45;

export const EROSION_DEFAULTS = {
  scale: 0.15,
  strength: 0.22,
  gullyWeight: 0.5,
  detail: 1.5,
  ridgeRounding: 0.1,
  creaseRounding: 0.0,
  roundingInput: 0.1,
  roundingOctave: 2.0,
  onsetInput: 1.25,
  onsetOctave: 1.25,
  onsetRidgeInput: 2.8,
  onsetRidgeOctave: 1.5,
  assumedSlope: 0.7,
  assumedSlopeAmount: 1.0,
  cellScale: 0.7,
  normalization: 0.5,
  octaves: 5,
  lacunarity: 2.0,
  gain: 0.5,
  heightOffset: -0.65,
  heightOffsetFade: 0.0,
};

export const HEIGHT_DEFAULTS = {
  frequency: 3.0,
  amplitude: 0.125,
  octaves: 3,
  lacunarity: 2.0,
  gain: 0.1,
};

export const TERRAIN_DEFAULTS = {
  waterHeight: 0.36,
  grassHeight: 0.465,
  drainageWidth: 0.3,
  trees: true,
  water: true,
  drainage: true,
};

export const PALETTE = {
  cliff: '#383333',
  dirt: '#998066',
  tree: '#1f4219',
  grass1: '#264d1a',
  grass2: '#668033',
  sand: '#ccb399',
  water: '#000d1a',
  waterShore: '#004040',
  sun: '#fffaf2',
  ambient: '#4d80b3',
};

export const SUN_INTENSITY = 2.0;
export const AMBIENT_INTENSITY = 0.1;
