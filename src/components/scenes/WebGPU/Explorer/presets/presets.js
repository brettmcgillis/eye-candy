import { DEFAULTS } from '../components/getExplorerControls';

export const DEFAULT_PRESET = 'Ember';

const SHARED = {
  ...DEFAULTS,
  cameraMode: 'orbit',
  chaseCamera: true,
};

export const PRESETS = {
  Ember: {
    ...SHARED,
  },
  'Cold Signal': {
    ...SHARED,
    albedo: '#7d8794',
    ambientColor: '#080d18',
    ambientStrength: 0.2,
    lightColor: '#7fd4ff',
    lightIntensity: 8,
    sphereCore: '#e8faff',
    sphereEdge: '#2f9dd6',
    saturation: -0.2,
  },
  'Tight Passage': {
    ...SHARED,
    comfort: 0.05,
    cruiseSpeed: 0.08,
    followDistance: 0.09,
    followFov: 78,
    lanternRange: 0.6,
    lightIntensity: 4,
    lookAhead: 0.14,
    margin: 0.06,
    worldScale: 34,
  },
  'Wide Dark': {
    ...SHARED,
    lanternRange: 2.2,
    lightIntensity: 10,
    renderScale: 0.45,
  },
  'The Sculpture': {
    ...SHARED,
    agentRunning: false,
    ambientStrength: 0.6,
    chaseCamera: false,
    confine: true,
    lanternRange: 2.5,
    lightIntensity: 12,
    worldScale: 4,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
