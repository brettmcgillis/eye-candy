import { MOUNTAIN_TARGET, OCEAN_TARGET } from '../utils/targetGeometry';

export const SCENE_LABEL = 'Water Cycle';

export const CAMERA_PATH = `${SCENE_LABEL}.Camera`;
export const MOUNTAIN_PATH = `${SCENE_LABEL}.Mountain`;
export const OCEAN_PATH = `${SCENE_LABEL}.Ocean`;
export const TARGET_PATH = `${SCENE_LABEL}.Target`;

export const OCEAN_MODES = ['Hidden', 'Foam Only', 'Full'];

export const isOceanTarget = (get) =>
  get(`${TARGET_PATH}.targetMode`) === OCEAN_TARGET;
export const isMountainTarget = (get) =>
  get(`${TARGET_PATH}.targetMode`) === MOUNTAIN_TARGET;

// Only the baked-geometry targets go through the spin/tilt/probe-area machinery;
// the ocean and the mountain both answer the probe from a field instead.
export const isMeshTarget = (get) =>
  !isOceanTarget(get) && !isMountainTarget(get);
export const isMountainVisible = (get) =>
  isMountainTarget(get) &&
  get(`${MOUNTAIN_PATH}.mountainDisplayMode`) !== 'Hidden';
export const isRangeShape = (get) =>
  isMountainTarget(get) && get(`${MOUNTAIN_PATH}.mountainShape`) === 'Range';
export const isPeakShape = (get) =>
  isMountainTarget(get) && get(`${MOUNTAIN_PATH}.mountainShape`) !== 'Range';
export const isSurfaceVisible = (get) =>
  isOceanTarget(get) && get(`${OCEAN_PATH}.oceanDisplayMode`) !== 'Hidden';
export const isFullyShaded = (get) =>
  isOceanTarget(get) && get(`${OCEAN_PATH}.oceanDisplayMode`) === 'Full';
export const isCustomPalette = (get) =>
  isFullyShaded(get) && get(`${OCEAN_PATH}.oceanPaletteMode`) === 'Custom';
