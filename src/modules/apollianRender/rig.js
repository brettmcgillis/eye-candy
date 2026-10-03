/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { PACKING_GRID, PACKING_STRIDE, packingFor } from '@modules/apollian';

import buildSliceMaterial from './sliceView';
import buildStageMaterial from './stage';
import { applyConfig, createUniforms } from './uniforms';

const MAX_SPHERES = 8000;
const INITIAL_INDICES = 2 ** 18;

function createPackingBuffers(indexCapacity) {
  return {
    generations: new THREE.StorageBufferAttribute(
      new Float32Array(MAX_SPHERES),
      1
    ),
    indices: new THREE.StorageBufferAttribute(
      new Uint32Array(indexCapacity),
      1
    ),
    spheres: new THREE.StorageBufferAttribute(
      new Float32Array(MAX_SPHERES * 4),
      4
    ),
    starts: new THREE.StorageBufferAttribute(
      new Uint32Array(PACKING_GRID ** 3 + 1),
      1
    ),
  };
}

// The whole frame as one imperative object, drawn by the scene and the
// headless CLIs alike: `apply(config, { stops, width, height })` sets every
// uniform and picks the family's material, `view` switches between the
// object on its plinth and the 2D slice.
export default function createApollianRig() {
  const uniforms = createUniforms();
  let buffers = createPackingBuffers(INITIAL_INDICES);
  let packingKey = null;
  const materials = new Map();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  function materialFor(family, surface, view) {
    const key = view === 'slice' ? `${family}|slice` : `${family}|${surface}`;
    if (!materials.has(key)) {
      materials.set(
        key,
        view === 'slice'
          ? buildSliceMaterial(family, uniforms, buffers)
          : buildStageMaterial(family, surface, uniforms, buffers)
      );
    }
    return materials.get(key);
  }

  function uploadPacking(config) {
    const { grid, spheres } = packingFor(config);
    const key = [spheres.length, spheres[0], spheres[spheres.length - 2]].join(
      '|'
    );
    if (key === packingKey) return;
    packingKey = key;
    if (grid.indices.length > buffers.indices.count) {
      let capacity = buffers.indices.count;
      while (capacity < grid.indices.length) capacity *= 2;
      buffers = createPackingBuffers(capacity);
      [...materials.keys()]
        .filter((name) => name.startsWith('classic|'))
        .forEach((name) => {
          materials.get(name).dispose();
          materials.delete(name);
        });
    }
    const count = Math.min(spheres.length / PACKING_STRIDE, MAX_SPHERES);
    const xyzr = buffers.spheres.array;
    const gens = buffers.generations.array;
    for (let i = 0; i < count; i += 1) {
      const o = i * PACKING_STRIDE;
      xyzr.set(spheres.subarray(o, o + 4), i * 4);
      gens[i] = spheres[o + 4];
    }
    buffers.starts.array.set(grid.starts);
    buffers.indices.array.set(grid.indices);
    Object.values(buffers).forEach((attribute) => {
      attribute.needsUpdate = true;
    });
  }

  return {
    mesh,
    uniforms,

    apply(
      config,
      { height = 1, stops = null, view = 'object', width = 1 } = {}
    ) {
      if (config.family === 'classic') uploadPacking(config);
      uniforms.resolution.value.set(width, height);
      const layout = applyConfig(uniforms, config, {
        aspect: width / height,
        stops,
      });
      mesh.material = materialFor(config.family, config.material, view);
      return layout;
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      materials.clear();
      mesh.geometry.dispose();
      uniforms.paletteTexture.dispose();
    },
  };
}
