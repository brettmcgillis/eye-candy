export const COLORS = {
  cardColor: '#fcfcfc',
  cardEdgeColor: '#fcfcfc',
  glowFloorColor: '#3c3c44',
  groundColor: '#fcfcfc',
  neonAmberColor: '#ffcc00',
  neonCyanColor: '#00ffcc',
  neonMagentaColor: '#ff0066',
  patternColor: '#d8d8d8',
  pedestalColor: '#fcfcfc',
  pitColor: '#050505',
  pitFloorColor: '#000000',
  pitRimColor: '#bfbfbf',
  pitStrataColor: '#3a3a3a',
  ringColor: '#00aaff',
  stairHighColor: '#c8c8c8',
  stairLowColor: '#050505',
  towerBaseColor: '#000000',
  towerColor: '#000000',
  wellFloorColor: '#050505',
  wellWallColor: '#d6d6d6',
};

export const SCALARS = {
  cardBob: 0,
  cardBobRate: 0.6,
  neonFlicker: 0,
  neonFlickerRate: 8,
  neonIntensity: 1.15,
  overshoot: 1.7,
  patternScale: 16,
  patternStrength: 0.6,
  patternWidth: 0.12,
  pitLineWidth: 0.12,
  pitStrataStrength: 0.5,
  pulseDepth: 0.35,
  pulseRate: 1.1,
  revealBand: 0.3,
  riserShade: 0.8,
  ringIntensity: 1.8,
  stairAlphaStep: 0.15,
  towerBandStrength: 0.25,
  towerBanding: 0,
  towerBreathe: 0,
  towerBreatheRate: 0.5,
  towerInk: 1,
  wellFalloff: 0.7,
};

// Selects reach the shaders as numbers so switching one never rebuilds a
// material.
export const ENUMS = {
  easing: {
    defaultValue: 'smooth',
    values: ['smooth', 'linear', 'expo', 'back'],
  },
  emergeStyle: { defaultValue: 'rise', values: ['rise', 'unfold'] },
  groundPattern: {
    defaultValue: 'none',
    values: ['none', 'dots', 'grid', 'crosshatch'],
  },
};
