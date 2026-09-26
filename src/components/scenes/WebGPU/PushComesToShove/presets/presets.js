import SCENE_DEFAULTS from './defaults';

export const DEFAULT_PRESET = 'Tight Squeeze';

export const PRESETS = {
  'Tight Squeeze': { ...SCENE_DEFAULTS },
  'Few Big Windows': {
    ...SCENE_DEFAULTS,
    holeScale: 0.18,
    holeThreshold: 0.6,
    holeWarp: 2.4,
    panelBevel: 0.14,
    panelThickness: 0.5,
  },
  'Loose Weave': {
    ...SCENE_DEFAULTS,
    wireCount: 340,
    wireSlack: 1.3,
    writheStrength: 5,
    sphereResistance: 0.06,
  },
  'Heavy Traffic': {
    ...SCENE_DEFAULTS,
    sphereCount: 14,
    sphereRadiusMin: 0.3,
    sphereRadiusMax: 0.5,
    sphereSpeed: 1.4,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
