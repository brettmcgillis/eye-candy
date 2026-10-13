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
  Quilted: {
    ...BASE,
    ...PALETTE,
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    roughness: 0.5,
    clearcoat: 0.15,
  },
  'Quilted Piping': {
    ...BASE,
    ...PALETTE,
    blobPalette: 'VividMemory8 (lospec)',
    lanesAs: 'membrane',
    strands: 'both',
    blobPathsPerUnit: 4,
    wireThickness: 0.3,
    strokeColor: '#efe9dc',
    roughness: 0.55,
    clearcoat: 0.1,
  },
  Mylar: {
    ...BASE,
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    membraneFinish: 'foil',
  },
  Bismuth: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Heptarainbow (lospec)',
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    membraneFinish: 'tintedFoil',
  },
  Balloons: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'VividMemory8 (lospec)',
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    membraneSides: 'double',
    membranePressureMode: 'normal',
    roughness: 0.3,
    clearcoat: 0.7,
  },
  'Mylar Balloons': {
    ...BASE,
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    membraneSides: 'double',
    membranePressureMode: 'normal',
    membraneFinish: 'foil',
  },
  Breathe: {
    ...BASE,
    ...PALETTE,
    blobPalette: 'Joker-6 (lospec)',
    lanesAs: 'membrane',
    blobPathsPerUnit: 4,
    motionMode: 'inflate',
  },
  Grow: { ...BASE, ...PALETTE, motionMode: 'grow' },
  'Design Your Own': {
    ...BASE,
    ...PALETTE,
    blobDesign:
      'tb1.EgUDAgYHAwEMBwQBCQUFAgcHBQIOCQUCDgsFAQ4MBQEMCwYBDwwGAQ8NBgEIBQcBBwYHAQ8HBwEPCAcBDwkHAQ8KBwEPCwcBDwwHAQ8NBwEMBQgCAwcIAQ8ICAIPCggBDwsIAQ8MCAEPDQgBCQcJAQ8KCQEPCwkCDw0JAgwFCgIGBwoCDwkKAQ8KCgEPCQsBDwoLAQsLCwELDAsBDw0LAgkFDAEDBgwBDwcMAQ8IDAILCgwCCgwMAQ8GDQEDBw0BCwwNAQk',
    blobGridSize: 18,
    blobPathsPerUnit: 4,
    designTool: 'paint',
  },
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
