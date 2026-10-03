// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { stageDefaults } from '@modules/brutalist';

export const DEFAULT_PRESET = 'Weathered Monolith';

const BASE = {
  cameraMode: 'orbit',
  ...stageDefaults('maquette'),
};

export const PRESETS = {
  'Weathered Monolith': BASE,
  'Plaster Monolith': { ...BASE, look: 'maquette' },
  'Plaster Slab': {
    ...BASE,
    look: 'maquette',
    family: 'habitable',
    layout: 'slab',
    formSeed: 31,
    pilotis: 9,
  },
  'Plaster Stack': {
    ...BASE,
    look: 'maquette',
    family: 'habitable',
    layout: 'stack',
    formSeed: 5,
  },
  'Weathered Spomenik': {
    ...BASE,
    family: 'spomenik',
    motif: 'ring',
    formSeed: 12,
  },
  'Plaster Split Stone': {
    ...BASE,
    look: 'maquette',
    family: 'spomenik',
    motif: 'split',
    formSeed: 40,
  },
};

// Generations saved from BrutalistCLI: only what differs from BASE.
const SNAPSHOTS = {};

Object.entries(SNAPSHOTS).forEach(([name, snapshot]) => {
  PRESETS[name] = { ...BASE, ...snapshot };
});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
