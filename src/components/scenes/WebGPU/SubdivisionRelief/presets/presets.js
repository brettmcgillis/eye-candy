import { sceneDefaults } from '@modules/subdivision';

import { DEFAULT_SEED, OMITTED_KEYS } from '../utils/controls';
import { reliefDefaults } from '../utils/reliefOptions';

// Keys match the Leva schema 1:1: @modules/subdivision's option schema plus
// the scene's relief and motion options.
export const DEFAULT_PRESET = 'Relief';

export const PRESETS = {
  Relief: {
    colorMode: 'value',
    driver: 'variance',
    fieldWeight: 0.5,
    varianceThreshold: 0.08,
  },
  'Webcam Portrait': {
    cellSize: 160,
    colorMode: 'source',
    depthWeight: 1,
    driver: 'variance',
    field: 'image',
    jitterAmount: 0.04,
    levels: 6,
    lumaWeight: 0.6,
    motionNoiseAmount: 0.15,
    palette: 'None',
    paletteExact: false,
    varianceThreshold: 0.06,
    webcam: true,
  },
  'Trixel Terrain': {
    colorMode: 'value',
    depthWeight: 0.3,
    field: 'ridged',
    fieldWeight: 1,
    lattice: 'tri',
    palette: 'Retrotronic (lospec)',
    reliefHeight: 2,
  },
  'Focal Swell': {
    cellSize: 320,
    colorMode: 'depth',
    driver: 'focal',
    focalCount: 4,
    focalWeight: 1,
    levels: 6,
    motionNoiseAmount: 0.1,
    motionWaveAmount: 0.4,
    motionWaveOrigin: 'focal',
  },
  Still: {
    animate: false,
    colorMode: 'position',
    driver: 'variance',
    field: 'blobs',
    varianceThreshold: 0.2,
  },
};

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
