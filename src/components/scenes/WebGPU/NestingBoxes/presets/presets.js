// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/nestingBoxes';

export const DEFAULT_PRESET = 'Tree of Boxes';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
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
  Arcology: {
    ...BASE,
    levels: 8,
    identityLevel: 4,
    colorMode: 'palette',
    paletteName: 'Midnight City',
    paletteSource: 'height',
    paletteRepeat: 1,
    paletteShift: 0,
    windowPaletteMatch: 0.6,
    surface: 'Concrete',
    textureScale: 1.5,
    textureStrength: 0.6,
    roughness: 0.9,
    weathering: 0.3,
    background: '#141a2a',
    fogEnabled: true,
    fogColor: '#27324d',
    fogNear: 6,
    fogFar: 22,
    windowsEnabled: true,
    lightSkySkyColor: '#5a6f9e',
    lightSkyGroundColor: '#1a120c',
    lightSkyIntensity: 0.6,
    lightKeyColor: '#9fb4ff',
    lightKeyIntensity: 0.6,
    postBloomEnabled: true,
    postBloomThreshold: 0.8,
    postBloomStrength: 0.6,
    postBloomRadius: 0.5,
    growMode: 'animate',
    growNewSeed: false,
    growLevelSeconds: 1.2,
    growHoldSeconds: 18,
    driftEnabled: true,
    driftSpeed: 0.25,
    driftBias: 2.5,
    placementDriftX: 0.08,
    placementDriftY: 0.05,
    placementDriftZ: 0.08,
    sizeDriftX: 0.05,
    sizeDriftY: 0.03,
    sizeDriftZ: 0.05,
    tintDrift: 0,
  },
};

// Saved from NestingBoxesCLI: only what differs from the scene defaults.
const SNAPSHOTS = {};

Object.entries(SNAPSHOTS).forEach(([name, snapshot]) => {
  PRESETS[name] = { ...BASE, ...snapshot };
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
