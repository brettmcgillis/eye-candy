export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    cameraMode: 'orbit',
    orbitAutoRotate: false,
    orbitMinDistance: 12,
    orbitMaxDistance: 60,
    orbitMaxDistanceUnlimited: false,
    orbitMinPolarAngle: 58.44,
    orbitMaxPolarAngle: 88.24,
    orbitMinAzimuthAngle: -42.97,
    orbitMaxAzimuthAngle: 42.97,
    orbitAzimuthUnlimited: false,
    orbitDesktopPosition: { x: 6, y: 5, z: 40 },
    orbitDesktopTarget: { x: 0, y: 9, z: 0 },
    orbitDesktopFov: 42,
    orbitMobilePosition: { x: 8, y: 6, z: 52 },
    orbitMobileTarget: { x: 0, y: 9, z: 0 },
    orbitMobileFov: 55,

    lightKeyIntensity: 2.6,

    backgroundColor: '#aeb7bd',
    fogColor: '#b3bcc2',
    fogDensity: 0.01,

    // Terrain — soil studio defaults, moss on, gently damp (see intent).
    moundScale: 0.12,
    moundDepth: 1.1,
    moundCoverage: 1,
    moundEdge: 0.15,
    bumpScale: 0.7,
    bumpStrength: 0.6,
    terrainSeed: 0,
    mossEnabled: true,
    mossScale: 0.14,
    mossCoverage: 0.6,
    mossEdge: 0.14,
    mossDepth: 0.16,
    mossBumpScale: 0.9,
    mossBumpStrength: 0.7,
    mossTextureScale: 0.35,
    mossColor: '#f4f4f4',
    mossRoughness: 1,
    mossAoStrength: 1,
    soilColor: '#e6ded2',
    soilTextureScale: 0.35,
    soilNormalScale: 1,
    varScale: 0.08,
    varAmount: 0.28,
    moisture: 0.32,
    moistScale: 0.18,
    moistEdge: 0.12,
    wetDarken: 0.55,
    wetRoughness: 0.32,

    // Building
    buildingVisible: true,
    buildingPosition: { x: -3, y: 0, z: -2 },
    buildingRotation: { x: 0, y: -1.5708, z: 0 },
    buildingScale: 1,

    // Windows (positions derived from the model's window meshes)
    windowsEnabled: true,
    winTargetWidth: 2,
    winTargetHeight: 2.4,
    winFill: 1,
    winInset: 0.05,
    glassColor: '#a9bcc6',
    glassOpacity: 0.34,
    frameColor: '#33363a',
    frameThickness: 0.02,
    frameDepth: 0.3,

    // Grass
    grassEnabled: false,
    grassDensity: 0.4,
    grassCoverage: 0.62,
    grassMaskScale: 0.15,
    grassMaskEdge: 0.25,
    bladeHeight: 1.5,
    bladeWidth: 0.06,
    bladeBend: 0.7,
    grassRootColor: '#33421b',
    grassTipColor: '#9bc24a',
    grassTranslucency: 0.6,
    windAngle: 0.35,
    windStrength: 0.55,
    windSpeed: 1,
    windScale: 0.12,
    disturbRadius: 1.6,
    disturbStrength: 1.2,

    // Rocks
    rockScale: 0.5,
    rockSpeed: 28,
    rockSpin: 12,
    rockGravity: 20,

    showRapierDebug: false,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
