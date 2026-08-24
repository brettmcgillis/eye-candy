import { OCEAN_TARGET } from '../utils/targetGeometry';

export const SCENE_LABEL = 'Water Cycle';

export const CAMERA_PATH = `${SCENE_LABEL}.Camera`;
export const OCEAN_PATH = `${SCENE_LABEL}.Ocean`;
export const TARGET_PATH = `${SCENE_LABEL}.Target`;

export const OCEAN_MODES = ['Hidden', 'Foam Only', 'Full'];

export const isOceanTarget = (get) =>
  get(`${TARGET_PATH}.targetMode`) === OCEAN_TARGET;
export const isMeshTarget = (get) => !isOceanTarget(get);
export const isSurfaceVisible = (get) =>
  isOceanTarget(get) && get(`${OCEAN_PATH}.oceanDisplayMode`) !== 'Hidden';
export const isFullyShaded = (get) =>
  isOceanTarget(get) && get(`${OCEAN_PATH}.oceanDisplayMode`) === 'Full';
export const isCustomPalette = (get) =>
  isFullyShaded(get) && get(`${OCEAN_PATH}.oceanPaletteMode`) === 'Custom';
