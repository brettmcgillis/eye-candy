// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Cloud Connected';

export const PRESETS = {
  'Cloud Connected': {
    backgroundColor: '#87ceeb',
    syncEasing: 0.06,
    spread: 220,
    hueShift: 0,
    bobAmount: 14,
    bobSpeed: 0.4,
  },
  Waterworks: {
    backgroundColor: '#9b9b9b',
    syncEasing: 0.06,
    tiltGravity: false,
    gravity: 1800,
    maxParticles: 1200,
    particleRadius: 5,
    particleColor: '#3300ff',
    flipRatio: 0.9,
    pressureIters: 40,
    particleIters: 2,
    overRelaxation: 1.9,
    compensateDrift: true,
    separateParticles: true,
    worldWidth: 3200,
    worldHeight: 1800,
    whitewaterEnabled: true,
    maxDiffuseParticles: 4000,
    diffuseEmissionRate: 6,
    diffuseMinSpeed: 250,
    diffuseLifetime: 2.4,
    bubbleBuoyancy: 4,
    diffuseSize: 4,
    foamColor: '#ffffff',
    sprayColor: '#dff3ff',
    bubbleColor: '#9ec9ff',
  },
  'Gravity Rooms': {
    backgroundColor: '#8d8d8d',
    syncEasing: 0.06,
    signArrows: true,
    carModel: false,
    gravityAngle: 90,
    gravityStrength: 900,
    ballRadius: 16,
    carScale: 20,
    ballColor: '#ff0000',
    restitution: 0.65,
  },
  'Particles & Attractors': {
    backgroundColor: '#2b2320',
    syncEasing: 0.06,
    attractorStrength: 500,
    mouseStrength: 200,
    spinStrength: 1,
    particleCount: 600,
    featherScale: 60,
    damping: 0.995,
    maxSpeed: 700,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
