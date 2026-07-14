// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Default';

// Phase 1 ships only this one preset (core CA compute/growth/palette + the
// Windswept-style godray/light centerpiece). The other three from the
// original ask — Cloud + Flow Field, Fixed Megalith, Fixed With Growth
// Pockets — are explicitly Phase 2, tracked in todo.md, not implemented here.
export const PRESETS = {
  Default: {
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
    growthDurationSeconds: 3,
    growthJitter: 0.8,
    // 'state' colorMode + these three colors reproduces the reference's
    // per-state stateColors ['#fe6c6c', '#4fceee', '#fdbd81'] exactly — the
    // state colorMode only ever samples t at {0, 0.5, 1}, landing squarely on
    // paletteStart/Mid/End with no in-between blending.
    colorMode: 'state',
    paletteStart: '#ff0000',
    paletteMid: '#ffffff',
    paletteEnd: '#7c7c7c',
    paletteMidpoint: 0.5,
    // Lighting settings match ~/dev/examples/260708_AutomataChunks's own
    // DEFAULT_SETTINGS exactly — see components/LightRig.jsx.
    lightAzimuth: 25.65,
    lightElevation: 68.7,
    keyLightIntensity: 2.41,
    ambientIntensity: 0.3,
    rimLightIntensity: 0.49,
    bounceLightIntensity: 0.07,
    shadowIntensity: 1.08,
    shadowSoftness: 2.6,
    exposure: 0.7,
    godraysEnabled: false,
    godraysColor: '#ffd27a',
    godraysIntensity: 20,
    godraysBlendColor: '#ffd27a',
    godraysVolumeSize: 80,
    godraysDensity: 0.7,
    godraysMaxDensity: 0.5,
    godraysDistanceAttenuation: 2,
    godraysRaymarchSteps: 60,
    godraysBlur: false,
    godraysEdgeRadius: 2,
    godraysEdgeStrength: 2,
    // flowField* settings match ~/dev/examples/260323_DiscreteVectors's own
    // index.html defaults exactly (keyPrefix'd to dodge the seed/colorMode
    // collisions with VoxelField/Palette above — see useSceneControls.js).
    flowFieldVisible: false,
    flowFieldAnimationEnabled: false,
    flowFieldLength: 48,
    flowFieldLoopEnabled: true,
    flowFieldRenderMode: 'tube',
    flowFieldEmitterCountX: 6,
    flowFieldEmitterCountY: 6,
    flowFieldEmitterCountZ: 6,
    flowFieldSpacingX: 0.05,
    flowFieldSpacingY: 0.05,
    flowFieldSpacingZ: 0.05,
    flowFieldGenerationDistance: 0.1,
    flowFieldDiscreteResolution: 2,
    flowFieldNoiseScale: 0.65,
    flowFieldNoiseSpeed: 0.22,
    flowFieldNoiseStrength: 1,
    flowFieldOctaves: 1,
    flowFieldLacunarity: 2,
    flowFieldGain: 0.5,
    flowFieldWarpStrength: 0,
    flowFieldWarpScale: 1.2,
    flowFieldVorticity: 1,
    flowFieldAttraction: 0.25,
    flowFieldRepulsion: 0.1,
    flowFieldAlignmentStrength: 0.7,
    flowFieldAlignmentRadius: 0.16,
    flowFieldDivergenceStrength: 0,
    flowFieldDivergenceRadius: 0.16,
    flowFieldDamping: 0.985,
    flowFieldSeed: 351107,
    flowFieldColorMode: 'age',
    flowFieldColorStart: '#b19eff',
    flowFieldColorEnd: '#ffae00',
    flowFieldCurvatureContrast: 1.4,
    flowFieldCurvatureBias: -0.4,
    flowFieldGradientBlur: 0.35,
    flowFieldThicknessMin: 1,
    flowFieldThicknessMax: 3,
    flowFieldThicknessSeed: 0,
    flowFieldPointSize: 0.045,
    flowFieldEmissiveIntensity: 1.2,
    flowFieldRoughness: 0.5,
    flowFieldMetalness: 0.1,
    flowFieldOpacity: 1,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
