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
    palettePhase: 0.5,
    sphereCore: '#e8faff',
    sphereEdge: '#2f9dd6',
  },
  'Tight Passage': {
    ...SHARED,
    agentRadius: 0.014,
    altitude: 0.15,
    comfort: 0.02,
    cruiseSpeed: 0.025,
    followDistance: 0.12,
    followFov: 78,
    hugDistance: 0.02,
    lanternRange: 0.45,
    lookAhead: 0.03,
    margin: 0.015,
    minBoom: 0.025,
    sphereRadius: 0.006,
    worldScale: 34,
  },
  'Wide Dark': {
    ...SHARED,
    lanternRange: 1.2,
    lightIntensity: 1.6,
    renderScale: 0.45,
  },
  'The Sculpture': {
    ...SHARED,
    agentRunning: false,
    ambientStrength: 0.3,
    chaseCamera: false,
    lanternRange: 2.5,
    lightFacing: 0.35,
    worldScale: 4,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
