import { buildSceneCameraControlValues } from '@modules/cameraRig';

import {
  BACKGROUND,
  CAMERA,
  DEFAULT_FIRE_AUDIO,
  DEFAULT_SHOT_TUNING_MODE,
  FOG_RANGE,
  SHOT_TUNING_PRESETS,
  SIDEWALK_GROUND,
} from '../utils/sceneData';

export const DEFAULT_PRESET = 'Default';

export const DEFAULT_FIRE_LIGHT_RIG = Object.freeze({
  enabled: true,
  color: '#ff7a1f',
  intensity: 12,
  intensityJitter: 3.75,
  secondaryJitter: 1.25,
  distance: 1.5,
  decay: 1.4,
  flickerSpeed: 7,
  swayX: 0.08,
  swayY: 0.05,
  swayZ: 0.08,
  leftX: 0.15,
  leftY: 0.75,
  leftZ: 0,
  rightX: 1.15,
  rightY: 0.45,
  rightZ: 0,
});

const DEFAULT_SCENE_ENVIRONMENT = Object.freeze({
  sceneBackgroundColor: BACKGROUND,
  sceneFogColor: BACKGROUND,
  sceneFogNear: FOG_RANGE[0],
  sceneFogFar: FOG_RANGE[1],
  sceneAmbientIntensity: 0.85,
  sceneDirectionalIntensity: 1.15,
  sceneEnvMapIntensity: 1.0,
});

const DEFAULT_CAMERA_CONTROLS = Object.freeze(
  buildSceneCameraControlValues(CAMERA)
);

const DEFAULT_COMBUSTION_CONTROLS = Object.freeze({
  showEffects: true,
  editSplines: false,
  igniteOnHit: false,
  cursorAttractorEnabled: true,
  showCursorAttractor: false,
  cursorAttractorMode: 'attractor',
  cursorAttractorStrength: 3,
  cursorAttractorRadius: 3,
});

const DEFAULT_PHYSICS_CONTROLS = Object.freeze({
  physicsDebug: false,
});

const DEFAULT_GROUND_CONTROLS = Object.freeze({
  sidewalkGroundEnabled: SIDEWALK_GROUND.enabled,
  sidewalkLength: SIDEWALK_GROUND.length,
  sidewalkRows: SIDEWALK_GROUND.rows,
  sidewalkRotationDeg: SIDEWALK_GROUND.rotationDeg,
  sidewalkPosition: { ...SIDEWALK_GROUND.position },
});

const DEFAULT_DUMPSTER_CONTROLS = Object.freeze({
  dumpsterLeftLidRotation: -1.0,
  dumpsterRightLidRotation: -1.5,
});

const DEFAULT_BRICK_WALL_CONTROLS = Object.freeze({
  brickWallEnabled: true,
  brickWallLength: 25,
  brickWallHeight: 4.5,
  brickWallTintColor: '#a35245',
  brickWallPosition: { x: -4.5, y: 1, z: 3 },
});

const defaultShotTuning =
  SHOT_TUNING_PRESETS[DEFAULT_SHOT_TUNING_MODE] ||
  SHOT_TUNING_PRESETS.Realistic;
const brickWallShotTuning = SHOT_TUNING_PRESETS.Fun || defaultShotTuning;

const DEFAULT_TRASH_BLASTER_CONTROLS = Object.freeze({
  shotMode: DEFAULT_SHOT_TUNING_MODE,
  shotSpawnOffset: defaultShotTuning.spawnOffset,
  shotSpeed: defaultShotTuning.speed,
  shotBaseVerticalBoost: defaultShotTuning.baseVerticalBoost,
  shotPointerVerticalBoost: defaultShotTuning.pointerVerticalBoost,
  shotSpinX: defaultShotTuning.spinX,
  shotSpinY: defaultShotTuning.spinY,
  shotSpinZ: defaultShotTuning.spinZ,
});

const DEFAULT_THROW_FX_CONTROLS = Object.freeze({
  throwWhooshEnabled: true,
  throwWindUpEnabled: true,
  throwWindUpDuration: 0.14,
  throwTrailEnabled: true,
  throwLaunchKickEnabled: true,
  throwLaunchKickStrength: 1,
});

const DEFAULT_CONTROL_VALUES = Object.freeze({
  ...DEFAULT_SCENE_ENVIRONMENT,
  ...DEFAULT_CAMERA_CONTROLS,
  ...DEFAULT_PHYSICS_CONTROLS,
  ...DEFAULT_GROUND_CONTROLS,
  ...DEFAULT_DUMPSTER_CONTROLS,
  ...DEFAULT_BRICK_WALL_CONTROLS,
  ...DEFAULT_TRASH_BLASTER_CONTROLS,
  ...DEFAULT_THROW_FX_CONTROLS,
  ...DEFAULT_COMBUSTION_CONTROLS,
  fireLightEnabled: DEFAULT_FIRE_LIGHT_RIG.enabled,
  fireLightColor: DEFAULT_FIRE_LIGHT_RIG.color,
  fireLightIntensity: DEFAULT_FIRE_LIGHT_RIG.intensity,
  fireLightIntensityJitter: DEFAULT_FIRE_LIGHT_RIG.intensityJitter,
  fireLightSecondaryJitter: DEFAULT_FIRE_LIGHT_RIG.secondaryJitter,
  fireLightDistance: DEFAULT_FIRE_LIGHT_RIG.distance,
  fireLightDecay: DEFAULT_FIRE_LIGHT_RIG.decay,
  fireLightFlickerSpeed: DEFAULT_FIRE_LIGHT_RIG.flickerSpeed,
  fireLightSwayX: DEFAULT_FIRE_LIGHT_RIG.swayX,
  fireLightSwayY: DEFAULT_FIRE_LIGHT_RIG.swayY,
  fireLightSwayZ: DEFAULT_FIRE_LIGHT_RIG.swayZ,
  fireLightLeftX: DEFAULT_FIRE_LIGHT_RIG.leftX,
  fireLightLeftY: DEFAULT_FIRE_LIGHT_RIG.leftY,
  fireLightLeftZ: DEFAULT_FIRE_LIGHT_RIG.leftZ,
  fireLightRightX: DEFAULT_FIRE_LIGHT_RIG.rightX,
  fireLightRightY: DEFAULT_FIRE_LIGHT_RIG.rightY,
  fireLightRightZ: DEFAULT_FIRE_LIGHT_RIG.rightZ,
  fireAudioEnabled: DEFAULT_FIRE_AUDIO.enabled,
  fireAudioVolume: DEFAULT_FIRE_AUDIO.volume,
  fireAudioRefDistance: DEFAULT_FIRE_AUDIO.refDistance,
  fireAudioRolloff: DEFAULT_FIRE_AUDIO.rolloffFactor,
  fireAudioMaxDistance: DEFAULT_FIRE_AUDIO.maxDistance,
  fireAudioOffsetX: DEFAULT_FIRE_AUDIO.offsetX,
  fireAudioOffsetY: DEFAULT_FIRE_AUDIO.offsetY,
  fireAudioOffsetZ: DEFAULT_FIRE_AUDIO.offsetZ,
});

export const PRESET_CONTROL_KEYS = Object.freeze(
  Object.keys(DEFAULT_CONTROL_VALUES)
);

const DEFAULT_PRESET_SNAPSHOT = Object.freeze({
  ...DEFAULT_CONTROL_VALUES,
});

const DARK_MODE_PARTICLE_COLORS = Object.freeze({
  particleColor: '#d4d9df',
  volColor: '#b8c0ca',
});

export const PRESETS = {
  [DEFAULT_PRESET]: DEFAULT_PRESET_SNAPSHOT,
  Ignition: {
    ...DEFAULT_PRESET_SNAPSHOT,
    showEffects: false,
    igniteOnHit: true,
  },
  'Brick Blaster': {
    ...DEFAULT_PRESET_SNAPSHOT,
    shotMode: 'Fun',
    shotSpawnOffset: brickWallShotTuning.spawnOffset,
    shotSpeed: brickWallShotTuning.speed,
    shotBaseVerticalBoost: brickWallShotTuning.baseVerticalBoost,
    shotPointerVerticalBoost: brickWallShotTuning.pointerVerticalBoost,
    shotSpinX: brickWallShotTuning.spinX,
    shotSpinY: brickWallShotTuning.spinY,
    shotSpinZ: brickWallShotTuning.spinZ,
    sceneFogColor: '#ddd2c8',
  },
  'Default Repeller': {
    ...DEFAULT_PRESET_SNAPSHOT,
    cursorAttractorMode: 'repeller',
  },
  'Dark Mode': {
    ...DEFAULT_PRESET_SNAPSHOT,
    brickWallTintColor: '#d66d5d',
    sceneBackgroundColor: '#0c1014',
    sceneFogColor: '#10161d',
    sceneAmbientIntensity: 0,
    sceneDirectionalIntensity: 1.5,
    sceneEnvMapIntensity: 0,
    fireLightIntensity: 18,
    particleSmokeColorOverrides: [DARK_MODE_PARTICLE_COLORS.particleColor],
    particleSmokeVolumeColorOverrides: [DARK_MODE_PARTICLE_COLORS.volColor],
  },
  'Dark Mode Repeller': {
    ...DEFAULT_PRESET_SNAPSHOT,
    brickWallTintColor: '#d66d5d',
    cursorAttractorMode: 'repeller',
    sceneBackgroundColor: '#0c1014',
    sceneFogColor: '#10161d',
    sceneAmbientIntensity: 0,
    sceneDirectionalIntensity: 1.5,
    sceneEnvMapIntensity: 0,
    fireLightIntensity: 18,
    particleSmokeColorOverrides: [DARK_MODE_PARTICLE_COLORS.particleColor],
    particleSmokeVolumeColorOverrides: [DARK_MODE_PARTICLE_COLORS.volColor],
  },
  'Dark Mode Brick Blaster': {
    ...DEFAULT_PRESET_SNAPSHOT,
    brickWallTintColor: '#d66d5d',
    shotMode: 'Fun',
    shotSpawnOffset: brickWallShotTuning.spawnOffset,
    shotSpeed: brickWallShotTuning.speed,
    shotBaseVerticalBoost: brickWallShotTuning.baseVerticalBoost,
    shotPointerVerticalBoost: brickWallShotTuning.pointerVerticalBoost,
    shotSpinX: brickWallShotTuning.spinX,
    shotSpinY: brickWallShotTuning.spinY,
    shotSpinZ: brickWallShotTuning.spinZ,
    sceneBackgroundColor: '#0c1014',
    sceneFogColor: '#10161d',
    sceneAmbientIntensity: 0,
    sceneDirectionalIntensity: 1.5,
    sceneEnvMapIntensity: 0,
    fireLightIntensity: 18,
    particleSmokeColorOverrides: [DARK_MODE_PARTICLE_COLORS.particleColor],
    particleSmokeVolumeColorOverrides: [DARK_MODE_PARTICLE_COLORS.volColor],
  },
};

export default PRESETS;
