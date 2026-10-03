import { PRESETS as FLAT_PRESETS } from '@components/scenes/WebGPU/Subdivision/presets/presets';
import { sceneDefaults } from '@modules/subdivision';

import { DEFAULT_SEED, OMITTED_KEYS } from '../utils/controls';
import { reliefDefaults } from '../utils/reliefOptions';

// Subdivision's presets, piece for piece, each with a relief: the 2D outline
// keys dropped and the height and motion options added. Keys match the Leva
// schema 1:1.
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

export const PRESETS = Object.fromEntries(
  Object.entries(FLAT_PRESETS).map(([name, preset]) => [
    name,
    {
      ...Object.fromEntries(
        Object.entries(preset).filter(([key]) => !OMITTED_KEYS.includes(key))
      ),
      ...RELIEF[name],
    },
  ])
);

const pieceDefaults = () =>
  Object.fromEntries(
    Object.entries(sceneDefaults()).filter(
      ([key]) => !OMITTED_KEYS.includes(key)
    )
  );

// A preset only lists what differs from the schema, so applying one starts
// from the defaults or the previous preset's values would linger.
export function getPresetControls({ presetSnapshot }) {
  return {
    ...pieceDefaults(),
    ...reliefDefaults(),
    height: 1000,
    seed: DEFAULT_SEED,
    width: 1600,
    ...presetSnapshot,
  };
}
