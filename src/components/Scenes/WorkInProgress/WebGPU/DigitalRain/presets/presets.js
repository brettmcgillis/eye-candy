// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    cameraMode: 'orbit',
    cameraAutoFit: true,
    fixedBehavior: 'single',
    fixedShotHeroDesktopPosition: { x: 20, y: 13, z: 28 },
    fixedShotHeroDesktopTarget: { x: 0, y: 6, z: 0 },
    fixedShotHeroDesktopFov: 42,
    fixedShotHeroMobilePosition: { x: 20, y: 13, z: 28 },
    fixedShotHeroMobileTarget: { x: 0, y: 6, z: 0 },
    fixedShotHeroMobileFov: 42,
    orbitAutoRotate: true,
    orbitAutoRotateSpeed: 3,
    orbitDesktopPosition: { x: 20, y: 13, z: 28 },
    orbitDesktopTarget: { x: 0, y: 6, z: 0 },
    orbitDesktopPivot: { x: 0, y: 6, z: 0 },
    orbitDesktopFov: 42,
    orbitMobilePosition: { x: 26, y: 15, z: 34 },
    orbitMobileTarget: { x: 0, y: 6, z: 0 },
    orbitMobilePivot: { x: 0, y: 6, z: 0 },
    orbitMobileFov: 52,
    splineDesktopTarget: { x: 0, y: 6, z: 0 },
    splineDesktopFov: 42,
    splineMobileTarget: { x: 0, y: 6, z: 0 },
    splineMobileFov: 42,
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

    // VoxelCloud — the cloud, a port of ~/dev/examples/clouds's
    // voxel-cloud approach (see components/VoxelCloud.jsx). The earlier
    // raymarched CloudVolume + its VoxelCutout excerpt have been removed.
    voxelCloudVisible: true,
    voxelCloudPosition: { x: 0, y: 10, z: 0 },
    voxelCloudWidth: 16,
    voxelCloudHeight: 10,
    voxelCloudDepth: 16,
    voxelCloudResolution: 56,
    voxelCloudSeed: 1,
    voxelCloudInflationPasses: 3,
    voxelCloudIsolation: 0.03,
    voxelCloudBlurIntensity: 1,
    voxelCloudBaseColor: '#ffffff',
    voxelCloudShadeColor1: '#a0a0a0',
    voxelCloudShadeColor2: '#0000a0',
    voxelCloudLightDirection: { x: 0.4, y: 0.85, z: 0.3 },

    // Rain — AngularFlowField (elements/AngularFlowField), keyPrefix 'rain'
    // to dodge Leva key collisions (docs/scene-conventions.md §9). Every
    // other rain* key is intentionally omitted here so it falls through to
    // getAngularFlowFieldControls' own defaults, which already match
    // ~/dev/examples/260323_DiscreteVectors exactly — only position (set in
    // DigitalRain.jsx from the cloud's bounds, not a Leva control) and
    // visibility are scene-specific.
    rainVisible: true,

    // Lighting
    lightAmbientIntensity: 0.5,
    lightKeyColor: '#fff4e0',
    lightKeyIntensity: 1.6,
    lightKeyPosition: { x: 10, y: 20, z: 8 },

    backgroundColor: '#020203',

    // PhotoStudio — the reusable studio-set model (elements/PhotoStudio) as
    // an alternative to the procedural Backdrop above. Off by default so it
    // doesn't collide with the backdrop until its transform is dialed in.
    photoStudioVisible: true,
    photoStudioPosition: { x: 0, y: 0, z: 0 },
    photoStudioScale: 12,
    photoStudioRotationY: 0,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
