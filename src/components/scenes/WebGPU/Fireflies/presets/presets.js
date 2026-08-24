// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    // Environment
    backgroundColor: '#02050d',
    // Flocking
    fireflyCount: 700,
    worldSize: 40,
    subDivisionCount: 8,
    habitatShape: 'box',
    maxSpeed: 9,
    alignWeight: 1.2,
    cohesionWeight: 1,
    separationWeight: 1.6,
    obstacleWeight: 2.5,
    boundaryWeight: 3,
    neighborRadius: 6,
    separationRadius: 2,
    obstacleMargin: 3,
    boundaryMargin: 6,
    showGrid: false,
    gridColor: '#334155',
    cellIlluminationEnabled: true,
    cellIlluminationColor: '#22d3ee',
    // Fireflies — nudgeFactor/confusionFactor match Floids' Agents.js
    // NUDGE_FACTOR/CONFUSION_FACTOR constants exactly (flashCycle already
    // matches its FIRE_CYCLE).
    flashCycle: 3,
    nudgeFactor: 0.01,
    nudgeLimit: 3,
    flashDecayRate: 3,
    bodySize: 0.35,
    glowSizeBoost: 0.6,
    glowIntensity: 2,
    bodyColor: '#6b7280',
    glowColor: '#ffe066',
    // Hunters
    hunterCount: 1,
    chaseFactor: 0.5,
    chaseEpsilon: 0.5,
    sightRadius: 14,
    fleeRadius: 8,
    fleeWeight: 3,
    confusionFactor: 0.2,
    hunterSpeed: 7,
    hunterMaxSpeed: 14,
    restoreTau: 0.4,
    hunterSize: 0.7,
    hunterColor: '#0a0a0a',
    hunterEmissiveColor: '#7f1d1d',
    hunterEmissiveIntensity: 1.5,
    // Obstacles
    obstacleCount: 6,
    obstacleMinRadius: 1.5,
    obstacleMaxRadius: 3,
    obstacleSpeed: 0,
    obstacleWander: 2,
    obstacleColor: '#4b5563',
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
