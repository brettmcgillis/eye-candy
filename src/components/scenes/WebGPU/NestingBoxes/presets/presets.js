import { COLOR_DEFAULTS } from '../components/getColorControls';
import { FOG_DEFAULTS } from '../components/getFogControls';
import { MOTION_DEFAULTS } from '../components/getMotionControls';
import { STRUCTURE_DEFAULTS } from '../components/getStructureControls';
import { SURFACE_DEFAULTS } from '../components/getSurfaceControls';

export const DEFAULT_PRESET = 'Tree of Boxes';

const BASE = {
  cameraMode: 'orbit',
  ...STRUCTURE_DEFAULTS,
  ...MOTION_DEFAULTS,
  ...COLOR_DEFAULTS,
  ...SURFACE_DEFAULTS,
  ...FOG_DEFAULTS,
};

export const PRESETS = {
  'Tree of Boxes': BASE,
  Growing: {
    ...BASE,
    growMode: 'animate',
    growNewSeed: true,
  },
  Drifting: {
    ...BASE,
    driftEnabled: true,
  },
  'Rustling Leaves': {
    ...BASE,
    driftEnabled: true,
    driftMode: 'oscillate',
    driftSpeed: 1.5,
    driftAmplitude: 0.8,
    driftBias: 3,
    placementDriftX: 0.9,
    placementDriftY: 1.3,
    placementDriftZ: 1.1,
    sizeDriftX: 0.7,
    sizeDriftY: 0.5,
    sizeDriftZ: 0.6,
    breatheAmount: 0.01,
    breatheSpeed: 0.4,
  },
  'Weathered Concrete': {
    ...BASE,
    colorMode: 'solid',
    baseColor: '#d8d4cc',
    surface: 'Concrete',
    textureScale: 0.35,
    roughness: 1,
    weathering: 0.55,
    background: '#9a9893',
  },
  'Palette Stone': {
    ...BASE,
    colorMode: 'palette',
    paletteName: 'Cobalt Desert 7 (lospec)',
    paletteSource: 'height',
    surface: 'Stone',
    textureScale: 0.35,
    textureStrength: 0.6,
    roughness: 1,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
