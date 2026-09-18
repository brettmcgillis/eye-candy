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
    size: 2.6,
  },
  'Inkcap Clump': {
    seed: 'inkcap',
    archetype: 'inkcap',
    habit: 'clump',
    members: 5,
    mycology: 0.95,
  },
  'Bonnet Glow': {
    seed: 'bonnet',
    archetype: 'mycena',
    habit: 'clump',
    members: 6,
    mycology: 0.7,
    glow: 0.8,
  },
  'Shelf Rosette': {
    seed: 'shelf',
    archetype: 'bracket',
    mycology: 0.9,
  },
  Hybrid: {
    seed: 'hybrid',
    mycology: 0.35,
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
