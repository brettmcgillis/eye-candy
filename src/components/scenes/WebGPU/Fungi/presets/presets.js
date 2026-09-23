import { sceneDefaults } from '@modules/fungi';

const SCENE_DEFAULTS = sceneDefaults();

export const DEFAULT_PRESET = 'Field Guide';

const SNAPSHOTS = {
  'Field Guide': {
    seed: 'fungi',
    mycology: 0.85,
  },
  'Fly Agaric': {
    seed: 'agaric',
    archetype: 'amanita',
    habit: 'solitary',
    mycology: 1,
  },
  'Bonnet Clump': {
    seed: 'bonnet',
    archetype: 'mycena',
    habit: 'clump',
    members: 5,
    mycology: 0.9,
  },
  'Lattice Cap': {
    seed: 'lattice',
    archetype: 'lattice',
    habit: 'solitary',
    mycology: 0.6,
  },
  'Split Gill': {
    seed: 'split',
    archetype: 'fan',
    mycology: 0.9,
  },
  'Honeycomb Paddles': {
    seed: 'favolaschia',
    archetype: 'honeycomb',
    habit: 'troop',
    members: 3,
    mycology: 0.9,
  },
  Reticulum: {
    seed: 'reticulum',
    archetype: 'reticulum',
    mycology: 0.5,
  },
  'Veiled Stinkhorn': {
    seed: 'phallus',
    archetype: 'stinkhorn',
    mycology: 0.95,
  },
  'Stemonitis Tuft': {
    seed: 'chocolate',
    archetype: 'stemonitis',
    mycology: 0.95,
  },
  'Arcyria Net': {
    seed: 'arcyria',
    archetype: 'arcyria',
    mycology: 0.9,
  },
  'Reaction Bloom': {
    seed: 'bloom',
    archetype: 'bloom',
    mycology: 0.3,
  },
  'Lichen Terrace': {
    seed: 'terrace',
    archetype: 'terrace',
    mycology: 0.8,
  },
  Wild: {
    seed: 'wild',
    mycology: 0.4,
    rollGenerations: true,
  },
};

export const PRESETS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([name, snapshot]) => [
    name,
    { ...SCENE_DEFAULTS, ...snapshot },
  ])
);

export function getPresetControls({ currentControls, presetSnapshot }) {
  return Object.fromEntries(
    Object.entries(presetSnapshot).filter(([key]) => key in currentControls)
  );
}
