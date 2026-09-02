export const DEFAULT_PRESET = '4D Slice';

const SHARED = {
  cameraMode: 'orbit',
  folds: 7,
  aoStrength: 1,
  fogAmount: 0.001,
  postGamma: 0.65,
  saturation: -0.5,
  vignette: 1,
  lensShift: 0.225,
  boneColor: '#e3dac9',
  viewMode: 'shader',
  orbitPeriod: 120,
  zoom: 1,
  pivotX: 0,
  pivotY: 0,
  pivotZ: 0,
  timeScale: 1,
  renderScale: 1,
  maxSteps: 130,
  epsilon: 0.0003,
  treeScaleBase: 1.3,
  treeScaleGain: 0.95,
  treeTwist: Math.PI / 5.5,
  treePeriodY: 2,
  treePeriodXZ: 2,
  foldScale: 1 / 0.75,
  sliceW: 0.125,
  sliceAnimate: true,
  sliceRotXW: 0,
  sliceRotYW: 0,
  sliceRotZW: 0,
};

export const PRESETS = {
  '4D Slice': {
    ...SHARED,
    domain: 'slice',
  },
  'Gnarly Tree': {
    ...SHARED,
    domain: 'tree',
  },
  Explore: {
    ...SHARED,
    domain: 'slice',
    viewMode: 'camera',
    sliceAnimate: false,
    sliceRotXW: 0.62,
    sliceRotYW: -1.1,
    sliceRotZW: 0.35,
  },
  'Frozen Slice': {
    ...SHARED,
    domain: 'slice',
    sliceAnimate: false,
    sliceRotXW: 0.62,
    sliceRotYW: -1.1,
    sliceRotZW: 0.35,
    sliceW: 0.42,
    orbitPeriod: 40,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
