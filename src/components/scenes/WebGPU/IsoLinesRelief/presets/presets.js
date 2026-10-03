// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/isoLinesRelief';

export const DEFAULT_PRESET = 'Terraces';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

const LINES = { style: 'lines', outlineWidth: 0 };
// Isolines 1's line colour: the cosine a quarter turn on.
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
  orbitAutoRotate: false,
};

export const PRESETS = {
  // Isolines 2's bands as real stacked layers, its shadow cast for real.
  Terraces: { ...BASE, levels: 16 },
  // The terraces with the steps smoothed away: one continuous surface,
  // banded and outlined at every level.
  'Smooth Relief': { ...BASE, style: 'smooth', levels: 16, outlineWidth: 0.8 },
  'Soft Terraces': {
    ...BASE,
    style: 'smooth',
    terraceSharpness: 0.85,
    levels: 12,
  },
  'Floating Layers': {
    ...BASE,
    wallMode: 'floating',
    levels: 12,
    outlineWidth: 0,
    relief: 0.8,
  },
  'Contour Walls': {
    ...BASE,
    ...LINES,
    ...SINE,
    lineHeight: 0.04,
    lineThickness: 0.005,
    groundColor: '#07080c',
  },
  // Isolines 1's trail made literal: the present on top, past contours
  // stacked beneath it.
  'Time Trail': {
    ...BASE,
    ...LINES,
    ...SINE,
    lineExtrude: 'time',
    trailSlices: 40,
    trailSeconds: 0.12,
    trailFade: 0.85,
    lineHeight: 0.012,
    lineThickness: 0.003,
    levels: 14,
    relief: 0.9,
    noiseSpeed: 0.25,
  },
  Build: { ...BASE, levels: 14, motionMode: 'build' },
  Rise: { ...BASE, levels: 18, motionMode: 'rise', holdSeconds: 4 },
  'Focal Peaks': {
    ...BASE,
    weightNoise: 0.4,
    weightFocal: 1,
    focalCount: 4,
    levels: 20,
    relief: 0.75,
  },
  'Webcam Terraces': { ...BASE, ...WEBCAM, imageColor: 0.6, relief: 0.5 },
  'Webcam Smooth': {
    ...BASE,
    ...WEBCAM,
    style: 'smooth',
    imageColor: 0.6,
    relief: 0.4,
  },
  'Webcam Trail': {
    ...BASE,
    ...WEBCAM,
    ...LINES,
    ...SINE,
    motionMode: 'flow',
    lineExtrude: 'time',
    trailSlices: 32,
    trailSeconds: 0.1,
    lineHeight: 0.01,
    lineThickness: 0.003,
    relief: 0.9,
  },
};

// Saved from IsoLinesReliefCLI: only what differs from the scene defaults.
const SNAPSHOTS = {};

Object.entries(SNAPSHOTS).forEach(([name, snapshot]) => {
  PRESETS[name] = { ...BASE, ...snapshot };
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
