// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { LITE, WILD, sceneDefaults } from '@modules/imperfection';

export const DEFAULT_PRESET = 'Full';

const BASE = {
  cameraMode: 'fixed',
  ...sceneDefaults(),
};

export const PRESETS = {
  Full: BASE,
  Lite: { ...BASE, ...LITE },
  Wild: { ...BASE, ...WILD },
  'Full Bleed': { ...BASE, clipSquare: false },
  Mirror: { ...BASE, mirror: true },
  Ember: {
    ...BASE,
    warmHue: -14,
    warmChroma: 1.1,
    coolHue: -30,
    coolChroma: 0.7,
    coolLight: 0.9,
  },
  'Teal Ice': {
    ...BASE,
    coolHue: -38,
    coolChroma: 1.3,
    coolLight: 1.06,
    warmHue: 6,
  },
  'High Band': {
    ...BASE,
    columnLeft: 0.27,
    columnRight: 0.52,
    seamRight: 0.78,
    bandLow: 0.38,
    bandHigh: 0.66,
    coreTop: 0.9,
  },
  'Seed 7': { ...BASE, paintSeed: 7, liveFrac: 0.55, wet: 1.2 },
  Horizon: {
    ...BASE,
    composition: 'horizon',
    compSeed: 12,
    compFocusX: 0.42,
    compFocusY: 0.38,
    impasto: 0.35,
  },
  Portal: {
    ...BASE,
    composition: 'portal',
    compSeed: 4,
    compFocusX: 0.38,
    compFocusY: 0.55,
    blockEngine: 'rect',
    impasto: 0.35,
  },
  Burst: {
    ...BASE,
    composition: 'burst',
    compSeed: 31,
    compFocusX: 0.42,
    compFocusY: 0.45,
    blockEngine: 'quadtree',
  },
  Columns: {
    ...BASE,
    composition: 'columns',
    compSeed: 7,
    compFocusX: 0.5,
    compFocusY: 0.62,
    blockEngine: 'quadtree',
    blockScale: 0.8,
  },
  'Cross (generated)': {
    ...BASE,
    composition: 'cross',
    compSeed: 88,
    compFocusX: 0.45,
    compFocusY: 0.62,
    paletteName: 'Lunada',
  },
  'Argyle Logo': {
    ...BASE,
    motif: 'logo',
    motifBuild: 0.6,
    blockEngine: 'rect',
    blockAmount: 0.7,
  },
  'Argyle Logo Outline': {
    ...BASE,
    motif: 'logo',
    motifStyle: 'outline',
    motifPlacement: 'blocks',
    motifLine: 0.14,
  },
  'Argyle Tiled': {
    ...BASE,
    motif: 'tiled',
    motifScale: 0.045,
    motifErode: 0.52,
    motifErodeScale: 0.16,
    motifFade: 0.65,
    motifEdge: 0.9,
    blockAmount: 0.4,
  },
  'Argyle Tiled Outline': {
    ...BASE,
    motif: 'tiled',
    motifStyle: 'outline',
    motifScale: 0.05,
    motifLine: 0.1,
    motifErode: 0.38,
    motifErodeScale: 0.3,
    motifFade: 0.45,
    blockAmount: 0.4,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
