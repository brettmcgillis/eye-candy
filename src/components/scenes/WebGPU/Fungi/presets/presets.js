import { sceneDefaults } from '@modules/fungi';

const SCENE_DEFAULTS = sceneDefaults();

export const DEFAULT_PRESET = 'Field Guide';

export const PRESETS = {
  'Field Guide': {
    ...SCENE_DEFAULTS,
    seed: 'fungi',
    mycology: 0.85,
  },
  'Fly Agaric': {
    ...SCENE_DEFAULTS,
    seed: 'agaric',
    archetype: 'amanita',
    habit: 'solitary',
    mycology: 1,
  },
  'Bonnet Clump': {
    ...SCENE_DEFAULTS,
    seed: 'bonnet',
    archetype: 'mycena',
    habit: 'clump',
    members: 5,
    mycology: 0.9,
  },
  'Lattice Cap': {
    ...SCENE_DEFAULTS,
    seed: 'lattice',
    archetype: 'lattice',
    habit: 'solitary',
    mycology: 0.6,
  },
  'Split Gill': {
    ...SCENE_DEFAULTS,
    seed: 'split',
    archetype: 'fan',
    mycology: 0.9,
  },
  'Honeycomb Paddles': {
    ...SCENE_DEFAULTS,
    seed: 'favolaschia',
    archetype: 'honeycomb',
    habit: 'troop',
    members: 3,
    mycology: 0.9,
  },
  Reticulum: {
    ...SCENE_DEFAULTS,
    seed: 'reticulum',
    archetype: 'reticulum',
    mycology: 0.5,
  },
  'Veiled Stinkhorn': {
    ...SCENE_DEFAULTS,
    seed: 'phallus',
    archetype: 'stinkhorn',
    mycology: 0.95,
  },
  'Stemonitis Tuft': {
    ...SCENE_DEFAULTS,
    seed: 'chocolate',
    archetype: 'stemonitis',
    mycology: 0.95,
  },
  'Arcyria Net': {
    ...SCENE_DEFAULTS,
    seed: 'arcyria',
    archetype: 'arcyria',
    mycology: 0.9,
  },
  'Reaction Bloom': {
    ...SCENE_DEFAULTS,
    seed: 'bloom',
    archetype: 'bloom',
    mycology: 0.3,
  },
  'Lichen Terrace': {
    ...SCENE_DEFAULTS,
    seed: 'terrace',
    archetype: 'terrace',
    mycology: 0.8,
  },
  Wild: {
    ...SCENE_DEFAULTS,
    seed: 'wild',
    mycology: 0.4,
    rollGenerations: true,
  },
};

export function getPresetControls({ currentControls, presetSnapshot }) {
  return Object.fromEntries(
    Object.entries(presetSnapshot).filter(([key]) => key in currentControls)
  );
}
