// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Godray Growth';

// Phase 1 ships only this one preset (core CA compute/growth/palette + the
// Windswept-style godray/light centerpiece). The other three from the
// original ask — Cloud + Flow Field, Fixed Megalith, Fixed With Growth
// Pockets — are explicitly Phase 2, tracked in todo.md, not implemented here.
export const PRESETS = {
  'Godray Growth': {
    cameraMode: 'orbit',
    cameraAutoFit: true,
    fixedBehavior: 'single',
    fixedShotHeroDesktopPosition: { x: 64, y: 48, z: 96 },
    fixedShotHeroDesktopTarget: { x: 0, y: 0, z: 0 },
    fixedShotHeroDesktopFov: 45,
    fixedShotHeroMobilePosition: { x: 64, y: 48, z: 96 },
    fixedShotHeroMobileTarget: { x: 0, y: 0, z: 0 },
    fixedShotHeroMobileFov: 45,
    orbitAutoRotate: true,
    orbitAutoRotateSpeed: 4,
    orbitDesktopPosition: { x: 64, y: 48, z: 96 },
    orbitDesktopTarget: { x: 0, y: 0, z: 0 },
    orbitDesktopPivot: { x: 0, y: 0, z: 0 },
    orbitDesktopFov: 45,
    orbitMobilePosition: { x: 80, y: 60, z: 120 },
    orbitMobileTarget: { x: 0, y: 0, z: 0 },
    orbitMobilePivot: { x: 0, y: 0, z: 0 },
    orbitMobileFov: 55,
    splineDesktopTarget: { x: 0, y: 0, z: 0 },
    splineDesktopFov: 45,
    splineMobileTarget: { x: 0, y: 0, z: 0 },
    splineMobileFov: 45,
    splineOrientationMode: 'target',
    splineForwardDistance: 1,
    splinePosition: { x: 0, y: 0, z: 0 },
    splineScale: { x: 1, y: 1, z: 1 },
    splineDuration: 30,
    splineTension: 0.5,
    splineClosed: true,
    splineShowPath: false,
    operatorMoveSpeed: 6,
    operatorLiftSpeed: 6,
    operatorBoostMultiplier: 2,
    operatorPointerLookSensitivity: 0.003,
    operatorStickLookSpeed: 2.5,
    operatorZoomSpeed: 24,
    operatorMinFov: 20,
    operatorMaxFov: 80,
    // CA generation settings match ~/dev/examples/260708_AutomataChunks's own
    // DEFAULT_SETTINGS (types.ts) exactly, so the structure this preset grows
    // is the same one that reference renders — level 7 alone is a ~7.8x
    // instance-count jump from level 6 (2,146,689 vs 274,625), so watch frame
    // time if you dial it down for perf.
    level: 7,
    seed: 260708,
    baseFill: 'random',
    ruleMode: 'random',
    density: 0.34,
    beta: 0.56,
    magnetism: 0.1,
    flipChance: 0.02,
    removeStrays: true,
    cellSpacing: 0.6,
    cellScale: 0.6,
    growthEnabled: true,
    growthDurationSeconds: 14,
    growthJitter: 0.8,
    // 'state' colorMode + these three colors reproduces the reference's
    // per-state stateColors ['#fe6c6c', '#4fceee', '#fdbd81'] exactly — the
    // state colorMode only ever samples t at {0, 0.5, 1}, landing squarely on
    // paletteStart/Mid/End with no in-between blending.
    colorMode: 'state',
    paletteStart: '#fe6c6c',
    paletteMid: '#4fceee',
    paletteEnd: '#fdbd81',
    paletteMidpoint: 0.5,
    godraysEnabled: true,
    godraysColor: '#ffd27a',
    godraysIntensity: 20,
    godraysBlendColor: '#ffd27a',
    godraysVolumeSize: 80,
    godraysDensity: 0.7,
    godraysMaxDensity: 0.5,
    godraysDistanceAttenuation: 2,
    godraysRaymarchSteps: 60,
    godraysBlur: true,
    godraysEdgeRadius: 2,
    godraysEdgeStrength: 2,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
