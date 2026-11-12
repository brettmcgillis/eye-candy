import { RENDER_OPTIONS, SCENE_KEYS } from '@modules/cumulus';
import createSchemaFolders from '@modules/schemaControls';
import { PALETTE_NAMES } from '@utils/gradientPalette';
import { getRandomNumber } from '@utils/math';

const label = 'All My Thoughts Are So Cumulus';
const keysIn = (sections) =>
  SCENE_KEYS.filter((key) => sections.includes(RENDER_OPTIONS[key].section));

const haloOptions = Object.fromEntries(
  Object.entries(RENDER_OPTIONS).map(([key, spec]) => {
    if (!['halo', 'placement', 'color', 'motion'].includes(spec.section))
      return [key, spec];
    let { group } = spec;
    if (spec.section === 'placement') group = 'Placement';
    if (spec.section === 'motion') group = 'Motion';
    if (spec.section === 'color') group = null;
    if (key.startsWith('rings')) {
      group = 'Rings';
      if (
        key.endsWith('Position') ||
        key.endsWith('Rotation') ||
        key.endsWith('Scale')
      )
        group += '.Placement';
      else if (
        [
          'ringsPalette',
          'ringsPaletteExact',
          'ringsStart',
          'ringsEnd',
          'ringsSilver',
          'ringsWhite',
          'ringsBlack',
          'ringsBlue',
          'ringsLightblue',
        ].includes(key)
      )
        group += '.Colour';
    }
    group = group?.replace(
      /^(record|network|atom|plate|crtStaticRing|solarSystem)\./u,
      (_all, prefix) =>
        `${{ record: 'Record', network: 'Network', atom: 'Atom', plate: 'Plate', crtStaticRing: 'Static', solarSystem: 'Solar system' }[prefix]}.`
    );
    return [key, { ...spec, section: 'halo', group }];
  })
);

export const cumulusFolders = createSchemaFolders({
  label,
  options: haloOptions,
  keys: keysIn(['halo', 'placement', 'color', 'motion']).filter(
    (key) => !['paletteName', 'paletteExact'].includes(key)
  ),
  folders: { halo: 'Halo' },
  controls: {
    ringsPalette: { options: PALETTE_NAMES },
  },
});

export const sceneRigFolders = createSchemaFolders({
  label,
  options: {
    ...RENDER_OPTIONS,
    paletteName: { ...RENDER_OPTIONS.paletteName, section: 'painting' },
    paletteExact: { ...RENDER_OPTIONS.paletteExact, section: 'painting' },
  },
  controls: { paletteName: { options: ['None', ...PALETTE_NAMES] } },
  keys: [
    ...keysIn(['stage', 'animation', 'post', 'painting']),
    'paletteName',
    'paletteExact',
  ],
  inline: { stage: 'Scene', animation: 'Scene', post: 'Scene' },
  folders: { painting: 'Painting' },
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
