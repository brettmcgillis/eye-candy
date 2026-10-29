import { PRESETS as FLAT_PRESETS } from '@components/scenes/WebGPU/Subdivision/presets/presets';
import {
  RENDER_OPTIONS,
  SCENE_NAMES,
  sceneDefaults,
} from '@modules/subdivisionRelief';

import { DEFAULT_SEED } from '../utils/controls';

// Keys match @modules/subdivisionRelief's option schema 1:1, so presets saved
// from SubdivisionReliefCLI land below in the same shape.
export const DEFAULT_PRESET = 'Quadtree';

const RELIEF = {
  Quadtree: { depthWeight: 1 },
  Trixels: { depthWeight: 0.3, fieldWeight: 1, reliefHeight: 2 },
  'Contour Split': { depthWeight: 0.3, fieldWeight: 0.8, reliefHeight: 1.6 },
  Focal: {
    focalWeight: 1,
    motionNoiseAmount: 0.1,
    motionWaveAmount: 0.4,
    motionWaveOrigin: 'focal',
  },
  Blobs: { animate: false, fieldWeight: 0.8 },
  'Rect Slide': {
    depthWeight: 0.6,
    fieldWeight: 0.6,
    motionWaveAmount: 0.3,
    reliefHeight: 1.6,
  },
  'Webcam Squares': {
    depthWeight: 1,
    lumaWeight: 0.6,
    motionNoiseAmount: 0.15,
  },
  'Webcam Rects': {
    depthWeight: 0.5,
    lumaWeight: 0.8,
    motionNoiseAmount: 0.1,
  },
  'Webcam Trixels': { depthWeight: 0.4, lumaWeight: 0.7 },
};

// Subdivision's presets, piece for piece, each with a relief; the keys the
// relief has no use for (the outline band) are left out.
const FROM_SUBDIVISION = Object.fromEntries(
  Object.entries(FLAT_PRESETS).map(([name, preset]) => [
    name,
    {
      ...Object.fromEntries(
        Object.entries(preset).filter(([key]) => SCENE_NAMES.includes(key))
      ),
      ...RELIEF[name],
    },
  ])
);

export const PRESETS = {
  ...FROM_SUBDIVISION,
  'Slab Towers': {
    baseHeight: 0.3,
    cellForm: 'slab',
    cellGap: 0.05,
    colorMode: 'value',
    depthWeight: 0.3,
    driver: 'variance',
    field: 'ridged',
    fieldWeight: 1,
    levels: 5,
    motionWaveAmount: 0.3,
    palette: 'Cobalt Desert 7 (lospec)',
    reliefHeight: 3.2,
    slabThickness: 0.9,
    varianceThreshold: 0.08,
  },
  'Floating Platforms': {
    baseHeight: 0.4,
    cellForm: 'slab',
    cellGap: 0.04,
    colorMode: 'depth',
    depthWeight: 0.5,
    fieldWeight: 0.8,
    lattice: 'tri',
    motionNoiseAmount: 0.15,
    palette: 'Witching Hour (lospec)',
    reliefHeight: 2.4,
    slabThickness: 0.08,
  },
  'Slab Skyline': {
    baseHeight: 0.2,
    cellForm: 'slab',
    cellGap: 0.08,
    cellSize: 180,
    colorMode: 'value',
    cutMargin: 0.12,
    depthWeight: 0.2,
    driver: 'variance',
    field: 'rings',
    fieldScale: 3,
    fieldWeight: 1,
    growStyle: 'slide',
    lattice: 'rect',
    levels: 6,
    palette: 'Rare Vintage (lospec)',
    reliefHeight: 2.8,
    slabThickness: 0.5,
    varianceThreshold: 0.05,
  },
  'Floating Sheets': {
    baseHeight: 0.5,
    cellForm: 'plane',
    cellGap: 0.06,
    colorMode: 'position',
    depthWeight: 0.4,
    driver: 'variance',
    field: 'blobs',
    fieldWeight: 0.9,
    palette: 'Beach Day (lospec)',
    reliefHeight: 2,
    varianceThreshold: 0.2,
  },
  'Paper Trixels': {
    baseHeight: 0.3,
    cellForm: 'plane',
    cellGap: 0.05,
    colorMode: 'value',
    depthWeight: 0.3,
    field: 'ridged',
    fieldWeight: 1,
    lattice: 'tri',
    motionWaveAmount: 0.4,
    palette: 'Retrotronic (lospec)',
    reliefHeight: 2.2,
  },
  'Paper Drift': {
    baseHeight: 0.4,
    cellForm: 'plane',
    cellGap: 0.1,
    colorMode: 'depth',
    depthWeight: 0.6,
    driver: 'focal',
    focalCount: 4,
    levels: 6,
    motionNoiseAmount: 0.25,
    motionWaveAmount: 0.5,
    palette: 'Sunraze (lospec)',
    reliefHeight: 1.6,
  },
  'Paper Rects': {
    baseHeight: 0.25,
    cellForm: 'plane',
    cellGap: 0.04,
    cellSize: 180,
    colorMode: 'value',
    cutMargin: 0.12,
    driver: 'variance',
    field: 'ridged',
    fieldWeight: 0.8,
    growStyle: 'slide',
    lattice: 'rect',
    levels: 6,
    palette: 'Cobalt Desert 7 (lospec)',
    reliefHeight: 2.4,
    varianceThreshold: 0.05,
  },
};

// A preset only lists what differs from the schema, so applying one starts
// from the defaults or the previous preset's values would linger.
export function getPresetControls({ presetSnapshot }) {
  return {
    ...sceneDefaults(),
    height: RENDER_OPTIONS.height.default,
    seed: DEFAULT_SEED,
    width: RENDER_OPTIONS.width.default,
    ...presetSnapshot,
  };
}
