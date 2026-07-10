// Preset snapshots for the scene. Keys match the Leva schema built in
// useSceneControls 1:1 — flat, globally-unique keys, no reshaping (see
// docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Night Meadow';

export const PRESETS = {
  'Night Meadow': {
    // World
    seed: 7,
    hillAmplitude: 2.2,
    hillFrequency: 0.045,
    valleyAmplitude: 2.6,
    valleyFrequency: 0.012,
    waterLevel: -1.4,
    chunkRadius: 2,
    terrainSegments: 48,
    // Paths
    pathEnabled: true,
    pathFrequency: 0.016,
    pathWidth: 0.05,
    pathDepth: 0.18,
    // Terrain colors
    groundColor: '#24371f',
    groundColorAlt: '#1b2a2e',
    pathColor: '#4a3b2c',
    shoreColor: '#3a3428',
    // Grass
    bladesPerChunk: 60000,
    grassRingDensity: 0.4,
    grassChunkRadius: 1,
    clumpSize: 0.9,
    bladeHeight: 0.85,
    bladeWidth: 0.06,
    bladeBend: 0.35,
    grassRootColor: '#17301c',
    grassTipColor: '#5d9158',
    backlightStrength: 0.8,
    windDirX: 1,
    windDirZ: 0.35,
    windScale: 0.12,
    windSpeed: 0.9,
    windStrength: 0.5,
    touchRadius: 2.6,
    touchStrength: 0.9,
    // Flowers
    flowersPerChunk: 16,
    flowerScale: 0.22,
    // Sky
    skyTint: '#b8c4e6',
    skyTextureRepeat: 1,
    moonAzimuth: 40,
    moonElevation: 32,
    moonSize: 26,
    moonColor: '#e8ecff',
    moonEmissiveIntensity: 1.6,
    moonLightColor: '#8fa4d9',
    moonLightIntensity: 1.6,
    ambientColor: '#4a5a8a',
    ambientIntensity: 0.9,
    skyGlowColor: '#2c3a5c',
    groundGlowColor: '#16231a',
    hemisphereIntensity: 0.6,
    // Fog
    fogEnabled: true,
    fogColor: '#1a2438',
    fogTop: 0.8,
    fogBottom: -1.8,
    fogPoolDensity: 0.55,
    fogNoiseScale: 0.045,
    fogNoiseAmount: 0.7,
    fogWindSpeed: 0.6,
    fogDistanceNear: 60,
    fogDistanceFar: 170,
    fogHazeStrength: 0.7,
    // Mountains
    mountainsEnabled: true,
    mountainRadius: 320,
    mountainHeight: 60,
    mountainColor: '#111c33',
    // Water
    waterEnabled: true,
    waterColor: '#16283a',
    waterOpacity: 0.78,
    waterViscosity: 0.96,
    waterDisturbSize: 0.9,
    waterDisturbDepth: 0.22,
    waterSimSpeed: 5,
    waterTouchHeight: 1.4,
    // Settings (abandoned prop scenes)
    settingsEnabled: true,
    settingDensity: 0.45,
    // Fireflies
    firefliesEnabled: true,
    fireflyCount: 220,
    fireflyColor: '#ffe28a',
    fireflyIntensity: 3,
    fireflySize: 0.06,
    fireflySpeed: 0.7,
    // Audio
    windVolume: 0.5,
    ambienceVolume: 0.35,
    frogVolume: 0.6,
    // Character
    ghostSkin: 'Hero',
    ghostScale: 2.5,
    clothSegments: 40,
    ghostEmissiveIntensity: 0.35,
    ghostGlowColor: '#88ccff',
    ghostGlowIntensity: 0.6,
    maxVelLimit: 3,
    sprintMult: 2,
    jumpVel: 4,
    floatHeight: 0.55,
    camInitDis: -8,
    camMaxDis: -14,
    camMinDis: -0.8,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
