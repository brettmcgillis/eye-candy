import { buildSceneCameraControlValues } from '../../../../../../hooks/sceneCameraUtils';
import {
  BACKGROUND,
  CAMERA,
  DEFAULT_SHOT_TUNING_MODE,
  FOG_RANGE,
  GRID,
  GROUND,
  SHOT_TUNING_PRESETS,
} from '../utils/sceneData';

export const DEFAULT_PRESET = 'Default';

export const DEFAULT_FIRE_LIGHT_RIG = Object.freeze({
  enabled: true,
  color: '#ff7a1f',
  intensity: 12,
  intensityJitter: 3.75,
  secondaryJitter: 1.25,
  distance: 2,
  decay: 1.4,
  flickerSpeed: 7,
  swayX: 0.08,
  swayY: 0.05,
  swayZ: 0.08,
  leftX: 0.15,
  leftY: 0.45,
  leftZ: 0,
  rightX: 1.15,
  rightY: 0.45,
  rightZ: 0,
});

const DEFAULT_SCENE_ENVIRONMENT = Object.freeze({
  sceneBackgroundColor: BACKGROUND,
  sceneFloorColor: GROUND.color,
  sceneGridColor: GRID.args[3],
  sceneFogColor: BACKGROUND,
  sceneFogNear: FOG_RANGE[0],
  sceneFogFar: FOG_RANGE[1],
});

const DEFAULT_CAMERA_CONTROLS = Object.freeze(
  buildSceneCameraControlValues(CAMERA)
);

const DEFAULT_COMBUSTION_CONTROLS = Object.freeze({
  showEffects: true,
  editSplines: false,
  cursorAttractorEnabled: true,
  showCursorAttractor: false,
  cursorAttractorMode: 'attractor',
  cursorAttractorStrength: 3,
  cursorAttractorRadius: 3,
});

const DEFAULT_PHYSICS_CONTROLS = Object.freeze({
  physicsDebug: false,
});

const defaultShotTuning =
  SHOT_TUNING_PRESETS[DEFAULT_SHOT_TUNING_MODE] ||
  SHOT_TUNING_PRESETS.Realistic;

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

const DEFAULT_CONTROL_VALUES = Object.freeze({
  ...DEFAULT_SCENE_ENVIRONMENT,
  ...DEFAULT_CAMERA_CONTROLS,
  ...DEFAULT_PHYSICS_CONTROLS,
  ...DEFAULT_TRASH_BLASTER_CONTROLS,
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
  'Dark Mode': {
    ...DEFAULT_PRESET_SNAPSHOT,
    sceneBackgroundColor: '#0c1014',
    sceneFloorColor: '#1a2027',
    sceneGridColor: '#323a43',
    sceneFogColor: '#10161d',
    particleSmokeColorOverrides: [DARK_MODE_PARTICLE_COLORS.particleColor],
    particleSmokeVolumeColorOverrides: [DARK_MODE_PARTICLE_COLORS.volColor],
  },
};

export default PRESETS;
