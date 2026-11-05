/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { PACKING_GRID, PACKING_STRIDE, packingFor } from '@modules/apollonian';

import { createHistoryBuffers, uploadHistory } from './history';
import createHistoryMeshes from './historyMesh';
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
export default function createApollonianRig() {
  const uniforms = createUniforms();
  let historyBuffers = null;
  let historyKey = null;
  let historyMeshes = null;
  const root = new THREE.Group();
  let buffers = createPackingBuffers(INITIAL_INDICES);
  let packingKey = null;
  const materials = new Map();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  root.add(mesh);

  function materialFor(family, surface, view, geometry = null) {
    const key =
      view === 'slice'
        ? `${family}|slice`
        : `${family}|${surface}|${geometry ?? 'field'}`;
    if (!materials.has(key)) {
      const fieldBuffers = family === 'history' ? historyBuffers : buffers;
      materials.set(
        key,
        view === 'slice'
          ? buildSliceMaterial(family, uniforms, fieldBuffers)
          : buildStageMaterial(
              family,
              surface,
              uniforms,
              fieldBuffers,
              geometry
            )
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
    mesh: root,
    uniforms,

    apply(
      config,
      { height = 1, stops = null, view = 'object', width = 1 } = {}
    ) {
      if (config.family === 'classic') uploadPacking(config);
      if (
        config.family === 'history' &&
        historyKey !== config.historyMinRadius
      ) {
        historyBuffers ??= createHistoryBuffers();
        uploadHistory(historyBuffers, config);
        historyKey = config.historyMinRadius;
      }
      uniforms.resolution.value.set(width, height);
      const layout = applyConfig(uniforms, config, {
        aspect: width / height,
        stops,
      });
      const tubes =
        config.family === 'history' && view !== 'slice' && !config.sectionCut;
      if (tubes && !historyMeshes) {
        historyMeshes = createHistoryMeshes();
        root.add(historyMeshes.group);
      }
      if (historyMeshes) historyMeshes.group.visible = tubes;
      if (tubes) {
        historyMeshes.apply(
          config,
          materialFor(config.family, config.material, view, 'tubes')
        );
      }
      mesh.material = materialFor(
        config.family,
        config.material,
        view,
        tubes ? 'backdrop' : null
      );
      return layout;
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      materials.clear();
      mesh.geometry.dispose();
      historyMeshes?.dispose();
      uniforms.paletteTexture.dispose();
    },
  };
}
