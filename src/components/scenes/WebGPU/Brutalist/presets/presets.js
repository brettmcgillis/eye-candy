// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { MOODS, stageDefaults } from '@modules/brutalist';

export const DEFAULT_PRESET = 'Overcast Monolith';

const BASE = {
  cameraMode: 'orbit',
  ...stageDefaults('forest'),
};

export const PRESETS = {
  'Overcast Monolith': { ...BASE, ...MOODS.overcast },
  'Dusk Slab': {
    ...BASE,
    ...MOODS.dusk,
    family: 'habitable',
    layout: 'slab',
    formSeed: 31,
    pilotis: 9,
    biome: 'mixed',
    encroach: 0.45,
    litWindows: 1,
  },
  'Night Window': {
    ...BASE,
    ...MOODS.night,
    formSeed: 118,
    structureHeight: 140,
    openings: 0.15,
    litWindows: 1,
    litIntensity: 14,
    biome: 'bare',
  },
  'Golden Spomenik': {
    ...BASE,
    ...MOODS.golden,
    family: 'spomenik',
    motif: 'fan',
    formSeed: 12,
    biome: 'deciduous',
    lightSunAzimuth: -60,
  },
  'Buried Stack': {
    ...BASE,
    ...MOODS.overcast,
    family: 'habitable',
    layout: 'stack',
    formSeed: 5,
    burial: 0.35,
    burialAngle: 140,
    encroach: 0.7,
    moss: 0.8,
    mossClimb: 20,
  },
  'Pierced Hill': {
    ...BASE,
    ...MOODS.overcast,
    family: 'spomenik',
    motif: 'pierced',
    formSeed: 77,
    burial: 0.3,
    burialAngle: 250,
    biome: 'conifer',
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
