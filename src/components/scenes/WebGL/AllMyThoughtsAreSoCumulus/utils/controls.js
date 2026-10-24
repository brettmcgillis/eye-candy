import { RENDER_OPTIONS, SCENE_KEYS } from '@modules/cumulus';
import createSchemaFolders from '@modules/schemaControls';
import { PALETTE_NAMES } from '@utils/gradientPalette';
import { getRandomNumber } from '@utils/math';

const label = 'All My Thoughts Are So Cumulus';
const keysIn = (sections) =>
  SCENE_KEYS.filter((key) => sections.includes(RENDER_OPTIONS[key].section));

export const cumulusFolders = createSchemaFolders({
  label,
  options: RENDER_OPTIONS,
  keys: keysIn(['halo', 'placement', 'color', 'motion']),
  folders: {
    halo: 'Halo',
    placement: 'Halo placement',
    color: 'Halo palette',
    motion: 'Halo motion',
  },
  controls: {
    paletteName: { options: PALETTE_NAMES },
    ringsPalette: { options: PALETTE_NAMES },
  },
});

export const sceneRigFolders = createSchemaFolders({
  label,
  options: RENDER_OPTIONS,
  keys: keysIn(['stage', 'animation', 'post']),
  inline: { stage: 'Scene', animation: 'Scene', post: 'Scene' },
});

export const anatomyFolders = createSchemaFolders({
  label,
  options: RENDER_OPTIONS,
  keys: keysIn(['cloud', 'skull', 'femur', 'censor']),
  folders: {
    cloud: 'Cloud',
    skull: 'Skull',
    femur: 'Femur',
    censor: 'Censor Panel',
  },
  controls: { cloudSeed: { value: getRandomNumber(1, 100) } },
});
