import { PRESETS as FLAT_PRESETS } from '@components/scenes/WebGPU/Subdivision/presets/presets';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
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
        Object.entries(preset).filter(([key]) => SCENE_KEYS.includes(key))
      ),
      ...RELIEF[name],
    },
  ])
);

export const PRESETS = {
  ...FROM_SUBDIVISION,
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
