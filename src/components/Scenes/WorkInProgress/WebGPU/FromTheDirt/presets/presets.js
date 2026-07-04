import { FONT_OPTIONS } from '../components/getTextControls';

// Preset snapshots. Keys match the Leva schema 1:1 — flat, globally-unique
// keys, no reshaping (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Sunny Afternoon';

export const PRESETS = {
  'Sunny Afternoon': {
    // Text
    text: 'FUCK',
    fontFamily: FONT_OPTIONS['Arial Black'],
    fontWeight: '900',
    textScale: 0.72,
    letterSpacing: 0.02,
    textRotation: 0,
    edgeSoftness: 0,
    // Terrain
    seed: 7,
    hillAmplitude: 1.6,
    hillFrequency: 0.1,
    terrainRotation: 0,
    topsoilDepth: 0.35,
    strataScale: 3.2,
    grassColorA: '#4a7a2e',
    grassColorB: '#6f9a3d',
    topsoilColor: '#4a3320',
    strataLight: '#c2a878',
    strataDark: '#8a6f4d',
    terrainCastShadow: true,
    // Water
    waterLevel: -0.9,
    pitDepth: 0.7,
    waterColor: '#2c6d66',
    waterOpacity: 0.85,
    rippleScale: 1.6,
    rippleSpeed: 0.5,
    rippleStrength: 0.5,
    // Grass
    grassCount: 150000,
    bladeHeight: 0.34,
    bladeWidth: 0.05,
    bladeBend: 0.45,
    clumpSize: 0.2,
    clumpPull: 0.02,
    backlightStrength: 0.5,
    rootColor: '#2f5c1e',
    tipColor: '#8fb84a',
    windStrength: 0.35,
    windSpeed: 0.7,
    windScale: 0.35,
    windDirX: 1,
    windDirZ: 0.35,
    // Seeds
    seedCount: 220,
    seedSize: 0.05,
    // Sky
    sunIntensity: 3.2,
    sunColor: '#fff1d6',
    sunAzimuth: 40,
    sunElevation: 50,
    hemiIntensity: 0.55,
    skyColor: '#cfe8ff',
    groundColor: '#6a7a4d',
    bgColor: '#aed4f0',
    cloudCoverage: 0.45,
    cloudScale: 0.06,
    cloudSpeed: 1,
    globalMotionSpeed: 1,
    cloudFloor: 0.62,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
