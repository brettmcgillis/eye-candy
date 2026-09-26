import { DEFAULT_FOUNDER_PARAMS, DEFAULT_WORLD_PARAMS } from '@modules/fauna';

export const VIEW = {
  view: 'lab',
  founderIndex: 0,
  followSelected: true,
};

export const LOOK = {
  backgroundColor: '#0d0f12',
  soilColor: '#3a2e24',
  mossColor: '#5f8f3a',
  meatColor: '#7a2230',
  gridStrength: 0.35,
  invaderSkin: 'auto',
  voxelFill: 0.92,
  creatureRoughness: 1,
  heroScale: 5,
};

export const SIM = {
  paused: false,
  timeScale: 1,
};

export const SCENE_DEFAULTS = {
  ...VIEW,
  ...DEFAULT_FOUNDER_PARAMS,
  ...DEFAULT_WORLD_PARAMS,
  ...SIM,
  ...LOOK,
};
