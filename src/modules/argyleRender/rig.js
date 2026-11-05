import * as THREE from 'three/webgpu';

import { STRIDE, createField } from '@modules/argyle';

import createInstances from './instances';

export default function createRig() {
  const group = new THREE.Group();
  const layers = Array.from({ length: 4 }, createInstances);
  group.add(...layers.map((layer) => layer.mesh));
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let field = null;
  let order = new Uint32Array();
  let vx = 0;
  let vy = 0;
  let vz = 1;
  const compare = (a, b) => {
    const { data } = field;
    const x = a * STRIDE;
    const y = b * STRIDE;
    return (
      (data[x] - data[y]) * vx +
      (data[x + 1] - data[y + 1]) * vy +
      (data[x + 2] - data[y + 2]) * vz
    );
  };
  function update(seconds, camera) {
    if (!field) return;
    const data = field.update(seconds);
    if (camera) {
      const e = camera.matrixWorldInverse.elements;
      [, , vx, , , , vy, , , , vz] = e;
      order.sort(compare);
      for (let k = 0; k < layers.length; k += 1)
        layers[k].mesh.renderOrder =
          Math.floor(k / 2) === Number(vz < 0) ? 0 : 1;
    }
    for (let k = 0; k < layers.length; k += 1) layers[k].mesh.count = 0;
    for (let i = 0; i < field.tiles.length; i += 1) {
      const index = order[i];
      const tile = field.tiles[index];
      const layer = layers[tile.layer * 2 + Number(tile.hollow)];
      const { mesh, alpha } = layer;
      const slot = mesh.count;
      mesh.count += 1;
      const k = index * STRIDE;
      dummy.position.set(data[k], data[k + 1], data[k + 2]);
      dummy.rotation.set(data[k + 5], 0, data[k + 6], 'ZYX');
      dummy.scale.set(data[k + 3], data[k + 3], data[k + 4]);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot, dummy.matrix);
      tint.setRGB(data[k + 8], data[k + 9], data[k + 10]);
      mesh.setColorAt(slot, tint);
      alpha.array[slot] = data[k + 7];
    }
    layers.forEach((layer) => layer.flush());
  }
  return {
    group,
    update,
    get field() {
      return field;
    },
    apply(config) {
      field = createField(config);
      order = Uint32Array.from({ length: field.tiles.length }, (_, i) => i);
      layers.forEach((layer, index) => layer.apply(config, index % 2 === 1));
      update(0);
      return field.bounds;
    },
    dispose() {
      layers.forEach((layer) => layer.dispose());
    },
  };
}
