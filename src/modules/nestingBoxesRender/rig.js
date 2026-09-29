import * as THREE from 'three/webgpu';

import { ZERO_DRIFT, getDrawLevel } from '@modules/nestingBoxes';
import {
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '@utils/gradientPalette';

import {
  applyColorConfig,
  applySurfaceConfig,
  applyTreeConfig,
  applyWindowConfig,
} from './applyConfig';
import { buildBoxMaterial, createBoxUniforms } from './boxMaterial';
import { MAP_SLOTS, createNeutralMaps } from './surfaces';
import createTreeCompute from './treeCompute';

// The tree as one imperative object, drawn by both the scene and the
// headless CLIs: one compute kernel lays every node out, one instanced box
// draws the level growth has reached.
export default function createBoxRig() {
  const tree = createTreeCompute();
  const uniforms = createBoxUniforms();
  const neutralMaps = createNeutralMaps();
  const neutralPalette = createNeutralPaletteTexture();
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const box = buildBoxMaterial({
    maps: neutralMaps,
    paletteTexture: neutralPalette,
    tree,
    uniforms,
  });
  const mesh = new THREE.Mesh(geometry, box.material);
  let palette = null;
  let paletteKey = null;
  let levels = tree.uniforms.levels.value;

  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    mesh,
    tree,
    uniforms,

    // `maps` is slot → texture; a slot the surface lacks reads neutral.
    setSurfaceMaps(maps = {}) {
      box.setMaps(
        Object.fromEntries(
          MAP_SLOTS.map((slot) => [slot, maps[slot] ?? neutralMaps[slot]])
        )
      );
    },

    setPalette(name, exact) {
      const key = `${name}|${exact}`;
      if (key === paletteKey) return;
      const next = createPaletteTexture(name, { exact });
      box.setPalette(next ?? neutralPalette);
      palette?.dispose();
      palette = next;
      paletteKey = key;
    },

    apply(config, { drift = ZERO_DRIFT, progress = config.levels } = {}) {
      const drawLevel = getDrawLevel(progress, config.levels);
      applyTreeConfig(tree.uniforms, config, drift);
      uniforms.progress.value = progress;
      uniforms.drawLevel.value = drawLevel;
      mesh.count = 2 ** drawLevel;
      applyColorConfig(uniforms.color, config, drift);
      applySurfaceConfig(uniforms.surface, config);
      applyWindowConfig(uniforms.windows, config);
      levels = config.levels;
    },

    compute(renderer) {
      tree.run(renderer, levels);
    },

    dispose() {
      geometry.dispose();
      box.material.dispose();
      tree.kernel.dispose();
      palette?.dispose();
      neutralPalette.dispose();
      Object.values(neutralMaps).forEach((texture) => texture.dispose());
    },
  };
}
