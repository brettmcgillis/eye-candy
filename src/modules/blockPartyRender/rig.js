/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import createGroundGeometry from './ground';
import {
  attachLayerBuffers,
  createInstanceMatrix,
  createLayerBuffers,
  writeLayer,
} from './layerBuffers';
import LAYER_SPECS from './layerSpecs';
import { createGroundMaterial, createPedestalMaterial } from './materials';
import createPedestalGeometry from './pedestal';

const MIN_CAPACITY = 64;

function unitBox(hangs) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  geometry.translate(0, hangs ? -0.5 : 0.5, 0);

  return geometry;
}

function nextCapacity(current, needed) {
  let capacity = Math.max(current, MIN_CAPACITY);

  while (capacity < needed) {
    capacity *= 2;
  }

  return capacity;
}

// The city as one imperative object, drawn by both the scene and the headless
// CLIs. Layers only grow: headroom lets a rolling rebuild that lands more
// cells than the first bake reuse the same buffers.
export default function createCityRig({ uniforms }) {
  const group = new THREE.Group();
  const materials = {
    ground: createGroundMaterial({ uniforms }),
    pedestal: createPedestalMaterial({ uniforms }),
  };
  const pedestal = new THREE.Mesh(
    new THREE.BufferGeometry(),
    materials.pedestal
  );
  const ground = new THREE.Mesh(new THREE.BufferGeometry(), materials.ground);
  const state = { towerBlend: 'ink', towerShadows: true };
  const layers = LAYER_SPECS.map((spec) => ({
    buffers: null,
    capacity: 0,
    geometry: unitBox(spec.hangs),
    material: null,
    mesh: null,
    spec,
  }));

  pedestal.receiveShadow = true;
  ground.receiveShadow = true;
  group.add(pedestal, ground);

  function castsShadow(layer) {
    return layer.spec.tower
      ? state.towerShadows
      : Boolean(layer.spec.castShadow);
  }

  function buildMaterial(layer) {
    layer.material?.dispose();
    layer.material = layer.spec.factory({
      blend: state.towerBlend,
      buffers: layer.buffers,
      uniforms,
    });
    if (layer.mesh) layer.mesh.material = layer.material;
  }

  function ensureCapacity(layer, needed) {
    const capacity = nextCapacity(layer.capacity, Math.ceil(needed * 1.5));

    if (layer.mesh && capacity === layer.capacity) return;

    if (layer.mesh) group.remove(layer.mesh);
    layer.capacity = capacity;
    layer.buffers = createLayerBuffers(capacity);
    attachLayerBuffers(layer.geometry, layer.buffers);
    layer.mesh = null;
    buildMaterial(layer);
    layer.mesh = new THREE.InstancedMesh(
      layer.geometry,
      layer.material,
      capacity
    );
    layer.mesh.instanceMatrix = createInstanceMatrix(capacity);
    layer.mesh.frustumCulled = false;
    layer.mesh.castShadow = castsShadow(layer);
    layer.mesh.receiveShadow = Boolean(layer.spec.receiveShadow);
    group.add(layer.mesh);
  }

  function replaceGeometry(mesh, geometry) {
    mesh.geometry.dispose();
    mesh.geometry = geometry;
  }

  return {
    group,

    setLayers(instancesByKey) {
      layers.forEach((layer) => {
        const instances = instancesByKey[layer.spec.key] ?? [];
        ensureCapacity(layer, instances.length);
        writeLayer(layer.mesh, layer.buffers, instances);
      });
    },

    setGround({ cells, radius, shape }) {
      replaceGeometry(ground, createGroundGeometry({ cells, radius, shape }));
    },

    setPedestal({ depth, radius, shape }) {
      replaceGeometry(
        pedestal,
        createPedestalGeometry({ depth, radius, shape })
      );
    },

    setScale(scale) {
      group.scale.setScalar(scale);
      uniforms.worldPerPixel.value = scale;
    },

    setTowerBlend(blend) {
      if (blend === state.towerBlend) return;
      state.towerBlend = blend;
      layers
        .filter((layer) => layer.spec.tower && layer.buffers)
        .forEach(buildMaterial);
    },

    setTowerShadows(enabled) {
      state.towerShadows = enabled;
      layers
        .filter((layer) => layer.spec.tower && layer.mesh)
        .forEach((layer) => {
          layer.mesh.castShadow = enabled;
        });
    },

    dispose() {
      layers.forEach((layer) => {
        layer.material?.dispose();
        layer.geometry.dispose();
      });
      [ground, pedestal].forEach((mesh) => mesh.geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      uniforms.paletteTexture.dispose();
    },
  };
}
