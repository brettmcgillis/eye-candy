import POLICE_PRESENCE_FIRE from '@presets/fire/policePresenceFire';

export const DEFAULT_PRESET = 'Day';

export const FIRE_INSTANCE_CONFIGS = [
  {
    id: 'windshieldFire',
    label: 'Windshield',
    splineName: 'Windshield Fire',
    fallbackPosition: { x: 0.6, y: 1.1, z: -4 },
    defaultBendX: -0.3,
    defaultBendZ: 0.15,
  },
  {
    id: 'driverWindowFire',
    label: 'Driver Window',
    splineName: 'Driver Window Fire',
    fallbackPosition: { x: 0, y: 1, z: -4.72 },
    defaultBendX: -0.1,
    defaultBendZ: -0.4,
  },
  {
    id: 'passengerWindowFire',
    label: 'Passenger Window',
    splineName: 'Passenger Window Fire',
    fallbackPosition: { x: 0, y: 1, z: -3.28 },
    defaultBendX: -0.1,
    defaultBendZ: 0.4,
  },
  {
    id: 'hoodFire',
    label: 'Hood',
    splineName: 'Hood Fire',
    fallbackPosition: { x: 1.4, y: 0.85, z: -4 },
    defaultBendX: 0.2,
    defaultBendZ: 0.1,
  },
  {
    id: 'roofFire',
    label: 'Roof',
    splineName: 'Roof Fire',
    fallbackPosition: { x: -0.4, y: 1.25, z: -4 },
    defaultBendX: -0.5,
    defaultBendZ: -0.1,
  },
];

export const CINDERBLOCK_CONFIGS = [
  {
    id: 'cinderBlock1',
    label: 'Front Left',
    position: { x: 1.417, y: 0.303, z: -4.737 },
    rotation: { x: 180, y: 0, z: 180 },
    scale: { x: 0.79, y: 0.79, z: 0.589 },
  },
  {
    id: 'cinderBlock2',
    label: 'Rear Left',
    position: { x: -1.234, y: 0.303, z: -4.737 },
    rotation: { x: 180, y: 0, z: 180 },
    scale: { x: 0.79, y: 0.79, z: 0.589 },
  },
  {
    id: 'cinderBlock3',
    label: 'Front Right',
    position: { x: 1.417, y: 0.303, z: -3.261 },
    rotation: { x: 0, y: 0, z: -180 },
    scale: { x: 0.79, y: 0.79, z: 0.589 },
  },
  {
    id: 'cinderBlock4',
    label: 'Rear Right',
    position: { x: -1.234, y: 0.303, z: -3.261 },
    rotation: { x: 0, y: 0, z: -180 },
    scale: { x: 0.79, y: 0.79, z: 0.589 },
  },
];

function getSpline(name) {
  return POLICE_PRESENCE_FIRE.splines?.find((spline) => spline.name === name);
}

function buildFireControlValues(config) {
  const spline = getSpline(config.splineName);

  return {
    [`${config.id}Visible`]: true,
    [`${config.id}Width`]: spline?.fireWidth ?? 1,
    [`${config.id}Depth`]: spline?.fireDepth ?? 1,
    [`${config.id}Height`]: spline?.fireHeight ?? 1.5,
    [`${config.id}BendX`]: config.defaultBendX,
    [`${config.id}BendZ`]: config.defaultBendZ,
    [`${config.id}Animated`]: spline?.fireAnimated ?? true,
    [`${config.id}AnimSpeed`]: spline?.fireAnimSpeed ?? 0.5,
    [`${config.id}Magnitude`]: spline?.fireMagnitude ?? 1.3,
    [`${config.id}Brightness`]: spline?.fireBrightness ?? 1.5,
  };
}

function buildCinderblockControlValues(config) {
  return {
    [`${config.id}Position`]: { ...config.position },
    [`${config.id}Rotation`]: { ...config.rotation },
    [`${config.id}Scale`]: { ...config.scale },
  };
}

const smokeColumn = getSpline('Smoke Column');

const BASE_SCENE_PRESET = {
  backgroundColor: '#f5f5f5',
  floorVisible: false,
  floorColor: '#0f141a',
  floorPosition: { x: 0, y: -0.02, z: -4 },
  floorRotation: { x: -90, y: 0, z: 0 },
  floorScale: { x: 24, y: 1, z: 24 },
  floorRoughness: 0.96,
  floorMetalness: 0.04,
  cameraPosition: { x: 7, y: 3.5, z: -1 },
  cameraTarget: { x: 0, y: 1, z: -4 },
  cameraFov: 45,
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.6,
  directionalLightColor: '#ffffff',
  directionalLightPosition: { x: 5, y: 6, z: 2 },
  directionalLightIntensity: 0.8,
  showTires: true,
  showCinderblocks: false,
  smokeVisible: true,
  smokeClosed: smokeColumn?.closed ?? false,
  smokeTension: smokeColumn?.tension ?? 0.5,
  smokePrefillOnStart: smokeColumn?.prefillOnStart ?? true,
  smokeParticleCount: smokeColumn?.particleCount ?? 400,
  smokeParticleSize: smokeColumn?.particleSize ?? 70,
  smokeParticleColor: smokeColumn?.particleColor ?? '#161616',
  smokeOpacity: smokeColumn?.opacity ?? 0.09,
  smokeGrowth: smokeColumn?.growth ?? 3.5,
  smokeFadeExponent: smokeColumn?.fadeExponent ?? 1.3,
  smokeSpringK: smokeColumn?.springK ?? 1,
  smokeFlowSpeed: smokeColumn?.flowSpeed ?? 0.12,
  smokeDamping: smokeColumn?.damping ?? 0.93,
  smokeTurbulence: smokeColumn?.turbulence ?? 0.6,
  smokeTurbulenceSpeed: smokeColumn?.turbulenceSpeed ?? 0.35,
  smokeBuoyancy: smokeColumn?.buoyancy ?? 0.8,
  smokeRotSpeed: smokeColumn?.rotSpeed ?? 0.2,
  smokeFadeRate: smokeColumn?.fadeRate ?? 1.5,
  smokeSpawnSpread: smokeColumn?.spawnSpread ?? 0.9,
  smokeMaxDrift: smokeColumn?.maxDrift ?? 4,
  smokeBlendMode: smokeColumn?.blendMode ?? 'Normal',
  ...FIRE_INSTANCE_CONFIGS.reduce(
    (acc, config) => ({
      ...acc,
      ...buildFireControlValues(config),
    }),
    {}
  ),
  ...CINDERBLOCK_CONFIGS.reduce(
    (acc, config) => ({
      ...acc,
      ...buildCinderblockControlValues(config),
    }),
    {}
  ),
};

export const PRESETS = {
  [DEFAULT_PRESET]: {
    ...BASE_SCENE_PRESET,
  },
  Night: {
    ...BASE_SCENE_PRESET,
    backgroundColor: '#06090f',
    floorVisible: true,
    floorColor: '#0a1017',
    ambientLightColor: '#d6deff',
    ambientLightIntensity: 0.24,
    directionalLightColor: '#9ab4ff',
    directionalLightPosition: { x: 4.5, y: 5.5, z: 1.5 },
    directionalLightIntensity: 0.35,
    showTires: false,
    showCinderblocks: true,
  },
};

export default PRESETS;
