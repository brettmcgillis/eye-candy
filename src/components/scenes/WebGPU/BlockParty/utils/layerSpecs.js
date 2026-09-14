import {
  createCardMaterial,
  createNeonMaterial,
  createTowerMaterial,
} from './materials';
import {
  createGlowPitMaterial,
  createGlowTerraceMaterial,
  createPitMaterial,
  createStepMaterial,
  createTaperWallMaterial,
  createTerraceMaterial,
  createWellMaterial,
} from './openingMaterials';

// Shafts hang below their anchor; everything else stands on it.
const LAYER_SPECS = [
  { factory: createPitMaterial, key: 'pits', hangs: true },
  { factory: createGlowPitMaterial, key: 'glowPits', hangs: true },
  { factory: createTerraceMaterial, key: 'terraces' },
  { factory: createGlowTerraceMaterial, key: 'glowTerraces' },
  { factory: createWellMaterial, key: 'wells', hangs: true },
  { factory: createStepMaterial, key: 'steps' },
  { factory: createTaperWallMaterial, key: 'taperWalls' },
  {
    castShadow: true,
    factory: createCardMaterial,
    key: 'plazas',
    receiveShadow: true,
  },
  { factory: createNeonMaterial, key: 'neon' },
  { factory: createTowerMaterial, key: 'towers', tower: true },
];

export default LAYER_SPECS;
