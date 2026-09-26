import { SCENE_DEFAULTS } from './defaults';

export const DEFAULT_PRESET = 'Petri';

const SNAPSHOTS = {
  Petri: {},
  Invasion: {
    founderSeed: 'invasion',
    planInvader: 1,
    planBlob: 0,
    planSwimmer: 0,
    bitDensity: 0.55,
    tentacleChance: 0.1,
    carnivoreChance: 0.35,
    invaderSkin: 'voxel',
  },
  Ooze: {
    founderSeed: 'ooze',
    planInvader: 0.3,
    planBlob: 1,
    planSwimmer: 0,
    tentacleChance: 0.2,
    mossColor: '#7a9a2e',
    soilColor: '#2c2a22',
    invaderSkin: 'smooth',
  },
  Reef: {
    founderSeed: 'reef',
    planInvader: 0,
    planBlob: 0.4,
    planSwimmer: 1,
    tentacleChance: 0.6,
    backgroundColor: '#07121a',
    soilColor: '#1f3a44',
    mossColor: '#3fa88e',
    meatColor: '#a0503a',
  },
  Crucible: {
    founderSeed: 'crucible',
    founderCount: 8,
    carnivoreChance: 0.5,
    compatibility: 0.5,
    mutationScale: 2.2,
    foodGrowth: 0.06,
  },
  Mobile: {
    founderCount: 4,
    founderCopies: 3,
    populationCap: 140,
    worldSize: 36,
    heroScale: 4,
  },
};

export const PRESETS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([name, snapshot]) => [
    name,
    { ...SCENE_DEFAULTS, ...snapshot },
  ])
);

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
