// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/trucheterie3d';

export const DEFAULT_PRESET = 'Cables';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
  blobSeed: 'blob-1',
};

const PALETTE = {
  blobPalette: 'Cobalt Desert 7 (lospec)',
  blobLaneMode: 'Cycle',
  blobPaletteExact: true,
};

export const PRESETS = {
  Cables: { ...BASE, ...PALETTE },
  'Lanes + Wires': {
    ...BASE,
    ...PALETTE,
    blobPalette: 'VividMemory8 (lospec)',
    strands: 'both',
    wireThickness: 0.22,
  },
  'Wire Sculpture': {
    ...BASE,
    strands: 'wires',
    wireThickness: 0.35,
    strokeColor: '#1c1b19',
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 0,
  },
  Weave: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Rettiepunk (lospec)',
    junction: 'weave',
    blobConnectivity: 1,
    blobOneFill: 0.4,
  },
  'Woven Wires': {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Exophobia (lospec)',
    junction: 'weave',
    strands: 'both',
    blobConnectivity: 1,
  },
  Terraces: {
    ...BASE,
    ...PALETTE,
    blobLaneMode: 'Depth',
    heightMode: 'terrace',
    heightScale: 0.35,
  },
  'Half Round Relief': {
    ...BASE,
    blobMonochrome: true,
    blobMonoColor: '#e6e0d2',
    tubeProfile: 'half',
    floorGap: 0,
    strands: 'both',
    strokeColor: '#e6e0d2',
  },
  Ribbons: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Joker-6 (lospec)',
    tubeProfile: 'ribbon',
    ribbonHeight: 0.4,
    tubeThickness: 0.95,
  },
  Grow: { ...BASE, ...PALETTE, motionMode: 'grow' },
  Flow: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Heptarainbow (lospec)',
    blobLaneMode: 'Spectrum',
    blobPaletteExact: false,
    motionMode: 'flow',
    paletteDrift: 0.5,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
