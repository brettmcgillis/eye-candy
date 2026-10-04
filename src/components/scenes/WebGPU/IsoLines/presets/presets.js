// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/isoLines';

export const DEFAULT_PRESET = 'Isolines 2';

const BASE = sceneDefaults();

const LINES = { style: 'lines', outlineWidth: 0 };
// Isolines 1 colours its lines .5 + .5·sin(12n + …): the cosine a quarter
// turn on.
const SINE = { cosinePhase: 4.7124 };
const WEBCAM = {
  weightNoise: 0,
  weightShape: 0,
  weightFocal: 0,
  weightImage: 1,
  imageBlur: 3,
  levels: 18,
  webcam: true,
  motionMode: 'off',
};

export const PRESETS = {
  // The two references with their fake depth taken out: flat bands with
  // their tanh edge, and bare isolines without the feedback trail.
  'Isolines 2': BASE,
  'Isolines 1': { ...BASE, ...LINES, ...SINE },
  'Topo Map': {
    ...BASE,
    colorMode: 'ramp',
    rampLow: '#cdd8c0',
    rampHigh: '#8f6b4a',
    outlineColor: '#4a3a2c',
    outlineWidth: 0.8,
    levels: 28,
    noiseScale: 5,
    weightShape: 0.5,
    shapeKind: 'ridged',
    noiseSpeed: 0.03,
    postGrainEnabled: true,
  },
  'Ripple Blend': {
    ...BASE,
    ...LINES,
    weightShape: 0.7,
    shapeKind: 'rings',
    shapeScale: 3,
    shapeSpeed: 0.3,
    warpAmount: 0.3,
    levels: 24,
  },
  'Focal Bands': {
    ...BASE,
    weightNoise: 0.4,
    weightFocal: 1,
    focalCount: 4,
  },
  'Webcam Bands': { ...BASE, ...WEBCAM, imageColor: 0.4 },
  'Webcam Lines': { ...BASE, ...WEBCAM, ...LINES, ...SINE, levels: 24 },
  'c0uuxh-78': {
    ...BASE,
    levels: 30,
    fieldSeed: 4429,
    noiseScale: 10.4,
    shapeKind: 'ridged',
    shapeScale: 1.75,
    focalCount: 5,
    focalFalloff: 0.43,
    warpScale: 2.45,
    fieldContrast: 1.29,
    colorMode: 'palette',
    cosineFreq: 8.4,
    cosinePhase: 0.26,
    cosineSpread: 1.28,
    paletteName: 'Exophobia (lospec)',
    rampLow: '#0f1d28',
    rampHigh: '#f0bef3',
    background: '#0d0a08',
    lineColor: '#e7ebef',
    lineTint: 0.46,
    outlineColor: '#070b0d',
    outlineWidth: 0.45,
    lineWidth: 2.15,
    postGradeVignette: 0.11,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
