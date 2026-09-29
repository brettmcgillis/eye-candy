import { LAYERS } from '@modules/blockParty';

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

const MATERIALS = {
  glowPits: { factory: createGlowPitMaterial },
  glowTerraces: { factory: createGlowTerraceMaterial },
  neon: { factory: createNeonMaterial },
  pits: { factory: createPitMaterial },
  plazas: {
    castShadow: true,
    factory: createCardMaterial,
    receiveShadow: true,
  },
  steps: { factory: createStepMaterial },
  taperWalls: { factory: createTaperWallMaterial },
  terraces: { factory: createTerraceMaterial },
  towers: { factory: createTowerMaterial, tower: true },
  wells: { factory: createWellMaterial },
};

const LAYER_SPECS = LAYERS.map((layer) => ({
  ...layer,
  ...MATERIALS[layer.key],
}));

export default LAYER_SPECS;
