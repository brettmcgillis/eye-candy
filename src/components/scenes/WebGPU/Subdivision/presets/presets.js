import { sceneDefaults } from '@modules/subdivision';

import { DEFAULT_SEED } from '../utils/controls';

// Keys match the Leva schema 1:1, which is @modules/subdivision's option
// schema — presets saved from SubdivisionCLI land here in the same shape.
// SubdivisionRelief builds its presets from these, so the two stay aligned.
export const DEFAULT_PRESET = 'Quadtree';

export const PRESETS = {
  Quadtree: { palette: 'Cobalt Desert 7 (lospec)' },
  Trixels: {
    colorMode: 'value',
    field: 'ridged',
    lattice: 'tri',
    palette: 'Retrotronic (lospec)',
  },
  'Contour Split': {
    colorMode: 'value',
    driver: 'variance',
    field: 'rings',
    fieldScale: 3,
    levels: 6,
    palette: 'Sunraze (lospec)',
    varianceThreshold: 0.06,
  },
  Focal: {
    cellSize: 320,
    colorMode: 'depth',
    driver: 'focal',
    focalCount: 4,
    levels: 6,
    palette: 'Witching Hour (lospec)',
  },
  Blobs: {
    colorMode: 'position',
    driver: 'variance',
    field: 'blobs',
    palette: 'Beach Day (lospec)',
    varianceThreshold: 0.2,
  },
  'Rect Slide': {
    cellSize: 180,
    colorMode: 'value',
    cutMargin: 0.12,
    driver: 'variance',
    field: 'ridged',
    growStyle: 'slide',
    lattice: 'rect',
    levels: 6,
    palette: 'Rare Vintage (lospec)',
    varianceThreshold: 0.05,
  },
  'Webcam Squares': {
    cellSize: 160,
    colorMode: 'value',
    driver: 'variance',
    field: 'image',
    jitterAmount: 0,
    levels: 6,
    outlineWidth: 0.04,
    palette: 'Ink Crimson (lospec)',
    paletteExact: false,
    varianceThreshold: 0.06,
    webcam: true,
  },
  'Webcam Rects': {
    cellSize: 240,
    colorMode: 'value',
    cutDriver: 'edge',
    cutMargin: 0.04,
    driver: 'variance',
    field: 'image',
    jitterAmount: 0,
    lattice: 'rect',
    levels: 7,
    outlineWidth: 0.02,
    palette: 'Hyper_Drive (lospec)',
    varianceThreshold: 0.05,
    webcam: true,
  },
  'Webcam Trixels': {
    cellSize: 180,
    colorMode: 'source',
    driver: 'variance',
    field: 'image',
    jitterAmount: 0.04,
    lattice: 'tri',
    levels: 6,
    outlineWidth: 0.03,
    varianceThreshold: 0.06,
    webcam: true,
  },
};

// A preset only lists what differs from the schema, so applying one starts
// from the defaults or the previous preset's values would linger.
export function getPresetControls({ presetSnapshot }) {
  return {
    ...sceneDefaults(),
    seed: DEFAULT_SEED,
    ...presetSnapshot,
  };
}
