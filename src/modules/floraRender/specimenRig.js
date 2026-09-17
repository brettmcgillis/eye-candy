import * as THREE from 'three/webgpu';

import createFieldSlots from './fieldSlots';
import { createCardMaterial, createSolidMaterial } from './ornamentMaterials';
import {
  applyPalette,
  createPaletteCache,
  resolvePaletteName,
} from './paletteMap';
import createTubeMaterial from './tubeMaterial';
import { createUniforms, syncSpecimen, syncUniforms } from './uniforms';

// One flower as plain three objects: the scene's Specimen component, built
// imperatively for renderers that have no React (the headless CLI). Each rig
// owns its uniforms, so a bouquet can hold flowers with different looks.
export default function createSpecimenRig() {
  const uniforms = createUniforms();
  const palettes = createPaletteCache();
  const fields = createFieldSlots();
  const group = new THREE.Group();
  const { slots } = fields;
  const pairs = [
    [slots.tube, createTubeMaterial],
    [slots.cards, createCardMaterial],
    ...slots.solids.map((slot) => [slot, createSolidMaterial]),
  ];
  const materials = pairs.map(([slot, createMaterial]) => {
    const material = createMaterial(uniforms);
    const mesh = new THREE.Mesh(slot.geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    slot.attach(mesh);
    group.add(mesh);

    return material;
  });
  let palette = null;
  let config = {};

  function applyLook() {
    syncUniforms(uniforms, config, palette);
    applyPalette(
      uniforms,
      palettes,
      resolvePaletteName(config, palette),
      config.paletteExact
    );
  }

  return {
    group,
    uniforms,

    load(specimen) {
      fields.loadSpecimen(specimen);
      syncSpecimen(uniforms, specimen);
      palette = specimen.palette;
      applyLook();
    },

    setConfig(next) {
      config = next;
      applyLook();
    },

    setLevels({ bloom = 1, exit = 0, growth = 1 }) {
      uniforms.growth.value = growth;
      uniforms.bloom.value = bloom;
      uniforms.exit.value = exit;
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      fields.dispose();
      palettes.dispose();
      group.removeFromParent();
    },
  };
}
